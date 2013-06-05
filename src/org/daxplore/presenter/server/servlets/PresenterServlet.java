/*
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.server.servlets;

import java.io.IOException;
import java.io.Writer;
import java.text.MessageFormat;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.ServerPrefixProperties;
import org.daxplore.presenter.server.ServerTools;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.SettingItemStore;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.storage.StaticFileItemStore;
import org.daxplore.presenter.server.storage.StorageTools;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.presenter.shared.EmbedDefinition;
import org.daxplore.presenter.shared.EmbedDefinition.EmbedFlag;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.daxplore.shared.SharedResourceTools;

@SuppressWarnings("serial")
public class PresenterServlet extends HttpServlet {
	private static Logger logger = Logger.getLogger(PresenterServlet.class.getName());
	private static String presenterHtmlTemplate = null;
	private static String browserSuggestionTemplate = null;
	private static String printHtmlTemplate = null;
	private static String embedHtmlTemplate = null;
	
	private HashMap<String, QuestionMetadata> metadataMap = new HashMap<String, QuestionMetadata>(); 
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = null;
		try {
			// Get input from URL
			//TODO use better and more stable parsing
			String prefix = request.getPathInfo();
			if (prefix!=null && !prefix.isEmpty()) {
				if(prefix.charAt(0)=='/') {
					prefix = prefix.substring(1);
				}
				if(!prefix.isEmpty() && prefix.charAt(prefix.length()-1)=='/'){
					prefix = prefix.substring(0, prefix.length()-2);
				}
			}
			String useragent = request.getHeader("user-agent");
			Cookie[] cookies = request.getCookies();
			String feature = request.getParameter("f");
			String baseurl = request.getRequestURL().toString();
			baseurl = baseurl.substring(0, baseurl.lastIndexOf("/"));
			baseurl = baseurl.substring(0, baseurl.lastIndexOf("/")+1);
			
			// Clean user input
			if(prefix==null || !SharedResourceTools.isSyntacticallyValidPrefix(prefix)) {
				throw new BadReqException("Someone tried to access a syntactically invalid prefix: '" + prefix + "'");
			}
			
			boolean browserSupported = true;
			double ieversion = ServerTools.getInternetExplorerVersion(useragent);
			if(useragent == null | (ieversion > 0.0 & ieversion < 8.0)) {
				browserSupported = false;
			}
			
			boolean ignoreBadBrowser = false;
			if(cookies != null) {
				ignoreBadBrowser = ServerTools.ignoreBadBrowser(cookies);
			}
			browserSupported |= ignoreBadBrowser;
			
			ServerPrefixProperties prefixProperties = new ServerPrefixProperties(prefix);
			
			String responseHTML = "";
			if (!browserSupported) {
				responseHTML = getUnsupportedBrowserHTML(baseurl);
			} else {
				Locale locale = ServerTools.selectLocale(request, prefix);
				pm = PMF.get().getPersistenceManager();
				
				if (feature!=null && feature.equalsIgnoreCase("embed")) { // embedded chart
					
					// TODO clean query string
					String queryString = request.getParameter("q");
					responseHTML = getEmbedHTML(pm, prefix, locale, queryString, baseurl, prefixProperties);
					
				} else if (feature!=null && feature.equalsIgnoreCase("print")) { // printer-friendly chart
					
					String serverPath = request.getRequestURL().toString();
					// remove last slash
					if (serverPath.charAt(serverPath.length() - 1) == '/') {
						serverPath = serverPath.substring(0, serverPath.length() - 1);
					}
					// remove module name
					serverPath = serverPath.substring(0, serverPath.lastIndexOf("/"));
					
					// TODO clean query string
					String queryString = request.getParameter("q");
					responseHTML = getPrintHTML(pm, prefix, locale, serverPath, queryString, baseurl);
					
				} else { // standard presenter
					
					responseHTML = getPresenterHTML(pm, prefix, locale, baseurl, prefixProperties);
					
				}
			}
			
			response.setContentType("text/html; charset=UTF-8");
			try {
				Writer writer = response.getWriter();
				writer.write(responseHTML);
				writer.close();
			} catch (IOException e) {
				throw new InternalServerException("Failed to display presenter servlet", e);
			}
		} catch (BadReqException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} catch (InternalServerException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			if (pm != null) {
				pm.close();
			}
		}
	}
	
	private String getUnsupportedBrowserHTML(String baseurl) throws InternalServerException {
		if (browserSuggestionTemplate == null) {
			try {
				browserSuggestionTemplate = IOUtils.toString(getServletContext().getResourceAsStream("/templates/browser-suggestion.html"));
			} catch (IOException e) {
				throw new InternalServerException("Failed to load the html browser suggestion template", e);
			}
		}
		
		String[] arguments = {
			baseurl					// {0}
		};
		
		return MessageFormat.format(browserSuggestionTemplate, (Object[])arguments);
	}
	
	private String getPresenterHTML(PersistenceManager pm, String prefix, Locale locale, String baseurl, ServerPrefixProperties properties)
			throws InternalServerException, BadReqException {
		
		// TODO Add caching for loaded files
		String perspectives = "", groups = "", questions = "";
		perspectives = StaticFileItemStore.readStaticFile(pm, prefix, "meta/perspectives", locale, ".json");
		questions = StaticFileItemStore.readStaticFile(pm, prefix, "meta/questions", locale, ".json");
		groups = StaticFileItemStore.readStaticFile(pm, prefix, "meta/groups", locale, ".json");
		String prefixProperties = properties.toJson().toJSONString();
		
		String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "properties/usertexts", locale, "page_title");
		
		String[] arguments = {
			locale.toLanguageTag(), // {0}
			baseurl,				// {1}
			pageTitle,				// {2}
			perspectives,			// {3}
			questions,				// {4}
			groups,					// {5}
			prefixProperties		// {6}
		};
		
		if (presenterHtmlTemplate == null) {
			try {
				presenterHtmlTemplate = IOUtils.toString(getServletContext().getResourceAsStream("/templates/presentation.html"));
			} catch (IOException e) {
				throw new InternalServerException("Failed to load the embed html template", e);
			}
		}
		
		return MessageFormat.format(presenterHtmlTemplate, (Object[])arguments);
	}
	
	private String getEmbedHTML(PersistenceManager pm, String prefix, Locale locale,
			String queryString, String baseurl, ServerPrefixProperties properties) throws BadReqException, InternalServerException {
		
		QueryDefinition queryDefinition = new QueryDefinition(metadataMap.get(prefix), queryString);
		String statItem = StatDataItemStore.getStats(pm, prefix, queryDefinition);

		LinkedList<String> questions = new LinkedList<String>();
		questions.add(queryDefinition.getQuestionID());
		questions.add(queryDefinition.getPerspectiveID());
		
		String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "properties/usertexts", locale, "page_title");
		
		String questionString = StorageTools.getQuestionDefinitions(pm, prefix, questions, locale);
		
		String prefixProperties = properties.toJson().toJSONString();
		
		String[] arguments = {
			prefix, 				// {0}
			locale.toLanguageTag(), // {1}
			pageTitle,				// {2}
			baseurl, 				// {3}
			statItem, 				// {4}
			questionString,			// {5}
			prefixProperties		// {6}
		};
		
		if (embedHtmlTemplate == null) {
			try {
				embedHtmlTemplate = IOUtils.toString(getServletContext().getResourceAsStream("/templates/embed.html"));
			} catch (IOException e) {
				throw new InternalServerException("Failed to load the embed html template", e);
			}
		}
		
		return MessageFormat.format(embedHtmlTemplate, (Object[])arguments);
	}
	
	private String getPrintHTML(PersistenceManager pm, String prefix, Locale locale,
			String serverPath, String queryString, String baseurl) throws InternalServerException, BadReqException {
		
		LinkedList<EmbedFlag> flags = new LinkedList<EmbedFlag>();
		flags.add(EmbedFlag.LEGEND);
		flags.add(EmbedFlag.TRANSPARENT);
		flags.add(EmbedFlag.PRINT);
		String embedDefinition = new EmbedDefinition(flags).getAsString();

		String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "properties/usertexts", locale, "page_title");
		
		String[] arguments = {
			pageTitle,				// {0}
			baseurl,				// {1}
			serverPath,				// {2}
			queryString,			// {3}
			locale.toLanguageTag(),	// {4}
			prefix,					// {5}
			embedDefinition			// {6}
		};
		
		if (printHtmlTemplate == null) {
			try {
				printHtmlTemplate = IOUtils.toString(getServletContext().getResourceAsStream("/templates/print.html"));
			} catch (IOException e) {
				throw new InternalServerException("Failed to load print html template", e);
			}
		}
		
		return MessageFormat.format(printHtmlTemplate, (Object[])arguments);
	}
}

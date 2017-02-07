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
import java.io.StringReader;
import java.io.Writer;
import java.text.MessageFormat;
import java.util.LinkedList;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.ServletContext;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.ServerTools;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.QuestionMetadataServerImpl;
import org.daxplore.presenter.server.storage.SettingItemStore;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.storage.StaticFileStore;
import org.daxplore.presenter.server.storage.StorageTools;
import org.daxplore.presenter.server.storage.TextFileStore;
import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.presenter.shared.EmbedDefinition;
import org.daxplore.presenter.shared.EmbedDefinition.EmbedFlag;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.daxplore.shared.SharedResourceTools;

@SuppressWarnings("serial")
public class PresenterServlet extends HttpServlet {
	private static Logger logger = Logger.getLogger(PresenterServlet.class.getName());
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = null;
		try {
			ServletContext sc = getServletContext();
			
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
			String baseurl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
			
			// Clean user input
			if(prefix==null || !SharedResourceTools.isSyntacticallyValidPrefix(prefix)) {
				throw new BadRequestException("Someone tried to access a syntactically invalid prefix: '" + prefix + "'");
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
			
			String responseHTML = "";
			if (!browserSupported) {
				responseHTML = getUnsupportedBrowserHTML(sc, baseurl, generateGATemplate(pm, sc, prefix));
			} else {
				Locale locale = ServerTools.selectLocale(request, prefix);
				pm = PMF.get().getPersistenceManager();
				if (feature!=null && feature.equalsIgnoreCase("embed")) { // embedded chart
					// TODO clean query string
					String queryString = request.getParameter("q");
					String questionText = TextFileStore.getLocalizedFile(pm, prefix, "questions", locale, ".json");
					QuestionMetadata questionMetadata = new QuestionMetadataServerImpl(new StringReader(questionText));
					responseHTML = getEmbedHTML(pm, sc, questionMetadata, prefix, locale, queryString, baseurl, generateGATemplate(pm, sc, prefix));
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
					responseHTML = getPrintHTML(pm, sc,  prefix, locale, serverPath, queryString, baseurl, generateGATemplate(pm, sc, prefix));
					
				} else if(feature!=null && feature.equalsIgnoreCase("list")) { // mean list
					String perspectiveID = request.getParameter("p");
					responseHTML = TextFileStore.getLocalizedFile(pm, prefix, "profile_" + perspectiveID, locale, ".html");
				} else { // standard presenter
					responseHTML = TextFileStore.getLocalizedFile(pm, prefix, "explorer", locale, ".html");
				}
			}
			
			response.setContentType("text/html; charset=UTF-8");
			try (Writer writer = response.getWriter()){
				writer.write(responseHTML);
			} catch (IOException e) {
				throw new InternalServerException("Failed to display presenter servlet", e);
			}
		} catch (BadRequestException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} catch (InternalServerException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} catch (RuntimeException e) {
			logger.log(Level.SEVERE, "Unexpected exception: " + e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			if (pm != null) {
				pm.close();
			}
		}
	}
	
	private static String generateGATemplate(PersistenceManager pm, ServletContext sc, String prefix) throws InternalServerException {
		String googleAnalyticsID = SettingItemStore.getProperty(pm, prefix, "adminpanel", "gaID");
		String gaTemplate = "";
		if(googleAnalyticsID!=null && !googleAnalyticsID.equals("")) {
			String template = StaticFileStore.getStaticFile(sc, "/js/ga-tracking.js");
			gaTemplate = MessageFormat.format(template, googleAnalyticsID);
		}
		return gaTemplate;
	}
	
	private static String getUnsupportedBrowserHTML(ServletContext sc, String baseurl, String gaTemplate) throws InternalServerException {
		
		String[] arguments = {
			baseurl,				// {0}
			gaTemplate				// {1}
		};
		
		String template = StaticFileStore.getStaticFile(sc, "/templates/browser-suggestion.html");
		
		return MessageFormat.format(template, (Object[])arguments);
	}
	
	private static String getEmbedHTML(PersistenceManager pm, ServletContext sc, QuestionMetadata questionMetadata, String prefix, Locale locale,
			String queryString, String baseurl, String gaTemplate) throws BadRequestException, InternalServerException {
		
		QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, queryString);
		String statItem = StatDataItemStore.getStats(pm, prefix, queryDefinition);

		LinkedList<String> questions = new LinkedList<>();
		questions.add(queryDefinition.getQuestionID());
		questions.add(queryDefinition.getPerspectiveID());
		
		String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "pageTitle");
		
		String questionString = StorageTools.getQuestionDefinitions(pm, prefix, questions, locale);
		String usertexts = TextFileStore.getLocalizedFile(pm, prefix, "usertexts", locale, ".json");
		
		String settings = TextFileStore.getFile(pm, prefix, "settings.json");
		
		String[] arguments = {
			baseurl, 				// {0}
			pageTitle,				// {1}
			gaTemplate,				// {2}
			prefix, 				// {3}
			statItem, 				// {4}
			questionString,			// {5}
			usertexts,				// {6}
			settings				// {7}
		};
		
		String template = StaticFileStore.getStaticFile(sc, "/templates/embed.html");
		
		return MessageFormat.format(template, (Object[])arguments);
	}
	
	private static String getPrintHTML(PersistenceManager pm, ServletContext sc, String prefix, Locale locale,
			String serverPath, String queryString, String baseurl, String gaTemplate) throws InternalServerException, BadRequestException {
		
		LinkedList<EmbedFlag> flags = new LinkedList<>();
		flags.add(EmbedFlag.LEGEND);
		flags.add(EmbedFlag.TRANSPARENT);
		flags.add(EmbedFlag.PRINT);
		String embedDefinition = new EmbedDefinition(flags).getAsString();

		String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "pageTitle");
		
		String[] arguments = {
			pageTitle,				// {0}
			baseurl,				// {1}
			gaTemplate,				// {2}
			serverPath,				// {3}
			queryString,			// {4}
			locale.toLanguageTag(),	// {5}
			prefix,					// {6}
			embedDefinition,		// {7}	
		};
		
		String template = StaticFileStore.getStaticFile(sc, "/templates/print.html");
		
		return MessageFormat.format(template, (Object[])arguments);
	}
}

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
import java.util.List;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.ServerTools;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.SettingItemStore;
import org.daxplore.presenter.server.storage.StaticFileItemStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.shared.SharedResourceTools;

@SuppressWarnings("serial")
public class PresenterServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(PresenterServlet.class.getName());
	protected static String presenterHtmlTemplate = null;
	protected static String browserSuggestionTemplate = null;
	
	protected static List<Locale> supportedLocales;
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = null;
		try {
			// Get input from URL
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
			browserSupported = browserSupported | ignoreBadBrowser;
			
			if (!browserSupported) {
				displayUnsupportedBrowserPage(response);
				return;
			}
			
			Locale locale = ServerTools.selectLocale(request, prefix);
			
			pm = PMF.get().getPersistenceManager();
			// TODO Add caching for loaded files
			String perspectives = "", groups = "", questions = "";
			perspectives = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/perspectives", locale, ".json");
			questions = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/questions", locale, ".json");
			groups = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/groups", locale, ".json");
			
			String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "pageTitle");
		
			response.setContentType("text/html; charset=UTF-8");
			try {
				Writer writer = response.getWriter();
				writer.write(getPresenterHTML(locale, pageTitle, perspectives, questions, groups));
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
	
	protected void displayUnsupportedBrowserPage(HttpServletResponse response) {
		if (browserSuggestionTemplate == null) {
			try {
				browserSuggestionTemplate = IOUtils.toString(getServletContext().getResourceAsStream("/templates/browser-suggestion.html"));
			} catch (IOException e) {
				logger.log(Level.SEVERE, "Failed to load the html browser suggestion template", e);
				try {
					response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
				} catch (IOException e1) {}
				return;
			}
		}
		
		String[] arguments = {
			};
		
		try {
			Writer writer = response.getWriter();
			writer.write(MessageFormat.format(browserSuggestionTemplate, (Object[])arguments));
			writer.close();
		} catch (IOException e) {
			logger.log(Level.SEVERE, "Failed to display presenter servlet", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
	}
	
	private String getPresenterHTML(Locale locale, String pageTitle, String perspectives,
			String questions, String groups) throws InternalServerException {
		
		String[] arguments = {
			locale.toLanguageTag(), // {0}
			pageTitle,				// {1}
			perspectives,			// {2}
			questions,				// {3}
			groups					// {4}
		};
		
		if (presenterHtmlTemplate == null) {
			try {
				presenterHtmlTemplate = IOUtils.toString(getServletContext().getResourceAsStream("/templates/presenter.html"));
			} catch (IOException e) {
				throw new InternalServerException("Failed to load the embed html template", e);
			}
		}
		
		return MessageFormat.format(presenterHtmlTemplate, (Object[])arguments);
	}
}

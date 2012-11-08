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
import org.daxplore.presenter.server.storage.LocalizedSettingItemStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.StaticFileItemStore;
import org.daxplore.presenter.server.throwable.LocaleSelectionException;
import org.daxplore.shared.SharedResourceTools;

@SuppressWarnings("serial")
public class PresenterServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(PresenterServlet.class.getName());
	protected static String presenterHtmlTemplate = null;
	protected static String browserSuggestionTemplate = null;
	
	protected static List<Locale> supportedLocales;
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		// Get input from URL
		String prefix = request.getParameter("prefix");
		String useragent = request.getHeader("user-agent");
		Cookie[] cookies = request.getCookies();
		
		// Clean user input
		if(prefix==null || !SharedResourceTools.isSyntacticallyValidPrefix(prefix)) {
			logger.log(Level.WARNING, "Someone tried to access a syntactically invalid prefix: '" + prefix + "'");
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
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
		
		Locale locale = null;
		try {
			locale = ServerTools.selectLocale(request, prefix);
		} catch (LocaleSelectionException e) {
			logger.log(Level.SEVERE,  "Default locale is not a supported locale for prefix '" + prefix + "'");
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
		
		PersistenceManager pm = PMF.get().getPersistenceManager();
		// TODO Add caching for loaded files
		String perspectives = "", groups = "", questions = "";
		try {
			perspectives = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/perspectives", locale, ".json");
			questions = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/questions", locale, ".json");
			groups = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/groups", locale, ".json");
		} catch (IOException e) {
			logger.log(Level.SEVERE, "Failed to load definition files", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
		String pageTitle = LocalizedSettingItemStore.getLocalizedProperty(pm, prefix, locale, "pageTitle");
		pm.close();
		
		String[] arguments = {
			locale.toLanguageTag(), // {0}
			pageTitle,				// {1}
			perspectives,			// {2}
			questions,				// {3}
			groups					// {4}
		};
		
		response.setContentType("text/html; charset=UTF-8");
		try {
			Writer writer = response.getWriter();
			writer.write(MessageFormat.format(presenterHtmlTemplate, (Object[])arguments));
			writer.close();
		} catch (IOException e) {
			logger.log(Level.SEVERE, "Failed to display presenter servlet", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
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
}

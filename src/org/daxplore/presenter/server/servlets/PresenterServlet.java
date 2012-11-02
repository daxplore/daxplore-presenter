/**
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
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.text.MessageFormat;
import java.util.Enumeration;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Queue;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.jdo.Query;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.ServerTools;
import org.daxplore.presenter.server.storage.LocaleStore;
import org.daxplore.presenter.server.storage.LocalizedSettingItemStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.StaticFileItemStore;

@SuppressWarnings("serial")
public class PresenterServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(PresenterServlet.class.getName());
	protected static String presenterHtmlTemplate = null;
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = PMF.get().getPersistenceManager();
		Locale locale = null;
		String pageTitle = "";
		boolean browserSupported = true;
		String perspectives = "", groups = "", questions = "";
		
		try {
			request.setCharacterEncoding("UTF-8");
		} catch (UnsupportedEncodingException e) {
			logger.log(Level.SEVERE, "UTF-8 encoding not supported in Java", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {
				return;
			}
		}
		response.setContentType("text/html; charset=UTF-8");
		
		String prefix = request.getParameter("prefix");
		
		// TODO Add caching for loaded files
		try {
			perspectives = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/perspectives", locale, ".json");
			questions = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/questions", locale, ".json");
			groups = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/groups", locale, ".json");
		} catch (IOException e) {
			logger.log(Level.SEVERE, "Failed to load definition files", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {
				return;
			}
		}
		
		String useragent = request.getHeader("user-agent");
		double ieversion = ServerTools.getInternetExplorerVersion(useragent);
		if(useragent == null || (ieversion > 0.0 && ieversion < 8.0)){
			browserSupported = false;
		}
		Cookie[] cookies = request.getCookies();
		boolean ignoreBadBrowser = false;
		if(cookies != null){
			ignoreBadBrowser = ServerTools.ignoreBadBrowser(cookies);
		}
		browserSupported = browserSupported || ignoreBadBrowser;
	
		//Set up supported locales:
		Query query = pm.newQuery(LocaleStore.class);
		query.declareParameters("String specificPrefix");
		query.setFilter("prefix.equals(specificPrefix)");
		@SuppressWarnings("unchecked")
		LocaleStore localeStore = ((List<LocaleStore>)query.execute(prefix)).get(0);
		List<Locale> supportedLocales = localeStore.getSupportedLocales();
		
		//Build a queue of desired locales, enqueue the most desired ones first
		Queue<Locale> desiredLocales = new LinkedList<Locale>();
		
		// 1. Add browser request string locale
		String queryLocale = request.getParameter("locale");
		if(queryLocale!=null){
			desiredLocales.add(new Locale(queryLocale));	
		}
		
		// 2. Add cookie-preferred locale
		if(cookies != null) {
			for(Cookie c : cookies){
				if(c.getName().equalsIgnoreCase("locale")){
					desiredLocales.add(new Locale(c.getValue()));
				}
			}
		}
		
		// 3. Add browser requested locales
		@SuppressWarnings("unchecked")
		Enumeration<Locale> locales = (Enumeration<Locale>)request.getLocales();
		while(locales.hasMoreElements()){
			desiredLocales.add(locales.nextElement());
		}
		
		// 4. Add default locale
		desiredLocales.add(localeStore.getDefaultLocale());
		
		//Pick the first supported locale in the queue
		FindLocale: for(Locale desired : desiredLocales){
			String desiredLanguage = desired.getLanguage();
			for(Locale supported : supportedLocales){
				if(supported.getLanguage().equalsIgnoreCase(desiredLanguage)){
					locale = supported;
					break FindLocale;
				}
			}
		}
		
		pageTitle = LocalizedSettingItemStore.getLocalizedProperty(pm, prefix, locale, "pageTitle");
		
		pm.close();
		
		String[] arguments = {
			locale.toLanguageTag(), // {0}
			pageTitle,				// {1}
			perspectives,			// {2}
			questions,				// {3}
			groups					// {4}
		};
		
		try {
			Writer writer = response.getWriter();
			writer.write(MessageFormat.format(presenterHtmlTemplate, (Object[])arguments));
			writer.close();
		} catch (IOException e) {
			logger.log(Level.SEVERE, "Failed to display presenter servlet", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {
				return;
			}
		}
	}
}

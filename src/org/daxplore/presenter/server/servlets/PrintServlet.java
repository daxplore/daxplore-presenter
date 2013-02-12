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
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Queue;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.jdo.Query;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.storage.LocaleStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.SettingItemStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.presenter.shared.EmbedDefinition;
import org.daxplore.presenter.shared.EmbedDefinition.EmbedFlag;
import org.daxplore.shared.SharedResourceTools;

@SuppressWarnings("serial")
public class PrintServlet extends HttpServlet {
	Logger logger = Logger.getLogger(PrintServlet.class.getName());
	protected static String printHtmlTemplate = null;

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = null;
		try {
			// Get input from URL
			String prefix = request.getParameter("prefix");
			String queryLocale = request.getParameter("l");
			String queryString = request.getParameter("q");
			
			// Clean user input
			if(prefix==null || !SharedResourceTools.isSyntacticallyValidPrefix(prefix)) {
				throw new BadReqException("Someone tried to access a syntactically invalid prefix: '" + prefix + "'");
			}
			
			pm = PMF.get().getPersistenceManager();
	
			// Set up supported locales:
			Query query = pm.newQuery(LocaleStore.class);
			query.declareParameters("String specificPrefix");
			query.setFilter("prefix.equals(specificPrefix)");
			@SuppressWarnings("unchecked")
			LocaleStore localeStore = ((List<LocaleStore>) query.execute(prefix)).get(0);
			List<Locale> supportedLocales = localeStore.getSupportedLocales();
	
			// Build a queue of desired locales, enqueue the most desired ones first
			Queue<Locale> desiredLocales = new LinkedList<Locale>();
	
			// 1. Add browser request string locale
			
			if (queryLocale != null) {
				desiredLocales.add(new Locale(queryLocale));
			}
	
			// 2. Add default locale
			desiredLocales.add(localeStore.getDefaultLocale());
	
			Locale locale = null;
			// Pick the first supported locale in the queue
			FindLocale: for (Locale desired : desiredLocales) {
				String desiredLanguage = desired.getLanguage();
				for (Locale supported : supportedLocales) {
					if (supported.getLanguage().equalsIgnoreCase(desiredLanguage)) {
						locale = supported;
						break FindLocale;
					}
				}
			}
	
			
			LinkedList<EmbedFlag> flags = new LinkedList<EmbedFlag>();
			flags.add(EmbedFlag.LEGEND);
			flags.add(EmbedFlag.TRANSPARENT);
			flags.add(EmbedFlag.PRINT);
			String embedDefinition = new EmbedDefinition(flags).getAsString();
	
			String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "pageTitle");
			
			String serverPath = request.getRequestURL().toString();
			// remove last slash
			if (serverPath.charAt(serverPath.length() - 1) == '/') {
				serverPath = serverPath.substring(0, serverPath.length() - 1);
			}
			// remove module name
			serverPath = serverPath.substring(0, serverPath.lastIndexOf("/"));
			
			if (printHtmlTemplate == null) {
				try {
					printHtmlTemplate = IOUtils.toString(getServletContext().getResourceAsStream("/templates/print.html"));
				} catch (IOException e) {
					throw new InternalServerException("Failed to load print html template", e);
				}
			}
			
			String[] arguments = {
				pageTitle,				// {0}
				serverPath,				// {1}
				queryString,			// {2}
				locale.toLanguageTag(),	// {3}
				prefix,					// {4}
				embedDefinition			// {5}
			};
	
			try {
				Writer writer = response.getWriter();
				writer.write(MessageFormat.format(printHtmlTemplate, (Object[])arguments));
				writer.close();
			} catch (IOException e) {
				throw new InternalServerException("Failed to display print servlet", e);
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
}

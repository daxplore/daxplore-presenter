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

import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.storage.LocaleStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.PrefixStore;
import org.daxplore.presenter.server.storage.StaticFileStore;
import org.daxplore.presenter.server.storage.TextFileStore;
import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.json.simple.JSONArray;
import org.json.simple.JSONValue;

@SuppressWarnings("serial")
public class HydrateCacheServlet extends HttpServlet {
	private static Logger logger = Logger.getLogger(HydrateCacheServlet.class.getName());
	
	private static String[] cachedStaticFiles = {
		"/js/ga-tracking.js",
		"/templates/browser-suggestion.html",
		"/templates/embed.html",
		"/templates/print.html",
		"/templates/welcome.html"
	};
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = PMF.get().getPersistenceManager();
		try {
			for (String prefix : PrefixStore.getPrefixes(pm)) {
				for (Locale locale : LocaleStore.getLocaleStore(pm, prefix).getSupportedLocales()) {
					TextFileStore.cacheLocalizedFile(pm, prefix, "explorer", locale, ".html");
					
					String perspectivesJson = TextFileStore.getFile(pm, prefix, "perspectives.json");
					JSONArray perspectives = (JSONArray)JSONValue.parse(perspectivesJson);
					for (String perspectiveID : getAsStringArray(perspectives)) {
						TextFileStore.cacheLocalizedFile(pm, prefix, "profile_" + perspectiveID, locale, ".html");
					}
				}
			}
			
			ServletContext sc = getServletContext();
			for (String filename : cachedStaticFiles) {
				StaticFileStore.cacheStaticFile(sc, filename);
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
			pm.close();
		}
	}
	
	private static String[] getAsStringArray(JSONArray dataJson) {
		String[] data = new String[dataJson.size()];
		for (int i = 0; i<data.length; i++) {
			data[i] = (String)dataJson.get(i);
		}
		return data;
	}
}

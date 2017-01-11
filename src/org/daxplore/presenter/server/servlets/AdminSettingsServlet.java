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
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.JDOObjectNotFoundException;
import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.storage.BuildPresentations;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.SettingItemStore;
import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.shared.SharedResourceTools;
import org.json.simple.JSONObject;

@SuppressWarnings("serial")
public class AdminSettingsServlet extends HttpServlet {
	private static Logger logger = Logger.getLogger(AdminSettingsServlet.class.getName());
	
	private final static String[] settings = {"gaID"};
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		doPost(request, response);
	}
	
	@SuppressWarnings("unchecked")
	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = null;
		try {
			pm = PMF.get().getPersistenceManager();
			String prefix = request.getParameter("prefix");
			String action = request.getParameter("action");
			if(action==null) {
				throw new BadRequestException("No action requested");
			}
			switch(action) {
			case "get":
				if(!SharedResourceTools.isSyntacticallyValidPrefix(prefix)){
					throw new BadRequestException("Not a syntactically valid prefix: '" + prefix + "'");
				}
				JSONObject json = new JSONObject();
				for(String key : settings) {
					String value = SettingItemStore.getProperty(pm, prefix, "adminpanel", key);
					json.put(key, value);
				}
				try {
					response.getWriter().write(json.toJSONString());
				} catch (IOException e1) {
					throw new InternalServerException("Failed to write response", e1);
				}
				break;
			case "put":
				if(!SharedResourceTools.isSyntacticallyValidPrefix(prefix)){
					throw new BadRequestException("Not a syntactically valid prefix: '" + prefix + "'");
				}
				for(String key : settings) {
					String value = request.getParameter(key);
					boolean isValid = false;
					if(value != null) {
						switch (key) {
						case "gaID":
							// regex to validate Google Analytics UA Number
							// http://stackoverflow.com/questions/2497294/regular-expression-to-validate-a-google-analytics-ua-number
							isValid = value.matches("\\bUA-\\d{4,10}-\\d{1,4}\\b");
							break;
						default:
							throw new InternalServerException("Setting '" + key + "' not properly implemented");
						}
					}
					
					if(isValid) {
						String statStoreKey = prefix + "#adminpanel/" + key;
						SettingItemStore setting = null;
						try {
							setting = pm.getObjectById(SettingItemStore.class, key);
							setting.setValue(value);
						} catch (JDOObjectNotFoundException e) {
							setting = new SettingItemStore(statStoreKey, value);
						}
						pm.makePersistent(setting);
						BuildPresentations.buildAndStorePresentation(pm, getServletContext(), request, prefix);
						logger.log(Level.INFO, "Set property '" + statStoreKey + "' to '" + value + "'");
					} else {
						throw new BadRequestException("Invalid value for setting '" + key + "': '" + value + "'");
					}
				}
				break;
			case "rebuild-presentations":
				BuildPresentations.buildAndStoreAllPresentations(pm, getServletContext(), request);
				break;
			default:
				throw new BadRequestException("Invalid action '" + request.getParameter("action") + "' requested");
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
			if (pm!=null) {
				pm.close();
			}
		}
	}
}

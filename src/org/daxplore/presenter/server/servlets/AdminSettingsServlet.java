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

import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.SettingItemStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.shared.SharedResourceTools;
import org.json.simple.JSONObject;

@SuppressWarnings("serial")
public class AdminSettingsServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(AdminSettingsServlet.class.getName());
	
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
			if(!SharedResourceTools.isSyntacticallyValidPrefix(prefix)){
				throw new BadReqException("Not a syntactically valid prefix: '" + prefix + "'");
			}
			String action = request.getParameter("action");
			if(action==null) {
				throw new BadReqException("No action requested");
			}
			switch(action) {
			case "get":
				JSONObject json = new JSONObject();
				for(String key : settings) {
					try {
						String value = SettingItemStore.getProperty(pm, prefix, "adminpanel", key);
						json.put(key, value);
					} catch (BadReqException e) {}
				}
				try {
					response.getWriter().write(json.toJSONString());
				} catch (IOException e1) {
					throw new InternalServerException("Failed to write response", e1);
				}
				break;
			case "put":
				for(String key : settings) {
					String value = request.getParameter(key); //TODO clean input
					SettingItemStore setting;
					String statStoreKey = prefix + "#adminpanel/" + key;
					try {
						setting = pm.getObjectById(SettingItemStore.class, key);
						setting.setValue(value);
					} catch (JDOObjectNotFoundException e) {
						setting = new SettingItemStore(statStoreKey, value);
					}
					pm.makePersistent(setting);
					logger.log(Level.INFO, "Set property '" + statStoreKey + "' to '" + value + "'");
				}
				break;
			default:
				throw new BadReqException("Invalid action '" + request.getParameter("action") + "' requested");
			}
			
		} catch (BadReqException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} catch (InternalServerException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} catch (Exception e) {
			logger.log(Level.SEVERE, "Unexpected exception: " + e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			if (pm!=null) {
				pm.close();
			}
		}
	}
}

/*
 *  Copyright 2012 Axel Winkler, Daniel Dunér
 * 
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.server.servlets;

import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.storage.DeleteData;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.PrefixStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

@SuppressWarnings("serial")
public class AdminPrefixServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(AdminPrefixServlet.class.getName());

	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		doPost(request, response);
	}
	
	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = PMF.get().getPersistenceManager();
		try {
			String action = request.getParameter("action"); //TODO clean input
			
			String responseText = ""; 
			switch(action) {
			case "list":
				responseText = getPrefixListJson(pm);
				break;
			case "add":
				String prefix = request.getParameter("prefix"); //TODO clean input
				pm.makePersistent(new PrefixStore(prefix));
				logger.log(Level.INFO, "Added prefix to system: " + prefix);
				responseText = getPrefixListJson(pm);
				break;
			case "delete":
				prefix = request.getParameter("prefix"); //TODO clean input
				/*String result =*/ DeleteData.deleteForPrefix(pm, prefix); // Logs it's own action
				//TODO send result over server channel?
				responseText = getPrefixListJson(pm);
				break;
			case "metadata":
				prefix = request.getParameter("prefix"); //TODO clean input
				responseText = getPrefixMetadata(pm, prefix);
				break;
			default:
				throw new BadReqException("Invalid action '" + action + "' requested");
			}
			
			try {
				response.getWriter().write(responseText);
			} catch (IOException e) {
				throw new InternalServerException("Failed to write prefix list", e);
			}
			
		} catch (BadReqException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} catch (InternalServerException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			pm.close();
		}
	}
	
	@SuppressWarnings("unchecked")
	private String getPrefixListJson(PersistenceManager pm) {
		List<String> prefixes = PrefixStore.getPrefixes(pm);
		JSONArray jsonArray = new JSONArray();
		jsonArray.addAll(prefixes);
		jsonArray.toJSONString();
		return jsonArray.toJSONString();
	}
	
	@SuppressWarnings("unchecked")
	private String getPrefixMetadata(PersistenceManager pm, String prefix) {
		JSONObject metaMap = new JSONObject();
		metaMap.put("prefix", prefix);
		
		// or figure out some relevant statistics that's equally interesting
		metaMap.put("statcount", "<TODO>"); //TODO count items or some such
		return metaMap.toJSONString();
	}
	
}

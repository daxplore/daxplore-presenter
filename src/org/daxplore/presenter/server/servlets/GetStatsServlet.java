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

import java.io.PrintWriter;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.shared.SharedResourceTools;

/**
 * The GetStatsServlet serves StatDataItem data at the URL /getStats.
 * 
 * <p>Data is requested by Daxplore web pages, based on their needs. The data is sent
 * as a single json-serialized StatDataItem.</p>
 * 
 * <p>The servlet takes the arguments:
 * <ul>
 * <li>prefix, which defines which prefix to read the data from</li>
 * <li>q, which is the questionID of the question to use</li>
 * <li>p, which is the perspectiveID of the perspective to use</li>
 * </ul>
 * </p>
 */
@SuppressWarnings("serial")
public class GetStatsServlet extends HttpServlet {
	private static Logger logger = Logger.getLogger(GetStatsServlet.class.getName());
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, java.io.IOException {
		PrintWriter respWriter = response.getWriter();
		try {
			String questionID = request.getParameter("q"); //TODO check input
			String perspectiveID = request.getParameter("p"); //TODO check input
			
			PersistenceManager pm = PMF.get().getPersistenceManager();
			String prefix = request.getParameter("prefix");
			if(!SharedResourceTools.isSyntacticallyValidPrefix(prefix)){
				throw new BadReqException("Request made with syntactically invalid prefix: '" + prefix + "'");
			}
			
			response.setContentType("text/html; charset=UTF-8");
			respWriter.write(StatDataItemStore.getStats(pm, prefix, questionID, perspectiveID));
			response.setStatus(HttpServletResponse.SC_OK);
		} catch (BadReqException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} finally {
			respWriter.close();
		}
	}
}

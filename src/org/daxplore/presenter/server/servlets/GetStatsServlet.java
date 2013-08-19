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
import java.io.PrintWriter;
import java.io.StringReader;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.storage.LocaleStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.QuestionMetadataServerImpl;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.storage.TextFileStore;
import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.daxplore.shared.SharedResourceTools;

/**
 * The {@linkplain GetStatsServlet} serves StatDataItem data.
 * 
 * <p>The data is sent on requests made by Daxplore clients. The data is sent
 * as a json-serialized StatDataItem.</p>
 * 
 * <p>The servlet takes the arguments:
 * <ul>
 * <li>q, which is a queryString that defines the query for which data
 * should be returned</li>
 * <li>prefix, which defines which prefix to read the data from</li>
 * </ul>
 * </p>
 */
@SuppressWarnings("serial")
public class GetStatsServlet extends HttpServlet {
	private static Logger logger = Logger.getLogger(GetStatsServlet.class.getName());
	private static Map<String, QuestionMetadata> metadataPrefixMap = new HashMap<>();
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PrintWriter respWriter = null;
		PersistenceManager pm = null;
		try {
			
			pm = PMF.get().getPersistenceManager();
			String prefix = request.getParameter("prefix");
			if(!SharedResourceTools.isSyntacticallyValidPrefix(prefix)){
				throw new BadRequestException("Request made with syntactically invalid prefix: '" + prefix + "'");
			}
			if (!metadataPrefixMap.containsKey(prefix)) { // TODO clear on new upload (and in other similar places)
				LocaleStore localeStore = pm.getObjectById(LocaleStore.class, prefix);
				//it shouldn't matter what locale we use here, as we don't read any localized data
				String questionText = TextFileStore.getFile(pm, prefix, "meta/questions", localeStore.getDefaultLocale(), ".json");
				metadataPrefixMap.put(prefix, new QuestionMetadataServerImpl(new StringReader(questionText)));
			}
			
			String queryString = request.getParameter("q");
			QueryDefinition queryDefinition = new QueryDefinition(metadataPrefixMap.get(prefix), queryString);
			
			try {
				respWriter = response.getWriter();
			} catch (IOException e) {
				throw new InternalServerException(e);
			}
			
			response.setContentType("text/html; charset=UTF-8");
			respWriter.write(StatDataItemStore.getStats(pm, prefix, queryDefinition));
			respWriter.close();
			response.setStatus(HttpServletResponse.SC_OK);
		} catch (BadRequestException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} catch (InternalServerException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} catch (Exception e) {
			logger.log(Level.SEVERE, "Unexpected exception: " + e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			if(respWriter!=null) {
				respWriter.close();
			}
			if (pm!=null) {
				pm.close();
			}
		}
	}
	
	public static void clearServletCache(String prefix) {
		metadataPrefixMap.remove(prefix);
	}
}

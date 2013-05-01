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
import java.io.StringReader;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.jdo.Query;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.client.json.shared.StatDataItem;
import org.daxplore.presenter.server.storage.LocaleStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.QuestionMetadataServerImpl;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.storage.StaticFileItemStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QuestionMetadata;

/**
 * The {@linkplain GetStatsServlet} serves {@link StatDataItem} data.
 * 
 * <p>The data is sent on requests made by Daxplore clients. The data is sent
 * as a number of json-serialized {@linkplain} StatDataItem}s.</p>
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
	QuestionMetadata questionMetadata = null;
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, java.io.IOException {
		PrintWriter respWriter = response.getWriter();
		PersistenceManager pm = PMF.get().getPersistenceManager();
		String prefix = request.getParameter("prefix"); //TODO check input
		String queryString = request.getParameter("q"); //TODO check input
		try {
			if (questionMetadata == null) {
				Query query = pm.newQuery(LocaleStore.class);
				query.declareParameters("String specificPrefix");
				query.setFilter("prefix.equals(specificPrefix)");
				@SuppressWarnings("unchecked")
				LocaleStore localeStore = ((List<LocaleStore>) query.execute(prefix)).get(0);
				
				//it shouldn't matter what locale we use here, as we don't read any localized data
				String questionText = StaticFileItemStore.readStaticFile(pm, prefix, "meta/questions", localeStore.getDefaultLocale(), ".json");
				questionMetadata = new QuestionMetadataServerImpl(new StringReader(questionText));
			}
			
			QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, queryString);
			
			response.setContentType("text/html; charset=UTF-8");
			respWriter.write(StatDataItemStore.getStats(pm, prefix, queryDefinition));
			response.setStatus(HttpServletResponse.SC_OK);
		} catch (BadReqException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} catch (InternalServerException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			respWriter.close();
		}
	}
}

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
package org.daxplore.presenter.server;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;

import javax.jdo.PersistenceManager;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.client.json.shared.StatDataItem;
import org.daxplore.presenter.server.resources.JspBundles;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.throwable.ResourceReaderException;
import org.daxplore.presenter.server.throwable.StatsException;
import org.daxplore.presenter.shared.SharedTools;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.apphosting.api.ApiProxy.CapabilityDisabledException;

/**
 * The {@linkplain GetStatsServlet} serves {@link StatDataItem} data.
 * 
 * <p>The data is sent on requests made by Daxplore clients. The data is sent
 * as a number of json-serialized {@linkplain} StatDataItem}s.</p>
 * 
 * <p>The servlet takes the argument:
 * <ul>
 * <li>q, which is a queryString that defines the query for which data
 * should be returned</li>
 * </ul>
 * </p>
 */
@SuppressWarnings("serial")
public class GetStatsServlet extends HttpServlet {
	PersistenceManager pm;
	QuestionMetadata questionMetadata = null;
	
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, java.io.IOException {
		PrintWriter respWriter = resp.getWriter();
		
		try {
			if (questionMetadata == null) {
				//it shouldn't matter what locale we use here, as we don't read any localized data:
				String defaultLocale = JspBundles.getLocalesBundle().getString("defaultLocale");
				Locale locale = new Locale(defaultLocale);
				BufferedReader reader = ServerTools.getResourceReader(getServletContext(), "questions", locale , ".json");
				questionMetadata = new QuestionMetadataServerImpl(reader);
				reader.close();
			}
			
			QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, req.getParameter("q"));
			
			resp.setContentType("text/html; charset=UTF-8");
			
			for (String json : getStats(queryDefinition)) {
				respWriter.write(json + "\n");
			}
			
			resp.setStatus(HttpServletResponse.SC_OK);
			
		} catch (IOException e) {
			e.printStackTrace();
			resp.setContentType("text/html; charset=UTF-8");
			resp.sendError(HttpServletResponse.SC_BAD_REQUEST);
		} catch (StatsException e ) {
			e.printStackTrace();
			resp.setContentType("text/html; charset=UTF-8");
			resp.sendError(HttpServletResponse.SC_BAD_REQUEST);
		} catch (ResourceReaderException e) {
			e.printStackTrace();
			resp.setContentType("text/html; charset=UTF-8");
			resp.sendError(HttpServletResponse.SC_BAD_REQUEST);
		} finally {
			respWriter.close();
		}
	}

	public static LinkedList<String> getStats(QueryDefinition queryDefinition) throws StatsException {
		String perspectiveID = queryDefinition.getPerspectiveID();
		String questionID = queryDefinition.getQuestionID();
		boolean useTotal = queryDefinition.hasFlag(QueryFlag.TOTAL);
		List<Integer> usedPerspectiveOptions = queryDefinition.getUsedPerspectiveOptions();
		LinkedList<String> datastoreKeys = new LinkedList<String>();
		if (questionID.equals("")) {
			throw new StatsException("No legit query");
		} else if (perspectiveID.equals("") || usedPerspectiveOptions.size() == 0) {
			datastoreKeys.add("Q=" + questionID);
		} else {
			if (useTotal) {
				datastoreKeys.add("Q=" + questionID);
			}
			for (int alt: usedPerspectiveOptions) {
				datastoreKeys.add(perspectiveID + "=" + (alt+1) + "+Q=" + questionID);
			}
		}

		LinkedList<String> datastoreJsons = new LinkedList<String>();
		PersistenceManager pm = PMF.get().getPersistenceManager();
		for (String key : datastoreKeys) {
			try {
				StatDataItemStore statStore = pm.getObjectById(StatDataItemStore.class, key.toUpperCase());
				datastoreJsons.add(statStore.getJson());
			} catch (CapabilityDisabledException e) {
				SharedTools.println("CapabilityDisabledException");
				// TODO Datastore down for maintenance: send error message or no feedback?
				throw new StatsException(e);
			} catch (javax.jdo.JDOObjectNotFoundException e) {
				SharedTools.println("JDOObjectNotFoundException using key: " + key.toUpperCase());
				throw new StatsException("Using key: " + key.toUpperCase(), e);
				// TODO Key does not exist: send error message or no feedback?
			} catch (UnsupportedOperationException e) {
				SharedTools.println("UnsupportedOperationException. this should only happen on DevServer." + e);
				SharedTools.println("Try restarting the web server or something.");
				throw new StatsException("UnsupportedOperationException, this should only happen on DevServer.", e);
				// TODO If google fixes this issue, remove catch.
			}
		}
		pm.close();
		return datastoreJsons;
	}
}

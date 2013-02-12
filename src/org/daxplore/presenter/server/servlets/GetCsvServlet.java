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
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.StringReader;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.QuestionMetadataServerImpl;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.storage.StaticFileItemStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.daxplore.shared.SharedResourceTools;
import org.json.simple.parser.ContainerFactory;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import au.com.bytecode.opencsv.CSVWriter;

/**
 * Generate and return a csv-file containing data for a specific chart.
 * 
 * <p>This servlet is used by the client to generate and serve a downloadable
 * csv-file to the user. The content of the file matches the data as defined
 * by a singe {@link QueryDefinition}.</p>
 * 
 * <p>The servlet takes the arguments:
 * <ul>
 * <li>q, which is a queryString that defines the query</li>
 * <li>l, which defines the locale</li>
 * <li>prefix, which defines which prefix to read the data from</li>
 * </ul>
 */
@SuppressWarnings("serial")
public class GetCsvServlet extends HttpServlet {
	Logger logger = Logger.getLogger(GetCsvServlet.class.getName());
	protected static final Map<String, QuestionMetadata> metadataMap = new HashMap<String, QuestionMetadata>();
	
	@Override
	@SuppressWarnings({ "rawtypes" })
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = null;
		CSVWriter csvWriter = null;
		try {
			// Get input from URL
			String prefix = request.getParameter("prefix");
			String queryString = request.getParameter("q");
			String localeString = request.getParameter("l");
			
			// Clean user input
			if(prefix==null || !SharedResourceTools.isSyntacticallyValidPrefix(prefix)) {
				throw new BadReqException("Someone tried to access a syntactically invalid prefix: '" + prefix + "'");
			}
			
			if (localeString==null) {
				localeString = "";
			}
			
			try {
				PrintWriter respWriter = new PrintWriter(new OutputStreamWriter(response.getOutputStream(), "UTF8"), true);
				response.setContentType("text/csv; charset=UTF-8");
				csvWriter =  new CSVWriter(respWriter);
			} catch (IOException e) {
				throw new InternalServerException("Failed to write csv response", e);
			}
			
			pm = PMF.get().getPersistenceManager();
			
			Locale locale = new Locale(localeString);
			QuestionMetadata questionMetadata;
			if(metadataMap.containsKey(locale.getLanguage())) {
				questionMetadata = metadataMap.get(locale.getLanguage());
			} else {
				String questionText = StaticFileItemStore.readStaticFile(pm, prefix, "definitions/questions", locale, ".json");
				questionMetadata = new QuestionMetadataServerImpl(new StringReader(questionText));
				metadataMap.put(locale.getLanguage(), questionMetadata);
			}
			QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, queryString);
			List<String[]> csvOutput = new LinkedList<String[]>();
			
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			
			List<String> questionOptionTexts = queryDefinition.getQuestionOptionTexts();
			List<String> perspectiveOptionTexts = queryDefinition.getPerspectiveOptionTexts();
			List<Integer> usedPerspectiveOptions = queryDefinition.getUsedPerspectiveOptions();
			
			questionOptionTexts.add(0,  queryDefinition.getPerspectiveShortText() + " \\ " + queryDefinition.getQuestionShortText());
			csvOutput.add(questionOptionTexts.toArray(new String[0]));
			
			LinkedList<String> statItems = StatDataItemStore.getStats(pm, prefix, queryDefinition);
	
			
			ContainerFactory containerFactory = new ContainerFactory() {
				@Override
				public Map createObjectContainer() {
					return new LinkedHashMap();
				}
				@Override
				public List creatArrayContainer() {
					return new LinkedList();
				}
			};
			
			JSONParser parser = new JSONParser();
			for (String json : statItems) {
				Map jo;
				try {
					jo = (Map)parser.parse(json, containerFactory);
				} catch (ParseException e) {
					throw new BadReqException("Failed to parse json data", e);
				}
	
				Long perspectiveLong = (Long)jo.get("s");
				if (perspectiveLong!=null) {
					int index = perspectiveLong.intValue()-1;
					if (usedPerspectiveOptions.contains(index)) {
						String[] row = new String[1 + queryDefinition.getQuestionOptionCount()];
						List respondents = (List)jo.get("d");
						if (queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
							row[0] = perspectiveOptionTexts.get(index) + " (1)"; //TODO mark primary (1) in some better way?
						} else {
							row[0] = perspectiveOptionTexts.get(index);
						}
						for (int i=1; i<row.length; i++) {
							if (i-1<respondents.size()) {
								row[i] = ((Long)respondents.get(i-1)).toString();
							} else {
								row[i] = "0";
							}
						}
						csvOutput.add(row);
						
						if (queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
							row = new String[1 + queryDefinition.getQuestionOptionCount()];
							respondents = (List)jo.get("o");
							row[0] = perspectiveOptionTexts.get(index) + " (2)"; //TODO mark secondary (2) in some better way?
							for (int i=1; i<row.length; i++) {
								if (i-1<respondents.size()) {
									row[i] = ((Long)respondents.get(i-1)).toString();
								} else {
									row[i] = "0";
								}
							}
							csvOutput.add(row);
						}
					}
				} else {
					//TODO All respondents, ignore or add?
				}
			}
			
			// write response
			csvWriter.writeAll(csvOutput);
			response.setStatus(HttpServletResponse.SC_OK);
			
		} catch (BadReqException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} catch (Exception e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			if (csvWriter != null) {
				try {
					csvWriter.close();
				} catch (IOException e1) {}
			}
			if (pm!=null) {
				pm.close();
			}
		}
	}
}

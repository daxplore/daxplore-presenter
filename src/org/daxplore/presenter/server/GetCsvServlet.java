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

import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.StringReader;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.storage.StorageTools;
import org.daxplore.presenter.server.throwable.StatsException;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;
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
 * </ul>
 */
@SuppressWarnings("serial")
public class GetCsvServlet extends HttpServlet {
	protected static final Map<String, QuestionMetadata> metadataMap = new HashMap<String, QuestionMetadata>();
	
	@Override
	@SuppressWarnings({ "rawtypes" })
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, java.io.IOException {
		
		PrintWriter respWriter = new PrintWriter(new OutputStreamWriter(resp.getOutputStream(), "UTF8"), true);
		resp.setContentType("text/csv; charset=UTF-8");
		CSVWriter csvWriter =  new CSVWriter(respWriter);
		
		try {
			String localeString = req.getParameter("l");
			String prefix = req.getParameter("prefix");
			if (localeString==null) {
				localeString = "";
			}
			Locale locale = new Locale(localeString);
			QuestionMetadata questionMetadata;
			if(metadataMap.containsKey(locale.getLanguage())) {
				questionMetadata = metadataMap.get(locale.getLanguage());
			} else {
				String questionText = StorageTools.readStaticFile(prefix, "definitions/questions", locale, ".json");
				questionMetadata = new QuestionMetadataServerImpl(new StringReader(questionText));
				metadataMap.put(locale.getLanguage(), questionMetadata);
			}
			QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, req.getParameter("q"));
			List<String[]> csvOutput = new LinkedList<String[]>();
			
			resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			
			List<String> questionOptionTexts = queryDefinition.getQuestionOptionTexts();
			List<String> perspectiveOptionTexts = queryDefinition.getPerspectiveOptionTexts();
			List<Integer> usedPerspectiveOptions = queryDefinition.getUsedPerspectiveOptions();
			
			questionOptionTexts.add(0,  queryDefinition.getPerspectiveShortText() + " \\ " + queryDefinition.getQuestionShortText());
			csvOutput.add(questionOptionTexts.toArray(new String[0]));
			LinkedList<String> datastoreJsons;
			datastoreJsons = GetStatsServlet.getStats(queryDefinition);
			
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
			for (String json : datastoreJsons) {
				Map jo = (Map)parser.parse(json, containerFactory);
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
			
			//write response
			csvWriter.writeAll(csvOutput);
			resp.setStatus(HttpServletResponse.SC_OK);
			
		} catch (StatsException e) {
			e.printStackTrace();
			resp.setContentType("text/html; charset=UTF-8");
			resp.sendError(HttpServletResponse.SC_BAD_REQUEST);
		} catch (ParseException e) {
			e.printStackTrace();
			resp.setContentType("text/html; charset=UTF-8");
			resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} catch (Exception e) {
			e.printStackTrace();
			resp.setContentType("text/html; charset=UTF-8");
			resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			csvWriter.close();
		}
	}
}

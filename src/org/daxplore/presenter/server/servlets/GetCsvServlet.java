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
import java.text.MessageFormat;
import java.util.HashMap;
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

import org.daxplore.presenter.server.ChartDataParserServer;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.QuestionMetadataServerImpl;
import org.daxplore.presenter.server.storage.SettingItemStore;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.storage.TextFileStore;
import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.presenter.shared.ChartDataItem;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.daxplore.shared.SharedResourceTools;

import au.com.bytecode.opencsv.CSVWriter;

/**
 * Generate and return a csv-file containing data for a specific chart.
 * 
 * <p>This servlet is used by the client to generate and serve a downloadable
 * csv-file to the user. The content of the file matches the data as defined
 * by a single {@link QueryDefinition}.</p>
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
	private Logger logger = Logger.getLogger(GetCsvServlet.class.getName());
	private static Map<String, QuestionMetadata> metadataMap = new HashMap<>();
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = null;
		try {
			// Get input from URL
			String prefix = request.getParameter("prefix");
			String queryString = request.getParameter("q");
			String localeString = request.getParameter("l");
			
			// Clean user input
			if(prefix==null || !SharedResourceTools.isSyntacticallyValidPrefix(prefix)) {
				throw new BadRequestException("Someone tried to access a syntactically invalid prefix: '" + prefix + "'");
			}
			
			if (localeString==null) {
				localeString = "";
			}
			
			pm = PMF.get().getPersistenceManager();
			List<String[]> csvTable = new LinkedList<>();
			
			Locale locale = new Locale(localeString);
			QuestionMetadata questionMetadata;
			String key = prefix + "_" + locale.toLanguageTag();
			if(metadataMap.containsKey(key)) {
				questionMetadata = metadataMap.get(key);
			} else {
				String questionText = TextFileStore.getLocalizedFile(pm, prefix, "questions", locale, ".json");
				questionMetadata = new QuestionMetadataServerImpl(new StringReader(questionText));
				metadataMap.put(key, questionMetadata);
			}
			QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, queryString);
			
			List<String> questionOptionTexts = queryDefinition.getQuestionOptionTexts();
			List<String> perspectiveOptionTexts = queryDefinition.getPerspectiveOptionTexts();
			List<Integer> usedPerspectiveOptions = queryDefinition.getUsedPerspectiveOptions();
			
			questionOptionTexts.add(0,  queryDefinition.getPerspectiveShortText() + " \\ " + queryDefinition.getQuestionShortText());
			
			//TODO handle timepoints properly
			String timepoint0Text = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "timepoint_0");
			String timepoint1Text = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "timepoint_1");
			
			String statString = StatDataItemStore.getStats(pm, prefix, queryDefinition);
			ChartDataParserServer data = new ChartDataParserServer(statString);
			List<ChartDataItem> dataItems = data.getDataItems();
			
			int columnCount = 4 + queryDefinition.getQuestionOptionCount();
			int rowCount = 0;
			csvTable.add(questionOptionTexts.toArray(new String[columnCount]));
			
			if(queryDefinition.getPerspectiveOptionCount()>0){
				for(int perspectiveOption : usedPerspectiveOptions) {
					String[] row = new String[columnCount];
					row[0] = MessageFormat.format("{0} ({1})", perspectiveOptionTexts.get(perspectiveOption), timepoint0Text);
					int[] primaryData = dataItems.get(perspectiveOption).getCountData();
					for (int i=1; i<=queryDefinition.getQuestionOptionCount(); i++) {
						row[i] = Integer.toString(primaryData[i-1]);				
					}
					csvTable.add(row);
					rowCount++;
				}
			} 
			
			if(queryDefinition.hasFlag(QueryFlag.TOTAL) || queryDefinition.getPerspectiveOptionCount()==0){
				String[] row = new String[columnCount];
				String allRespondents = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "all_respondents");
				row[0] = MessageFormat.format("{0} ({1})", allRespondents, timepoint0Text);
				int[] primaryData = data.getTotalDataItem().getCountData();
				for (int i=1; i<=queryDefinition.getQuestionOptionCount(); i++) {
					row[i] = Integer.toString(primaryData[i-1]);	
				}
				csvTable.add(row);
				rowCount++;
			}

			
			if (queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
				for(int perspectiveOption : usedPerspectiveOptions) {
					String[] row = new String[columnCount];
					row[0] = MessageFormat.format("{0} ({1})", perspectiveOptionTexts.get(perspectiveOption), timepoint1Text);
					int[] secondaryData = dataItems.get(perspectiveOption).getCountDataSecondary();
					for(int i=1; i<=queryDefinition.getQuestionOptionCount(); i++) {
						row[i] = Integer.toString(secondaryData[i-1]);
					}
					csvTable.add(row);
					rowCount++;
				}
				
				if(queryDefinition.hasFlag(QueryFlag.TOTAL) || queryDefinition.getPerspectiveOptionCount()==0){
					String[] row = new String[columnCount];
					String allRespondents = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "all_respondents");
					row[0] = MessageFormat.format("{0} ({1})", allRespondents, timepoint1Text);
					int[] secondaryData = data.getTotalDataItem().getCountDataSecondary();
					for (int i=1; i<=queryDefinition.getQuestionOptionCount(); i++) {
						row[i] = Integer.toString(secondaryData[i-1]);	
					}
					csvTable.add(row);
					rowCount++;
				}
			}
			
			while(rowCount++ < 3) {
				csvTable.add(new String[columnCount]);
			}
			
			int metaDataColumn = queryDefinition.getQuestionOptionCount() + 2;
			csvTable.get(0)[metaDataColumn] = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "pageTitle");
			csvTable.get(1)[metaDataColumn] = queryDefinition.getPerspectiveShortText() + ":";
			csvTable.get(1)[metaDataColumn+1] = queryDefinition.getPerspectiveFullText();
			csvTable.get(2)[metaDataColumn] = queryDefinition.getQuestionShortText() + ":";
			csvTable.get(2)[metaDataColumn+1] = queryDefinition.getQuestionFullText();
			
			
			// write response
			try (PrintWriter respWriter = new PrintWriter(new OutputStreamWriter(response.getOutputStream(), "UTF8"), true);
					CSVWriter csvWriter = new CSVWriter(respWriter);) {
				
				response.setContentType("text/csv; charset=UTF-8");
				
				csvWriter.writeAll(csvTable);
				csvWriter.close();
				response.setStatus(HttpServletResponse.SC_OK);
			} catch (IOException e) {
				throw new InternalServerException("Failed to write csv response", e);
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
	
	public static void clearServletCache() {
		metadataMap.clear();
	}
}

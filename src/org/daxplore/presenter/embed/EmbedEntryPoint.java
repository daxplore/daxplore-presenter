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
package org.daxplore.presenter.embed;

import java.util.LinkedList;

import org.daxplore.presenter.chart.data.QueryResultCount;
import org.daxplore.presenter.chart.data.QueryResultCountCompare;
import org.daxplore.presenter.chart.display.BarChart;
import org.daxplore.presenter.chart.display.BarChartCompare;
import org.daxplore.presenter.chart.display.ChartFactory;
import org.daxplore.presenter.chart.display.GChartChart;
import org.daxplore.presenter.client.json.shared.QueryData;
import org.daxplore.presenter.embed.inject.EmbedInjector;
import org.daxplore.presenter.shared.EmbedDefinition;
import org.daxplore.presenter.shared.EmbedDefinition.EmbedFlag;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.GWT;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.RootPanel;

/**
 * Entry point for the embed view, which is used to embed charts in other sites
 * or to show a chart in a printer-friendly mode.
 * 
 * <p>An instance of this class is created automatically by GWT when used from
 * a html page.</p>
 * 
 * <p>This entry point creates a page that only contains the chart as defined
 * by the URL. The section after the # is interpreted as a
 * {@link QueryDefinition} restore string.</p>
 * 
 * <p>Used together with Embed.gwt.xml and either embed or print templates.</p>
 */
public class EmbedEntryPoint implements EntryPoint {
	private final EmbedInjector injector = GWT.create(EmbedInjector.class);

	/**
	 * This is the entry point method. It is automatically called by GWT to
	 * create the embed web page.
	 */
	@Override
	public void onModuleLoad() {
		QuestionMetadata questions = injector.getQuestions();
		String queryString = Window.Location.getParameter("q");
		QueryDefinition queryDefinition = new QueryDefinition(questions, queryString);
		ChartFactory chartFactory = injector.getChartFactory();

		String href = Window.Location.getHref();
		EmbedDefinition embedDefinition;
		if (href.contains("#")) {
			String base64 = href.substring(href.lastIndexOf("#") + 1);
			embedDefinition = new EmbedDefinition(base64);
		} else {
			LinkedList<EmbedFlag> emptyDefaultList = new LinkedList<EmbedFlag>();
			embedDefinition = new EmbedDefinition(emptyDefaultList);
		}

		try {
			QueryData queryData = QueryData.getEmbeddedData();
			GChartChart chart;
			boolean printMode = embedDefinition.hasFlag(EmbedFlag.PRINT);
			if (!queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
				chart = chartFactory.createBarChart(queryDefinition, printMode);
				((BarChart)chart).addData(new QueryResultCount(queryData.getDataItems(), queryData.getTotalDataItem()));
			} else {
				chart = chartFactory.createBarChartCompare(queryDefinition, printMode);
				((BarChartCompare)chart).addData(new QueryResultCountCompare(queryData.getDataItems(), queryData.getTotalDataItem()));
			}
			EmbedView embedView = new EmbedView(chart, Window.getClientWidth(),
					Window.getClientHeight(), embedDefinition);
			RootPanel.get().add(embedView);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}

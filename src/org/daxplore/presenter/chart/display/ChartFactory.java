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
package org.daxplore.presenter.chart.display;

import org.daxplore.presenter.chart.resources.ChartConfig;
import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.client.json.shared.UITexts;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.inject.Inject;

/**
 * A factory for creating Chart objects.
 */
public class ChartFactory {
	private final ChartTexts chartTexts;
	private final ChartConfig chartConfig;
	private final UITexts uiTexts;

	/**
	 * Instantiates a new chart factory.
	 * 
	 */
	@Inject
	protected ChartFactory(ChartTexts chartTexts, ChartConfig chartConfig, UITexts uiTexts) {
		this.chartTexts = chartTexts;
		this.chartConfig = chartConfig;
		this.uiTexts = uiTexts;
	}

	/**
	 * Creates a new BarChart.
	 * 
	 * @return the chart
	 */
	public BarChart createBarChart(QueryDefinition queryDefinition, boolean printerMode) {
		return new BarChart(chartTexts, chartConfig, uiTexts, queryDefinition, printerMode);
	}

	/**
	 * Creates a new BarChartCompare.
	 * 
	 * @return the chart
	 */
	public BarChartCompare createBarChartCompare(QueryDefinition queryDefinition, boolean printerMode) {
		return new BarChartCompare(chartTexts, chartConfig, uiTexts, queryDefinition, printerMode);
	}

	/**
	 * Creates a new MeanChart.
	 * 
	 * @return the chart
	 */
	public MeanChart createMeanChart(QueryDefinition queryDefinition, boolean printerMode) {
		return new MeanChart(chartTexts, chartConfig, uiTexts, queryDefinition, printerMode);
	}
}

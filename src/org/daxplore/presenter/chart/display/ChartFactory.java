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

import org.daxplore.presenter.chart.QueryInterface;
import org.daxplore.presenter.chart.resources.ChartConfig;
import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.shared.PrefixProperties;

import com.google.inject.Inject;

/**
 * A factory for creating Chart objects.
 */
public class ChartFactory {
	protected final ChartTexts chartTexts;
	protected final ChartConfig chartConfig;
	protected final PrefixProperties prefixProperties;

	/**
	 * Instantiates a new chart factory.
	 * 
	 * @param chartTexts
	 *            the chart texts
	 * @param chartConfig
	 *            the chart config
	 */
	@Inject
	protected ChartFactory(ChartTexts chartTexts, ChartConfig chartConfig, PrefixProperties prefixProperties) {
		this.chartTexts = chartTexts;
		this.chartConfig = chartConfig;
		this.prefixProperties = prefixProperties;
	}

	/**
	 * Creates a new BarChart.
	 * 
	 * @param query
	 *            the query
	 * @param printerMode
	 *            the printer mode
	 * @return the chart
	 */
	public BarChart createBarChart(QueryInterface query, boolean printerMode) {
		return new BarChart(chartTexts, chartConfig, prefixProperties, query, printerMode);
	}

	/**
	 * Creates a new BarChartCompare.
	 * 
	 * @param query
	 *            the query
	 * @param printerMode
	 *            the printer mode
	 * @return the chart
	 */
	public BarChartCompare createBarChartCompare(QueryInterface query, boolean printerMode) {
		return new BarChartCompare(chartTexts, chartConfig, prefixProperties, query, printerMode);
	}

	/**
	 * Creates a new MeanChart.
	 * 
	 * @param query
	 *            the query
	 * @param printerMode
	 *            the printer mode
	 * @return the chart
	 */
	public MeanChart createMeanChart(QueryInterface query, boolean printerMode) {
		return new MeanChart(chartTexts, chartConfig, prefixProperties, query, printerMode);
	}

	/**
	 * Creates a new MeanChartCompare.
	 * 
	 * @param query
	 *            the query
	 * @param printerMode
	 *            the printer mode
	 * @return the chart
	 */
	public MeanChartCompare createMeanChartCompare(QueryInterface query, boolean printerMode) {
		return new MeanChartCompare(chartTexts, chartConfig, prefixProperties, query, printerMode);
	}
}

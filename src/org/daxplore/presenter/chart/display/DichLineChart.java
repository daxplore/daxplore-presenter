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

import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.SharedTools;

import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.Widget;

/**
 * A chart type for displaying a line chart of dichotomized values.
 */
public class DichLineChart extends SimplePanel implements Chart {
	private QueryDefinition queryDefinition;
	private ExternalHeader externalHeader;
	private ExternalLegend externalLegend;
	private String statJson;
	private String selectedOptionsJson;

	protected DichLineChart(ChartTexts chartTexts, QueryDefinition queryDefinition, boolean printerMode) {
		this.queryDefinition = queryDefinition;
		
		selectedOptionsJson = "[" + SharedTools.join(queryDefinition.getUsedPerspectiveOptions(), ",") + "]";
		
		externalHeader = new ExternalHeader(chartTexts, queryDefinition);
		externalLegend = new ExternalLegend(chartTexts, queryDefinition, printerMode);
		
		setStylePrimaryName("line-chart-panel");
	}

	/** 
	 * {@inheritDoc}
	 */
	@Override
	public void setChartSizeSmart(int width, int height) {
		// TODO Auto-generated method stub
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getMinWidth() {
		// TODO Auto-generated method stub
		return 0;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public ExternalLegend getExternalLegend() {
		return externalLegend;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Widget getExternalHeader() {
		return externalHeader;
	}

	/**
	 * @param queryData
	 */
	public void addData(QueryData queryData) {
		statJson = queryData.getJson();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	protected void onAttach() {
		super.onAttach();
		generateDichTimeLineChart(selectedOptionsJson, statJson);
	}
	
	protected native void generateDichTimeLineChart(String selectedOptions, String json) /*-{
		$wnd.generateDichTimeLineChart(JSON.parse(selectedOptions), json);
	}-*/;
}
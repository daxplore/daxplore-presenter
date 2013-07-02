/**
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.chart;

import org.daxplore.presenter.chart.data.QueryResultCount;
import org.daxplore.presenter.chart.data.QueryResultCountCompare;
import org.daxplore.presenter.chart.display.BarChart;
import org.daxplore.presenter.chart.display.BarChartCompare;
import org.daxplore.presenter.chart.display.BlankChart;
import org.daxplore.presenter.chart.display.ChartFactory;
import org.daxplore.presenter.client.event.QueryReadyEvent;
import org.daxplore.presenter.client.event.QueryReadyHandler;
import org.daxplore.presenter.client.json.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

public class ChartPanelPresenter implements QueryReadyHandler {
	private ChartFactory chartFactory;
	private ChartPanelView view;
	
	@Inject
	public ChartPanelPresenter(EventBus eventBus, ChartFactory chartFactory, ChartPanelView view) {
		this.chartFactory = chartFactory;
		this.view = view;
		view.setChart(new BlankChart());
		QueryReadyEvent.register(eventBus, this);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryReady(QueryReadyEvent event) {
		QueryDefinition queryDefinition = event.getQueryDefinition();
		QueryData queryData = event.getQueryData();
		
		if (!queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
			BarChart chart = chartFactory.createBarChart(queryDefinition, false);
			QueryResultCount result = new QueryResultCount(queryData.getDataItems(), queryData.getTotalDataItem());
			chart.addData(result);
			view.setChart(chart);
		} else {
			BarChartCompare chart = chartFactory.createBarChartCompare(queryDefinition, false);
			QueryResultCountCompare result = new QueryResultCountCompare(queryData.getDataItems(), queryData.getTotalDataItem());
			chart.addData(result);
			view.setChart(chart);
		}
	}
	
	public ChartPanelView getView() {
		return view;
	}
}

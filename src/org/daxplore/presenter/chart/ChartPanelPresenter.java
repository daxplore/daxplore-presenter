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

import org.daxplore.presenter.chart.display.BarChart;
import org.daxplore.presenter.chart.display.BarChartCompare;
import org.daxplore.presenter.chart.display.BlankChart;
import org.daxplore.presenter.chart.display.Chart;
import org.daxplore.presenter.chart.display.ChartFactory;
import org.daxplore.presenter.chart.display.MeanChart;
import org.daxplore.presenter.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

import com.google.gwt.user.client.ui.Widget;
import com.google.inject.Inject;

public class ChartPanelPresenter  {
	private ChartFactory chartFactory;
	private ChartPanelView view;
	private Chart chart;
	
	@Inject
	public ChartPanelPresenter(ChartFactory chartFactory, ChartPanelView view) {
		this.chartFactory = chartFactory;
		this.view = view;
		view.setChart(new BlankChart());
	}

	public void onQueryReady(QueryDefinition queryDefinition, QueryData queryData) {
		if(!queryDefinition.hasFlag(QueryFlag.MEAN)) {
			if (!queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
				BarChart newChart = chartFactory.createBarChart(queryDefinition, false);
				newChart.addData(queryData);
				view.setChart(newChart);
				chart = newChart;
			} else {
				BarChartCompare newChart = chartFactory.createBarChartCompare(queryDefinition, false);
				newChart.addData(queryData);
				view.setChart(newChart);
				chart = newChart;
			}
		} else {
			if (!queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
				MeanChart newChart = chartFactory.createMeanChart(queryDefinition, false);
				newChart.addData(queryData);
				view.setChart(newChart);
				chart = newChart;
			} else {
				//TODO mean compare
			}
		}
		
		/*if(!queryDefinition.hasFlag(QueryFlag.MEAN)) {
			if (!queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
				BarChart newChart = chartFactory.createBarChart(queryDefinition, false);
				newChart.addData(queryData);
				view.setChart(newChart);
				chart = newChart;
			} else {
				BarChartCompare newChart = chartFactory.createBarChartCompare(queryDefinition, false);
				newChart.addData(queryData);
				view.setChart(newChart);
				chart = newChart;
			}
		} else {
			if (!queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
				MeanChart newChart = chartFactory.createMeanChart(queryDefinition, false);
				newChart.addData(queryData);
				view.setChart(newChart);
				chart = newChart;
			} else {
				//TODO
			}
		}*/
	}
	
	public ChartPanelView getView() {
		return view;
	}
	
	public Widget getExternalLegend() {
		return chart.getExternalLegend();
	}
}

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

import org.daxplore.presenter.chart.display.BarColors;
import org.daxplore.presenter.chart.display.Chart;
import org.daxplore.presenter.chart.display.ChartFactory;
import org.daxplore.presenter.chart.display.ExternalLegend;
import org.daxplore.presenter.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.SharedTools;

import com.google.inject.Inject;

public class ChartPanelPresenter  {
	private ChartFactory chartFactory;
	private ChartPanelView view;
	private Chart chart;
	
	@Inject
	public ChartPanelPresenter(ChartPanelView view) {
//		this.chartFactory = chartFactory;
		this.view = view;
//		view.setChart(new BlankChart());
	}

	public void onQueryReady(QueryDefinition queryDefinition, QueryData queryData) {
		
		QueryFlag chartType = QueryFlag.NULL;
		chartType = queryDefinition.hasFlag(QueryFlag.FREQUENCY) ? QueryFlag.FREQUENCY : chartType;
		chartType = queryDefinition.hasFlag(QueryFlag.MEAN) ? QueryFlag.MEAN : chartType;
		chartType = queryDefinition.hasFlag(QueryFlag.DICHOTOMIZED) ? QueryFlag.DICHOTOMIZED : chartType;
		
		String selectedChart = chartType.name();
		String statJson = queryData.getJson();
		String selectedOptionsJson = "[" + SharedTools.join(queryDefinition.getUsedPerspectiveOptions(), ",") + "]";
		
		setQueryDefinitionNative(selectedChart, statJson, selectedOptionsJson);
		
//		List<QueryFlag> chartTabs = new LinkedList<>();
//		
//		String questionID = queryDefinition.getQuestionID();
//		if (questionMetadata.useFreqChart(questionID)) {
//			chartTabs.add(QueryFlag.FREQUENCY);
//		}
//		if (questionMetadata.useMeanChart(questionID)) {
//			chartTabs.add(QueryFlag.MEAN);
//		}
//		if (questionMetadata.useDichotomizedChart(questionID)) {
//			chartTabs.add(QueryFlag.DICHOTOMIZED);
//		}
//		

//		
//		QueryFlag timepoints = QueryFlag.NULL;
//		timepoints = queryDefinition.hasFlag(QueryFlag.TIMEPOINTS_ONE) ? QueryFlag.TIMEPOINTS_ONE : chartType;
//		timepoints = queryDefinition.hasFlag(QueryFlag.TIMEPOINTS_TWO) ? QueryFlag.TIMEPOINTS_TWO : chartType;
//		timepoints = queryDefinition.hasFlag(QueryFlag.TIMEPOINTS_ALL) ? QueryFlag.TIMEPOINTS_ALL : chartType;
//		
//		switch (chartType) {
//		case FREQUENCY:
//			switch (timepoints) {
//			case TIMEPOINTS_ONE:
//				BarChart barChart = chartFactory.createBarChart(queryDefinition, false);
//				barChart.addData(queryData);
//				view.setChart(barChart);
//				chart = barChart;
//				break;
//			case TIMEPOINTS_TWO:
//				BarChartCompare barChartCompare = chartFactory.createBarChartCompare(queryDefinition, false);
//				barChartCompare.addData(queryData);
//				view.setChart(barChartCompare);
//				chart = barChartCompare;
//				break;
//			case TIMEPOINTS_ALL:
//				// TODO show multiple timepoints frequency chart
//				break;
//				//$CASES-OMITTED$
//			default:
//				// TODO handle invalid combination
//				break;
//			}
//			break;
//		case MEAN:
//			switch (timepoints) {
//			case TIMEPOINTS_ONE:
//				MeanChart meanChart = chartFactory.createMeanChart(queryDefinition, false);
//				meanChart.addData(queryData);
//				view.setChart(meanChart);
//				chart = meanChart;
//				break;
//			case TIMEPOINTS_TWO:
//				// TODO add options two bar comparison for mean chart?
//				// currently: fall through to TIMEPOINTS_ALL
//			case TIMEPOINTS_ALL:
//				// TODO add mean lines over time, probably based on dichline
//				break;
//				//$CASES-OMITTED$
//			default:
//				// TODO handle invalid combination
//				break;
//			}
//			break;
//		case DICHOTOMIZED:
//			DichLineChart dichLineChart = chartFactory.createDichLineChart(queryDefinition, false);
//			dichLineChart.addData(queryData);
//			view.setChart(dichLineChart);
//			chart = dichLineChart;
//			break;
//			//$CASES-OMITTED$
//		default:
//			// TODO handle invalid combination
//			break;
//		
//		}
	}
	
	public ChartPanelView getView() {
		return view;
	}
	
	public ExternalLegend getExternalLegend() {
		// TODO figure out how to handle legends
		return ExternalLegend.getEmptyLegend();
//		return chart.getExternalLegend();
	}

	/**
	 * @return
	 */
	public QueryFlag getSelectedChartType() {
		// TODO look at selected tab
		return QueryFlag.DICHOTOMIZED;
	}
	
	protected native void setQueryDefinitionNative(String selectedChart, String statJson, String selectedOptionsJson) /*-{
		$wnd.chartSetQueryDefinition(selectedChart, statJson, selectedOptionsJson);
	}-*/;
}

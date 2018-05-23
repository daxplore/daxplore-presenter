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

import java.util.LinkedList;
import java.util.List;

import org.daxplore.presenter.chart.display.Chart;
import org.daxplore.presenter.chart.display.ExternalLegend;
import org.daxplore.presenter.client.event.SelectionUpdateEvent;
import org.daxplore.presenter.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.SharedTools;

import com.google.gwt.event.logical.shared.ResizeEvent;
import com.google.gwt.event.logical.shared.ResizeHandler;
import com.google.gwt.user.client.Window;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

public class ChartPanelPresenter implements ResizeHandler {
	private final EventBus eventBus;
	private Chart chart;
	
	@Inject
	public ChartPanelPresenter(EventBus eventBus) {
		this.eventBus = eventBus;
		exportChartPanelCallback();
	}

	public void onQueryReady(QueryDefinition queryDefinition, QueryData queryData) {
		
		Window.addResizeHandler(this);
	
		QueryFlag chartType = QueryFlag.NULL;
		chartType = queryDefinition.hasFlag(QueryFlag.FREQUENCY) ? QueryFlag.FREQUENCY : chartType;
		chartType = queryDefinition.hasFlag(QueryFlag.MEAN) ? QueryFlag.MEAN : chartType;
		chartType = queryDefinition.hasFlag(QueryFlag.DICHOTOMIZED) ? QueryFlag.DICHOTOMIZED : chartType;
		
		QueryFlag timepoints = QueryFlag.NULL;
		timepoints = queryDefinition.hasFlag(QueryFlag.TIMEPOINTS_ONE) ? QueryFlag.TIMEPOINTS_ONE : timepoints;
		timepoints = queryDefinition.hasFlag(QueryFlag.TIMEPOINTS_TWO) ? QueryFlag.TIMEPOINTS_TWO : timepoints;
		timepoints = queryDefinition.hasFlag(QueryFlag.TIMEPOINTS_ALL) ? QueryFlag.TIMEPOINTS_ALL : timepoints;
		
		String statJson = queryData.getJson();
		String selectedOptionsJson = "[" + SharedTools.join(queryDefinition.getUsedPerspectiveOptions(), ",") + "]";
		
		String dichSubtitle = "";
		if (chartType == QueryFlag.DICHOTOMIZED) {
			List<String> optionTexts = queryDefinition.getQuestionOptionTexts();
			List<String> usedDichTexts = new LinkedList<>();
			for (Integer i : queryDefinition.getDichotomizedSelectedOptions()) {
				usedDichTexts.add(optionTexts.get(i));
			}
			dichSubtitle = "";//uiTexts.dichotomizedSubtitle(usedDichTexts);
		}
		
		setQueryDefinitionNative(chartType.name(), timepoints.name(), statJson, selectedOptionsJson, dichSubtitle);
	}
	
	public QueryFlag getSelectedChartType() {
		return QueryFlag.valueOf(getSelectedTabNative());
	}
	
	protected native String getSelectedTabNative() /*-{
		return $wnd.getSelectedTab();
	}-*/;

	public ExternalLegend getExternalLegend() {
		// TODO figure out how to handle legends
		return ExternalLegend.getEmptyLegend();
//		return chart.getExternalLegend();
	}

	
	protected native void setQueryDefinitionNative(String chartType, String timepoints, String statJson, String selectedOptionsJson, String dichSubtitle) /*-{
		$wnd.chartSetQueryDefinition(chartType, timepoints, JSON.parse(statJson), JSON.parse(selectedOptionsJson), dichSubtitle);
	}-*/;

	protected void gwtChartPanelCallback() {
		eventBus.fireEvent(new SelectionUpdateEvent());
	}

	protected native void exportChartPanelCallback() /*-{
		var that = this;
		$wnd.gwtChartPanelCallback = $entry(function() {
			that.@org.daxplore.presenter.chart.ChartPanelPresenter::gwtChartPanelCallback()();
		});
	}-*/;

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onResize(ResizeEvent event) {
		updateChartSize();
	}
	
	protected native void updateChartSize() /*-{
		$wnd.updateChartPanelSize();
	}-*/;
	
}

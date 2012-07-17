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
package org.daxplore.presenter.chart;

import java.util.List;

import org.daxplore.presenter.chart.display.BlankChart;
import org.daxplore.presenter.chart.display.Chart;
import org.daxplore.presenter.chart.display.ChartFactory;
import org.daxplore.presenter.chart.resources.ChartConfig;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

import com.google.gwt.core.client.GWT;
import com.google.gwt.core.client.Scheduler;
import com.google.gwt.core.client.Scheduler.ScheduledCommand;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.ScrollPanel;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.VerticalPanel;
import com.google.gwt.user.client.ui.Widget;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * A wrapper panel for charts.
 * 
 * <p>When a new chart should be displayed, call the setChart method. It will
 * display the new chart, once that chart is loaded.</p>
 */
public class ChartPanel extends Composite {
	interface ChartUiBinder extends UiBinder<Widget, ChartPanel> {
	}

	private static ChartUiBinder uiBinder = GWT.create(ChartUiBinder.class);

	@UiField(provided = true)
	protected final SimplePanel headerPanel;
	@UiField(provided = true)
	protected final SimplePanel chartContainerPanel = new SimplePanel();

	@UiField(provided = true)
	protected final VerticalPanel sidebarArea;
	@UiField(provided = true)
	protected final QueryActiveAnimation queryActiveAnimation;
	@UiField(provided = true)
	protected final SimplePanel legendPanel;

	protected final ChartFactory chartFactory;
	protected EventBus eventBus;
	protected ChartConfig chartConfig;
	protected QueryInterface currentQuery;

	protected List<Widget> actionWidgetList;

	/**
	 * The chart that belongs to this panel.
	 */
	private Chart chart;

	/**
	 * Fields used to figure out and adjust the size of the chart and
	 * chartPanel.
	 */
	protected int resizeRecursions;
	protected int maxWidth, maxHeight, chartWidth, chartHeight;
	private ScrollPanel chartScrollPanel = new ScrollPanel();
	protected boolean scrolling = false, forceScrolling = false;

	@Inject
	protected ChartPanel(QueryActiveAnimation queryActiveAnimation, ChartFactory chartFactory, EventBus eventBus, ChartConfig chartConfig) {
		this.queryActiveAnimation = queryActiveAnimation;
		this.chartFactory = chartFactory;
		this.eventBus = eventBus;
		this.chartConfig = chartConfig;
		this.sidebarArea = new VerticalPanel();

		chartContainerPanel.setStylePrimaryName("daxplore-ChartContainerPanel");

		headerPanel = new SimplePanel();

		legendPanel = new SimplePanel();
		initWidget(uiBinder.createAndBindUi(this));
		setStylePrimaryName("daxplore-ChartPanel");

		maxWidth = 800; // this is temporary, the wanted value is set using
						// setMaxWidth(int width)
		maxHeight = chartConfig.chartHeight();

		setChart(new BlankChart());
	}

	/**
	 * Set a new chart to be displayed.
	 * 
	 * @param chart
	 *            The chart that should be wrapped.
	 */
	protected void setChart(Chart chart) {
		if (chart.isReady()) {
			chartSwitchCallback(chart);
		} else {
			chart.setCallback(this);
		}
	}

	/**
	 * A callback function called by the chart, when it is ready to be drawn.
	 * 
	 * @param chart
	 *            The new chart to display.
	 */
	public void chartSwitchCallback(Chart chart) {
		headerPanel.setWidget(chart.getExternalHeader());
		legendPanel.setWidget(chart.getExternalLegend());
		if (scrolling) {
			chartScrollPanel.setWidget(chart);
		} else {
			chartContainerPanel.setWidget(chart);
		}
		this.chart = chart;
		adjustSizeRecursively();
	}

	/**
	 * Set the maximal allowed size of the chart panel, and in turn the chart.
	 * 
	 * <p>This is not guaranteed to result in the given width due to limitations
	 * in HTML layout and how GChart works internally.</p>
	 * 
	 * @param width
	 *            The wanted with of this ChartPanel.
	 */
	public void setMaxWidth(int width) {
		maxWidth = width;
		adjustSizeRecursively();
	}

	/**
	 * Try to adjust the size of the chartPanel, based on maxWidth and
	 * maxHeight.
	 * 
	 * <p>The size will automatically be updated and adjusted in a number of
	 * iterations. This is needed because the browser must draw the panel before
	 * its size can be calculated.</p>
	 */
	protected void adjustSizeRecursively() {
		resizeRecursions = 0;
		forceScrolling = false;
		adjustSizeRecursivelySub();
	}

	/**
	 * A recursive subprocess started by adjustSizeRecursively. <b>Do not call
	 * this method directly!</b>
	 * 
	 * <p>Adjusts the size of the chart based on the chart panel's actual size
	 * (reported by the browser). Puts the chart in a scrollPanel if the chart
	 * is too wide.</p>
	 * 
	 * <p>The method calls itself repeatedly until a correct size has been
	 * found.</p>
	 */
	protected void adjustSizeRecursivelySub() {
		int actualWidth = getOffsetWidth();
		int actualHeight = chartContainerPanel.getOffsetHeight() + headerPanel.getOffsetHeight();
		int diffWidth = maxWidth - actualWidth;
		int diffHeight = maxHeight - actualHeight;

		if (chart == null || (resizeRecursions != 0 && actualWidth == maxWidth && actualHeight == maxHeight) || (resizeRecursions != 0 && diffWidth == 0 && diffHeight == 0)) {
			return;
		}

		chartWidth += diffWidth;
		chartWidth = Math.max(0, chartWidth);

		chartHeight += diffHeight;
		chartHeight = Math.max(0, chartHeight);

		if (chartWidth < chart.getMinWidth() || forceScrolling) {
			if (!scrolling) {
				chartContainerPanel.setWidget(chartScrollPanel);
				chartScrollPanel.setWidget(chart);
				scrolling = true;
				forceScrolling = true;
			}
			chartScrollPanel.setSize(chartWidth + "px", chartHeight + "px");
			chart.setChartSizeSmart(chart.getMinWidth(), chartHeight - 40);
		} else if (chartWidth >= chart.getMinWidth()) {
			if (scrolling) {
				chartContainerPanel.setWidget(chart);
				scrolling = false;
			}
			chart.setChartSizeSmart(chartWidth, chartHeight);
		}

		resizeRecursions++;
		if (resizeRecursions < 10) {
			Scheduler.get().scheduleFinally(new ScheduledCommand() {
				@Override
				public void execute() {
					adjustSizeRecursivelySub();
				}
			});
		}
	}

	/**
	 * Send in a new query that is used to generate a new chart.
	 * 
	 * @param query
	 *            the new data
	 */
	public void setData(QueryInterface query) {
		currentQuery = query;
		if (chart != null) {
			chart.cancelLoading();
		}
		QueryDefinition queryDefinition = query.getDefinition();
		if (queryDefinition.hasFlag(QueryFlag.SECONDARY)) {
			if (queryDefinition.hasFlag(QueryFlag.MEAN)) {
				chart = chartFactory.createMeanChartCompare(query, false);
			} else {
				chart = chartFactory.createBarChartCompare(query, false);
			}
		} else {
			if (queryDefinition.hasFlag(QueryFlag.MEAN)) {
				chart = chartFactory.createMeanChart(query, false);
			} else {
				chart = chartFactory.createBarChart(query, false);
			}
		}
		setChart(chart);
	}

	/**
	 * Sets widgets used to interact with the chart.
	 * 
	 * @param actionWidgetList
	 *            the new action widgets
	 */
	public void setActionWidgets(List<Widget> actionWidgetList) {
		if (this.actionWidgetList != null) {
			for (Widget actionWidget : this.actionWidgetList) {
				sidebarArea.remove(actionWidget);
			}
		}
		int i = 1;
		for (Widget actionWidget : actionWidgetList) {
			sidebarArea.insert(actionWidget, i);
			i++;
		}
		this.actionWidgetList = actionWidgetList;
	}
}

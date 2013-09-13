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

import org.daxplore.presenter.chart.display.ExternalHeader;
import org.daxplore.presenter.chart.display.ExternalLegend;
import org.daxplore.presenter.chart.display.GChartChart;
import org.daxplore.presenter.shared.EmbedDefinition;
import org.daxplore.presenter.shared.EmbedDefinition.EmbedFlag;

import com.google.gwt.core.client.GWT;
import com.google.gwt.core.client.Scheduler;
import com.google.gwt.core.client.Scheduler.ScheduledCommand;
import com.google.gwt.resources.client.CssResource;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.FlowPanel;
import com.google.gwt.user.client.ui.HorizontalPanel;
import com.google.gwt.user.client.ui.ScrollPanel;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.VerticalPanel;
import com.google.gwt.user.client.ui.Widget;

/**
 * The EmbedView is the base widget for the Daxplore embed mode.
 * 
 * <p>It contains all the components that make up the chart and
 * (possibly) other UI-elements. It handles resizing of all
 * it's sub-widgets if the window is resized.</p>
 */
public class EmbedView extends Composite {
	interface EmbedBinderUiBinder extends UiBinder<Widget, EmbedView> {}
	private static EmbedBinderUiBinder uiBinder = GWT.create(EmbedBinderUiBinder.class);
	
	@UiField(provided=true)
	protected final HorizontalPanel main = new HorizontalPanel();
	@UiField(provided=true)
	protected final VerticalPanel chartArea = new VerticalPanel();
	
	@UiField(provided=true)
	protected final ExternalHeader header;
	@UiField(provided = true)
	protected final SimplePanel chartContainerPanel = new SimplePanel();
	
	@UiField
	protected EmbedStyle style;
	
	private final GChartChart chart;
	
	/**
	 * Fields used to figure out and adjust the size of the chart and chartPanel.
	 */
	private int resizeRecursions;
	private int maxWidth, maxHeight;
	private ScrollPanel chartScrollPanel = new ScrollPanel();
	private boolean scrolling = false, forceScrolling = false;
	
	
	private interface EmbedStyle extends CssResource {
		String transparent();
		String opaque();
	}

	/**
	 * Instantiates a new embed view.
	 * 
	 * @param chart
	 *            the chart
	 * @param width
	 *            the width
	 * @param height
	 *            the height
	 * @param embedDefinition
	 *            the embed definition
	 */
	public EmbedView(GChartChart chart, int width, int height, EmbedDefinition embedDefinition) {
		this.chart = chart;
		maxWidth = width;
		maxHeight = height;
		this.header = chart.getExternalHeader();
		initWidget(uiBinder.createAndBindUi(this));
		
		if(embedDefinition.hasFlag(EmbedFlag.LEGEND)){
			/* 
			 * Make the legend vertically aligned centrally using "Method 1"
			 * from http://blog.themeforest.net/tutorials/vertical-centering-with-css/
			 */
			ExternalLegend legend = chart.getExternalLegend();
			legend.addStyleName("EmbedView-legend");
			
			SimplePanel cell = new SimplePanel();
			cell.setStyleName("EmbedView-cell");
			cell.add(legend);
			
			FlowPanel sidebar = new FlowPanel();
			sidebar.addStyleName("EmbedView-sidebarArea");
			sidebar.setHeight(height+"px");
			sidebar.add(cell);

			main.add(sidebar);
		}
		
		if (embedDefinition.hasFlag(EmbedFlag.TRANSPARENT)) {
			main.getElement().addClassName(style.transparent());
		} else {
			main.getElement().addClassName(style.opaque());
		}

		Scheduler.get().scheduleFinally(new ScheduledCommand() {
			@Override
			public void execute() {
				addChart();
			}
		});
	}

	/**
	 * Add the chart to the page.
	 * 
	 * <p>Tries to adjust the size of the chart so that it will fit properly.
	 * The chart will be wrapped in a scrollpanel if necessary.</p>
	 */
	private void addChart() {
		int width = maxWidth - chart.getExternalLegend().getOffsetWidth() - 30;
		int height = maxHeight - chart.getExternalHeader().getOffsetHeight() - 30;
		if (width < chart.getMinWidth()) {
			chartContainerPanel.setWidget(chartScrollPanel);
			chartScrollPanel.setWidget(chart);
			if (chart.getExternalHeader().getOffsetWidth() > width) {
				width = chart.getExternalHeader().getOffsetWidth();
			}
			chartScrollPanel.setSize(width + "px", height + "px");
			chart.setChartSizeSmart(chart.getMinWidth(), height - 40);
		} else {
			chartContainerPanel.setWidget(chart);
			chart.setChartSizeSmart(width, height);
		}
	}

}

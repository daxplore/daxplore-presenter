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

import org.daxplore.presenter.chart.ChartPanel;
import org.daxplore.presenter.chart.ChartTools;
import org.daxplore.presenter.chart.QueryInterface;
import org.daxplore.presenter.chart.resources.ChartConfig;
import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.gwt.dom.client.Style.Position;
import com.googlecode.gchart.client.GChart;

/**
 * An abstract chart class. All other charts extend this class.
 */
public abstract class GChartChart extends GChart implements Chart {

	protected final ChartTexts chartTexts;

	protected QueryDefinition queryDefinition;

	/**
	 * Keeps track of the ready status of the chart.
	 * 
	 * <p>When the chart is ready type filter textto be drawn, this will be set
	 * to true.</p>
	 */
	private boolean ready = false;

	/**
	 * If the chart no longer should be drawn, set canceled to true.
	 */
	private boolean canceled = false;

	/**
	 * The panel that this chart belongs to.
	 * 
	 * <p>When the chart is ready to be drawn, it will add itself to this
	 * panel.</p>
	 */
	private ChartPanel callbackPanel;

	/**
	 * A widget containing a legend for the chart, that can be placed anywhere.
	 */
	protected ExternalLegend externalLegend;

	/**
	 * A widget containing a header for the chart, that can be placed anywhere.
	 */
	private ExternalHeader externalHeader;

	/**
	 * Create a new chart.
	 * 
	 * @param titleHeader
	 *            The header of the chart.
	 * @param titleDetail
	 *            The explanatory text, that is shown under the header.
	 */
	protected GChartChart(ChartTexts chartTexts, ChartConfig chartConfig, QueryInterface query) {
		this.queryDefinition = query.getDefinition();
		this.chartTexts = chartTexts;
		getElement().getStyle().setPosition(Position.RELATIVE);
		externalHeader = new ExternalHeader(chartTexts, query);
		if (ChartTools.ieVersion() > 0) {
			addStyleDependentName("IE");
		}
		this.setVisible(false);
	}

	/**
	 * Set the size of the chart.
	 * 
	 * <p>A smarter version of set size. The default set size of GChart only
	 * sets the size of the actual chart area. The smart version attempts to set
	 * the size of the entire chart, including the axes and legend.</p>
	 * 
	 * <p>The actual width and height that the chart will be given, are not
	 * guaranteed to match the given width and height. This is due to how GChart
	 * works internaly.</p>
	 * 
	 * @param width
	 *            The wanted with of the chart.
	 * @param height
	 *            The wanted height of the chart.
	 */
	public void setChartSizeSmart(int width, int height) {
		setChartSize(width, height);
		setChartSize(Math.max(2 * width - getXChartSizeDecorated() - 5, 0), Math.max(2 * height - getYChartSizeDecorated(), 0));
		update();
	}

	/**
	 * Get a color set, corresponding to a specific part of a chart.
	 * 
	 * <p>Use the a color set to color a specific part of the chart. There is a
	 * predefined set of colors that can be used. Any number can be given, but
	 * it is recommended that you start with color number 0 and count upwards
	 * from there. If you pick colors in sequence, you will eventually get back
	 * to the first color again (according to modulu operations).</p>
	 * 
	 * @param index
	 *            A number, to which the corresponding color set will be
	 *            returned.
	 * @return The set of colors corresponding to the given number.
	 */
	protected static BarColors getColorSet(int index) {
		return BarColors.getChartColorSet(index);
	}

	/**
	 * Is this chart ready to be drawn?
	 * 
	 * @return True if the chart is ready to be drawn, otherwise false.
	 */
	public boolean isReady() {
		return ready;
	}

	/**
	 * When the chart is ready to be drawn, call this method.
	 * 
	 * <p>By this time, everything should be ready. Including axes, the legend
	 * and all the data to be included.</p>
	 */
	protected void setReady() {
		if (!canceled) {
			update();
			this.setVisible(true);
			ready = true;
			if (callbackPanel != null) {
				callbackPanel.chartSwitchCallback(this);
			}
		}
	}

	/**
	 * Set the panel to draw this chart in.
	 * 
	 * <p>When the chart is ready to be drawn, it will draw itself in this
	 * panel.</p>
	 * 
	 * @param chartPanel
	 *            the new callback
	 */
	public void setCallback(ChartPanel chartPanel) {
		callbackPanel = chartPanel;
	}

	/**
	 * Cancel the loading of the chart.
	 * 
	 * <p>If the chart should no longer be drawn but is still loading, call this
	 * method.</p>
	 */
	public void cancelLoading() {
		canceled = true;
	}

	/**
	 * Get the minimum pixel width a chart can have.
	 * 
	 * @return the minimum pixel width a chart can have.
	 */
	public abstract int getMinWidth();

	/**
	 * Get a widget containing a legend for the chart, that can be placed
	 * anywhere.
	 * 
	 * @return a widget containing a legend for the chart
	 */
	public ExternalLegend getExternalLegend() {
		return externalLegend;
	}

	/**
	 * Get a widget containing a header for the chart, that can be placed
	 * anywhere.
	 * 
	 * @return a widget containing a header for the chart
	 */
	public ExternalHeader getExternalHeader() {
		return externalHeader;
	}

	/**
	 * Update the position of the mouse over annotation texts.
	 */
	public abstract void updateHoverPositions();

	protected double getModelUnitInPixelsX() {
		return getXAxis().modelToPixel(1) - getXAxis().modelToPixel(0);
	}

	protected double getModelUnitInPixelsY() {
		return getYAxis().modelToPixel(1) - getYAxis().modelToPixel(0);
	}
}

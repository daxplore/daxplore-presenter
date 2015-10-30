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
import org.daxplore.presenter.client.json.shared.UITexts;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.gwt.dom.client.Style.Position;
import com.googlecode.gchart.client.GChart;

/**
 * An abstract chart class. All other charts extend this class.
 */
public abstract class GChartChart extends GChart implements Chart {

	protected final ChartTexts chartTexts;

	protected QueryDefinition queryDefinition;
	protected final UITexts uiTexts;

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
	protected GChartChart(ChartTexts chartTexts, UITexts uiTexts, QueryDefinition queryDefinition) {
		this.queryDefinition = queryDefinition;
		this.uiTexts = uiTexts;
		this.chartTexts = chartTexts;
		getElement().getStyle().setPosition(Position.RELATIVE);
		externalHeader = new ExternalHeader(chartTexts, queryDefinition);
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
	 * works internally.</p>
	 * 
	 * @param width
	 *            The wanted with of the chart.
	 * @param height
	 *            The wanted height of the chart.
	 */
	@Override
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
	 * to the first color again (according to modulo operations).</p>
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
	 * Get a widget containing a legend for the chart, that can be placed
	 * anywhere.
	 * 
	 * @return a widget containing a legend for the chart
	 */
	@Override
	public ExternalLegend getExternalLegend() {
		return externalLegend;
	}

	/**
	 * Get a widget containing a header for the chart, that can be placed
	 * anywhere.
	 * 
	 * @return a widget containing a header for the chart
	 */
	@Override
	public ExternalHeader getExternalHeader() {
		return externalHeader;
	}

	protected double getModelUnitInPixelsX() {
		return getXAxis().modelToPixel(1) - getXAxis().modelToPixel(0);
	}

	protected double getModelUnitInPixelsY() {
		return getYAxis().modelToPixel(1) - getYAxis().modelToPixel(0);
	}
	
	protected static double[] percentages(int[] data) {
		double[] percentages = new double[data.length];
		int sum = sum(data);
		for(int i=0; i<data.length; i++) {
			percentages[i] = ((double)data[i])/sum;
		}
		return percentages;
	}
	
	protected static int sum(int[] data) {
		int sum = 0;
		for(int i : data) {
			sum += i;
		}
		return sum;
	}
}

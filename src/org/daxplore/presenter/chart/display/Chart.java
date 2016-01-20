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

import com.google.gwt.user.client.ui.IsWidget;
import com.google.gwt.user.client.ui.Widget;

/**
 * An interface used to interact with all charts.
 */
public interface Chart extends IsWidget {

	/**
	 * Set the size of the chart.
	 * 
	 * <p>Used as a better option to the standard setChartSize. Added
	 * because GChart's setChartSize fails to take a number of things into
	 * account when calculating its size.</p>
	 * 
	 * @param width
	 *            the width
	 * @param height
	 *            the height
	 */
	public void setChartSizeSmart(int width, int height);

	/**
	 * Gets the minimal width that this chart can be displayed on.
	 * 
	 * <p>In a bar chart, this is based on the number of groups, the number of
	 * options in each group and the length of the tick-texts.</p>
	 * 
	 * @return the required min width
	 */
	public int getMinWidth();

	/**
	 * Get a legend widget that can be placed in a webpage outside the actual
	 * chart.
	 * 
	 * <p>Used because the built-in legend of GChart isn't good enough.</p>
	 * 
	 * @return the external legend
	 */
	public Widget getExternalLegend();

	/**
	 * Get a legend widget that can be placed in a webpage outside the actual
	 * chart.
	 * 
	 * <p>Used because the built-in header of GChart isn't good enough.</p>
	 * 
	 * @return the external header
	 */
	public Widget getExternalHeader();
}

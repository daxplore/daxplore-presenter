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
package org.daxplore.presenter.chart.resources;

import com.google.gwt.i18n.client.Constants;

/**
 * An interface that supplies chart-specific settings and constants.
 */
public interface ChartConfig extends Constants {

	/**
	 * The minimum number of respondents that a group can contain, before it is
	 * pruned from the system for privacy reasons.
	 * 
	 * @return minimum number of respondents displayed
	 */
	public int respondentCountCutoff();

	/**
	 * The maximal number of items displayed in the chart legend.
	 * 
	 * <p>If the number of legend items is higher, the rest are hidden.</p>
	 * 
	 * @return maximal number of items
	 */
	public int externalLegendItemLimit();

	/**
	 * The default height of charts, used in standard presentation mode.
	 * 
	 * <p>This is overridden by embed/print modes that depend on an external
	 * size.</p>
	 * 
	 * @return the chart height
	 */
	public int chartHeight();
}

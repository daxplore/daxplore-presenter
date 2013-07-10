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


/**
 * An interface for representing a single StatDataItem.
 * 
 * <p>This represents a piece of data that contains the answer frequencies for a
 * specific group. They can also contain a dataset for "secondary" data from a
 * different dataset.</p>
 */
public interface StatInterface {

	/**
	 * Checks if this item is matched to a specific perspective option.
	 * 
	 * <p>Otherwise it is the TotalDataItem that contains an aggregation of all
	 * data.</p>
	 * 
	 * @return true, if it is matched to a perspective option
	 */
	public boolean isNotTotalItem(); //TODO don't use double negative form

	/**
	 * Gets the perspective option.
	 * 
	 * @return the perspective option
	 */
	public int getPerspectiveOption();

	/**
	 * Check if this item has data.
	 * 
	 * <p>Otherwise the group has probably been completely pruned for privacy
	 * reasons because it was to small.</p>
	 * 
	 * @return true, if data is available
	 */
	public boolean hasData();

	/**
	 * Check if data from the secondary dataset is available.
	 * 
	 * @return true, if successful
	 */
	public boolean hasDataSecondary();

	/**
	 * Get the primary count data (frequencies) for all question options.
	 * 
	 * @return the count data
	 */
	public int[] getCountData();

	/**
	 * Gets the total population count from the primary dataset.
	 * 
	 * @return the population
	 */
	public int getPopulationCount();

	/**
	 * Gets the primary count data (frequencies) as percentages.
	 * 
	 * @return the count data as percentages
	 */
	public double[] getCountDataPercentages();

	/**
	 * Get the secondary count data (frequencies) for all question options.
	 * 
	 * @return the count data
	 */
	public int[] getCountDataSecondary();

	/**
	 * Gets the total population count from the secondary dataset.
	 * 
	 * @return the population
	 */
	public int getPopulationCountSecondary();

	/**
	 * Gets the primary count data (frequencies) as percentages.
	 * 
	 * @return the count data percentages
	 */
	public double[] getCountDataPercentagesSecondary();
}

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
package org.daxplore.presenter.shared;

/**
 * A single data item for a bar chart.
 * 
 * <p>This represents a piece of data that contains the answer frequencies for a
 * specific group. They can also contain a dataset for "secondary" data from a
 * different dataset.</p>
 */
public class ChartDataItem {
	
	private int[] primaryData, secondaryData;
	private int perspectiveOption;
	
	public ChartDataItem(int[] primaryData, int[] secondaryData, int perspectiveOption) {
		this.primaryData = primaryData;
		this.secondaryData = secondaryData;
		this.perspectiveOption = perspectiveOption;
	}
	
	/**
	 * Gets the perspective option.
	 * 
	 * @return the perspective option
	 */
	public int getPerspectiveOption() {
		return perspectiveOption;
	}

	/**
	 * Check if this item has data.
	 * 
	 * <p>Otherwise the group has probably been completely pruned for privacy
	 * reasons because it was to small.</p>
	 * 
	 * @return true, if data is available
	 */
	public boolean hasData() {
		return primaryData!=null;
	}

	/**
	 * Check if data from the secondary dataset is available.
	 * 
	 * @return true, if successful
	 */
	public boolean hasDataSecondary() {
		return secondaryData!=null;
	}

	/**
	 * Get the primary count data (frequencies) for all question options.
	 * 
	 * @return the count data
	 */
	public int[] getCountData() {
		return primaryData;
	}

	/**
	 * Gets the total population count from the primary dataset.
	 * 
	 * @return the population
	 */
	public int getPopulationCount() {
		int sum = 0;
		for(int i : primaryData) {
			sum += i;
		}
		return sum;
	}

	/**
	 * Gets the primary count data (frequencies) as percentages.
	 * 
	 * @return the count data as percentages
	 */
	public double[] getCountDataPercentages() {
		double[] percentages = new double[primaryData.length];
		int sum = getPopulationCount();
		for(int i=0; i<primaryData.length; i++) {
			percentages[i] = ((double)primaryData[i])/sum;
		}
		return percentages;
	}

	/**
	 * Get the secondary count data (frequencies) for all question options.
	 * 
	 * @return the count data
	 */
	public int[] getCountDataSecondary() {
		return secondaryData;
	}

	/**
	 * Gets the total population count from the secondary dataset.
	 * 
	 * @return the population
	 */
	public int getPopulationCountSecondary() {
		int sum = 0;
		for(int i : secondaryData) {
			sum += i;
		}
		return sum;
	}

	/**
	 * Gets the primary count data (frequencies) as percentages.
	 * 
	 * @return the count data percentages
	 */
	public double[] getCountDataPercentagesSecondary() {
		double[] percentages = new double[secondaryData.length];
		int sum = getPopulationCountSecondary();
		for(int i=0; i<secondaryData.length; i++) {
			percentages[i] = ((double)secondaryData[i])/sum;
		}
		return percentages;
	}
}

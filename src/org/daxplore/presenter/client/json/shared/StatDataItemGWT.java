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
package org.daxplore.presenter.client.json.shared;

import org.daxplore.presenter.chart.StatInterface;

public class StatDataItemGWT implements StatInterface {
	
	private int[] primaryData, secondaryData;
	private int perspectiveOption;
	
	public StatDataItemGWT(int[] primaryData, int[] secondaryData, int perspectiveOption) {
		this.primaryData = primaryData;
		this.secondaryData = secondaryData;
		this.perspectiveOption = perspectiveOption;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getPerspectiveOption() {
		return perspectiveOption;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasData() {
		return primaryData!=null;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasDataSecondary() {
		return secondaryData!=null;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int[] getCountData() {
		return primaryData;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getPopulationCount() {
		int sum = 0;
		for(int i : primaryData) {
			sum += i;
		}
		return sum;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public double[] getCountDataPercentages() {
		double[] percentages = new double[primaryData.length];
		int sum = getPopulationCount();
		for(int i=0; i<primaryData.length; i++) {
			percentages[i] = ((double)primaryData[i])/sum;
		}
		return percentages;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int[] getCountDataSecondary() {
		return secondaryData;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getPopulationCountSecondary() {
		int sum = 0;
		for(int i : secondaryData) {
			sum += i;
		}
		return sum;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public double[] getCountDataPercentagesSecondary() {
		double[] percentages = new double[secondaryData.length];
		int sum = getPopulationCountSecondary();
		for(int i=0; i<secondaryData.length; i++) {
			percentages[i] = ((double)secondaryData[i])/sum;
		}
		return percentages;
	}

}

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
package org.daxplore.presenter.chart.data;

import java.util.Arrays;
import java.util.Collection;

import org.daxplore.presenter.chart.QueryInterface;
import org.daxplore.presenter.chart.StatInterface;
import org.daxplore.presenter.chart.display.MeanChart;

/**
 * A class for storing and sending around the results from a query, that
 * asks for mean data.
 * 
 * <p>The mean result keeps track of a number of groups. For each group, it
 * stores what the average answer was in that group, the standard deviation and
 * the size of the group.</p>
 * 
 * <p>An example of how the data is represented in the arrays returned by the
 * class:<br /> If we have a question with three answers (1, 2, 3). In our group
 * 3 people answered "1", 42 people answered "2" and 9 people answered "3". The
 * mean data would be stored as: mean=2.11, standardDeviation=[some formula for
 * standard deviation], population=3+42+9=54</p>
 * 
 * <p>Mean data can be used to display a {@link MeanChart}.</p>
 * 
 * <p>For more information about the basics of query results, see
 * {@link QueryResult}.</p>
 * 
 * @see QueryInterface
 * @see QueryResult
 * @see MeanChart
 */
public class QueryResultMeanCompare extends QueryResultMean {
	private double[] averagesSecondary;
	private double[] deviationsSecondary;

	/**
	 * Build a new mean result item.
	 * 
	 * <p>The result is built up from a number of data items. Each item contains
	 * data for a specific sub-group of the total population. </p>
	 * 
	 * <p>This version of the constructor also takes a total data item. This
	 * item represents the entire population.</p>
	 * 
	 * @param dataItems
	 *            A collection of data items to be used.
	 * @param totalDataItem
	 *            The total data item. Can be set to <i>null</i>.
	 * @param query
	 *            the query
	 */
	public QueryResultMeanCompare(Collection<? extends StatInterface> dataItems, StatInterface totalDataItem, QueryInterface query) {
		super(dataItems, totalDataItem, query);

		// Please note! If the totalDataItem exists, it is placed at position 0
		// in the array
		averagesSecondary = new double[dataItems.size() + 1];
		Arrays.fill(averagesSecondary, Double.NaN);
		deviationsSecondary = new double[dataItems.size() + 1];
		Arrays.fill(deviationsSecondary, Double.NaN);

		int questionOptionCount = query.getDefinition().getQuestionOptionCount();
		for (StatInterface item : dataItems) {
			double sum = 0.0;
			int[] raw = item.getCountDataSecondary();
			for (int i = 0; i < questionOptionCount && i < raw.length; i++) {
				sum += (i + 1) * raw[i];
			}
			double avg = sum / item.getPopulationCountSecondary();
			sum = 0.0;
			for (int i = 0; i < questionOptionCount && i < raw.length; i++) {
				sum += Math.pow(((i + 1) - avg), 2) * raw[i];
			}
			double dev = Math.sqrt(sum / (item.getPopulationCountSecondary() - 1));

			averagesSecondary[item.getPerspectiveOption()] = avg;
			deviationsSecondary[item.getPerspectiveOption()] = dev;
		}
		if (totalDataItem != null) {
			double sum = 0.0;
			int[] raw = totalDataItem.getCountDataSecondary();
			for (int i = 0; i < questionOptionCount && i < raw.length; i++) {
				sum += (i + 1) * raw[i];
			}
			double avg = sum / totalDataItem.getPopulationCountSecondary();
			sum = 0.0;
			for (int i = 0; i < questionOptionCount && i < raw.length; i++) {
				sum += Math.pow(((i + 1) - avg), 2) * raw[i];
			}
			double dev = Math.sqrt(sum / (totalDataItem.getPopulationCountSecondary() - 1));

			averagesSecondary[0] = avg;
			deviationsSecondary[0] = dev;
		}

	}

	/*
	 * Methods for accessing the mean-specific data:
	 */

	/**
	 * Get the number of subjects in the group, with the given perspective
	 * option.
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return The number of subjects in this group.
	 */
	public int getPopulationSecondary(int perspectiveOption) {
		StatInterface item = getItem(perspectiveOption);
		if (item != null) {
			return item.getPopulationCountSecondary();
		}
		throw new Error("No such perspective option");
	}

	/**
	 * Get the mean answer in the group, with the given perspective option.
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return The mean answer in the selected group.
	 */
	public double getMeanSecondary(int perspectiveOption) {
		return averagesSecondary[perspectiveOption];
	};

	/**
	 * Get the standard deviation of the mean in the group, with the given
	 * perspective option.
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return Get the standard deviation of the mean in the selected group.
	 */
	public double getStandardDeviationSecondary(int perspectiveOption) {
		return deviationsSecondary[perspectiveOption];
	};

	/*
	 * Methods for accessing the total data item.
	 */

	/**
	 * Get the mean answer in the total data item group.
	 * 
	 * @return The mean answer in the total data item group.
	 */
	public double getTotalMeanSecondary() {
		if (Double.isNaN(averagesSecondary[0])) {
			throw new Error("No total data exists");
		}
		return averagesSecondary[0];
	};

	/**
	 * Get the standard deviation of the mean in the total data item group.
	 * 
	 * @return Get the standard deviation of the mean in the total data item
	 *         group.
	 */
	public double getTotalStandardDeviationSecondary() {
		if (Double.isNaN(deviationsSecondary[0])) {
			throw new Error("No total data exists");
		}
		return deviationsSecondary[0];
	};

	/**
	 * Get the number of subjects in the total data item group.
	 * 
	 * @return The number of subjects in the total item group.
	 */
	public int getTotalPopulationSecondary() {
		StatInterface totalItem = getTotalDataItem();
		if (totalItem != null) {
			return totalItem.getPopulationCountSecondary();
		}
		throw new Error("No total data exists");
	}
}

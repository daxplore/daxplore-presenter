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

import java.util.Collection;

import org.daxplore.presenter.chart.display.BarChart;
import org.daxplore.presenter.shared.ChartDataItem;

/**
 * <p>A class for storing and sending around the results from a query, that
 * asks for count data.<p>
 * 
 * <p>Count data keeps track of a number of groups. For each group, it stores
 * how many subjects have given a specific answer.</p>
 * 
 * <p>An example of how the data is represented in the arrays returned by the
 * class:<br /> If we have a question with three answers (A, B, C). In our group
 * 3 people answered A, 42 people answered B and 9 people answered C. The count
 * data would be stored as [3, 42, 9]</p>
 * 
 * <p>Count data can be used to display a {@link BarChart}.</p>
 * 
 * <p>For more information about the basics of query results, see
 * {@link QueryResult}.</p>
 * 
 * @see QueryInterface
 * @see QueryResult
 * @see BarChart
 */
public class QueryResultCount extends QueryResult {

	/**
	 * Build a new count result item.
	 * 
	 * <p>The result is built up from a number of data items. Each item contains
	 * data for a specific sub-group of the total population.</p>
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
	public QueryResultCount(Collection<? extends ChartDataItem> dataItems, ChartDataItem totalDataItem) {
		super(dataItems, totalDataItem);
	}

	/*
	 * Methods for accessing the count-specific data:
	 */

	/**
	 * Get the count data for the group with the given perspective option.
	 * 
	 * <p>The data is stored in the returned array:<br /> If we have a question
	 * with three answers (A, B, C). In our group 3 people answered A, 42 people
	 * answered B and 9 people answered C. The count data would be stored as [3,
	 * 42, 9]</p>
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return The count data for the group.
	 */
	public int[] getCountData(int perspectiveOption) {
		return getItem(perspectiveOption).getCountData();
	}

	/**
	 * Get the count data as percentages, for the group with the given
	 * perspective option.
	 * 
	 * <p>The basic data is stored in the returned array:<br /> If we have a
	 * question with three answers (A, B, C). In our group 3 people answered A,
	 * 42 people answered B and 9 people answered C. The count data would be
	 * stored as [3, 42, 9]. This is converted to percentages (0.0 to 1.0), as:
	 * [3/(3+42+9), 42/(3+42+9), 9/(3+42+9)] = [0.056, 0.778, 0.167]</p>
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return The percentage count data for the group.
	 */
	public double[] getCountDataPercentages(int perspectiveOption) {
		return getItem(perspectiveOption).getCountDataPercentages();
	}

	/**
	 * Get the number of subjects in the group, with the given perspective
	 * option.
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return The number of subjects in this group.
	 */
	public int getPopulation(int perspectiveOption) {
		ChartDataItem item = getItem(perspectiveOption);
		if (item != null) {
			return item.getPopulationCount();
		}
		throw new RuntimeException("No such perspective option");
	}

	/*
	 * Methods for accessing the total data item.
	 */

	/**
	 * Get the count data, for the total data item.
	 * 
	 * The data is stored in the returned array:<br /> If we have a question
	 * with three answers (A, B, C). In our group 3 people answered A, 42 people
	 * answered B and 9 people answered C. The count data would be stored as [3,
	 * 42, 9]
	 * 
	 * @return The count data for the total item group.
	 */
	public int[] getTotalCountData() {
		ChartDataItem totalItem = getTotalDataItem();
		if (totalItem != null) {
			return totalItem.getCountData();
		}
		throw new RuntimeException("No data exists");
	}

	/**
	 * Get the count data as percentages, for the total data item.
	 * 
	 * The basic data is stored in the returned array:<br /> If we have a
	 * question with three answers (A, B, C). In our group 3 people answered A,
	 * 42 people answered B and 9 people answered C. The count data would be
	 * stored as [3, 42, 9]. This is converted to percentages (0.0 to 1.0), as:
	 * [3/(3+42+9), 42/(3+42+9), 9/(3+42+9)] = [0.056, 0.778, 0.167]
	 * 
	 * @return The percentage count data for the total item group.
	 */
	public double[] getTotalCountDataPercentages() {
		ChartDataItem totalItem = getTotalDataItem();
		if (totalItem != null) {
			return totalItem.getCountDataPercentages();
		}
		throw new RuntimeException("No data exists");
	}

	/**
	 * Get the number of subjects in the total data item group.
	 * 
	 * @return The number of subjects in the total item group.
	 */
	public int getTotalPopulation() {
		ChartDataItem totalItem = getTotalDataItem();
		if (totalItem != null) {
			return totalItem.getPopulationCount();
		}
		throw new RuntimeException("No data exists");
	}
}

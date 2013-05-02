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

import org.daxplore.presenter.chart.QueryInterface;
import org.daxplore.presenter.chart.StatInterface;
import org.daxplore.presenter.chart.display.BarChart;
import org.daxplore.presenter.chart.display.BarChartCompare;

/**
 * A class for storing and sending around the results from a query, that asks
 * for comparative count data.
 * 
 * <p>Count data keeps track of a number of groups. For each group, it stores
 * how many subjects have given a specific answer.</p>
 * 
 * <p>In this, the comparative version of the count class, each group contains
 * two data sets. The primary data set and the secondary.</p>
 * 
 * <p>An example of how the data is represented in the arrays returned by the
 * class:<br /> If we have a question with three answers (A, B, C). In our group
 * 3 people answered A, 42 people answered B and 9 people answered C. The count
 * data would be stored as [3, 42, 9]</p>
 * 
 * <p>Comparative count data can be used to display a {@link BarChartCompare}
 * .</p>
 * 
 * <p> For more information about the basics of query results, see
 * {@link QueryResult}.</p>
 * 
 * @see QueryInterface
 * @see QueryResult
 * @see QueryResultPrimary
 * @see BarChart
 */
public class QueryResultCountCompare extends QueryResultCount {

	/**
	 * Build a new comparative count result item.
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
	public QueryResultCountCompare(Collection<? extends StatInterface> dataItems, StatInterface totalDataItem, QueryInterface query) {
		super(dataItems, totalDataItem, query);
	}

	/*
	 * Methods for accessing the count-specific data:
	 */

	/*
	 * Accessing the secondary count data.
	 */

	/**
	 * Get the secondary count data for the group with the given perspective
	 * option.</p>
	 * 
	 * <p>The data is stored in the returned array:<br /> If we have a question
	 * with three answers (A, B, C). In our group 3 people answered A, 42 people
	 * answered B and 9 people answered C. The count data would be stored as [3,
	 * 42, 9]</p>
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return The secondary count data for the group.
	 */
	public int[] getCountDataSecondary(int perspectiveOption) {
		StatInterface item = getItem(perspectiveOption);
		if (item != null) {
			return item.getCountDataSecondary();
		}
		throw new Error("No such perspective option: " + perspectiveOption);
	}

	/**
	 * Get the secondary count data as percentages, for the group with the
	 * given perspective option.
	 * 
	 * <p>The basic data is stored in the returned array:<br /> If we have a
	 * question with three answers (A, B, C). In our group 3 people answered A,
	 * 42 people answered B and 9 people answered C. The count data would be
	 * stored as [3, 42, 9]. This is converted to percentages (0.0 to 1.0), as:
	 * [3/(3+42+9), 42/(3+42+9), 9/(3+42+9)] = [0.056, 0.778, 0.167]</p>
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return The secondary percentage count data for the group.
	 */
	public double[] getCountDataPercentagesSecondary(int perspectiveOption) {
		StatInterface item = getItem(perspectiveOption);
		if (item != null) {
			return item.getCountDataPercentagesSecondary();
		}
		throw new Error("No such perspective option: " + perspectiveOption);
	}

	/**
	 * Get the number of subjects in the secondary group, with the given
	 * perspective option.
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return The number of subjects in this secondary group.
	 */
	public int getPopulationSecondary(int perspectiveOption) {
		StatInterface item = getItem(perspectiveOption);
		if (item != null) {
			return item.getPopulationCountSecondary();
		}
		throw new Error("No such perspective option: " + perspectiveOption);
	}

	/*
	 * Methods for accessing the total data item.
	 */

	/**
	 * Get the secondary count data, for the total data item.
	 * 
	 * <p>The data is stored in the returned array:<br /> If we have a question
	 * with three answers (A, B, C). In our group 3 people answered A, 42 people
	 * answered B and 9 people answered C. The count data would be stored as [3,
	 * 42, 9]</p>
	 * 
	 * @return The secondary count data for the total item group.
	 */
	public int[] getTotalCountDataSecondary() {
		StatInterface totalItem = getTotalDataItem();
		if (totalItem != null) {
			return totalItem.getCountDataSecondary();
		}
		throw new Error("No data exists");
	}

	/**
	 * Get the secondary count data as percentages, for the total data item.
	 * 
	 * <p>The basic data is stored in the returned array:<br /> If we have a
	 * question with three answers (A, B, C). In our group 3 people answered A,
	 * 42 people answered B and 9 people answered C. The count data would be
	 * stored as [3, 42, 9]. This is converted to percentages (0.0 to 1.0), as:
	 * [3/(3+42+9), 42/(3+42+9), 9/(3+42+9)] = [0.056, 0.778, 0.167]</p>
	 * 
	 * @return The percentage count data for the total item group.
	 */
	public double[] getTotalCountDataPercentagesSecondary() {
		StatInterface totalItem = getTotalDataItem();
		if (totalItem != null) {
			return totalItem.getCountDataPercentagesSecondary();
		}
		throw new Error("No data exists");
	}

	/**
	 * Get the number of subjects in the secondary total data item group.
	 * 
	 * @return The number of subjects in the total item group.
	 */
	public int getTotalPopulationSecondary() {
		StatInterface totalItem = getTotalDataItem();
		if (totalItem != null) {
			return totalItem.getPopulationCountSecondary();
		}
		throw new Error("No total data item.");
	}
}

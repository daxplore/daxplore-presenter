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
import java.util.LinkedList;

import org.daxplore.presenter.chart.StatInterface;

/**
 * Abstract class for storing and sending around the results from a query.
 * 
 * <p>When a query is made, the result is returned in the form of a QueryResult.
 * The result contains the data that answer the query. Depending on the type of
 * query that is made, different subclasses to QueryResult are used. The
 * QueryResult keeps track of what type it is, and the subclasses have methods
 * for accessing the query-specific data.</p>
 * 
 * <p>The result is built up from a number of data items. Each item contains
 * data for a specific sub-group of the total population. It is also possible to
 * add a total data item, which represents the total population.</p>
 * 
 * @see QueryInterface
 */
public abstract class QueryResult {
	/**
	 * A list containing all the standard data items.
	 */
	private LinkedList<StatInterface> itemList;

	/**
	 * If there is a total data item, it is stored here.
	 * 
	 * The total data item contains the total of all groups.
	 */
	private StatInterface totalItem;

	/**
	 * Build a new result item.
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
	 */
	public QueryResult(Collection<? extends StatInterface> dataItems, StatInterface totalDataItem) {
		itemList = new LinkedList<StatInterface>(dataItems);
		totalItem = totalDataItem;
	}

	/**
	 * Get the data item that represents the group with the given perspective
	 * option.
	 * 
	 * @param perspectiveOptionIndex
	 *            The perspective option of the group.
	 * @return A data item representing the group.
	 */
	protected StatInterface getItem(int perspectiveOptionIndex) {
		for (StatInterface item : itemList) {
			if (item.getPerspectiveOption() == perspectiveOptionIndex) {
				return item;
			}
		}
		throw new IndexOutOfBoundsException("No such perspective option: " + perspectiveOptionIndex);
	}

	/**
	 * Tests if there is a data in the data item, for the group with the
	 * given perspective option.
	 * 
	 * <p><b>Usage note:</b> This is not the same as checking if there is a
	 * data item. This method may only be called if there is a data item. It
	 * returns true if there is data, and false if the data item is empty. </p>
	 * 
	 * @param perspectiveOption
	 *            The perspective option of the group.
	 * @return True if there is data, otherwise false.
	 */
	public boolean hasData(int perspectiveOption) {
		return getItem(perspectiveOption).hasData();
	}

	/*
	 * Methods for accessing the total data item.
	 */

	/**
	 * Tests if there is a total data item.
	 * 
	 * @return True if there is a total data item, otherwise false.
	 */
	public boolean hasTotalDataItem() {
		return totalItem != null;
	}

	/**
	 * Tests if there is a data in the total data item.
	 * 
	 * <p><b>Usage note:</b> This is not the same as checking if there is a
	 * total data item. This method may only be called if there is a total data
	 * item. It returns true if there is data, and false if the total data item
	 * is empty.</p>
	 * 
	 * @return True if there is data, otherwise false.
	 */
	public boolean hasTotalDataItemData() {
		if (hasTotalDataItem()) {
			return totalItem.hasData();
		}
		return false;
	}

	/**
	 * Get the total data item.
	 * 
	 * @return The total data item.
	 */
	protected StatInterface getTotalDataItem() {
		if (hasTotalDataItem()) {
			return totalItem;
		}
		throw new UnsupportedOperationException("No total item exists (check hasTotalDataItem() first)");
	}
}

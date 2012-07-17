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

import org.daxplore.presenter.chart.data.QueryResult;
import org.daxplore.presenter.shared.QueryDefinition;

/**
 * An interface for queries that contains a query definition and a set of
 * results.
 */
public interface QueryInterface {

	/**
	 * Gets the definition that defines this query.
	 * 
	 * @return the definition
	 */
	public QueryDefinition getDefinition();

	/**
	 * Make a request to load/download the data defined by the definition.
	 * 
	 * <p>The request is usually made to a server, but the interface allows for
	 * other sources as well.</p>
	 * 
	 * @param queryCallback
	 *            the query callback
	 */
	public void requestResult(QueryCallback queryCallback);

	/**
	 * Check if the data has been loaded yet.
	 * 
	 * @return true, if the data has been loaded
	 */
	public boolean hasResult();

	/**
	 * Gets the data which has been loaded.
	 * 
	 * @param secondary
	 *            true, if secondary data be returned as well
	 * @param mean
	 *            true, if a mean representation should be used; otherwise
	 *            frequencies are returned
	 * @return the result
	 */
	public QueryResult getResult(boolean secondary, boolean mean);

	/**
	 * A callback interface, which is called when data has been successfully
	 * loaded.
	 */
	public interface QueryCallback {

		/**
		 * Callback.
		 */
		public void callback();
	}

}

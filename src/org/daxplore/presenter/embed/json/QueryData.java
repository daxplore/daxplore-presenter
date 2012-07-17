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
package org.daxplore.presenter.embed.json;

import java.util.ArrayList;
import java.util.List;

import org.daxplore.presenter.client.json.shared.StatDataItem;

import com.google.gwt.core.client.JavaScriptObject;

/**
 * This class supplies one set of {@link StatDataItem}s that makes up the data
 * for a single chart.
 * 
 * <p>This corresponds to what the standard Daxplore client gets from
 *  a single server requests. But as the embed mode only should represent a
 *  single chart, this class contains all the numeric data a specific instance
 *  will ever need.</p>
 */
public class QueryData extends JavaScriptObject {
	
	protected QueryData() {}
	
	protected final native int getLength() /*-{
		return this.length;
	}-*/;
	
	protected final native StatDataItem getItem(int i) /*-{
		return this[i];
	}-*/;
	
	/**
	 * Get the data that makes up this embed chart, loaded from a variable
	 * defined in the jsp-file.
	 * 
	 * @return the native json data
	 */
	protected static native QueryData getDataNative() /*-{
		return $wnd.jsondata;
	}-*/;
	
	/**
	 * Get the {@link StatDataItem} data as a list.
	 * 
	 * <p>Used to build the embed-mode's chart.</p>
	 * 
	 * @return the data
	 */
	public static List<StatDataItem> getData() {
		QueryData data = getDataNative();
		List<StatDataItem> list = new ArrayList<StatDataItem>(data.getLength());
		for(int i = 0; i < data.getLength(); i++){
			list.add(data.getItem(i));
		}
		return list;
	}
}

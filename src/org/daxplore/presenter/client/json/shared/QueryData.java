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
package org.daxplore.presenter.client.json.shared;

import java.util.ArrayList;
import java.util.List;

import org.daxplore.presenter.chart.StatInterface;


import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArrayInteger;

/**
 * This class supplies one set of StatDataItems that makes up the data
 * for a single chart.
 * 
 * <p>This corresponds to what the standard Daxplore client gets from
 *  a single server requests. But as the embed mode only should represent a
 *  single chart, this class contains all the numeric data a specific instance
 *  will ever need.</p>
 */
public class QueryData extends JavaScriptObject {
	
	protected QueryData() {}
	
	public final static QueryData getQueryDataEmbedded() {
		return getDataEmbeddedNative();
	}
	/**
	 * Get the data that makes up this embed chart, loaded from a variable
	 * defined in the jsp-file.
	 * 
	 * @return the native json data
	 */
	private final static native QueryData getDataEmbeddedNative() /*-{
		return $wnd.jsondata;
	}-*/;
	
	public final static QueryData getQueryData(String json) {
		System.out.println("json: " + json);
		return getDataNative(json);
	}
	private final static native QueryData getDataNative(String json) /*-{
		return eval('('+json+')');
	}-*/;
	
	private final native JsArrayInteger getTimepoints() /*-{
		var timepoints = [];
		for(var key in this.values) {
			if(this.values.hasOwnProperty(key)){
				timepoints.push(parseInt(key));
			}
		}
		return timepoints;
	}-*/;

	private final native int getPerspectiveCount(int timepointIndex) /*-{
		var count = 0;
		var timepoint = this.values[timepointIndex];
		for(var perspective in timepoint) {
			if(timepoint.hasOwnProperty(perspective)){
				count+=1;
			}
		}
		return count-1; // -1 to ignore 'all'
	}-*/;
	
	private final native JsArrayInteger getData(int timepoint, String perspective) /*-{
		return this.values[timepoint][perspective];
	}-*/;
	
	/**
	 * Get the {@link StatInterface} data as a list.
	 * 
	 * @return the data
	 */
	public final List<StatInterface> getDataItems() {
		System.out.println("getDataItems enter");
		int[] timepoints = JsonTools.jsArrayAsArray(getTimepoints());
		int perspectiveCount = getPerspectiveCount(timepoints[0]);
		List<StatInterface> list = new ArrayList<StatInterface>(perspectiveCount);
		
		for(int i = 0; i < perspectiveCount; i++){
			int[] primaryData = JsonTools.jsArrayAsArray(getData(timepoints[0], Integer.toString(i)));
			int[] secondaryData = null;
			if(timepoints.length==2) { //TODO invalid assumptions about timepoints
				JsonTools.jsArrayAsArray(getData(timepoints[1], Integer.toString(i)));
			}
			list.add(new StatDataItemGWT(primaryData, secondaryData, i, false));
		}
		
		return list;
	}
	
	public final StatInterface getTotalDataItem() {
		int[] timepoints = JsonTools.jsArrayAsArray(getTimepoints());
		int[] primaryData = JsonTools.jsArrayAsArray(getData(timepoints[0], "all"));
		int[] secondaryData = null;
		if(timepoints.length==2) { //TODO invalid assumptions about timepoints
			JsonTools.jsArrayAsArray(getData(timepoints[1], "all"));
		}
		return new StatDataItemGWT(primaryData, secondaryData, -1, true);
	}
}

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

import org.daxplore.presenter.shared.ChartDataItem;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArrayInteger;

/**
 * This class wraps a single server response, which makes up the data
 * for a question/perspective combination.
 */
public class ChartDataParserClient extends JavaScriptObject {
	
	protected ChartDataParserClient() {}
	
	/**
	 * Acts as a constructor for the class. Parses and wraps the json response.
	 * 
	 * @param json The json representation of the data
	 * @return A new instance of this class
	 */
	public final static native ChartDataParserClient parseJson(String json) /*-{
		return eval('('+json+')');
	}-*/;
	
	/**
	 * Get the single data item that comes pre-loaded with embed charts.
	 * 
	 * @return the native json data
	 */
	public final static native ChartDataParserClient getEmbeddedData() /*-{
		return $wnd.jsondata;
	}-*/;
	
	public final native String getQuestionID() /*-{
		return this.q;
	}-*/;
	
	public final native String getPerspectiveID() /*-{
		return this.p;
	}-*/;
	
	private final native JsArrayInteger getTimepoints() /*-{
		var timepoints = [];
		for(var key in this.freq) {
			if(this.freq.hasOwnProperty(key)){
				timepoints.push(parseInt(key));
			}
		}
		return timepoints;
	}-*/;

	private final native int getPerspectiveCount(int timepointIndex) /*-{
		var count = 0;
		var timepoint = this.freq[timepointIndex];
		for(var perspective in timepoint) {
			if(timepoint.hasOwnProperty(perspective)){
				count+=1;
			}
		}
		return count-1; // -1 to ignore 'all'
	}-*/;
	
	private final native JsArrayInteger getData(int timepoint, String perspective) /*-{
		return this.freq[timepoint][perspective];
	}-*/;
	
	/**
	 * Get the {@link ChartDataInterface} data as a list.
	 * 
	 * @return the data
	 */
	public final List<ChartDataItem> getDataItems() {
		int[] timepoints = JsonTools.jsArrayAsArray(getTimepoints());
		int perspectiveCount = getPerspectiveCount(timepoints[0]);
		List<ChartDataItem> list = new ArrayList<ChartDataItem>(perspectiveCount);
		
		for(int i = 0; i < perspectiveCount; i++){
			int[] primaryData = JsonTools.jsArrayAsArray(getData(0, Integer.toString(i)));
			int[] secondaryData = null;
			if(timepoints.length==2) { //TODO invalid assumptions about timepoints
				secondaryData = JsonTools.jsArrayAsArray(getData(1, Integer.toString(i)));
			}
			list.add(new ChartDataItem(primaryData, secondaryData, i));
		}
		
		return list;
	}
	
	public final ChartDataItem getTotalDataItem() {
		int[] timepoints = JsonTools.jsArrayAsArray(getTimepoints());
		int[] primaryData = JsonTools.jsArrayAsArray(getData(timepoints[0], "all"));
		int[] secondaryData = null;
		if(timepoints.length==2) { //TODO invalid assumptions about timepoints
			secondaryData = JsonTools.jsArrayAsArray(getData(timepoints[1], "all"));
		}
		return new ChartDataItem(primaryData, secondaryData, -1);
	}
}

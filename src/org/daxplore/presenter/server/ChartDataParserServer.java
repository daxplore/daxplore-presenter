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
package org.daxplore.presenter.server;

import java.util.ArrayList;
import java.util.List;

import org.daxplore.presenter.shared.ChartDataItem;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;

import com.google.gwt.core.client.JavaScriptObject;

/**
 * This class wraps a single json server response, which makes up the data
 * for a question/perspective combination.
 */
public class ChartDataParserServer extends JavaScriptObject {

	private JSONObject statJsonObject, valueObject, timepoint1, timepoint2;
	/**
	 * Parses and wraps the json chart data.
	 */ 
	public ChartDataParserServer(String json) {
		statJsonObject = (JSONObject)JSONValue.parse(json);
		valueObject = (JSONObject)statJsonObject.get("values");
		timepoint1 = (JSONObject)valueObject.get("0");
		timepoint2 = (JSONObject)valueObject.get("1");
	}

	public String getQuestionID() {
		return (String)statJsonObject.get("q");
	}
	
	public String getPerspectiveID() {
		return (String)statJsonObject.get("p");
	}
	
	private int[] getDataPrimary(String perspective) {
		JSONArray dataJson = (JSONArray)timepoint1.get(perspective);
		int[] data = new int[dataJson.size()];
		for (int i = 0; i<data.length; i++) {
			data[i] = ((Number)dataJson.get(i)).intValue();
		}
		return data;
	}

	private int[] getDataSecondary(String perspective) {
		JSONArray dataJson = (JSONArray)timepoint2.get(perspective);
		int[] data = new int[dataJson.size()];
		for (int i = 0; i<data.length; i++) {
			data[i] = ((Number)dataJson.get(i)).intValue();
		}
		return data;
	}
	
	/**
	 * Get the {@link ChartDataInterface} data as a list.
	 * 
	 * @return the data
	 */
	public List<ChartDataItem> getDataItems() {
		int perspectiveCount = timepoint1.size() - 1;
		List<ChartDataItem> list = new ArrayList<>(perspectiveCount);
		
		for(int i = 0; i < perspectiveCount; i++){
			String perspective = Integer.toString(i);
			int[] primaryData = getDataPrimary(perspective);
			int[] secondaryData = null;
			if(timepoint2!=null) {
				secondaryData = getDataSecondary(perspective);
			}
			list.add(new ChartDataItem(primaryData, secondaryData, i));
		}
		
		return list;
	}
	
	public ChartDataItem getTotalDataItem() {
		int timepointCount = valueObject.keySet().size();
		int[] primaryData = getDataPrimary("all");
		int[] secondaryData = null;
		if(timepointCount==2) { //TODO invalid assumptions about timepoints
			secondaryData = getDataSecondary("all");
		}
		return new ChartDataItem(primaryData, secondaryData, -1);
	}
}

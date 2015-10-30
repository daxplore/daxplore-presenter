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

import org.daxplore.presenter.shared.QueryData;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.json.client.JSONArray;
import com.google.gwt.json.client.JSONObject;
import com.google.gwt.json.client.JSONParser;

/**
 * This class wraps a single server response, which makes up the data
 * for a question/perspective combination.
 */
public class ChartDataParserClient {
	/**
	 * Get the single data item that comes pre-loaded with embed charts.
	 * 
	 * @return the native json data
	 */
	private final static native JavaScriptObject getEmbedData() /*-{
		return $wnd.jsondata;
	}-*/;
	
	public static QueryData parse(String json) {
		return getQueryData(JSONParser.parseStrict(json).isObject());
	}
	
	public static QueryData getEmbeddedData() {
		return getQueryData(new JSONObject(getEmbedData()));
	}
	
	private static QueryData getQueryData(JSONObject statJsonObject) {
		String questionID = statJsonObject.get("q").isString().stringValue();
		String perspectiveID = statJsonObject.get("p").isString().stringValue();
		QueryData queryData = new QueryData(questionID, perspectiveID);
		
		JSONObject freqObject = (JSONObject)statJsonObject.get("freq");
		if (freqObject != null) {
			JSONObject freqTimepoint1 = null;
			if(freqObject.get("0") != null) {
				freqTimepoint1 = freqObject.get("0").isObject();
			}
			
			if (freqTimepoint1 != null) {
				int perspectiveCount = freqTimepoint1.size() - 1;
				List<int[]> freqPrimary = new ArrayList<>();
				for (int i = 0; i < perspectiveCount; i++) {
					int[] data = getAsIntArray(freqTimepoint1.get(""+i).isArray());
					freqPrimary.add(data);
				}
				int[] freqPrimaryTotal = getAsIntArray(freqTimepoint1.get("all").isArray());
				
				queryData.addFreqPrimary(freqPrimary, freqPrimaryTotal);
			}
	
			JSONObject freqTimepoint2 = null;
			if(freqObject.get("1") != null) {
				freqTimepoint2 = freqObject.get("1").isObject();
			}
			if (freqTimepoint2 != null) {
				int perspectiveCount = freqTimepoint2.size() - 1;
				List<int[]> freqSecondary = new ArrayList<>();
				for (int i = 0; i < perspectiveCount; i++) {
					int[] data = getAsIntArray(freqTimepoint2.get("" + i).isArray());
					freqSecondary.add(data);
				}
				int[] freqSecondaryTotal = getAsIntArray(freqTimepoint2.get("all").isArray());
				
				queryData.addFreqSecondary(freqSecondary, freqSecondaryTotal);
			}
		}
		
		JSONObject meanObject = (JSONObject)statJsonObject.get("mean");
		if(meanObject != null) {
			JSONObject meanTimepoint1 = (JSONObject)meanObject.get("0");
			JSONObject meanTimepoint2 = (JSONObject)meanObject.get("1");
			
			if(meanTimepoint1 != null) {
				double[] meanPrimary = getAsDoubleArray(meanTimepoint1.get("mean").isArray());
				double meanPrimaryTotal = meanTimepoint1.get("all").isNumber().doubleValue();
				int[] meanPrimaryCount = getAsIntArray(meanTimepoint1.get("count").isArray());
				int meanPrimaryCountTotal = (int)meanTimepoint1.get("allcount").isNumber().doubleValue();
				queryData.addMeanPrimary(meanPrimary, meanPrimaryTotal, meanPrimaryCount, meanPrimaryCountTotal);
			}
			
			if(meanTimepoint2 != null) {
				double[] meanSecondary = getAsDoubleArray((JSONArray)meanTimepoint2.get("mean"));
				double meanSecondaryTotal = meanTimepoint2.get("all").isNumber().doubleValue();
				int[] meanSecondaryCount = getAsIntArray(meanTimepoint2.get("count").isArray());
				int meanSecondaryCountTotal = (int)meanTimepoint2.get("allcount").isNumber().doubleValue();
				queryData.addMeanSecondary(meanSecondary, meanSecondaryTotal, meanSecondaryCount, meanSecondaryCountTotal);
			}
		}
		
		return queryData;
	}
	
	private static int[] getAsIntArray(JSONArray dataJson) {
		int[] data = new int[dataJson.size()];
		for (int i = 0; i<data.length; i++) {
			data[i] = (int)(dataJson.get(i).isNumber().doubleValue());
		}
		return data;
	}

	private static double[] getAsDoubleArray(JSONArray dataJson) {
		double[] data = new double[dataJson.size()];
		for (int i = 0; i<data.length; i++) {
			data[i] = dataJson.get(i).isNumber().doubleValue();
		}
		return data;
	}
}

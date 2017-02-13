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

import org.daxplore.presenter.shared.QueryData;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;

/**
 * This class wraps a single json server response, which makes up the data
 * for a question/perspective combination.
 */
public class ChartDataParserServer {

	/**
	 * Parses and wraps the json chart data.
	 */ 
	public static QueryData parse(String json) {
		JSONObject statJsonObject = (JSONObject)JSONValue.parse(json);
		
		String questionID = (String)statJsonObject.get("q");
		String perspectiveID = (String)statJsonObject.get("p");
		QueryData queryData = new QueryData(questionID, perspectiveID);
		
		JSONObject freqObject = (JSONObject)statJsonObject.get("freq");
		if (freqObject != null) {
			JSONObject freqTimepoint1 = (JSONObject)freqObject.get("0");
			JSONObject freqTimepoint2 = (JSONObject)freqObject.get("1");
			
			if (freqTimepoint1 != null) {
				int perspectiveCount = freqTimepoint1.size() - 1;
				List<int[]> freqPrimary = new ArrayList<>();
				for (int i = 0; i < perspectiveCount; i++) {
					int[] data = getAsIntArray((JSONArray)freqTimepoint1.get(i));
					freqPrimary.add(data);
				}
				int[] freqPrimaryTotal = getAsIntArray((JSONArray)freqTimepoint1.get("all"));
				
				queryData.addFreqPrimary(freqPrimary, freqPrimaryTotal);
			}
	
			if (freqTimepoint2 != null) {
				int perspectiveCount = freqTimepoint2.size() - 1;
				List<int[]> freqSecondary = new ArrayList<>();
				for (int i = 0; i < perspectiveCount; i++) {
					int[] data = getAsIntArray((JSONArray)freqTimepoint2.get(i));
					freqSecondary.add(data);
				}
				int[] freqSecondaryTotal = getAsIntArray((JSONArray)freqTimepoint2.get("all"));
				
				queryData.addFreqSecondary(freqSecondary, freqSecondaryTotal);
			}
		}
		
		JSONObject meanObject = (JSONObject)statJsonObject.get("mean");
		if(meanObject != null) {
			JSONObject meanTimepoint1 = (JSONObject)meanObject.get("0");
			JSONObject meanTimepoint2 = (JSONObject)meanObject.get("1");
			
			if(meanTimepoint1 != null) {
				double[] meanPrimary = getAsDoubleArray((JSONArray)meanTimepoint1.get("mean"));
				double meanPrimaryTotal = ((Number)meanTimepoint1.get("all")).doubleValue();
				int[] meanPrimaryCount = getAsIntArray((JSONArray)meanTimepoint1.get("count"));
				int meanPrimaryCountTotal = ((Number)meanTimepoint1.get("allcount")).intValue();
				queryData.addMeanPrimary(meanPrimary, meanPrimaryTotal, meanPrimaryCount, meanPrimaryCountTotal);
			}
			
			if(meanTimepoint2 != null) {
				double[] meanSecondary = getAsDoubleArray((JSONArray)meanTimepoint2.get("mean"));
				double meanSecondaryTotal = ((Number)meanTimepoint2.get("all")).doubleValue();
				int[] meanSecondaryCount = getAsIntArray((JSONArray)meanTimepoint2.get("count"));
				int meanSecondaryCountTotal = ((Number)meanTimepoint2.get("allcount")).intValue();
				queryData.addMeanSecondary(meanSecondary, meanSecondaryTotal, meanSecondaryCount, meanSecondaryCountTotal);
			}
		}
		
		return queryData;
	}
	
	private static int[] getAsIntArray(JSONArray dataJson) {
		int[] data = new int[dataJson.size()];
		for (int i = 0; i<data.length; i++) {
			data[i] = ((Number)dataJson.get(i)).intValue();
		}
		return data;
	}

	private static double[] getAsDoubleArray(JSONArray dataJson) {
		double[] data = new double[dataJson.size()];
		for (int i = 0; i<data.length; i++) {
			data[i] = ((Number)dataJson.get(i)).intValue();
		}
		return data;
	}
}

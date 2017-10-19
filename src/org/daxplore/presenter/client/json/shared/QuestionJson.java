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

import java.util.Collections;
import java.util.List;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArrayInteger;
import com.google.gwt.core.client.JsArrayString;

/**
 * Read a native json-object that contains metadata about a specific question.
 */
public class QuestionJson extends JavaScriptObject {
	protected QuestionJson() {
	}

	/**
	 * Gets the question's ID.
	 * 
	 * @return the ID
	 */
	public final native String getID() /*-{
		return this.column;
	}-*/;

	/**
	 * Checks if this question has data for a specific timepoint.
	 * 
	 * @param timepointIndex the index of the timepoint as given by the producer
	 * @return true, if there is data for the timepoint
	 */
	public final native boolean hasDataForTimepoint(int timepointIndex) /*-{
		for (var i=0; i<this.timepoints.length; i++) {
			if(this.timepoints[i] == timepointIndex) {
				return true;
			}	
		}
		return false;
	}-*/;

	/**
	 * Checks if this question contains frequency data
	 * 
	 * @return true, if it contains frequency data
	 */
	public final native boolean hasFrequencies() /*-{
		for (var i=0; i<this.displaytypes.length; i++) {
			if(this.displaytypes[i] == "FREQ") {
				return true;
			}	
		}
		return false;
	}-*/;

	/**
	 * Checks if this question can displayed as a mean
	 * 
	 * @return true, if it can be shown as a mean
	 */
	public final native boolean hasMean() /*-{
		for (var i=0; i<this.displaytypes.length; i++) {
			if(this.displaytypes[i] == "MEAN") {
				return true;
			}	
		}
		return false;
	}-*/;
	
	/**
	 * Checks if this question can displayed as a line chart over time
	 * 
	 * @return true, if it can be shown as a mean
	 */
	public final native boolean hasLine() /*-{
		for (var i=0; i<this.displaytypes.length; i++) {
			if(this.displaytypes[i] == "LINE") {
				return true;
			}	
		}
		return false;
	}-*/;

	/**
	 * Get the number of answer-options this question has.
	 * 
	 * @return the option count
	 */
	public final native int getOptionCount() /*-{
		return this.options.length;
	}-*/;

	/**
	 * Get the text for a specific answer-option.
	 * 
	 * @param index
	 *            the index of the option
	 * @return the option text
	 */
	public final native String getOptionText(int index) /*-{
		return this.options[index];
	}-*/;

	/**
	 * Get a list of all the texts for the answer options.
	 * 
	 * @return the option texts
	 */
	public final List<String> getOptionTexts() {
		return Collections.unmodifiableList(JsonTools.jsArrayAsList(getOptionsNative()));
	}

	private final native JsArrayString getOptionsNative() /*-{
		return this.options;
	}-*/;
	
	/**
	 * Get a list of all the supported timepoints.
	 * 
	 * @return the option texts
	 */
	public final List<Integer> getTimepointIndexes() {
		return Collections.unmodifiableList(JsonTools.jsArrayAsList(getTimepointIndexesNative()));
	}

	private final native JsArrayInteger getTimepointIndexesNative() /*-{
		return this.timepoints;
	}-*/;

	/**
	 * Get a short text that describes this question.
	 * 
	 * @return the text
	 */
	public final native String getShortText() /*-{
		return this['short'];

	}-*/;

	/**
	 * Get a longer text that describes this question.
	 * 
	 * @return the text
	 */
	public final native String getFullText() /*-{
		return this.text;
	}-*/;
	
	/**
	 * Get a long text that describes this question for use in DescriptionPanel
	 * 
	 * @return the text
	 */
	public final native String getDescriptionText() /*-{
		return this.description;
	}-*/;

	/**
	 * Check if the question should use a mean reference value.
	 * 
	 * @return true if there is a mean reference value
	 */ 
	public final native boolean hasMeanReferenceValue() /*-{
		return typeof(this.use_mean_reference) != 'undefined' && this.use_mean_reference;
	}-*/;
	
	
	/**
	 * Get the question's mean reference value.
	 * 
	 * @return the mean reference value
	 */ 
	public final native double getMeanReferenceValue() /*-{
		return this.mean_reference;
	}-*/;
}

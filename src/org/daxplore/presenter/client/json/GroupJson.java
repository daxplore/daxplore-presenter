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
package org.daxplore.presenter.client.json;

import java.util.Collections;
import java.util.List;

import org.daxplore.presenter.client.json.shared.JsonTools;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArrayString;

/**
 * Read a native json-object that contains metadata about a specific group.
 * 
 * <p>A group has a name and contains a number of question IDs.</p>
 */
class GroupJson extends JavaScriptObject {
	protected GroupJson() {
	};

	/**
	 * Get the group name.
	 * 
	 * @return the group name
	 */
	public final native String getGroupName() /*-{
		return this.name;
	}-*/;

	private final native JsArrayString getQuestionIDsNative() /*-{
		return this.questions;
	}-*/;

	/**
	 * Get the IDs of the questions are in this groups.
	 * 
	 * @return the question IDs
	 */
	public final List<String> getQuestionIDs() {
		return Collections.unmodifiableList(JsonTools.jsArrayAsList(getQuestionIDsNative()));
	}
}
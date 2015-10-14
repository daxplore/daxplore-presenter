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
import java.util.LinkedList;
import java.util.List;

import org.daxplore.presenter.client.PresentationEntryPoint;
import org.daxplore.presenter.client.ui.QuestionPanel;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.inject.Inject;

/**
 * Gives access to the groups that are defined for the site.
 * 
 * <p>Each group has a name and a number of questionIDs. When using
 * {@link PresentationEntryPoint} the groups are displayed in
 * {@link QuestionPanel} with each group containing their questions, allowing
 * the users to select different questions.</p>
 * 
 * <p>The Groups class is populated with json-data found in the JavaScript
 * variable "groups", which is defined in presentation template.</p>
 * 
 * <p>The native methods act on the json data using JavaScript. The non-native
 * methods wrap this information in convenient Java-methods.</p>
 */
public class Groups {
	private final List<GroupJson> groupList;

	/**
	 * Instantiates a new Groups object that contains all the group data.
	 */
	@Inject
	protected Groups() {
		LinkedList<GroupJson> list = new LinkedList<>();
		NativeGroups groupsNative = getGroupsNative();
		for (int i = 0; i < groupsNative.groupCount(); i++) {
			GroupJson group = groupsNative.getGroup(i);
			list.add(group);
		}
		groupList = Collections.unmodifiableList(list);
	}

	/**
	 * Get the question IDs that belong to a specific group.
	 * 
	 * @param index
	 *            the group's index
	 * @return the question IDs
	 */
	public List<String> getQuestionIDs(int index) {
		return groupList.get(index).getQuestionIDs();
	}

	/**
	 * Get the name of a specific group.
	 * 
	 * @param index
	 *            the group's index
	 * @return the group name
	 */
	public String getGroupName(int index) {
		return groupList.get(index).getGroupName();
	}

	/**
	 * Get the number of defined groups.
	 * 
	 * <p>Used to iterate over the groups.</p>
	 * 
	 * @return the number of defined groups
	 */
	public int getGroupCount() {
		return groupList.size();
	}

	/**
	 * Load the json-object from JavaScipt and wrap it as a {@link NativeGroups}
	 * object.
	 * 
	 * @return the entire native groups object
	 */
	private static native NativeGroups getGroupsNative() /*-{
		return $wnd.groups;
	}-*/;

	/**
	 * The class NativeGroups wraps the entire groups json-object.
	 */
	private final static class NativeGroups extends JavaScriptObject {
		protected NativeGroups() {
		}

		/**
		 * Get the number of defined groups.
		 * 
		 * @return the number of defined groups
		 */
		public final native int groupCount()/*-{
			return this.length;
		}-*/;

		/**
		 * Get a native {@link GroupJson} wrapper object for a specific group.
		 * 
		 * @param index
		 *            the group's index
		 * @return the group
		 */
		public final native GroupJson getGroup(int index)/*-{
			return this[index];
		}-*/;
	}
}

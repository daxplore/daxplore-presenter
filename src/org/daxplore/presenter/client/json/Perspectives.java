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

import com.google.gwt.core.client.JavaScriptObject;
import com.google.inject.Inject;

/**
 * Defines which questions should be used as perspectives for the site.
 * 
 * <p>Each question has texts and a number of question options (corresponding to
 * answer options in a survey).</p>
 * 
 * <p>These questions represents both what is called "questions" on the web site
 * as well as "perspectives". This is because they are all originally questions
 * in a survey.</p>
 * 
 * <p>The native methods act on the json data using JavaScript. The non-native
 * methods wrap this information in convenient Java-methods. The data is loaded
 * from the JavaScript variable "perspectives" that is defined in
 * presentation.jsp.</p>
 */
public class Perspectives {
	private final List<String> questionIDList;

	@Inject
	protected Perspectives() {
		List<String> list = new LinkedList<String>();
		NativePerspectives perspectiveNative = getPerspectivesNative();
		for (int i = 0; i < perspectiveNative.perspectiveCount(); i++) {
			String columnName = perspectiveNative.getColumn(i);
			list.add(columnName);
		}
		questionIDList = Collections.unmodifiableList(list);
	}

	/**
	 * Gets the question IDs that are used as perspectives.
	 * 
	 * @return the question IDs
	 */
	public List<String> getQuestionIDs() {
		return questionIDList;
	}

	/**
	 * Load the perspective json-object from JavaScipt and wrap it as a
	 * {@link NativePerspectives} object.
	 * 
	 * @return the entire native perspective object
	 */
	private static native NativePerspectives getPerspectivesNative() /*-{
		return $wnd.perspectives;
	}-*/;

	private static class NativePerspectives extends JavaScriptObject {
		protected NativePerspectives() {
		};

		public final native int perspectiveCount()/*-{
			return this.length;
		}-*/;

		public final native String getColumn(int index)/*-{
			return this[index];
		}-*/;
	}
}

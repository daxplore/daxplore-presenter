/**
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.client.json.shared;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArray;
import com.google.gwt.core.client.JsArrayString;

public class MeanTotalsDataParser {

	/**
	 * Get the mean total item that comes pre-loaded in the List View
	 */
	public final static native NativeMeanTotals getMeanTotalsNative() /*-{
		return $wnd.meantotals;
	}-*/;
	
	public final static class NativeMeanTotals extends JavaScriptObject {
		protected NativeMeanTotals() {
		}
		
		private final native JsArrayString getPrefixesNative() /*-{
			return Object.keys(this);
		}-*/;
		
		public String[] getPrefixes() {
			return JsonTools.jsArrayAsArray(getPrefixesNative());
		}
		
		private final native JsArray<QuestionMean> getQuestionMeansNative(String prefix) /*-{
			return this[prefix];
		}-*/;
		
		public QuestionMean[] getQuestionMeans(String prefix) {
			JsArray<QuestionMean> jsArray = getQuestionMeansNative(prefix);
			QuestionMean[] means = new QuestionMean[jsArray.length()];
			for(int i=0; i<jsArray.length(); i++) {
				means[i] = jsArray.get(i);
			}
			return means;
		}
	}
	
	public final static class QuestionMean extends JavaScriptObject {
		protected QuestionMean() {
		}
		
		public final native String getQuestionId() /*-{
			return this.q;
		}-*/;
		
		public final native boolean hasPrimaryTimepoint() /*-{
			return "0" in this;
		}-*/;
		
		public final native double getPrimaryTotal() /*-{
			return this["0"].all;
		}-*/;
		
		public final native int getPrimaryTotalCount() /*-{
			return this["0"].totalcount;
		}-*/;

		public final native double getPrimaryGlobal() /*-{
			return this["0"].global;
		}-*/;
		
		public final native boolean hasSecondaryTimepoint() /*-{
			return "1" in this;
		}-*/;
		
		public final native double getSecondaryTotal() /*-{
			return this["1"].all;
		}-*/;
		
		public final native int getSecondaryTotalCount() /*-{
			return this["1"].totalcount;
		}-*/;
	
		public final native double getSecondaryGlobal() /*-{
			return this["1"].global;
		}-*/;
	}
}

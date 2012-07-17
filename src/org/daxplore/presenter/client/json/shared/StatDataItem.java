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

import org.daxplore.presenter.chart.StatInterface;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.core.client.JsArrayInteger;

/**
 * A single StatDataItem.
 * 
 * <p>This represents a piece of data that contains the answer frequencies for a
 * specific group. They can also contain a dataset for "secondary" data from a
 * different dataset.</p>
 */
public final class StatDataItem extends JavaScriptObject implements StatInterface {

	protected StatDataItem() {
	}

	/**
	 * Interpret a string that represents a json object as a
	 * {@link StatDataItem}.
	 * 
	 * @param jsonString
	 *            a json string
	 * @return the stat data item
	 */
	public static native StatDataItem makeStatDataItem(String jsonString) /*-{
		return eval("(" + jsonString + ")");
	}-*/;

	/* Basic methods */

	/**
	 * {@inheritDoc}
	 */
	public final native boolean hasPerspectiveOption()/*-{
		return !(typeof (this.s) == 'undefined');
	}-*/;

	/**
	 * {@inheritDoc}
	 */
	public final native int getPerspectiveOption()/*-{
		return this.s - 1;
	}-*/;

	/**
	 * {@inheritDoc}
	 */
	public final native boolean hasData()/*-{
		return this.d != null;
	}-*/;

	/**
	 * {@inheritDoc}
	 */
	public final native boolean hasDataSecondary()/*-{
		return this.o != null;
	}-*/;

	/* Count specific methods */

	private final native JsArrayInteger getCountDataNative()/*-{
		return this.d;
	}-*/;

	/**
	 * {@inheritDoc}
	 */
	public int[] getCountData() {
		if (hasData()) {
			return JsonTools.jsArrayAsArray(getCountDataNative());
		} else {
			return new int[0];
		}
	};

	/**
	 * Designed to coutneract errors in the data where too many options are
	 * included.
	 * 
	 * @param questionOptionCount
	 *            the question option count
	 * @return the population correcting for trailing incorrect data
	 */
	public int getPopulationCorrectingForTrailingIncorrectData(int questionOptionCount) {
		int sum = 0;
		int[] countData = getCountData();
		int sizeLimit = Math.min(questionOptionCount, countData.length);
		for (int i = 0; i < sizeLimit; i++) {
			sum += countData[i];
		}
		return sum;
	}

	/**
	 * {@inheritDoc}
	 */
	public double[] getCountDataPercentages() {
		int[] countData = getCountData();
		double[] result = new double[countData.length];
		int sum = 0;
		for (int i : countData) {
			sum += i;
		}
		for (int i = 0; i < countData.length; i++) {
			result[i] = ((double) countData[i]) / sum;
		}
		return result;
	}

	private final native JsArrayInteger getCountDataNativeSecondary()/*-{
		return this.o;
	}-*/;

	/**
	 * {@inheritDoc}
	 */
	public int[] getCountDataSecondary() {
		if (hasDataSecondary()) {
			return JsonTools.jsArrayAsArray(getCountDataNativeSecondary());
		} else {
			return new int[0];
		}
	};

	/**
	 * {@inheritDoc}
	 */
	public int getPopulationSecondaryCorrectingForTrailingIncorrectData(int questionOptionCount) {
		int sum = 0;
		int[] countData = getCountDataSecondary();
		int sizeLimit = Math.min(questionOptionCount, countData.length);
		for (int i = 0; i < sizeLimit; i++) {
			sum += countData[i];
		}
		return sum;
	}

	/**
	 * {@inheritDoc}
	 */
	public double[] getCountDataPercentagesSecondary() {
		int[] countData = getCountDataSecondary();
		double[] result = new double[countData.length];
		int sum = 0;
		for (int i : countData) {
			sum += i;
		}
		for (int i = 0; i < countData.length; i++) {
			result[i] = ((double) countData[i]) / sum;
		}
		return result;
	}
}

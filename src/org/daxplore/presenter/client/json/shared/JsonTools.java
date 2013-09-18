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

import java.util.LinkedList;
import java.util.List;

import com.google.gwt.core.client.JsArrayBoolean;
import com.google.gwt.core.client.JsArrayInteger;
import com.google.gwt.core.client.JsArrayNumber;
import com.google.gwt.core.client.JsArrayString;

/**
 * Static helper methods used to manipulate native json/javascript objects.
 */
public class JsonTools {

	/**
	 * Convert a {@link JsArrayString} to a String array.
	 * 
	 * @param jsArray
	 *            the js array
	 * @return the string[]
	 */
	public static String[] jsArrayAsArray(JsArrayString jsArray) {
		String[] javaArray = new String[jsArray.length()];
		for (int i = 0; i < jsArray.length(); i++) {
			javaArray[i] = jsArray.get(i);
		}
		return javaArray;
	}

	/**
	 * Convert a {@link JsArrayInteger} to an int array.
	 * 
	 * @param jsArray
	 *            the js array
	 * @return the int[]
	 */
	public static int[] jsArrayAsArray(JsArrayInteger jsArray) {
		int[] javaArray = new int[jsArray.length()];
		for (int i = 0; i < jsArray.length(); i++) {
			javaArray[i] = jsArray.get(i);
		}
		return javaArray;
	}

	/**
	 * Convert a {@link JsArrayNumber} to a double array.
	 * 
	 * @param jsArray
	 *            the js array
	 * @return the double[]
	 */
	public static double[] jsArrayAsArray(JsArrayNumber jsArray) {
		double[] javaArray = new double[jsArray.length()];
		for (int i = 0; i < jsArray.length(); i++) {
			javaArray[i] = jsArray.get(i);
		}
		return javaArray;
	}

	/**
	 * Convert a {@link JsArrayBoolean} to a boolean array.
	 * 
	 * @param jsArray
	 *            the js array
	 * @return the boolean[]
	 */
	public static boolean[] jsArrayAsArray(JsArrayBoolean jsArray) {
		boolean[] javaArray = new boolean[jsArray.length()];
		for (int i = 0; i < jsArray.length(); i++) {
			javaArray[i] = jsArray.get(i);
		}
		return javaArray;
	}

	/**
	 * Convert a {@link JsArrayString} to a List<String>.
	 * 
	 * @param jsArray
	 *            the js array
	 * @return the list
	 */
	public static List<String> jsArrayAsList(JsArrayString jsArray) {
		List<String> list = new LinkedList<String>();
		for (int i = 0; i < jsArray.length(); i++) {
			list.add(jsArray.get(i));
		}
		return list;
	}

	/**
	 * Convert a {@link JsArrayInteger} to a List<Integer>.
	 * 
	 * @param jsArray
	 *            the js array
	 * @return the list
	 */
	public static List<Integer> jsArrayAsList(JsArrayInteger jsArray) {
		List<Integer> list = new LinkedList<Integer>();
		for (int i = 0; i < jsArray.length(); i++) {
			list.add(jsArray.get(i));
		}
		return list;
	}

	/**
	 * Convert a {@link JsArrayNumber} to a List<Double>.
	 * 
	 * @param jsArray
	 *            the js array
	 * @return the list
	 */
	public static List<Double> jsArrayAsList(JsArrayNumber jsArray) {
		List<Double> list = new LinkedList<Double>();
		for (int i = 0; i < jsArray.length(); i++) {
			list.add(jsArray.get(i));
		}
		return list;
	}

	/**
	 * Convert a {@link JsArrayBoolean} to a List<Boolean>.
	 * 
	 * @param jsArray
	 *            the js array
	 * @return the list
	 */
	public static List<Boolean> jsArrayAsList(JsArrayBoolean jsArray) {
		List<Boolean> list = new LinkedList<Boolean>();
		for (int i = 0; i < jsArray.length(); i++) {
			list.add(jsArray.get(i));
		}
		return list;
	}
}

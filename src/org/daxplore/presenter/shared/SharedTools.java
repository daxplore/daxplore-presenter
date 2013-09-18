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
package org.daxplore.presenter.shared;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;

/**
 * Static helper methods that can be used both on the client side (GWT) and
 * on the server side (Java).
 */
public class SharedTools {

	/**
	 * Set to true if the print methods should result in output or false
	 * if that output should be ignored.
	 */
	private static boolean debugMode = true;
	
	/**
	 * Combine a list of objects into a single string using a separator
	 * between each object.
	 * 
	 * <p>The method {@link Object#toString()} is used to get a string
	 * representation of each object.</p>
	 * 
	 * <p><b>The code:</b>
	 * <pre>{@code
	 * String[] numbers = {"one", "two", "three"};
	 * String jointNumbers = join(numbers, "~");
	 * System.out.println(jointNumbers);
	 * }</pre>
     * <b>Results in the output:</b> <i>one~two~three</i></p>
	 * 
	 * @param <T>
	 *            a generic type that can be anything
	 * @param iter
	 *            an iterable (for example a list) of objects
	 * @param seperator
	 *            the string used as a separator
	 * @return the joint string
	 */
	public static <T> String join(Iterable<T> iter, String seperator) {
		Iterator<T> i = iter.iterator();
		StringBuilder sb = new StringBuilder();
		if (i.hasNext()) {
			for (;;) {
				sb.append(i.next().toString());
				if (!i.hasNext()) {
					break;
				}
				sb.append(seperator);
			}
		}
		return sb.toString();
	}

	/**
	 * Combine an array of objects into a single string using a separator
	 * between each object.
	 * 
	 * <p>The method toString() is used to get a string representation of each
	 * object.</p>
	 * 
	 * <p><b>The code:</b>
	 * <pre>{@code
	 * String[] numbers = {"one", "two", "three"};
	 * String jointNumbers = join(numbers, "~");
	 * System.out.println(jointNumbers);
	 * }</pre>
     * <b>Results in the output:</b> <i>one~two~three</i></p>
	 * 
	 * @param <T>
	 *            a generic type that can be anything
	 * @param iter
	 *            an array of objects
	 * @param seperator
	 *            the string used as a separator
	 * @return the joint string
	 */
	public static <T> String join(T[] array, String seperator) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < (array.length - 1); i++) {
			sb.append(array[i].toString());
			sb.append(seperator);
		}
		sb.append(array[array.length - 1]);
		return sb.toString();
	}

	/**
	 * Combine an array of ints into a single string using a separator
	 * between each number.
	 * 
	 * <p><b>The code:</b>
	 * <pre>{@code
	 * int[] numbers = {1, 2, 3};
	 * String jointNumbers = join(numbers, "~");
	 * System.out.println(jointNumbers);
	 * }</pre>
     * <b>Results in the output:</b> <i>1~2~3</i></p>
	 * 
	 * @param <T>
	 *            a generic type that can be anything
	 * @param array
	 *            an array of ints
	 * @param seperator
	 *            the string used as a separator
	 * @return the joint string
	 */
	public static String join(int[] array, String seperator) {
		Integer[] wrap = new Integer[array.length];
		for (int i = 0; i < wrap.length; i++) {
			wrap[i] = array[i];
		}
		return join(wrap, seperator);
	}

	/**
	 * Get a map from parameters in a String "var1=a&var2=b&var3=c".
	 * 
	 * <p>Splits on the character '&' and creates key-value pairs given in the
	 * key=value format.</p>
	 * 
	 * @param tokens
	 *            a string containing the tokens
	 * @return a linked hash map that contains the key-value pairs
	 * @throws IllegalArgumentException
	 *             thrown if the token string is in an incorrect format or there
	 *             are duplicate keys
	 */
	public static LinkedHashMap<String, String> parseTokens(String tokens) throws IllegalArgumentException {
		String[] arStr = tokens.split("&");

		LinkedHashMap<String, String> params = new LinkedHashMap<String, String>();
		for (int i = 0; i < arStr.length; i++) {
			String[] substr = arStr[i].split("=");
			if (substr.length == 2 && !substr[0].equals("")) {
				if (params.containsKey(substr[0])) {
					throw new IllegalArgumentException("Duplicate key: '" + substr[0] + "'");
				}
				params.put(substr[0], substr[1]);
			} else {
				throw new IllegalArgumentException("Bad key-value definition: '" + tokens + "'");
			}
		}

		return params;
	}
	
	/**
	 * Find out if debug mode is on, in which case output will be
	 * printed to std.out. Otherwise output is simply ignored.
	 * 
	 * @return true, if debug is on
	 */
	public static boolean debugMode() {
		return debugMode;
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param text
	 *            a text
	 */
	public static void print(String text) {
		if (debugMode) {
			System.out.print(text);
		}
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param anObject
	 *            an object
	 */
	public static void print(Object anObject) {
		SharedTools.print(anObject.toString());
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param aByte
	 *            a byte
	 */
	public static void print(byte aByte) {
		SharedTools.print("" + aByte);
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param aShort
	 *            a short
	 */
	public static void print(short aShort) {
		SharedTools.print("" + aShort);
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param anInt
	 *            an int
	 */
	public static void print(int anInt) {
		SharedTools.print("" + anInt);
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param aLong
	 *            a long
	 */
	public static void print(long aLong) {
		SharedTools.print("" + aLong);
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param aFloat
	 *            a float
	 */
	public static void print(float aFloat) {
		SharedTools.print("" + aFloat);
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param aDouble
	 *            a double
	 */
	public static void print(double aDouble) {
		SharedTools.print("" + aDouble);
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param aBoolean
	 *            a boolean
	 */
	public static void print(boolean aBoolean) {
		SharedTools.print("" + aBoolean);
	}

	/**
	 * Prints a text to standard out if debug is on.
	 * 
	 * @param aChar
	 *            a char
	 */
	public static void print(char aChar) {
		SharedTools.print("" + aChar);
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param text
	 *            a text
	 */
	public static void println(String text) {
		if (debugMode) {
			System.out.println(text);
		}
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param anObject
	 *            an object
	 */
	public static void println(Object anObject) {
		SharedTools.println(anObject.toString());
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param aByte
	 *            a byte
	 */
	public static void println(byte aByte) {
		SharedTools.println(Byte.toString(aByte));
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param aShort
	 *            a short
	 */
	public static void println(short aShort) {
		SharedTools.println("" + aShort);
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param anInt
	 *            an int
	 */
	public static void println(int anInt) {
		SharedTools.println("" + anInt);
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param aLong
	 *            a long
	 */
	public static void println(long aLong) {
		SharedTools.println("" + aLong);
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param aFloat
	 *            a float
	 */
	public static void println(float aFloat) {
		SharedTools.println("" + aFloat);
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param aDouble
	 *            a double
	 */
	public static void println(double aDouble) {
		SharedTools.println("" + aDouble);
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param aBoolean
	 *            a boolean
	 */
	public static void println(boolean aBoolean) {
		SharedTools.println("" + aBoolean);
	}

	/**
	 * Prints a new line to standard out if debug is on.
	 * 
	 * @param aChar
	 *            the a char
	 */
	public static void println(char aChar) {
		SharedTools.println("" + aChar);
	}

	/**
	 * Justify a string with wordwrap.
	 * 
	 * <p>Code taken from
	 * <a href=http://www.rgagnon.com/javadetails/java-0013.html>rgagnon.com</a>.
	 * </p>
	 * 
	 * @param text
	 *            the text
	 * @param width
	 *            the max character-width of a line
	 * @return the string
	 */
	public static String justifyLeft(String text, int width) {
		StringBuffer buf = new StringBuffer(text);
		int lastspace = -1;
		int linestart = 0;
		int i = 0;

		while (i < buf.length()) {
			if (buf.charAt(i) == ' ') {
				lastspace = i;
			}
			if (buf.charAt(i) == '\n') {
				lastspace = -1;
				linestart = i + 1;
			}
			if (i > linestart + width - 1) {
				if (lastspace != -1) {
					buf.setCharAt(lastspace, '\n');
					linestart = lastspace + 1;
					lastspace = -1;
				} else {
					buf.insert(i, '\n');
					linestart = i + 1;
				}
			}
			i++;
		}
		return buf.toString();
	}

	/**
	 * Justify a string left with wordwrap, formatted so that it works in HTML.
	 * 
	 * <p><b>Note:</b> Mutilates proper HTML by replacing <code><br /></code>
	 * tag with <code><br><code>.</p>
	 * 
	 * @param text
	 *            the text
	 * @param width
	 *            the max character-width of a line
	 * @return the string
	 */
	public static String justifyHTML(String text, int width) {
		String justified = text.replace("<br>","\n").replace("<br />", "\n");
		justified = justifyLeft(justified, width);
		return justified.replace("\n", "<br>");
	}

	/**
	 * Split a text into two lines of approximately equal lengths, formatted
	 * to work in HTML.
	 * 
	 * @param text
	 *            the text
	 * @return the formatted text
	 */
	public static String splitInTwoHTML(String text) {
		int midpoint = text.length() / 2;
		for(int i = 0; i<text.length()/2; i++) {
			if (midpoint+i < text.length()-1 && text.charAt(midpoint + i)==' ') {
				return text.substring(0, midpoint+i) + "<br>" + text.substring(midpoint+i+1);
			} else if (text.charAt(midpoint - i)==' ') {
				return text.substring(0, midpoint-i) + "<br>" + text.substring(midpoint-i+1);
			}
		}
		return text;
	}

	/**
	 * Check if a string matches another string in an array, ignoring case.
	 * 
	 * @param in
	 *            the string to check for
	 * @param compareToList
	 *            the list that may contain the string
	 * @return true, if the list contains the string
	 */
	public static boolean equalsAnyIgnoreCase(String in, String[] compareToList) {
		boolean equals = false;
		for (int i = 0; i < compareToList.length; i++) {
			equals = equals || in.equalsIgnoreCase(compareToList[i]);
		}
		return equals;
	}

	/**
	 * Check if a string matches another string in an array.
	 * 
	 * @param in
	 *            the string to check for
	 * @param compareToList
	 *            the list that may contain the string
	 * @return true, if the list contains the string
	 */
	public static boolean equalsAny(String in, String[] compareToList) {
		boolean equals = false;
		for (int i = 0; i < compareToList.length; i++) {
			equals = equals || in.equals(compareToList[i]);
		}
		return equals;
	}
	
	/**
	 * Split a String into equal length String chunks.
	 * 
	 * <p>The last part will contain the remainder.</p>
	 * 
	 * @param string The String to be split
	 * @param chunkLength The length of the resulting chunks
	 * @return A List containing the String chunks
	 */
	public static List<String> splitString(String string, int chunkLength) {
	    List<String> chunkList = new ArrayList<String>((string.length() + chunkLength - 1) / chunkLength);

	    for (int start = 0; start < string.length(); start += chunkLength) {
	        chunkList.add(string.substring(start, Math.min(string.length(), start + chunkLength)));
	    }
	    return chunkList;
	}
}

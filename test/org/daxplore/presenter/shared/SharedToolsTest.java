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

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;

import org.junit.Test;

public class SharedToolsTest {

	@Test
	public void testJoinIntArray() {
		int[] join1 = {1, 2, 3};
		assertEquals("1~2~3", SharedTools.join(join1, "~"));
		
		int[] join2 = {Integer.MAX_VALUE, 42, 0, -1, -41, Integer.MIN_VALUE};
		assertEquals(Integer.MAX_VALUE+"\t42\t0\t-1\t-41\t"+Integer.MIN_VALUE, SharedTools.join(join2, "\t"));
	}
	
	@Test
	public void testJoinGenericArray() {
		Object[] join = {Integer.valueOf(3), Double.valueOf(1.1), "foo", new Object() {
			@Override
			public String toString() {
				return "bar";
			}
		}};
		assertEquals(3+" "+1.1+" foo bar", SharedTools.join(join, " "));
	}
	
	@Test
	public void testJoinGenericIterable() {
		List<Object> join = new LinkedList<Object>();
		join.add(3);
		join.add(1.1);
		join.add("foo");
		join.add(new Object() {
			@Override
			public String toString() {
				return "BAR!";
			}
		});
		assertEquals(3+" ! "+1.1+" ! foo ! BAR!", SharedTools.join(join, " ! "));
	}
	
	@Test
	public void testEqualsAny() {
		// test equalsAny
		String[] compareTo = {"foo", "BAR", "", "Test", " ", "\n"};
		assertTrue(SharedTools.equalsAny("foo", compareTo));
		assertTrue(SharedTools.equalsAny("BAR", compareTo));
		assertTrue(SharedTools.equalsAny("", compareTo));
		assertTrue(SharedTools.equalsAny("Test", compareTo));
		assertTrue(SharedTools.equalsAny(" ", compareTo));
		assertTrue(SharedTools.equalsAny("\n", compareTo));

		assertFalse(SharedTools.equalsAny("Foo", compareTo));
		assertFalse(SharedTools.equalsAny("bAr", compareTo));
		assertFalse(SharedTools.equalsAny("tesT", compareTo));
		assertFalse(SharedTools.equalsAny("something", compareTo));
		assertFalse(SharedTools.equalsAny(" \n", compareTo));
		assertFalse(SharedTools.equalsAny(" \r", compareTo));
		assertFalse(SharedTools.equalsAny("Other", compareTo));
		
		// test equalsAnyIgnoreCase
		assertTrue(SharedTools.equalsAnyIgnoreCase("foo", compareTo));
		assertTrue(SharedTools.equalsAnyIgnoreCase("BAR", compareTo));
		assertTrue(SharedTools.equalsAnyIgnoreCase("", compareTo));
		assertTrue(SharedTools.equalsAnyIgnoreCase("Test", compareTo));
		assertTrue(SharedTools.equalsAnyIgnoreCase(" ", compareTo));
		assertTrue(SharedTools.equalsAnyIgnoreCase("\n", compareTo));

		assertTrue(SharedTools.equalsAnyIgnoreCase("Foo", compareTo));
		assertTrue(SharedTools.equalsAnyIgnoreCase("bAr", compareTo));
		assertTrue(SharedTools.equalsAnyIgnoreCase("tesT", compareTo));
		
		assertFalse(SharedTools.equalsAnyIgnoreCase("something", compareTo));
		assertFalse(SharedTools.equalsAnyIgnoreCase(" \n", compareTo));
		assertFalse(SharedTools.equalsAnyIgnoreCase(" \r", compareTo));
		assertFalse(SharedTools.equalsAnyIgnoreCase("Other", compareTo));
	}
	
	@Test
	public void testParseTokens() {
		LinkedHashMap<String, String > map =
				SharedTools.parseTokens("foo=bar&answer=42& =\n&\n= ");
		
		assertEquals(4, map.size());
		
		assertEquals("bar", map.get("foo"));
		assertEquals("42", map.get("answer"));
		assertEquals("\n", map.get(" "));
		assertEquals(" ", map.get("\n"));
		
		assertNull(map.get("  "));
		assertNull(map.get("something"));
		
		String[] orderedKeys = {"foo", "answer", " ", "\n"};
		assertArrayEquals(orderedKeys, map.keySet().toArray());
		
		try {
			SharedTools.parseTokens("foo=");
			fail();
		} catch (IllegalArgumentException e) {
			assertEquals("Bad key-value definition: 'foo='", e.getMessage());
		}
		
		try {
			SharedTools.parseTokens("=bar");
			fail();
		} catch (IllegalArgumentException e) {
			assertEquals("Bad key-value definition: '=bar'", e.getMessage());
		}
		
		try {
			SharedTools.parseTokens("key=value=value");
			fail();
		} catch (IllegalArgumentException e) {
			assertEquals("Bad key-value definition: 'key=value=value'", e.getMessage());
		}
		
		try {
			SharedTools.parseTokens("key=value1&key=value2");
			fail();
		} catch (IllegalArgumentException e) {
			assertEquals("Duplicate key: 'key'", e.getMessage());
		}
	}
	
	@Test
	public void testJustifyLeft() {
		assertEquals("ab\nc", SharedTools.justifyLeft("abc", 2));
		assertEquals("a\nbc\nde", SharedTools.justifyLeft("a\nbcde", 2));
		assertEquals("a\nbcd", SharedTools.justifyLeft("a bcd", 3));
	}

	@Test
	public void testJustifyHTML() {
		assertEquals("ab<br>c", SharedTools.justifyHTML("abc", 2));
		assertEquals("a<br>bc<br>de", SharedTools.justifyHTML("a<br>bcde", 2));
		assertEquals("a<br>bcd", SharedTools.justifyHTML("a bcd", 3));
	}
	
	@Test
	public void testSplitInTwoHTML() {
		assertEquals("abc<br>def", SharedTools.splitInTwoHTML("abc def"));
		assertEquals("a<br>bcdefg", SharedTools.splitInTwoHTML("a bcdefg"));
		assertEquals("a b<br>cdefg", SharedTools.splitInTwoHTML("a b cdefg"));
		assertEquals(" abcdefg", SharedTools.splitInTwoHTML(" abcdefg"));
		assertEquals("abcdefg ", SharedTools.splitInTwoHTML("abcdefg "));
		assertEquals(" a<br>bcdefg ", SharedTools.splitInTwoHTML(" a bcdefg "));
	}
}

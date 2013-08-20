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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.Locale;

import javax.servlet.http.Cookie;

import org.daxplore.presenter.BrowserUserStringTestData;
import org.junit.Test;

public class ServerToolsTest {

	@Test
	public void testGetInternetExplorerVersion() {
		for (String useragent : BrowserUserStringTestData.nonIe) {
			assertEquals(-1, (int)ServerTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie5) {
			assertEquals(5, (int)ServerTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie6) {
			assertEquals(6, (int)ServerTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie7) {
			assertEquals(7, (int)ServerTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie8) {
			assertEquals(8, (int)ServerTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie9) {
			assertEquals(9, (int)ServerTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie10) {
			assertEquals(10, (int)ServerTools.getInternetExplorerVersion(useragent));
		}
	}

	@Test
	public void testIgnoreBadBrowser() {
		Cookie[] cookies1 = {
			new Cookie("foo", "bar"),
			new Cookie("ax-dax-max", "bax-hax-lax"),
			new Cookie("bad-browser", "ignore"),
			new Cookie("lump", "lump")
		};
		assertTrue(ServerTools.ignoreBadBrowser(cookies1));

		Cookie[] cookies2 = {
				new Cookie("foo", "bar"),
				new Cookie("ax-dax-max", "bax-hax-lax"),
				new Cookie("bad-browser-2", "lump")
		};
		assertFalse(ServerTools.ignoreBadBrowser(cookies2));

		Cookie[] cookies3 = {
				new Cookie("foo", "bar"),
				new Cookie("ax-dax-max", "bax-hax-lax"),
				new Cookie("bad-browser", "something"),
				new Cookie("lump", "lump")
		};
		assertFalse(ServerTools.ignoreBadBrowser(cookies3));
	}
	
	@Test
	public void testIsSupportedUploadFileVersion() {
		fail();
	}
	
	@Test
	public void testIsSupportedLocale() {
		// List supported locales
		assertTrue(ServerTools.isSupportedLocale(new Locale("en")));
		assertTrue(ServerTools.isSupportedLocale(new Locale("sv")));

		// Don't support sub-locales (in the case of administrators uploading new data)
		assertFalse(ServerTools.isSupportedLocale(new Locale("en", "uk")));
		assertFalse(ServerTools.isSupportedLocale(new Locale("sv", "fi")));
		
		// Don't support other locales
		assertFalse(ServerTools.isSupportedLocale(new Locale("de")));
		assertFalse(ServerTools.isSupportedLocale(new Locale("ms")));
		assertFalse(ServerTools.isSupportedLocale(new Locale("tr")));
	}
	
	@Test
	public void testGetAsZipInputStream() {
		fail();
	}
	
	@Test
	public void testGetAsBufferedReader() {
		fail();
	}
	
	@Test
	public void testSelectLocale() {
		fail();
	}
	
	@Test
	public void testIsSyntacticallyValidQueryString() {
		fail();
	}
}

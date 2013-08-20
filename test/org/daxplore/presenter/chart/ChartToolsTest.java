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
package org.daxplore.presenter.chart;

import org.daxplore.presenter.BrowserUserStringTestData;
import org.junit.Test;

import com.google.gwt.junit.client.GWTTestCase;

public class ChartToolsTest extends GWTTestCase {
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getModuleName() {
		return "org.daxplore.presenter.gwtPresentation";
	}

	@Test
	public void testFormatAsTwoDigits() {
		fail();
	}

	@Test
	public void testFormatAsTwoDigitsPercentage() {
		fail();
	}
	
	@Test
	public void testGetInternetExplorerVersion() {
		for (String useragent : BrowserUserStringTestData.nonIe) {
			assertEquals(-1, (int)ChartTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie5) {
			assertEquals(5, (int)ChartTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie6) {
			assertEquals(6, (int)ChartTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie7) {
			assertEquals(7, (int)ChartTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie8) {
			assertEquals(8, (int)ChartTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie9) {
			assertEquals(9, (int)ChartTools.getInternetExplorerVersion(useragent));
		}
		for (String useragent : BrowserUserStringTestData.ie10) {
			assertEquals(10, (int)ChartTools.getInternetExplorerVersion(useragent));
		}
	}
}

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

import org.daxplore.presenter.shared.SharedTools;

import com.google.gwt.i18n.client.NumberFormat;
import com.google.gwt.user.client.Window.Navigator;

/**
 * Static helper methods used in the chart package.
 */
public class ChartTools {
	
	// TODO I18n number format, right now a dot is always used
	protected static final NumberFormat decimalFormat = NumberFormat.getFormat("0.0");
	
	/**
	 * Format as two digits according to the current internationalization.
	 * 
	 * @param number
	 *            the number
	 * @return a formatted representation of the number
	 */
	public static String formatAsTwoDigits(double number) {
		if (-10 < number && number < 10) {
			return decimalFormat.format(number);
		} else {
			long i = Math.round(number);
			return Long.toString(i);
		}
	}

	/**
	 * Format as a percentage with two digits, based on current
	 * internationalization.
	 * 
	 * @param number
	 *            the number
	 * @return the string
	 */
	public static String formatAsTwoDigitsPercentage(double number) {
		return formatAsTwoDigits(number * 100) + "%";
	}

	
	protected static double ieVersion = 0.0;
	
	/**
	 * Get the user's Internet Explorer version.
	 * 
	 * <p>Returns -1 if the current browser isn't IE.</p>
	 * 
	 * @return the IE version, or -1 for other browsers
	 */
	public static int ieVersion() {
		if (ieVersion == 0.0) {
			ieVersion = getInternetExplorerVersion(Navigator.getUserAgent());
			SharedTools.println("### ieVersion = " + ieVersion);
		}
		return (int) ieVersion;
	}
	
	protected static double getInternetExplorerVersion(String useragent) {
		double rv = -1.0; // Return value assumes failure.
		if (useragent != null) {
			Pattern re = new Pattern("MSIE ([0-9]{1,}[.0-9]{0,})");
			String[] ma = re.match(useragent);
			if (ma.length == 2) {
				rv = Double.parseDouble(ma[1]);
			}
			;
		}
		return rv;
	}
}

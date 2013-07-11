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
package org.daxplore.presenter.client;

import org.daxplore.presenter.shared.SharedTools;

public final class Tracking {

	/**
	 * Track an event.
	 * 
	 * <p>Normally triggered by the user viewing a new chart.</p>
	 * 
	 * @param googleAnalyticsID
	 *            The GoogleAnalyticsID the tracking data is sent to
	 * @param historyToken
	 *            The text token that is sent to the server
	 */
	public static void track(String googleAnalyticsID, String prefix, String historyToken) {

		if (historyToken == null) {
			historyToken = "historyToken_null";
		}

		historyToken = "/" + prefix + "#" + historyToken;

		trackGoogleAnalytics(googleAnalyticsID, historyToken);
		SharedTools.println("Tracking: " + historyToken);
	}

	/**
	 * trigger google analytic native js - included in the build CHECK -
	 * DemoGoogleAnalytics.gwt.xml for -> &lt;script src="../ga.js"\&gt;
	 * 
	 * <p>See: <a href=http://code.google.com/intl/en-US/apis/analytics/docs/gaJS/
	 * gaJSApiEventTracking.html>http://code.google.com/intl/en-US/apis/analytics/docs/gaJS/
	 * gaJSApiEventTracking.html</a></p>
	 * 
	 * @param historyToken
	 */
	public static native void trackGoogleAnalytics(String googleAnalyticsID, String historyToken) /*-{
		try {
			// setup tracking object with account
			var pageTracker = $wnd._gat._createTracker(googleAnalyticsID);

			// turn on anchor observing
			pageTracker._setAllowAnchor(true)

			// send event to google server
			pageTracker._trackPageview(historyToken);
			//alert("Track " + historyToken);
		} catch (err) {
			// debug
			//alert('FAILURE: to send in event to google analytics: ' + err);
		}
	}-*/;

}
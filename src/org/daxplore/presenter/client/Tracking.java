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

public final class Tracking {

	/**
	 * Send a user action event to Google Analytics.
	 * 
	 * @param category The event category
	 * @param action The event action
	 */
	public final static native void googleAnalyticsEvent(String category, String action) /*-{
		if(typeof($wnd.ga) != 'undefined') {
	    	$wnd.ga('send', 'event', category, action);
		}
	}-*/;
	
	/**
	 * Send a message that will be received by pages that contain an iframe
	 * with this GWT app.
	 * 
	 * <p>This can, for example, allow the outer page to update the window url.</p>
	 * @param historyToken
	 */
	public final static native void iFrame(String historyToken) /*-{
	    $wnd.parent.postMessage(historyToken, '*');
	}-*/;

}

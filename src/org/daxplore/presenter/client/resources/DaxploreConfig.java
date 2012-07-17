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
package org.daxplore.presenter.client.resources;

import org.daxplore.presenter.client.ui.ChartTypeOptionsPanel;
import org.daxplore.presenter.client.ui.EmbedSize;
import org.daxplore.presenter.client.ui.StagePanel;

import com.google.gwt.i18n.client.Constants;

/**
 * An interface that supplies configuration settings to the Daxplore Client.
 */
public interface DaxploreConfig extends Constants {

	/**
	 * Get a list of the different suggested embed widths in pixels.
	 * 
	 * <p>Used to load sizes in {@link EmbedSize}.</p>
	 * 
	 * <p>Written as a list separated by \\, (backslash-backslash-comma).</p>
	 * 
	 * @return a list of integer widths in pixels
	 */
	public String embedWidths();

	/**
	 * Get a list of the different suggested embed heights in pixels.
	 * 
	 * <p>Used to load sizes in {@link EmbedSize}.</p>
	 * 
	 * <p>Written as a list separated by \\, (backslash-backslash-comma).</p>
	 * 
	 * @return a list of integer heights in pixels
	 */
	public String embedHeights();

	/**
	 * A boolean value that defines if the mean buttons should shown.
	 * 
	 * <p>Used in {@link ChartTypeOptionsPanel} to decide if the buttons should be
	 * shown.</p>
	 * 
	 * @return true, if the mean buttons should be shown
	 */
	public boolean showMeanButtons();

	/**
	 * Get the minimum width that the {@link StagePanel} can have.
	 * 
	 * @return the min width in pixels
	 */
	public int stagePanelMinWidth();
	
	/**
	 * Get a pre-defined query definition string.
	 * 
	 * <p>This is used to show a defualt chart when the site loads, if no user
	 * input is provided.</p>
	 * @return
	 */
	public String defaultQueryString();

	/**
	 * The Google Analytics ID that should be used to track statistics for your
	 * site.
	 * 
	 * <p>Get your own web site statistics by signing up on <a
	 * href="http://google.com/analytics">Google Analytics</a>.</p>
	 * 
	 * <p><b>Note:</b></p> The site works perfectly without tracking, so you
	 * don't have to sign up for Google Statistics if you don't want to. But it
	 * is a good way to measure how popular your site is and how it is used.</p>
	 * 
	 * @return the Google Analytics ID
	 */
	public String googleAnalyticsID();
}

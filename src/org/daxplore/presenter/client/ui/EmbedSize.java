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
package org.daxplore.presenter.client.ui;

import org.daxplore.presenter.client.resources.DaxploreConfig;
import org.daxplore.presenter.client.resources.UITexts;

/**
 * An Enum that defines the sizes that users can select for embedded charts.
 */
public enum EmbedSize {
	SMALL(0), MEDIUM(1), LARGE(2);

	private int textIndex, width = Integer.MIN_VALUE,	height = Integer.MIN_VALUE;

	/**
	 * Instantiates a new embed size.
	 * 
	 * @param textIndex
	 *            an index used for loading resource property texts
	 */
	EmbedSize(int textIndex) {
		this.textIndex = textIndex;
	}

	/**
	 * Get the pixel width that a chart width this size should have
	 * 
	 * @param config
	 *            the configuration file that defines sizes
	 * @return the width in pixels
	 */
	public int getWidth(DaxploreConfig config) {
		if (width == Integer.MIN_VALUE) {
			String[] embedWidths = config.embedWidths().split("\\\\,");
			width = Integer.parseInt(embedWidths[textIndex].replaceAll(" ", ""));
		}
		return width;
	}

	/**
	 * Get the pixel height that a chart width this size should have
	 * 
	 * @param config
	 *            the configuration file that defines sizes
	 * @return the height in pixels
	 */
	public int getHeight(DaxploreConfig config) {
		if (height == Integer.MIN_VALUE) {
			String[] embedHeights = config.embedHeights().split("\\\\,");
			height = Integer.parseInt(embedHeights[textIndex].replaceAll(" ", ""));
		}
		return height;
	}

	/**
	 * Get the text used on the embed size buttons.
	 * 
	 * @param config
	 *            the configuration file that defines sizes
	 * @param uiTexts
	 *            the resource file that supplies localized UI texts
	 * @return the button text
	 */
	public String getButtonText(DaxploreConfig config, UITexts uiTexts) {
		String[] embedTexts = uiTexts.embedButtonTexts().split("\\\\,");
		return embedTexts[textIndex] + " "
				+ uiTexts.embedButtonNumbers(getWidth(config),	getHeight(config));
	}
}
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
package org.daxplore.presenter.chart.display;

import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.Widget;

/**
 * A blank chart that can be displayed as a placeholder when waiting for a real
 * chart to load.
 */
public class BlankChart extends Composite implements Chart {

	private SimplePanel mainPanel = new SimplePanel();

	/**
	 * Instantiates a new blank chart.
	 */
	public BlankChart() {
		initWidget(mainPanel);
		System.out.println("blank chart");
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void setChartSizeSmart(int width, int height) {
		mainPanel.setSize(width + "px", height + "px");
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getMinWidth() {
		return 0;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Widget getExternalLegend() {
		return new SimplePanel();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Widget getExternalHeader() {
		return new SimplePanel();
	}

	public int getMaxWidth() {
		return Integer.MAX_VALUE; //TODO
	}
}

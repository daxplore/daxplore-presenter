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

import org.daxplore.presenter.chart.resources.ChartResources;
import org.daxplore.presenter.chart.resources.ChartTexts;

import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.Image;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.inject.Inject;

/**
 * A widget with an animated picture that shows that the chart is loading.
 */
public class QueryActiveAnimation extends Composite {
	SimplePanel mainPanel;
	Image loadingImage;
	Image doneImage;

	/**
	 * Instantiates a new loading chart animation.
	 * 
	 * @param chartTexts
	 *            the chart texts
	 * @param chartResources
	 *            the chart resources
	 */
	@Inject
	public QueryActiveAnimation(ChartTexts chartTexts, ChartResources chartResources) {
		mainPanel = new SimplePanel();
		loadingImage = new Image(chartResources.loaderLoadingImage());
		loadingImage.setAltText(chartTexts.loadingChart());
		loadingImage.setTitle(chartTexts.loadingChart());
		doneImage = new Image(chartResources.loaderDoneImage());
		doneImage.setAltText(chartTexts.loadingChartDone());
		doneImage.setTitle(chartTexts.loadingChartDone());
		initWidget(mainPanel);
		setWidth("20px");
		setHeight("20px");
		setStylePrimaryName("daxplore-QueryActiveAnimation");
		setLoading(false);
	}

	/**
	 * Set the widget state to loading or not loading.
	 * 
	 * @param loading
	 *            is the chart loading?
	 */
	public void setLoading(boolean loading) {
		if (loading) {
			mainPanel.setWidget(loadingImage);
		} else {
			mainPanel.setWidget(doneImage);
		}
	}
}

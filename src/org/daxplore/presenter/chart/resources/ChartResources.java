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
package org.daxplore.presenter.chart.resources;

import com.google.gwt.resources.client.ClientBundle;
import com.google.gwt.resources.client.ImageResource;

/**
 * An interface that supplies resources, like images, to the charts.
 */
public interface ChartResources extends ClientBundle {

	/**
	 * An image that is shown in the corner of a chart when it has loaded
	 * properly.
	 * 
	 * @return the loading-done image
	 */
	@Source("img/loader-done-empty-20.gif")
	public ImageResource loaderDoneImage();

	/**
	 * An image that is shown in the corner of a chart to indicate that the
	 * chart is currently loading.
	 * 
	 * @return the currently-loading image
	 */
	@Source("img/ring-loader-20.gif")
	public ImageResource loaderLoadingImage();

}

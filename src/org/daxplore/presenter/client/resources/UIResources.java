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

import org.daxplore.presenter.client.ui.ImageButtonPanel;

import com.google.gwt.resources.client.ClientBundle;
import com.google.gwt.resources.client.ImageResource;
import com.google.gwt.user.client.ui.Tree;

/**
 * An interface that supplies resources, like images, to the Daxplore Client.
 */
public interface UIResources extends ClientBundle, Tree.Resources {

	// Tree.Resources:

	/**
	 * {@inheritDoc}
	 */
	@Source("img/open.gif")
	public ImageResource treeOpen();

	/**
	 * {@inheritDoc}
	 */
	@Source("img/closed.gif")
	public ImageResource treeClosed();

	// Images:

	/**
	 * The image used on the print button in the {@link ImageButtonPanel}.
	 * 
	 * @return the print image
	 */
	@Source("img/32px-Document-print.png")
	public ImageResource printButtonImage();

	/**
	 * The image used on the csv button in the {@link ImageButtonPanel}.
	 * 
	 * @return the print image
	 */
	@Source("img/32px-X-office-spreadsheet.png")
	public ImageResource csvButtonImage();

	/**
	 * The image used on the embed button in the {@link ImageButtonPanel}.
	 * 
	 * @return the print image
	 */
	@Source("img/32px-X-office-document.png")
	public ImageResource embedButtonImage();
}

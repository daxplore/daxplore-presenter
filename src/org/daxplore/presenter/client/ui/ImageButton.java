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

import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.event.dom.client.DragStartEvent;
import com.google.gwt.event.dom.client.DragStartHandler;
import com.google.gwt.event.dom.client.HasClickHandlers;
import com.google.gwt.event.shared.HandlerRegistration;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.Image;
import com.google.gwt.user.client.ui.SimplePanel;

/**
 * A button widget that has an image on it.
 */
public class ImageButton extends Composite implements HasClickHandlers {
	
	protected SimplePanel mainPanel;
	protected Image buttonImage;
	
	protected boolean isPressed = false;
	
	/**
	 * Instantiates a new image button.
	 * 
	 * @param buttonImage
	 *            the image displayed on the button
	 * @param titleText
	 *            the title text, displayed on mouse over
	 */
	public ImageButton(Image buttonImage, String titleText){
		this.buttonImage = buttonImage;
		buttonImage.setTitle(titleText);
		mainPanel = new SimplePanel();
		mainPanel.setWidget(buttonImage);
		mainPanel.setWidth(buttonImage.getWidth()+"px");
		mainPanel.setHeight(buttonImage.getHeight()+"px");
		initWidget(mainPanel);
		
		this.setStyleName("daxplore-ImageButton");

		// Prevent dragging of the button's image
		buttonImage.addDragStartHandler(new DragStartHandler() {
			@Override
			public void onDragStart(DragStartEvent event) {
				event.preventDefault();
			}
		});
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public HandlerRegistration addClickHandler(ClickHandler handler){
		return buttonImage.addClickHandler(handler);
	}
}

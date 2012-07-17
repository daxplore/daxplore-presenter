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
package org.daxplore.presenter.client.event;

import org.daxplore.presenter.client.ui.ImageButton;
import org.daxplore.presenter.client.ui.ImageButtonPanel;

import com.google.web.bindery.event.shared.Event;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.HandlerRegistration;

/**
 * An event sent when an {@link ImageButton} has been clicked in the
 * {@link ImageButtonPanel}.
 * 
 * <p>Send the event over the system's {@link EventBus}.</p>
 */
public class ImageButtonEvent extends Event<ImageButtonHandler> {

	protected static final Type<ImageButtonHandler> TYPE = new Type<ImageButtonHandler>();

	/**
	 * An Enum which defines which button has been pressed and what action to
	 * take.
	 * 
	 * <p><b>PRINT:</b> the user wants to print the chart<br /> <b>CSV:</b> the
	 * user wants to download a csv file with the data from the chart<br />
	 * <b>EMBED:</b> the user wants to get an embed-code to use on their own web
	 * page</p>
	 */
	public enum ImageButtonAction {
		PRINT, CSV, EMBED
	}

	protected final ImageButtonAction imageButtonAction;

	/**
	 * Instantiates a new image button event.
	 * 
	 * @param imageButtonAction
	 *            the image button action
	 */
	public ImageButtonEvent(ImageButtonAction imageButtonAction) {
		this.imageButtonAction = imageButtonAction;
	}

	/**
	 * Get the button and corresponding action that was triggered.
	 * 
	 * @return the selected action
	 */
	public ImageButtonAction getAction() {
		return imageButtonAction;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<ImageButtonHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(ImageButtonHandler handler) {
		handler.onImageButtonClick(this);
	}

	/**
	 * Register a handler that will be notified whenever this event is sent on
	 * the EventBus.
	 * 
	 * @param eventBus
	 *            the event bus
	 * @param eventHandler
	 *            the event handler
	 * @return the handler registration
	 */
	public static HandlerRegistration register(EventBus eventBus, ImageButtonHandler eventHandler) {
		return eventBus.addHandler(TYPE, eventHandler);
	}
}
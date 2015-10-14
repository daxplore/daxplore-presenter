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

import com.google.web.bindery.event.shared.Event;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.HandlerRegistration;

/**
 * An event sent when the user has selecting a new question, perspective or some
 * other option that will result in a new chart.
 * 
 * <p>Send the event over the system's {@link EventBus}.</p>
 */
public class SelectionUpdateEvent extends Event<SelectionUpdateHandler> {

	private static final Type<SelectionUpdateHandler> TYPE = new Type<>();

	/**
	 * Instantiates a new selection update event.
	 */
	public SelectionUpdateEvent() {
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<SelectionUpdateHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(SelectionUpdateHandler handler) {
		handler.onSelectionUpdate(this);
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
	public static HandlerRegistration register(EventBus eventBus, SelectionUpdateHandler eventHandler) {
		return eventBus.addHandler(TYPE, eventHandler);
	}
}

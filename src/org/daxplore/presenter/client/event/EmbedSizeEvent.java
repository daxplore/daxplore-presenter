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

import org.daxplore.presenter.client.ui.EmbedPopup;
import org.daxplore.presenter.client.ui.EmbedSize;

import com.google.web.bindery.event.shared.Event;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.HandlerRegistration;

/**
 * An event that signals that a new size in the embed-creation-dialog has been
 * selecter.
 * 
 * <p>This is most likely a result of the user clicking a size button, which can
 * be found in {@link EmbedPopup}.</p>
 * 
 * <p>Send the event over the system's {@link EventBus}.</p>
 */
public class EmbedSizeEvent extends Event<EmbedSizeHandler> {

	private static final Type<EmbedSizeHandler> TYPE = new Type<>();

	private EmbedSize embedSize;

	/**
	 * Instantiates a new embed size event.
	 * 
	 * @param size
	 *            the size
	 */
	public EmbedSizeEvent(EmbedSize size) {
		embedSize = size;
	}

	/**
	 * Get the new embed size that has been selected.
	 * 
	 * @return the embed size
	 */
	public EmbedSize getEmbedSize() {
		return embedSize;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<EmbedSizeHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(EmbedSizeHandler handler) {
		handler.onEmbedSize(this);
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
	public static HandlerRegistration register(EventBus eventBus, EmbedSizeHandler eventHandler) {
		return eventBus.addHandler(TYPE, eventHandler);
	}
}

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
package org.daxplore.presenter.admin.event;

import com.google.web.bindery.event.shared.Event;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.HandlerRegistration;

/**
 * An event sent when a new set of Prefix Metadata has been received from the server.
 * 
 * <p>Send the event over the system's {@link EventBus}.</p>
 */
public class PrefixMetadataEvent extends Event<PrefixMetadataHandler> {

	private static final Type<PrefixMetadataHandler> TYPE = new Type<PrefixMetadataHandler>();

	private PrefixMetadata prefixMetadata;

	/**
	 * Instantiates a new query update event.
	 * 
	 * @param prefixMetadata
	 *            the new metadata that was received
	 */
	public PrefixMetadataEvent(PrefixMetadata prefixMetadata) {
		this.prefixMetadata = prefixMetadata;
	}

	/**
	 * Gets the new prefix metadata.
	 * 
	 * @return the prefix metadata item
	 */
	public PrefixMetadata getPrefixMetadata() {
		return prefixMetadata;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<PrefixMetadataHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(PrefixMetadataHandler handler) {
		handler.onPrefixMetadataUpdate(this);
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
	public static HandlerRegistration register(EventBus eventBus, PrefixMetadataHandler eventHandler) {
		return eventBus.addHandler(TYPE, eventHandler);
	}
}

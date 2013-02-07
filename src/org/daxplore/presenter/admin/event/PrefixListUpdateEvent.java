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

import java.util.List;

import com.google.web.bindery.event.shared.Event;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.HandlerRegistration;

/**
 * An event sent when the Prefix List has been updated.
 * 
 * <p>Send the event over the system's {@link EventBus}.</p>
 */
public class PrefixListUpdateEvent extends Event<PrefixListUpdateHandler> {
	private static final Type<PrefixListUpdateHandler> TYPE = new Type<PrefixListUpdateHandler>();
	
	private final List<String> prefixList;

	/**
	 * Instantiates a new image button event.
	 * 
	 * @param prefixList
	 *            the new prefix list
	 */
	public PrefixListUpdateEvent(List<String> prefixList) {
		this.prefixList = prefixList;
	}

	/**
	 * Get the updated prefix list.
	 * 
	 * @return the new prefix list
	 */
	public List<String> getPrefixList() {
		return prefixList;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<PrefixListUpdateHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(PrefixListUpdateHandler handler) {
		handler.onPrefixListUpdate(this);
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
	public static HandlerRegistration register(EventBus eventBus, PrefixListUpdateHandler eventHandler) {
		return eventBus.addHandler(TYPE, eventHandler);
	}
}
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

import org.daxplore.presenter.client.ui.WarningBanner;

import com.google.web.bindery.event.shared.Event;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.HandlerRegistration;

/**
 * An event that sends a signal to close the global {@link WarningBanner}.
 * 
 * Send the event over the system's {@link EventBus}.
 */
public class CloseWarningBannerEvent extends Event<CloseWarningBannerHandler> {

	protected static final Type<CloseWarningBannerHandler> TYPE = new Type<CloseWarningBannerHandler>();

	/**
	 * Instantiates a new close warning banner event.
	 */
	public CloseWarningBannerEvent() {
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<CloseWarningBannerHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(CloseWarningBannerHandler handler) {
		handler.onCloseWarningBanner(this);
	}

	/**
	 * Register a handler that will be notified whenever this event is sent on
	 * the EventBus.
	 * 
	 * @param eventBus
	 *            the event bus
	 * @param bannerHandler
	 *            the banner handler
	 * @return the handler registration
	 */
	public static HandlerRegistration register(EventBus eventBus, CloseWarningBannerHandler bannerHandler) {
		return eventBus.addHandler(TYPE, bannerHandler);
	}
}

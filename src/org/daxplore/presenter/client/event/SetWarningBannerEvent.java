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
 * An event sent to show a global {@link WarningBanner}.
 * 
 * <p>Send the event over the system's {@link EventBus}.</p>
 */
public class SetWarningBannerEvent extends Event<SetWarningBannerHandler> {

	private static final Type<SetWarningBannerHandler> TYPE = new Type<SetWarningBannerHandler>();

	private final WarningBanner warningBanner;

	/**
	 * Instantiates a new warning banner event.
	 * 
	 * @param warningBanner
	 *            the warning banner to show
	 */
	public SetWarningBannerEvent(WarningBanner warningBanner) {
		this.warningBanner = warningBanner;
	}

	/**
	 * Get the warning banner that should be shown globally.
	 * 
	 * @return the warning banner
	 */
	public WarningBanner getWarningBanner() {
		return warningBanner;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<SetWarningBannerHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(SetWarningBannerHandler handler) {
		handler.onSetWarningBanner(this);
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
	public static HandlerRegistration register(EventBus eventBus, SetWarningBannerHandler bannerHandler) {
		return eventBus.addHandler(TYPE, bannerHandler);
	}
}

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
 * An event sent when the server communication channel status is changesd.
 * 
 * <p>Send the event over the system's {@link EventBus}.</p>
 */
public class ServerChannelEvent extends Event<ServerChannelHandler> {

	public enum ServerStatus {
		OPEN, ERROR, CLOSED
	}
		
	protected static final Type<ServerChannelHandler> TYPE = new Type<ServerChannelHandler>();

	private final ServerStatus serverStatus;
	private final String message;
	
	public ServerChannelEvent(ServerStatus serverStatus, String message) {
		this.serverStatus = serverStatus;
		this.message = message;
	}

	public ServerStatus getServerStatus() {
		return serverStatus;
	}
	
	public String getServerStatusMessage() {
		return message;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<ServerChannelHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(ServerChannelHandler handler) {
		handler.onServerStatus(this);
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
	public static HandlerRegistration register(EventBus eventBus, ServerChannelHandler eventHandler) {
		return eventBus.addHandler(TYPE, eventHandler);
	}
}

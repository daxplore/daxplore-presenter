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

import org.daxplore.presenter.shared.QueryDefinition;

import com.google.web.bindery.event.shared.Event;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.HandlerRegistration;

/**
 * An event sent when a new {@link QueryDefinition} has been created.
 * 
 * <p>This is usually the result of a {@link SelectionUpdateEvent} triggered by
 * the user selecting a new question or perspective or selecting some other
 * option that will result in a new chart.</p>
 * 
 * <p>Send the event over the system's {@link EventBus}.</p>
 */
public class QueryUpdateEvent extends Event<QueryUpdateHandler> {

	private static final Type<QueryUpdateHandler> TYPE = new Type<>();

	private QueryDefinition queryDefinition;

	/**
	 * Instantiates a new query update event.
	 * 
	 * @param queryDefinition
	 *            the new query definition that has been created
	 */
	public QueryUpdateEvent(QueryDefinition queryDefinition) {
		this.queryDefinition = queryDefinition;
	}

	/**
	 * Gets the new query definition.
	 * 
	 * @return the query definition
	 */
	public QueryDefinition getQueryDefinition() {
		return queryDefinition;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<QueryUpdateHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(QueryUpdateHandler handler) {
		handler.onQueryUpdate(this);
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
	public static HandlerRegistration register(EventBus eventBus, QueryUpdateHandler eventHandler) {
		return eventBus.addHandler(TYPE, eventHandler);
	}
}

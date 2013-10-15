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

import org.daxplore.presenter.client.json.shared.ChartDataParserClient;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.web.bindery.event.shared.Event;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.HandlerRegistration;

/**
 * An event sent when the data from a query is ready to be displayed.
 * 
 * <p>Send the event over the system's {@link EventBus}.</p>
 */
public class QueryReadyEvent extends Event<QueryReadyHandler> {

	private static final Type<QueryReadyHandler> TYPE = new Type<QueryReadyHandler>();

	private final QueryDefinition queryDefinition;
	private final ChartDataParserClient queryData;

	public QueryReadyEvent(QueryDefinition queryDefinition, ChartDataParserClient queryData) {
		this.queryDefinition = queryDefinition;
		this.queryData = queryData;
	}
	
	public QueryDefinition getQueryDefinition() {
		return queryDefinition;
	}
	
	public ChartDataParserClient getQueryData() {
		return queryData;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Event.Type<QueryReadyHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(QueryReadyHandler handler) {
		handler.onQueryReady(this);
	}

	/**
	 * Register a handler that will be notified whenever this event is sent on
	 * the EventBus.
	 * 
	 * @param eventBus
	 *            the event bus
	 * @param queryReadyHandler
	 *            the query ready handler
	 * @return the handler registration
	 */
	public static HandlerRegistration register(EventBus eventBus, QueryReadyHandler queryReadyHandler) {
		return eventBus.addHandler(TYPE, queryReadyHandler);
	}


}

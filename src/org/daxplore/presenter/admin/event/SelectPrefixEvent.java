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

public class SelectPrefixEvent extends Event<SelectPrefixHandler> {

	private static final Type<SelectPrefixHandler> TYPE = new Type<>();

	private final String prefix;
	
	public SelectPrefixEvent(String prefix) {
		this.prefix = prefix;
	}

	public String getPrefix() {
		return prefix;
	}

	@Override
	public Event.Type<SelectPrefixHandler> getAssociatedType() {
		return TYPE;
	}

	@Override
	protected void dispatch(SelectPrefixHandler handler) {
		handler.onSelectPrefix(this);
	}

	public static HandlerRegistration register(EventBus eventBus, SelectPrefixHandler eventHandler) {
		return eventBus.addHandler(TYPE, eventHandler);
	}
}

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

import com.google.gwt.event.shared.EventHandler;
import com.google.web.bindery.event.shared.EventBus;

/**
 * Used to handle {@link SelectionUpdateEvent}s sent over the {@link EventBus}.
 * 
 * <p>Should be implemented by the class responsible for creating a new
 * {@link QueryDefinition} when the user has selected options that will result
 * in a new chart.</p>
 */
public interface SelectionUpdateHandler extends EventHandler {
	void onSelectionUpdate(SelectionUpdateEvent event);
}

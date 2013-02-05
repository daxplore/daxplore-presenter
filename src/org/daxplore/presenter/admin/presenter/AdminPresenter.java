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
package org.daxplore.presenter.admin.presenter;

import org.daxplore.presenter.admin.view.AdminView;

import com.google.gwt.user.client.ui.HasWidgets;
import com.google.gwt.user.client.ui.Widget;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

public class AdminPresenter implements Presenter {
	protected EventBus eventBus;
	protected AdminView adminView;
	
	@Inject
	protected AdminPresenter(EventBus eventBus, AdminView adminView) {
		this.eventBus = eventBus;
		this.adminView = adminView;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void go(HasWidgets container) {
		container.clear();
		container.add(getDisplay());
	}
	
	public Widget getDisplay() {
		return adminView.asWidget();
	}

	/**
	 * Returns the "sidebar slot" where a navigation widget can be displayed.
	 * 
	 * @return a panel, or similar, that can hold a widget
	 */
	public HasWidgets getSidebarContentSlot() {
		return adminView.getSidebarContentSlot();
	}

	/**
	 * Returns the "main slot" where the primary content widget is displayed.
	 * 
	 * @return a panel, or similar, that can hold a widget
	 */
	public HasWidgets getMainContentSlot() {
		return adminView.getMainContentSlot();
	}

}

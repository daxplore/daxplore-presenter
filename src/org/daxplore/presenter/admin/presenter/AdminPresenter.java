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

import org.daxplore.presenter.admin.event.SelectPrefixEvent;
import org.daxplore.presenter.admin.event.SelectPrefixHandler;
import org.daxplore.presenter.admin.view.AdminView;
import org.daxplore.presenter.admin.view.PrefixDisplayViewImpl;

import com.google.gwt.user.client.ui.HasWidgets;
import com.google.gwt.user.client.ui.Widget;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

public class AdminPresenter implements Presenter {
	private EventBus eventBus;
	private AdminView adminView;
	private PrefixListPresenter prefixListPresenter; 
	
	@Inject
	protected AdminPresenter(EventBus eventBus, AdminView adminView, PrefixListPresenter prefixListPresenter) {
		this.eventBus = eventBus;
		this.adminView = adminView;
		this.prefixListPresenter = prefixListPresenter;
		bind();
	}

	private void bind() {
		SelectPrefixEvent.register(eventBus, new SelectPrefixHandler() {
			@Override
			public void onSelectPrefix(SelectPrefixEvent event) {
				String prefix = event.getPrefix();
				PrefixDisplayPresenter prefixDisplayPresenter = new PrefixDisplayPresenter(eventBus, new PrefixDisplayViewImpl(), prefix);
				prefixDisplayPresenter.go(adminView.getMainContentSlot());
			}
		});
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void go(HasWidgets container) {
		container.clear();
		container.add(getDisplay());
		prefixListPresenter.go(adminView.getSidebarContentSlot());
	}
	
	public Widget getDisplay() {
		return adminView.asWidget();
	}

}

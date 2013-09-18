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
package org.daxplore.presenter.admin;

import org.daxplore.presenter.admin.event.SelectPrefixEvent;
import org.daxplore.presenter.admin.event.SelectPrefixHandler;
import org.daxplore.presenter.admin.presenter.AdminPresenter;
import org.daxplore.presenter.admin.presenter.PrefixListPresenter;
import org.daxplore.presenter.admin.presenter.Presenter;

import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.event.logical.shared.ValueChangeHandler;
import com.google.gwt.user.client.History;
import com.google.gwt.user.client.ui.HasWidgets;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

public class AdminController implements Presenter, ValueChangeHandler<String> {

	private final EventBus eventBus;
	private final AdminPresenter adminPresenter;
	private final PrefixListPresenter prefixListPresenter;

	@Inject
	protected AdminController(EventBus eventBus, AdminPresenter adminPresenter, PrefixListPresenter prefixListPresenter) {
		this.eventBus = eventBus;
		this.adminPresenter = adminPresenter;
		this.prefixListPresenter = prefixListPresenter;
		bind();
	}

	private void bind() {
		History.addValueChangeHandler(this);

		SelectPrefixEvent.register(eventBus, new SelectPrefixHandler() {
			@Override
			public void onSelectPrefix(SelectPrefixEvent event) {
				History.newItem("prefix="+event.getPrefix());
			}
		});
	}

	@Override
	public void go(final HasWidgets container) {
		adminPresenter.go(container);
		String token = History.getToken();
		if (token!=null && !token.isEmpty()) {
			History.newItem(token, false);
			if (token.startsWith("prefix=")) {
				String prefix = token.split("=", 2)[1];
				prefixListPresenter.selectPrefix(prefix);
			}
		}
	}

	/**
	 * Handle history changes
	 */
	@Override
	public void onValueChange(ValueChangeEvent<String> event) {
		String token = event.getValue();

		if (token != null) {
			if (token.startsWith("prefix=")) {
				String prefix = token.split("=", 2)[1];
				prefixListPresenter.selectPrefix(prefix);
				//presenter = new PrefixDisplayPresenter(eventBus, new PrefixDisplayViewImpl(), prefix);
			}
		}
	}

}


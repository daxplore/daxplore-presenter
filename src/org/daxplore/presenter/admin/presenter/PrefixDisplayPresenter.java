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

import org.daxplore.presenter.admin.event.PrefixMetadata;
import org.daxplore.presenter.admin.event.PrefixMetadataEvent;
import org.daxplore.presenter.admin.event.PrefixMetadataHandler;
import org.daxplore.presenter.admin.model.PrefixDataModel;
import org.daxplore.presenter.admin.view.PrefixDisplayView;

import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.HasWidgets;
import com.google.web.bindery.event.shared.EventBus;

public class PrefixDisplayPresenter implements Presenter {

	private final EventBus eventBus;
	private final String prefix;
	private final PrefixDisplayView prefixDisplayView;
	
	private static String href;
	
	public PrefixDisplayPresenter(EventBus eventBus, PrefixDisplayView prefixDisplayView,
			PrefixDataModel prefixModel, String prefix) {
		this.eventBus = eventBus;
		this.prefixDisplayView = prefixDisplayView;
		this.prefix = prefix;
		prefixDisplayView.setPrefix(prefix);
		if (href == null) {
			href = Window.Location.getHref();
			href = href.substring(0, href.lastIndexOf('/'));
			href = href + "/";
		}
		prefixDisplayView.setPrefixHref(href + prefix);
		bind();
		prefixModel.updatePrefixMetadata(prefix);
	}
	
	private void bind() {
		PrefixMetadataEvent.register(eventBus, new PrefixMetadataHandler() {
			@Override
			public void onPrefixMetadataUpdate(PrefixMetadataEvent event) {
				PrefixMetadata metadata = event.getPrefixMetadata();
				if(metadata.getPrefix().equals(prefix)) {
					prefixDisplayView.setStatDataItemCount(metadata.getStatDataItemCount());
				}
			}
		});
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void go(HasWidgets container) {
		container.clear();
		container.add(prefixDisplayView.asWidget());
	}
}

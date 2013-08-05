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
package org.daxplore.presenter.admin.model;

import org.daxplore.presenter.admin.event.SettingsUpdateEvent;

import com.google.gwt.http.client.Request;
import com.google.gwt.http.client.RequestCallback;
import com.google.gwt.http.client.Response;
import com.google.gwt.json.client.JSONObject;
import com.google.gwt.json.client.JSONParser;
import com.google.gwt.user.client.Window;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * The SettingsData model is responsible for getting admin panel settings.
 */
public class SettingsDataModelImpl implements SettingsDataModel {

	private final EventBus eventBus;
	private String href;
	
	@Inject
	protected SettingsDataModelImpl(EventBus eventBus) {
		this.eventBus = eventBus;
		// assume that path ends with /admin/settings
		href = Window.Location.getProtocol() + "//" + Window.Location.getHost() + Window.Location.getPath() + "/settings";
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void fetchSettings(String prefix) {
		ServerPost.send(href + "?action=get&prefix="+prefix, new SettingsResponseReciever(prefix));
	}
	
	private class SettingsResponseReciever implements RequestCallback {
		private String prefix;
		
		public SettingsResponseReciever(String prefix) {
			this.prefix = prefix;
		}
		
		/**
		 * {@inheritDoc}
		 */
		@Override
		public void onResponseReceived(Request request, Response response) {
			String responseText = response.getText();
			if(responseText!=null && responseText.length()>0) {
				JSONObject jsonMap = JSONParser.parseStrict(responseText).isObject();
				if (jsonMap!=null) {
					eventBus.fireEvent(new SettingsUpdateEvent(prefix, jsonMap));
				}
			}
		}
	
		/**
		 * {@inheritDoc}
		 */
		@Override
		public void onError(Request request, Throwable exception) {
			// TODO Reattempt? Depends on why it failed and number of attempts.
		}
	}


}

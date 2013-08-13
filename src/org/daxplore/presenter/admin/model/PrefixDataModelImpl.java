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

import java.util.LinkedList;

import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.admin.event.PrefixListUpdateEvent;
import org.daxplore.presenter.admin.event.PrefixMetadata;
import org.daxplore.presenter.admin.event.PrefixMetadataEvent;

import com.google.gwt.http.client.Request;
import com.google.gwt.http.client.RequestCallback;
import com.google.gwt.http.client.Response;
import com.google.gwt.json.client.JSONArray;
import com.google.gwt.json.client.JSONParser;
import com.google.gwt.user.client.Window;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * The PrefixList model is responsible for editing the prefix list on the server
 * and fetching existing prefixes.
 */
public class PrefixDataModelImpl implements PrefixDataModel {

	private final EventBus eventBus;
	private String href;
	
	@Inject
	protected PrefixDataModelImpl(EventBus eventBus) {
		this.eventBus = eventBus;
		// assume that path ends with /admin so that we get /admin/prefix
		href = Window.Location.getProtocol() + "//" + Window.Location.getHost() + Window.Location.getPath() + "/prefix";
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void getPrefixList() {
		ServerPost.send(href + "?action=list", new ListResponseReciever());
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void addPrefix(String prefix) {
		ServerPost.send(href + "?action=add&prefix="+prefix, new ListResponseReciever());
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void deletePrefix(String prefix) {
		ServerPost.send(href + "?action=delete&prefix="+prefix, new ListResponseReciever());
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void getPrefixMetadata(String prefix) {
		ServerPost.send(href + "?action=metadata&prefix="+prefix, new MetadataResponseReciever());
	}
	
	
	private class ListResponseReciever implements RequestCallback {
		/**
		 * {@inheritDoc}
		 */
		@Override
		public void onResponseReceived(Request request, Response response) {
			if(response.getStatusCode() == HttpServletResponse.SC_OK) {
				LinkedList<String> prefixes = new LinkedList<String>();
				String responseText = response.getText();
				if(responseText!=null && responseText.length()>0) {
					JSONArray array = JSONParser.parseStrict(responseText).isArray();
					for (int i=0; i<array.size(); i++) {
						prefixes.add(array.get(i).isString().stringValue());
					}
					eventBus.fireEvent(new PrefixListUpdateEvent(prefixes));
				}
			} else {
				// TODO Reattempt? Depends on why it failed and number of attempts.
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
	
	private class MetadataResponseReciever implements RequestCallback {
		/**
		 * {@inheritDoc}
		 */
		@Override
		public void onResponseReceived(Request request, Response response) {
			if(response.getStatusCode() == HttpServletResponse.SC_OK) {
				PrefixMetadata prefixMetadata = new PrefixMetadata(response.getText());
				eventBus.fireEvent(new PrefixMetadataEvent(prefixMetadata));
			} else {
				// TODO Reattempt? Depends on why it failed and number of attempts.
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

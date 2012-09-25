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

import com.google.gwt.appengine.channel.client.Channel;
import com.google.gwt.appengine.channel.client.ChannelFactory;
import com.google.gwt.appengine.channel.client.SocketError;
import com.google.gwt.appengine.channel.client.SocketListener;
import com.google.gwt.appengine.channel.client.ChannelFactory.ChannelCreatedCallback;
import com.google.gwt.dom.client.Document;
import com.google.gwt.dom.client.Element;
import com.google.gwt.dom.client.MetaElement;
import com.google.gwt.dom.client.NodeList;
import com.google.gwt.user.client.ui.Widget;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

public class AdminPresenter implements SocketListener {
	protected EventBus eventBus;
	protected AdminView adminView;
	
	@Inject
	protected AdminPresenter(EventBus eventBus, AdminView adminView) {
		this.eventBus = eventBus;
		this.adminView = adminView;
		
		String token = null;
		NodeList<Element> nodes = Document.get().getElementsByTagName("meta");
	    for (int i = 0; i < nodes.getLength(); i++) {
	        MetaElement meta = MetaElement.as(nodes.getItem(i));
	        if (meta.getName().equals("channelToken")) {
	            token = meta.getContent();
	            break;
	        }
	    }
		System.out.println(token);
		ChannelFactory.createChannel(token, new ChannelCreatedCallback() {
			@Override
			public void onChannelCreated(Channel channel) {
				channel.open(AdminPresenter.this);
			}
		});
	}

	public Widget getDisplay() {
		return adminView.asWidget();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onOpen() {
		adminView.addServerMessage("Server channel open");
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onMessage(String message) {
		adminView.addServerMessage(message);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onError(SocketError error) {
		adminView.addServerMessage("SocketError " + error.getCode() + ": " + error.getDescription());
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onClose() {
		adminView.addServerMessage("Server channel closed");
	}

}

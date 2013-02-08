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
import org.daxplore.presenter.admin.event.ServerChannelEvent;
import org.daxplore.presenter.admin.event.ServerChannelEvent.ServerStatus;
import org.daxplore.presenter.admin.event.ServerMessageEvent;
import org.daxplore.presenter.admin.presenter.AdminPresenter;
import org.daxplore.presenter.admin.presenter.PrefixListPresenter;
import org.daxplore.presenter.admin.presenter.Presenter;
import org.daxplore.presenter.admin.presenter.ServerMessage;

import com.google.gwt.appengine.channel.client.Channel;
import com.google.gwt.appengine.channel.client.ChannelFactory;
import com.google.gwt.appengine.channel.client.ChannelFactory.ChannelCreatedCallback;
import com.google.gwt.appengine.channel.client.SocketError;
import com.google.gwt.appengine.channel.client.SocketListener;
import com.google.gwt.dom.client.Document;
import com.google.gwt.dom.client.Element;
import com.google.gwt.dom.client.MetaElement;
import com.google.gwt.dom.client.NodeList;
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
		setupServerCommunication();
		bind();
	}

	private void setupServerCommunication() {
		// Extract the Google AppEngine ServerChannel token that was embedded in the HTML by the server.
		String token = null;
		NodeList<Element> nodes = Document.get().getElementsByTagName("meta");
	    for (int i = 0; i < nodes.getLength(); i++) {
	        MetaElement meta = MetaElement.as(nodes.getItem(i));
	        if (meta.getName().equals("channelToken")) {
	            token = meta.getContent();
	            break;
	        }
	    }

	    ChannelFactory.createChannel(token, new ChannelCreatedCallback() {
			@Override
			public void onChannelCreated(Channel channel) {
				channel.open(new SocketListener() {
					@Override
					public void onOpen() {
						eventBus.fireEvent(new ServerChannelEvent(ServerStatus.OPEN, "Server channel is open"));
						
					}
					
					@Override
					public void onMessage(String message) {
						ServerMessage serverMessage = new ServerMessage(message);
						eventBus.fireEvent(new ServerMessageEvent(serverMessage));
					}
					
					@Override
					public void onError(SocketError error) {
						eventBus.fireEvent(new ServerChannelEvent(ServerStatus.ERROR, error.getDescription()));
					}
					
					@Override
					public void onClose() {
						eventBus.fireEvent(new ServerChannelEvent(ServerStatus.CLOSED, "Server channel was closed"));
					}
				});
			}
		});
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
		if (token==null || token.isEmpty()) {
			History.newItem("", false);
		} else {
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


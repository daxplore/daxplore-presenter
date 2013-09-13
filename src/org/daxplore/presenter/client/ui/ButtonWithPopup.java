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
package org.daxplore.presenter.client.ui;

import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.event.dom.client.HasClickHandlers;
import com.google.gwt.event.shared.HandlerRegistration;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.IsWidget;
import com.google.gwt.user.client.ui.PopupPanel;
import com.google.gwt.user.client.ui.SimplePanel;

/**
 * A convenience widget that combines a clickable widget (a button) and a
 * popup-panel.
 * 
 * <p>
 * This widget directly wraps the button-widget, making the user interact
 * directly with the button. When the button is clicked, the popup panel is
 * shown in relation to the button.
 * </p>
 */
public class ButtonWithPopup extends Composite implements HasClickHandlers {

	private HasClickHandlers button;

	/**
	 * Instantiates a new button with a popup panel.
	 * 
	 * @param <T>
	 *            a type that defines a button as a clickable widget.
	 * @param button
	 *            the button widget
	 * @param popup
	 *            the popup panel
	 */
	public <T extends HasClickHandlers & IsWidget> ButtonWithPopup(final T button, final PopupPanel popup) {
		this.button = button;
		button.addClickHandler(new ClickHandler() {
			@Override
			public void onClick(ClickEvent event) {
				popup.showRelativeTo(button.asWidget());
			}
		});

		SimplePanel mainPanel = new SimplePanel();
		mainPanel.add(button);
		initWidget(mainPanel);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public HandlerRegistration addClickHandler(ClickHandler handler) {
		return button.addClickHandler(handler);
	}
}

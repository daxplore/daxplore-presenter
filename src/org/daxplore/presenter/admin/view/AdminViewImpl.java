/**
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.admin.view;

import com.google.gwt.core.client.GWT;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.uibinder.client.UiTemplate;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.HasWidgets;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.Widget;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * The base widget for the admin page.
 * 
 * <p>It contains all the UI-elements in the page. It handles resizing of all
 * it's sub-widgets if the window is resized.</p>
 */
public class AdminViewImpl extends Composite implements AdminView {
	@UiTemplate("AdminViewImpl.ui.xml")
	interface AdminViewPanel extends UiBinder<Widget, AdminViewImpl> {}
	private static AdminViewPanel uiBinder = GWT.create(AdminViewPanel.class);
	
	private EventBus eventBus;
	
	@UiField protected SimplePanel mainContentSlot;
	@UiField protected SimplePanel sidebarContentSlot;
		  
	@Inject
	public AdminViewImpl(EventBus eventBus) {
		this.eventBus = eventBus;
	    
		initWidget(uiBinder.createAndBindUi(this));
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void addServerMessage(String message) {
//		String text = serverMessageArea.getText() + "\n" + message;
//		serverMessageArea.setText(text);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public HasWidgets getMainContentSlot() {
		return mainContentSlot;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public HasWidgets getSidebarContentSlot() {
		return sidebarContentSlot;
	}
}

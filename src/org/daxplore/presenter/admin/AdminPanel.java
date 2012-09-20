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
package org.daxplore.presenter.admin;

import com.google.gwt.core.client.GWT;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.logical.shared.ResizeEvent;
import com.google.gwt.event.logical.shared.ResizeHandler;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.uibinder.client.UiHandler;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.FileUpload;
import com.google.gwt.user.client.ui.FormPanel;
import com.google.gwt.user.client.ui.FormPanel.SubmitCompleteEvent;
import com.google.gwt.user.client.ui.Widget;
import com.google.gwt.user.client.ui.FormPanel.SubmitEvent;
import com.google.inject.Inject;

/**
 * The StagePanel is the base widget for the admin page.
 * 
 * <p>It contains all the UI-elements in the page. It handles resizing of all
 * it's sub-widgets if the window is resized.</p>
 */
public class AdminPanel extends Composite implements ResizeHandler {
	interface AdminViewPanel extends UiBinder<Widget, AdminPanel> {}
	private static AdminViewPanel uiBinder = GWT.create(AdminViewPanel.class);

	@UiField FormPanel uploadForm;
	@UiField FileUpload uploadWidget;
	@UiField Button uploadButton;
	
	@Inject
	protected AdminPanel() {
		initWidget(uiBinder.createAndBindUi(this));
		uploadForm.setAction("/admin/upload");
		uploadForm.setEncoding(FormPanel.ENCODING_MULTIPART);
		uploadForm.setMethod(FormPanel.METHOD_POST);
	}

	@UiHandler("uploadButton")
	protected void handleClick(ClickEvent e) {
		uploadForm.submit();
	}

	@UiHandler("uploadForm")
	protected void handleSubmit(SubmitEvent event) {
		// TODO Auto-generated method stub
	}

	@UiHandler("uploadForm")
	protected void handleSubmitComplete(SubmitCompleteEvent event) {
		// TODO Auto-generated method stub
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onResize(ResizeEvent event) {
		// TODO Auto-generated method stub
	}

}

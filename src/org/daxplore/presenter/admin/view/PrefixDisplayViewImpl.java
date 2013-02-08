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
package org.daxplore.presenter.admin.view;

import com.google.gwt.core.client.GWT;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.uibinder.client.UiHandler;
import com.google.gwt.uibinder.client.UiTemplate;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.FileUpload;
import com.google.gwt.user.client.ui.FormPanel;
import com.google.gwt.user.client.ui.FormPanel.SubmitCompleteEvent;
import com.google.gwt.user.client.ui.FormPanel.SubmitEvent;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.TextArea;
import com.google.gwt.user.client.ui.Widget;

public class PrefixDisplayViewImpl extends Composite implements PrefixDisplayView {
	@UiTemplate("PrefixDisplayViewImpl.ui.xml")
	interface PrefixDisplayViewPanel extends UiBinder<Widget, PrefixDisplayViewImpl> {}
	private static PrefixDisplayViewPanel uiBinder = GWT.create(PrefixDisplayViewPanel.class);
	
	@UiField protected Label uploadHeader;
	@UiField protected FormPanel uploadForm;
	@UiField protected FileUpload uploadWidget;
	@UiField protected Button uploadButton;
	@UiField protected TextArea serverMessageArea;
	
	public PrefixDisplayViewImpl() {
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
	}

	@UiHandler("uploadForm")
	protected void handleSubmitComplete(SubmitCompleteEvent event) {
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void setHeader(String header) {
		uploadHeader.setText(header);
	}
}

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

import org.daxplore.presenter.client.event.ImageButtonEvent;
import org.daxplore.presenter.client.event.ImageButtonEvent.ImageButtonAction;
import org.daxplore.presenter.client.event.ImageButtonHandler;
import org.daxplore.presenter.client.event.QueryUpdateEvent;
import org.daxplore.presenter.client.event.QueryUpdateHandler;
import org.daxplore.presenter.client.resources.UIResources;
import org.daxplore.presenter.client.resources.UITexts;
import org.daxplore.presenter.shared.PrefixProperties;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.gwt.core.client.GWT;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.http.client.URL;
import com.google.gwt.i18n.client.LocaleInfo;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.HorizontalPanel;
import com.google.gwt.user.client.ui.Image;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * A widget that contains a number of image buttons.
 * 
 * <p>It defines buttons for printing, downloading as csv and embedding.</p>
 * 
 * <p><b>Note:</b> This is not supposed to be a general-purpose widget. It
 * just creates a number of hard-coded buttons with specific functions that are
 * needed in the Daxplore client.</p>
 */
public class ImageButtonPanel extends Composite implements QueryUpdateHandler, ImageButtonHandler {
	
	protected HorizontalPanel mainPanel;
	protected EmbedPopup embedPopup;
	protected QueryDefinition queryDefinition;
	private PrefixProperties prefixProperties;
	
	private WidgetAnchor csvWidgetAnchor;
	
	@Inject
	protected ImageButtonPanel(final EventBus eventBus, UITexts uiTexts, UIResources uiResources, EmbedPopup embedPopup, PrefixProperties prefixProperties) {
		this.embedPopup = embedPopup;
		this.prefixProperties = prefixProperties;
		
//		Image buttonImage = new Image(uiResources.printButtonImage());
//		ImageButton printButton = new ImageButton(buttonImage, uiTexts.printButtonTitle());
//		printButton.addClickHandler(new ClickHandler() {
//			@Override
//			public void onClick(ClickEvent event) {
//				eventBus.fireEvent(new ImageButtonEvent(ImageButtonAction.PRINT));
//			}
//		});
		
		Image buttonImage = new Image(uiResources.csvButtonImage());
		ImageButton csvButton = new ImageButton(buttonImage, uiTexts.csvButtonTitle());
		csvWidgetAnchor = new WidgetAnchor("", csvButton);
		
		
		buttonImage = new Image(uiResources.embedButtonImage());
		ImageButton embedButton = new ImageButton(buttonImage, uiTexts.embedButtonTitle());
		embedButton.addClickHandler(new ClickHandler() {
			@Override
			public void onClick(ClickEvent event) {
				eventBus.fireEvent(new ImageButtonEvent(ImageButtonAction.EMBED));
			}
		});
		ButtonWithPopup embedButtonPopup = new ButtonWithPopup(embedButton, embedPopup);
		
		mainPanel = new HorizontalPanel();
//		mainPanel.add(printButton);
		mainPanel.add(csvWidgetAnchor);
		mainPanel.add(embedButtonPopup);
		
		mainPanel.setSpacing(5);
		
		initWidget(mainPanel);
		
		setStyleName("daxplore-imagebuttonpanel");
		
		QueryUpdateEvent.register(eventBus, this);
		ImageButtonEvent.register(eventBus, this);
	}
	
	protected String getCsvDownloadSrc() {
		//TODO use better parsing
		String address = GWT.getModuleBaseURL(); //get address with module, e.g. http://127.0.0.1/presentation/
		address = address.substring(0, address.length()-1); //remove last slash
		address = address.substring(0, address.lastIndexOf("/")+1); //remove module name
		address += "getCsv/";
		String fileName = queryDefinition.getPerspectiveShortText() + " - " + queryDefinition.getQuestionShortText() + ".csv";
		fileName = URL.encodePathSegment(fileName);
		return address + fileName
				+ "?q=" + queryDefinition.getAsString()
				+ "&l=" + LocaleInfo.getCurrentLocale().getLocaleName()
				+ "&prefix=" + prefixProperties.getPrefix();
	}
	
	protected void openPrintPage(){
		if(queryDefinition != null) {
			//TODO use better parsing
			String address = GWT.getModuleBaseURL(); //get address with module, e.g. http://127.0.0.1/presentation/
			if (address.charAt(address.length()-1) == '/') {
				address = address.substring(0, address.length()-1); //remove trailing slash
			}
			address = address.substring(0, address.lastIndexOf("/")+1); //remove module name
			String locale = LocaleInfo.getCurrentLocale().getLocaleName();
			address += "print?q=" + queryDefinition.getAsString() + "&l=" + locale;
			String name = "_blank";
			String features = "";
			Window.open(address, name, features);
		}
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onImageButtonClick(ImageButtonEvent event) {
		switch(event.getAction()){
		case PRINT:
			openPrintPage();
			break;
		default:
			break;
		}
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryUpdate(QueryUpdateEvent event) {
		queryDefinition = event.getQueryDefinition();
		csvWidgetAnchor.setHref(getCsvDownloadSrc());
	}
	
}

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
import org.daxplore.presenter.client.json.Prefix;
import org.daxplore.presenter.client.json.Settings;
import org.daxplore.presenter.client.json.shared.UITexts;
import org.daxplore.presenter.client.resources.UIResources;
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
	
	private String baseUrl;
	private UITexts uiTexts;
	private final String prefix;
	
	private HorizontalPanel mainPanel;
	private QueryDefinition queryDefinition;
	
	private WidgetAnchor csvWidgetAnchor;
	
	@Inject
	protected ImageButtonPanel(final EventBus eventBus, UITexts uiTexts, UIResources uiResources,
			EmbedPopup embedPopup, Prefix prefix) {

		this.uiTexts = uiTexts;
		this.prefix = prefix.getPrefix();
		
		baseUrl = GWT.getHostPageBaseURL();					// http://example.com/p/
		baseUrl = baseUrl.substring(0, baseUrl.length()-2); // http://example.com/
		
		
		mainPanel = new HorizontalPanel();
		
//		Image buttonImage = new Image(uiResources.printButtonImage());
//		ImageButton printButton = new ImageButton(buttonImage, uiTexts.printButtonTitle());
//		printButton.addClickHandler(new ClickHandler() {
//			@Override
//			public void onClick(ClickEvent event) {
//				eventBus.fireEvent(new ImageButtonEvent(ImageButtonAction.PRINT));
//			}
//		});
//		mainPanel.add(printButton);
		
		if(Settings.getBool("csv")) {
			Image buttonImage = new Image(uiResources.csvButtonImage());
			ImageButton csvButton = new ImageButton(buttonImage, uiTexts.csvButtonTitle());
			csvWidgetAnchor = new WidgetAnchor("", csvButton);
			mainPanel.add(csvWidgetAnchor);
		}
		
		if(Settings.getBool("embed")) {
			Image buttonImage = new Image(uiResources.embedButtonImage());
			ImageButton embedButton = new ImageButton(buttonImage, uiTexts.embedButtonTitle());
			embedButton.addClickHandler(new ClickHandler() {
				@Override
				public void onClick(ClickEvent event) {
					eventBus.fireEvent(new ImageButtonEvent(ImageButtonAction.EMBED));
				}
			});
			ButtonWithPopup embedButtonPopup = new ButtonWithPopup(embedButton, embedPopup);
			mainPanel.add(embedButtonPopup);
		}
		
		mainPanel.setSpacing(5);
		
		initWidget(mainPanel);
		
		setStyleName("daxplore-imagebuttonpanel");
		
		QueryUpdateEvent.register(eventBus, this);
		ImageButtonEvent.register(eventBus, this);
	}
	
	private String getCsvDownloadSrc() {
		String filename = uiTexts.pageTitle() + " - " + queryDefinition.getPerspectiveShortText() + " - " + queryDefinition.getQuestionShortText() + ".csv";
		filename = URL.encodePathSegment(filename);
		return baseUrl + "getCsv/" + filename
				+ "?q=" + queryDefinition.getAsString()
				+ "&l=" + LocaleInfo.getCurrentLocale().getLocaleName()
				+ "&prefix=" + prefix;
	}
	
	private void openPrintPage(){
		if(queryDefinition != null) {
			String url = baseUrl + "print?q=" + queryDefinition.getAsString() + "&l=" + LocaleInfo.getCurrentLocale().getLocaleName();
			String name = "_blank";
			String features = "";
			Window.open(url, name, features);
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
		if(csvWidgetAnchor != null) {
			csvWidgetAnchor.setHref(getCsvDownloadSrc());
		}
	}
	
}

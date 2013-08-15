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

import java.util.LinkedList;
import java.util.List;

import org.daxplore.presenter.client.event.EmbedSizeEvent;
import org.daxplore.presenter.client.event.EmbedSizeHandler;
import org.daxplore.presenter.client.event.ImageButtonEvent;
import org.daxplore.presenter.client.event.ImageButtonHandler;
import org.daxplore.presenter.client.event.QueryUpdateEvent;
import org.daxplore.presenter.client.event.QueryUpdateHandler;
import org.daxplore.presenter.client.resources.DaxploreConfig;
import org.daxplore.presenter.client.resources.UITexts;
import org.daxplore.presenter.shared.EmbedDefinition;
import org.daxplore.presenter.shared.EmbedDefinition.EmbedFlag;
import org.daxplore.presenter.shared.PrefixProperties;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.gwt.core.client.GWT;
import com.google.gwt.event.dom.client.ChangeEvent;
import com.google.gwt.event.dom.client.ChangeHandler;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.event.dom.client.MouseOverEvent;
import com.google.gwt.event.dom.client.MouseOverHandler;
import com.google.gwt.event.dom.client.MouseUpEvent;
import com.google.gwt.event.dom.client.MouseUpHandler;
import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.event.logical.shared.ValueChangeHandler;
import com.google.gwt.i18n.client.LocaleInfo;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.CheckBox;
import com.google.gwt.user.client.ui.DisclosurePanel;
import com.google.gwt.user.client.ui.FlowPanel;
import com.google.gwt.user.client.ui.Frame;
import com.google.gwt.user.client.ui.HorizontalPanel;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.PopupPanel;
import com.google.gwt.user.client.ui.TextArea;
import com.google.gwt.user.client.ui.VerticalPanel;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * A {@link PopupPanel} that is displayed when the user clicks the embed button
 * in the {@link ImageButtonPanel}.
 * 
 * <p>
 * Popups are displayed on top of the rest of the page.
 * </p>
 * 
 * <p>
 * This popup is used as a component of {@link ButtonWithPopup}.
 * </p>
 */
public class EmbedPopup extends PopupPanel implements EmbedSizeHandler, QueryUpdateHandler, ImageButtonHandler,
		MouseUpHandler, ChangeHandler, ValueChangeHandler<Boolean> {

	protected EventBus eventBus;
	protected UITexts uiTexts;
	protected DaxploreConfig config;
	private PrefixProperties prefixProperties;

	protected VerticalPanel mainPanel;

	protected Frame iframeSpot = new Frame();

	protected final TextArea linkTextArea;
	protected String currentEmbedText = "";

	protected CheckBox transparencyCheckbox, legendCheckbox;

	protected EmbedSize currentEmbedSize = EmbedSize.MEDIUM;

	protected boolean needCodeUpdate = false;

	protected QueryDefinition queryDefinition;

	/**
	 * Instantiates a new embed popup panel.
	 * 
	 * @param eventBus
	 *            the system's bus
	 * @param uiTexts
	 *            the resource that supplies localized text to the UI
	 * @param config
	 *            supplies configuration parameters to the client
	 */
	@Inject
	public EmbedPopup(final EventBus eventBus, UITexts uiTexts, DaxploreConfig config, PrefixProperties prefixProperties) {
		super(true);
		this.eventBus = eventBus;
		this.uiTexts = uiTexts;
		this.prefixProperties = prefixProperties;
		
		mainPanel = new VerticalPanel();
		mainPanel.setSpacing(5);

		Label popupHeader = new Label(uiTexts.embedPopupTitle());
		mainPanel.add(popupHeader);

		Label popupDescription = new Label(uiTexts.embedPopupDescription());
		mainPanel.add(popupDescription);

		linkTextArea = new TextArea();
		linkTextArea.setText("");

		linkTextArea.addMouseOverHandler(new MouseOverHandler() {
			@Override
			public void onMouseOver(MouseOverEvent event) {
				linkTextArea.setFocus(true);
				linkTextArea.selectAll();
			}
		});

		linkTextArea.getElement().setAttribute("spellCheck", "false");

		linkTextArea.addMouseUpHandler(this);
		linkTextArea.addChangeHandler(this);

		setStyleName("daxplore-EmbedPopup");
		popupHeader.addStyleName("daxplore-EmbedPopup-header");
		linkTextArea.addStyleName("daxplore-EmbedPopup-textarea");

		mainPanel.add(linkTextArea);

		DisclosurePanel settingsPanel = new DisclosurePanel(uiTexts.embedSettingsHeader());
		FlowPanel settingsContentPanel = new FlowPanel();
		settingsPanel.add(settingsContentPanel);
		settingsPanel.setWidth("100%");
		mainPanel.add(settingsPanel);

		HorizontalPanel sizeButtonPanel = new HorizontalPanel();
		sizeButtonPanel.setSpacing(10);

		for (final EmbedSize embedSize : EmbedSize.values()) {
			Button button = new Button(embedSize.getButtonText(config, uiTexts));
			button.addClickHandler(new ClickHandler() {
				@Override
				public void onClick(ClickEvent event) {
					eventBus.fireEvent(new EmbedSizeEvent(embedSize));
				}
			});
			sizeButtonPanel.add(button);
		}

		currentEmbedSize = EmbedSize.MEDIUM;

		settingsContentPanel.add(sizeButtonPanel);

		transparencyCheckbox = new CheckBox(uiTexts.embedTransparentBackground());
		transparencyCheckbox.setValue(true, false);
		transparencyCheckbox.addValueChangeHandler(this);
		settingsContentPanel.add(transparencyCheckbox);

		legendCheckbox = new CheckBox(uiTexts.embedShowLegend());
		legendCheckbox.setValue(true, false);
		legendCheckbox.addValueChangeHandler(this);
		settingsContentPanel.add(legendCheckbox);

		iframeSpot.setStyleName("daxplore-EmbedPopup-iframeSpot");
		mainPanel.add(iframeSpot);

		setWidget(mainPanel);

		EmbedSizeEvent.register(eventBus, this);
		QueryUpdateEvent.register(eventBus, this);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onEmbedSize(EmbedSizeEvent event) {
		currentEmbedSize = event.getEmbedSize();
		updateEmbedCode();
	}

	protected void updateEmbedCode() {
		if (queryDefinition != null) {
			int width = currentEmbedSize.getWidth(config);
			int height = currentEmbedSize.getHeight(config);
			
			// get base address, e.g. http://127.0.0.1/p/myprefix
			String address = GWT.getHostPageBaseURL() + prefixProperties.getPrefix();
			
			address += "?f=embed&q=" + queryDefinition.getAsString();

			address += "&l=" + LocaleInfo.getCurrentLocale().getLocaleName();

			if (!GWT.isScript()) {
				// TODO write code that doesn't make that assumption that the gwt codeserver uses the default local setup
				address += "&gwt.codesvr=127.0.0.1:9997";
			}

			List<EmbedFlag> flags = new LinkedList<EmbedFlag>();

			String transparency = "";
			if (transparencyCheckbox.getValue()) {
				flags.add(EmbedFlag.TRANSPARENT);
				transparency = " allowtransparency=\"true\"";
			}

			if (legendCheckbox.getValue()) {
				flags.add(EmbedFlag.LEGEND);
			}

			EmbedDefinition embedDefinition = new EmbedDefinition(flags);
			address += "#" + embedDefinition.getAsString();

			currentEmbedText = "<iframe src=\"" + address + "\" width=\"" + width + "\" height=\"" + height
					+ "\" frameborder=\"0\"" + transparency + "></iframe>";
			linkTextArea.setText(currentEmbedText);

			// temporary test code:
			mainPanel.remove(iframeSpot);
			iframeSpot = new Frame();
			iframeSpot.setStyleName("daxplore-EmbedPopup-iframeSpot");
			iframeSpot.setUrl("about:blank");
			iframeSpot.setUrl(address);
			iframeSpot.getElement().setAttribute("frameborder", "0");
			iframeSpot.getElement().setAttribute("style", "width:" + width + "px;" + "height:" + height + "px;");
			if (transparencyCheckbox.getValue()) {
				iframeSpot.getElement().setAttribute("allowtransparency", "true");
				iframeSpot.getElement().setAttribute("style", "width:" + width + "px;" + "height:" + height + "px");
			} else {
				iframeSpot.getElement().setAttribute("style", "width:" + width + "px;" + "height:" + height + "px");
			}
			mainPanel.add(iframeSpot);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryUpdate(QueryUpdateEvent event) {
		queryDefinition = event.getQueryDefinition();
		if (isVisible()) {
			updateEmbedCode();
		} else {
			needCodeUpdate = true;
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onImageButtonClick(ImageButtonEvent event) {
		if (needCodeUpdate) {
			updateEmbedCode();
			needCodeUpdate = false;
		}

	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onMouseUp(MouseUpEvent event) {
		if (event.getSource() == linkTextArea) {
			event.preventDefault();
			linkTextArea.setFocus(true);
			linkTextArea.selectAll();
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onChange(ChangeEvent event) {
		if (event.getSource() == linkTextArea) {
			linkTextArea.setText(currentEmbedText);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onValueChange(ValueChangeEvent<Boolean> event) {
		updateEmbedCode();
	}
}

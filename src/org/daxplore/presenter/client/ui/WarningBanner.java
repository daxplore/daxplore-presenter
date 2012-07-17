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

import org.daxplore.presenter.client.Presenter;
import org.daxplore.presenter.client.event.CloseWarningBannerEvent;
import org.daxplore.presenter.client.resources.UITexts;

import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.user.client.ui.AbsolutePanel;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.HTML;
import com.google.gwt.user.client.ui.HorizontalPanel;
import com.google.gwt.user.client.ui.Label;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * Warning banners are shown at the top of the web page, independently of
 * the content and the user's interaction with the rest of the page.
 * 
 * <p>{@link Presenter} is responsible for showing, closing and replacing
 * warning banners.</p>
 */
public class WarningBanner extends Composite {

	/**
	 * A factory for creating WarningBanner objects.
	 */
	public static class WarningBannerFactory {
		protected final UITexts uiTexts;
		protected final EventBus eventBus;

		/**
		 * Instantiates a new warning banner factory.
		 * 
	 * @param uiTexts
	 *            the resource that supplies localized text to the UI
		 * @param eventBus
		 *            the system's event bus
		 */
		@Inject
		public WarningBannerFactory(UITexts uiTexts, EventBus eventBus) {
			this.uiTexts = uiTexts;
			this.eventBus = eventBus;
		}

		/**
		 * Creates a new WarningBanner that shows a plain text.
		 * 
		 * @param warningText
		 *            the warning text to show on the banner
		 * @return the warning banner
		 */
		public WarningBanner createWarningBanner(String warningText) {
			return new WarningBanner(uiTexts, eventBus, warningText);
		}

		/**
		 * Creates a new WarningBanner that shows a message in two different
		 * languages, annotated with small flag icons.
		 * 
		 * <p>This is used when cookies are disabled to show a warning because
		 * the client's wanted language is unknown. At least one of the
		 * languages should probably be English.</p>
		 * 
		 * @param firstLanguageCode
		 *            the language code for the first language
		 * @param warningFirstLanguage
		 *            the warning in the first language
		 * @param secondLanguageCode
		 *            the language code for the second language
		 * @param warningSecondLanguage
		 *            the warning in the second language
		 * @return the warning banner
		 */
		public WarningBanner createWarningBanner(String firstLanguageCode, String warningFirstLanguage, String secondLanguageCode, String warningSecondLanguage) {
			return new WarningBanner(uiTexts, eventBus, firstLanguageCode, warningFirstLanguage, secondLanguageCode, warningSecondLanguage);
		}
	}

	protected WarningBanner(UITexts uiTexts, final EventBus eventBus, String warningText) {

		AbsolutePanel basePanel = new AbsolutePanel();

		Label label = new Label(warningText);
		basePanel.add(label, 10, 10);

		Button closeButton = new Button(uiTexts.hideWarningButton());

		closeButton.addClickHandler(new ClickHandler() {
			@Override
			public void onClick(ClickEvent event) {
				eventBus.fireEvent(new CloseWarningBannerEvent());
			}
		});

		closeButton.setStylePrimaryName("daxplore-WarningBanner-close");
		basePanel.add(closeButton);

		initWidget(basePanel);
		setStylePrimaryName("daxplore-WarningBanner");
	}

	protected WarningBanner(UITexts uiTexts, final EventBus eventBus, String firstLanguageCode, String warningFirstLanguage, String secondLanguageCode, String warningSecondLanguage) {

		AbsolutePanel basePanel = new AbsolutePanel();

		HorizontalPanel textPanel = new HorizontalPanel();

		HTML warning = new HTML(warningFirstLanguage);
		warning.setStylePrimaryName("daxplore-WarningBanner-text");
		warning.addStyleDependentName(firstLanguageCode);
		textPanel.add(warning);

		warning = new HTML(warningSecondLanguage);
		warning.setStylePrimaryName("daxplore-WarningBanner-text");
		warning.addStyleDependentName(secondLanguageCode);
		textPanel.add(warning);

		basePanel.add(textPanel, 10, 10);

		Button closeButton = new Button(uiTexts.hideWarningButton());

		closeButton.addClickHandler(new ClickHandler() {
			@Override
			public void onClick(ClickEvent event) {
				eventBus.fireEvent(new CloseWarningBannerEvent());
			}
		});

		closeButton.setStylePrimaryName("daxplore-WarningBanner-close");
		basePanel.add(closeButton);

		initWidget(basePanel);
		setStylePrimaryName("daxplore-WarningBanner");
	}
}

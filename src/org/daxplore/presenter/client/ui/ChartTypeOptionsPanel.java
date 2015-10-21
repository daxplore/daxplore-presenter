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

import org.daxplore.presenter.client.event.QueryUpdateEvent;
import org.daxplore.presenter.client.event.QueryUpdateHandler;
import org.daxplore.presenter.client.event.SelectionUpdateEvent;
import org.daxplore.presenter.client.json.UITexts;
import org.daxplore.presenter.client.resources.DaxploreConfig;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.event.logical.shared.ValueChangeHandler;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.ToggleButton;
import com.google.gwt.user.client.ui.VerticalPanel;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * A widget that contains buttons that allow the user to display
 * different charts, given a specific question-perspective pair.
 * 
 * <p>The widget creates buttons for showing primary or primary+secondary data.
 * Depending on settings in the DaxploreConfig, it also shows buttons for
 * switching between standard bar charts and mean charts.</p>
 * 
 * <p>The panel is context-sensitive, so it will deactivate and re-activate
 * the buttons, based on metadata from the current {@link QueryDefinition}. For
 * example, the primary/secondary-data-buttons are only active when there is
 * secondary data available according to the query definition.</p>
 * 
 * <p><b>Note:</b> This is not supposed to be a general-purpose widget. It
 * just creates a number of hard-coded buttons with specific functions that are
 * needed in the Daxplore client.</p>
 */
public class ChartTypeOptionsPanel extends Composite implements QueryUpdateHandler, ValueChangeHandler<Boolean> {

	private EventBus eventBus;
	
	private QueryDefinition queryDefinition;
	
	private VerticalPanel mainPanel;
	private TitleToggleButton dontShowSecondaryButton, showSecondaryButton, useAverageButton, useMeanButton;
	private boolean showMeanButtons;
	
	@Inject
	protected ChartTypeOptionsPanel(EventBus eventBus, UITexts uiTexts, DaxploreConfig config) {
		this.eventBus = eventBus;
		
		this.showMeanButtons = config.showMeanButtons();

		mainPanel = new VerticalPanel();
		
		dontShowSecondaryButton = new TitleToggleButton(
						uiTexts.onlyShowNew(),
						uiTexts.onlyShowNewTitleEnabled(),
						uiTexts.onlyShowNewTitleDisabled());
		dontShowSecondaryButton.setValue(true);
		dontShowSecondaryButton.setEnabled(false);
		dontShowSecondaryButton.addValueChangeHandler(this);
		dontShowSecondaryButton.setValue(true, false);
		mainPanel.add(dontShowSecondaryButton);

		showSecondaryButton = new TitleToggleButton(
						uiTexts.compareWithOld(),
						uiTexts.compareWithOldTitleEnabled(),
						uiTexts.compareWithOldTitleDisabled());
		showSecondaryButton.setEnabled(false);
		showSecondaryButton.addValueChangeHandler(this);
		showSecondaryButton.setValue(false, false);
		mainPanel.add(showSecondaryButton);

		SimplePanel paddingPanel = new SimplePanel();
		paddingPanel.setHeight("10px");
		mainPanel.add(paddingPanel);

		if (showMeanButtons) {
			useAverageButton = new TitleToggleButton(
							uiTexts.showFrequency(), uiTexts.showFrequencyTitleEnabled(), uiTexts.showFrequencyTitleDisabled());
			useAverageButton.setValue(true);
			useAverageButton.setEnabled(false);
			useAverageButton.addValueChangeHandler(this);
			useAverageButton.setValue(true, false);
			mainPanel.add(useAverageButton);

			useMeanButton = new TitleToggleButton(
					uiTexts.showAverage(), uiTexts.showAverageTitleEnabled(), uiTexts.showAverageTitleDisabled());
			useMeanButton.setEnabled(false);
			useMeanButton.addValueChangeHandler(this);
			useAverageButton.setValue(false, false);
			mainPanel.add(useMeanButton);
		}
		initWidget(mainPanel);
		setStylePrimaryName("daxplore-OptionsPanel");
		
		QueryUpdateEvent.register(eventBus, this);
	}
	
	public boolean useSecondarySelected() {
		return showSecondaryButton.getValue();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryUpdate(QueryUpdateEvent event) {
		queryDefinition = event.getQueryDefinition();
		
		if (queryDefinition.hasSecondary()) {
			showSecondaryButton.setEnabledWithTitleChange(true);
			dontShowSecondaryButton.setEnabledWithTitleChange(true);
			boolean secondary = queryDefinition.hasFlag(QueryFlag.SECONDARY);
			showSecondaryButton.setValue(secondary, false);
			dontShowSecondaryButton.setValue(!secondary, false);
		} else {
			showSecondaryButton.setEnabledWithTitleChange(false);
			dontShowSecondaryButton.setEnabledWithTitleChange(false);
		}

		if (showMeanButtons) {
			if (queryDefinition.hasMean()) {
				useMeanButton.setEnabledWithTitleChange(true);
				useAverageButton.setEnabledWithTitleChange(true);
				boolean mean = queryDefinition.hasFlag(QueryFlag.MEAN);
				useMeanButton.setValue(mean, false);
				useAverageButton.setValue(!mean, false);
			} else {
				useMeanButton.setEnabledWithTitleChange(false);
				useAverageButton.setEnabledWithTitleChange(false);
			}
		}
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onValueChange(ValueChangeEvent<Boolean> event) {
		Object source = event.getSource();
		if (source == dontShowSecondaryButton) {
			dontShowSecondaryButton.setValue(true, false);
			showSecondaryButton.setValue(false, false);
		} else if (source == showSecondaryButton) {
			dontShowSecondaryButton.setValue(false, false);
			showSecondaryButton.setValue(true, false);
		} else if (source == useMeanButton) {
			useMeanButton.setValue(true, false);
			useAverageButton.setValue(false, false);
		} else if (source == useAverageButton) {
			useMeanButton.setValue(false, false);
			useAverageButton.setValue(true, false);
		}
		
		if (event.getValue()) {
			eventBus.fireEvent(new SelectionUpdateEvent());
		}
	}

	/**
	 * A ToggleButton with a title text that is dependent on its Enabled state.
	 */
	private static class TitleToggleButton extends ToggleButton {
		private String titleEnabled, titleDisabled;

		public TitleToggleButton(String text, String titleEnabled, String titleDisabled) {
			super(text);
			this.titleEnabled = titleEnabled;
			this.titleDisabled = titleDisabled;
			setTitle(titleEnabled);
		}

		public void setEnabledWithTitleChange(boolean enabled) {
			setEnabled(enabled);
			setTitle(enabled ? titleEnabled : titleDisabled);
		}
	}
}

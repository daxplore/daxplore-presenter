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
package org.daxplore.presenter.client;

import java.util.LinkedList;
import java.util.List;

import org.daxplore.presenter.chart.ChartPanelPresenter;
import org.daxplore.presenter.client.event.CloseWarningBannerEvent;
import org.daxplore.presenter.client.event.CloseWarningBannerHandler;
import org.daxplore.presenter.client.event.QueryReadyEvent;
import org.daxplore.presenter.client.event.QueryReadyHandler;
import org.daxplore.presenter.client.event.QueryUpdateEvent;
import org.daxplore.presenter.client.event.QueryUpdateHandler;
import org.daxplore.presenter.client.event.SelectionUpdateEvent;
import org.daxplore.presenter.client.event.SelectionUpdateHandler;
import org.daxplore.presenter.client.event.SetWarningBannerEvent;
import org.daxplore.presenter.client.event.SetWarningBannerHandler;
import org.daxplore.presenter.client.model.StatDataServerModel;
import org.daxplore.presenter.client.resources.DaxploreConfig;
import org.daxplore.presenter.client.resources.UITexts;
import org.daxplore.presenter.client.ui.ChartTypeOptionsPanel;
import org.daxplore.presenter.client.ui.ImageButtonPanel;
import org.daxplore.presenter.client.ui.PerspectivePanel;
import org.daxplore.presenter.client.ui.QuestionPanel;
import org.daxplore.presenter.client.ui.StagePanel;
import org.daxplore.presenter.client.ui.WarningBanner;
import org.daxplore.presenter.client.ui.WarningBanner.WarningBannerFactory;
import org.daxplore.presenter.shared.PrefixProperties;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.daxplore.presenter.shared.SharedTools;

import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.event.logical.shared.ValueChangeHandler;
import com.google.gwt.user.client.History;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.user.client.ui.Widget;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * This acts as a central point in the application.
 * 
 * <p>It is named "Presenter" after the Model-View-Presenter design pattern. The
 * project does not properly adhere to the MVP pattern, though.</p>
 */
public class Presenter implements ValueChangeHandler<String>, SelectionUpdateHandler,
SetWarningBannerHandler, CloseWarningBannerHandler, QueryUpdateHandler, QueryReadyHandler {

	protected final PerspectivePanel perspectivePanel;
	protected final QuestionPanel questionPanel;
	protected final ChartTypeOptionsPanel optionsPanel;
	protected final ChartPanelPresenter chartPanelPresenter;
	protected QuestionMetadata questionMetadata;
	protected final EventBus eventBus;
	protected DaxploreConfig config;
	private StatDataServerModel statDataServerModel;
	private PrefixProperties prefixProperties;

	@Inject
	protected Presenter(StagePanel stagePanel, PerspectivePanel perspectivePanel, QuestionPanel questionPanel,
			ChartTypeOptionsPanel optionsPanel, EventBus eventBus, ChartPanelPresenter chartPanelPresenter,
			QuestionMetadata questionMetadata, ImageButtonPanel imageButtonPanel, DaxploreConfig config, UITexts uiTexts,
			WarningBannerFactory warningFactory, StatDataServerModel statDataServerModel, PrefixProperties prefixProperties) {
		this.perspectivePanel = perspectivePanel;
		this.questionPanel = questionPanel;
		this.optionsPanel = optionsPanel;
		this.questionMetadata = questionMetadata;
		this.chartPanelPresenter = chartPanelPresenter;
		this.eventBus = eventBus;
		this.config = config;
		this.statDataServerModel = statDataServerModel;
		this.prefixProperties = prefixProperties;

		List<Widget> actionWidgetList = new LinkedList<Widget>();
		actionWidgetList.add(imageButtonPanel);
		actionWidgetList.add(optionsPanel);
		chartPanelPresenter.getView().setActionWidgets(actionWidgetList);

		SelectionUpdateEvent.register(eventBus, this);
		SetWarningBannerEvent.register(eventBus, this);
		CloseWarningBannerEvent.register(eventBus, this);
		QueryUpdateEvent.register(eventBus, this);
		QueryReadyEvent.register(eventBus, this);

		History.addValueChangeHandler(this);
	}

	/**
	 * Create a new query.
	 * 
	 * <p>The query is constructed based on user selections in the current
	 * site.</p>
	 * 
	 * <p>You can choose if you want to set browser history or not.</p>
	 * 
	 * @param setHistory
	 *            true, if the browser history should be set
	 */
	public void makeQuery(boolean setHistory) {
		List<QueryFlag> flags = new LinkedList<QueryFlag>();
		String questionID = questionPanel.getQuestionID();
		String perspectiveID = perspectivePanel.getQuestionID();
		List<Integer> perspectiveOptions = perspectivePanel.getPerspectiveOptions();
		
		if(questionMetadata.hasSecondary(questionID)
				&& questionMetadata.hasSecondary(perspectiveID)
				&& optionsPanel.useSecondarySelected()) {
			flags.add(QueryFlag.SECONDARY);
		}
		
		if(perspectiveOptions.size()==0 || perspectivePanel.useTotalSelected()) {
			flags.add(QueryFlag.TOTAL);
		}
		
		QueryDefinition queryDefinition =
				new QueryDefinition(questionMetadata, perspectiveID, questionID, perspectiveOptions, flags);

		eventBus.fireEvent(new QueryUpdateEvent(queryDefinition));

		String historyString = queryDefinition.getAsString();
		if (setHistory) {
			SharedTools.println("History set: " + historyString);
			History.newItem(historyString, false);
			Tracking.googleAnalyticsTrack(queryDefinition.getAsString());
			iFrameTrack(historyString);
		}
	}

	/**
	 * Restore the page to a state defined by a string as defined by
	 * QueryDefinition.
	 * 
	 * @param storeString
	 *            the string that defines the state to be restored
	 * @param setHistory
	 *            true, if the browser history should be set
	 */
	public void restore(String storeString, boolean setHistory) {
		QueryDefinition queryDefinition;
		try {
			queryDefinition = new QueryDefinition(questionMetadata, storeString);
			Tracking.googleAnalyticsTrack(queryDefinition.getAsString());
			iFrameTrack(queryDefinition.getAsString());
		} catch (IllegalArgumentException e) {
			try {
				queryDefinition = new QueryDefinition(questionMetadata, config.defaultQueryString());
			} catch (IllegalArgumentException e2) {
				return;
			}
		}

		eventBus.fireEvent(new QueryUpdateEvent(queryDefinition));

		if (setHistory) {
			String historyString = queryDefinition.getAsString();
			SharedTools.println("History set; " + historyString);
			History.newItem(historyString, false);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onValueChange(ValueChangeEvent<String> event) {
		String req = event.getValue();
		if (req != null) {
			restore(req, false);
		}
	}
	
	private final native void iFrameTrack(String historyToken) /*-{
	    $wnd.parent.postMessage(historyToken, '*');
	}-*/;

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onSelectionUpdate(SelectionUpdateEvent event) {
		makeQuery(true);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onSetWarningBanner(SetWarningBannerEvent event) {
		setWarningBanner(event.getWarningBanner());
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onCloseWarningBanner(CloseWarningBannerEvent event) {
		removeWarningBanner();
	}

	protected WarningBanner currentWarning = null;

	protected void setWarningBanner(WarningBanner warning) {
		RootPanel warningSection = RootPanel.get("ID-general-warning");
		if (currentWarning != null) {
			warningSection.remove(currentWarning);
		}
		currentWarning = warning;
		warningSection.add(warning);
	}

	protected void removeWarningBanner() {
		RootPanel warningSection = RootPanel.get("ID-general-warning");
		if (currentWarning != null) {
			warningSection.remove(currentWarning);
			currentWarning = null;
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryUpdate(QueryUpdateEvent event) {
		statDataServerModel.makeRequest(event.getQueryDefinition());
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryReady(QueryReadyEvent event) {
		chartPanelPresenter.onQueryReady(event.getQueryDefinition(), event.getQueryData());
	}
}

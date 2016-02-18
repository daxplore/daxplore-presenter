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

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

import org.daxplore.presenter.chart.ChartPanelPresenter;
import org.daxplore.presenter.chart.display.ExternalLegend;
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
import org.daxplore.presenter.client.json.Groups;
import org.daxplore.presenter.client.json.Perspectives;
import org.daxplore.presenter.client.json.Prefix;
import org.daxplore.presenter.client.model.StatDataServerModel;
import org.daxplore.presenter.client.resources.DaxploreConfig;
import org.daxplore.presenter.client.ui.ChartTypeOptionsPanel;
import org.daxplore.presenter.client.ui.PerspectivePanel;
import org.daxplore.presenter.client.ui.QuestionPanel;
import org.daxplore.presenter.client.ui.StagePanel;
import org.daxplore.presenter.client.ui.WarningBanner;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.event.logical.shared.ValueChangeHandler;
import com.google.gwt.user.client.History;
import com.google.gwt.user.client.ui.RootPanel;
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

	private final PerspectivePanel perspectivePanel;
	private final QuestionPanel questionPanel;
	private final ChartPanelPresenter chartPanelPresenter;
	private QuestionMetadata questionMetadata;
	private final EventBus eventBus;
	private DaxploreConfig config;
	private StatDataServerModel statDataServerModel;
	private final String prefix;
	private Perspectives perspectives;
	private Groups groups;
	private ChartTypeOptionsPanel optionsPanel;
	private StagePanel stagePanel;

	@Inject
	protected Presenter(PerspectivePanel perspectivePanel, QuestionPanel questionPanel,
			EventBus eventBus, ChartPanelPresenter chartPanelPresenter,
			ChartTypeOptionsPanel optionsPanel, QuestionMetadata questionMetadata,
			DaxploreConfig config, StatDataServerModel statDataServerModel,
			Prefix prefix, Perspectives perspectives, Groups groups,
			StagePanel stagePanel) {
		this.perspectivePanel = perspectivePanel;
		this.questionPanel = questionPanel;
		this.questionMetadata = questionMetadata;
		this.chartPanelPresenter = chartPanelPresenter;
		this.eventBus = eventBus;
		this.config = config;
		this.statDataServerModel = statDataServerModel;
		this.prefix = prefix.getPrefix();
		this.perspectives = perspectives;
		this.groups = groups;
		this.optionsPanel = optionsPanel;
		this.stagePanel = stagePanel;

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
	private void makeQuery(boolean setHistory) {
		List<QueryFlag> flags = new LinkedList<>();
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
		
		//TODO this sets mean to be the default, the default should be set in the producer instead
		if(questionMetadata.hasMean(questionID)) {
			flags.add(QueryFlag.MEAN);
		}
		
		if(questionMetadata.hasMeanReferenceValue(questionID)){
			flags.add(QueryFlag.MEAN_REFERENCE);
		}
		
		QueryDefinition queryDefinition =
				new QueryDefinition(questionMetadata, questionID, perspectiveID, perspectiveOptions, flags);

		eventBus.fireEvent(new QueryUpdateEvent(queryDefinition));

		String historyString = queryDefinition.getAsString();
		if (setHistory) {
			History.newItem(historyString, false);
			Tracking.googleAnalyticsEvent(prefix + " chart", queryDefinition.getAsHumanString(prefix));
			Tracking.iFrame(historyString);
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
		try {
			QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, storeString);
			Tracking.googleAnalyticsEvent(prefix + " chart", queryDefinition.getAsHumanString(prefix));
			Tracking.iFrame(queryDefinition.getAsString());
			eventBus.fireEvent(new QueryUpdateEvent(queryDefinition));
			
			if (setHistory) {
				String historyString = queryDefinition.getAsString();
				History.newItem(historyString, false);
			}
		} catch (IllegalArgumentException e) {
			showDefaultChart();
		}
	}

	public void showDefaultChart() {
		String firstQuestionID = "";
		for(int i=0; i<groups.getGroupCount(); i++) {
			List<String> questionIDs = groups.getQuestionIDs(i);
			if(questionIDs.size()>0) {
				firstQuestionID = questionIDs.get(0);
				break;
			}
		}
		String firstPerspectiveID = perspectives.getQuestionIDs().get(0);
		List<Integer> selectedOptions = new ArrayList<>(0);
		int selectedPerspectiveOptions = Math.min(questionMetadata.getOptionCount(firstPerspectiveID), config.defaultSelectedPerspectiveOptions());
		for(int i=0; i<selectedPerspectiveOptions; i++) {
			selectedOptions.add(i);
		}
		ArrayList<QueryFlag> flags = new ArrayList<>(0);
		QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, firstQuestionID, firstPerspectiveID, selectedOptions, flags);
		eventBus.fireEvent(new QueryUpdateEvent(queryDefinition));
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

	private WarningBanner currentWarning = null;

	private void setWarningBanner(WarningBanner warning) {
		RootPanel warningSection = RootPanel.get("ID-general-warning");
		if (currentWarning != null) {
			warningSection.remove(currentWarning);
		}
		currentWarning = warning;
		warningSection.add(warning);
	}

	private void removeWarningBanner() {
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
		ExternalLegend legend = chartPanelPresenter.getExternalLegend();
		if (event.getQueryDefinition().hasFlag(QueryFlag.MEAN_REFERENCE)) {
			legend.addReferenceValue(event.getQueryData().getMeanPrimaryReference());
		}
		stagePanel.setLegend(legend);
		stagePanel.setDescription(event.getQueryDefinition().getQuestionID());
	}
}

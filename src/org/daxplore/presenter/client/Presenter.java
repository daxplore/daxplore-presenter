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

import org.daxplore.presenter.chart.ChartPanel;
import org.daxplore.presenter.client.Query.QueryFactory;
import org.daxplore.presenter.client.event.CloseWarningBannerEvent;
import org.daxplore.presenter.client.event.CloseWarningBannerHandler;
import org.daxplore.presenter.client.event.QueryUpdateEvent;
import org.daxplore.presenter.client.event.SelectionUpdateEvent;
import org.daxplore.presenter.client.event.SelectionUpdateHandler;
import org.daxplore.presenter.client.event.SetWarningBannerEvent;
import org.daxplore.presenter.client.event.SetWarningBannerHandler;
import org.daxplore.presenter.client.resources.DaxploreConfig;
import org.daxplore.presenter.client.resources.UITexts;
import org.daxplore.presenter.client.ui.ChartTypeOptionsPanel;
import org.daxplore.presenter.client.ui.ImageButtonPanel;
import org.daxplore.presenter.client.ui.PerspectivePanel;
import org.daxplore.presenter.client.ui.QuestionPanel;
import org.daxplore.presenter.client.ui.StagePanel;
import org.daxplore.presenter.client.ui.WarningBanner;
import org.daxplore.presenter.client.ui.WarningBanner.WarningBannerFactory;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.daxplore.presenter.shared.SharedTools;

import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.event.logical.shared.ValueChangeHandler;
import com.google.gwt.user.client.Cookies;
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
public class Presenter implements ValueChangeHandler<String>, SelectionUpdateHandler, SetWarningBannerHandler, CloseWarningBannerHandler {

	protected final PerspectivePanel perspectivePanel;
	protected final QuestionPanel questionPanel;
	protected final ChartTypeOptionsPanel optionsPanel;
	protected final QueryFactory queryFactory;
	protected final ChartPanel chartPanel;
	protected QuestionMetadata questionMetadata;
	protected final EventBus eventBus;
	protected DaxploreConfig config;

	private Query currentQuery;

	@Inject
	protected Presenter(StagePanel stagePanel, PerspectivePanel perspectivePanel, QuestionPanel questionPanel,
			ChartTypeOptionsPanel optionsPanel, QueryFactory queryFactory, EventBus eventBus, ChartPanel chartPanel,
			QuestionMetadata questionMetadata, ImageButtonPanel imageButtonPanel, DaxploreConfig config, UITexts uiTexts,
			WarningBannerFactory warningFactory) {
		this.perspectivePanel = perspectivePanel;
		this.questionPanel = questionPanel;
		this.optionsPanel = optionsPanel;
		this.queryFactory = queryFactory;
		this.questionMetadata = questionMetadata;
		this.chartPanel = chartPanel;
		this.eventBus = eventBus;
		this.config = config;

		List<Widget> actionWidgetList = new LinkedList<Widget>();
		actionWidgetList.add(imageButtonPanel);
		actionWidgetList.add(optionsPanel);
		chartPanel.setActionWidgets(actionWidgetList);

		SelectionUpdateEvent.register(eventBus, this);
		SetWarningBannerEvent.register(eventBus, this);
		CloseWarningBannerEvent.register(eventBus, this);

		History.addValueChangeHandler(this);

		if (!Cookies.isCookieEnabled()) {
			String ownLanguage = uiTexts.ownLangaugeCode();
			String ownLanguageWarning = uiTexts.cookiesDisabledOwnLanguageWarning();

			String otherLanguage = uiTexts.otherLangaugeCode();
			String otherLanguageWarning = uiTexts.cookiesDisabledOtherLanguageWarning();

			WarningBanner warningBanner = warningFactory.createWarningBanner(ownLanguage, ownLanguageWarning, otherLanguage, otherLanguageWarning);
			eventBus.fireEvent(new SetWarningBannerEvent(warningBanner));
		}
	}

	/**
	 * Create a new query.
	 * 
	 * <p>The query is constructed based on user selections in the current
	 * site.</p>
	 * 
	 * <p>This includes making a server request for the data (if needed) and
	 * handing over the query to the chart system.</p>
	 * 
	 * <p>You can choose if you want to set browser history or not.</p>
	 * 
	 * @param setHistory
	 *            true, if the browser history should be set
	 */
	public void makeQuery(boolean setHistory) {
		if (currentQuery != null) {
			currentQuery.cancelRequest();
		}
		List<QueryFlag> flags = new LinkedList<QueryFlag>();
		flags.addAll(optionsPanel.getFlags());
		flags.addAll(perspectivePanel.getFlags());
		QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, perspectivePanel.getQuestionID(),
				questionPanel.getQuestionID(), perspectivePanel.getPerspectiveOptions(), flags);
		Query oldQuery = currentQuery;
		try {
			currentQuery = queryFactory.createQuery(queryDefinition);
			currentQuery.fetchData();
		} catch (Exception e) {
			currentQuery = oldQuery;
			SharedTools.println("Invalid query in makeQuery");
			e.printStackTrace();
		}
		// currentQuery.fetchData(oldQuery);
		eventBus.fireEvent(new QueryUpdateEvent(queryDefinition));

		chartPanel.setData(currentQuery);

		String historyString = queryDefinition.getAsString();
		if (setHistory) {
			SharedTools.println("History set: " + historyString);
			History.newItem(historyString, false);
			googleAnalyticsTrack(queryDefinition.getQuestionID(), queryDefinition.getPerspectiveID());
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
			googleAnalyticsTrack(queryDefinition.getQuestionID(), queryDefinition.getPerspectiveID());
			iFrameTrack(queryDefinition.getAsString());
		} catch (IllegalArgumentException e) {
			if (currentQuery == null) {
				try {
					queryDefinition = new QueryDefinition(questionMetadata, config.defaultQueryString());
				} catch (IllegalArgumentException e2) {
					return;
				}
			} else {
				// TODO queryDefinition = currentQuery.getQueryDefinition(); ?
				return;
			}
		}

		currentQuery = queryFactory.createQuery(queryDefinition);
		currentQuery.fetchData();

		eventBus.fireEvent(new QueryUpdateEvent(queryDefinition));

		chartPanel.setData(currentQuery);

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

	/**
	 * Use Google Analytics to track the current web page.
	 * 
	 * <p>Only the selected question and perspective is tracked.</p>
	 * 
	 * @param questionID
	 *            the question ID
	 * @param perspectiveID
	 *            the perspective ID
	 */
	private void googleAnalyticsTrack(String questionID, String perspectiveID) {
		Tracking.track(config.googleAnalyticsID(), "q=" + questionID + "&p=" + perspectiveID);
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
}

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
import org.daxplore.presenter.client.json.Groups;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.gwt.core.shared.GWT;
import com.google.gwt.user.client.ui.Composite;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * A widget that contains a tree of all the questions that can be shown
 * in a chart.
 * 
 * <p>The tree is made up from groups of questions, that the user can
 * select.</p>
 */
public class QuestionPanel extends Composite implements QueryUpdateHandler {
	
	private final EventBus eventBus;
	
	@Inject
	protected QuestionPanel(EventBus eventBus, Groups groups) {
		this.eventBus = eventBus;
		QueryUpdateEvent.register(eventBus, this);
		exportQuestionCallback();
	}
	
	/**
	 * Get the questionID of the currently selected question.
	 * 
	 * @return the questionID
	 */
	public String getQuestionID() {
		return getQuestionNative();
	}
	
	protected native String getQuestionNative() /*-{
		return $wnd.getSelectedQuestion();
	}-*/;
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryUpdate(QueryUpdateEvent event) {
		String questionID = event.getQueryDefinition().getQuestionID();
		setQueryDefinitionNative(questionID);
	}

	protected native void setQueryDefinitionNative(String questionID) /*-{
		$wnd.questionSetQueryDefinition(questionID);
	}-*/;

	protected void gwtQuestionCallback() {
		eventBus.fireEvent(new SelectionUpdateEvent());
	}
	
	protected native void exportQuestionCallback() /*-{
		var that = this;
		$wnd.gwtQuestionCallback = $entry(function() {
			that.@org.daxplore.presenter.client.ui.QuestionPanel::gwtQuestionCallback()();
		});
	}-*/;
}

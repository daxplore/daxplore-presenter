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

import org.daxplore.presenter.client.event.QueryUpdateEvent;
import org.daxplore.presenter.client.event.QueryUpdateHandler;
import org.daxplore.presenter.client.event.SelectionUpdateEvent;
import org.daxplore.presenter.client.ui.PerspectiveCheckboxPanel.PerspectiveCheckboxPanelFactory;
import org.daxplore.presenter.client.ui.PerspectiveQuestionsPanel.PerspectiveQuestionsFactory;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.event.logical.shared.SelectionEvent;
import com.google.gwt.event.logical.shared.SelectionHandler;
import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.event.logical.shared.ValueChangeHandler;
import com.google.gwt.user.client.ui.HorizontalPanel;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.TreeItem;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * A widget that lets the user select what the chart's perspective should be.
 * 
 * <p>The perspective is defined as a questionID and a number of question
 * options. Depending on the selected perspective question different options
 * are shown.</p>
 * 
 * <p>This is the base widget that is inserted into the site. But the actual
 * visible parts of the widget is made up from two other widget. To the left
 * there is a {@link PerspectiveQuestionsPanel} that shows the different
 * questions that can be used as a perspective. To the right there is a
 * {@link PerspectiveCheckboxPanel} that contains checkboxes for all
 * question options for the current perspective question.</p>
 */
public class PerspectivePanel extends HorizontalPanel 
			implements QueryUpdateHandler, SelectionHandler<TreeItem>, ValueChangeHandler<Boolean> {

	protected final EventBus eventBus;
	protected final PerspectiveCheckboxPanelFactory checkPanelFactory;
	protected final PerspectiveQuestionsFactory questionListFactory;
	protected PerspectiveQuestionsPanel perspectiveQuestionList;
	protected PerspectiveCheckboxPanel perspectiveCheckboxes;
	protected SimplePanel perspectiveQuestionsContainer = new SimplePanel();
	protected SimplePanel checkboxContainer = new SimplePanel();

	@Inject
	PerspectivePanel(QuestionMetadata questions, PerspectiveCheckboxPanelFactory checkPanelFactory,
			EventBus eventBus, PerspectiveQuestionsFactory perspectivePanelFactory) {
		this.checkPanelFactory = checkPanelFactory;
		this.eventBus = eventBus;
		this.questionListFactory = perspectivePanelFactory;

		setSpacing(10);
		this.add(perspectiveQuestionsContainer);
		this.add(checkboxContainer);

		perspectiveQuestionList = perspectivePanelFactory.createPerspectivePanel();
		perspectiveQuestionsContainer.setWidget(perspectiveQuestionList);
		perspectiveQuestionsContainer.setVisible(true);
		
		perspectiveQuestionList.addSelectionHandler(this);
		QueryUpdateEvent.register(eventBus, this);
	}


	/**
	 * Get the questionID that is currently selected as perspective.
	 * 
	 * @return the current perspective's questionID
	 */
	public String getQuestionID() {
		return perspectiveQuestionList.getQuestionID();
	}

	/**
	 * Get the query flags defined by the perspective.
	 * 
	 * @return the flags
	 */
	public boolean useTotalSelected() {
		return perspectiveCheckboxes != null && perspectiveCheckboxes.isTotalSet();
	}

	/**
	 * Get the selected perspective options.
	 * 
	 * @return the perspective options
	 */
	public List<Integer> getPerspectiveOptions() {
		if (perspectiveCheckboxes != null) {
			return perspectiveCheckboxes.getPerspectiveOptions();
		} else {
			return new LinkedList<Integer>();
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryUpdate(QueryUpdateEvent event) {
		setQueryDefinition(event.getQueryDefinition());
	}
	
	/**
	 * Set a new query definition, updating what the perspective panel
	 * represents.
	 * 
	 * @param queryDefinition
	 *            the new query definition
	 */
	public void setQueryDefinition(QueryDefinition queryDefinition) {
		if(queryDefinition.getPerspectiveID() != null && !"".equals(queryDefinition.getPerspectiveID())){
			perspectiveQuestionList = questionListFactory.createPerspectivePanel();
			perspectiveQuestionList.setPerspective(queryDefinition.getPerspectiveID(), false);
			perspectiveQuestionList.addSelectionHandler(this);
			perspectiveQuestionsContainer.setWidget(perspectiveQuestionList);

			perspectiveCheckboxes = checkPanelFactory.createCheckboxPanel(queryDefinition);
			perspectiveCheckboxes.addValueChangeHandler(this);
			checkboxContainer.setWidget(perspectiveCheckboxes);
		} else {
			perspectiveQuestionList = questionListFactory.createPerspectivePanel();
			perspectiveQuestionList.setPerspective("", false);
			perspectiveQuestionList.addSelectionHandler(this);

			perspectiveQuestionsContainer.setWidget(perspectiveQuestionList);
		}
	}

	/**
	 * This method is automatically called when a new checkbox has been
	 * selected.
	 * 
	 * @param event
	 *            an event representing the change (the content is irrelevant)
	 */
	@Override
	public void onValueChange(ValueChangeEvent<Boolean> event) {
		eventBus.fireEvent(new SelectionUpdateEvent());
	}

	/**
	 * This method is automatically called when a new perspective-question has
	 * been selected.
	 * 
	 * <p>
	 * It first replaces the checkbox-section of the perspectivePanel with a new
	 * set of checkboxes and then sends a new {@link SelectionUpdateEvent} over
	 * the system's eventbus.
	 * </p>
	 * 
	 * @param event
	 *            the event
	 */
	@Override
	public void onSelection(SelectionEvent<TreeItem> event) {
		QuestionTreeItem item = (QuestionTreeItem) event.getSelectedItem();
		perspectiveCheckboxes = checkPanelFactory.createCheckboxPanel(item.getQuestionID());
		perspectiveCheckboxes.addValueChangeHandler(this);
		checkboxContainer.setWidget(perspectiveCheckboxes);
		
		eventBus.fireEvent(new SelectionUpdateEvent());
	}
}

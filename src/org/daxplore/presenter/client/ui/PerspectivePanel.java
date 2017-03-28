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

import java.util.ArrayList;
import java.util.List;

import org.daxplore.presenter.client.event.QueryUpdateEvent;
import org.daxplore.presenter.client.event.QueryUpdateHandler;
import org.daxplore.presenter.client.event.SelectionUpdateEvent;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

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
public class PerspectivePanel implements QueryUpdateHandler {

	private final EventBus eventBus;
	
	private String perspectiveID;
	private boolean useTotalSelected;
	private List<Integer> selectedOptions = new ArrayList<>();

	@Inject
	protected PerspectivePanel(EventBus eventBus) {
		this.eventBus = eventBus;
		QueryUpdateEvent.register(eventBus, this);
		exportPerspectiveCallback();
	}


	/**
	 * Get the questionID that is currently selected as perspective.
	 * 
	 * @return the current perspective's questionID
	 */
	public String getQuestionID() {
		return perspectiveID;
	}

	/**
	 * Get the query flags defined by the perspective.
	 * 
	 * @return the flags
	 */
	public boolean useTotalSelected() {
		return useTotalSelected;
	}

	/**
	 * Get the selected perspective options.
	 * 
	 * @return the perspective options
	 */
	public List<Integer> getPerspectiveOptions() {
		return selectedOptions;
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
		perspectiveID = queryDefinition.getPerspectiveID();
		selectedOptions = queryDefinition.getUsedPerspectiveOptions();
		useTotalSelected = queryDefinition.hasFlag(QueryFlag.TOTAL);
		
		// TODO check if actually updated
		StringBuilder sb = new StringBuilder("[");
		int count = queryDefinition.getPerspectiveOptionCount();
		for (int i=0; i<count; i++) {
			sb.append(selectedOptions.contains(i));
			if (i<count-1) {
				sb.append(",");
			}
		}
		sb.append("]");
		setQueryDefinitionNative(perspectiveID, sb.toString(), useTotalSelected);
	}
	
	protected native void setQueryDefinitionNative(String perspectiveID, String options, boolean total) /*-{
		$wnd.perspectiveSetQueryDefinition(perspectiveID, JSON.parse(options), total);
	}-*/;
	
	protected void gwtPerspectiveCallback(String perspective, String options, boolean total) {
		this.perspectiveID = perspective;
		
		List<Integer> optionList = new ArrayList<>();
		int i = 0;
		for (String s : options.split(",")) {
			if (Boolean.parseBoolean(s)) {
				optionList.add(i);
			}
			i++;
		}
		
		selectedOptions = optionList;

		this.useTotalSelected = total;
		
		eventBus.fireEvent(new SelectionUpdateEvent());
	}
	
	protected native void exportPerspectiveCallback() /*-{
		var that = this;
		$wnd.gwtPerspectiveCallback = $entry(function(perspective, options, total) {
			that.@org.daxplore.presenter.client.ui.PerspectivePanel::gwtPerspectiveCallback(Ljava/lang/String;Ljava/lang/String;Z)(perspective, options, total);
		});
	}-*/;
}

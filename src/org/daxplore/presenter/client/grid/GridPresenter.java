/**
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.client.grid;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.daxplore.presenter.client.event.QueryReadyEvent;
import org.daxplore.presenter.client.event.QueryReadyHandler;
import org.daxplore.presenter.client.json.Groups;
import org.daxplore.presenter.client.json.Perspectives;
import org.daxplore.presenter.client.model.StatDataServerModel;
import org.daxplore.presenter.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.event.shared.EventBus;

public class GridPresenter implements QueryReadyHandler {
	
	private StatDataServerModel statDataServerModel;
	private final Groups groups;
	private final Perspectives perspectives;
	private final QuestionMetadata questionMetadata;
	private final GridView gridView;
	
	private Map<QueryDefinition, QueryData> loadedData = new LinkedHashMap<>(); 
	
	private String selectedPerspectiveID;
	private Set<String> addedQuestions = new HashSet<>(); 
	
	public GridPresenter(EventBus eventBus, StatDataServerModel statDataServerModel,
			Groups groups, QuestionMetadata questionMetadata, Perspectives perspectives) {
		
		this.statDataServerModel = statDataServerModel;
		this.groups = groups;
		this.perspectives = perspectives;
		this.questionMetadata = questionMetadata;
		
		gridView = new GridView();
		
		QueryReadyEvent.register(eventBus, this);
		
		makeQuery();
	}
	
	private void makeQuery() {
		//TODO select perspective based on some input
		String perspectiveID = perspectives.getQuestionIDs().get(0);
		selectedPerspectiveID = perspectiveID;
		
		for (int groupIndex = 0; groupIndex < groups.getGroupCount(); groupIndex++) {
			for (String questionID : groups.getQuestionIDs(groupIndex)) {
				if (questionMetadata.hasMean(questionID)) {
					List<QueryFlag> flags = new LinkedList<>();
					flags.add(QueryFlag.MEAN);
					flags.add(QueryFlag.TOTAL);
					
					int optionCount = questionMetadata.getOptionCount(perspectiveID);
					List<Integer> perspectiveOptions = new ArrayList<>(optionCount);
					for (int i=0; i<optionCount; i++) {
						perspectiveOptions.add(i);
					}
					
					QueryDefinition queryDefinition =
							new QueryDefinition(questionMetadata, questionID, perspectiveID, perspectiveOptions, flags);
					statDataServerModel.makeRequest(queryDefinition, true);
				}
			}
		}
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryReady(QueryReadyEvent event) {
		if(addedQuestions.add(event.getQueryDefinition().getQuestionID())) {
			loadedData.put(event.getQueryDefinition(), event.getQueryData());
			gridView.createGrid(loadedData);
		}
	}

	public GridView getView() {
		return gridView;
	}


}

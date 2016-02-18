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


import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import org.daxplore.presenter.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.gwt.core.client.GWT;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.Grid;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.Widget;

public class GridView extends Composite {
	interface GridUiBinder extends UiBinder<Widget, GridView> {/* Empty UiTemplate interface */}
	private static GridUiBinder uiBinder = GWT.create(GridUiBinder.class);
	
	@UiField(provided = true)
	protected final SimplePanel gridContainer;
	
	private Grid grid;
	
	public GridView() {
		gridContainer = new SimplePanel();
		initWidget(uiBinder.createAndBindUi(this));
	}

	public void createGrid(Map<QueryDefinition, QueryData> queryDataMap) {
		Set<QueryDefinition> keySet = queryDataMap.keySet();
		if(keySet.size() == 0) {
			return;
		}
		
//		List questions = queryDataMap.values().
		QueryDefinition def = keySet.iterator().next();
		int perspectiveOptions = def.getPerspectiveOptionCount();
		int questionCount = queryDataMap.size();
		grid = new Grid(questionCount+1, perspectiveOptions+2);
		
		int column = 1;
		for(String option : def.getPerspectiveOptionTexts()) {
			setOptionHeader(column++, option);
		}
		
		int row = 1;
		for (Entry<QueryDefinition, QueryData> e : queryDataMap.entrySet()) {
			QueryDefinition definition = e.getKey();
			QueryData data = e.getValue();
			setQuestionHeader(row, definition.getQuestionShortText());
			for(int col = 1; col <= definition.getPerspectiveOptionCount(); col++) {
				setCell(row, col, data.getMeanPrimary(col-1), data.getMeanPrimaryReference());
			}
			row++;
		}
		gridContainer.setWidget(grid);
	}

	private void setOptionHeader(int column, String text) {
		grid.setHTML(0, column, "<div style='width:50px; font-weight:bold;'>"+text+"</div>");
	}
	
	private void setQuestionHeader(int row, String text) {
		grid.setHTML(row, 0, "<b>"+text+"</b>");
	}
	
	
	private void setCell(int row, int col, double mean, double referenceMean) {
		String backColor = "yellow";
		double diff = 5;
		if(mean > referenceMean + diff) {
			backColor = "red";
		} else if (mean < referenceMean - diff) {
			backColor = "green";
		}
		grid.setHTML(row, col, "<span class='daxplore-gridCell' style='background:" + backColor + ";'>" + mean + "</span>");
	}
}

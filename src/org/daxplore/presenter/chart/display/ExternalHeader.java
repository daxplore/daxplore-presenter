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
package org.daxplore.presenter.chart.display;

import java.util.LinkedList;
import java.util.List;

import org.daxplore.presenter.client.json.shared.UITexts;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.HTML;

/**
 * A header widget for a chart that can be placed outside of the actual chart
 * area.
 */
public class ExternalHeader extends Composite {

	/**
	 * Instantiates a new external header.
	 * 
	 * @param chartTexts
	 *            the chart texts
	 * @param query
	 *            the query
	 */
	public ExternalHeader(UITexts uiTexts, QueryDefinition queryDefinition) {
		String titleHeader = queryDefinition.getQuestionShortText();
		String titleDetail = queryDefinition.getQuestionFullText();

		HTML content = new HTML();
		String title = "<div class='daxplore-ExternalHeader-header'>" + titleHeader + "</div>";
		if (!titleHeader.equalsIgnoreCase(titleDetail)) {
			title += "<div class='daxplore-ExternalHeader-sub'>" + titleDetail + "</div>";
		}
		if (queryDefinition.hasFlag(QueryFlag.DICHOTOMIZED)) {
			List<String> optionTexts = queryDefinition.getQuestionOptionTexts();
			List<String> usedDichTexts = new LinkedList<>();
			for (Integer i : queryDefinition.getDichotomizedSelectedOptions()) {
				usedDichTexts.add(optionTexts.get(i));
			}
			title += "<div class='daxplore-ExternalHeader-dichsub'>" + uiTexts.dichotomizedSubtitle(usedDichTexts) + "</div>";
		}
		content.setHTML(title);
		initWidget(content);
		setStylePrimaryName("daxplore-ExternalHeader");
	}
	
	/**
	 * Creates a new empty header
	 */
	public ExternalHeader() {
		initWidget(new HTML(""));
		setStylePrimaryName("daxplore-ExternalHeader");
	}
}

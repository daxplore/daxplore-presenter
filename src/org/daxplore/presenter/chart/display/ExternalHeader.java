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

import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.shared.QueryDefinition;

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
	public ExternalHeader(ChartTexts chartTexts, QueryDefinition queryDefinition) {
		String titleHeader = queryDefinition.getQuestionShortText();
		String titleDetail = queryDefinition.getQuestionFullText();

		HTML content = new HTML();
		if (titleHeader.equalsIgnoreCase(titleDetail)) {
			String title = chartTexts.singleTitle(titleHeader);
			content.setHTML(title);
		} else {
			String title = chartTexts.doubleTitle(titleHeader, titleDetail);
			content.setHTML(title);
		}
		initWidget(content);
		setStylePrimaryName("daxplore-ExternalHeader");
	}
}

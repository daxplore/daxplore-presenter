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

import java.util.List;

import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.HTML;

/**
 * A legend widget for a chart that can be placed outside of the actual chart
 * area.
 */
public class ExternalLegend extends Composite {
	protected HTML content;

	/**
	 * Instantiates a new external legend.
	 * 
	 * @param chartTexts
	 *            the chart texts
	 * @param query
	 *            the query
	 * @param itemLimit
	 *            max number of legend-items to be displayed
	 * @param printerMode
	 *            use the printer-friendly mode
	 */
	public ExternalLegend(ChartTexts chartTexts, QueryDefinition queryDefinition, int itemLimit, boolean printerMode) {
		StringBuilder html = new StringBuilder("<table class=\"daxplore-ExternalLegend\">");

		List<String> questionOptionTexts = queryDefinition.getQuestionOptionTexts();
		int usedOptions = 0;
		int unusedOptions = 0;
		for (int optionIndex = 0; optionIndex < queryDefinition.getQuestionOptionCount(); optionIndex++) {
			if (usedOptions < itemLimit) {
				String text = questionOptionTexts.get(optionIndex);
				String boxColor = BarColors.getChartColorSet(optionIndex).getPrimary();
				html.append(legendRow(text, boxColor, printerMode));
				usedOptions++;
			} else {
				unusedOptions++;
			}
		}
		if (unusedOptions > 0) {
			html.append("<tr><td colspan=\"2\" class=\"daxplore-ExternalLegend-hiddenCount\">"); //TODO is class used?
			if (unusedOptions == 1) {
				html.append(chartTexts.oneOptionHidden());
			} else {
				html.append(chartTexts.optionsHidden().replaceFirst("%d", "" + unusedOptions));
			}
			html.append("</td></tr>");
		}
		html.append("</table>");
		content = new HTML(html.toString());
		initWidget(content);
	}

	protected static String legendRow(String text, String boxColorHex, boolean printerMode) {
		StringBuilder legendRow = new StringBuilder();
		legendRow.append("<tr><td>");
		if (printerMode) {
			legendRow.append("<img src=\"/pixel/").append(boxColorHex.substring(1)).append(".png\">");
		} else {
			legendRow.append("<div style=\"background-color: ").append(boxColorHex).append("\">");
		}
		legendRow.append("</td><td>").append(text).append("</td></tr>");
		return legendRow.toString();
	}
}

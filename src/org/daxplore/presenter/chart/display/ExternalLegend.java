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

import org.daxplore.presenter.chart.ChartTools;
import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.HTML;
import com.google.gwt.user.client.ui.VerticalPanel;

/**
 * A legend widget for a chart that can be placed outside of the actual chart
 * area.
 */
public class ExternalLegend extends Composite {
	private ChartTexts chartTexts;
	private QueryDefinition queryDefinition;
	private static ExternalLegend emptyLegend = new ExternalLegend();
	private VerticalPanel content = new VerticalPanel();
	private HTML legend;

	/**
	 * Instantiates a new external legend.
	 * 
	 * @param chartTexts
	 *            the chart texts
	 * @param query
	 *            the query
	 * @param printerMode
	 *            use the printer-friendly mode
	 */
	public ExternalLegend(ChartTexts chartTexts, QueryDefinition queryDefinition, boolean printerMode) {
		this.queryDefinition = queryDefinition;
		this.chartTexts = chartTexts;
		StringBuilder html = new StringBuilder();
		if(queryDefinition.hasFlag(QueryFlag.MEAN)) {
			html.append("<div class=\"daxplore-ExternalLegendHeader\">" + queryDefinition.getPerspectiveShortText() + "</div>");
			html.append("<table class=\"daxplore-ExternalLegend\">");
			List<String> perspectiveOptionTexts = queryDefinition.getPerspectiveOptionTexts();
			for (int perspectiveOption : queryDefinition.getUsedPerspectiveOptions()) {
				String text = perspectiveOptionTexts.get(perspectiveOption);
				String boxColor = BarColors.getChartColorSet(perspectiveOption).getPrimary();
				html.append(legendRow(text, boxColor, printerMode));
			}
			if (queryDefinition.hasFlag(QueryFlag.TOTAL)) {
				String text = chartTexts.compareWithAll();
				String boxColor = BarColors.getChartColorSet(queryDefinition.getPerspectiveOptionCount()).getPrimary();
				html.append(legendRow(text, boxColor, printerMode));
			}
		} else if (queryDefinition.hasFlag(QueryFlag.DICHOTOMIZED)) {
			html.append("<div class=\"daxplore-ExternalLegend\"></div>");
		} else {
			html.append("<table class=\"daxplore-ExternalLegend\">");
			List<String> questionOptionTexts = queryDefinition.getQuestionOptionTexts();
			for (int optionIndex = 0; optionIndex < queryDefinition.getQuestionOptionCount(); optionIndex++) {
				String text = questionOptionTexts.get(optionIndex);
				String boxColor = BarColors.getChartColorSet(optionIndex).getPrimary();
				html.append(legendRow(text, boxColor, printerMode));
			}
		}
		
		html.append("</table>");
		legend = new HTML(html.toString());
		content.add(legend);
		initWidget(content);
	}
	
	public void addReferenceValue(double referenceValue) {
		String text = chartTexts.meanReferenceCompact(ChartTools.formatAsTwoDigits(referenceValue));
		HTML html = new HTML("<div class=\"daxplore-LegendReference\" style=\"border-color:" + BarColors.getReferenceColors().getPrimary() + "\">" + text + "</div>");
		content.add(html);
	}
	
	private ExternalLegend() {
		initWidget(new HTML(""));
	}
	
	public static ExternalLegend getEmptyLegend() {
		return emptyLegend;
	}

	private static String legendRow(String text, String boxColorHex, boolean printerMode) {
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
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	protected void onAttach() {
		super.onAttach();
		if (queryDefinition != null && queryDefinition.hasFlag(QueryFlag.DICHOTOMIZED)) {
			generateDichTimeLineLegend();
		}
	}
	
	 /**
	  * Call d3 code to generate legend.
	  * 
	  * Needs to be called after chart is attached and data is generated.
	  */
	protected native void generateDichTimeLineLegend() /*-{
		$wnd.generateDichTimeLineLegend();
	}-*/;
}

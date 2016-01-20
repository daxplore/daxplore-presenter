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

import org.daxplore.presenter.chart.ChartTools;
import org.daxplore.presenter.chart.resources.ChartConfig;
import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.client.json.shared.UITexts;
import org.daxplore.presenter.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

import com.google.gwt.event.dom.client.MouseMoveEvent;
import com.google.gwt.event.dom.client.MouseMoveHandler;
import com.google.gwt.event.dom.client.MouseOutEvent;
import com.google.gwt.event.dom.client.MouseOutHandler;
import com.googlecode.gchart.client.GChart;

/**
 * A chart type for displaying mean values with standard deviations.
 */
public class MeanChart extends GChartChart {

	/**
	 * The space between different groups, using the internal GChart distance
	 * system.
	 */
	protected final static double groupSpacing = 0.1;

	/**
	 * Keeps track of what position the next groups should be drawn at.
	 * 
	 * <p>Uses the internal GChart distance system.</p>
	 */
	protected double currentPosition;

	/**
	 * Keeps track of which group to draw next.
	 */
	protected int currentGroup;

	/**
	 * Keeps track of the number of groups to be drawn.
	 * 
	 * <p>Includes both the selected options and the total item.</p>
	 */
	protected int perspectiveCount;

	/**
	 * A list of the groups to be drawn.
	 * 
	 * <p>In addition to these, there is also the total-item.</p>
	 */
	protected List<Integer> usedPerspectiveOptions;

	/**
	 * A list of all the primary bars.
	 * 
	 * <p>In the basic version of this class, there are no secondary bars.</p>
	 */
	protected LinkedList<MeanChartBarPrimary> barListPrimary;

	protected MeanReferenceLineBar referenceLineBar;
	protected Curve paddingCurve;

	/**
	 * If a bar is hovered with the mouse, it is stored here.
	 * 
	 * <p>Keeping track of it makes it possible to restore any changes made to
	 * it while it was being hovered.</p>
	 */
	private ChartBar hoveredBar;

	protected ChartConfig chartConfig;

	protected int xTickMaxCharacterCount = 13;
	protected int yTickWidth;
	protected int yTickCharacterCount;

	protected MeanChart(ChartTexts chartTexts, ChartConfig chartConfig, UITexts uiTexts,
			QueryDefinition queryDefinition, boolean printerMode) {
		super(chartTexts, uiTexts, queryDefinition);
		this.chartConfig = chartConfig;

		externalLegend = new ExternalLegend(chartTexts, queryDefinition, printerMode);

		usedPerspectiveOptions = queryDefinition.getUsedPerspectiveOptions();
		perspectiveCount = usedPerspectiveOptions.size() + (queryDefinition.hasFlag(QueryFlag.TOTAL) ? 1 : 0);
		if (perspectiveCount <= 0) {
			throw new Error("Group count = " + perspectiveCount);
		}

		addReferenceLine(printerMode);
		createCurves(printerMode);

		setupMouseHandlers();
		setupAxes();
	}

	protected void createCurves(boolean printerMode) {
		barListPrimary = new LinkedList<>();
		int addedPerspectives = 0;
		for (int perspective : queryDefinition.getUsedPerspectiveOptions()) {
			addCurve();
			Curve barCurve = getCurve();
			
			AnnotationLocation hoverLocation = AnnotationLocation.SOUTH;
			if(perspectiveCount>1 && addedPerspectives==0){
				hoverLocation = AnnotationLocation.SOUTHEAST;
			} else if(perspectiveCount>1 && addedPerspectives==perspectiveCount-1) {
				hoverLocation = AnnotationLocation.SOUTHWEST;
			}
			addPrimaryBar(new MeanChartBarPrimary(chartTexts, barCurve, getColorSet(perspective), printerMode, hoverLocation));
			
			addedPerspectives++;
		}
		if (queryDefinition.hasFlag(QueryFlag.TOTAL)) {
			addCurve();
			Curve barCurve = getCurve();
			AnnotationLocation hoverLocation = AnnotationLocation.SOUTH;
			if(perspectiveCount>1) {
				hoverLocation = AnnotationLocation.SOUTHWEST;
			}
			addPrimaryBar(new MeanChartBarPrimary(chartTexts, barCurve,
					getColorSet(queryDefinition.getPerspectiveOptionCount()), printerMode, hoverLocation));
		}
		addPaddingCurve();
	}

	protected void addPaddingCurve() {
		addCurve();
		paddingCurve = getCurve();
		Symbol symbol = paddingCurve.getSymbol();
		
		symbol.setBorderWidth(0);
		symbol.setSymbolType(SymbolType.VBAR_SOUTHWEST);
		symbol.setHoverLocation(AnnotationLocation.SOUTH);
		symbol.setHoverAnnotationEnabled(true);
		symbol.setBorderStyle("none");
		
		symbol.setModelWidth(1.0);
		symbol.setDistanceMetric(0, 0);
		symbol.setHoverSelectionEnabled(false);
		symbol.setModelWidth(0);
	}
	
	protected void addReferenceLine(boolean printerMode) {
		addCurve();
		Curve referenceCurve = getCurve();
		referenceLineBar = new MeanReferenceLineBar(chartTexts, BarColors.getReferenceColors(), referenceCurve, printerMode);
	}

	/**
	 * Set up the appearance of the axes.
	 * 
	 * <p>When the data is loaded, call setYAxis to give it the Y-axis the
	 * correct height.</p>
	 * 
	 * @see setYAxis
	 */
	private void setupAxes() {
		getXAxis().setTickLabelFontSize(12);
		getXAxis().setTickLabelThickness(35);
		getXAxis().setTickLength(6); // small tick-like gap...
		getXAxis().setTickThickness(0); // but with invisible ticks
		getXAxis().setAxisMin(0); // keeps first bar on chart

		// TODO figure out when to show as option ticks and when to show as a
		// normalized scale
		boolean normalizedScale = true;
		if (normalizedScale) {
			getYAxis().setAxisMin(0);
			getYAxis().setAxisMax(100); // copsoq normalized scale 0-100
			getYAxis().setHasGridlines(true);
			yTickCharacterCount = 0;
			for (int i = 0; i <= 100; i += 5) {
				if (i % 10 == 0) {
					getYAxis().addTick(i, "<html>" + i + "&nbsp;</html>");
				} else {
					getYAxis().addTick(i, "");
				}
				setGridColor("#BBBBBB"); // TODO externalize
			}
		} else {
			// Option ticks, assuming the lowest option is 1
			getYAxis().setAxisMin(1);
			getYAxis().setTickLabelFormat("#.##");
			getYAxis().setAxisMax(queryDefinition.getQuestionOptionCount());
			yTickCharacterCount = 0;

			List<String> questionOptionTexts = queryDefinition.getQuestionOptionTexts();

			for (int i = 0; i < queryDefinition.getQuestionOptionCount(); i++) {
				String optionText = questionOptionTexts.get(i) + " (" + (i + 1) + ")  ";
				if (optionText.length() > yTickCharacterCount) {
					yTickCharacterCount = optionText.length();
				}
				getYAxis().addTick(i + 1, optionText);
			}
		}

		if (ChartTools.ieVersion() > 1) {
			getYAxis().setTickLabelFontSize(12);
			getYAxis().setTickLabelFontWeight("normal");
			getYAxis().setTickLabelThickness(yTickCharacterCount * 5);

		} else {
			// This is a trick to fool GChart into calculating the width of the
			// tick correctly.
			// Currently, the font size is never set but the width calculations
			// are affected.
			getYAxis().setTickLabelFontSize(8);
		}
		yTickWidth = yTickCharacterCount * 5;
	}

	/**
	 * When a new bar is create it, add it here.
	 * 
	 * <p>It is important to add the curves in left-to-right order. By keeping
	 * track of the index of the bar, we can find it when we want to add data to
	 * the curve of a specific index. It also makes it possible to find the bar
	 * that belongs to a curve that is being hovered.</p>
	 * 
	 * @param bar
	 *            The bar to be stored in the chart
	 */
	protected void addPrimaryBar(MeanChartBarPrimary bar) {
		barListPrimary.add(bar);
	}

	/**
	 * Get the primary bar at a specific position in the chart.
	 * 
	 * <p>The bars are ordered from left to right. If there are secondary bars,
	 * each index will have one primary bar and one secondary bar.</p>
	 * 
	 * @param index
	 *            The position of the bar in the chart.
	 * @return The primary bar at the given position.
	 */
	protected MeanChartBarPrimary getBarPrimary(int index) {
		return barListPrimary.get(index);
	}

	/**
	 * Get the bar that belongs to a specific GChart curve.
	 * 
	 * @param curve
	 *            The curve that the bar belongs to.
	 * @return The bar that belongs to the given curve.
	 */
	protected ChartBar getBar(Curve curve) {
		for (ChartBar column : barListPrimary) {
			if (column.getCurve() == curve) {
				return column;
			}
		}
		if (curve == referenceLineBar.getCurve()) {
			return referenceLineBar;
		}
		return null;
	}

	/**
	 * Add mouse handlers, to keep track what bars are hovered and unhovered.
	 */
	protected void setupMouseHandlers() {
		addMouseMoveHandler(new MouseMoveHandler() {
			@Override
			public void onMouseMove(MouseMoveEvent event) {
				GChart theGChart = (GChart) event.getSource();
				Curve curve = theGChart.getTouchedCurve();
				boolean updateNeeded = false;
				if (hoveredBar != null) {
					hoveredBar.unhover();
					hoveredBar = null;
					updateNeeded = true;
				}
				if (curve != null) {
					hoveredBar = getBar(curve);
					if (hoveredBar != null) {
						hoveredBar.hover();
						updateNeeded = true;
					}
				}
				if (updateNeeded) {
					theGChart.update();
				}
			}
		});

		addMouseOutHandler(new MouseOutHandler() {
			@Override
			public void onMouseOut(MouseOutEvent event) {
				GChart theGChart = (GChart) event.getSource();
				boolean updateNeeded = false;
				if (hoveredBar != null) {
					hoveredBar.unhover();
					hoveredBar = null;
					updateNeeded = true;
				}
				if (updateNeeded) {
					theGChart.update();
				}
			}
		});
	}

	/**
	 * Add the data and complete the construction of the chart.
	 */
	public void addData(QueryData queryData) {
		List<String> perspectiveOptionTexts = queryDefinition.getPerspectiveOptionTexts();
		currentPosition = 1 + groupSpacing / 2;
		currentGroup = 0;
		for (int perspectiveOption : usedPerspectiveOptions) {
			if (queryData.hasMeanPrimary(perspectiveOption)) {
				drawBarGroup(perspectiveOptionTexts.get(perspectiveOption),
						queryData.getMeanPrimary(perspectiveOption), queryData.getMeanPrimaryCount(perspectiveOption));
			} else {
				drawMissingBarGroup(perspectiveOptionTexts.get(perspectiveOption));
			}
			currentPosition += 1 + groupSpacing;
			currentGroup++;
		}
		if (queryDefinition.hasFlag(QueryFlag.TOTAL)) {
			String totalText = chartTexts.compareWithAll();
			if (queryData.hasAddedMeanPrimary()) {
				drawBarGroup(totalText, queryData.getMeanPrimaryTotal(), queryData.getMeanPrimaryCountTotal());
			} else {
				drawMissingBarGroup(totalText);
			}
			currentPosition += 1 + groupSpacing;
			currentGroup++;
		}
		currentPosition -= (1 + groupSpacing / 2);

		drawPaddingBar();

		if(queryDefinition.hasFlag(QueryFlag.MEAN_REFERENCE)) {
			double reference = queryData.getMeanPrimaryReference();
			referenceLineBar.setDataPoint(currentPosition, reference);
			referenceLineBar.setHoverText(reference);
		}

		update();
		setVisible(true);
	}

	private void drawBarGroup(String groupName, double mean, int population) {
		MeanChartBarPrimary bar = getBarPrimary(currentGroup);

		bar.setDataPoint(currentPosition, mean);
		bar.setHoverTextStandard(groupName, mean);

		// TODO calculate offset from widgets?
		// xTickMaxCharacterCount = Math.max(xTickMaxCharacterCount,
		// groupName.length());
		xTickMaxCharacterCount = 5;

		String tickText = chartTexts.standardTickNoRespondents(groupName);
		// getXAxis().addTick(currentPosition - 0.5, tickText);
		getXAxis().addTick(currentPosition - 0.5, "");
	}

	private void drawMissingBarGroup(String groupName) {
		String tickText = chartTexts.missingTick(groupName, chartConfig.respondentCountCutoff());
		getXAxis().addTick(currentPosition - 0.5, tickText);
	}

	protected void drawPaddingBar() {
		paddingCurve.addPoint(currentPosition, 0);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getMinWidth() {
		return Math.max((int) (10 + yTickWidth + xTickMaxCharacterCount * perspectiveCount * 7.5), 300);
	}
}

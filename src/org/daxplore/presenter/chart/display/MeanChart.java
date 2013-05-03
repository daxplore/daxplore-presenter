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
import org.daxplore.presenter.chart.QueryInterface;
import org.daxplore.presenter.chart.QueryInterface.QueryCallback;
import org.daxplore.presenter.chart.data.QueryResultMean;
import org.daxplore.presenter.chart.resources.ChartConfig;
import org.daxplore.presenter.chart.resources.ChartTexts;
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
	protected final static double groupSpacing = 1;

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
	protected int groupCount;

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

	/**
	 * The curve index of the padding bar.
	 */
	protected int paddingBarIndex;

	/**
	 * If a bar is hovered with the mouse, it is stored here.
	 * 
	 * <p>Keeping track of it makes it possible to restore any changes made to
	 * it while it was being hovered.</p>
	 */
	private ChartBar hoveredBar;

	/**
	 * The query that this chart displays.
	 */
	protected final QueryInterface query;
	protected ChartConfig chartConfig;

	protected int xTickMaxCharacterCount = 13;
	protected int yTickWidth;
	protected int yTickCharacterCount;

	protected MeanChart(ChartTexts chartTexts, ChartConfig chartConfig, final QueryInterface query, boolean printerMode) {
		super(chartTexts, chartConfig, query);
		this.query = query;
		this.chartConfig = chartConfig;

		externalLegend = new ExternalLegend(chartTexts, query, true, chartConfig.externalLegendItemLimit(), printerMode);

		usedPerspectiveOptions = queryDefinition.getUsedPerspectiveOptions();
		groupCount = usedPerspectiveOptions.size() + (queryDefinition.hasFlag(QueryFlag.TOTAL) ? 1 : 0);
		if (groupCount <= 0) {
			throw new Error("Group count = " + groupCount);
		}

		paddingBarIndex = groupCount * 2;

		createCurves(queryDefinition.getQuestionOptionTexts(), printerMode);
		setupMouseHandlers();
		setupAxes();
		
		// Ugly hack: force subclasses to run this themselves so that they are properly initzialized first
		if (this.getClass().equals(MeanChart.class)) {
			if (query.hasResult()) {
				addData();
			} else {
				query.requestResult(new QueryCallback() {
					@Override
					public void callback() {
						addData();
					}
				});
			}
		}
	}

	protected void createCurves(List<String> questionOptionTexts, boolean printerMode) {
		barListPrimary = new LinkedList<MeanChartBarPrimary>();
		for (int perspective : queryDefinition.getUsedPerspectiveOptions()) {
			addCurve();
			Curve barCurve = getCurve();
			addCurve();
			Curve lineCurve = getCurve();
			addPrimaryBar(new MeanChartBarPrimary(chartTexts, barCurve, lineCurve, getColorSet(perspective), printerMode));
		}
		if (queryDefinition.hasFlag(QueryFlag.TOTAL)) {
			addCurve();
			Curve barCurve = getCurve();
			addCurve();
			Curve lineCurve = getCurve();
			addPrimaryBar(new MeanChartBarPrimary(chartTexts, barCurve, lineCurve, getColorSet(queryDefinition.getPerspectiveOptionCount()), printerMode));
		}
		addPaddingCurve();
	}

	protected void addPaddingCurve() {
		addCurve();
		Symbol symbol = getCurve().getSymbol();
		symbol.setBorderWidth(0);
		symbol.setSymbolType(SymbolType.VBAR_SOUTHWEST);
		symbol.setHoverAnnotationEnabled(false);
		symbol.setModelWidth(0);
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
	 * May not be called from constructor if the implementing class is a subclass,
	 * as some variables may not have been initialized. This is an ugly hack.
	 */
	protected void addData() {
		QueryResultMean queryResult = (QueryResultMean) query.getResult(false, true);
		List<String> perspectiveOptionTexts = queryDefinition.getPerspectiveOptionTexts();
		currentPosition = 1 + groupSpacing / 2;
		currentGroup = 0;
		for (int perspectiveOption : usedPerspectiveOptions) {
			if (queryResult.hasData(perspectiveOption)) {
				drawBarGroup(perspectiveOptionTexts.get(perspectiveOption), queryResult.getMean(perspectiveOption), queryResult.getStandardDeviation(perspectiveOption), queryResult.getPopulation(perspectiveOption));
			} else {
				drawMissingBarGroup(perspectiveOptionTexts.get(perspectiveOption));
			}
			currentPosition += 1 + groupSpacing;
			currentGroup++;
		}
		if (queryDefinition.hasFlag(QueryFlag.TOTAL)) {
			String totalText = chartTexts.compareWithAll();
			if (queryResult.hasTotalDataItemData()) {
				drawBarGroup(totalText, queryResult.getTotalMean(), queryResult.getTotalStandardDeviation(), queryResult.getTotalPopulation());
			} else {
				drawMissingBarGroup(totalText);
			}
			currentPosition += 1 + groupSpacing;
			currentGroup++;
		}
		currentPosition -= (1 + groupSpacing / 2);

		drawPaddingBar();
		setReady();
	}

	private void drawBarGroup(String groupName, double mean, double deviation, int population) {
		MeanChartBarPrimary bar = getBarPrimary(currentGroup);

		bar.setDataPoint(currentPosition, mean, deviation, queryDefinition.getQuestionOptionCount());
		bar.setHoverTextStandard(mean, deviation);

		// TODO calculate offset from widgets?
		xTickMaxCharacterCount = Math.max(xTickMaxCharacterCount, groupName.length());

		String tickText = chartTexts.standardTick(groupName, population);
		getXAxis().addTick(currentPosition - 0.5, tickText);
	}

	private void drawMissingBarGroup(String groupName) {
		String tickText = chartTexts.missingTick(groupName, chartConfig.respondentCountCutoff());
		getXAxis().addTick(currentPosition - 0.5, tickText);

	}

	protected void drawPaddingBar() {
		getCurve(paddingBarIndex).addPoint(currentPosition, 0);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void updateHoverPositions() {
		ChartBar bar = getBarPrimary(groupCount - 1);
		Symbol symbol = bar.getCurve().getSymbol();
		symbol.setHoverLocation(AnnotationLocation.SOUTHWEST);
		symbol.setHoverXShift((int) (getModelUnitInPixelsX() + 10));
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getMinWidth() {
		return (int) (10 + yTickWidth + xTickMaxCharacterCount * groupCount * 7.5);
	}

}

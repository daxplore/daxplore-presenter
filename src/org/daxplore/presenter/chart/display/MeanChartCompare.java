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
import org.daxplore.presenter.chart.data.QueryResultMeanCompare;
import org.daxplore.presenter.chart.resources.ChartConfig;
import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

/**
 * A chart type for displaying means with standard deviations, comparing two
 * separate datasets that have the same question and perspectives.
 */
public class MeanChartCompare extends MeanChart {

	/**
	 * How far the secondary bar is shifted to the right, relative to it's
	 * primary bar.
	 * 
	 * <p>Meassured in GChart's internal distance system.</p>
	 */
	private final static double secondaryBarShift = 0.65;

	/**
	 * A list of all the secondary bars.
	 */
	private LinkedList<MeanChartBarSecondary> barListSecondary;

	/**
	 * Keeps track of how wide each group is going to be.
	 * 
	 * <p>The value is computed in the constructor. Meassured in GChart's
	 * internal distance system.</p>
	 */
	private final double groupWidth;

	/**
	 * Keeps track of the distance between the midpoint of each group.
	 * 
	 * <p>The value is computed in the constructor. Meassured in GChart's
	 * internal distance system.</p>
	 */
	private final double groupDistance;

	protected MeanChartCompare(ChartTexts chartTexts, ChartConfig chartConfig, QueryInterface query, boolean printerMode) {
		super(chartTexts, chartConfig, query, printerMode);

		xTickMaxCharacterCount = 19;

		// Twice the number of bars, compared to the basic mean chart.
		paddingBarIndex *= 2;

		groupWidth = 1 + secondaryBarShift;

		groupDistance = groupWidth + groupSpacing;
		addStyleDependentName("compare");
		if (ChartTools.ieVersion() > 0) {
			addStyleDependentName("compare-IE");
		}

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

	@Override
	protected void createCurves(List<String> questionOptionTexts, boolean printerMode) {
		barListPrimary = new LinkedList<MeanChartBarPrimary>();
		barListSecondary = new LinkedList<MeanChartBarSecondary>();
		for (int perspective : queryDefinition.getUsedPerspectiveOptions()) {
			addCurve();
			Curve secondaryBarCurve = getCurve();
			addCurve();
			Curve secondaryLineCurve = getCurve();
			addCurve();
			Curve primaryBarCurve = getCurve();
			addCurve();
			Curve primaryLineCurve = getCurve();

			addPrimaryBar(new MeanChartBarPrimary(chartTexts, primaryBarCurve, primaryLineCurve, getColorSet(perspective), printerMode));

			addSecondaryBar(new MeanChartBarSecondary(chartTexts, secondaryBarCurve, secondaryLineCurve, getColorSet(perspective), printerMode));
		}
		if (queryDefinition.hasFlag(QueryFlag.TOTAL)) {
			addCurve();
			Curve secondaryBarCurve = getCurve();
			addCurve();
			Curve secondaryLineCurve = getCurve();
			addCurve();
			Curve primaryBarCurve = getCurve();
			addCurve();
			Curve primaryLineCurve = getCurve();

			addPrimaryBar(new MeanChartBarPrimary(chartTexts, primaryBarCurve, primaryLineCurve, getColorSet(queryDefinition.getPerspectiveOptionCount()), printerMode));

			addSecondaryBar(new MeanChartBarSecondary(chartTexts, secondaryBarCurve, secondaryLineCurve, getColorSet(queryDefinition.getPerspectiveOptionCount()), printerMode));
		}
		addPaddingCurve();
	}

	/**
	 * When a new secondary bar is created, add it here.
	 * 
	 * <p>It is important to add the curves in left-to-right order. By keeping
	 * track of the index of the bar, we can find it when we want to add data to
	 * the curve of a specific index. It also makes it possible to find the bar
	 * that belongs to a curve that is being hovered.</p>
	 * 
	 * @param bar
	 *            The bar to be stored in the chart
	 */
	protected void addSecondaryBar(MeanChartBarSecondary bar) {
		barListSecondary.add(bar);
	}

	/**
	 * Get the secondary bar at a specific position in the chart.
	 * 
	 * <p>The bars are ordered from left to right. Each index will have one
	 * primary bar and one secondary bar.</p>
	 * 
	 * @param index
	 *            The position of the bar in the chart.
	 * @return The primary bar at the given position.
	 * 
	 * @see getBarSecondary
	 */
	protected MeanChartBarSecondary getBarSecondary(int index) {
		return barListSecondary.get(index);
	}

	@Override
	protected ChartBar getBar(Curve curve) {
		for (ChartBar column : barListPrimary) {
			if (column.getCurve() == curve) {
				return column;
			}
		}
		for (ChartBar column : barListSecondary) {
			if (column.getCurve() == curve) {
				return column;
			}
		}
		return null;
	}

	@Override
	protected void addData() {
		QueryResultMeanCompare queryResult = (QueryResultMeanCompare) query.getResult(true, true);
		List<String> perspectiveOptionTexts = queryDefinition.getPerspectiveOptionTexts();
		currentPosition = 1 + groupSpacing / 2;
		currentGroup = 0;
		for (int perspectiveOption : usedPerspectiveOptions) {
			if (queryResult.hasData(perspectiveOption)) {
				drawBarGroup(perspectiveOptionTexts.get(perspectiveOption), queryResult.getMean(perspectiveOption), queryResult.getStandardDeviation(perspectiveOption), queryResult.getPopulation(perspectiveOption), queryResult.getMeanSecondary(perspectiveOption), queryResult.getStandardDeviationSecondary(perspectiveOption), queryResult.getPopulationSecondary(perspectiveOption));
			} else {
				drawMissingBarGroup(perspectiveOptionTexts.get(perspectiveOption));
			}
			currentPosition += groupDistance;
			currentGroup++;
		}
		if (queryDefinition.hasFlag(QueryFlag.TOTAL)) {
			String totalText = chartTexts.compareWithAll();
			if (queryResult.hasTotalDataItemData()) {
				drawBarGroup(totalText, queryResult.getTotalMean(), queryResult.getTotalStandardDeviation(), queryResult.getTotalPopulation(), queryResult.getTotalMeanSecondary(), queryResult.getTotalStandardDeviationSecondary(), queryResult.getTotalPopulationSecondary());
			} else {
				drawMissingBarGroup(totalText);
			}
			currentPosition += groupDistance;
			currentGroup++;
		}
		currentPosition -= (1 + groupSpacing / 2);

		drawPaddingBar();
		setReady();
	}

	private void drawBarGroup(String groupName, double primaryMean, double primaryDeviation, int primaryPopulation, double secondaryMean, double secondaryDeviation, int secondaryPopulation) {

		MeanChartBarPrimary primaryBar = getBarPrimary(currentGroup);
		primaryBar.setDataPoint(currentPosition, primaryMean, primaryDeviation, queryDefinition.getQuestionOptionCount());
		primaryBar.setHoverTextComparative(primaryMean, primaryDeviation);

		if (secondaryPopulation > 0) {
			MeanChartBarSecondary secondaryBar = getBarSecondary(currentGroup);
			secondaryBar.setDataPoint(currentPosition + secondaryBarShift, secondaryMean, secondaryDeviation, queryDefinition.getQuestionOptionCount());

			secondaryBar.setHoverTextComparative(secondaryMean, secondaryDeviation);
		}

		// TODO calculate offset from widgets?
		xTickMaxCharacterCount = Math.max(xTickMaxCharacterCount, groupName.length());

		String tickText;
		if (secondaryPopulation > 0) {
			tickText = chartTexts.compareTick(groupName, primaryPopulation, secondaryPopulation);
		} else {
			tickText = chartTexts.compareMissingSecondaryTick(groupName, primaryPopulation, chartConfig.respondentCountCutoff());
			xTickMaxCharacterCount = Math.max(xTickMaxCharacterCount, 23);
		}

		getXAxis().addTick(currentPosition + groupWidth / 2 - 1, tickText);
	}

	private void drawMissingBarGroup(String groupName) {
		String tickText = chartTexts.compareMissingTick(groupName, chartConfig.respondentCountCutoff());
		getXAxis().addTick(currentPosition + groupWidth / 2 - 1, tickText);

	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void setChartSizeSmart(int width, int height) {
		setChartSize(width, height);
		setChartSize(Math.max(2 * width - getXChartSizeDecorated() - 5, 0), Math.max(2 * height - getYChartSizeDecorated() - 15, 0));
		update();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void updateHoverPositions() {
		super.updateHoverPositions();
		ChartBar bar = getBarSecondary(groupCount - 1);
		Symbol symbol = bar.getCurve().getSymbol();
		symbol.setHoverLocation(AnnotationLocation.SOUTHWEST);
		symbol.setHoverXShift((int) (getModelUnitInPixelsX() + 10));
	}

}

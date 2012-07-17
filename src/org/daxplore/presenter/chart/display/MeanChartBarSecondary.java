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

import org.daxplore.presenter.chart.ChartTools;
import org.daxplore.presenter.chart.resources.ChartTexts;

import com.googlecode.gchart.client.GChart.Curve;
import com.googlecode.gchart.client.GChart.Symbol;

/**
 * A class for creating a secondary bar in a mean chart.
 * 
 * <p>Instead of using Gchart's built in bars, this class is used. This allows
 * the chart to draw overlapping bars and add extra details, such as the
 * standard deviation. Each bar should be mapped against a GChart curve, and
 * each curve should (at most) have one bar.</p>
 * 
 * <p>Use secondary bar to draw the background bars in a comparative mean
 * charts.</p>
 * 
 * @see ChartBar
 * @see MeanChartBarPrimary
 */
class MeanChartBarSecondary extends MeanChartBarPrimary {

	/**
	 * Create a new secondary mean bar.
	 * 
	 * <p>Each bar should be mapped against a GChart curve, and each curve
	 * should (at most) have one bar.</p>
	 * 
	 * @param barCurve
	 *            The GChart curve that this bar is mapped to.
	 * @param lineCurve
	 *            The GChart curve used to draw the standard deviation lines.
	 * @param color
	 *            The color set, used to color this bar.
	 */
	MeanChartBarSecondary(ChartTexts chartTexts, Curve barCurve, Curve lineCurve, BarColors color, boolean printerMode) {
		super(chartTexts, barCurve, lineCurve, color, printerMode);
		Symbol symbol = barCurve.getSymbol();
		symbol.setDistanceMetric(1000, 1000);

		symbol = lineCurve.getSymbol();
		symbol.setBorderColor(color.getSecondaryDeviation());
	}

	@Override
	void setHoverTextComparative(double mean, double deviation) {
		String annotation;
		String meanString = ChartTools.formatAsTwoDigits(mean);
		String deviationString = ChartTools.formatAsTwoDigits(deviation);
		annotation = chartTexts.meanChartCompareSecondaryAnnotation(meanString, deviationString);
		annotation = formatAsHoverText(annotation);
		curve.getSymbol().setHovertextTemplate(annotation);
	}

	@Override
	void hover() {
		Symbol symbol = getCurve().getSymbol();
		symbol.setBackgroundColor(getColor().getSecondaryHover());
		symbol.setImageURL("/pixel/" + color.getSecondaryHover().substring(1) + ".png");
	}

	@Override
	void unhover() {
		Symbol symbol = getCurve().getSymbol();
		symbol.setBackgroundColor(getColor().getSecondary());
		symbol.setImageURL("/pixel/" + color.getSecondary().substring(1) + ".png");
	}
}

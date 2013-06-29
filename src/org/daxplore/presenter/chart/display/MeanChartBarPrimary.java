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

import com.googlecode.gchart.client.GChart.AnnotationLocation;
import com.googlecode.gchart.client.GChart.Curve;
import com.googlecode.gchart.client.GChart.Symbol;
import com.googlecode.gchart.client.GChart.SymbolType;

/**
 * A class for creating a primary bar in a mean chart.
 * 
 * <p>Instead of using Gchart's built in bars, this class is used. This allows
 * the chart to draw overlapping bars and add extra details, such as the
 * standard deviation. Each bar should be mapped against a GChart curve, and
 * each curve should (at most) have one bar.</p>
 * 
 * <p>Use primary bars to draw the columns in standard mean charts or the
 * front-most columns in comparative mean charts.</p>
 * 
 * @see ChartBar
 * @see MeanChartBarSecondary
 */
class MeanChartBarPrimary extends ChartBar {
	/**
	 * The GChart curve used to draw the standard deviation lines.
	 */
	private Curve lineCurve;

	/**
	 * Create a new primary mean bar.
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
	MeanChartBarPrimary(ChartTexts chartTexts, Curve barCurve, Curve lineCurve, BarColors color, boolean printerMode, AnnotationLocation hoverLocation) {
		super(chartTexts, barCurve, color, printerMode, hoverLocation);

		Symbol symbol = barCurve.getSymbol();
		symbol.setDistanceMetric(0, 0);

		unhover();

		/* setup the line curve */
		this.lineCurve = lineCurve;
		symbol = lineCurve.getSymbol();
		symbol.setSymbolType(SymbolType.LINE);
		symbol.setHoverAnnotationEnabled(false);
		symbol.setHoverSelectionEnabled(false);
		symbol.setModelWidth(0);
		symbol.setFillThickness(2);

		symbol.setDistanceMetric(100, 100);
		symbol.setBorderColor(color.getPrimaryDeviation());
	}

	/**
	 * Specify the position of the bar in the GChart, and the standard deviation
	 * to be drawn.
	 * 
	 * @param x
	 *            Where to put this bar on the X-axis of the G-chart.
	 * @param y
	 *            How high to make this bar, in the GChart.
	 * @param standardDeviation
	 *            The standard deviation.
	 */
	void setDataPoint(double x, double y, double standardDeviation, double roof) {
		setDataPoint(x, y);

		if (y - standardDeviation < 1) {
			lineCurve.addPoint(x - .5, 1);
		} else {
			lineCurve.addPoint(x - .5 - .05, y - standardDeviation);
			lineCurve.addPoint(x - .5 + .05, y - standardDeviation);
			lineCurve.addPoint(x - .5, y - standardDeviation);
		}

		if (y - standardDeviation > roof) {
			lineCurve.addPoint(x - .5, roof);
		} else {
			lineCurve.addPoint(x - .5, y + standardDeviation);
			lineCurve.addPoint(x - .5 - .05, y + standardDeviation);
			lineCurve.addPoint(x - .5 + .05, y + standardDeviation);
		}
	}

	@Override
	void hover() {
		Symbol symbol = getCurve().getSymbol();
		symbol.setBackgroundColor(getColor().getPrimaryHover());
		symbol.setImageURL("/pixel/" + color.getPrimaryHover().substring(1) + ".png");
	}

	@Override
	void unhover() {
		Symbol symbol = getCurve().getSymbol();
		symbol.setBackgroundColor(getColor().getPrimary());
		symbol.setImageURL("/pixel/" + color.getPrimary().substring(1) + ".png");
	}

	void setHoverTextStandard(double mean, double deviation) {
		String annotation;
		String meanString = ChartTools.formatAsTwoDigits(mean);
		String deviationString = ChartTools.formatAsTwoDigits(deviation);
		annotation = chartTexts.meanChartAnnotation(meanString, deviationString);
		annotation = formatAsHoverText(annotation);
		curve.getSymbol().setHovertextTemplate(annotation);
	}

	void setHoverTextComparative(String timepointPrimaryText, double mean, double deviation) {
		String annotation;
		String meanString = ChartTools.formatAsTwoDigits(mean);
		String deviationString = ChartTools.formatAsTwoDigits(deviation);
		annotation = chartTexts.meanChartComparePrimaryAnnotation(timepointPrimaryText, meanString, deviationString);
		annotation = formatAsHoverText(annotation);
		curve.getSymbol().setHovertextTemplate(annotation);
	}
}

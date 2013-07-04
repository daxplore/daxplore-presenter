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

/**
 * A class for creating a primary column in a barchart.
 * 
 * <p>Instead of using Gchart's built in bars, this class is used. It allows
 * bars to overlap, but still be hovered over properly. Each bar should be
 * mapped against a GChart curve, and each curve should (at most) have one
 * bar.</p>
 * 
 * <p>Use primary bars to draw the columns in standard barcharts or the
 * front-most columns in comparative barcharts.</p>
 * 
 * @see ChartBar
 * @see BarChartBarSecondary
 */
class BarChartBarPrimary extends ChartBar {

	/**
	 * Create a new primary bar.
	 * 
	 * <p>Each bar should be mapped against a GChart curve, and each curve
	 * should (at most) have one bar.</p>
	 * 
	 * @param barCurve
	 *            The GChart curve that this bar is mapped to.
	 * @param color
	 *            The color set, used to color this bar.
	 */
	BarChartBarPrimary(ChartTexts chartTexts, Curve barCurve, BarColors color, boolean printerMode, AnnotationLocation hoverLocation) {
		super(chartTexts, barCurve, color, printerMode, hoverLocation);
		Symbol symbol = barCurve.getSymbol();
		symbol.setDistanceMetric(0, 0);

		unhover();
	}

	@Override
	void hover() {
		Symbol symbol = getCurve().getSymbol();
		symbol.setBackgroundColor(getColor().getPrimaryHover());
		if (printerMode) {
			symbol.setImageURL("/pixel/" + color.getPrimaryHover().substring(1) + ".png");
		} else {
			symbol.setImageURL("/img/daxplore-bar-blank.gif");
		}
	}

	@Override
	void unhover() {
		Symbol symbol = getCurve().getSymbol();
		symbol.setBackgroundColor(getColor().getPrimary());
		if (printerMode) {
			symbol.setImageURL("/pixel/" + color.getPrimary().substring(1) + ".png");
		} else {
			symbol.setImageURL("/img/daxplore-bar-blank.gif");
		}
	}

	void setHoverTextStandard(double percentage, String groupName) {
		String annotation;
		if (percentage == 0) {
			annotation = chartTexts.barChartNoAnswerAnnotation(groupName);
		} else {
			String numberString = ChartTools.formatAsTwoDigitsPercentage(percentage);
			annotation = chartTexts.barChartAnnotation(numberString, groupName);
		}
		annotation = formatAsHoverText(annotation);
		curve.getSymbol().setHovertextTemplate(annotation);
		annotationCharacterCount = Math.max(annotationCharacterCount, groupName.length());
	}

	void setHoverTextComparative(String timepointPrimaryText, double percentage, String groupName) {
		String annotation;
		if (percentage == 0) {
			annotation = chartTexts.barChartNoAnswerAnnotation(groupName);
		} else {
			String numberString = ChartTools.formatAsTwoDigitsPercentage(percentage);
			annotation = chartTexts.barChartComparePrimaryAnnotation(timepointPrimaryText, numberString, groupName);
		}
		annotation = formatAsHoverText(annotation);
		curve.getSymbol().setHovertextTemplate(annotation);

		annotationCharacterCount = Math.max(annotationCharacterCount, groupName.length());
	}
}

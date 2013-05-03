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
 * A class for creating a secondary bar in a barchart.
 * 
 * <p>Instead of using Gchart's built in bars, this class is used. It allowes
 * bars to overlap, but still be hovered over properly. Each bar should be
 * mapped against a GChart curve, and each curve should (at most) have one
 * bar.</p>
 * 
 * <p>Use secondary bar to draw the background bars in a comparative
 * barchart.</p>
 * 
 * @see ChartBar
 * @see BarChartBarPrimary
 */
class BarChartBarSecondary extends BarChartBarPrimary {

	/**
	 * Create a new secondary bar.
	 * 
	 * <p>Each bar should be mapped against a GChart curve, and each curve
	 * should (at most) have one bar.</p>
	 * 
	 * @param barCurve
	 *            The GChart curve that this bar is mapped to.
	 * @param color
	 *            The color set, used to color this bar.
	 */
	BarChartBarSecondary(ChartTexts chartTexts, Curve barCurve, BarColors color, boolean printerMode, AnnotationLocation hoverLocation) {
		super(chartTexts, barCurve, color, printerMode, hoverLocation);
		Symbol symbol = barCurve.getSymbol();
		symbol.setDistanceMetric(1000, 1000);
	}

	@Override
	void setHoverTextComparative(double percentage, String groupName) {
		String annotation;
		if (percentage == 0) {
			annotation = chartTexts.barChartNoAnswerAnnotation(groupName);
		} else {
			String numberString = ChartTools.formatAsTwoDigitsPercentage(percentage);
			annotation = chartTexts.barChartCompareSecondaryAnnotation(numberString, groupName);
		}
		annotation = formatAsHoverText(annotation);
		curve.getSymbol().setHovertextTemplate(annotation);

		annotationCharacterCount = Math.max(annotationCharacterCount, groupName.length());
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

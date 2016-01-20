/**
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
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
 * Used as a reference line in Mean Charts. Implemented as a bar instead of a line in order to get
 * hovering and annotations to work properly.
 */
public class MeanReferenceLineBar extends ChartBar {
	
	MeanReferenceLineBar(ChartTexts chartTexts, BarColors barColors, Curve barCurve, boolean printerMode) {
		super(chartTexts, barCurve, barColors, printerMode, AnnotationLocation.NORTH);
		Symbol symbol = barCurve.getSymbol();
		symbol.setBrushHeight(8);
		symbol.setBorderColor(getColor().getPrimary());
		symbol.setDistanceMetric(0, 0);
		symbol.setSymbolType(SymbolType.LINE);
		symbol.setBorderStyle("dashed none none none");
		symbol.setBorderWidth(-3);
		symbol.setHeight(0);

		unhover();
	}
	
	@Override
	void hover() {
		Symbol symbol = getCurve().getSymbol();
		symbol.setBorderColor(getColor().getPrimaryHover());
		if (printerMode) {
			symbol.setImageURL("/pixel/" + color.getPrimaryHover().substring(1) + ".png");
		}
	}

	@Override
	void unhover() {
		Symbol symbol = getCurve().getSymbol();
		symbol.setBorderColor(getColor().getPrimary());
		if (printerMode) {
			symbol.setImageURL("/pixel/" + color.getPrimary().substring(1) + ".png");
		}
	}
	
	@Override
	void setDataPoint(double currentPosition, double referenceValue) {
		curve.getSymbol().setModelWidth(currentPosition);
		curve.addPoint(currentPosition/2, referenceValue);
		curve.setYShift(-2);
		curve.setXShift(3);
		curve.getSymbol().setHoverYShift(10);
	}
	
	void setHoverText(double referenceValue) {
		String meanString = ChartTools.formatAsTwoDigits(referenceValue);
		String annotation = chartTexts.meanChartAnnotation(chartTexts.meanReference(), meanString);
		annotation = formatAsHoverText(annotation);
		curve.getSymbol().setHovertextTemplate(annotation);
	}
}

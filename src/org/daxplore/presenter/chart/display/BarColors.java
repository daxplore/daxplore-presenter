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

import org.daxplore.presenter.shared.Color;

/**
 * An immutable color used to color charts.
 * 
 * <p>It generates a set of colors, with the same hue but with different
 * saturation and lightness. Use it to color the different parts of a chart
 * column.</p>
 */
class BarColors {

	/**
	 * The generated CSS strings for the primary colors.
	 */
	protected final String primary, primaryHover, primaryDeviation;

	/**
	 * The generated CSS strings for the secondary colors.
	 */
	protected final String secondary, secondaryHover, secondaryDeviation;

	/**
	 * The generated CSS string used for the mouseover annotation.
	 */
	protected final String annotation;

	/**
	 * Define the default chart color set.
	 */
	protected static final BarColors[] chartColorSet = { new BarColors(95.0 / 360), new BarColors(200.0 / 360), new BarColors(240.0 / 360, 0.00, 0.03), new BarColors(270.0 / 360, 0.00, 0.03), new BarColors(5.0 / 360), new BarColors(35.0 / 360, 0.10, -0.03), new BarColors(60.0 / 360, 0.10, -0.03) };

	/**
	 * Create a new color set, based on a hue. Adjusting for saturation and
	 * lightness
	 * 
	 * @param hue
	 *            The hue of the color, in the interval: 0.0 ≤ hue ≤ 1.0.
	 * @param saturationShift
	 *            the saturation shift
	 * @param lightnessShift
	 *            the lightness shift
	 */
	public BarColors(double hue, double saturationShift, double lightnessShift) {
		double saturation = 0.38;
		double lightness = 0.64;
		primary = Color.hslToHex(hue, saturation + saturationShift, lightness + 0.00 + lightnessShift);
		primaryHover = Color.hslToHex(hue, saturation + saturationShift, lightness - 0.04 + lightnessShift);
		primaryDeviation = Color.hslToHex(hue, 0.2 + saturationShift, 0.50 + lightnessShift);

		lightness += 0.1;
		secondary = Color.hslToHex(hue, saturation + saturationShift, lightness + 0.00 + lightnessShift);
		secondaryHover = Color.hslToHex(hue, saturation + saturationShift, lightness - 0.04 + lightnessShift);
		secondaryDeviation = Color.hslToHex(hue, 0.20 + saturationShift, 0.50 + lightnessShift);

		annotation = Color.hslToHex(hue, 0.60, 0.85);
	}

	/**
	 * Instantiates a new color set, based on a hue.
	 * 
	 * @param hue
	 *            the hue
	 */
	public BarColors(double hue) {
		this(hue, 0, 0);
	}

	/**
	 * The primary color for a chart column.
	 * 
	 * <p>Use it to color the most visible part of the column.</p>
	 * 
	 * @return A CSS encoding of the primary color.
	 */
	public String getPrimary() {
		return primary;
	}

	/**
	 * The primary hover for a chart column.
	 * 
	 * <p>Use it to color the most visible part of the column, when it has focus
	 * (is hovered).</p>
	 * 
	 * @return A CSS encoding of the primary hover color.
	 */
	public String getPrimaryHover() {
		return primaryHover;
	}

	/**
	 * Get a color used for details in relation to the primary color.
	 * 
	 * @return the primary deviation color
	 */
	public String getPrimaryDeviation() {
		return primaryDeviation;
	}

	/**
	 * The secondary color for a chart column.
	 * 
	 * <p>Use it to color the second most visible part of the column.</p>
	 * 
	 * @return A CSS encoding of the secondary color.
	 */
	public String getSecondary() {
		return secondary;
	}

	/**
	 * The secondary hover color for a chart column.
	 * 
	 * <p>Use it to color the second most visible part of the column, when it
	 * has focus (is hovered).</p>
	 * 
	 * @return A CSS encoding of the secondary hover color.
	 */
	public String getSecondaryHover() {
		return secondaryHover;
	}

	/**
	 * Get a color used for details in relation to the primary color.
	 * 
	 * @return the secondary deviation color
	 */
	public String getSecondaryDeviation() {
		return secondaryDeviation;
	}

	/**
	 * Gets a color used for mouseover annotations.
	 * 
	 * @return the annotation
	 */
	public String getAnnotation() {
		return annotation;
	}

	/**
	 * Gets the chart color set.
	 * 
	 * @param index
	 *            the color index
	 * @return the chart color set
	 */
	public static BarColors getChartColorSet(int index) {
		return chartColorSet[index % chartColorSet.length];
	}
}

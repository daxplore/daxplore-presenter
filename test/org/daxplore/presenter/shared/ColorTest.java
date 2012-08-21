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
package org.daxplore.presenter.shared;

import static org.junit.Assert.*;

import org.daxplore.presenter.shared.Color.Model;
import org.junit.Test;

public class ColorTest {
	
	
	private static final int R=0, G=1, B=2, H=3, V=4, L=5, HSV_S=6, HSL_S=7;
	
	// Example values taken from http://en.wikipedia.org/wiki/HSL_color_space#Examples
	private static final double[][] values = {
	//	{r				g				b				h		v		l		hsv_s	hsl_s}
		{255 * 1.000,	255 * 1.000,	255 * 1.000,	0,		1.000,	1.000,	0.000,	0.000},
		{255 * 0.500,	255 * 0.500,	255 * 0.500,	0,		0.500,	0.500,	0.000,	0.000},
		{255 * 0.000,	255 * 0.000,	255 * 0.000,	0,		0.000,	0.000,	0.000,	0.000},
		{255 * 1.000,	255 * 0.000,	255 * 0.000,	0.0,	1.000,	0.500,	1.000,	1.000},
		{255 * 0.750,	255 * 0.750,	255 * 0.000,	60.0,	0.750,	0.375,	1.000,	1.000},
		{255 * 0.000,	255 * 0.500,	255 * 0.000,	120.0,	0.500,	0.250,	1.000,	1.000},
		{255 * 0.500,	255 * 1.000,	255 * 1.000,	180.0,	1.000,	0.750,	0.500,	1.000},
		{255 * 0.500,	255 * 0.500,	255 * 1.000,	240.0,	1.000,	0.750,	0.500,	1.000},
		{255 * 0.750,	255 * 0.250,	255 * 0.750,	300.0,	0.750,	0.500,	0.667,	0.500},
		{255 * 0.628,	255 * 0.643,	255 * 0.142,	61.8,	0.643,	0.393,	0.779,	0.638},
		{255 * 0.255,	255 * 0.104,	255 * 0.918,	251.1,	0.918,	0.511,	0.887,	0.832},
		{255 * 0.116,	255 * 0.675,	255 * 0.255,	134.9,	0.675,	0.396,	0.828,	0.707},
		{255 * 0.941,	255 * 0.785,	255 * 0.053,	49.5,	0.941,	0.497,	0.944,	0.893},
		{255 * 0.704,	255 * 0.187,	255 * 0.897,	283.7,	0.897,	0.542,	0.792,	0.775},
		{255 * 0.931,	255 * 0.463,	255 * 0.316,	14.3,	0.931,	0.624,	0.661,	0.817},
		{255 * 0.998,	255 * 0.974,	255 * 0.532,	56.9,	0.998,	0.765,	0.467,	0.991},
		{255 * 0.099,	255 * 0.795,	255 * 0.591,	162.4,	0.795,	0.447,	0.875,	0.779},
		{255 * 0.211,	255 * 0.149,	255 * 0.597,	248.3,	0.597,	0.373,	0.750,	0.601},
		{255 * 0.495,	255 * 0.493,	255 * 0.721,	240.5,	0.721,	0.607,	0.316,	0.290}};

	@Test
	public void testRGBtoHex() {
		Color color = new Color(0, 0, 0);
		assertEquals("#000000", color.getHexValue());
		
		color = new Color(255, 255, 255);
		assertEquals("#FFFFFF", color.getHexValue());

		color = new Color(1, 2, 3);
		assertEquals("#010203", color.getHexValue());
	}
	
	@Test
	public void testRgbToHsl() {
		for (int line = 0; line<values.length; line++) {
			double[] v = values[line];
			Color color = new Color(v[R], v[G], v[B]);
			
			assertEquals(v[H],		color.getHSLHue(),			0.5);
			assertEquals(v[HSL_S], 	color.getHSLSaturation(),	0.005);
			assertEquals(v[L], 		color.getHSLLightness(),	0.005);
		}
	}
	

	@Test
	public void testHslToRgb() {
		for (int line = 0; line<values.length; line++) {
			double[] v = values[line];
			Color color = new Color(v[H], v[HSL_S], v[L], Model.HSL);
			
			assertEquals(v[R],	color.getRed(),		0.5);
			assertEquals(v[G], 	color.getGreen(),	0.5);
			assertEquals(v[B], 	color.getBlue(),	0.5);
		}
	}
	
	@Test
	public void testRgbToHsv() {
		for (int line = 0; line<values.length; line++) {
			double[] v = values[line];
			Color color = new Color(v[R], v[G], v[B]);
			
			assertEquals(v[H],		color.getHSVHue(),			0.5);
			assertEquals(v[HSV_S], 	color.getHSVSaturation(),	0.005);
			assertEquals(v[V], 		color.getHSVValue(),		0.005);
		}
	}
	
	@Test
	public void testHsvToRgb() {
		for (int line = 0; line<values.length; line++) {
			double[] v = values[line];
			Color color = new Color(v[H], v[HSV_S], v[V], Model.HSV);
			
			assertEquals(v[R],	color.getRed(),		0.5);
			assertEquals(v[G], 	color.getGreen(),	0.5);
			assertEquals(v[B], 	color.getBlue(),	0.5);
		}
	}
	
}

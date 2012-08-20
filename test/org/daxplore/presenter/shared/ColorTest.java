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

import org.junit.Test;

public class ColorTest {
	
	
	private static final int R=0, G=1, B=2, H=3, V=4, L=5, HSV_S=6, HSL_S=7;
	
	// Example values taken from http://en.wikipedia.org/wiki/HSL_color_space#Examples
	private static final double[][] values = {
	//	{r		g		b		h		v		l		hsv_s	hsl_s}
		{1.000,	1.000,	1.000,	0,		1.000,	1.000,	0.000,	0.000},
		{0.500,	0.500,	0.500,	0,		0.500,	0.500,	0.000,	0.000},
		{0.000,	0.000,	0.000,	0,		0.000,	0.000,	0.000,	0.000},
		{1.000,	0.000,	0.000,	0.0,	1.000,	0.500,	1.000,	1.000},
		{0.750,	0.750,	0.000,	60.0,	0.750,	0.375,	1.000,	1.000},
		{0.000,	0.500,	0.000,	120.0,	0.500,	0.250,	1.000,	1.000},
		{0.500,	1.000,	1.000,	180.0,	1.000,	0.750,	0.500,	1.000},
		{0.500,	0.500,	1.000,	240.0,	1.000,	0.750,	0.500,	1.000},
		{0.750,	0.250,	0.750,	300.0,	0.750,	0.500,	0.667,	0.500},
		{0.628,	0.643,	0.142,	61.8,	0.643,	0.393,	0.779,	0.638},
		{0.255,	0.104,	0.918,	251.1,	0.918,	0.511,	0.887,	0.832},
		{0.116,	0.675,	0.255,	134.9,	0.675,	0.396,	0.828,	0.707},
		{0.941,	0.785,	0.053,	49.5,	0.941,	0.497,	0.944,	0.893},
		{0.704,	0.187,	0.897,	283.7,	0.897,	0.542,	0.792,	0.775},
		{0.931,	0.463,	0.316,	14.3,	0.931,	0.624,	0.661,	0.817},
		{0.998,	0.974,	0.532,	56.9,	0.998,	0.765,	0.467,	0.991},
		{0.099,	0.795,	0.591,	162.4,	0.795,	0.447,	0.875,	0.779},
		{0.211,	0.149,	0.597,	248.3,	0.597,	0.373,	0.750,	0.601},
		{0.495,	0.493,	0.721,	240.5,	0.721,	0.607,	0.316,	0.290}};

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
			int r = (int)(255*v[R] + 0.5);
			int g = (int)(255*v[G] + 0.5);
			int b = (int)(255*v[B] + 0.5);
			double[] hsl = Color.rgbToHsl(r, g, b);

			assertEquals(v[H],		hsl[0], 0.5);
			assertEquals(v[HSL_S], 	hsl[1], 0.01);
			assertEquals(v[L], 		hsl[2], 0.01);
		}
	}

	@Test
	public void testRgbToHsv() {
		for (int line = 0; line<values.length; line++) {
			double[] v = values[line];
			int r = (int)(255*v[R] + 0.5);
			int g = (int)(255*v[G] + 0.5);
			int b = (int)(255*v[B] + 0.5);
			double[] hsv = Color.rgbToHsv(r, g, b);
			
			assertEquals(v[H], 		hsv[0], 0.5);
			assertEquals(v[HSV_S],	hsv[1], 0.01);
			assertEquals(v[V],		hsv[2], 0.01);
		}
	}
	

	@Test
	public void testHslToRgb() {
		for (int line = 0; line<values.length; line++) {
			double[] v = values[line];
			double[] rgb = Color.hslToRgb(v[H], v[HSL_S], v[L]);

			assertEquals(v[R]*255, rgb[0], 0.5);
			assertEquals(v[G]*255, rgb[1], 0.5);
			assertEquals(v[B]*255, rgb[2], 0.5);
		}
	}
	
	@Test
	public void testHsvToRgb() {
		for (int line = 0; line<values.length; line++) {
			double[] v = values[line];
			double[] rgb = Color.hsvToRgb(v[H], v[HSV_S], v[V]);
			
			assertEquals(v[R]*255, rgb[0], 0.5);
			assertEquals(v[G]*255, rgb[1], 0.5);
			assertEquals(v[B]*255, rgb[2], 0.5);
		}
	}
}

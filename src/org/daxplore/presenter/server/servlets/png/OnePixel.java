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
package org.daxplore.presenter.server.servlets.png;

public class OnePixel implements PixelSource {
	private int size = 1;
	private int intcolor;
	private int intalpha = 0x00;
	boolean hasalpha = false;

	public OnePixel(String color) {
		intcolor = Integer.parseInt(color, 16);
	}

	public OnePixel(String color, String alpha) {
		hasalpha = true;
		intcolor = Integer.parseInt(color, 16);
		intalpha = Integer.parseInt(alpha, 16);
	}

	@Override
	public int getWidth() {
		return size;
	}

	@Override
	public int getHeight() {
		return size;
	}

	@Override
	public int getPixel(int x, int y) {
		if (hasalpha) {
			return (intcolor << 8) | (intalpha & 0xFF);
		} else {
			return intcolor;
		}

	}

}
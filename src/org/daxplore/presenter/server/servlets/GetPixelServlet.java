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
package org.daxplore.presenter.server.servlets;

import java.io.OutputStream;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.servlets.png.OnePixel;
import org.daxplore.presenter.server.servlets.png.PngWriter;


/**
 * A servlet that supplies 1x1 px images in colors, based on file name.
 * 
 * <p>New pixel-sized images are generated on the fly. Request an image using
 * the format <hexvalue>.png, for example FF0000.png for a completely red
 * pixel.</p>
 */
public class GetPixelServlet extends HttpServlet {

	private static final long serialVersionUID = -392753539863251554L;
	private final int CACHE_DURATION_IN_SECOND = 60 * 60 * 24 * 14; // 14 days
	private final long CACHE_DURATION_IN_MS = CACHE_DURATION_IN_SECOND * 1000;

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, java.io.IOException {

		boolean hasalpha = false;

		String uri = req.getRequestURI().substring(7); // "/pixel/".length
		// ([0-9a-fA-F]{6})((?:[0-9a-fA-F]{2})?)[.](png|gif|jpg|jpeg) with alpha
		// ([0-9a-fA-F]{6})[.](png|gif|jpg|jpeg) without alpha
		Pattern p = Pattern.compile("([0-9a-fA-F]{6})((?:[0-9a-fA-F]{2})?)[.](png)");

		String color = "000000";
		String alpha = "00";
		Matcher m = p.matcher(uri);
		if (m.matches()) {
			// System.out.println("color: " + m.group(1));
			color = m.group(1);
			if (!m.group(2).equals("")) {
				alpha = m.group(2);
				hasalpha = true;
				// System.out.println("alpha: " + m.group(2));
			}
			// System.out.println("filetype: " + m.group(3));
		}

		resp.setContentType("image/png");

		long now = System.currentTimeMillis();
		resp.addHeader("Cache-Control", "max-age=" + CACHE_DURATION_IN_SECOND);
		Date created = new Date(1000 * 1306274400L); // Wed May 25 00:00:00 CEST 2011 as Unix Epoch in millis
		resp.setDateHeader("Last-Modified", created.getTime());
		resp.setDateHeader("Expires", now + CACHE_DURATION_IN_MS);
		OnePixel pixel;
		if (hasalpha) {
			pixel = new OnePixel(color, alpha);
		} else {
			pixel = new OnePixel(color);
		}
		PngWriter pngw = new PngWriter(hasalpha);
		byte[] bytes = pngw.generateImage(pixel);

		OutputStream respWriter = resp.getOutputStream();
		respWriter.write(bytes);
	}
}

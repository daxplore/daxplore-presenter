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

import java.io.IOException;
import java.io.OutputStream;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.servlets.png.OnePixel;
import org.daxplore.presenter.server.servlets.png.PngWriter;
import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.server.throwable.InternalServerException;


/**
 * A servlet that supplies 1x1 px images in colors, based on file name.
 * 
 * <p>New pixel-sized images are generated on the fly. Request an image using
 * the format <hexvalue>.png, for example FF0000.png for a completely red
 * pixel.</p>
 */
@SuppressWarnings("serial")
public class GetPixelServlet extends HttpServlet {
	private static Logger logger = Logger.getLogger(GetPixelServlet.class.getName());
	
	private final int CACHE_DURATION_IN_SECOND = 60 * 60 * 24 * 14; // 14 days
	private final long CACHE_DURATION_IN_MS = CACHE_DURATION_IN_SECOND * 1000;

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		try {
			boolean hasalpha = false;
	
			String uri = request.getRequestURI().substring(7); // "/pixel/".length
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
			} else {
				throw new BadRequestException("Bad pixel request");
			}
	
			response.setContentType("image/png");
	
			long now = System.currentTimeMillis();
			response.addHeader("Cache-Control", "max-age=" + CACHE_DURATION_IN_SECOND);
			Date created = new Date(1000 * 1306274400L); // Wed May 25 00:00:00 CEST 2011 as Unix Epoch in millis
			response.setDateHeader("Last-Modified", created.getTime());
			response.setDateHeader("Expires", now + CACHE_DURATION_IN_MS);
			OnePixel pixel;
			if (hasalpha) {
				pixel = new OnePixel(color, alpha);
			} else {
				pixel = new OnePixel(color);
			}
			PngWriter pngw = new PngWriter(hasalpha);
			
			try (OutputStream respWriter = response.getOutputStream()){
				byte[] bytes = pngw.generateImage(pixel);
				respWriter.write(bytes);
			} catch (IOException e) {
				throw new InternalServerException("Failed to generate a pixel", e);
			}
		} catch (BadRequestException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} catch (InternalServerException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} catch (Exception e) {
			logger.log(Level.SEVERE, "Unexpected exception: " + e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		}
	}
}

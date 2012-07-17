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
package org.daxplore.presenter.server;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletContext;
import javax.servlet.http.Cookie;

import org.daxplore.presenter.server.throwable.ResourceReaderException;

/**
 * Static helper methods used on the server.
 */
public class ServerTools {
	
	/**
	 * Get the user's Internet Explorer version.
	 * 
	 * <p>Returns -1 if the current browser isn't IE.</p>
	 * 
	 * @return the IE version, or -1 for other browsers
	 */
	public static double getInternetExplorerVersion(String useragent) {
		double rv = -1.0; // Return value assumes failure.
		if (useragent != null) {
			Pattern re = Pattern.compile("MSIE ([1-9]{1,}[.0-9]{0,})");
			Matcher ma = re.matcher(useragent);
			if (ma.find()) {
				rv = Double.parseDouble(ma.group(1));
			}
		}
		return rv;
	}

	/**
	 * Ignore bad browser.
	 * 
	 * @param cookies
	 *            the cookies
	 * @return true, if successful
	 */
	public static boolean ignoreBadBrowser(Cookie[] cookies) {
		for (Cookie c : cookies) {
			if (c.getName().equals("bad-browser")) {
				if (c.getValue().equals("ignore")) {
					return true;
				}
			}
		}
		return false;
	}
	
	/**
	 * Get the resource reader.
	 * 
	 * @param servletContext
	 *            the servlet context
	 * @param baseName
	 *            the base name
	 * @param locale
	 *            the locale
	 * @param suffix
	 *            the suffix
	 * @return the resource reader
	 * @throws ResourceReaderException
	 *             the resource reader exception
	 */
	public static BufferedReader getResourceReader(ServletContext servletContext, String baseName, Locale locale, String suffix)
			throws ResourceReaderException {
		String location = "/definitions/";
		String localeString = "";
		if (locale!=null && !locale.equals(Locale.ROOT) && locale.getLanguage()!="") {
			localeString = "_" + locale.getLanguage();
		}
		String resource = location + baseName + localeString + suffix;
		InputStream stream = servletContext.getResourceAsStream(resource);
		if (stream==null) {
			throw new ResourceReaderException("Unable to locate resource: " + resource);
		}
		try {
			return new BufferedReader(new InputStreamReader(stream, "UTF8"));
		} catch (UnsupportedEncodingException e) {
			throw new ResourceReaderException(e);
		}
	}
}

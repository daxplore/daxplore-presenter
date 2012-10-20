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
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipInputStream;

import javax.servlet.http.Cookie;

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
	 * Check if the user has set a cookie to allow viewing the site
	 * despite of a bad (i.e. Internet Explorer) browser.
	 * 
	 * @param cookies
	 *            the server request cookies
	 * @return true, if site access should be allowed
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
	
	public static boolean isSupportedUploadFileVersion(int major, int minor) {
		//TODO test if file version is supported
		return true;
	}

	public static boolean isSupportedLanguage(String language) {
		// TODO Auto-generated method stub
		return true;
	}
	
	/**
	 * Returns the data interpreted as a {@link ZipInputStream}.
	 * 
	 * <p>Closing this stream has no effect, as it is backed by a
	 * {@link ByteArrayInputStream}.</p>
	 * 
	 * @return A zip input stream of the data
	 */
	public static ZipInputStream getAsZipInputStream(byte[] data) {
		return new ZipInputStream(new ByteArrayInputStream(data));
	}
	
	/**
	 * Return the data interpreted as an UTF-8 encoded buffered reader.
	 * 
	 * <p>Closing this reader has no effect, as it is backed by a
	 * {@link ByteArrayInputStream}.</p>
	 * 
	 * @return A buffered reader of the data
	 */
	public static BufferedReader getAsBufferedReader(byte[] data) {
		try {
			return new BufferedReader(new InputStreamReader(new ByteArrayInputStream(data), "UTF-8"));
		} catch (UnsupportedEncodingException e) {
			throw new RuntimeException(e); //UTF-8 should never be unsupported
		}
	}
}

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
import java.util.Enumeration;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipInputStream;

import javax.jdo.PersistenceManager;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

import org.daxplore.presenter.server.storage.LocaleStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.throwable.InternalServerException;

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
	
	/**
	 * Check if an upload file is of a version that is supported by the 
	 * underlying Daxplore system.
	 * 
	 * <p>This is used to verify that the upload file, that has been uploaded
	 * by an administrator, is of a supported version.</p>
	 * 
	 * @param major	The upload file major version
	 * @param minor The upload file minor version
	 * @return true, if the file version is supported
	 */
	public static boolean isSupportedUploadFileVersion(int major, int minor) {
		//TODO test if file version is supported
		return true;
	}

	/**
	 * Check if a locale is supported by the underlying Daxplore system.
	 * 
	 * <p>This is <i>not</i> the same as a prefix being supported for a specific
	 * prefix. This method should only be used to verify that an upload-file
	 * uploaded by an administrator uses supported locales.</p>
	 * 
	 * @param locale the locale to check if it is supported
	 * @return true, if the locale is supported
	 */
	public static boolean isSupportedLocale(Locale locale) {
		String languageTag = locale.toLanguageTag();
		Locale en = new Locale("en");
		Locale sv = new Locale("sv");
		return languageTag.equals(en.toLanguageTag()) || languageTag.equals(sv.toLanguageTag());
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
			throw new AssertionError(e); //UTF-8 should never be unsupported
		}
	}
	
	public static Locale selectLocale(HttpServletRequest request, String prefix) throws InternalServerException {
		// Get locale data from request
		Cookie[] cookies = request.getCookies();
		String queryLocale = request.getParameter("l");
		Enumeration<Locale> locales = request.getLocales();

		
		// Set up supported locales:
		PersistenceManager pm = PMF.get().getPersistenceManager();
		LocaleStore localeStore = pm.getObjectById(LocaleStore.class, prefix);
		List<Locale> supportedLocales = localeStore.getSupportedLocales();
		pm.close();
		
		//Build a queue of desired locales, enqueue the most desired ones first
		List<Locale> desiredLocales = new LinkedList<>();
		
		// 1. Add browser request string locale
		if(queryLocale!=null) {
			desiredLocales.add(new Locale(queryLocale));
		}
		
		// 2. Add cookie-preferred locale
		if(cookies != null) {
			for(Cookie c : cookies){
				if(c.getName().equalsIgnoreCase("locale")){
					desiredLocales.add(new Locale(c.getValue()));
				}
			}
		}
		
		// 3. Add browser requested locales
		while(locales.hasMoreElements()){
			desiredLocales.add(locales.nextElement());
		}
		
		// 4. Add default locale
		desiredLocales.add(localeStore.getDefaultLocale());
		
		//Pick the first supported locale in the queue
		for(Locale desired : desiredLocales){
			String desiredLocale = desired.getLanguage();
			for(Locale supported : supportedLocales){
				if(supported.getLanguage().equalsIgnoreCase(desiredLocale)){
					return supported;
				}
			}
		}
		
		throw new InternalServerException("Default locale is not a supported locale for prefix '" + prefix + "'");
	}
}

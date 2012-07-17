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
package org.daxplore.presenter.server.resources;

import java.util.Locale;
import java.util.ResourceBundle;

/**
 * Contains static methods that supply {@link ResourceBundle}s to the .jsp
 * files.
 */
public final class JspBundles {
	
	/**
	 * Get a resource bundle that contains localized filenames of files that
	 * need to be accessed from .jsps.
	 * 
	 * @param locale
	 *            the locale
	 * @return the filename bundle
	 */
	public static ResourceBundle getFilenameBundle(Locale locale) {
		return ResourceBundle.getBundle("org.daxplore.presenter.server.resources.FilenameBundle", locale);
	}

	/**
	 * Get a resource bundle that contains localized strings that are needed
	 * to localize the content of the .jsps.
	 * 
	 * @param locale
	 *            the locale
	 * @return the hTML texts bundle
	 */
	public static ResourceBundle getHTMLTextsBundle(Locale locale) {
		return ResourceBundle.getBundle("org.daxplore.presenter.server.resources.HTMLTexts", locale);
	}

	/**
	 * Get a bundle that defines supported and default locales that are
	 * supported by the system.
	 * 
	 * @return the locales bundle
	 */
	public static ResourceBundle getLocalesBundle() {
		return ResourceBundle.getBundle("org.daxplore.presenter.server.resources.Locales");
	}
}

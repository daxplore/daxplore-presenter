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

import java.util.LinkedList;
import java.util.List;
import java.util.Locale;


public class JspLocales {
	public static List<Locale> getSupportedLocales() {
		List<Locale> locales = new LinkedList<Locale>();
		for (String l : JspBundles.getLocalesBundle().getString("supportedLocales").split("\\\\,")) {
			locales.add(new Locale(l.trim()));
		}
		return locales;
	}
	
	public static Locale getDefaultLocale() {
		return new Locale(JspBundles.getLocalesBundle().getString("defaultLocale"));
	}
}

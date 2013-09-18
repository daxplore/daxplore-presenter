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
package org.daxplore.presenter.server.storage;

import java.util.LinkedList;
import java.util.List;
import java.util.Locale;

import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

@PersistenceCapable
public class LocaleStore {
	@PrimaryKey
	private String prefix;
	
	@Persistent
	List<String> supportedLocales;

	@Persistent
	String defaultLocale;
	
	public LocaleStore(String prefix, List<Locale> supportedLocales, Locale defaultLocale) {
		this.prefix = prefix;
		this.supportedLocales = new LinkedList<>();
		for (Locale l : supportedLocales) {
			this.supportedLocales.add(l.toLanguageTag());
		}
		this.defaultLocale = defaultLocale.toLanguageTag();
	}

	public String getPrefix() {
		return prefix;
	}
	
	public List<Locale> getSupportedLocales() {
		LinkedList<Locale> locales = new LinkedList<>();
		for (String l : supportedLocales) {
			locales.add(new Locale(l));
		}
		return locales;
	}
	
	public Locale getDefaultLocale() {
		return new Locale(defaultLocale);
	}
}

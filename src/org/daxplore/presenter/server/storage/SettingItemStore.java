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

import javax.jdo.PersistenceManager;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import org.daxplore.presenter.client.json.shared.StatDataItem;

/**
 * A representation of a {@link StatDataItem} and it's key that can be
 * persisted (stored) using a JDO {@link PersistenceManager}.
 * 
 * <p>This acts like an item in a hash table (represented by the
 * {@linkplain PersistenceManager}), making it possible to fetch data items
 * with a specific key.</p>
 */
@PersistenceCapable
public class SettingItemStore {
	@PrimaryKey
	private String key;
	@Persistent
	private String value;

	/**
	 * Creates a new settings item to hold a setting uploaded by an administrator
	 * using the admin console.
	 * 
	 * <p>The key should be on the format "prefix/name". The prefix defines
	 * which presenter the setting belongs to and the name is the name of the
	 * setting.</p>
	 * 
	 * @param key
	 *            a key on the format "prefix/name"
	 * @param value
	 *            the value of the setting
	 */
	public SettingItemStore(String key, String value) {
		this.key = key;
		this.value = value;
	}

	/**
	 * Get the key.
	 * 
	 * @return the key
	 */
	public String getKey() {
		return key;
	}

	/**
	 * Get the setting value.
	 * 
	 * @return the value
	 */
	public String getValue() {
		return value;
	}
}

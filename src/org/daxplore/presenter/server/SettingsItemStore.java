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

import javax.jdo.PersistenceManager;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import org.daxplore.presenter.client.json.shared.StatDataItem;

/**
 * A representation of a {@link StatDataItem} and it's key that can be
 * persisted (stored) using a {@link PersistenceManager}.
 * 
 * <p>This acts like an item in a hash table (represented by the
 * {@linkplain PersistenceManager}), making it possible to fetch data items
 * with a specific key.</p>
 */
@PersistenceCapable
public class SettingsItemStore {
	@PrimaryKey
	private String key;
	@Persistent
	private String value;

	/**
	 * Instantiate a new settings item and make it persistent.
	 * 
	 * @param key
	 *            the key
	 * @param json
	 *            the data item as json
	 * @param pm
	 *            the persistance manager
	 */
	public SettingsItemStore(String key, String value, PersistenceManager pm) {
		this.key = key;
		this.value = value;
		pm.makePersistent(this);
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
	 * Get the value
	 * 
	 * @return the value
	 */
	public String getValue() {
		return value;
	}
}

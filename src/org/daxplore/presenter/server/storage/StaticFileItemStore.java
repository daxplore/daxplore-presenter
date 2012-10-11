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


@PersistenceCapable
public class StaticFileItemStore {
	@PrimaryKey
	private String key;
	@Persistent
	private String blobKey;

	/**
	 * Instantiate a new stat data item and make it persistent.
	 * 
	 * @param key
	 *            the key
	 * @param blobKey
	 *            the string representation of a blob key
	 * @param pm
	 *            the persistance manager
	 */
	public StaticFileItemStore(String key, String blobKey, PersistenceManager pm) {
		this.key = key;
		this.blobKey = blobKey;
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
	 * Get the stat data item json.
	 * 
	 * @return the data
	 */
	public String getBlobKey() {
		return blobKey;
	}
}

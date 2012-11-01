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

import javax.jdo.PersistenceManager;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import org.daxplore.presenter.client.json.shared.StatDataItem;
import org.daxplore.presenter.server.throwable.StatsException;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.SharedTools;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

import com.google.apphosting.api.ApiProxy.CapabilityDisabledException;

/**
 * A representation of a {@link StatDataItem} and it's key that can be
 * persisted (stored) using a {@link PersistenceManager}.
 * 
 * <p>This acts like an item in a hash table (represented by the
 * {@linkplain PersistenceManager}), making it possible to fetch data items
 * with a specific key.</p>
 */
@PersistenceCapable
public class StatDataItemStore {
	@PrimaryKey
	private String key;
	@Persistent
	private String json;

	/**
	 * Instantiate a new stat data item, which is a piece of anonymized
	 * statistical data that can be presented to users.
	 * 
	 * <p>The key should be on the format "prefix/name". The prefix defines
	 * which presenter the setting belongs to and the name is the name
	 * of the data item.</p>
	 * 
	 * @param key
	 *            a key on the format "prefix/name"
	 * @param json
	 *            the data item as json
	 */
	public StatDataItemStore(String key, String json) {
		this.key = key;
		this.json = json;
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
	public String getJson() {
		return json;
	}
	
	public static LinkedList<String> getStats(PersistenceManager pm, String prefix, QueryDefinition queryDefinition) throws StatsException {
		String perspectiveID = queryDefinition.getPerspectiveID();
		String questionID = queryDefinition.getQuestionID();
		boolean useTotal = queryDefinition.hasFlag(QueryFlag.TOTAL);
		List<Integer> usedPerspectiveOptions = queryDefinition.getUsedPerspectiveOptions();
		LinkedList<String> datastoreKeys = new LinkedList<String>();
		if (questionID.equals("")) {
			throw new StatsException("No legit query");
		} else if (perspectiveID.equals("") || usedPerspectiveOptions.size() == 0) {
			datastoreKeys.add(prefix + "/Q=" + questionID);
		} else {
			if (useTotal) {
				datastoreKeys.add(prefix + "/Q=" + questionID);
			}
			for (int alt: usedPerspectiveOptions) {
				datastoreKeys.add(prefix + "/" + perspectiveID + "=" + (alt+1) + "+Q=" + questionID);
			}
		}

		LinkedList<String> datastoreJsons = new LinkedList<String>();
		for (String key : datastoreKeys) {
			try {
				StatDataItemStore statStore = pm.getObjectById(StatDataItemStore.class, key.toUpperCase());
				datastoreJsons.add(statStore.getJson());
			} catch (CapabilityDisabledException e) {
				SharedTools.println("CapabilityDisabledException");
				// TODO Datastore down for maintenance: send error message or no feedback?
				throw new StatsException(e);
			} catch (javax.jdo.JDOObjectNotFoundException e) {
				SharedTools.println("JDOObjectNotFoundException using key: " + key.toUpperCase());
				throw new StatsException("Using key: " + key.toUpperCase(), e);
				// TODO Key does not exist: send error message or no feedback?
			} catch (UnsupportedOperationException e) {
				SharedTools.println("UnsupportedOperationException. this should only happen on DevServer." + e);
				SharedTools.println("Try restarting the web server or something.");
				throw new StatsException("UnsupportedOperationException, this should only happen on DevServer.", e);
				// TODO If google fixes this issue, remove catch.
			}
		}
		return datastoreJsons;
	}
}

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

import java.util.List;

import javax.jdo.PersistenceManager;
import javax.jdo.Query;

import org.daxplore.presenter.server.servlets.GetCsvServlet;

import com.google.appengine.api.blobstore.BlobKey;

public class DeleteData {
	
	public static String deleteForPrefix(PersistenceManager pm, String prefix) {
		long time = System.currentTimeMillis();
		
		StringBuilder resultMessage = new StringBuilder("Removed data for prefix '").append(prefix).append("': ");
		// Delete the single prefix item, this should be enough to remove the prefix from the system
		// We still need to remove all related datastore/blobstore items to prevent storage memory leaks
		// and to make sure that no settings or data remains if the prefix is reused/overwritten later.
		Query query = pm.newQuery(PrefixStore.class);
		query.declareParameters("String specificPrefix");
		query.setFilter("prefix == specificPrefix");
		pm.deletePersistentAll();
		long deletedPrefixItems = query.deletePersistentAll(prefix); // should always be 1
		resultMessage.append(deletedPrefixItems).append(" prefix item, ");
		
		// Delete the single locale entry for the prefix
		query = pm.newQuery(LocaleStore.class);
		query.declareParameters("String specificPrefix");
		query.setFilter("prefix == specificPrefix");
		long deletedLocaleItems = query.deletePersistentAll(prefix); // should always be 1
		resultMessage.append(deletedLocaleItems).append(" locale item, ");
		
		// Delete all setting items related to the prefix
		query = pm.newQuery(SettingItemStore.class);
		query.declareParameters("String specificPrefix");
		query.setFilter("prefix == specificPrefix");
		long deletedSettingItems = query.deletePersistentAll(prefix);
		resultMessage.append(deletedSettingItems).append(" settings, ");
				
		// Delete all statistical data items related to the prefix
		query = pm.newQuery(StatDataItemStore.class);
		query.declareParameters("String specificPrefix");
		query.setFilter("prefix == specificPrefix");
		long deletedStatDataItems = query.deletePersistentAll(prefix);
		resultMessage.append(deletedStatDataItems).append(" statistical data items, ");
		
		// Delete all the blobstore-stored files
		query = pm.newQuery(StaticFileItemStore.class);
		query.declareParameters("String specificPrefix");
		query.setFilter("prefix == specificPrefix");
		@SuppressWarnings("unchecked")
		List<StaticFileItemStore> fileItems = (List<StaticFileItemStore>)query.execute(prefix);
		for (StaticFileItemStore item : fileItems) {
			StaticFileItemStore.deleteBlob(new BlobKey(item.getBlobKey()));
		}
		pm.deletePersistentAll(fileItems);
		int deletedBlobs = fileItems.size();
		int deletedStaticFileItems = fileItems.size();
		resultMessage.append(deletedBlobs).append(" file blobs deleted, ");
		resultMessage.append(deletedStaticFileItems).append(" static file pointers ");
		
		//Clear caches in different places
		GetCsvServlet.clearServletCache();
		StaticFileItemStore.clearStaticFileCache();
		
		long totalDeleted = deletedPrefixItems + deletedLocaleItems + deletedStatDataItems + deletedSettingItems + deletedStaticFileItems;
		double timeSeconds = ((System.currentTimeMillis()-time)/Math.pow(10, 6));
		resultMessage.append(" (" + totalDeleted + " items in " +  timeSeconds + " seconds)");
		
		String result = resultMessage.toString();
		return result;
	}
}

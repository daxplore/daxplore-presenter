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

import java.util.HashMap;
import java.util.List;
import java.util.Locale;

import javax.jdo.PersistenceManager;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.shared.SharedTools;

@PersistenceCapable
public class TextFileStore {
	@PrimaryKey
	private String key;
	@Persistent
	private List<String> fileChunks;
	@Persistent
	private String prefix;
	
	private static HashMap<String, String> localCache = new HashMap<>();
	
	/**
	 * Instantiate a new text file item.
	 * 
	 * <p>The files are stored as-is and are assumed to be final. New uploads
	 * should delete and replace old files.</p>
	 * 
	 * <p>The key should be in the format "prefix#name". The prefix defines
	 * which presenter the setting belongs to and the name is the name
	 * of the file.</p>
	 * 
	 * @param key
	 *            a key in the format "prefix#name"
	 * @param file
	 *            the text file as a string
	 */
	public TextFileStore(String prefix, String fileName, String file) {
		this.prefix = prefix;
		this.key = prefix + "#" + fileName;
		localCache.put(key, file);
		fileChunks = SharedTools.splitString(file, 500); //JDO has a String length limit of 500
	}
	
	public static String getFile(PersistenceManager pm, String prefix, String filename) throws BadRequestException {
		String key = prefix + "#" + filename;
		if (localCache.containsKey(key)) {
			return localCache.get(key);
		}
		
		try {
			String file = SharedTools.join(pm.getObjectById(TextFileStore.class, key).fileChunks, "");
			localCache.put(key, file);
			return file;
		} catch (Exception e) {
			// This could also be an internal server exception, but we have no way of finding out
			throw new BadRequestException("Could not read data item '" + key + "'", e);
		}
	}

	public static String getLocalizedFile(PersistenceManager pm, String prefix, String name, Locale locale, String suffix) throws BadRequestException {
		String filename = name + "_" + locale.getLanguage() + suffix;
 		return getFile(pm, prefix, filename);
	}
}

/**
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.server.storage;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletContext;

import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.throwable.InternalServerException;

/**
 * Load files uploaded in the war directory. 
 */
public class StaticFileStore {
	private static Map<String, String> staticFileCache = new HashMap<>(); 
	
	public static String getStaticFile(ServletContext sc, String filename) throws InternalServerException {
		String key = getStaticFileKey(filename);
		if (staticFileCache.containsKey(key)) {
			return staticFileCache.get(key);
		}
		loadStaticFile(sc, filename);
		return staticFileCache.get(key);
	}
	
	public static void loadStaticFile(ServletContext sc, String filename) throws InternalServerException {
		try {
			String key = getStaticFileKey(filename);
			if (!staticFileCache.containsKey(key)) {
				String file = IOUtils.toString(sc.getResourceAsStream(filename));
				staticFileCache.put(key, file);
			}
		} catch (IOException e) {
			throw new InternalServerException("Failed to load the static file: '" + filename + "'", e);
		}
	}
	
	public static void clearStaticFileCache() {
		staticFileCache.clear();
	}
	
	private static String getStaticFileKey(String filename) {
		return filename;
	}
}

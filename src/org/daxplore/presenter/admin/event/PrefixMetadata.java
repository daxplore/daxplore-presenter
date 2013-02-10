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
package org.daxplore.presenter.admin.event;

import com.google.gwt.json.client.JSONObject;
import com.google.gwt.json.client.JSONParser;

public class PrefixMetadata {

	private final String prefix;
	private final String statDataItemCount;
	
	public PrefixMetadata (String json) {
		JSONObject metaMap = JSONParser.parseStrict(json).isObject();
		prefix = metaMap.get("prefix").isString().stringValue();
		statDataItemCount = metaMap.get("statcount").isString().stringValue();
	}

	public String getPrefix() {
		return prefix;
	}
	
	public String getStatDataItemCount() {
		return statDataItemCount;
	}
}

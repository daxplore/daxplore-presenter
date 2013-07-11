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
package org.daxplore.presenter.server;

import org.daxplore.presenter.shared.PrefixProperties;
import org.json.simple.JSONAware;
import org.json.simple.JSONObject;

public class ServerPrefixProperties implements PrefixProperties {

	private String prefix, secondaryFlagText, timepoint0Text, timepoint1Text, googleAnalyticsID;
	
	public ServerPrefixProperties(String prefix, String secondaryFlagText,
			String timepoint0Text, String timepoint1Text, String googleAnalyticsID) {
		this.prefix = prefix;
		this.secondaryFlagText = secondaryFlagText;
		this.timepoint0Text = timepoint0Text;
		this.timepoint1Text = timepoint1Text;
		this.googleAnalyticsID = googleAnalyticsID;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getPrefix() {
		return prefix;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getSecondaryFlagText() {
		return secondaryFlagText;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getTimepointPrimaryText() {
		return timepoint0Text;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getTimepointSecondaryText() {
		return timepoint1Text;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getGoogleAnalyticsID() {
		return googleAnalyticsID;
	}
	

	@SuppressWarnings("unchecked")
	public JSONAware toJson() {
		JSONObject obj = new JSONObject();
		obj.put("prefix", prefix);
		obj.put("secondary_flag", secondaryFlagText);
		obj.put("timepoint_0", timepoint0Text);
		obj.put("timepoint_1", timepoint1Text);
		obj.put("gaID", googleAnalyticsID);
		return obj;
	}

}

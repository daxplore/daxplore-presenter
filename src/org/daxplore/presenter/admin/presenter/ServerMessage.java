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
package org.daxplore.presenter.admin.presenter;

import org.daxplore.presenter.shared.ClientServerMessage;

import com.google.gwt.json.client.JSONObject;
import com.google.gwt.json.client.JSONParser;

public class ServerMessage implements ClientServerMessage {

	protected MessageType messageType;
	protected String json, message;
	
	public ServerMessage(String json) {
		this.json = json;
		JSONObject jsonObject = JSONParser.parseStrict(json).isObject();
		messageType = MessageType.valueOf(jsonObject.get("type").isString().stringValue());
		message = jsonObject.get("message").isString().stringValue();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public MessageType getMessageType() {
		return messageType;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getMessage() {
		return message;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String toJsonString() {
		return json;
	}
}

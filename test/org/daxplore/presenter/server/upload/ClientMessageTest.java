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
package org.daxplore.presenter.server.upload;

import static org.junit.Assert.*;

import org.daxplore.presenter.shared.ClientMessage;
import org.daxplore.presenter.shared.ClientServerMessage.MessageType;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
import org.junit.Test;

public class ClientMessageTest {

	@Test
	public void testClientMessage() {
		ClientMessage message = new ClientMessage(MessageType.PROGRESS_UPDATE, "Some message!");
		String json = message.toJsonString();
		
		JSONObject jsonObject = (JSONObject)JSONValue.parse(json);
		assertEquals(MessageType.PROGRESS_UPDATE, MessageType.valueOf((String)jsonObject.get("type")));
		assertEquals("Some message!", jsonObject.get("message"));
	}
}

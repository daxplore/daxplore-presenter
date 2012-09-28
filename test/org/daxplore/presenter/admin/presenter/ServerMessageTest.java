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

import org.daxplore.presenter.shared.ClientServerMessage.MESSAGE_TYPE;
import org.junit.Test;

import com.google.gwt.junit.client.GWTTestCase;

public class ServerMessageTest extends GWTTestCase {

	@Override
	public String getModuleName() {
		return "org.daxplore.presenter.gwtAdmin";
	}
	
	@Test
	public void testServerMessage() {
		ServerMessage message = new ServerMessage("{\"message\":\"Some text!\",\"type\":\"SERVER_ERROR\"}");
		assertEquals(MESSAGE_TYPE.SERVER_ERROR, message.getMessageType());
		assertEquals("Some text!", message.getMessage());
	}

}

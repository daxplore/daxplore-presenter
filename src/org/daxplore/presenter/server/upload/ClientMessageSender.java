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

import org.daxplore.presenter.shared.ClientMessage;

import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.InternalServerErrorException;
import com.google.appengine.api.channel.ChannelMessage;
import com.google.appengine.api.channel.ChannelService;
import com.google.appengine.api.channel.ChannelServiceFactory;


public class ClientMessageSender {
	protected String channelToken;
	
	public ClientMessageSender(String channelToken) {
		this.channelToken = channelToken;
	}
	
	public void send(ClientMessage message) throws BadRequestException, InternalServerErrorException {
		ChannelService channelService = ChannelServiceFactory.getChannelService();
		try {
			channelService.sendMessage(new ChannelMessage(channelToken, message.toJsonString()));
			System.out.println(message.toJsonString());
		} catch (IllegalArgumentException e) {
			throw new InternalServerErrorException("Error when sending client message: " + e.getMessage());
		}
			
	}
	
	public String getChannelToken() {
		return channelToken;
	}
}

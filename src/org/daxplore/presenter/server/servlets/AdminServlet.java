/*
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
package org.daxplore.presenter.server.servlets;

import java.io.IOException;
import java.io.Writer;
import java.text.MessageFormat;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.storage.LocalizedSettingItemStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.shared.SharedResourceTools;

import com.google.appengine.api.channel.ChannelService;
import com.google.appengine.api.channel.ChannelServiceFactory;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

@SuppressWarnings("serial")
public class AdminServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(AdminServlet.class.getName());
	protected static String adminHtmlTemplate = null;
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		// Get input from URL
		String prefix = request.getParameter("prefix");
		
		// Clean user input
		if(!SharedResourceTools.isSyntacticallyValidPrefix(prefix)) {
			logger.log(Level.WARNING, "Someone tried to access a syntactically invalid prefix: '" + prefix + "'");
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
		
		Locale locale = new Locale("en");
		UserService userService = UserServiceFactory.getUserService();
		User user = userService.getCurrentUser();
		ChannelService channelService = ChannelServiceFactory.getChannelService();
		String channelToken = channelService.createChannel(user.getUserId());
		
		PersistenceManager pm = PMF.get().getPersistenceManager();
		String pageTitle = LocalizedSettingItemStore.getLocalizedProperty(pm, prefix, locale, "pageTitle");
		pageTitle += " - Admin";
		
		if (adminHtmlTemplate == null) {
			try {
				adminHtmlTemplate = IOUtils.toString(getServletContext().getResourceAsStream("/templates/admin.html"));
			} catch (IOException e) {
				logger.log(Level.SEVERE, "Failed to load the html embed template", e);
				try {
					response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
				} catch (IOException e1) {}
				return;
			}
		}
		
		String[] arguments = {
				locale.toLanguageTag(), // {0}
				channelToken, 			// {1}
				pageTitle,				// {2}
				};
		
		Writer writer;
		try {
			writer = response.getWriter();
			writer.write(MessageFormat.format(adminHtmlTemplate, (Object[])arguments));
			writer.close();
		} catch (IOException e) {
			logger.log(Level.SEVERE, "Failed to display the admin servlet", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
	}
}

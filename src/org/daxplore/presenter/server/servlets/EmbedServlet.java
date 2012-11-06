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
package org.daxplore.presenter.server.servlets;

import java.io.IOException;
import java.io.Writer;
import java.text.MessageFormat;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.ServerTools;
import org.daxplore.presenter.server.storage.LocalizedSettingItemStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.storage.StorageTools;
import org.daxplore.presenter.server.throwable.LocaleSelectionException;
import org.daxplore.presenter.server.throwable.StatsException;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.daxplore.presenter.shared.SharedTools;
import org.daxplore.shared.SharedResourceTools;
import org.json.simple.parser.ParseException;

@SuppressWarnings("serial")
public class EmbedServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(EmbedServlet.class.getName());
	protected static String embedHtmlTemplate = null;
	
	protected HashMap<String, QuestionMetadata> metadataMap = new HashMap<String, QuestionMetadata>(); 

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		PersistenceManager pm = PMF.get().getPersistenceManager();

		String prefix = request.getParameter("prefix");
		String queryString = request.getParameter("q");
		
		// Clean user input
		if(!SharedResourceTools.isSyntacticallyValidPrefix(prefix)) {
			logger.log(Level.WARNING, "Someone tried to access a syntactically invalid prefix: '" + prefix + "'");
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
		
		if(!ServerTools.isSyntacticallyValidQueryString(queryString)) {
			logger.log(Level.WARNING, "Someone tried to use a syntactically invalid query string: '" + queryString+ "'");
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
				
		Locale locale = null;
		try {
			locale = ServerTools.selectLocale(request, prefix);
		} catch (LocaleSelectionException e) {
			logger.log(Level.SEVERE,  "Default locale is not a supported locale for prefix '" + prefix + "'");
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
		
		String serverPath = request.getRequestURL().toString();
		// remove last slash
		if (serverPath.charAt(serverPath.length() - 1) == '/') {
			serverPath = serverPath.substring(0, serverPath.length() - 1);
		}
		// remove module name
		serverPath = serverPath.substring(0, serverPath.lastIndexOf("/"));
		
		QueryDefinition queryDefinition = new QueryDefinition(metadataMap.get(prefix), queryString);
		LinkedList<String> statItems;
		try {
			statItems = StatDataItemStore.getStats(pm, prefix, queryDefinition);
		} catch (StatsException e) {
			logger.log(Level.WARNING, "Failed to load the statistical data items", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
		LinkedList<String> questions = new LinkedList<String>();
		questions.add(queryDefinition.getQuestionID());
		questions.add(queryDefinition.getPerspectiveID());
		
		String pageTitle = LocalizedSettingItemStore.getLocalizedProperty(pm, prefix, locale, "pageTitle");
		String jsondata = SharedTools.join(statItems, ",");
		
		String questionsString;
		try {
			questionsString = StorageTools.getQuestionDefinitions(pm, prefix, questions, locale);
		} catch (IOException | ParseException e) {
			logger.log(Level.WARNING, "Failed to load question metadata", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
	
		if (embedHtmlTemplate == null) {
			try {
				embedHtmlTemplate = IOUtils.toString(getServletContext().getResourceAsStream("/templates/embed.html"));
			} catch (IOException e) {
				logger.log(Level.SEVERE, "Failed to load the html embed template", e);
				try {
					response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
				} catch (IOException e1) {}
				return;
			}
		}
		
		String[] arguments = {
				prefix, 				// {0}
				locale.toLanguageTag(), // {1}
				pageTitle,				// {2}
				jsondata, 				// {3}
				questionsString			// {4}
				};
		
		Writer writer;
		try {
			writer = response.getWriter();
			writer.write(MessageFormat.format(embedHtmlTemplate, (Object[])arguments));
			writer.close();
		} catch (IOException e) {
			logger.log(Level.SEVERE, "Failed to display the embed servlet", e);
			try {
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			} catch (IOException e1) {}
			return;
		}
	}
}
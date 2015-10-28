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
package org.daxplore.presenter.client.model;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.client.event.QueryReadyEvent;
import org.daxplore.presenter.client.json.Prefix;
import org.daxplore.presenter.client.json.shared.ChartDataParserClient;
import org.daxplore.presenter.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;

import com.google.gwt.http.client.Request;
import com.google.gwt.http.client.RequestBuilder;
import com.google.gwt.http.client.RequestCallback;
import com.google.gwt.http.client.RequestException;
import com.google.gwt.http.client.Response;
import com.google.gwt.http.client.URL;
import com.google.gwt.user.client.Window;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

public class StatDataServerModel {
	
	private EventBus eventBus;
	
	private Map<String, QueryData> queryDataCache = new HashMap<>();
	
	private String href;
	
	private QueryDefinition currentQuery;
	
	
	@Inject
	public StatDataServerModel(EventBus eventBus, Prefix prefix) {
		this.eventBus = eventBus;
		
		href = 	Window.Location.getProtocol() + "//" + 
				Window.Location.getHost() + "/getStats?prefix=" +
				prefix.getPrefix() + "&";
	}
	
	public void makeRequest(QueryDefinition queryDefinition) {
		currentQuery = queryDefinition;
		if(queryDataCache.containsKey(getCacheString(queryDefinition))) {
			onDataLoaded();
		} else {
			String requestString = getRequestString(queryDefinition);
			String url = href + requestString;
			RequestBuilder builder = new RequestBuilder(RequestBuilder.GET, URL.encode(url));
			builder.setTimeoutMillis(5000); //TODO better timeout handling
			try {
				builder.sendRequest(null, new StatsRequest(queryDefinition));
			} catch (RequestException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}
	
	/**
	 * Called when requested data is available
	 */
	private void onDataLoaded() {
		// Make sure the newly loaded doesn't belong to an old request
		if (currentQuery != null && queryDataCache.containsKey(getCacheString(currentQuery))) {
			QueryData data = queryDataCache.get(getCacheString(currentQuery));
			eventBus.fireEvent(new QueryReadyEvent(currentQuery, data));
			currentQuery = null;
		}
	}
	
	private static String getRequestString(QueryDefinition queryDefinition) {
		return "q=" + queryDefinition.getAsString();
	}
	
	private static String getCacheString(QueryDefinition definition) {
		return definition.getQuestionID() + "@" + definition.getPerspectiveID();
	}
	
	/**
	 * Internal class for requesting data from server.
	 */
	private class StatsRequest implements RequestCallback {
		private QueryDefinition queryDefinition;
		
		private StatsRequest(QueryDefinition queryDefinition) {
			this.queryDefinition = queryDefinition;
		}

		/**
		 * {@inheritDoc}
		 */
		@Override
		public void onResponseReceived(Request request, Response response) {
			if (response.getStatusCode() == HttpServletResponse.SC_OK) {
				System.out.println("Server Data: " + response.getText());
				QueryData data = ChartDataParserClient.parse(response.getText());
				if(!queryDataCache.containsKey(getCacheString(queryDefinition))){
					queryDataCache.put(getCacheString(queryDefinition), data);
				}
				onDataLoaded();
			} else {
				// TODO Handle the error.
				System.out.println("StatsRequest bad response status: " + response.getStatusText());
			}
		}
		
		/**
		 * {@inheritDoc}
		 */
		@Override
		public void onError(Request request, Throwable exception) {
			// TODO Couldn't connect to server (could be timeout, SOP violation, etc.)
			System.out.println("StatsRequest onError: " + exception.getMessage());
			exception.printStackTrace();
		}
	}
}

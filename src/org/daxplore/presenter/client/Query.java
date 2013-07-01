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
package org.daxplore.presenter.client;

import java.util.List;

import org.daxplore.presenter.chart.QueryActiveAnimation;
import org.daxplore.presenter.chart.QueryInterface;
import org.daxplore.presenter.chart.StatInterface;
import org.daxplore.presenter.chart.data.QueryResult;
import org.daxplore.presenter.chart.data.QueryResultCount;
import org.daxplore.presenter.chart.data.QueryResultCountCompare;
import org.daxplore.presenter.chart.data.QueryResultMean;
import org.daxplore.presenter.chart.data.QueryResultMeanCompare;
import org.daxplore.presenter.client.json.shared.QueryData;
import org.daxplore.presenter.shared.PrefixProperties;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.daxplore.presenter.shared.SharedTools;

import com.google.gwt.http.client.Request;
import com.google.gwt.http.client.RequestBuilder;
import com.google.gwt.http.client.RequestCallback;
import com.google.gwt.http.client.RequestException;
import com.google.gwt.http.client.Response;
import com.google.gwt.http.client.URL;
import com.google.gwt.user.client.Window;
import com.google.inject.Inject;

/**
 * A Query is defined by a {@link QueryDefinition}.
 * 
 * <p>The Query is responsible for getting data from the server, notifying the
 * chart when the data has loaded and displaying a {@link QueryActiveAnimation}
 * .</p>
 * 
 * <p>TODO: put QueryActiveAnimation somewhere else.</p>
 */
public class Query implements QueryInterface {

	protected final QuestionMetadata questions;
	protected final QueryActiveAnimation queryActiveAnimation;

	protected QueryDefinition queryDefinition;

	private QueryResult result = null;
	private QueryCallback callback;
	private String href;
	private Request currentRequest;
	private boolean hasFetchedData = false;
	private List<StatInterface> dataItemList;
	private StatInterface totalDataItem;
	private final String requestString;
	private int timeoutCount = 0;

	/**
	 * A factory for creating Query objects.
	 */
	public static class QueryFactory {
		protected final QuestionMetadata questions;
		protected final QueryActiveAnimation queryActiveAnimation;
		protected final PrefixProperties prefixProperties;

		/**
		 * Instantiates a new query factory.
		 * 
		 * @param questions
		 *            the questions
		 * @param queryActiveAnimation
		 *            the loading chart animation
		 */
		@Inject
		public QueryFactory(QuestionMetadata questions, QueryActiveAnimation queryActiveAnimation, PrefixProperties prefixProperties) {
			this.questions = questions;
			this.queryActiveAnimation = queryActiveAnimation;
			this.prefixProperties = prefixProperties;
		}

		/**
		 * Creates a new Query object.
		 * 
		 * @param queryDefinition
		 *            the query definition
		 * @return the query
		 */
		public Query createQuery(QueryDefinition queryDefinition) {
			return new Query(questions, queryActiveAnimation, queryDefinition, prefixProperties);
		}

	}

	protected Query(QuestionMetadata questions, QueryActiveAnimation queryActiveAnimation, QueryDefinition queryDefinition, PrefixProperties prefixProperties) {
		this.questions = questions;
		this.queryActiveAnimation = queryActiveAnimation;
		this.queryDefinition = queryDefinition;

		//TODO write more elegant/stable code for this
		String prefix = prefixProperties.getPrefix();
		href = Window.Location.getProtocol() + "//" + Window.Location.getHost() + "/getStats?prefix="+prefix +"&";
		
		requestString = "q=" + queryDefinition.getQuestionID() + "&p=" + queryDefinition.getPerspectiveID();
	}

	/**
	 * Fetch the data from the server, as defined by the {@link QueryDefinition}
	 * .
	 */
	public void fetchData() {
		resetTimeoutCount();
		askQuestion(requestString);
	}

	/*
	 * public void fetchData(Query oldQuery){ resetTimeoutCount(); if(false &&
	 * oldQuery != null && question.equals(oldQuery.question) &&
	 * perspectiveID.equals(oldQuery.perspective) && oldQuery.hasResult()){
	 * dataItemList = oldQuery.dataItemList; totalDataItem =
	 * oldQuery.totalDataItem; hasFetchedData = true; if (callback != null) {
	 * callback.callback(); } } else { askQuestion(requestString); } }
	 */

	private void askQuestion(String requestString) {
		String url = href + requestString;
		SharedTools.println("askQuestion url: " + url);
		RequestBuilder builder = new RequestBuilder(RequestBuilder.GET, URL.encode(url));
		builder.setTimeoutMillis(getTimeoutTime());
		Request request;
		try {
			request = builder.sendRequest(null, new StatsRequest(queryActiveAnimation));
			if (currentRequest != null && currentRequest.isPending()) {
				currentRequest.cancel();
			}
			currentRequest = request;
		} catch (RequestException e) {
			e.printStackTrace();
		}
	}

	private int getTimeoutCount() {
		return timeoutCount;
	}

	private void incrementTimeoutCount() {
		timeoutCount++;
	}

	private void resetTimeoutCount() {
		timeoutCount = 0;
	}

	private int getTimeoutTime() {
		int timeoutTime = 3000 + Math.min(27000, 3000 * getTimeoutCount());
		return timeoutTime;
	}

	/**
	 * Cancel an ongoing server request.
	 */
	public void cancelRequest() {
		if (currentRequest != null && currentRequest.isPending()) {
			currentRequest.cancel();
		}
	}

	/**
	 * This method is called when a server response has been recieved.
	 * 
	 * @param dataItemList
	 *            the data item list
	 * @param total
	 *            the total data item
	 */
	public void gotResponse(List<StatInterface> dataItemList, StatInterface total) {
		this.dataItemList = dataItemList;
		this.totalDataItem = total;
		hasFetchedData = true;

		if (callback != null) {
			callback.callback();
		}
	}

	/**
	 * {@inheritDoc}
	 */
	public boolean hasResult() {
		return hasFetchedData;
	}

	/**
	 * {@inheritDoc}
	 */
	public void requestResult(QueryCallback callback) {
		this.callback = callback;
		if (result != null) {
			callback.callback();
		}
	}

	/**
	 * {@inheritDoc}
	 */
	public QueryResult getResult(boolean secondary, boolean mean) {
		if (!secondary && !mean) {
			result = new QueryResultCount(dataItemList, totalDataItem, this);
		} else if (secondary && !mean) {
			result = new QueryResultCountCompare(dataItemList, totalDataItem, this);
		} else if (!secondary && mean) {
			result = new QueryResultMean(dataItemList, totalDataItem, this);
		} else if (secondary && mean) {
			result = new QueryResultMeanCompare(dataItemList, totalDataItem, this);
		}
		return result;
	}

	/**
	 * Gets the query definition.
	 * 
	 * @return the query definition
	 */
	public QueryDefinition getQueryDefinition() {
		return queryDefinition;
	}

	/**
	 * Internal class for requesting data from server.
	 */
	protected class StatsRequest implements RequestCallback {

		protected final QueryActiveAnimation queryActiveAnimation;

		protected StatsRequest(QueryActiveAnimation queryActiveAnimation) {
			this.queryActiveAnimation = queryActiveAnimation;
			queryActiveAnimation.setLoading(true);
		}

		/**
		 * {@inheritDoc}
		 */
		@Override
		public void onError(Request request, Throwable exception) {
			System.out.println("onError: " + exception.toString());
			queryActiveAnimation.setLoading(false);
			incrementTimeoutCount();
			askQuestion(Query.this.requestString);
			// TODO Couldn't connect to server (could be timeout, SOP violation, etc.)
		}

		/**
		 * {@inheritDoc}
		 */
		@Override
		public void onResponseReceived(Request request, Response response) {
			if (200 == response.getStatusCode()) {
				resetTimeoutCount();
				String responseText = response.getText();
				QueryData data = QueryData.getQueryData(responseText);
				List<StatInterface> dataItemList = data.getDataItems();
				StatInterface total = data.getTotalDataItem();
				gotResponse(dataItemList, total);
			} else {
				// TODO Handle the error.
				SharedTools.println("response: " + response.getStatusText());
			}
			queryActiveAnimation.setLoading(false);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public QueryDefinition getDefinition() {
		return queryDefinition;
	}
}

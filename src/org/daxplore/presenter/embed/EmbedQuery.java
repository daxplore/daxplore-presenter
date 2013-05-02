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
package org.daxplore.presenter.embed;

import java.util.LinkedList;
import java.util.List;

import org.daxplore.presenter.chart.QueryInterface;
import org.daxplore.presenter.chart.StatInterface;
import org.daxplore.presenter.chart.data.QueryResult;
import org.daxplore.presenter.chart.data.QueryResultCount;
import org.daxplore.presenter.chart.data.QueryResultCountCompare;
import org.daxplore.presenter.chart.data.QueryResultMean;
import org.daxplore.presenter.chart.data.QueryResultMeanCompare;
import org.daxplore.presenter.client.json.shared.QueryData;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.inject.Inject;

/**
 * The EmbedQuery class supplies all data to an embedded chart.
 * 
 * <p>The user can't change the question or perspective in an embedded
 * chart. So this class only needs to contain a very small subset of the total
 * data usually available.</p>
 */
public class EmbedQuery implements QueryInterface {
	protected QuestionMetadata questions;
	protected String questionID, perspectiveID;
	protected List<Integer> usedPerspectiveOptions;
	protected boolean total = false;
	protected List<StatInterface> dataItemList;
	protected StatInterface totalDataItem;
	protected QueryResult result = null;
	protected QueryDefinition queryDefinition = null;
	
	/**
	 * A factory for creating EmbedQuery objects.
	 */
	public static class EmbedQueryFactory {
		protected final QuestionMetadata questions;
		
		/**
		 * Instantiates a new query factory.
		 * 
		 * @param questions
		 *            the questions
		 */
		@Inject
		public EmbedQueryFactory(QuestionMetadata questions){
			this.questions = questions;
		}
		
		/**
		 * Creates a new Query object.
		 * 
		 * @param qd
		 *            the qd
		 * @param dataItems
		 *            the data items
		 * @return the embed query
		 */
		public EmbedQuery createQuery(QueryDefinition qd, QueryData queryData){
			return new EmbedQuery(questions, qd, queryData);
		}
		
	}
	
	protected EmbedQuery(QuestionMetadata questions, QueryDefinition qd, QueryData queryData) {
		this.queryDefinition = qd;
		this.questions = questions;
		this.questionID = qd.getQuestionID();
		this.perspectiveID = qd.getPerspectiveID();
		
		
		if (perspectiveID == null || perspectiveID.equals("")) {
			this.total = true;
		} else {
			this.total = qd.hasFlag(QueryFlag.TOTAL);
		}
		
		if (usedPerspectiveOptions == null) {
			this.usedPerspectiveOptions = new LinkedList<Integer>();
		} else {
			this.usedPerspectiveOptions = qd.getUsedPerspectiveOptions();
		}
		
		dataItemList = queryData.getDataItems();
		totalDataItem = queryData.getTotalDataItem();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
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
	 * {@inheritDoc}
	 */
	@Override
	public QueryDefinition getDefinition() {
		return queryDefinition;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void requestResult(QueryCallback queryCallback) {
		queryCallback.callback();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasResult() {
		return true;
	}
	
	/**
	 * Checks if this question-perspective combination can be displayed as
	 * a mean chart.
	 * 
	 * @return true, if it can be displayed as a mean
	 */
	public boolean hasMean() {
		return questions.hasMean(questionID) && questions.hasMean(perspectiveID);
	}
	
	/**
	 * Checks if there exists data from the secondary dataset for this
	 * question-perspective combination.
	 * 
	 * @return true, if secondary data is available
	 */
	public boolean hasSecondary() {
		return questions.hasSecondary(questionID) && questions.hasSecondary(perspectiveID);
	}
	
	/**
	 * Check if the total-data-item should be displayed in the chart.
	 * 
	 * @return true, the total should be displayed
	 */
	public boolean useTotalDataItem() {
		return total;
	}
	
	
	/*
	 * Get question specific information:
	 */
	
	/**
	 * Get a short text that describes the question.
	 * 
	 * @return the text
	 */
	public String getQuestionShortText() {
		return questions.getShortText(questionID);
	}
	
	/**
	 * Get a longer text that describes the question.
	 * 
	 * @return the text
	 */
	public String getQuestionFullText() {
		return questions.getFullText(questionID);
	}

	/**
	 * Get the number of answer-options the question has.
	 * 
	 * @return the option count
	 */
	public int getQuestionOptionCount() {
		return questions.getOptionCount(questionID);
	}

	/**
	 * Get a list of all the texts for the question's answer options.
	 * 
	 * @return the option texts
	 */
	public List<String> getQuestionOptionTexts() {
		return questions.getOptionTexts(questionID);
	}
	
	
	/*
	 * Get perspectiveID one specific information:
	 */
	
	/**
	 * Get a list of the perspective options that are in used and should
	 * be displayed.
	 * 
	 * @return the used perspective options
	 */
	public List<Integer> getUsedPerspectiveOptions() {
		return usedPerspectiveOptions;
	}
	
	/**
	 * Get the number of answer-options the perspective has.
	 * 
	 * @return the option count
	 */
	public int getPerspectiveOptionCount() {
		return questions.getOptionCount(perspectiveID);
	}

	/**
	 * Get a list of all the texts for the perspective's answer options.
	 * 
	 * @return the option texts
	 */
	public List<String> getPerspectiveOptionTexts() {
		return questions.getOptionTexts(perspectiveID);
	}
}

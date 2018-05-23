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
package org.daxplore.presenter.shared;

import java.util.List;

import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;

/**
 * Gives access to localized meta-data for the questions that are
 * defined for the site.
 * 
 * <p>Each question has texts and a number of question options (corresponding to
 * answer options in a survey).</p>
 * 
 * <p>These questions represents both what is called "questions" on the web site
 * as well as "perspectives". This is because they are all originally questions
 * in a survey.</p>
 */
public interface QuestionMetadata {
	
	/**
	 * Checks if a specific questionID is defined.
	 * 
	 * @param questionID
	 *            the question id
	 * @return true, if the question exists
	 */
	public boolean hasQuestion(String questionID);
	
	/**
	 * Get a short text that describes a question.
	 * 
	 * @param questionID
	 *            the questionID
	 * @return the text
	 */
	public String getShortText(String questionID);
	
	/**
	 * Get a longer text that describes a question.
	 * 
	 * @param questionID
	 *            the questionID
	 * @return the text
	 */
	public String getFullText(String questionID);
	
	/**
	 * Get an text that describes a question, for use in the DecriptionPanel
	 * 
	 * @param questionID
	 *            the questionID
	 * @return the text
	 */
	public String getDescriptionText(String questionID);

	
	/**
	 * Get a list of all the texts for the question's answer options.
	 * 
	 * @param questionID
	 *            the questionID
	 * @return a list of the option texts
	 */
	public List<String> getOptionTexts(String questionID);

	/**
	 * Get the number of answer-options that a question has.
	 *
	 * @param questionID
	 * 				the questionID
	 * @return the number of question options
	 */
	public int getOptionCount(String questionID);
	
	/**
	 * Get a list of all the supported timepoints.
	 * 
	 * @param questionID
	 *            the questionID
	 * @return a list of timepoint indexes
	 */
	public List<Integer> getTimepointIndexes(String questionID);
	
	public List<QueryFlag> getDisplayTypes(String questionID);

	/**
	 * Check if a question should be displayed as a freq chart.
	 * 
	 * @param questionID
	 *            the questionID
	 * @return true if a mean chart should be used
	 */
	public boolean useFreqChart(String questionID);
	
	/**
	 * Check if a question should be displayed as a mean chart.
	 * 
	 * @param questionID
	 *            the questionID
	 * @return true if a mean chart should be used
	 */
	public boolean useMeanChart(String questionID);
	
	
	/**
	 * Check if a question should be displayed as a dichotomized line chart over time.
	 * 
	 * @param questionID
	 *            the questionID
	 * @return true if it can be shown as a line chart
	 */
	public boolean useDichotomizedChart(String questionID);
	
	/**
	 * The options selected in a dichotomization of the question.
	 * @return A list of the selected options.
	 */
	public List<Integer> getDichotomizedDefaultSelectedOptions(String questionID);

	/**
	 * Check if a question should use a mean reference value.
	 * 
	 * @param questionID the questionID
	 * @return true if a mean reference value should be used
	 */
	public boolean hasMeanReferenceValue(String questionID);
	
	/**
	 * Get a question's mean reference value.
	 * 
	 * @return the mean reference value
	 */ 
	public double getMeanReferenceValue(String questionID);
}

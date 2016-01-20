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
	 * Check if a question supports secondary data.
	 * 
	 * @param questionID
	 *            the questionID
	 * @return true, if there is secondary data
	 */
	public boolean hasSecondary(String questionID);

	/**
	 * Check if a question supports displaying mean data.
	 * 
	 * @param questionID
	 *            the questionID
	 * @return true, averaging is possible
	 */
	public boolean hasMean(String questionID);

	/**
	 * Check if a question has a mean reference value.
	 * 
	 * @param questionID the questionID
	 * @return true if there is a mean reference value
	 */
	public boolean hasMeanReferenceValue(String questionID);
}

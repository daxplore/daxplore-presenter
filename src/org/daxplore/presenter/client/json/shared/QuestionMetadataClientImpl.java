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
package org.daxplore.presenter.client.json.shared;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.inject.Inject;

/**
 * Gives client-side access to localized meta-data for the questions that are
 * defined for the site.
 * 
 * <p>Each question has texts and a number of question options (corresponding to
 * answer options in a survey).</p>
 * 
 * <p>These questions represents both what is called "questions" on the web site
 * as well as "perspectives". This is because they are all originally questions
 * in a survey.</p>
 * 
 * <p>The native methods act on the json data using JavaScript. The non-native
 * methods wrap this information in convenient Java-methods.</p>
 */
public class QuestionMetadataClientImpl implements QuestionMetadata {
	private final Map<String, QuestionJson> questionMap;

	@Inject
	public QuestionMetadataClientImpl() {
		questionMap = new TreeMap<>();
		NativeQuestions questionsNative = getQuestionsNative();
		for (int i = 0; i < questionsNative.questionCount(); i++) {
			QuestionJson question = questionsNative.getQuestion(i);
			questionMap.put(question.getID(), question);
		}
	}

	private QuestionJson getQuestion(String questionID) {
		return questionMap.get(questionID);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasQuestion(String questionID) {
		return questionMap.containsKey(questionID);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getShortText(String questionID) {
		return getQuestion(questionID).getShortText();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getFullText(String questionID) {
		return getQuestion(questionID).getFullText();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getDescriptionText(String questionID) {
		return getQuestion(questionID).getDescriptionText();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public List<String> getOptionTexts(String questionID) {
		return getQuestion(questionID).getOptionTexts();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getOptionCount(String questionID) {
		return getQuestion(questionID).getOptionCount();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasSecondary(String questionID) {
		//TODO Remove the assumption that the "seconday" data has timepoint index 1!
		return getQuestion(questionID).hasDataForTimepoint(1);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasMean(String questionID) {
		return getQuestion(questionID).hasMean();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasMeanLine(String questionID) {
		return getQuestion(questionID).hasMeanLine();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasDichotomizedLine(String questionID) {
		return getQuestion(questionID).hasDichotomizedLine();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasMeanReferenceValue(String questionID) {
		return getQuestion(questionID).hasMeanReferenceValue();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public double getMeanReferenceValue(String questionID) {
		return getQuestion(questionID).getMeanReferenceValue();
	}

	/**
	 * Load the questions json-object from JavaScipt and wrap it as a
	 * {@link NativeQuestions} object.
	 * 
	 * @return the entire native perspective object
	 */
	private static native NativeQuestions getQuestionsNative() /*-{
		return $wnd.questions;
	}-*/;

	private final static class NativeQuestions extends JavaScriptObject {
		protected NativeQuestions() {
		}

		public final native int questionCount()/*-{
			return this.length;
		}-*/;

		public final native QuestionJson getQuestion(int index)/*-{
			return this[index];
		}-*/;
	}


}

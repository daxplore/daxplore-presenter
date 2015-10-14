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

import java.util.LinkedList;
import java.util.List;
import java.util.Random;

/**
 * @author daniel
 *
 */
public class QuestionMetadataMock implements QuestionMetadata {

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasQuestion(String questionID) {
		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getShortText(String questionID) {
		return questionID + " short text";
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getFullText(String questionID) {
		return questionID + " full text";
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public List<String> getOptionTexts(String questionID) {
		List<String> result = new LinkedList<>();
		for (int i = 0; i<getOptionCount(questionID); i++) {
			result.add(questionID + " option text " + i);
		}
		return result;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getOptionCount(String questionID) {
		Random rnd = new Random(questionID.hashCode());
		return rnd.nextInt(20) + 2;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasSecondary(String questionID) {
		Random rnd = new Random(questionID.hashCode() + 2);
		return rnd.nextBoolean();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasMean(String questionID) {
		Random rnd = new Random(questionID.hashCode() + 3);
		return rnd.nextBoolean();
	}

}

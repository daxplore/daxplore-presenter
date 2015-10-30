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

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Random;

import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.junit.Test;

public class QueryDefinitionTest {

	@Test
	public void testQueryFlagEncodeDecode() {
		Random rnd = new Random(0x7de3ff09);
		QueryFlag[] values = QueryDefinition.QueryFlag.values();
		for (int i=0; i<1000; i++) {
			ArrayList<QueryFlag> flags = new ArrayList<>();
			// don't use the 0/null flag, start at j=1
			for (int j=1; j<values.length; j++) {
				if (rnd.nextBoolean()) {
					flags.add(values[j]);
				}
			}
			QueryFlag[] flagArray = flags.toArray(new QueryFlag[flags.size()]);
			long encoded = QueryFlag.encodeFlags(flagArray);
			assertArrayEquals(flagArray, QueryFlag.decodeFlags(encoded));
		}
	}
	
	@Test
	public void testDefinitionEncodeDecode() {
		Random rnd = new Random(0x7de3ff09);
		QueryFlag[] values = QueryDefinition.QueryFlag.values();
		for (int i=0; i<1000; i++) {
			QuestionMetadata metadata = new QuestionMetadataMock();
			String perspectiveID = Integer.toHexString(i+100);
			String questionID = Integer.toHexString(i+500);
			
			LinkedList<Integer> usedPerspectiveOptions = new LinkedList<>();
			for (int j=0; j<metadata.getOptionCount(perspectiveID); j++) {
				if (rnd.nextBoolean()) {
					usedPerspectiveOptions.add(j);
				}
			}
			
			ArrayList<QueryFlag> flags = new ArrayList<>();
			// don't use the 0/null flag, start at j=1
			for (int j=1; j<values.length; j++) {
				if (rnd.nextBoolean()) {
					flags.add(values[j]);
				}
			}
			
			QueryDefinition d1 = new QueryDefinition(
					metadata,
					questionID,
					perspectiveID,
					usedPerspectiveOptions,
					flags);
			
			String encoded = d1.getAsString();
			QueryDefinition d2 = new QueryDefinition(metadata, encoded);
			
			assertEquals(perspectiveID, d2.getPerspectiveID());
			assertEquals(questionID, d2.getQuestionID());
			assertEquals(usedPerspectiveOptions.size(), d2.getUsedPerspectiveOptions().size());
			for (int j = 0; j<d2.getUsedPerspectiveOptions().size(); j++) {
				assertEquals(usedPerspectiveOptions.get(j), d2.getUsedPerspectiveOptions().get(j));
			}
			for (QueryFlag flag : QueryFlag.values()) {
				assertEquals(flags.contains(flag), d2.hasFlag(flag));
			}
			assertEquals(encoded, d2.getAsString());
		}
	}

}

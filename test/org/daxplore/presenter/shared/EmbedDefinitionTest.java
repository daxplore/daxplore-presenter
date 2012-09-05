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

import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.Random;

import org.daxplore.presenter.shared.EmbedDefinition.EmbedFlag;
import org.junit.Test;

public class EmbedDefinitionTest {

	@Test
	public void testEmbedFlagBitValues() {
		EmbedFlag[] values = EmbedDefinition.EmbedFlag.values();
		for (int i=0; i<values.length; i++) {
			long bitValue = i==0 ? 0 : Math.round(Math.pow(2, i-1));
			assertEquals(bitValue, values[i].bitValue);
		}
	}
	
	@Test
	public void testEmbedFlagEncodeDecode() {
		Random rnd = new Random(0x7de3ff09);
		EmbedFlag[] values = EmbedDefinition.EmbedFlag.values();
		for (int i=0; i<1000; i++) {
			ArrayList<EmbedFlag> flags = new ArrayList<EmbedFlag>();
			// don't use the 0/null flag, start at j=1
			for (int j=1; j<values.length; j++) {
				if (rnd.nextBoolean()) {
					flags.add(values[j]);
				}
			}
			EmbedFlag[] flagArray = flags.toArray(new EmbedFlag[0]);
			long encoded = EmbedFlag.encodeFlags(flagArray);
			assertArrayEquals(flagArray, EmbedFlag.decodeFlags(encoded));
		}
	}
	
	@Test
	public void testDefinitionEncodeDecode() {
		Random rnd = new Random(0x7de3ff09);
		EmbedFlag[] values = EmbedDefinition.EmbedFlag.values();
		for (int i=0; i<1000; i++) {
			ArrayList<EmbedFlag> flags = new ArrayList<EmbedFlag>();
			// don't use the 0/null flag, start at j=1
			for (int j=1; j<values.length; j++) {
				if (rnd.nextBoolean()) {
					flags.add(values[j]);
				}
			}
			EmbedDefinition definition = new EmbedDefinition(flags);
			String encoded = definition.getAsString();
			EmbedDefinition decodedDefinition = new EmbedDefinition(encoded);
			
			assertEquals(encoded, decodedDefinition.getAsString());
			for (EmbedFlag flag : EmbedFlag.values()) {
				assertEquals(definition.hasFlag(flag), decodedDefinition.hasFlag(flag));
			}
		}
	}

}

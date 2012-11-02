// Copyright 2003-2010 Christian d'Heureuse, Inventec Informatik AG, Zurich, Switzerland
// www.source-code.biz, www.inventec.ch/chdh
//
// This module is multi-licensed and may be used under the terms
// of any of the following licenses:
//
//  EPL, Eclipse Public License, V1.0 or later, http://www.eclipse.org/legal
//  LGPL, GNU Lesser General Public License, V2.1 or later, http://www.gnu.org/licenses/lgpl.html
//  GPL, GNU General Public License, V2 or later, http://www.gnu.org/licenses/gpl.html
//  AL, Apache License, V2.0 or later, http://www.apache.org/licenses
//  BSD, BSD License, http://www.opensource.org/licenses/bsd-license.php
//  MIT, MIT License, http://www.opensource.org/licenses/MIT
//
// Please contact the author if you need another license.
// This module is provided "as is", without warranties of any kind.
package org.daxplore.presenter.shared;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Arrays;
import java.util.Random;

import org.junit.Test;

public class Base64Test {

	/**
	 * Test Base64Coder with constant strings using an example from RFC 2617.
	 */
	@Test
	public void testBase64Static() {
		check("Aladdin:open sesame", "QWxhZGRpbjpvcGVuIHNlc2FtZQ==");
		check("", "");
		check("1", "MQ==");
		check("22", "MjI=");
		check("333", "MzMz");
		check("4444", "NDQ0NA==");
		check("55555", "NTU1NTU=");
		check("abc:def", "YWJjOmRlZg==");
	}

	private static void check(String plainText, String base64Text) {
		String s1 = Base64.encodeString(plainText);
		String s2 = Base64.decodeString(base64Text);
		if (!s1.equals(base64Text) || !s2.equals(plainText))
			fail("Check failed for \"" + plainText + "\" / \"" + base64Text + "\".");
	}

	/**
	 * Test Base64Coder against Apache Commons Base64 Encoder/Decoder with
	 * random data.
	 * 
	 * @throws IOException
	 *             Thrown by the Apache decoder.
	 */
	@Test
	public void testBase64Random() throws IOException {
		final int maxLineLen = 100;
		final int maxDataBlockLen = (maxLineLen * 3) / 4;
		org.apache.commons.codec.binary.Base64 apacheCoder =
				new org.apache.commons.codec.binary.Base64();
		Random rnd = new Random(0x538afb92);
		for (int i = 0; i < 1000; i++) {
			int len = rnd.nextInt(maxDataBlockLen + 1);
			byte[] b0 = new byte[len];
			rnd.nextBytes(b0);
			String e1 = new String(Base64.encode(b0));
			String e2 = new String(apacheCoder.encode(b0));
			assertEquals(e2, e1);
			byte[] b1 = Base64.decode(e1);
			byte[] b2 = apacheCoder.decode(e2.getBytes());
			assertArrayEquals(b0, b1);
			assertArrayEquals(b0, b2);
		}
	}

	/**
	 * Test Base64Coder line encoding/decoding against
	 * Apache Commons Base64 Encoder/Decoder with random data.
	 * 
	 * @throws IOException
	 *             Thrown by the Sun decoder
	 */
	@Test
	public void testBase64LinesRandom() throws IOException {
		final int maxDataBlockLen = 512;
		final int lineLength = 76;
		org.apache.commons.codec.binary.Base64 apacheCoder =
				new org.apache.commons.codec.binary.Base64();
		Random rnd = new Random(0x39ac7d6e);
		for (int i = 0; i < 1000; i++) {
			int len = rnd.nextInt(maxDataBlockLen + 1);
			byte[] b0 = new byte[len];
			rnd.nextBytes(b0);
			String e1 = Base64.encodeLines(b0);
			
			String e2 = new String(apacheCoder.encode(b0));
			StringBuilder e2Lines= new StringBuilder();
			for (int j=0; j<e2.length(); j+=lineLength) {
				e2Lines.append(e2.substring(j, Math.min(j+lineLength, e2.length())));
				e2Lines.append("\n");
			}
			e2 = e2Lines.toString();
			
			assertEquals(e2, e1);
			byte[] b1 = Base64.decodeLines(e1);
			byte[] b2 = apacheCoder.decode(e2.replace("\n", "").getBytes());
			
			assertArrayEquals(b0, b1);
			assertArrayEquals(b0, b2);
		}
	}
	
	/**
	 * Test encoding and decoding of longs, which was added for the Daxplore
	 * project.
	 */
	@Test
	public void testLongRandom() {
		org.apache.commons.codec.binary.Base64 apacheCoder =
				new org.apache.commons.codec.binary.Base64();
		
		Random rnd = new Random(0x8af3411e);
		for (int i = 0; i < 1000; i++) {
			long testLong;
			switch (i) {
			case 0: testLong=0; break;
			case 1: testLong=-1; break;
			case 2: testLong=Long.MAX_VALUE; break;
			case 3: testLong=Long.MIN_VALUE; break;
			default: testLong = rnd.nextLong();
			}

			String e1 = Base64.encodeLong(testLong);
			long d1 = Base64.decodeLong(e1);
			assertEquals(testLong, d1);
			
			byte[] bytes = ByteBuffer.allocate(8).putLong(testLong).array();
			int firstRelevantByte = 0;
			for (; firstRelevantByte<bytes.length && bytes[firstRelevantByte]==0; firstRelevantByte++) {
			}
			bytes = Arrays.copyOfRange(bytes, firstRelevantByte, bytes.length);
			String e2 = new String(apacheCoder.encode(bytes));
			
			bytes = apacheCoder.decode(e2.getBytes());
			ByteBuffer bb = ByteBuffer.allocate(8);
			bb.position(8-bytes.length);
			bb.put(bytes);
			assertEquals(testLong, bb.getLong(0));
			
			assertEquals(e2, e1);
		}
	}
}

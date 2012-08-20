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

import java.io.IOException;
import java.util.Random;
import static org.junit.Assert.fail;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertArrayEquals;
import org.junit.Test;

public class Base64Test {

	/**
	 * Test Base64Coder with constant strings using an example from RFC 2617.
	 */
	@Test
	public void test1() {
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
	 * Test Base64Coder against sun.misc.BASE64Encoder/Decoder with random data.
	 * 
	 * <p>Line length below 76, as the Sun encoder adds a CR/LF when a line is
	 * longer.</p>
	 * 
	 * @throws IOException
	 *             Thrown by the Sun decoder
	 */
	@Test
	public void test2() throws IOException {
		final int maxLineLen = 76 - 1;
		final int maxDataBlockLen = (maxLineLen * 3) / 4;
		sun.misc.BASE64Encoder sunEncoder = new sun.misc.BASE64Encoder();
		sun.misc.BASE64Decoder sunDecoder = new sun.misc.BASE64Decoder();
		Random rnd = new Random(0x538afb92);
		for (int i = 0; i < 50000; i++) {
			int len = rnd.nextInt(maxDataBlockLen + 1);
			byte[] b0 = new byte[len];
			rnd.nextBytes(b0);
			String e1 = new String(Base64.encode(b0));
			String e2 = sunEncoder.encode(b0);
			assertEquals(e2, e1);
			byte[] b1 = Base64.decode(e1);
			byte[] b2 = sunDecoder.decodeBuffer(e2);
			assertArrayEquals(b0, b1);
			assertArrayEquals(b0, b2);
		}
	}

	/**
	 * Test Base64Coder line encoding/decoding against
	 * sun.misc.BASE64Encoder/Decoder with random data.
	 * 
	 * @throws IOException
	 *             Thrown by the Sun decoder
	 */
	@Test
	public void test3() throws IOException {
		final int maxDataBlockLen = 512;
		sun.misc.BASE64Encoder sunEncoder = new sun.misc.BASE64Encoder();
		sun.misc.BASE64Decoder sunDecoder = new sun.misc.BASE64Decoder();
		Random rnd = new Random(0x39ac7d6e);
		for (int i = 0; i < 10000; i++) {
			int len = rnd.nextInt(maxDataBlockLen + 1);
			byte[] b0 = new byte[len];
			rnd.nextBytes(b0);
			String e1 = new String(Base64.encodeLines(b0));
			String e2 = sunEncoder.encodeBuffer(b0);
			assertEquals(e2, e1);
			byte[] b1 = Base64.decodeLines(e1);
			byte[] b2 = sunDecoder.decodeBuffer(e2);
			assertArrayEquals(b0, b1);
			assertArrayEquals(b0, b2);
		}
	}

}

/**
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.server.upload;

import static org.junit.Assert.assertArrayEquals;

import java.io.IOException;
import java.util.Random;

import org.daxplore.presenter.server.storage.StaticFileItemStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import com.google.appengine.tools.development.testing.LocalBlobstoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalFileServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;

public class UploadBlobManagerTest {

	private final LocalServiceTestHelper helper =
			new LocalServiceTestHelper(
					new LocalBlobstoreServiceTestConfig(),
					new LocalFileServiceTestConfig());

	@Before
	public void setUp() {
		helper.setUp();
	}

	@After
	public void tearDown() {
		helper.tearDown();
	}

	    
	@Test
	public void test() throws IOException, InternalServerException, BadReqException {
		int dataSize = (int)Math.pow(2, 21)+123456;
		byte[] data = new byte[dataSize];
		Random random = new Random(0x556a347f);
		for (int i=0; i <dataSize; i+=4) {
			int r = random.nextInt();
			data[i+0] = (byte)(r>>24);
			data[i+1] = (byte)(r>>16);
			data[i+2] = (byte)(r>>8);
			data[i+3] = (byte)(r>>0);
		}
		
		String keyString = StaticFileItemStore.writeBlob("foo", data);
		byte[] dataCopy = StaticFileItemStore.readBlob(keyString);
		
		assertArrayEquals(data, dataCopy);
		
		StaticFileItemStore.deleteBlob(keyString);
	}

}

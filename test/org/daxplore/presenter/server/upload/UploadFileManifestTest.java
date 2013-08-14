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

import static org.junit.Assert.*;

import java.io.InputStream;
import java.util.Locale;

import org.daxplore.presenter.server.admin.UploadFileManifest;
import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.junit.Test;


public class UploadFileManifestTest {

	@Test
	public void testUploadFileManifestParsing() throws InternalServerException, BadRequestException {
		InputStream manifestInputStream = getClass().getResourceAsStream("manifest.xml");
		UploadFileManifest manifest = new UploadFileManifest(manifestInputStream);
		
		assertEquals(9, manifest.getVersionMajor());
		assertEquals(32, manifest.getVersionMinor());
		
		Locale en = new Locale("en");
		Locale sv = new Locale("sv");
		for (Locale locale : manifest.getSupportedLocales()) {
			assertTrue(locale.equals(en) || locale.equals(sv));
		}
		System.out.println("default locale: " + manifest.getDefaultLocale());
		assertTrue(manifest.getDefaultLocale().equals(en));
	}

}

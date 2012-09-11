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

import java.io.ByteArrayInputStream;
import java.util.zip.ZipInputStream;

import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.Blob;

@PersistenceCapable
public class ZipBlob {
	@PrimaryKey
	private String name;

	@Persistent
	private Blob zipFile;

	public ZipBlob() {
	}

	public ZipBlob(String name, Blob zipFile) {
		this.name = name;
		this.zipFile = zipFile;
	}

	public String getName() {
		return name;
	}
	
	public ZipInputStream getZipInputStream() {
		return new ZipInputStream(new ByteArrayInputStream(zipFile.getBytes()));
	}

}

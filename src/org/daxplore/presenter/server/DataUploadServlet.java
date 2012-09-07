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
package org.daxplore.presenter.server;

import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.servlet.ServletFileUpload;

import com.google.appengine.api.datastore.Blob;

public class DataUploadServlet extends HttpServlet {
	private static final long serialVersionUID = -7441057462034711317L;

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse res) {
		res.setStatus(HttpServletResponse.SC_OK);
	    ServletFileUpload upload = new ServletFileUpload();
	    PersistenceManager pm = PMF.get().getPersistenceManager();
		try {
			FileItemIterator iter = upload.getItemIterator(req);
			while(iter.hasNext()) {
				FileItemStream item = iter.next();
				ZipInputStream zipIn = new ZipInputStream(item.openStream());
				ZipEntry entry;
				while ((entry = zipIn.getNextEntry()) != null) {
					if(!entry.isDirectory()) {
						byte[] data = new byte[(int) entry.getSize()];
						zipIn.read(data);
						TextBlob textBlob = new TextBlob(entry.getName(), new Blob(data));
							pm.makePersistent(textBlob);
						System.out.println(entry.getName());
					}
				}
			}
		} catch (FileUploadException e) {
			e.printStackTrace();
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} catch (IOException e) {
			e.printStackTrace();
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
		} finally {
			pm.close();
		}
	}
}

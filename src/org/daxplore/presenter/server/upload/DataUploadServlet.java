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

import java.io.IOException;
import java.util.Random;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.PMF;

import com.google.appengine.api.datastore.Blob;
import com.google.appengine.api.taskqueue.Queue;
import com.google.appengine.api.taskqueue.QueueFactory;
import com.google.appengine.api.taskqueue.TaskOptions;

/**
 * A servlet for uploading data to the Daxplore Presenter.
 * 
 * <p>Accepts a single zip-file that contains all the user-specific data
 * that the Presenter will ever use. This includes texts, the statistical
 * data, settings and possibly other data like images.</p>
 * 
 * <p>An upload file can be generated using the Daxplore Producer project.</p>
 *  
 *  <p>Only accessible by administrators.</p>
 */
@SuppressWarnings("serial")
public class DataUploadServlet extends HttpServlet {

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse res) {
		res.setStatus(HttpServletResponse.SC_OK);
	    ServletFileUpload upload = new ServletFileUpload();
	    PersistenceManager pm = PMF.get().getPersistenceManager();
	    try {
			FileItemIterator fileIterator = upload.getItemIterator(req);
			if (!fileIterator.hasNext()) {
				throw new Error("Error: 0 files sent");
				//TODO user error message on not recieving any files
			}
			FileItemStream file = fileIterator.next();
			byte[] fileData = IOUtils.toByteArray(file.openStream());
			if (fileIterator.hasNext()) {
				throw new Error("Error: to many files sent");
				//TODO user error message on recieving more than one file
			}
			String key = Integer.toString(new Random().nextInt(Integer.MAX_VALUE), 36);
			ZipBlob zipBlob = new ZipBlob(key, new Blob(fileData));
			pm.makePersistent(zipBlob);
			Queue queue = QueueFactory.getQueue("upload-unpack-queue");
			queue.add(TaskOptions.Builder
					.withUrl("/admin/uploadUnpack")
					.param("key", key)
					.method(TaskOptions.Method.GET));
			// TODO give user feedback on creation of task
		} catch (FileUploadException e) {
			e.printStackTrace();
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			// TODO give user feedback on invalid file
		} catch (IOException e) {
			e.printStackTrace();
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			// TODO give user feedback on invalid file
		} finally {
			pm.close();
		}
	}
}

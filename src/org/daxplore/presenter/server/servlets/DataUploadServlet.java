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
package org.daxplore.presenter.server.servlets;

import java.io.IOException;
import java.io.InputStream;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.fileupload.util.Streams;
import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.admin.UnpackQueue;
import org.daxplore.presenter.server.servlets.DataUnpackServlet.UnpackType;
import org.daxplore.presenter.server.storage.StaticFileItemStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.shared.SharedResourceTools;

import com.google.appengine.api.blobstore.BlobKey;

/**
 * A servlet for uploading data to the Daxplore Presenter.
 * 
 * <p>Accepts a single zip-file that contains all the user-specific data
 * that the Presenter will ever use. This includes texts, the statistical
 * data, settings and possibly other data like images.</p>
 * 
 * <p>An upload file can be generated using the Daxplore Producer project.</p>
 *  
 * <p>Only accessible by administrators.</p>
 */
@SuppressWarnings("serial")
public class DataUploadServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(DataUploadServlet.class.getName());

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse res) {
		logger.log(Level.INFO, "User is uploading a new file with presenter data");
		res.setStatus(HttpServletResponse.SC_OK);
		
	    ServletFileUpload upload = new ServletFileUpload();
	    try {
			FileItemIterator fileIterator = upload.getItemIterator(req);
			String fileName = "";
			byte[] fileData = null;
			String prefix = null;
			while(fileIterator.hasNext()) {
				FileItemStream item = fileIterator.next();
				InputStream stream = item.openStream();
				if(item.isFormField()) {
					if(item.getFieldName().equals("prefix")) {
						prefix = Streams.asString(stream);
					} else {
						throw new BadReqException("Form contains extra fields");
					}
				} else {
					fileName = item.getName();
					fileData = IOUtils.toByteArray(stream);
				}
			}
			if(SharedResourceTools.isSyntacticallyValidPrefix(prefix)) {
				if(fileData!=null && !fileName.equals("")) {
					BlobKey blobKey = StaticFileItemStore.writeBlob(fileName, fileData);
					UnpackQueue unpackQueue = new UnpackQueue(prefix);
					unpackQueue.addTask(UnpackType.UNZIP_ALL, blobKey.getKeyString());
				} else {
					throw new BadReqException("No file uploaded");
				}
			} else {
				throw new BadReqException("Request made with invalid prefix: '" + prefix + "'");
			}
		} catch (FileUploadException | IOException | BadReqException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			// TODO give user feedback on invalid file
		} catch (InternalServerException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			res.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			//TODO communicate error to user
		}
	}
}

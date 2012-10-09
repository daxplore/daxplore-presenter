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
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.upload.DataUnpackServlet.UnpackType;
import org.daxplore.presenter.shared.ClientServerMessage.MESSAGE_TYPE;

import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.InternalServerErrorException;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

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
	    	UserService userService = UserServiceFactory.getUserService();
			User user = userService.getCurrentUser();
			if(user==null) {
				throw new BadRequestException("User not logged in");
			}
			String channelToken = user.getUserId(); //TODO something better
			ClientMessageSender messageSender = new ClientMessageSender(channelToken);
			
			FileItemIterator fileIterator = upload.getItemIterator(req);
			if (!fileIterator.hasNext()) {
				throw new BadRequestException("No file uploaded");
			}
			FileItemStream file = fileIterator.next();
			byte[] fileData = IOUtils.toByteArray(file.openStream());
			if (fileIterator.hasNext()) {
				throw new BadRequestException("More than one file uploaded in a single request");
			}
			BlobKey blobKey = UploadBlobManager.writeFile(file.getFieldName(), fileData);
			UnpackQueue unpackQueue = new UnpackQueue();
			unpackQueue.addTask(blobKey.getKeyString(), UnpackType.UNZIP_ALL, channelToken);
			messageSender.send(MESSAGE_TYPE.PROGRESS_UPDATE, "User is uploading a new file with presenter data");
		} catch (InternalServerErrorException e) {
			logger.log(Level.WARNING, e.getMessage(), e);
			res.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			//TODO communicate error to user
		} catch (FileUploadException e) {
			logger.log(Level.INFO, e.getMessage(), e);
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			// TODO give user feedback on invalid file
		} catch (IOException e) {
			logger.log(Level.INFO, e.getMessage(), e);
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			// TODO give user feedback on invalid file
		} catch (BadRequestException e) {
			logger.log(Level.INFO, e.getMessage(), e);
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			// TODO give user feedback on invalid file
		}
	}
}

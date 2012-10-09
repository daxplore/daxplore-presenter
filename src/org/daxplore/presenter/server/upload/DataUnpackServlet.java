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

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.PMF;
import org.daxplore.presenter.server.ServerTools;
import org.daxplore.presenter.server.StatDataItemStore;
import org.daxplore.presenter.shared.ClientMessage;
import org.daxplore.presenter.shared.ClientServerMessage.MESSAGE_TYPE;
import org.daxplore.presenter.shared.SharedTools;
import org.daxplore.shared.SharedResourceTools;

import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.InternalServerErrorException;
import com.google.appengine.api.blobstore.BlobInfoFactory;
import com.google.appengine.api.blobstore.BlobKey;

@SuppressWarnings("serial")
public class DataUnpackServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(DataUnpackServlet.class.getName());
	
	public enum UnpackType {
		UNZIP_ALL, PROPERTIES, STATISTICAL_DATA
	}
	
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse res) {
		BlobKey blobKey = new BlobKey(req.getParameter("key"));
		try {
			res.setStatus(HttpServletResponse.SC_OK);
			String channelToken = req.getParameter("channel");
			System.out.println("channel unpack: " + channelToken);
			ClientMessageSender messageSender = new ClientMessageSender(req.getParameter("channel"));
			UnpackQueue unpackQueue = new UnpackQueue();
			
			UnpackType type = UnpackType.valueOf(req.getParameter("type").toUpperCase());
			String fileName = new BlobInfoFactory().loadBlobInfo(blobKey).getFilename();
			byte[] fileData = UploadBlobManager.readFile(blobKey);
			messageSender.send(new ClientMessage(MESSAGE_TYPE.PROGRESS_UPDATE, "Unpacking: " + fileName));

			switch(type) {
			case UNZIP_ALL:
				unzipAll(fileData, unpackQueue, messageSender);
				break;
			case PROPERTIES:
				unpackPropertyFile(fileData, messageSender);
				break;
			case STATISTICAL_DATA:
				unpackStatisticalDataFile(fileName, fileData, messageSender);
				break;
			default:
			}
		
		} catch (BadRequestException e) {
			logger.log(Level.INFO, e.getMessage(), e);
			//TODO communicate error to user
		} catch (InternalServerErrorException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			//TODO communicate error to user
		} catch (Exception e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			//TODO communicate error to user
		} finally {
			// This servlet should not throw exception under any circumstance:
			// it will cause a requeue-loop in AppEngine, so we use an extra try here
			// to be on the safe side.
			try { 
				UploadBlobManager.delete(blobKey);
			} catch (Exception e) {
				logger.log(Level.SEVERE, e.getMessage(), e);
				//TODO communicate error to user
			}
		}
	}
	
	protected void unzipAll(byte[] fileData, UnpackQueue unpackQueue, ClientMessageSender messageSender)
					throws BadRequestException, InternalServerErrorException {
		LinkedHashMap<String, byte[]> fileMap = new LinkedHashMap<String, byte[]>();
		
		ZipInputStream zipIn = ServerTools.getAsZipInputStream(fileData); 
		
		// Unzip all the files and put them in a map
		try {
			ZipEntry entry;
			while ((entry = zipIn.getNextEntry()) != null) {
				if(!entry.isDirectory()) {
					byte[] data = new byte[(int) entry.getSize()];
					int read = 0;
					while (read < data.length) {
						read += zipIn.read(data, read, Math.min(1024, data.length-read));
					}
					fileMap.put(entry.getName(), data);
				}
			}
		} catch (IOException e) {
			throw new BadRequestException("Error when reading uploaded file (invalid file?)");
		}
		
		// Read the file manifest to get metadata about the file
		if (!fileMap.containsKey("manifest.xml")) {
			throw new BadRequestException("No manifest.xml found in uploaded file");
		}
		InputStream manifestStream = new ByteArrayInputStream(fileMap.get("manifest.xml"));
		UploadFileManifest manifest = new UploadFileManifest(manifestStream);
		
		
		// Check manifest content and make sure that the file is in proper order
		
		if (!ServerTools.isSupportedUploadFileVersion(manifest.getVersionMajor(), manifest.getVersionMinor())) {
			throw new BadRequestException("Unsupported file version");
		}
		
		for (String language : manifest.getLanguages()) {
			if (!ServerTools.isSupportedLanguage(language)) {
				throw new BadRequestException("Unsupported language: " + language);
			}
		}
		
		List<String> missingUploadFiles = SharedResourceTools.findMissingUploadFiles(fileMap.keySet(), manifest.getLanguages());
		if (!missingUploadFiles.isEmpty()) {
			throw new BadRequestException("Uploaded doesn't contain required files: " + SharedTools.join(missingUploadFiles, ", "));
		}
		
		List<String> unwantedUploadFiles = SharedResourceTools.findUnwantedUploadFiles(fileMap.keySet(), manifest.getLanguages());
		if (!unwantedUploadFiles.isEmpty()) {
			throw new BadRequestException("Uploaded file contains extra files: " + SharedTools.join(unwantedUploadFiles, ", "));
		}
		
		// Assume that all files are text-files and store them.
		// This should be changed if we add other kinds of data
		for (String fileName : fileMap.keySet()) {
			try {
				BlobKey blobKey = UploadBlobManager.writeFile(manifest.getPrefix() + "/" + fileName, fileMap.get(fileName));
				if(fileName.startsWith("properties/")){
					unpackQueue.addTask(blobKey.getKeyString(), UnpackType.PROPERTIES, messageSender.getChannelToken());
				} else if(fileName.startsWith("data/")) {
					unpackQueue.addTask(blobKey.getKeyString(), UnpackType.STATISTICAL_DATA, messageSender.getChannelToken());
				}
			} catch (IOException e) {
				new InternalServerErrorException(e);
			}
		}
	}
	
	
	protected void unpackPropertyFile(byte[] fileData, ClientMessageSender messageSender) {
		//TODO
	}
	
	protected void unpackStatisticalDataFile(String fileName, byte[] fileData, ClientMessageSender messageSender)
			throws BadRequestException, InternalServerErrorException {
		BufferedReader reader = ServerTools.getAsBufferedReader(fileData);
		PersistenceManager pm = PMF.get().getPersistenceManager();
		String prefix = fileName.substring(0, fileName.indexOf('/'));
		try {
			int unpacked = 0;
			String line;
			while ((line=reader.readLine())!=null) {
				int splitPoint = line.indexOf(',');
				String key = prefix + "/" + line.substring(0, splitPoint);
				String value = line.substring(splitPoint+1);
				new StatDataItemStore(key, value, pm);
				unpacked++;
			}
			messageSender.send(new ClientMessage(MESSAGE_TYPE.PROGRESS_UPDATE,
					"Unpacked " + unpacked + " statistical data items from " + fileName.substring(fileName.indexOf('/'))));
		} catch (IOException e) {
			throw new InternalServerErrorException(e);
		} finally {
			pm.close();
		}
	}
}

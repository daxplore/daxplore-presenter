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
import javax.jdo.Query;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.PMF;
import org.daxplore.presenter.server.ServerTools;
import org.daxplore.presenter.shared.ClientMessage;
import org.daxplore.presenter.shared.SharedTools;
import org.daxplore.presenter.shared.ClientServerMessage.MESSAGE_TYPE;
import org.daxplore.shared.SharedResourceTools;

import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.InternalServerErrorException;
import com.google.appengine.api.datastore.Blob;

@SuppressWarnings("serial")
public class DataUnpackServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(DataUnpackServlet.class.getName());
	
	public enum UnpackType {
		UNZIP_ALL, PROPERTIES, STATISTICAL_DATA
	}
	
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse res) {
		PersistenceManager pm = null;
		Query query = null;
		UploadBlob blob = null;
		try {
			res.setStatus(HttpServletResponse.SC_OK);
			String channelToken = req.getParameter("channel");
			System.out.println("channel unpack: " + channelToken);
			ClientMessageSender messageSender = new ClientMessageSender(req.getParameter("channel"));
			UnpackQueue unpackQueue = new UnpackQueue();
			UnpackType type = UnpackType.valueOf(req.getParameter("type"));
			String datastoreKey = req.getParameter("key");
			
			pm = PMF.get().getPersistenceManager();
			query = pm.newQuery(UploadBlob.class);
			query.setFilter("name == nameParam");
			query.declareParameters("String nameParam");
			
		
			@SuppressWarnings("unchecked")
			List<UploadBlob> dataBlobs = (List<UploadBlob>) query.execute(datastoreKey);
			if (dataBlobs.isEmpty()) {
				throw new InternalServerErrorException("The file to be unpacked could not be found");
			} else if (dataBlobs.size() >= 2) {
				throw new InternalServerErrorException("Multiple uploaded files have the same key");
			}
			blob = dataBlobs.get(0);
			System.out.println("reading file: " + blob.getName());
			switch(type) {
			case UNZIP_ALL:
				unzipAll(blob, pm, unpackQueue, messageSender);
				break;
			case PROPERTIES:
				unpackPropertyFile(blob, pm, unpackQueue, messageSender);
				break;
			case STATISTICAL_DATA:
				unpackStatisticalDataFile(blob, pm, unpackQueue, messageSender);
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
				if(query!=null) {
					query.closeAll();
				}
				if(blob != null) {
					pm.deletePersistent(blob);
				}
				if(pm != null) {
					pm.close();
				}
			} catch (Exception e) {
				logger.log(Level.SEVERE, e.getMessage(), e);
				//TODO communicate error to user
			}
		}
	}
	
	protected void unzipAll(UploadBlob fileBlob, PersistenceManager pm,
			UnpackQueue unpackQueue, ClientMessageSender messageSender)
					throws BadRequestException, InternalServerErrorException {
		LinkedHashMap<String, byte[]> fileMap = new LinkedHashMap<String, byte[]>();
		
		ZipInputStream zipIn = fileBlob.getAsZipInputStream(); 
		
		// Unzip all the files and put them in a map
		try {
			ZipEntry entry;
			while ((entry = zipIn.getNextEntry()) != null) {
				if(!entry.isDirectory()) {
					byte[] data = new byte[(int) entry.getSize()];
					zipIn.read(data);
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
		for (String filename : fileMap.keySet()) {
			String datastoreKey = manifest.getPrefix() + "/" + filename;
			Blob fileDataBlob = new Blob(fileMap.get(filename));
			UploadBlob textBlob = new UploadBlob(datastoreKey, fileDataBlob);
			pm.makePersistent(textBlob);
			if(filename.startsWith("properties/")){
				unpackQueue.addTask(datastoreKey, UnpackType.PROPERTIES, messageSender.getChannelToken());
			} else if(filename.startsWith("data/")) {
				unpackQueue.addTask(datastoreKey, UnpackType.STATISTICAL_DATA, messageSender.getChannelToken());
			}
		}
	}
	
	
	protected void unpackPropertyFile(UploadBlob fileBlob, PersistenceManager pm,
			UnpackQueue unpackQueue, ClientMessageSender messageSender) {
		//TODO
	}
	
	protected void unpackStatisticalDataFile(UploadBlob fileBlob, PersistenceManager pm,
			UnpackQueue unpackQueue, ClientMessageSender messageSender) throws BadRequestException, InternalServerErrorException {
		System.out.println("Unpacking data: " + fileBlob.getName());
		BufferedReader reader = fileBlob.getAsReader();
		String line;
		try {
			while ((line=reader.readLine())!=null) {
				if (line.length()>100) {
					line = line.substring(0,  100);
				}
				messageSender.send(new ClientMessage(MESSAGE_TYPE.PROGRESS_UPDATE, line));
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}

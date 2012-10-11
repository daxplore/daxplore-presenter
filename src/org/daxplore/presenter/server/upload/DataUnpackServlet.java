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
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedList;
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
import org.daxplore.presenter.server.storage.SettingItemStore;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.storage.StaticFileItemStore;
import org.daxplore.presenter.server.storage.BlobManager;
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
		UNZIP_ALL, PROPERTIES, STATIC_FILE, STATISTICAL_DATA
	}
	
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse res) {
		String prefix = req.getParameter("prefix");
		UnpackType type = UnpackType.valueOf(req.getParameter("type").toUpperCase());
		BlobKey blobKey = new BlobKey(req.getParameter("key"));
		String channelToken = req.getParameter("channel");
		
		try {
			res.setStatus(HttpServletResponse.SC_OK);
			
			System.out.println("channel unpack: " + channelToken);
			ClientMessageSender messageSender = new ClientMessageSender(req.getParameter("channel"));
			
			String fileName = new BlobInfoFactory().loadBlobInfo(blobKey).getFilename();
			byte[] fileData = BlobManager.readFile(blobKey);
			messageSender.send(new ClientMessage(MESSAGE_TYPE.PROGRESS_UPDATE, "Unpacking: " + fileName));

			switch(type) {
			case UNZIP_ALL:
				purgeExistingData(messageSender);
				unzipAll(fileData, messageSender);
				break;
			case PROPERTIES:
				unpackPropertyFile(prefix, fileName, fileData, messageSender);
				break;
			case STATIC_FILE:
				unpackStaticFile(prefix, fileName, blobKey, messageSender);
				break;
			case STATISTICAL_DATA:
				unpackStatisticalDataFile(prefix, fileData, messageSender);
				break;
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
				BlobManager.delete(blobKey);
			} catch (Exception e) {
				logger.log(Level.SEVERE, e.getMessage(), e);
				//TODO communicate error to user
			}
		}
	}
	
	protected void purgeExistingData(ClientMessageSender messageSender) throws InternalServerErrorException {
		PersistenceManager pm = PMF.get().getPersistenceManager();
		long time = System.currentTimeMillis();
		
		long deletedStatDataItems = pm.newQuery(StatDataItemStore.class).deletePersistentAll();
		messageSender.send(MESSAGE_TYPE.PROGRESS_UPDATE, "Removed " + deletedStatDataItems + " old statistical data items");
		
		long deletedSettingItems = pm.newQuery(SettingItemStore.class).deletePersistentAll();
		messageSender.send(MESSAGE_TYPE.PROGRESS_UPDATE, "Removed " + deletedSettingItems + " old settings");
		
		@SuppressWarnings("unchecked")
		List<StaticFileItemStore> fileItems = (List<StaticFileItemStore>)pm.newQuery(StaticFileItemStore.class).execute();
		for (StaticFileItemStore item : fileItems) {
			BlobManager.delete(item.getBlobKey());
		}
		long deletedStaticFileItems = pm.newQuery(StaticFileItemStore.class).deletePersistentAll();
		messageSender.send(MESSAGE_TYPE.PROGRESS_UPDATE, "Removed " + deletedStaticFileItems + " old static files");
		long totalDeleted = deletedStatDataItems + deletedSettingItems + deletedStaticFileItems;
		logger.log(Level.INFO, "Deleted " + totalDeleted + " old data items in " + ((System.currentTimeMillis()-time)/Math.pow(10, 6)) + "seconds");
	}
	
	protected void unzipAll(byte[] fileData, ClientMessageSender messageSender)
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
		
		UnpackQueue unpackQueue = new UnpackQueue(manifest.getPrefix(), messageSender.getChannelToken());
		for (String fileName : fileMap.keySet()) {
			try {
				BlobKey blobKey = BlobManager.writeFile(manifest.getPrefix() + "/" + fileName, fileMap.get(fileName));
				if(fileName.startsWith("properties/")){
					unpackQueue.addTask(UnpackType.PROPERTIES, blobKey.getKeyString());
				} else if(fileName.startsWith("data/")) {
					unpackQueue.addTask(UnpackType.STATISTICAL_DATA, blobKey.getKeyString());
				} else if(fileName.startsWith("static/")) {
					unpackQueue.addTask(UnpackType.STATIC_FILE, blobKey.getKeyString());
				}
			} catch (IOException e) {
				new InternalServerErrorException(e);
			}
		}
	}
	
	
	protected void unpackPropertyFile(String prefix, String fileName, byte[] fileData, ClientMessageSender messageSender)
			throws BadRequestException, InternalServerErrorException {
		BufferedReader reader = ServerTools.getAsBufferedReader(fileData);
		PersistenceManager pm = PMF.get().getPersistenceManager();
		try {
			int count = 0;
			String line;
			while ((line=reader.readLine())!=null) {
				
				// Assumes that the data is in a "key = value\n" format
				int splitPoint = line.indexOf('=');
				String key = line.substring(0, splitPoint).trim();
				key = prefix + "/" + fileName + "/" + key;
				String value = line.substring(splitPoint+1).trim();
				
				pm.makePersistent(new SettingItemStore(key, value));
				count++;
			}
			messageSender.send(MESSAGE_TYPE.PROGRESS_UPDATE,
					"Unpacked " + count + " properties!");
		} catch (IOException e) {
			throw new InternalServerErrorException(e);
		} finally {
			pm.close();
		}
	}

	protected void unpackStaticFile(String prefix, String fileName, BlobKey blobKey, ClientMessageSender messageSender)
			throws BadRequestException, InternalServerErrorException {
		PersistenceManager pm = PMF.get().getPersistenceManager();
		String datstoreKey = prefix + "/" + fileName;
		pm.makePersistent(new StaticFileItemStore(datstoreKey, blobKey));
		pm.close();
		messageSender.send(MESSAGE_TYPE.PROGRESS_UPDATE,
				"Stored the static file " + fileName);
	}
	
	protected void unpackStatisticalDataFile(String prefix, byte[] fileData, ClientMessageSender messageSender)
			throws BadRequestException, InternalServerErrorException {
		long time = System.currentTimeMillis();
		BufferedReader reader = ServerTools.getAsBufferedReader(fileData);
		PersistenceManager pm = PMF.get().getPersistenceManager();
		try {
			int count = 0;
			String line;
			Collection<StatDataItemStore> items = new LinkedList<StatDataItemStore>(); 
			while ((line=reader.readLine())!=null) {
				// Assumes that the data is in a "key,json\n" format
				int splitPoint = line.indexOf(',');
				String key = prefix + "/" + line.substring(0, splitPoint);
				String json = line.substring(splitPoint+1);
				json = json.substring(1, json.length() - 1);
				json = json.replaceAll("\"\"", "\"");
				items.add(new StatDataItemStore(key, json));
				count++;
			}
			pm.makePersistentAll(items);
			time = System.currentTimeMillis()-time;
			String message = "Unpacked " + count + " statistical data items in " + (time/Math.pow(10, 6)) + " seconds";
			logger.log(Level.INFO, message);
			messageSender.send(MESSAGE_TYPE.PROGRESS_UPDATE, message);
		} catch (IOException e) {
			throw new InternalServerErrorException(e);
		} finally {
			pm.close();
		}
	}
}

package org.daxplore.presenter.server.servlets;
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

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.ServerTools;
import org.daxplore.presenter.server.admin.ClientMessageSender;
import org.daxplore.presenter.server.admin.UnpackQueue;
import org.daxplore.presenter.server.admin.UploadFileManifest;
import org.daxplore.presenter.server.storage.DeleteData;
import org.daxplore.presenter.server.storage.LocaleStore;
import org.daxplore.presenter.server.storage.PMF;
import org.daxplore.presenter.server.storage.PrefixStore;
import org.daxplore.presenter.server.storage.SettingItemStore;
import org.daxplore.presenter.server.storage.StatDataItemStore;
import org.daxplore.presenter.server.storage.StaticFileItemStore;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.presenter.shared.ClientMessage;
import org.daxplore.presenter.shared.ClientServerMessage.MessageType;
import org.daxplore.presenter.shared.SharedTools;
import org.daxplore.shared.SharedResourceTools;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;

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
		String blobKeyString = req.getParameter("key");
		BlobKey blobKey = new BlobKey(blobKeyString);
		String channelToken = req.getParameter("channel");
		
		try {
			res.setStatus(HttpServletResponse.SC_OK);
			
			ClientMessageSender messageSender = new ClientMessageSender(channelToken);
			
			//the filename always starts with prefix#, except for the original uploadfile
			String fileName = new BlobInfoFactory().loadBlobInfo(blobKey).getFilename(); 
			messageSender.send(new ClientMessage(MessageType.PROGRESS_UPDATE, "Unpacking: " + fileName));

			switch(type) {
			case UNZIP_ALL:
				byte[] fileData = StaticFileItemStore.readBlob(blobKey);
				unzipAll(prefix, fileData, messageSender);
				break;
			case PROPERTIES:
				fileData = StaticFileItemStore.readBlob(blobKey);
				unpackPropertyFile(fileName, fileData, messageSender);
				break;
			case STATIC_FILE:
				unpackStaticFile(fileName, blobKeyString, messageSender);
				break;
			case STATISTICAL_DATA:
				fileData = StaticFileItemStore.readBlob(blobKey);
				unpackStatisticalDataFile(prefix, fileData, messageSender);
				break;
			}
		
		} catch (InternalServerException e) {
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
				if(type!=UnpackType.STATIC_FILE) { // if static file, keep it in the store
					StaticFileItemStore.deleteBlob(blobKey);
				}
			} catch (Exception e) {
				logger.log(Level.SEVERE, e.getMessage(), e);
				//TODO communicate error to user
			}
		}
	}
	
	protected void enqueueForUnpacking(UnpackQueue unpackQueue, String fileName, BlobKey blobKey) {
		if(fileName.startsWith("properties/")){
			unpackQueue.addTask(UnpackType.PROPERTIES, blobKey.getKeyString());
		} else if(fileName.startsWith("data/")) {
			unpackQueue.addTask(UnpackType.STATISTICAL_DATA, blobKey.getKeyString());
		} else if(fileName.startsWith("meta/")) {
			unpackQueue.addTask(UnpackType.STATIC_FILE, blobKey.getKeyString());
		}
	}
	
	protected void unzipAll(String prefix, byte[] fileData, ClientMessageSender messageSender)
					throws BadReqException, InternalServerException {
		LinkedHashMap<String, byte[]> fileMap = new LinkedHashMap<String, byte[]>();
		
		ZipInputStream zipIn = ServerTools.getAsZipInputStream(fileData);
		// Unzip all the files and put them in a map
		try {
			ZipEntry entry;
			while ((entry = zipIn.getNextEntry()) != null) {
				if(entry.getSize()>0 && !entry.isDirectory()) {
					byte[] data = IOUtils.toByteArray(zipIn);
					fileMap.put(entry.getName(), data);
				}
			}
		} catch (IOException e) {
			throw new BadReqException("Error when reading uploaded file (invalid file?)");
		}
		
		// Read the file manifest to get metadata about the file
		if (!fileMap.containsKey("manifest.xml")) {
			throw new BadReqException("No manifest.xml found in uploaded file");
		}
		InputStream manifestStream = new ByteArrayInputStream(fileMap.get("manifest.xml"));
		UploadFileManifest manifest = new UploadFileManifest(manifestStream);
		
		
		// Check manifest content and make sure that the file is in proper order
		
		if (!ServerTools.isSupportedUploadFileVersion(manifest.getVersionMajor(), manifest.getVersionMinor())) {
			throw new BadReqException("Unsupported file version");
		}
		
		for (Locale locale : manifest.getSupportedLocales()) {
			if (!ServerTools.isSupportedLocale(locale)) {
				throw new BadReqException("Unsupported language: " + locale.toLanguageTag());
			}
		}
		
		List<String> missingUploadFiles = SharedResourceTools.findMissingUploadFiles(fileMap.keySet(), manifest.getSupportedLocales());
		if (!missingUploadFiles.isEmpty()) {
			throw new BadReqException("Uploaded doesn't contain required files: " + SharedTools.join(missingUploadFiles, ", "));
		}
		
		List<String> unwantedUploadFiles = SharedResourceTools.findUnwantedUploadFiles(fileMap.keySet(), manifest.getSupportedLocales());
		if (!unwantedUploadFiles.isEmpty()) {
			throw new BadReqException("Uploaded file contains extra files: " + SharedTools.join(unwantedUploadFiles, ", "));
		}
		
		PersistenceManager pm = PMF.get().getPersistenceManager();
		
		// Purge all existing data that uses this prefix
		String deleteResult = DeleteData.deleteForPrefix(pm, prefix);
		messageSender.send(MessageType.PROGRESS_UPDATE, deleteResult);
		
		
		// Since we just deleted the prefix and all it's data, we have to add it again
		pm.makePersistent(new PrefixStore(prefix));
		logger.log(Level.INFO, "Added prefix to system: " + prefix);
		messageSender.send(MessageType.PROGRESS_UPDATE, "Added prefix to system: " + prefix);
		
		LocaleStore localeStore = new LocaleStore(prefix, manifest.getSupportedLocales(), manifest.getDefaultLocale());
		pm.makePersistent(localeStore);
		
		pm.close();
		UnpackQueue unpackQueue = new UnpackQueue(prefix, messageSender.getChannelToken());
		for (String fileName : fileMap.keySet()) {
			BlobKey blobKey = StaticFileItemStore.writeBlob(prefix + "#" + fileName, fileMap.get(fileName));
			enqueueForUnpacking(unpackQueue, fileName, blobKey);
		}
	}
	
	
	protected void unpackPropertyFile(String fileName, byte[] fileData, ClientMessageSender messageSender)
			throws InternalServerException {
		BufferedReader reader = ServerTools.getAsBufferedReader(fileData);
		PersistenceManager pm = PMF.get().getPersistenceManager();
		try {
			int count = 0;
			String line;
			while ((line=reader.readLine())!=null) {
				
				// Assumes that the data is in a "key = value\n" format
				int splitPoint = line.indexOf('=');
				String key = line.substring(0, splitPoint).trim();
				key = fileName.substring(0, fileName.lastIndexOf('.')) + "/" + key;
				String value = line.substring(splitPoint+1).trim();
				
				pm.makePersistent(new SettingItemStore(key, value));
				count++;
			}
			messageSender.send(MessageType.PROGRESS_UPDATE, "Unpacked " + count + " properties!");
		} catch (IOException e) {
			throw new InternalServerException("Failed to unpack property file", e);
		} finally {
			pm.close();
		}
	}

	protected void unpackStaticFile(String fileName, String blobKey, ClientMessageSender messageSender)
			throws InternalServerException {
		PersistenceManager pm = PMF.get().getPersistenceManager();
		String datstoreKey = fileName;
		StaticFileItemStore item = new StaticFileItemStore(datstoreKey, blobKey); 
		pm.makePersistent(item);
		pm.close();
		messageSender.send(MessageType.PROGRESS_UPDATE, "Stored the static file " + fileName);
	}
	
	protected void unpackStatisticalDataFile(String prefix, byte[] fileData, ClientMessageSender messageSender)
			throws InternalServerException {
		long time = System.currentTimeMillis();
		BufferedReader reader = ServerTools.getAsBufferedReader(fileData);
		PersistenceManager pm = PMF.get().getPersistenceManager();
		Collection<StatDataItemStore> items = new LinkedList<StatDataItemStore>(); 
		JSONArray dataArray = (JSONArray)JSONValue.parse(reader);
		for(Object v : dataArray) {
			JSONObject entry = (JSONObject)v;
			String key = String.format("%s#Q=%s&P=%s", prefix, entry.get("q"), entry.get("p"));
			String value = ((JSONObject)entry.get("values")).toJSONString();
			items.add(new StatDataItemStore(key, value));
		}
		pm.makePersistentAll(items);
		time = System.currentTimeMillis()-time;
		String message = "Unpacked " + items.size() + " statistical data items in " + (time/Math.pow(10, 6)) + " seconds";
		logger.log(Level.INFO, message);
		messageSender.send(MessageType.PROGRESS_UPDATE, message);
	}
}

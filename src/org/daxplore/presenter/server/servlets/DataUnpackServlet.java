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
import org.daxplore.presenter.shared.SharedTools;
import org.daxplore.shared.SharedResourceTools;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;

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
		String blobKey = req.getParameter("key");
		String filename = StaticFileItemStore.getFilename(blobKey);
		
		try {
			res.setStatus(HttpServletResponse.SC_OK);
			
			switch(type) {
			case UNZIP_ALL:
				byte[] fileData = StaticFileItemStore.readBlob(blobKey);
				unzipAll(prefix, fileData);
				break;
			case PROPERTIES:
				fileData = StaticFileItemStore.readBlob(blobKey);
				unpackPropertyFile(filename, fileData);
				break;
			case STATIC_FILE:
				unpackStaticFile(filename, blobKey);
				break;
			case STATISTICAL_DATA:
				fileData = StaticFileItemStore.readBlob(blobKey);
				unpackStatisticalDataFile(prefix, fileData);
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
	
	protected void enqueueForUnpacking(UnpackQueue unpackQueue, String fileName, String blobKey) {
		if(fileName.startsWith("properties/")){
			unpackQueue.addTask(UnpackType.PROPERTIES, blobKey);
		} else if(fileName.startsWith("data/")) {
			unpackQueue.addTask(UnpackType.STATISTICAL_DATA, blobKey);
		} else if(fileName.startsWith("meta/")) {
			unpackQueue.addTask(UnpackType.STATIC_FILE, blobKey);
		}
	}
	
	protected void unzipAll(String prefix, byte[] fileData)
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
		
		// Purge all existing data that uses this prefix, but save gaID
		String gaID = SettingItemStore.getProperty(pm, prefix, "adminpanel", "gaID");
		String statStoreKey = prefix + "#adminpanel/gaID";
		String deleteResult = DeleteData.deleteForPrefix(pm, prefix);
		pm.makePersistent(new SettingItemStore(statStoreKey, gaID));
		logger.log(Level.INFO, deleteResult);
		
		// Since we just deleted the prefix and all it's data, we have to add it again
		pm.makePersistent(new PrefixStore(prefix));
		logger.log(Level.INFO, "Added prefix to system: " + prefix);
		
		LocaleStore localeStore = new LocaleStore(prefix, manifest.getSupportedLocales(), manifest.getDefaultLocale());
		pm.makePersistent(localeStore);
		
		pm.close();
		UnpackQueue unpackQueue = new UnpackQueue(prefix);
		for (String fileName : fileMap.keySet()) {
			String blobKey = StaticFileItemStore.writeBlob(prefix + "#" + fileName, fileMap.get(fileName));
			enqueueForUnpacking(unpackQueue, fileName, blobKey);
		}
	}
	
	
	protected void unpackPropertyFile(String fileName, byte[] fileData)
			throws InternalServerException, BadReqException {
		String[] propertiesWhitelist = {"page_title", "secondary_flag", "timepoint_0", "timepoint_1"};
		long time = System.currentTimeMillis();
		BufferedReader reader = ServerTools.getAsBufferedReader(fileData);
		PersistenceManager pm = PMF.get().getPersistenceManager();
		List<SettingItemStore> items = new LinkedList<SettingItemStore>();
		JSONObject dataMap = (JSONObject)JSONValue.parse(reader);
		for(String prop : propertiesWhitelist) {
			String key = fileName.substring(0, fileName.lastIndexOf('.')) + "/" + prop;
			String value = (String)dataMap.get(prop);
			if(value==null){
				throw new BadReqException("Missing property '"+key+"' in upload file");
			}
			items.add(new SettingItemStore(key, value));
		}
		pm.makePersistentAll(items);
		time = System.currentTimeMillis()-time;
		String message = "Set " + propertiesWhitelist.length + " properties in " + (time/Math.pow(10, 6)) + " seconds";
		logger.log(Level.INFO, message);
	}

	protected void unpackStaticFile(String fileName, String blobKey)
			throws InternalServerException {
		PersistenceManager pm = PMF.get().getPersistenceManager();
		String datstoreKey = fileName;
		StaticFileItemStore item = new StaticFileItemStore(datstoreKey, blobKey); 
		pm.makePersistent(item);
		pm.close();
		String message = "Stored the static file " + fileName;
		logger.log(Level.INFO, message);
	}
	
	protected void unpackStatisticalDataFile(String prefix, byte[] fileData)
			throws InternalServerException {
		long time = System.currentTimeMillis();
		BufferedReader reader = ServerTools.getAsBufferedReader(fileData);
		PersistenceManager pm = PMF.get().getPersistenceManager();
		List<StatDataItemStore> items = new LinkedList<StatDataItemStore>(); 
		JSONArray dataArray = (JSONArray)JSONValue.parse(reader);
		for(Object v : dataArray) {
			JSONObject entry = (JSONObject)v;
			String key = String.format("%s#Q=%s&P=%s", prefix, entry.get("q"), entry.get("p"));
			String value = entry.toJSONString();
			items.add(new StatDataItemStore(key, value));
		}
		pm.makePersistentAll(items);
		time = System.currentTimeMillis()-time;
		String message = "Unpacked " + items.size() + " statistical data items in " + (time/Math.pow(10, 6)) + " seconds";
		logger.log(Level.INFO, message);
	}
}

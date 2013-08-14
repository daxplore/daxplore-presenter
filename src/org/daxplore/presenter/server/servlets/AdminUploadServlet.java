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

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
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

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.fileupload.util.Streams;
import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.ServerTools;
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

import com.google.apphosting.api.DeadlineExceededException;

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
public class AdminUploadServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(AdminUploadServlet.class.getName());
	
	@Override
	public void doPost(HttpServletRequest request, HttpServletResponse response) {
		try {
			long time = System.nanoTime();
			int statusCode = HttpServletResponse.SC_OK;
			response.setContentType("text/html; charset=UTF-8");
			
		    ServletFileUpload upload = new ServletFileUpload();
		    PersistenceManager pm = null;
		    String prefix = null;
		    PrintWriter resWriter = null;
		    try {
		    	try {
		    		resWriter = response.getWriter();
		    	} catch (IOException e1) {
		    		throw new InternalServerException(e1);
		    	}
				FileItemIterator fileIterator = upload.getItemIterator(request);
				String fileName = "";
				byte[] fileData = null;
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
						 pm = PMF.get().getPersistenceManager();
						unzipAll(pm, prefix, fileData);
					} else {
						throw new BadReqException("No file uploaded");
					}
				} else {
					throw new BadReqException("Request made with invalid prefix: '" + prefix + "'");
				}
				logger.log(Level.INFO, "Unpacked new data for prefix '" + prefix + "' in " + ((System.nanoTime()-time)/1000000000.0) + " seconds"); //TODO tmp
			} catch (FileUploadException | IOException | BadReqException e) {
				logger.log(Level.WARNING, e.getMessage(), e);
				statusCode = HttpServletResponse.SC_BAD_REQUEST;
			} catch (InternalServerException e) {
				logger.log(Level.SEVERE, e.getMessage(), e);
				statusCode = HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
			} catch (DeadlineExceededException e) {
				logger.log(Level.SEVERE, "Timeout when uploading new data for prefix '" + prefix + "'", e);
				// the server is currently unavailable because it is overloaded (hopefully)
				statusCode = HttpServletResponse.SC_SERVICE_UNAVAILABLE;
			} finally {
				if(pm!=null) {
					pm.close();
				}
			}
		    response.setStatus(statusCode);
		    if(resWriter != null) {
			    resWriter.write(Integer.toString(statusCode));
			    resWriter.close();
		    }
		} catch (Exception e) {
			logger.log(Level.SEVERE, "Unexpected exception: " + e.getMessage(), e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		}
	}
	
	private void unzipAll(PersistenceManager pm, String prefix, byte[] fileData) throws BadReqException, InternalServerException {
		LinkedHashMap<String, byte[]> fileMap = new LinkedHashMap<String, byte[]>();

		ZipInputStream zipIn = ServerTools.getAsZipInputStream(fileData);
		// Unzip all the files and put them in a map
		try {
			ZipEntry entry;
			while ((entry = zipIn.getNextEntry()) != null) {
				if (entry.getSize() > 0 && !entry.isDirectory()) {
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

		List<String> missingUploadFiles = SharedResourceTools.findMissingUploadFiles(fileMap.keySet(),
				manifest.getSupportedLocales());
		if (!missingUploadFiles.isEmpty()) {
			throw new BadReqException("Uploaded doesn't contain required files: "
					+ SharedTools.join(missingUploadFiles, ", "));
		}

		List<String> unwantedUploadFiles = SharedResourceTools.findUnwantedUploadFiles(fileMap.keySet(),
				manifest.getSupportedLocales());
		if (!unwantedUploadFiles.isEmpty()) {
			throw new BadReqException("Uploaded file contains extra files: "
					+ SharedTools.join(unwantedUploadFiles, ", "));
		}

		// Purge all existing data that uses this prefix, but save gaID
		String gaID = SettingItemStore.getProperty(pm, prefix, "adminpanel", "gaID");
		String statStoreKey = prefix + "#adminpanel/gaID";
		String deleteResult = DeleteData.deleteForPrefix(pm, prefix);
		pm.makePersistent(new SettingItemStore(statStoreKey, gaID));
		logger.log(Level.INFO, deleteResult);

		// Since we just deleted the prefix and all it's data, we have to add it
		// again
		pm.makePersistent(new PrefixStore(prefix));
		logger.log(Level.INFO, "Added prefix to system: '" + prefix + "'");

		LocaleStore localeStore = new LocaleStore(prefix, manifest.getSupportedLocales(), manifest.getDefaultLocale());
		pm.makePersistent(localeStore);
		logger.log(Level.INFO, "Added locale settings for prefix '" + prefix + "'");

		for (String fileName : fileMap.keySet()) {
			String storeName = prefix + "#" + fileName;
			if(fileName.startsWith("properties/")){
				unpackPropertyFile(pm, storeName, fileMap.get(fileName));
			} else if(fileName.startsWith("data/")) {
				unpackStatisticalDataFile(pm, storeName, fileMap.get(fileName));
			} else if(fileName.startsWith("meta/")) {
				unpackStaticFile(pm, storeName, fileMap.get(fileName));
			}
		}
	}

	private void unpackPropertyFile(PersistenceManager pm, String fileName, byte[] fileData) throws InternalServerException, BadReqException {
		String[] propertiesWhitelist = { "page_title", "secondary_flag", "timepoint_0", "timepoint_1" };
		BufferedReader reader = ServerTools.getAsBufferedReader(fileData);
		List<SettingItemStore> items = new LinkedList<SettingItemStore>();
		JSONObject dataMap = (JSONObject) JSONValue.parse(reader);
		for (String prop : propertiesWhitelist) {
			String key = fileName.substring(0, fileName.lastIndexOf('.')) + "/" + prop;
			String value = (String) dataMap.get(prop);
			if (value == null) {
				throw new BadReqException("Missing property '" + key + "' in upload file");
			}
			items.add(new SettingItemStore(key, value));
		}
		pm.makePersistentAll(items);
		logger.log(Level.INFO, "Set " + propertiesWhitelist.length + " properties from the file '" + fileName + "'");
	}

	private void unpackStaticFile(PersistenceManager pm, String fileName, byte[] fileData) throws InternalServerException {
		String blobKey = StaticFileItemStore.writeBlob(fileName, fileData);
		StaticFileItemStore item = new StaticFileItemStore(fileName, blobKey);
		pm.makePersistent(item);
		logger.log(Level.INFO, "Stored the static file '" + fileName + "'");
	}

	private void unpackStatisticalDataFile(PersistenceManager pm, String prefix, byte[] fileData) throws InternalServerException {
		BufferedReader reader = ServerTools.getAsBufferedReader(fileData);
		List<StatDataItemStore> items = new LinkedList<StatDataItemStore>();
		JSONArray dataArray = (JSONArray) JSONValue.parse(reader);
		for (Object v : dataArray) {
			JSONObject entry = (JSONObject) v;
			String key = String.format("%s#Q=%s&P=%s", prefix, entry.get("q"), entry.get("p"));
			String value = entry.toJSONString();
			items.add(new StatDataItemStore(key, value));
		}
		pm.makePersistentAll(items);
		logger.log(Level.INFO, "Stored " + items.size() + " statistical data items for prefix '" + prefix + "'");
	}
}

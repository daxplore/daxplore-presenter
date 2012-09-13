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
import org.daxplore.presenter.server.TextBlob;
import org.daxplore.presenter.shared.SharedTools;
import org.daxplore.shared.SharedResourceTools;

import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.InternalServerErrorException;
import com.google.appengine.api.datastore.Blob;

@SuppressWarnings("serial")
public class DataUnpackServlet extends HttpServlet {
	protected static Logger logger = Logger.getLogger(DataUnpackServlet.class.getName());

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse res) {
		res.setStatus(HttpServletResponse.SC_OK);
		PersistenceManager pm = PMF.get().getPersistenceManager();
		Query query = pm.newQuery(ZipBlob.class);
		query.setFilter("name == nameParam");
		query.declareParameters("String nameParam");
		ZipBlob zipBlob = null;
		try {
			String key = req.getParameter("key");
			LinkedHashMap<String, byte[]> fileMap = new LinkedHashMap<String, byte[]>();
			
			// Get the uploaded file
			@SuppressWarnings("unchecked")
			List<ZipBlob> zipBlobs = (List<ZipBlob>) query.execute(key);
			if (zipBlobs.isEmpty()) {
				throw new InternalServerErrorException("The file to be unpacked could not be found");
			} else if (zipBlobs.size() >= 2) {
				throw new InternalServerErrorException("Multiple uploaded files have the same key");
			}
			zipBlob = zipBlobs.get(0);
			ZipInputStream zipIn = zipBlob.getZipInputStream(); 
			
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
			for (String fileName : fileMap.keySet()) {
				String dataStoreKey = manifest.getPrefix() + "-" + fileName;
				Blob fileDataBlob = new Blob(fileMap.get(fileName));
				TextBlob textBlob = new TextBlob(dataStoreKey, fileDataBlob);
				pm.makePersistent(textBlob);
			}
		} catch (BadRequestException e) {
			logger.log(Level.INFO, e.getMessage(), e);
			//TODO comminicate error to user
		} catch (InternalServerErrorException e) {
			logger.log(Level.SEVERE, e.getMessage(), e);
			//TODO comminicate error to user
		} finally {
			query.closeAll();
			if (zipBlob != null) {
				pm.deletePersistent(zipBlob);
			}
			pm.close();
		}
	}
}

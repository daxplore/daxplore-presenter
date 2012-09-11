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
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.validation.Schema;

import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.IOUtils;
import org.daxplore.presenter.server.PMF;
import org.daxplore.shared.SharedResourceTools;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.SAXException;

import com.google.appengine.api.datastore.Blob;
import com.google.appengine.api.taskqueue.Queue;
import com.google.appengine.api.taskqueue.QueueFactory;
import com.google.appengine.api.taskqueue.TaskOptions;

@SuppressWarnings("serial")
public class DataUploadServlet extends HttpServlet {

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse res) {
		res.setStatus(HttpServletResponse.SC_OK);
	    ServletFileUpload upload = new ServletFileUpload();
	    PersistenceManager pm = PMF.get().getPersistenceManager();
		try {
			FileItemStream item = upload.getItemIterator(req).next();
			byte[] fileData = IOUtils.toByteArray(item.openStream());
			ZipInputStream zipIn = new ZipInputStream(new ByteArrayInputStream(fileData));
			ZipEntry entry;
			while ((entry = zipIn.getNextEntry()) != null) {
				if (entry.getName().equals("UploadFileManifest.xml")) {
					Schema schema = SharedResourceTools.getUploadFileManifestSchema();
					DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
					dbf.setNamespaceAware(true);
					dbf.setSchema(schema);
					DocumentBuilder builder = dbf.newDocumentBuilder();
					try {
						Document document = builder.parse(zipIn);
						Node node = document.getElementsByTagName("major").item(0);
						int versionMajor = Integer.parseInt(node.getTextContent());
						node = document.getElementsByTagName("major").item(0);
						int versionMinor = Integer.parseInt(node.getTextContent());
						if (SharedResourceTools.isSupportedUploadFileVersion(versionMajor, versionMinor)) {
							node = document.getElementsByTagName("prefix").item(0);
							String prefix = node.getTextContent();
							ZipBlob zipBlob = new ZipBlob(prefix+"-UploadFile", new Blob(fileData));
							pm.makePersistent(zipBlob);
							Queue queue = QueueFactory.getQueue("upload-unpack-queue");
							queue.add(TaskOptions.Builder.withUrl("/admin/uploadUnpack").param("prefix", prefix));
							// TODO give user feedback on creation of task
							break;
						} else {
							// File version not supported
							// TODO give user feedback on invalid file
							continue;
						}
					} catch (SAXException e) {
						// Document not valid according to XSD definition
						// TODO give user feedback on invalid file
						continue;
					}
				}
			}
		} catch (FileUploadException e) {
			e.printStackTrace();
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			// TODO give user feedback on invalid file
		} catch (IOException e) {
			e.printStackTrace();
			res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			// TODO give user feedback on invalid file
		} catch (SAXException e) {
			e.printStackTrace();
			res.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} catch (ParserConfigurationException e) {
			e.printStackTrace();
			res.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			pm.close();
		}
	}
}

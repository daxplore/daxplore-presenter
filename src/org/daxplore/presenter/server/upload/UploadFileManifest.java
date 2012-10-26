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
import java.io.InputStream;
import java.util.LinkedList;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.validation.Schema;

import org.daxplore.shared.SharedResourceTools;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.InternalServerErrorException;

/**
 * 
 */
public class UploadFileManifest {
	protected int versionMajor, versionMinor;
	protected List<String> languages = new LinkedList<String>();
	
	public UploadFileManifest(InputStream manifestInputStream) throws InternalServerErrorException, BadRequestException {
		DocumentBuilder documentBuilder = null;
		try {
			Schema schema = SharedResourceTools.getUploadFileManifestSchema();
			DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
			dbf.setNamespaceAware(true);
			dbf.setSchema(schema); // schema guarantees that all values will be properly set
			documentBuilder = dbf.newDocumentBuilder();
			if (documentBuilder==null) {
				throw new ParserConfigurationException();
			}
		} catch (IOException e) {
			e.printStackTrace();
			throw new InternalServerErrorException("Could not read UploadFileManifest Schema");
		} catch (SAXException e) {
			e.printStackTrace();
			throw new InternalServerErrorException("Could not create UploadFileManifest Schema");
		} catch (ParserConfigurationException e) {
			e.printStackTrace();
			throw new InternalServerErrorException("Could not create document builder from UploadFileManifest Schema");
		}
		
		try {
			Document document = documentBuilder.parse(manifestInputStream);
		
			Node node = document.getElementsByTagName("major").item(0);
			versionMajor = Integer.parseInt(node.getTextContent());
			
			node = document.getElementsByTagName("major").item(0);
			versionMinor = Integer.parseInt(node.getTextContent());
			
			NodeList languageNodes = document.getElementsByTagName("language-BCP47");
			for (int i=0; i<languageNodes.getLength(); i++) {
				languages.add(languageNodes.item(i).getTextContent());
			}
		} catch (SAXException e) {
			e.printStackTrace();
			throw new BadRequestException("Manifest doesn't comply to the upload file schema");
		} catch (IOException e) {
			e.printStackTrace();
			throw new BadRequestException("Failed to read the manifest data stream");
		}
	}
	
	public int getVersionMajor() {
		return versionMajor;
	}

	public int getVersionMinor() {
		return versionMinor;
	}

	public List<String> getLanguages() {
		return languages;
	}
}

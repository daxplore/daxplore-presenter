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
package org.daxplore.presenter.server.admin;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.validation.Schema;

import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.shared.SharedResourceTools;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class UploadFileManifest {
	
	private int versionMajor, versionMinor;
	private List<Locale> locales = new LinkedList<>();
	private Locale defaultLocale; 
	
	public UploadFileManifest(InputStream manifestInputStream) throws InternalServerException, BadRequestException {
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
		} catch (IOException | SAXException e) {
			throw new InternalServerException("Could not read UploadFileManifest Schema", e);
		} catch (ParserConfigurationException e) {
			throw new InternalServerException("Could not create document builder from UploadFileManifest Schema", e);
		}
		
		try {
			//TODO replace xml parser
			Document document = documentBuilder.parse(manifestInputStream);
		
			Node node = document.getElementsByTagName("major").item(0);
			versionMajor = Integer.parseInt(node.getTextContent());
			
			node = document.getElementsByTagName("minor").item(0);
			versionMinor = Integer.parseInt(node.getTextContent());

			node = document.getElementsByTagName("supportedLocales").item(0);
			NodeList languageNodes = node.getChildNodes();
			for (int i=0; i<languageNodes.getLength(); i++) {
				String text = languageNodes.item(i).getTextContent().trim();
				if (!text.isEmpty()) { // buggy parsing requires this test
					locales.add(new Locale(text));
				}
			}
			
			node = document.getElementsByTagName("defaultLocale").item(0);
			languageNodes = node.getChildNodes();
			// strange parsing requires this work-around
			for (int i=0; i<languageNodes.getLength(); i++) {
				String text = languageNodes.item(i).getTextContent().trim();
				if (!text.isEmpty()) { 
					defaultLocale = new Locale(text);
					break;
				}
			}
		} catch (SAXException e) {
			throw new BadRequestException("Manifest doesn't comply with the upload file schema", e);
		} catch (IOException e) {
			throw new BadRequestException("Failed to read the uploaded file's manifest", e);
		}
	}
	
	public int getVersionMajor() {
		return versionMajor;
	}

	public int getVersionMinor() {
		return versionMinor;
	}

	public List<Locale> getSupportedLocales() {
		return locales;
	}
	
	public Locale getDefaultLocale() {
		return defaultLocale;
	}
}

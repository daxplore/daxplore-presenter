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
package org.daxplore.shared;

import java.io.IOException;
import java.io.InputStream;
import java.text.MessageFormat;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;

import org.xml.sax.SAXException;

public class SharedResourceTools {
	
	/**
	 * Get the XML Schema that is used to validate the manifest.xml file in daxplore upload files
	 * 
	 * @return The XML Schema
	 * @throws SAXException
	 * @throws IOException
	 */
	public static Schema getUploadFileManifestSchema() throws IOException, SAXException  {
		try (InputStream stream = SharedResourceTools.class.getResourceAsStream("UploadFileManifest.xsd")) {
			SchemaFactory sf = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
			Schema schema = sf.newSchema(new StreamSource(stream));
			stream.close();
			return schema;
		}
	}

	private static String[] expectedFiles = {
		"manifest.xml",
		"data/data.json"
		};
	
	private static String[] expectedLocalizedFiles = {
		"meta/groups_{0}.json",
		"meta/perspectives_{0}.json",
		"meta/questions_{0}.json",
		"properties/usertexts_{0}.json"
		};

	/**
	 * Check that an daxplore upload file contains all the needed files.
	 * 
	 * @param files The names of the files that are present in the upload file
	 * @param locales The locales that the upload file supports
	 * @return The missing files (the empty set if all the needed files are present)
	 */
	public static Set<String> findMissingUploadFiles(Set<String> files, List<Locale> locales) {
		Set<String> missing = new HashSet<>();
		
		for(String file : expectedFiles) {
			if(!files.contains(file)) {
				missing.add(file);
			}
		}
		
		for(String file : expectedLocalizedFiles) {
			for(Locale locale : locales) {
				String localizedFile = MessageFormat.format(file, locale.toLanguageTag()); 
				if(!files.contains(localizedFile)) {
					missing.add(localizedFile);
				}
			}
		}
		
		return missing;
	}

	/**
	 * Check that an daxplore upload file doesn't contain any extra, unwanted files.
	 * 
	 * @param files The names of the files that are present in the upload file
	 * @param locales The locales that the upload file supports
	 * @return The unwanted files (the empty set if no unwanted files were found)
	 */
	public static Set<String> findUnwantedUploadFiles(Set<String> files, List<Locale> locales) {
		Set<String> wanted = new HashSet<>();
		
		for(String file : expectedFiles) {
			wanted.add(file);
		}
		
		for(String file : expectedLocalizedFiles) {
			for(Locale locale : locales) {
				String localizedFile = MessageFormat.format(file, locale.toLanguageTag()); 
				wanted.add(localizedFile);
			}
		}
		
		Set<String> unwanted = new HashSet<>();
		for(String file : files) {
			if(!wanted.contains(file)) {
				unwanted.add(file);
			}
		}
		
		return unwanted;
	}
	
	/**
	 * Check if a prefix is made up of valid characters.
	 * 
	 * @param prefix The prefix to check
	 * @return True, if the prefix is syntactically valid
	 */
	public static boolean isSyntacticallyValidPrefix(String prefix) {
		return prefix!=null && Pattern.matches("[a-z]+", prefix);
	}
	
}

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
import java.util.LinkedList;
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
	
	public static Schema getUploadFileManifestSchema() throws SAXException, IOException {
		InputStream stream = SharedResourceTools.class.getResourceAsStream("UploadFileManifest.xsd");
		SchemaFactory sf = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
		Schema schema = sf.newSchema(new StreamSource(stream));
		stream.close();
		return schema;
	}

	public static List<String> findMissingUploadFiles(Set<String> keySet, List<Locale> locales) {
		// TODO Auto-generated method stub
		return new LinkedList<String>();
	}

	public static List<String> findUnwantedUploadFiles(Set<String> keySet, List<Locale> locales) {
		// TODO Auto-generated method stub
		return new LinkedList<String>();
	}
	
	
	public static boolean isSyntacticallyValidPrefix(String prefix) {
		return Pattern.matches("[a-z]+", prefix);
	}
	
}

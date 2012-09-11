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
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.jdo.PersistenceManager;
import javax.jdo.Query;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.PMF;
import org.daxplore.presenter.server.TextBlob;

import com.google.appengine.api.datastore.Blob;

@SuppressWarnings("serial")
public class DataUnpackServlet extends HttpServlet {

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse res) {
		String prefix = req.getParameter("prefix");
		
		PersistenceManager pm = PMF.get().getPersistenceManager();
		Query query = pm.newQuery(ZipBlob.class);
		query.setFilter("name == " + prefix);
		try {
			@SuppressWarnings("unchecked")
			List<ZipBlob> zipBlobs = (List<ZipBlob>) query.execute();
			ZipBlob zipBlob = zipBlobs.get(0);
			ZipInputStream zipIn = zipBlob.getZipInputStream(); 
			
			try {
				ZipEntry entry;
				while ((entry = zipIn.getNextEntry()) != null) {
					if(!entry.isDirectory()) {
						byte[] data = new byte[(int) entry.getSize()];
						zipIn.read(data);
						TextBlob textBlob = new TextBlob(prefix+"-"+entry.getName(), new Blob(data));
						pm.makePersistent(textBlob);
						System.out.println(entry.getName());
					}
				}
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
			
			
			/*getServletContext().getResourceAsStream(arg0))
			if (stream==null) {
				throw new ResourceReaderException("Unable to locate resource: " + resource);
			}
			try {
				return new BufferedReader(new InputStreamReader(stream, "UTF8"));
			} catch (UnsupportedEncodingException e) {
				throw new ResourceReaderException(e);
			}*/
	        /*Schema schema = sf.newSchema();

	        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
	        dbf.setNamespaceAware(true);
	        dbf.setSchema(schema);
	        DocumentBuilder db = dbf.newDocumentBuilder();
	        db.parse(new File("person.xml"));
         	*/

			/*
			if(!entry.isDirectory()) {
				byte[] data = new byte[(int) entry.getSize()];
				zipIn.read(data);
				TextBlob textBlob = new TextBlob(entry.getName(), new Blob(data));
				pm.makePersistent(textBlob);
				System.out.println(entry.getName());
			}
			*/
		
		} finally {
			pm.close();
		}
	}
}

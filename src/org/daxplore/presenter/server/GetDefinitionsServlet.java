/*
 *  Copyright 2012 Axel Winkler, Daniel Dunér
 * 
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.server;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.daxplore.presenter.server.throwable.ResourceReaderException;
import org.json.simple.JSONArray;
import org.json.simple.parser.ContainerFactory;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;


/**
 * The {@linkplain GetDefinitionsServlet} servlet serves localized metadata
 * definition files.
 * 
 * <p>The servlet serves the metadata files perspectives, groups and
 * questions.</p>
 * 
 * <p>The servlet takes the argument:
 * <ul>
 * <li>def, which should match one of the wanted files "perspectives", "groups"
 * or "questions"</li>
 * <li>l, which defines the locale</li>
 * <li>js, which defines if the file should be in the format of a JavaScript
 * variable (achieved by adding "var = " to the beginning of the file.</li>
 * </ul>
 * </p>
 * 
 * <p>The class also contains a static helper method that can get a part of 
 * the question metadata file, which is useful when answering an embed request.</p>
 * 
 * <p><b>TODO:</b> this servlet will be removed/replaced once the Daxplore Producer
 * is comlete, as it will use a different dataformat.</p> 
 */
@SuppressWarnings("serial")
public class GetDefinitionsServlet extends HttpServlet {
	private final static String location = "/definitions/";

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, java.io.IOException {
		resp.setContentType("text/html; charset=UTF-8");
		resp.setStatus(HttpServletResponse.SC_OK);
		PrintWriter respWriter = resp.getWriter();

		String l = req.getParameter("l");
		if (l == null || l.equalsIgnoreCase("")) {
			resp.sendError(HttpServletResponse.SC_BAD_REQUEST);
		}
		Locale locale = new Locale(l);
		
		String definitionName = req.getParameter("def");
		String asJavascript = req.getParameter("js");
		boolean asJS;
		if (asJavascript != null && asJavascript.equals("true")) {
			asJS = true;
		} else {
			asJS = false;
		}
		try {
			if (definitionName.equalsIgnoreCase("perspectives")) {
				BufferedReader reader = ServerTools.getResourceReader(getServletContext(), "perspectives", locale, ".json");
				if (asJS) {
					respWriter.write("var perspectives = ");
				}
				String line;
				while ((line = reader.readLine()) != null) {
					respWriter.write(line);
				}
				reader.close();
			} else if (definitionName.equalsIgnoreCase("questions")) {
				BufferedReader reader = ServerTools.getResourceReader(getServletContext(), "questions", locale, ".json");
				if (asJS) {
					respWriter.write("var questions = ");
				}
				String line;
				while ((line = reader.readLine()) != null) {
					respWriter.write(line);
				}
				reader.close();
			} else if (definitionName.equalsIgnoreCase("groups")) {
				BufferedReader reader = ServerTools.getResourceReader(getServletContext(), "groups", locale, ".json");
				if (asJS) {
					respWriter.write("var groups = ");
				}
				String line;
				while ((line = reader.readLine()) != null) {
					respWriter.write(line);
				}
				reader.close();
			} else {
				resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
			}
		} catch (IOException e) {
			e.printStackTrace();
			resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} catch (ResourceReaderException e) {
			e.printStackTrace();
			resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		}
		respWriter.close();
	}
	
	/**
	 * Get some questions from the questions metadata file.
	 * 
	 * <p>This is useful when answering an embed request, as the embed mode only
	 * uses two of the defined questions: one for the question and one for
	 * the perspective.</p>
	 * 
	 * @param questionIDs
	 *            the IDs of the questions to return
	 * @param locale
	 *            the locale
	 * @param context
	 *            the servlet context (needed to access the files)
	 * @return the question metadata definitions
	 * @throws IOException
	 *             signals that the questions metadata file couldn't be read
	 * @throws ParseException
	 *             signals that the questions file couldn't be parsed
	 */
	@SuppressWarnings({ "unchecked", "rawtypes" })
	public static String getDefinitions(List<String> questionIDs, String locale, ServletContext context) throws IOException, ParseException {
		JSONArray definitions = new JSONArray();
		ContainerFactory containerFactory = new ContainerFactory() {
			@Override
			public Map createObjectContainer() {
				return new LinkedHashMap();
			}
			@Override
			public List creatArrayContainer() {
				return new LinkedList();
			}
		};
		
		String questionFileLocation = location + "questions" + locale + ".json";
		BufferedReader reader = new BufferedReader(new InputStreamReader(context.getResourceAsStream(questionFileLocation), "UTF8"));
		JSONParser parser = new JSONParser();
		List<Map> questionList = (List<Map>)parser.parse(reader, containerFactory);
		
		for(Map map: questionList){
			Object o = map.get("column");
			String column = (String)o;
			if(questionIDs.contains(column)){
				definitions.add(map);
			}
		}
		
		return definitions.toJSONString();
	}
}

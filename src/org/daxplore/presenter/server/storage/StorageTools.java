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
package org.daxplore.presenter.server.storage;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.jdo.PersistenceManager;

import org.json.simple.JSONArray;
import org.json.simple.parser.ContainerFactory;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class StorageTools {
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
	 * @return the question metadata definitions
	 * @throws IOException
	 *             signals that the questions metadata file couldn't be read
	 * @throws ParseException
	 *             signals that the questions file couldn't be parsed
	 */
	@SuppressWarnings({ "unchecked", "rawtypes" })
	public static String getQuestionDefinitions(PersistenceManager pm, String prefix,
			List<String> questionIDs, Locale locale) throws IOException, ParseException {
		
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
		
		BufferedReader reader = new BufferedReader(StaticFileItemStore.getStaticFileReader(pm, prefix, "questions", locale, ".json"));
		
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

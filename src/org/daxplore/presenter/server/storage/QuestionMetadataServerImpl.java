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
package org.daxplore.presenter.server.storage;

import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.json.simple.JSONObject;
import org.json.simple.parser.ContainerFactory;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

/**
 * Gives server-side access to localized meta-data for the questions that are
 * defined for the site.
 * 
 * <p>Each question has texts and a number of question options (corresponding to
 * answer options in a survey).</p>
 * 
 * <p>These questions represents both what is called "questions" on the web site
 * as well as "perspectives". This is because they are all originally questions
 * in a survey.</p>
 */
@SuppressWarnings({"rawtypes"})
public class QuestionMetadataServerImpl implements QuestionMetadata {
	
	private List<JSONObject> questionList;
	
	/**
	 * Instantiates a new question metadata instance by reading in and parsing
	 * the data from reader.
	 * 
	 * @param reader
	 *            a reader, presumably from the file that contains the json
	 *            question metadata
	 */
	public QuestionMetadataServerImpl(Reader reader) {
		JSONParser parser = new JSONParser();
		
	  ContainerFactory containerFactory = new ContainerFactory(){
		    @Override
			public List creatArrayContainer() {
		      return new LinkedList();
		    }

		    @Override
			public Map createObjectContainer() {
		      return null;
		    }
		  };
		
		try {
			questionList = (List<JSONObject>)parser.parse(reader, containerFactory);
		} catch (IOException | ParseException e) {
			e.printStackTrace();
		}
	}
	
	private JSONObject getQuestion(String column) {
		for(JSONObject obj: questionList) {
			if(obj.get("column") != null && column.equals(obj.get("column"))){
				return obj;
			}
		}
		return null;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasQuestion(String column) {
		return getQuestion(column) != null;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getShortText(String column) {
		JSONObject question = getQuestion(column);
		return (String)question.get("short");
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getFullText(String column) {
		JSONObject question = getQuestion(column);
		return (String)question.get("text");
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getDescriptionText(String column) {
		JSONObject question = getQuestion(column);
		return (String)question.get("description");
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public List<String> getOptionTexts(String column) {
		JSONObject question = getQuestion(column);
		List<String> options = new LinkedList<>();
		List opts = (List) question.get("options");

		Iterator iter = opts.iterator();
		while( iter.hasNext()) {
			options.add((String)iter.next());
		}
		return options;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public int getOptionCount(String column) {
		List<String> opts = getOptionTexts(column);
		return opts.size();
	}

	/**
	 * {@inherhitDoc} 
	 */
	@Override
	public List<QueryFlag> getDisplayTypes(String questionID) {
		List<QueryFlag> flags = new ArrayList<>();
		// TODO 		
		return flags;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean useFreqChart(String column) {
		//TODO update to new data structure or remove?
		JSONObject question = getQuestion(column);
		return question.containsKey("hasMean") && (Boolean)question.get("hasMean"); 
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean useMeanChart(String questionID) {
		// TODO Auto-generated method stub
		return false;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean useDichotomizedChart(String questionID) {
		// TODO Auto-generated method stub
		return false;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public List<Integer> getDichotomizedDefaultSelectedOptions(String questionID) {
		// TODO Auto-generated method stub
		return null;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean hasMeanReferenceValue(String column) {
		JSONObject question = getQuestion(column);
		return question.containsKey("use_mean_reference") && (Boolean)question.get("use_mean_reference"); 
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public double getMeanReferenceValue(String column) {
		JSONObject question = getQuestion(column);
		return (Double)question.get("mean_reference"); 
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public List<Integer> getTimepointIndexes(String questionID) {
		// TODO Auto-generated method stub
		return null;
	}
}

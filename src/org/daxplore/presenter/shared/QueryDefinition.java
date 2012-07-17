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
package org.daxplore.presenter.shared;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;

import org.daxplore.presenter.shared.EmbedDefinition.EmbedFlag;

/**
 * The Query Definition is a universal specification of a chart's content.
 * 
 * <p>It defines what question, perspective and perspective options to display
 * and what chart type should be used.</p>
 * 
 * <p>The definition contains:
 * <ul>
 * <li><b>questionID</b>, which specifies the ID of the question to be used
 * as the question</li>
 * <li><b>perspectiveID</b>, which specifies the ID of the question to be used
 * as the perspective</li>
 * <li><b>usedPerspectiveOptions</b>, which is a list of the perspective options
 * to use</li>
 * <li><b>A number of boolean flags:</b>
 * <ul>
 * <li><b>NULL</b>, a way to set "no flag"</li>
 * <li><b>TOTAL</b>, set if the "total data item" (that contains all respondents)
 * should be displayed</li>
 * <li><b>SECONDARY</b>, set if data from the secondary dataset should be displayed</li>
 * <li><b>MEAN</b>, set if a mean chart should be used, otherwise a standard
 * bar chart is used.</li>
 * </ul>
 * </li>
 * </ul>
 * 
 * <p>Use {@link EmbedDefinition} to add additional information about how 
 * embedded charts should be displayed.</p>
 */
public class QueryDefinition {

	/**
	 * The Enum QueryFlag.
	 */
	public enum QueryFlag{
		
		/** A way to set "no flag". */
		NULL(0), 
		
		/**
		 * Set if the "total data item" (that contains all respondents) should
		 * be displayed.
		 */
		TOTAL(1), 
		
		 /** Set if data from the secondary dataset should be displayed. */
		 SECONDARY(2), 
		 
		/**
		 * Set if a mean chart should be used, otherwise a standard bar chart is
		 * used.
		 */
		 MEAN(4);
		
		/**
		 * The value of the bit-position used when encoding this flag in a long.
		 */
		protected final long bitValue;
		
		/**
		 * Instantiates a new query flag.
		 * 
		 * @param bitValue
		 *            the value of the bit-position used when encoding this flag in a long
		 */
		QueryFlag(int bitValue) {
			this.bitValue = bitValue;
		}
		
		/**
		 * Get an array of flags from a long containing a flag-bit-pattern
		 * generated by {@link #encodeFlags(EmbedFlag[])}.
		 * 
		 * @param flaglong
		 * 				a long defining the flags
		 * @return an array of the defined flags
		 */
		protected static QueryFlag[] decodeFlags(long flaglong){
			if(flaglong == 0) return new QueryFlag[0];
			ArrayList<QueryFlag> flags = new ArrayList<QueryFlag>();
			for(QueryFlag f: QueryFlag.values()){
				if((flaglong & f.bitValue) != 0) flags.add(f);
			}
			return flags.toArray(new QueryFlag[0]);
		}
		
		/**
		 * Encode an array of flags as a long, using a flag-bit-pattern,
		 * that can be decoded by {@link #decodeFlags(long)}.
		 * 
		 * @param flags
		 *            the flags
		 * @return a long representing the flags
		 */
		protected static long encodeFlags(QueryFlag[] flags) {
			long flaglong = 0;
			for(QueryFlag f : flags){
				flaglong = flaglong | f.bitValue;
			}
			return flaglong;
		}
	}
	
	protected String perspectiveID, questionID;
	protected List<Integer> usedPerspectiveOptions;
	protected QueryFlag[] flags;
	protected QuestionMetadata questionMetadata;
	
	/**
	 * Instantiates a new query definition from all the individual
	 * definition-components, using a separate argument for each flag.
	 * 
	 * @param questionMetadata
	 *            the question metadata, used to look up localized texts
	 *            for the question and perspective
	 * @param perspectiveID
	 *            the perspective's questionID
	 * @param questionID
	 *            the question's questionID
	 * @param usedPerspectiveOptions
	 *            the used perspective options
	 * @param flags
	 *            the flags
	 */
	public QueryDefinition(QuestionMetadata questionMetadata, String perspectiveID, String questionID, List<Integer> usedPerspectiveOptions, QueryFlag... flags){
		this.perspectiveID = perspectiveID;
		this.questionID = questionID;
		this.usedPerspectiveOptions = usedPerspectiveOptions;
		this.questionMetadata = questionMetadata;
		if(flags == null || flags.length == 0){
			this.flags = new QueryFlag[0];
		} else {
			this.flags = flags;
		}
	}
	
	/**
	 * Instantiates a new query definition from all the individual
	 * definition-components, using a list for the flags.
	 * 
	 * @param questionMetadata
	 *            the question metadata, used to look up localized texts
	 *            for the question and perspective
	 * @param perspectiveID
	 *            the perspective's questionID
	 * @param questionID
	 *            the question's questionID
	 * @param usedPerspectiveOptions
	 *            the used perspective options
	 * @param flags
	 *            the flags
	 */
	public QueryDefinition(QuestionMetadata questionMetadata, String perspectiveID, String questionID, List<Integer> usedPerspectiveOptions, List<QueryFlag> flags){
		this(questionMetadata, perspectiveID, questionID, usedPerspectiveOptions);
		this.flags = flags.toArray(new QueryFlag[0]);
	}
	
	/**
	 * Instantiates a new query definition from all the individual
	 * definition-components, using an encoded long for the flags.
	 * 
	 * @param questionMetadata
	 *            the question metadata, used to look up localized texts
	 *            for the question and perspective
	 * @param perspectiveID
	 *            the perspective's questionID
	 * @param questionID
	 *            the question's questionID
	 * @param usedPerspectiveOptions
	 *            the used perspective options
	 * @param flags
	 *            the flags
	 */
	public QueryDefinition(QuestionMetadata questionMetadata, String perspectiveID, String questionID, List<Integer> usedPerspectiveOptions, long flags){
		this(questionMetadata, perspectiveID, questionID, usedPerspectiveOptions);
		this.flags = QueryFlag.decodeFlags(flags);
	}
	
	/**
	 * Instantiates a new query definition from a query definition string.
	 * 
	 * @param questionMetadata
	 *            the question metadata, used to look up localized texts
	 *            for the question and perspective
	 * @param restoreString
	 *            a query encoded in a string by {@link #getAsString()}
	 * @throws IllegalArgumentException
	 *             thrown if the restore string is invalid
	 */
	public QueryDefinition(QuestionMetadata questionMetadata, String restoreString) throws IllegalArgumentException {
		if(restoreString == null || restoreString == "") {throw new IllegalArgumentException("No string to restore from");}
		this.questionMetadata = questionMetadata;
		LinkedHashMap<String, String> tokens = SharedTools.parseTokens(Base64.decodeString(restoreString));
		usedPerspectiveOptions = new LinkedList<Integer>();
		flags = new QueryFlag[0];
		Collection<String> keys = tokens.keySet();
		for (String k : keys) {
			if (k.equals("q")) {
				questionID = tokens.get(k);
			} else if (k.equals("p")) {
				perspectiveID = tokens.get(k);
			} else if (k.equals("o")) {
				String[] sels = tokens.get(k).split(",");
				for (String s : sels) {
					try {
						usedPerspectiveOptions.add(Integer.parseInt(s));
					} catch (NumberFormatException e) {
						throw new IllegalArgumentException(e);
					}
				}
			} else if (k.equals("f")) {
				try {
					Integer flag = Integer.parseInt(tokens.get(k));
					flags = QueryFlag.decodeFlags(flag);
				} catch (NumberFormatException e) {
					throw new IllegalArgumentException(e);
				}
			}
		}
		
		if (questionID == null || !questionMetadata.hasQuestion(questionID)) {
			throw new IllegalArgumentException("Illegal questionID: " + questionID);
		}

		if (perspectiveID == null || !questionMetadata.hasQuestion(perspectiveID)) {
			throw new IllegalArgumentException("Illegal perspectiveID: " + perspectiveID);
		}

		int optionCount = questionMetadata.getOptionCount(perspectiveID);
		for (int i : usedPerspectiveOptions) {
			if (i>optionCount) {
				throw new IllegalArgumentException("Illegal perspective option: " + i + " > " + optionCount);
			}
		}
	}
	
	/**
	 * Get the query definition as a Base64 encoded string that can be
	 * sent put in the URL or sent between client and server.
	 * 
	 * <p>Use in the {@link #QueryDefinition(QuestionMetadata, String)}
	 * constructor to create a new identical query definition instance.</p>
	 * 
	 * @return a string representation of the query
	 */
	public String getAsString(){
		ArrayList<String> out = new ArrayList<String>();
		
		if (questionID != null && !questionID.equals("")) {
			out.add("q=" + questionID);
		}
		
		if (perspectiveID != null && !perspectiveID.equals("")) {
			out.add("p=" + perspectiveID);
			
			if (usedPerspectiveOptions.size() > 0) {
				List<Integer> tempUsedPerspectiveOptions = new LinkedList<Integer>();
				for (int i = 0; i < usedPerspectiveOptions.size(); i++) {
					tempUsedPerspectiveOptions.add(usedPerspectiveOptions.get(i));
				}
				out.add("o=" + SharedTools.join(tempUsedPerspectiveOptions, ","));
			}
		}
		
		if(flags.length > 0){
			out.add("f=" + QueryFlag.encodeFlags(flags));
		}
		
		return Base64.encodeString(SharedTools.join(out, "&"));
	}

	/**
	 * Get the perspective's questionID.
	 * 
	 * @return the perspective's ID
	 */
	public String getPerspectiveID() {
		return perspectiveID;
	}

	/**
	 * Get the question's questionID.
	 * 
	 * @return the question's ID
	 */
	public String getQuestionID() {
		return questionID;
	}

	/**
	 * Get a list of the used perspective options.
	 * 
	 * @return the perspective options
	 */
	public List<Integer> getUsedPerspectiveOptions() {
		return usedPerspectiveOptions;
	}

	/**
	 * Checks if a specific flag is set.
	 * 
	 * @param flag
	 *            the flag
	 * @return true, if the flag is set
	 */
	public boolean hasFlag(QueryFlag flag){
		for(QueryFlag f: flags){
			if(f.equals(flag)) return true;
		}
		return false;
	}
	
	/*
	 * Get question specific information:
	 */
	/**
	 * Get a long text that describes the question.
	 * 
	 * @return the full text
	 */
	public String getQuestionFullText() {
		return questionMetadata.getFullText(questionID);
	}

	/**
	 * Get a short text that describes the question.
	 * 
	 * @return the short text
	 */
	public String getQuestionShortText() {
		return questionMetadata.getShortText(questionID);
	}

	/**
	 * Get the question option count.
	 * 
	 * @return the question option count
	 */
	public int getQuestionOptionCount() {
		return questionMetadata.getOptionCount(questionID);
	}

	/**
	 * Get the question option texts.
	 * 
	 * @return the question option texts
	 */
	public List<String> getQuestionOptionTexts() {
		List<String> texts = new LinkedList<String>();
		for (String s : questionMetadata.getOptionTexts(questionID)) {
			texts.add(s);
		}
		return texts;
	}
	
	
	/*
	 * Get perspective specific information:
	 */
	/**
	 * Get a short text that describes the perspective.
	 * 
	 * @return the perspective short text
	 */
	public String getPerspectiveShortText() {
		return questionMetadata.getShortText(perspectiveID);
	}
	
	/**
	 * Get the perspective option texts.
	 * 
	 * @return the perspective option texts
	 */
	public List<String> getPerspectiveOptionTexts() {
		List<String> texts = new LinkedList<String>();
		for (String s : questionMetadata.getOptionTexts(perspectiveID)) {
			texts.add(s);
		}
		return texts;
	}

	/**
	 * Get the perspective option count.
	 * 
	 * @return the perspective option count
	 */
	public int getPerspectiveOptionCount() {
		return questionMetadata.getOptionCount(perspectiveID);
	}
	
	/*
	 * Get question/perspective specific information:
	 */
	/**
	 * Check if this question-perspective combination supports displaying
	 * mean data.
	 * 
	 * @return true, if averaging is possible
	 */
	public boolean hasMean() {
		return questionMetadata.hasMean(questionID) && questionMetadata.hasMean(perspectiveID);
	}
	
	/**
	 * Check if this question-perspective combination supports displaying
	 * secondary data.
	 * 
	 * @return true, if there is secondary data
	 */
	public boolean hasSecondary() {
		return questionMetadata.hasSecondary(questionID) && questionMetadata.hasSecondary(perspectiveID);
	}
}

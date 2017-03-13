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

import java.io.StringReader;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Locale;
import java.util.regex.Matcher;

import javax.jdo.PersistenceManager;
import javax.servlet.ServletContext;
import javax.servlet.ServletRequest;

import org.daxplore.presenter.server.throwable.BadRequestException;
import org.daxplore.presenter.server.throwable.InternalServerException;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;
import org.json.simple.JSONArray;
import org.json.simple.JSONValue;

public class BuildPresentations {
	
	public static void buildAndStorePresentation(PersistenceManager pm, ServletContext servletContext, ServletRequest request, String prefix) throws InternalServerException, BadRequestException {
		// TODO does this need to be recomputed for each request?
		String baseurl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
		ArrayList<TextFileStore> toBeStored = new ArrayList<>();
		
		String googleAnalyticsID = SettingItemStore.getProperty(pm, prefix, "adminpanel", "gaID");
		String gaTemplate = "";
		if(googleAnalyticsID!=null && !googleAnalyticsID.equals("")) {
			String template = StaticFileStore.getStaticFile(servletContext, "/js/ga-tracking.js");
			gaTemplate = MessageFormat.format(template, googleAnalyticsID);
		}
		
		for (Locale locale : LocaleStore.getLocaleStore(pm, prefix).getSupportedLocales()) {
			String filename = "explorer_" + locale.toLanguageTag() + ".html";
			String presenterHTML = getExplorerHTML(pm, servletContext, prefix, locale, baseurl, gaTemplate);
			toBeStored.add(new TextFileStore(prefix, filename, presenterHTML));
			
			String questionText = TextFileStore.getLocalizedFile(pm, prefix, "questions", locale, ".json");
			QuestionMetadata questionMetadata = new QuestionMetadataServerImpl(new StringReader(questionText));

			String perspectivesJson = TextFileStore.getFile(pm, prefix, "perspectives.json");
			JSONArray perspectives = (JSONArray)JSONValue.parse(perspectivesJson);
			for (String perspectiveID : getAsStringArray(perspectives)) {
				filename = "profile_" + perspectiveID + "_" + locale.toLanguageTag() + ".html";
				String profileHTML = getProfileHTML(pm, servletContext, questionMetadata, prefix, locale, perspectiveID, baseurl, gaTemplate);
				toBeStored.add(new TextFileStore(prefix, filename, profileHTML));
			}
			
			filename = "userprofile_" + locale.toLanguageTag() + ".html";
			String userProfileHtml = getUserProfileHTML(pm, servletContext, prefix, locale, baseurl, gaTemplate);
			toBeStored.add(new TextFileStore(prefix, filename, userProfileHtml));
		}
		pm.makePersistentAll(toBeStored);
	}
	
	public static void buildAndStoreAllPresentations(PersistenceManager pm, ServletContext servletContext, ServletRequest request) throws InternalServerException, BadRequestException {
		for (String prefix : PrefixStore.getPrefixes(pm)) {
			buildAndStorePresentation(pm, servletContext, request, prefix);
		}
	}

	
	private static String getExplorerHTML(PersistenceManager pm, ServletContext sc, String prefix, Locale locale, String baseurl, String gaTemplate)
			throws InternalServerException, BadRequestException {
		
		String perspectives = "", groups = "", questions = "";
		perspectives = TextFileStore.getFile(pm, prefix, "perspectives.json");
		questions = TextFileStore.getLocalizedFile(pm, prefix, "questions", locale, ".json");
		groups = TextFileStore.getLocalizedFile(pm, prefix, "groups", locale, ".json");
		
		String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "pageTitle");
		
		String settings = TextFileStore.getFile(pm, prefix, "settings.json");
		String usertexts = TextFileStore.getLocalizedFile(pm, prefix, "usertexts", locale, ".json");
		
		String[] arguments = {
			baseurl,				// {0}
			pageTitle,				// {1}
			prefix,					// {2}
			perspectives,			// {3}
			questions,				// {4}
			groups,					// {5}
			settings,				// {6}
			usertexts,				// {7}
			gaTemplate				// {8}
		};
		
		String template = StaticFileStore.getStaticFile(sc, "/templates/presentation.html");
		return MessageFormat.format(template, (Object[])arguments);
	}
	
	@SuppressWarnings("unchecked")
	private static String getProfileHTML(PersistenceManager pm, ServletContext sc, QuestionMetadata questionMetadata,
			String prefix, Locale locale, String perspectiveID, String baseurl, String gaTemplate) throws InternalServerException, BadRequestException {
		
		String questions = "";
		questions = TextFileStore.getLocalizedFile(pm, prefix, "questions", locale, ".json");
		
		String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "pageTitle");
		
		String settings = TextFileStore.getFile(pm, prefix, "settings.json");
		String usertexts = TextFileStore.getLocalizedFile(pm, prefix, "usertexts", locale, ".json");
		
		String listview = TextFileStore.getFile(pm, prefix, "listview.json");
		JSONArray listVariables = (JSONArray)JSONValue.parse(listview);
		
		JSONArray dataArray = new JSONArray();
		for(String questionID : getAsStringArray(listVariables)) {
			LinkedList<QueryFlag> flags = new LinkedList<>();
			flags.add(QueryFlag.MEAN);
			flags.add(QueryFlag.MEAN_REFERENCE);
			
			int optionCount = questionMetadata.getOptionCount(perspectiveID);
			ArrayList<Integer> perspectiveOptions = new ArrayList<>(optionCount);
			for (int i=0; i<optionCount; i++) {
				perspectiveOptions.add(i);
			}
			
			QueryDefinition queryDefinition =
					new QueryDefinition(questionMetadata, questionID, perspectiveID, perspectiveOptions, flags);
			dataArray.add(JSONValue.parse(StatDataItemStore.getStats(pm, prefix, queryDefinition)));
		}
		
		String listViewData = dataArray.toJSONString();
		
		String[] arguments = {
			baseurl,				// {0}
			pageTitle,				// {1}
			prefix,					// {2}
			perspectiveID,			// {3}
			questions,				// {4}
			settings,				// {5}
			usertexts,				// {6}
			listViewData,			// {7}
			gaTemplate,				// {8}
		};
	
		String template = StaticFileStore.getStaticFile(sc, "/templates/profile.html");
		
		String result = template;
		for (int i = 0; i < arguments.length; i++) {
			result = result.replaceAll("\\{" + i + "\\}", Matcher.quoteReplacement(arguments[i]));
		}
		
		return result;
	}
	
	private static String getUserProfileHTML(PersistenceManager pm, ServletContext sc, String prefix,
			Locale locale, String baseurl, String gaTemplate) throws InternalServerException, BadRequestException {
		
		String questions = "";
		questions = TextFileStore.getLocalizedFile(pm, prefix, "questions", locale, ".json");
		
		String pageTitle = SettingItemStore.getLocalizedProperty(pm, prefix, "usertexts", locale, "pageTitle");
		
		String settings = TextFileStore.getFile(pm, prefix, "settings.json");
		String usertexts = TextFileStore.getLocalizedFile(pm, prefix, "usertexts", locale, ".json");
		String q_ids = TextFileStore.getFile(pm, prefix, "listview.json");
		
		String[] arguments = {
			baseurl,				// {0}
			pageTitle,				// {1}
			prefix,					// {2}
			locale.toLanguageTag(),	// {3}
			questions,				// {4}
			settings,				// {5}
			usertexts,				// {6}
			q_ids,					// {7}
			gaTemplate,				// {8}
		};
	
		String template = StaticFileStore.getStaticFile(sc, "/templates/userprofile.html");
		
		String result = template;
		for (int i = 0; i < arguments.length; i++) {
			result = result.replaceAll("\\{" + i + "\\}", Matcher.quoteReplacement(arguments[i]));
		}
		
		return result;
	}
	
	private static String[] getAsStringArray(JSONArray dataJson) {
		String[] data = new String[dataJson.size()];
		for (int i = 0; i<data.length; i++) {
			data[i] = (String)dataJson.get(i);
		}
		return data;
	}
}

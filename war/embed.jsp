<%
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
%>
<%@page import="org.daxplore.presenter.server.GetStatsServlet"%>
<%@page import="java.io.BufferedReader"%>
<%@page import="java.io.IOException"%>
<%@page import="org.daxplore.presenter.server.GetDefinitionsServlet"%>
<%@page import="org.daxplore.presenter.shared.QueryDefinition"%>
<%@page import="java.util.LinkedList"%>
<%@page import="org.daxplore.presenter.shared.SharedTools"%>
<%@page import="org.daxplore.presenter.server.QuestionMetadataServerImpl"%>
<%@page import="org.daxplore.presenter.shared.QuestionMetadata"%>
<%@page import="org.daxplore.presenter.server.resources.JspLocales"%>
<%@page import="java.util.List"%>
<%@page import="java.util.Queue"%>
<%@page import="org.daxplore.presenter.server.throwable.StatsException"%>
<%@page import="org.json.simple.parser.ParseException"%>
<%@page import="org.daxplore.presenter.server.throwable.ResourceReaderException"%>
<%@page import="org.daxplore.presenter.server.ServerTools"%>
<%@page import="java.util.Locale"%>

<%@ page 
	language="java" 
	contentType="text/html; charset=utf-8"
	pageEncoding="utf-8"
%>

<%!// Setup
protected QuestionMetadata questionMetadata = null;
		
public void jspInit(){
	try {
		//it should not matter what locale we use here, as long as it is one of the supported locales:
		Locale locale = new Locale("en"); //TODO figure this out in a smarter way
		BufferedReader reader = ServerTools.getResourceReader(getServletContext(), "questions", locale , ".json");
		questionMetadata = new QuestionMetadataServerImpl(reader);
		reader.close(); 
	} catch (IOException e) {
		System.out.println("Couldn't read file in jspInit: " + e.toString());
	} catch (ResourceReaderException e) {
		e.printStackTrace();
	}
}
%>

<%
	String jsondata = "";
	String qdef = "";
	String questionsString = "";
	
	Locale locale = null;
	
	try {
		//Set up supported locales:
		List<Locale> supportedLocales = JspLocales.getSupportedLocales();
		
		//Build a queue of desired locales, enqueue the most desired ones first
		Queue<Locale> desiredLocales = new LinkedList<Locale>();
		
		// 1. Add browser request string locale
		String queryLocale = request.getParameter("l");
		if(queryLocale!=null){
			desiredLocales.add(new Locale(queryLocale));	
		}
		
		// 2. Add default locale
		desiredLocales.add(JspLocales.getDefaultLocale());
		
		//Pick the first supported locale in the queue
		FindLocale: for(Locale desired : desiredLocales){
			String desiredLanguage = desired.getLanguage();
			for(Locale supported : supportedLocales){
				if(supported.getLanguage().equalsIgnoreCase(desiredLanguage)){
					locale = supported;
					break FindLocale;
				}
			}
		}
		
		String queryString = request.getParameter("q");
		QueryDefinition queryDefinition = new QueryDefinition(questionMetadata, queryString);
		LinkedList<String> jsonString = GetStatsServlet.getStats(queryDefinition);
		LinkedList<String> questions = new LinkedList<String>();
		questions.add(queryDefinition.getQuestionID());
		questions.add(queryDefinition.getPerspectiveID());
		
		jsondata = SharedTools.join(jsonString, ",");
		questionsString = GetDefinitionsServlet.getDefinitions(questions, "_"+locale.getLanguage(), getServletContext());
	} catch (IOException e) {
		e.printStackTrace();
		response.sendError(HttpServletResponse.SC_BAD_REQUEST);
	} catch (ParseException e) {
		e.printStackTrace();
		response.sendError(HttpServletResponse.SC_BAD_REQUEST);
	} catch (StatsException e) {
		e.printStackTrace();
		response.sendError(HttpServletResponse.SC_BAD_REQUEST);
	} catch (IllegalArgumentException e) {
		e.printStackTrace();
		response.sendError(HttpServletResponse.SC_BAD_REQUEST);
	} catch (Exception e) {
		e.printStackTrace();
		response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
	}
%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<!-- Set the locale for the gwt-parts of the site. -->
   		<meta name="gwt:property" content="locale=<%=locale.getLanguage()%>">
		<title>Daxplore embed</title>
		<link type="text/css" rel="stylesheet" href="css/embed.css">
	    <link type="text/css" rel="stylesheet" href="css/daxplore-chart.css">
	    <script type="text/javascript" src="gwtEmbed/gwtEmbed.nocache.js"></script>
	</head>
	<script type="text/javascript">
		var jsondata = [ <%=jsondata %> ];
		var questions = <%=questionsString %>;
	</script>
	<body>
		<div id="main"></div>
	</body>
</html>

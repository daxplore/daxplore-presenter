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

<%@page import="java.util.logging.Level"%>
<%@page import="java.io.IOException"%>
<%@page import="org.daxplore.presenter.server.storage.QuestionMetadataServerImpl"%>
<%@page import="org.daxplore.presenter.server.storage.StaticFileItemStore"%>
<%@page import="java.io.Reader"%>
<%@page import="org.daxplore.presenter.server.storage.PrefixStore"%>
<%@page import="java.util.List"%>
<%@page import="org.daxplore.presenter.server.storage.PMF"%>
<%@page import="javax.jdo.PersistenceManager"%>
<%@page import="java.util.Locale"%>
<%@page import="org.daxplore.presenter.shared.QuestionMetadata"%>
<%@page import="java.util.HashMap"%>
<%@page import="java.util.logging.Logger"%>
<%@page import="org.daxplore.presenter.server.storage.LocalizedSettingItemStore"%>
<%@page import="org.daxplore.presenter.server.storage.StorageTools"%>
<%@page import="org.daxplore.presenter.server.storage.StatDataItemStore"%>
<%@page import="org.daxplore.presenter.shared.SharedTools"%>
<%@page import="java.util.LinkedList"%>
<%@page import="org.daxplore.presenter.shared.QueryDefinition"%>
<%@page import="org.json.simple.parser.ParseException"%>

<%@ page 
	language="java" 
	contentType="text/html; charset=utf-8"
	pageEncoding="utf-8"
%>

<%!// Setup
protected static Logger logger = Logger.getLogger("embed.jsp");
protected HashMap<String, QuestionMetadata> metadataMap = new HashMap<String, QuestionMetadata>(); 
		
public void jspInit(){
	try {
		//it should not matter what locale we use here, as long as it is one of the supported locales:
		Locale locale = new Locale("en"); //TODO figure this out in a smarter way
		PersistenceManager pm = PMF.get().getPersistenceManager();
		@SuppressWarnings("unchecked")
		List<PrefixStore> prefixes = (List<PrefixStore>)pm.newQuery(PrefixStore.class).execute();
		for(PrefixStore prefix : prefixes) {
			Reader reader = StaticFileItemStore.getStaticFileReader(pm, prefix.getPrefix(), "questions", locale , ".json");
			metadataMap.put(prefix.getPrefix(), new QuestionMetadataServerImpl(reader));
			reader.close(); 
		}
		pm.close();
	} catch (IOException e) {
		logger.log(Level.SEVERE, "Failed to initialize metadata in the embed servlet", e); 
	}
}
%>

<%
	Locale locale		= new Locale(request.getParameter("locale"));
	String prefix		= request.getParameter("prefix");
	String queryString	= request.getParameter("queryString");
	
	PersistenceManager pm = PMF.get().getPersistenceManager();
	
	QueryDefinition queryDefinition = new QueryDefinition(metadataMap.get(prefix), queryString);
	LinkedList<String> statItems = StatDataItemStore.getStats(pm, prefix, queryDefinition);
	LinkedList<String> questions = new LinkedList<String>();
	questions.add(queryDefinition.getQuestionID());
	questions.add(queryDefinition.getPerspectiveID());
	
	String pageTitle = LocalizedSettingItemStore.getLocalizedProperty(pm, prefix, locale, "pageTitle");
	String jsondata = SharedTools.join(statItems, ",");
	String questionsString = StorageTools.getQuestionDefinitions(pm, prefix, questions, locale);
%>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<!-- Set the locale for the gwt-parts of the site. -->
   		<meta name="gwt:property" content="locale=<%=locale%>">
   		<meta name="gwt:property" content="prefix=<%=prefix%>">
		<title><%=pageTitle%></title>
		<link type="text/css" rel="stylesheet" href="css/embed.css">
	    <link type="text/css" rel="stylesheet" href="css/daxplore-chart.css">
	    <script type="text/javascript" src="gwtEmbed/gwtEmbed.nocache.js"></script>
	</head>
	<script type="text/javascript">
		var jsondata = [ <%=jsondata%> ];
		var questions = <%=questionsString%>;
	</script>
	<body>
		<div id="main"></div>
	</body>
</html>

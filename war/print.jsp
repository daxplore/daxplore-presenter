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
<%@page import="org.daxplore.presenter.server.resources.JspLocales"%>
<%@page import="java.util.List"%>
<%@page import="java.util.ResourceBundle"%>
<%@page import="org.daxplore.presenter.server.resources.JspBundles"%>
<%@page import="org.daxplore.presenter.shared.EmbedDefinition"%>
<%@page import="org.daxplore.presenter.shared.EmbedDefinition.EmbedFlag"%>
<%@page import="java.util.LinkedList"%>
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

<%
	String serverPath = "", query = "", embedDefinition = "", pageTitle = "";
	Locale locale = null;
	try {
		
		serverPath = request.getRequestURL().toString();
		
		// remove last slash
		if (serverPath.charAt(serverPath.length()-1) == '/') {
			serverPath = serverPath.substring(0, serverPath.length() - 1);
		}
		
		// remove module name
		serverPath = serverPath.substring(0, serverPath.lastIndexOf("/"));
		
		//Set up supported locales:
		List<Locale> supportedLocales = JspLocales.getSupportedLocales();

		//Build a queue of desired locales, enqueue the most desired ones first
		Queue<Locale> desiredLocales = new LinkedList<Locale>();

		// 1. Add browser request string locale
		String queryLocale = request.getParameter("l");
		if (queryLocale != null) {
			desiredLocales.add(new Locale(queryLocale));
		}

		// 2. Add default locale
		desiredLocales.add(JspLocales.getDefaultLocale());

		//Pick the first supported locale in the queue
		FindLocale: for (Locale desired : desiredLocales) {
			String desiredLanguage = desired.getLanguage();
			for (Locale supported : supportedLocales) {
				if (supported.getLanguage().equalsIgnoreCase(desiredLanguage)) {
					locale = supported;
					break FindLocale;
				}
			}
		}

		query = request.getParameter("q");
		LinkedList<EmbedFlag> flags = new LinkedList<EmbedFlag>();
		flags.add(EmbedFlag.LEGEND);
		flags.add(EmbedFlag.TRANSPARENT);
		flags.add(EmbedFlag.PRINT);
		embedDefinition = new EmbedDefinition(flags).getAsString();

		ResourceBundle htmlTextsBundle = JspBundles.getHTMLTextsBundle(locale);
		if (htmlTextsBundle == null) {
			throw new NullPointerException("Could not load htmlTextsBundle");
		}
		pageTitle = htmlTextsBundle.getString("pageTitle");
	} catch (Exception e) {
		e.printStackTrace();
		response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
	}
	
%>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<title><%=pageTitle%></title>
	</head>
	<body>
		<div id="main">
			<iframe src="<%=serverPath%>/embed.jsp?q=<%=query%>&l=<%=locale.getLanguage()%>#<%=embedDefinition%>"
			width="650" height="330" frameborder="0" allowtransparency="true"></iframe>
		</div>
	</body>
</html>

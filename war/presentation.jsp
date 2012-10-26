<%@page import="org.daxplore.presenter.server.PMF"%>
<%@page import="javax.jdo.PersistenceManager"%>
<%@page import="javax.jdo.Query"%>
<%@page import="org.daxplore.presenter.server.storage.LocaleStore"%>
<%@page import="java.io.IOException"%>
<%@page import="org.daxplore.presenter.server.storage.StorageTools"%>
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
<!DOCTYPE html>

<%@page import="java.util.List"%>
<%@page import="java.io.UnsupportedEncodingException"%>
<%@page import="org.daxplore.presenter.server.ServerTools"%>
<%@page import="org.daxplore.presenter.server.resources.JspBundles"%>
<%@page import="org.daxplore.presenter.shared.SharedTools"%>
<%@page import="java.util.Arrays"%>
<%@page import="java.util.LinkedList"%>
<%@page import="java.util.Queue"%>
<%@page import="java.util.ResourceBundle"%>
<%@page import="java.util.Locale"%>

<%@ page
language="java"
import="java.util.Enumeration"
pageEncoding="utf-8"
contentType="text/html;charset=utf-8"
%>

<%
	PersistenceManager pm = PMF.get().getPersistenceManager();
	Locale locale = null;
	String pageTitle = "";
	boolean browserSupported = true;
	ResourceBundle filenameBundle = null;
	String perspectives = "", groups = "", questions = "";
	
	try {
		request.setCharacterEncoding("UTF-8");
		response.setContentType("text/html; charset=UTF-8");
		
		String prefix = request.getParameter("prefix");
		
		// TODO Add caching for loaded files
		perspectives = StorageTools.readStaticFile(prefix, "definitions/perspectives", locale, ".json");
		questions = StorageTools.readStaticFile(prefix, "definitions/questions", locale, ".json");
		groups = StorageTools.readStaticFile(prefix, "definitions/groups", locale, ".json");
		
		String useragent = request.getHeader("user-agent");
		double ieversion = ServerTools.getInternetExplorerVersion(useragent);
		if(useragent == null || (ieversion > 0.0 && ieversion < 8.0)){
			browserSupported = false;
		}
		Cookie[] cookies = request.getCookies();
		boolean ignoreBadBrowser = false;
		if(cookies != null){
			ignoreBadBrowser = ServerTools.ignoreBadBrowser(cookies);
		}
		browserSupported = browserSupported || ignoreBadBrowser;
	
		//Set up supported locales:
		Query query = pm.newQuery(LocaleStore.class);
		query.declareParameters("String specificPrefix");
		query.setFilter("prefix.equals(specificPrefix)");
		@SuppressWarnings("unchecked")
		LocaleStore localeStore = ((List<LocaleStore>)query.execute(prefix)).get(0);
		List<Locale> supportedLocales = localeStore.getSupportedLocales();
		
		//Build a queue of desired locales, enqueue the most desired ones first
		Queue<Locale> desiredLocales = new LinkedList<Locale>();
		
		// 1. Add browser request string locale
		String queryLocale = request.getParameter("locale");
		if(queryLocale!=null){
			desiredLocales.add(new Locale(queryLocale));	
		}
		
		// 2. Add cookie-prefered locale
		if(cookies != null) {
			for(Cookie c : cookies){
				if(c.getName().equalsIgnoreCase("locale")){
					desiredLocales.add(new Locale(c.getValue()));
				}
			}
		}
		
		// 3. Add browser requested locales
		@SuppressWarnings("unchecked")
		Enumeration<Locale> locales = (Enumeration<Locale>)request.getLocales();
		while(locales.hasMoreElements()){
			desiredLocales.add(locales.nextElement());
		}
		
		// 4. Add default locale
		desiredLocales.add(localeStore.getDefaultLocale());
		
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
		
		filenameBundle = JspBundles.getFilenameBundle(locale);
		if (filenameBundle == null) {
			throw new NullPointerException("Could not load filename bundle");
		}
		
		ResourceBundle htmlTextsBundle = JspBundles.getHTMLTextsBundle(locale);
		pageTitle = htmlTextsBundle.getString("pageTitle");
		
	} catch (Exception e) {
		e.printStackTrace();
		response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
	} finally {
		pm.close();
	}
%>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <!-- Set the locale for the gwt-parts of the site. -->
   	<meta name="gwt:property" content="locale=<%=locale.getLanguage()%>">
    <!--                                                               -->
    <!-- Consider inlining CSS to reduce the number of requested files -->
    <!--                                                               -->
    <link type="text/css" rel="stylesheet" href="css/presentation.css">
    <link type="text/css" rel="stylesheet" href="css/daxplore-widgets.css">
    <link type="text/css" rel="stylesheet" href="css/daxplore-chart.css">

    <title><%=pageTitle%></title>
    
    <script type="text/javascript">
		function setCookie(c_name, value, exdays){
			var exdate=new Date();
			exdate.setDate(exdate.getDate() + exdays);
			var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
			document.cookie=c_name + "=" + c_value;
		}

		/** http://www.quirksmode.org/js/cookies.html **/
		function readCookie(name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		}

		function cookiesSupported(){
			setCookie("cookies-supported", true);
			if(readCookie("cookies-supported")){
				return true;
			}else{
				return false;
			}
		}
		
		function badBrowserReload(){
			setCookie("bad-browser", "ignore", 7);
			window.location.reload();
		}

		function getQueryParameters(){
			var query = location.search.substring(1);
			var parameters = query.split('&');
			var result = new Object();
			for (var i=0; i<parameters.length; i++) {
				var pos = parameters[i].indexOf('=');
				if (pos > 0) {
					var key = parameters[i].substring(0,pos);
					var val = parameters[i].substring(pos+1);
					result[key] = val;
				}
			}
			return result;
		}
		
		function queryStringWithNewLocale(locale) {
			var queryPairs = new Array();
			var parameters = getQueryParameters();
			parameters.locale = locale;
			var index = 0;
			for(var key in parameters){
				queryPairs[index] = key+"="+parameters[key];
				index++;
			}
			return queryPairs.join('&');
		}

		function queryStringWithoutLocale() {
			var queryPairs = new Array();
			var parameters = getQueryParameters();
			delete parameters.locale;
			var index = 0;
			for(var key in parameters){
				queryPairs[index] = key+"="+parameters[key];
				index++;
			}
			return queryPairs.join('&');
		}

		function setQueryStringLocale(locale){
			var search = "?"+queryStringWithNewLocale(locale);
			location.replace(location.protocol + "//" + location.host + search + location.hash);
		}

		function changeLocaleReload(locale){
			setCookie("locale", locale, 30);
			var parameters = getQueryParameters();
			if(parameters.hasOwnProperty("locale")){
				var search = "?"+queryStringWithoutLocale();
				location.replace(location.protocol + "//" + location.host + search + location.hash);
			}else{
				location.reload();
			}
		}
	</script>
		
	<% if (browserSupported) { %>
		<script type="text/javascript" charset="UFT-8">
			var perspectives = <%=perspectives%>;
			var questions = <%=questions%>;
			var groups = <%=groups%>;
		</script>
		<script type="text/javascript" src="gwtPresentation/gwtPresentation.nocache.js"></script>
	<% } else { %>
		<link rel="stylesheet" type="text/css" href="css/browser-suggestions.css">
 	<% } %>
  	
  </head>

  <body>
	<% if(browserSupported){ %>
	    <!-- OPTIONAL: include this if you want history support -->
	    <iframe src="javascript:''" id="__gwt_historyFrame" tabIndex='-1' style="position:absolute;width:0;height:0;border:0"></iframe>
	    <jsp:include page="<%=filenameBundle.getString(\"presentation-content\")%>" />
    <% } else {%>
		<jsp:include page="<%=filenameBundle.getString(\"browser-suggestions\")%>" />
    <% }%>
  </body>
</html>

<%@page import="com.google.appengine.api.channel.ChannelServiceFactory"%>
<%@page import="com.google.appengine.api.channel.ChannelService"%>
<%@page import="com.google.appengine.api.users.User"%>
<%@page import="com.google.appengine.api.users.UserServiceFactory"%>
<%@page import="com.google.appengine.api.users.UserService"%>
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

<%@page import="org.daxplore.presenter.server.resources.JspLocales"%>
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
	Locale locale = new Locale("en");
	ResourceBundle htmlTextsBundle = JspBundles.getHTMLTextsBundle(locale);
	String pageTitle = htmlTextsBundle.getString("pageTitle");
	UserService userService = UserServiceFactory.getUserService();
	User user = userService.getCurrentUser();
	ChannelService channelService = ChannelServiceFactory.getChannelService();
	String channelToken = channelService.createChannel(user.getUserId());
%>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <!-- Set the locale for the gwt-parts of the site. -->
   	<meta name="gwt:property" content="locale=<%=locale.getLanguage()%>">
   	<meta name="channelToken" content="<%=channelToken%>">

    <title><%=pageTitle%> - Administration</title>
    <script type="text/javascript" src="/gwtAdmin/gwtAdmin.nocache.js"></script>
  </head>

  <body>
	<div id="ID-AdminPanel"></div>
  </body>
</html>

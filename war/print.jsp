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

<%
	String pageTitle = request.getParameter("pageTitle");
	String serverPath = request.getParameter("serverPath");
	String queryString = request.getParameter("queryString");
	String locale = request.getParameter("locale");
	String prefix = request.getParameter("prefix");
	String embedDefinition = request.getParameter("embedDefinition");
%>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<title><%=pageTitle%></title>
	</head>
	<body>
		<div id="main">
			<iframe src="<%=serverPath%>/embed.jsp?q=<%=queryString%>&l=<%=locale%>&prefix=<%=prefix%>#<%=embedDefinition%>"
			width="650" height="330" frameborder="0" allowtransparency="true"></iframe>
		</div>
	</body>
</html>

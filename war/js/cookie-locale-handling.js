function setCookie(c_name, value, exdays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value = escape(value)
			+ ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
	document.cookie = c_name + "=" + c_value;
}

/** http://www.quirksmode.org/js/cookies.html **/
function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for ( var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ')
			c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0)
			return c.substring(nameEQ.length, c.length);
	}
	return null;
}

function cookiesSupported() {
	setCookie("cookies-supported", true);
	if (readCookie("cookies-supported")) {
		return true;
	} else {
		return false;
	}
}

function badBrowserReload() {
	setCookie("bad-browser", "ignore", 7);
	window.location.reload();
}

function getQueryParameters() {
	var query = location.search.substring(1);
	var parameters = query.split('&');
	var result = new Object();
	for ( var i = 0; i < parameters.length; i++) {
		var pos = parameters[i].indexOf('=');
		if (pos > 0) {
			var key = parameters[i].substring(0, pos);
			var val = parameters[i].substring(pos + 1);
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
	for ( var key in parameters) {
		queryPairs[index] = key + "=" + parameters[key];
		index++;
	}
	return queryPairs.join('&');
}

function queryStringWithoutLocale() {
	var queryPairs = new Array();
	var parameters = getQueryParameters();
	delete parameters.locale;
	var index = 0;
	for ( var key in parameters) {
		queryPairs[index] = key + "=" + parameters[key];
		index++;
	}
	return queryPairs.join('&');
}

function setQueryStringLocale(locale) {
	var search = "?" + queryStringWithNewLocale(locale);
	location.replace(location.protocol + "//" + location.host + search
			+ location.hash);
}

function changeLocaleReload(locale) {
	setCookie("locale", locale, 30);
	var parameters = getQueryParameters();
	if (parameters.hasOwnProperty("locale")) {
		var search = "?" + queryStringWithoutLocale();
		location.replace(location.protocol + "//" + location.host + search
				+ location.hash);
	} else {
		location.reload();
	}
}

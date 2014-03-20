// Ensureing browser compatibility for older microsoft browsers.
if (typeof XMLHttpRequest === "undefined") {
	XMLHttpRequest = function () {
		try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
		catch (e) {} 
		try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
		catch (e) {}
		try { return new ActiveXObject("Microsoft.XMLHTTP"); }
		catch (e) {}
		throw new Error("This browser does not support XMLHttpRequest.");
	};
}

// Parsing all GET data parmeters
var UrlParams = function () {
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		query_string[pair[0]] = pair[1];
	}
	return query_string;
} ();


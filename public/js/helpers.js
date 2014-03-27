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


// Adding function to the array prototype
Array.prototype.remove = function(value) {
	var index = this.indexOf(value);
	if (index != -1) {
		return this.splice(index, 1);
	}
}

var SecondsToTime = function(rest, cont, multi){
	var multiplier = [1, 60, 3600, 86400];
	if(typeof multi == "undefined"){
		multi = multiplier.length - 1;
	}
	if(typeof cont == "undefined"){
		cont = "";
	}
	if (multi < 0) {
		return cont;
	} else if(rest == 0 && cont.length == 0){
		return "0:00";
	}
	// Rest to next dimention
	var nRest = rest % multiplier[multi];
	var nNum = ((rest - nRest) / multiplier[multi]);
	cont += cont.length == 0 && multi == 0 ? "0" : "";
	if(nNum > 0 || cont.length > 0){
		cont += cont.length > 0 ? ":" : "";
		cont += ("" + nNum).length < 2 && cont.length > 0 ? "0"+nNum : ""+nNum;
	}
	// Continues the process
	return SecondsToTime(cont, nRest, multi-1);
};


// Taken from:
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent#Polyfill
(function () {
	function CustomEvent ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	};
	CustomEvent.prototype = window.Event.prototype;
	window.CustomEvent = CustomEvent;
})();
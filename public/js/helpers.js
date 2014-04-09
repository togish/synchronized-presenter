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
	return SecondsToTime(nRest, cont, multi-1);
};

var TestSecondsToTime = function(){
	var test = function(inp, out){
		var cal = SecondsToTime(inp);
		if(cal != out){
			console.log("Error---------------------------");
			console.debug(inp)
			console.debug(out)
			console.debug(cal)
		}
	};

	test(0, "0:00");
	test(1, "0:01");
	test(10, "0:10");
	test(59, "0:59");
	test(60, "1:00");
	test(3661, "1:01:01");
	test(43261, "12:01:01");
	return "Test completed!";
};

var SomethingToSeconds = function(input, timed){
	// For string representation. Parse and convert into seconds or slides
	if(typeof input == "string"){
		var newValue = null;
		var multiplier = [1, 60, 3600, 86400];
		// I know fucking regular expressions! bitches!
		newValue = timed ? input.match(/^[0-9]+(?:\:[0-5]?[0-9])*$/) : input.match(/[1-9][0-9]*|^[0]$/);
		// console.debug(newValue);
		if(!(newValue == null || newValue.length > 1)){
			// Set the value in the segue. Convert to seconds or slidenumber. Works either case.
			return newValue[0].split(":").reduceRight(function(cont, val, idx, arr){
				return cont + multiplier[arr.length - idx -1] * val;
			}, 0);
		}
	// For a number. Go ahead!
	} else if(typeof input == "number"){
		return input;
	}
};

var TestSomethingToSeconds = function(){
	var test = function(inp, out){
		var cal = SomethingToSeconds(inp.input, inp.timed);
		if(cal != out){
			console.log("Error---------------------------");
			console.debug(inp)
			console.debug(out)
			console.debug(cal)
		}
	};

	test({input:"",timed:true}, undefined);
	test({input:"0",timed:true}, 0);
	test({input:"0:00",timed:true}, 0);
	test({input:"0:0",timed:true}, 0);
	test({input:"0:01",timed:true}, 1);
	test({input:"0:1",timed:true}, 1);
	test({input:"0:10",timed:true}, 10);
	test({input:"0:59",timed:true}, 59);
	test({input:"0:60",timed:true}, undefined);
	test({input:"1:00",timed:true}, 60);
	test({input:"1:01:01",timed:true}, 3661);
	test({input:"12:01:01",timed:true}, 43261);

	test({input:"0"}, 0);
	test({input:"1"}, 1);
	test({input:"2"}, 2);
	test({input:"3"}, 3);
	test({input:"2", timed:false}, 2);
	test({input:"3", timed:false}, 3);
	return "Test completed!";
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

var EventTypes = {
	EVENT_PRESENTATION_LOADED: "PresentationLoaded",

	EVENT_SOURCE_ADDED: "0",
	EVENT_SOURCE_REMOVED: "l",
	EVENT_SOURCE_DRAGGED: "8",

	EVENT_VIEWPORT_ADDED: "2",
	EVENT_VIEWPORT_REMOVED: "3",
	EVENT_VIEWPORT_CHANGED: "dfs322rfw",

	EVENT_TIMELINE_ADDED: "asdsadass",
	EVENT_TIMELINE_REMOVED: "assadasdsadass",
	EVENT_TIMELINE_CHANGED: "dfs",

	EVENT_SEGUE_ADDED: "4",
	EVENT_SEGUE_REMOVED: "5",
	EVENT_SEGUE_CHANGED: "dkkdsasdw",
	EVENT_SEGUE_BLURED: "fkdo",
	EVENT_SEGUE_FOCUED: "jdjdosow",

	EVENT_PRESENTER_STATUS: "statusChanged",
	EVENT_PRESENTER_DURATION: "durationChanged",

	EVENT_PLAYER_STATUS_CHANGED: "sdasdadawsqwe",
	EVENT_PLAYER_READYNESS_CHANGED: "sdpofkisoidjf",
	
	EVENT_VIEWPORT_STATUS_CHANGED: "sdasdadawsqwesds",
	EVENT_VIEWPORT_READYNESS_CHANGED: "sdpofkisoidjfsds",
	EVENT_VIEWPORT_PLAYER_CHANGED: "uhdiuhsdfiuhdshbyuffguydsiygfgudtrfy"
};

var StatusTypes = {
	ERROR: "error",
	LOADING: "loading",
	PAUSED: "paused",
	PLAYING: "playing"
};
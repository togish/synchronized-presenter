/* jshint strict: false */
/* exported Presentation */
/* global Event: false */
/* global console: false */
/* global document: false */
/* global Sources: false */
/* global Timeline: false */
/* global Segue: false */
/* global Segue: Presentation */

/**
 * Sets up the child elements
 * Param load target 
 * 		- must implement load(presentation) 
 *		- and expose the presentation at obj.presentation
 */
var Data = function (loadTarget) {
	// Scope rule hax
	var _this = this;

	// Checks if the loadTarget is compatible
	if(!("presentation" in loadTarget)){
		throw 'Load target is missing attribute "presentation"!';
	}
	if(!("load" in loadTarget) || typeof loadTarget.load != "function"){
		throw 'Load target is missing function "load"!';
	}

	// Function called when a fade needs to be disposed
	var _disposeFade = function(){};

	// Basepath for generating links
	this.presenterBasePath = "http://bachelor.dev/";

	// List of colors that is good for the presentations appearance
	this.colors = ["hsl(32,100%,50%)", "hsl(195,100%,40%)", "hsl( 80,100%,30%)"];

	/*
	 * Builds the presentation object from a text string
	 * Loads the presentation into the loadTarget
	 */
	var _buildPresentation = function(presentationText){
		try{
			var presentation = JSON.parse(presentationText);
		} catch(e){
			alert("Could not load presentation!\r\n- The format is invalid!");
			return false;
		}
		// TODO Error handling. How does the JSON parser respond errors..?

		// TODO Validation of the presentation element.
		// 	- Ensure it is good for production.

		// Assigning colors for the sources.
		presentation.sources.forEach(function(s, idx){
			s.color = _this.colors[idx];
		});

		// In the case there is a dialog, then dispose it.
		_disposeFade();

		// Instructs the load target to load the presentation.
		loadTarget.load(presentation);
	};

	/*
	 * Cleans the presentation in the loadTarget
	 * returns a clean instance of a presentation, ready for distribution
	 */
	var _cleanPresentation = function(){
		// If no presentation retrn empty JSON
		if(typeof loadTarget.presentation == "undefined"){
			return "";
		}

		// Preparing the clean presentation
		var clean ={};
		clean.info = loadTarget.presentation.info;
		clean.sources = [];
		clean.viewports = [];
		loadTarget.presentation.sources.forEach(function(s){
			clean.sources.push({
				type: s.type,
				title: s.title,
				data: s.data,
				// Length, color,,... What more?
			});
		});
		loadTarget.presentation.viewports.forEach(function(v){
			var sgs = [];
			v.segues.forEach(function(s){
				var ss = {
					offset: s.offset,
					action: s.action,
				};

				if(s.value != undefined){
					ss.value = s.value;
				}
				if(s.source != undefined){
					ss.source = s.source;
				}

				sgs.push(ss);
			});
			clean.viewports.push({
				segues: sgs,
			});
		});
		return JSON.stringify(clean);
	};
	
	/*
	 * Turns the provided base64 encoded zipfile into a presentation
	 */
	this.fromB64zip = function(zipString){
		var zip = new JSZip();

		// Loads the file data
		zip.load(zipString, {base64:true});

		// extracts the content of the presentation
		var content = zip.file("p.json").asText();

		// Builds the presentation
		_buildPresentation(content);
	};

	/*
	 * Returns a base64 encoded zipfile of the current presentation
	 */
	this.toB64zip = function(){
		var zip = new JSZip();

		// Adds the presentation to the zipfile
		zip.file("p.json", _cleanPresentation(), {compression:"DEFLATE"});

		// Returns the file string
		return zip.generate();
	};

	/*
	 * Returns a link with the presentation embeded in the url
	 */
	this.link = function(){
		return _this.presenterBasePath + "?b64zip=" + _this.toB64zip();
	};
	
	/*
	 * Loads the content of the url's destination into the presentation object
	 */
	this.load = function(url, proxy){
		var request = new XMLHttpRequest();
		if(proxy){
  			request.open('get', 'http://www.corsproxy.com/' + url, true);
		} else {
  			request.open('get', url, true);
		}
  		request.onerror = function(e){
  			// if no proxy and failing.. The try with proxy!
  			if (!proxy) {
  				_this.load(url, true);
  			} else {
				alert("Could not load presentation!\n\n- No internet connection?\n- Dead link?\n- The browsers origin policy refused the action");
  			}
  		};
  		request.onreadystatechange = function() {
			if (request.readyState == 4 && request.status === 200) {
				_buildPresentation(request.responseText);
			}
		};
		request.send();
	};

	/*
	 * Builds a dialog with the specified title
	 */
	var _createDialog = function(title, sinks){
		// Builds the fade for the background
		var fade = document.createElement('div');
		fade.className = "fade";
		fade.addEventListener('click', function(e){
			e.preventDefault();
			if(e.target == fade){
				_disposeFade();
			}
		});
		_disposeFade = function(){fade.remove();};

		// Builds the dialog
		var dialog = document.createElement('div');
		dialog.className = "dialog";
		dialog.innerHTML = '<h1>'+title+'</h1>';


		// Generating destination table. Adding the sinks to the UI
		var table = document.createElement("table");
		sinks.forEach(function(element){
			var row = document.createElement("tr");
			row.innerHTML = "<td><h3>" + element.text + "</td></h3>";

			var cell = document.createElement("td");
			cell.appendChild(element.button);
			
			row.appendChild(cell);
			table.appendChild(row);
		});
		dialog.appendChild(table);

		// Building the done button
		var done = document.createElement('button');
		done.innerHTML = "DONE";
		done.className = "done";
		done.addEventListener('click', function(){
			_disposeFade();
		});
		dialog.appendChild(done);


		// Adds the fade to the body
		fade.appendChild(dialog);
		document.body.appendChild(fade);

		// Returns the dialog
		return dialog;
	};

	/*
	 * Presents a save presentation dialog
	 */
	this.saveDialog = function(){
		var presentation = _cleanPresentation();
		var filename = presentation.info.name + ".json";

		// Holds the save destinations
		var sinks = [];

		// Building buttons for save actions
		var btnFile = document.createElement("button");
		btnFile.innerHTML = "Save to file";
		btnFile.addEventListener('click', function(e){
			e.preventDefault();
			var blob = new Blob([pres], {type: "text/json;charset=utf-8"});
			saveAs(blob, filename);
		});
		sinks.push({
			text: "File:",
			button: btnFile 
		});

		// Building save to dropbox shit
		if(typeof Dropbox != "undefined" && Dropbox.isBrowserSupported()){
			var btnDropbox = Dropbox.createSaveButton("data:text/json;base64," + btoa(pres), filename);
			sinks.push({
				text: "Dropbox:",
				button: btnDropbox
			});
		}

		// Shows the dialog
		_createDialog('Save presentation', sinks);
	};

	/*
	 * Presents a load presentation dialog
	 */
	this.loadDialog = function(){
		// Holds the sources
		var sinks = [];

		// Building buttons for read actions
		var btnFile = document.createElement("input");
		btnFile.type = 'file';
		btnFile.name = 'file';
		btnFile.addEventListener('change', function(e){
			var file = e.target.files[0];
			var reader = new FileReader();
			reader.onload = function(e) {
				_buildPresentation(e.target.result);
			};
			reader.readAsText(file);
		}, false);
		sinks.push({
			text: "File:",
			button: btnFile 
		});

		// Building dropbox ui
		if(typeof Dropbox != "undefined" && Dropbox.isBrowserSupported()){
			var btnDropbox = Dropbox.createChooseButton({
				success: function(files) {
					_this.load(files[0].link);
				},
				linkType: "direct",
				multiselect: false,
				// extensions: ['.pdf', '.doc', '.docx'],
			});
			sinks.push({
				text: "Dropbox:",
				button: btnDropbox
			});
		}

		// Shows the dialog
		_createDialog('Save presentation', sinks);
	};

	/*
	 * Creates a new empty presentation and loads it
	 */
	this.create = function(){
		_buildPresentation('{info: {name: ""},sources:[],viewports:[{lastSegue:{},segues:[],}]}');
	};

	/*
	 * Opens the presentation in the presenter in a new window
	 */
	this.linkOpen = function(){
		window.open(_this.link());
	};

	/*
	 * Initiates the ui bindings
	 */
	this.initUI = function(blockData){
		var classList = {
			save: _this.saveDialog,
			load: _this.loadDialog,
			link: _this.linkOpen,
			create: _this.create
		};

		for (var className in classList) {
			var triggers = blockData.getElementsByClassName(className);
			for(var i = 0; i < triggers.length; i++){
				triggers[i].addEventListener('click', classList[className]);
			}
		}
	}
};


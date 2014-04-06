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
var Data = function (eventElement) {
	// Checks if the eventElement has the required methods
	if(!(
		typeof eventElement != "undefined" && 
		typeof eventElement.addEventListener == "function" &&
		typeof eventElement.dispatchEvent == "function" &&
		typeof eventElement.removeEventListener == "function"
		)){
		throw 'Event element does not have the required functions';
	}

	// Basepath for generating links
	this.presenterBasePath = "http://bachelor.dev/";

	// List of colors that is good for the presentations appearance
	this.colors = ["hsl(32,100%,50%)", "hsl(195,100%,40%)", "hsl( 80,100%,30%)"];

	// The presentation
	this.presentation = {};

	// Scope rule hax
	var _this = this;

	/*
	 * Removes a viewport based on the timeline representing it and notifies about the change
	 */
	this.removeViewport = function(timeline){
		// Finding the source
		var index = _this.presentation.viewports.indexOf(timeline);

		// Checks if the index is out of bounds
		if (index < 0 || _this.presentation.viewports.length <= index) {
			return;
		}

		// Remove all the segues before removing the timeline
		// TODO Test if this can be excluded
		timeline.segues.reduceRight(function(cont, segue, index){
			return segue.remove();
		}, false);

		// Removes the source at the given index and fires event about the change
		eventElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_VIEWPORT_REMOVED, {detail: _this.presentation.viewports.splice(index, 1)}));
	};
	this.addViewport = function(){
		// _this.dispatchEvent(new CustomEvent(_this.EVENT_SOURCE_ADDED, {detail: source}));
	};

	/*
	 * Removes a source and notifies 
	 */
	this.removeSource = function(source){
		// Finding the source
		var index = _this.presentation.sources.indexOf(source);

		// Checks if the index is out of bounds
		if (index < 0 || _this.presentation.sources.length <= index) {
			return;
		}

		// Removes the source at the given index and fires event about the change
		eventElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SOURCE_REMOVED, {detail: _this.presentation.sources.splice(index, 1)}));

		// Cleans up in the segues for removing asociated segues
		_this.presentation.viewports.forEach(function(viewport, vi){
			viewport.segues.reduceRight(function(cont, segue, index){
				return (segue.source === source && segue.remove()) || cont;
			}, false);
		});
	};
	this.addSource = function(source){
		_this.presentation.sources.push(source);
		eventElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SOURCE_ADDED, {detail: source}));
	};

	/*
	 * Removes a segue and notifies 
	 */
	this.removeSegue = function(segue){
		// Find the segue and remove it from the 
		_this.presentation.viewports.forEach(function(viewport, vi){
			// Finding the source
			var index = viewport.segues.indexOf(segue);

			// Checks if the index is out of bounds
			if(0 > index || viewport.segues.length <= index) {
				return;
			}

			// Removes the segue at the given index and fires event about the change
			eventElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SOURCE_REMOVED, {detail: viewport.segues.splice(index, 1)}));
		});
	};
	this.addSegue = function(segue){
		// _this.dispatchEvent(new CustomEvent(_this.EVENT_SOURCE_ADDED, {detail: source}));
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
	 * Loads the content of the url's destination into the presentation object
	 */
	this.fromUrl = function(url, proxy){
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
	 * Returns a link with the presentation embeded in the url
	 */
	this.link = function(){
		return _this.presenterBasePath + "?b64zip=" + _this.toB64zip();
	};

	/*
	 * Opens the presentation in the presenter in a new window
	 */
	this.linkOpen = function(){
		window.open(_this.link());
	};

	/*
	 * Presents a save presentation dialog
	 */
	this.saveDialog = function(){
		var presentation = _cleanPresentation();
		var filename = _this.presentation.title + ".json";

		// Holds the save destinations
		var sinks = [];

		// Building buttons for save actions
		var btnFile = document.createElement("button");
		btnFile.innerHTML = "Save to file";
		btnFile.addEventListener('click', function(e){
			e.preventDefault();
			var blob = new Blob([presentation], {type: "text/json;charset=utf-8"});
			saveAs(blob, filename);
		});
		sinks.push({
			text: "File:",
			button: btnFile 
		});

		// Building save to dropbox shit
		if(typeof Dropbox != "undefined" && Dropbox.isBrowserSupported()){
			var btnDropbox = Dropbox.createSaveButton("data:text/json;base64," + btoa(presentation), filename);
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
		_createDialog('Load presentation', sinks);
	};

	/*
	 * Tries to load the presentation, else a new is generated
	 */
	this.loadAuto = function(){
		// Loads presentation if possible
		if(typeof UrlParams.b64zip == "string"){
			this.fromB64zip(UrlParams.b64zip);
		} else if(typeof UrlParams.url != "string"){
			this.fromUrl(UrlParams.url);
		} else {
			this.newPresentation();
		}
	};

	/*
	 * Creates a new empty presentation and loads it
	 */
	this.newPresentation = function(){
		_buildPresentation();
	};


	// Function called when a fade needs to be disposed
	var _disposeFade = function(){};

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
	 * Builds the presentation object from a text string
	 * Loads the presentation into the loadTarget
	 */
	var _buildPresentation = function(presentationText){
		var presentation = {
			title: "",
			sources:[],
			viewports:[{segues:[]}]
		};

		if(typeof presentationText == "string"){
			try{
				var rawPresentation = JSON.parse(presentationText);
			} catch(e){
				alert("Could not load presentation!\r\n- The format is invalid!");
				return false;
			}

			presentation.sources = rawPresentation.sources.reduce(function(cont, rawSource, idx, arr){
				if(!(rawSource instanceof Source)){
					rawSource.color = _this.colors[idx];
					cont[idx] = new Source(rawSource, _this);
				} else {
					cont[idx] = rawSource;
				}
				return cont;
			}, []);

			presentation.viewports = rawPresentation.viewports.reduce(function(cont, rawViewport, idxViewport){
				cont[idxViewport] = new Timeline({segues:rawViewport.segues.reduce(function(cont, rawSegue, idxSegue){
						cont[idxSegue] = new Segue(rawSegue, presentation.sources[rawSegue.source], _this);
						return cont;
					}, [])}, _this);
				return cont;
			}, []);
		}

		// In the case there is a dialog, then dispose it.
		_disposeFade();

		// Instructs the load target to load the presentation.
		_this.presentation = presentation;

		// Fires event about the newly loaded presentation
		eventElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_PRESENTATION_LOADED, {detail: _this}));
	};

	/*
	 * Cleans the presentation in the loadTarget
	 * returns a clean instance of a presentation, ready for distribution
	 */
	var _cleanPresentation = function(){
		// If no presentation retrn empty JSON
		if(typeof _this.presentation == "undefined"){
			return "";
		}

		// Preparing the clean presentation
		var clean ={};
		clean.title = _this.presentation.title;
		clean.sources = _this.presentation.sources.reduce(function(cont, s, idx){
			cont[idx] = {
				type: s.type,
				title: s.title,
				timed: s.timed,
				url: s.url,
				length: s.length,
				// Length, color,,... What more?
			};
			return cont;
		}, []);

		clean.viewports = [];
		_this.presentation.viewports.forEach(function(v){
			var sgs = [];
			v.segues.forEach(function(s){
				var ss = {
					offset: s.offset,
					action: s.action,
				};

				if(typeof s.value != "undefined"){
					ss.value = s.value;
				}
				if(typeof s.source != "undefined"){
					ss.source = clean.sources.indexOf(s.source);
				}

				sgs.push(ss);
			});
			clean.viewports.push({
				segues: sgs,
			});
		});
		var str = JSON.stringify(clean);
		return str;
	};

	if(eventElement instanceof HTMLElement){
		var element = document.createElement("div");
		element.className = "block-data";
		element.innerHTML = '<button class="create">New</button><button class="save">Save</button><button class="load">Load</button><button class="link">Show</button>';

		var classList = {
			save: _this.saveDialog,
			load: _this.loadDialog,
			link: _this.linkOpen,
			create: _this.create
		};

		for (var className in classList) {
			var triggers = element.getElementsByClassName(className);
			for(var i = 0; i < triggers.length; i++){
				triggers[i].addEventListener('click', classList[className]);
			}
		}
		this.htmlElement = element;
	}
};


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
	this.presenterBasePath = 'http://'+document.domain+'/';

	// List of colors that is good for the presentations appearance
	this.colors = ["hsl(195,100%,40%)", "hsl( 80,100%,30%)", "hsl(32,100%,50%)"];

	// The presentation
	this.presentation = {};

	// Scope rule hax
	var _this = this;

	/*
	 * Removes a viewport based on the timeline representing it and notifies about the change
	 */
	this.removeViewport = function(timeline){
		// Finding the source
		var index = _this.presentation.timelines.indexOf(timeline);

		// Checks if the index is out of bounds
		if (index < 0 || _this.presentation.timelines.length <= index) {
			return;
		}

		// Remove all the segues before removing the timeline
		// TODO Test if this can be excluded
		timeline.segues.reduceRight(function(cont, segue, index){
			return segue.remove();
		}, false);

		// Removes the source at the given index and fires event about the change
		_this.presentation.viewports.splice(index, 1)
		eventElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_VIEWPORT_REMOVED, {detail: _this.presentation.timelines.splice(index, 1)}));
	};
	this.addViewport = function(){
		var viewport = new Viewport({segues:[]}, _this);
		var timeline = new Timeline(viewport, _this);
		_this.presentation.viewports.push(viewport);
		_this.presentation.timelines.push(timeline);
		eventElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_VIEWPORT_ADDED, {detail: viewport}));
		eventElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_TIMELINE_ADDED, {detail: timeline}));
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
	 * Builds the presentation based on JSON encoded input
	 */
	this.fromJSON = function(json){
		return _buildPresentation(json);
	};

	/*
	 * Encodes the presentation to JSON
	 */
	this.toJSON = function(){
		return _cleanPresentation();
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
	this.loadSaveDialog = function(notFoundMode){
		var presentation = _cleanPresentation();
		var filename = _this.presentation.title + ".json";

		// Holds the save destinations
		var sinks = [];

		// Building buttons for save actions
		var fileOption = {text:'Disk'};
		fileOption.save = document.createElement("button");
		fileOption.save.innerHTML = "Save to disk";
		fileOption.save.addEventListener('click', function(e){
			e.preventDefault();
			var blob = new Blob([presentation], {type: "text/json;charset=utf-8"});
			saveAs(blob, filename);
		});

		// Building buttons for read actions
		fileOption.load = document.createElement("div");
		fileOption.load.className = "file-upload";
		fileOption.load.innerHTML = "<button>Load from disk</button>";
		var fileInput = document.createElement("input");
		fileOption.load.appendChild(fileInput);
		fileInput.type = 'file';
		fileInput.addEventListener('change', function(e){
			var file = e.target.files[0];
			var reader = new FileReader();
			reader.onload = function(e) {
				_buildPresentation(e.target.result);
			};
			reader.readAsText(file);
		}, false);
		sinks.push(fileOption);

		// Building save to dropbox
		if(typeof Dropbox != "undefined" && Dropbox.isBrowserSupported()){
			var dropOption = {text:'DropBox'};
			dropOption.save = Dropbox.createSaveButton("data:text/json;base64," + btoa(presentation), filename);

			dropOption.load = Dropbox.createChooseButton({
				success: function(files) {
					_this.load(files[0].link);
				},
				linkType: "direct",
				multiselect: false,
				// extensions: ['.pdf', '.doc', '.docx'],
			});
			sinks.push(dropOption);
		}

		// Shows the dialog
		// Builds the fade for the background
		var fade = document.createElement('div');
		fade.className = "fade";
		fade.addEventListener('click', function(e){
			if(e.target == fade){
				e.preventDefault();
				_disposeFade();
			}
		});
		_disposeFade = function(){fade.remove();};

		// Builds the dialog
		var dialog = document.createElement('div');
		fade.appendChild(dialog);

		dialog.className = "dialog";
		dialog.innerHTML = '<h1>Save and load presentation</h1>';

		// Generating destination table. Adding the sinks to the UI
		var table = document.createElement("table");
		table.innerHTML = "<tr><th>&nbsp;</th><th>Save to:</th><th>Load from:</th></tr>";

		sinks.forEach(function(element){
			var row = document.createElement("tr");
			row.innerHTML = "<td><h3>" + element.text + "</td></h3>";

			var cellSave = document.createElement("td");
			cellSave.appendChild(element.save);
			row.appendChild(cellSave);

			var cellLoad = document.createElement("td");
			cellLoad.appendChild(element.load);
			row.appendChild(cellLoad);

			table.appendChild(row);
		});
		dialog.appendChild(table);

		// Information about the useage
		var infoTitle = document.createElement('h3');
		infoTitle.className = "paste-link";
		infoTitle.innerHTML = 'Upload your presentation file and</br>paste link to the file here!';
		dialog.appendChild(infoTitle);
		
		var pasteLink = document.createElement('input');
		pasteLink.className = "paste-link";
		pasteLink.addEventListener("keyup", function(e){
			if(e.keyCode == 13){
				e.preventDefault();
				window.open(_this.presenterBasePath + '?url=' + pasteLink.value);
			}
		});
		dialog.appendChild(pasteLink);



		// Building the done button
		var done = document.createElement('button');
		done.innerHTML = "Close";
		done.className = "done";
		done.addEventListener('click', function(){
			_disposeFade();
		});
		dialog.appendChild(done);

		// Adds the fade to the body
		document.body.appendChild(fade);

		// Returns the dialog
		return dialog;
	};

	/*
	 * Presents a save presentation dialog
	 */
	this.notFoundDialog = function(){
		// Holds the save destinations
		var sinks = [];

		// Building buttons for read actions
		var fileOption = {text: "Disk"};
		fileOption.load = document.createElement("div");
		fileOption.load.className = "file-upload";
		fileOption.load.innerHTML = "<button>Load from disk</button>";
		var fileInput = document.createElement("input");
		fileOption.load.appendChild(fileInput);
		fileInput.type = 'file';
		fileInput.addEventListener('change', function(e){
			console.debug("never got here");
			var file = e.target.files[0];
			var reader = new FileReader();
			reader.onload = function(e) {
				_buildPresentation(e.target.result);
			};
			reader.readAsText(file);
		}, false);
		sinks.push(fileOption);

		// Building save to dropbox
		if(typeof Dropbox != "undefined" && Dropbox.isBrowserSupported()){
			var dropOption = {text:'DropBox'};

			dropOption.load = Dropbox.createChooseButton({
				success: function(files) {
					_this.load(files[0].link);
				},
				linkType: "direct",
				multiselect: false,
				// extensions: ['.pdf', '.doc', '.docx'],
			});
			sinks.push(dropOption);
		}

		// Shows the dialog
		// Builds the fade for the background
		var fade = document.createElement('div');
		fade.className = "fade";

		// Builds the dialog
		var dialog = document.createElement('div');
		fade.appendChild(dialog);

		dialog.className = "dialog";
		dialog.innerHTML = '<h1>Load presentation</h1>';

		// Information about the useage
		var infoTitle = document.createElement('h3');
		infoTitle.className = "paste-link";
		infoTitle.innerText = 'Paste link to presentation and pres enter!';
		dialog.appendChild(infoTitle);
		
		var pasteLink = document.createElement('input');
		pasteLink.className = "paste-link";
		pasteLink.addEventListener("keyup", function(e){
			if(e.keyCode == 13){
				e.preventDefault();
				window.location = _this.presenterBasePath + '?url=' + pasteLink.value;
			}
		});
		dialog.appendChild(pasteLink);

		var separator = document.createElement('h3');
		separator.innerHTML = "Or load a file";
		separator.className = "or";
		dialog.appendChild(separator);


		// Generating destination table. Adding the sinks to the UI
		var table = document.createElement("table");
		sinks.forEach(function(element){
			var row = document.createElement("tr");
			row.innerHTML = "<td><h3>" + element.text + "</td></h3>";

			var cellLoad = document.createElement("td");
			cellLoad.appendChild(element.load);
			row.appendChild(cellLoad);

			table.appendChild(row);
		});
		dialog.appendChild(table);


		// Adds the fade to the body
		document.body.appendChild(fade);

		// Returns the dialog
		return dialog;
	};


	/*
	 * Tries to load the presentation, else a new is generated
	 */
	this.loadAuto = function(defaultToNew){
		// Loads presentation if possible
		if(typeof UrlParams.b64zip == "string"){
			_this.fromB64zip(UrlParams.b64zip);
		} else if(typeof UrlParams.url == "string"){
			_this.fromUrl(UrlParams.url);
		} else if(typeof UrlParams.build == "string" || defaultToNew){
			_this.newPresentation();
		} else {
			_this.notFoundDialog();
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
	 * Builds the presentation object from a text string
	 * Loads the presentation into the loadTarget
	 */
	var _buildPresentation = function(presentationText){
		var presentation = {};

		// Default to a clean presentation
		if(typeof presentationText != "string"){
			presentationText = '{"title":"","sources":[],"viewports":[{"segues":[]}]}';
		}

		// Parse the presentation text
		try{
			var rawPresentation = JSON.parse(presentationText);
		} catch(e){
			alert("Could not load presentation!\r\n- The format is invalid!");
			return false;
		}

		presentation.title = rawPresentation.title;

		// Builds the cources
		presentation.sources = rawPresentation.sources.reduce(function(cont, rawSource, idx, arr){
			rawSource.color = _this.colors[idx];
			if(!(rawSource instanceof Source)){
				cont[idx] = new Source(rawSource, _this);
			} else {
				cont[idx] = rawSource;
			}
			return cont;
		}, []);

		// Builds the viewports
		presentation.viewports = rawPresentation.viewports.reduce(function(cont, rawViewport, idxViewport){
			cont[idxViewport] = new Viewport({segues:rawViewport.segues.reduce(function(cont, rawSegue, idxSegue){
					cont[idxSegue] = new Segue(rawSegue, presentation.sources[rawSegue.source], _this);
					return cont;
				}, [])}, _this);
			return cont;
		}, []);

		// Builds the timelines
		presentation.timelines = presentation.viewports.reduce(function(cont, viewport, idxViewport){
			cont[idxViewport] = new Timeline(viewport, _this);
			return cont;
		}, []);

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
		_this.presentation.viewports.forEach(function(viewport){
			var sgs = [];
			viewport.segues.forEach(function(segue){
				var ss = {
					offset: segue.offset,
					action: segue.action,
				};

				if(typeof segue.value != "undefined"){
					ss.value = segue.value;
				}
				if(typeof segue.source != "undefined"){
					ss.source = _this.presentation.sources.indexOf(segue.source);
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
		element.innerHTML = '<button class="create">New</button><button class="load">Open & save</button><button class="link">Show directly</button>';

		var classList = {
			load: _this.loadSaveDialog,
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


var TestData = function(){
	var ele = document.createElement('div');
	var data = new Data(ele);

	var json = '{"title":"Presentation","Horse":2929,"sources":[{"type":"youtube","title":"YT - Explanation told by lolmain","timed":true,"url":"https://www.youtube.com/watch?v=pHvP71rwYAc","length":240},{"type":"slideshare","title":"SL - Explanation","timed":false,"url":"http://www.slideshare.net/tor2608/presentation-for-syncronization-test","length":8},{"type":"slideshare","title":"SL - Correct code","timed":false,"url":"http://www.slideshare.net/tor2608/presentation-for-syncronization-test","length":8}],"viewports":[{"segues":[{"offset":0,"action":"playfrom","value":0,"source":0}]},{"segues":[{"offset":0,"action":"playfrom","value":0,"source":1},{"offset":3,"action":"playfrom","value":1,"source":1},{"offset":7,"action":"playfrom","value":2,"source":1},{"offset":10,"action":"playfrom","value":3,"source":1},{"offset":14,"action":"playfrom","value":4,"source":1},{"offset":18,"action":"playfrom","value":5,"source":1},{"offset":23,"action":"playfrom","value":6,"source":1}]}]}';
	data.fromJSON(json);

	var json2 = data.toJSON();
	if(json == json2){
		console.log("Input and output was the same.! Good!");
	} else {
		console.log("Something was stripped of in first round. That is ok!, cleaning works :D");
	}

	data.fromJSON(json2);
	var json3 = data.toJSON();
	if(json2 == json3){
		console.log("Input and output was the same.! Good!");
	} else {
		console.log("Something was stripped of in second round. That is FAIL!");
	}
};
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
 */
var Builder = function (containerElement) {
	var _this = this;
	window.bui = this;
	var _containerElement = containerElement;

	// Proxy methods for event subscribe, remove and dispatch
	this.addEventListener = function (a,b,c) {_containerElement.addEventListener(a,b,c);};
	this.dispatchEvent = function(a){_containerElement.dispatchEvent(a);};
	this.removeEventListener = function(a,b,c){_containerElement.removeEventListener(a,b,c);};

	this.presentation = {};

	/****************************
	 * Tries to auto load the presentation dependent on the url parmeters
	 */
	this.loadAuto = function(){
		var data = new Data(_this);
		if(UrlParams.b64zip != undefined){
			data.fromB64zip(UrlParams.b64zip);
		} else if(UrlParams.url != undefined){
			data.load(UrlParams.url);
		} else {
			return false;
		}
		return true;
	};

	/****************************
	 * Loads a presentation and updates the UI
	 */
	this.load = function(presentation){
		// Prepare the presentation
		_this.presentation = presentation;
		window.pres = presentation;

		_this.dispatchEvent(new CustomEvent("presentationLoaded", true, true));
	};


	// _containerElement.dispatchEvent(new Event(_this.EVENT_STATUS, {bubbles:true,cancelable:true}));


	/****************************
	 * Initializes the HTML structure for the app and attaches required submodules
	 */
	this.initUI = function(){
		// Clear the container
		while(containerElement.firstChild){
			containerElement.removeChild(containerElement.firstChild);	
		}

		// Setting up the header block
		var _blockHeader = document.createElement("div");
		_blockHeader.className = 'block-header';

		// Setting up the timeline section
		var _blockData = document.createElement('div');
		_blockData.className = 'block-data';
		_blockData.innerHTML = '<button class="create">New</button><button class="save">Save</button><button class="load">Load</button><button class="link">Show</button>';

		var _blockPreview = document.createElement('div');
		_blockPreview.className = 'block-preview';
		_blockPreview.innerHTML = 
		'<div class="preview"><h2 style="background:hsl(195,100%,40%);"><span class="viewport">A</span><span class="source">YT - Teori</span></h2><div class="media"></div></div>' +
		'<div class="preview"><h2 style="background:hsl(32,100%,50%);"> <span class="viewport">B</span><span class="source">SL - Teori</span></h2><div class="media"></div></div>';

		// Setting up sources section
		var _blockSources = document.createElement('div');
		_blockSources.className = 'block-sources';

		// Setting up the timeline section
		var _blockTimeline = document.createElement('div');
		_blockTimeline.className = 'block-timeline';

		// Adding all of the elements to the UI
		containerElement.appendChild(_blockHeader);
		containerElement.appendChild(_blockData);
		containerElement.appendChild(_blockPreview);
		containerElement.appendChild(_blockSources);
		containerElement.appendChild(_blockTimeline);

		
		/****************************
		 * Setting up javascript "classes" in relation to the elements
		 */
		 
		// TODO Set up listner for changes in the field and for changes from the presentation.
		_blockHeader.innerHTML = '<h1>Yay title</h1>';
		// _blockHeader.innerHTML = '<h1>' + _this.presentation.info.name + '</h1>';

		// Initiates the data object
		var _data = new Data(_this);
		_data.initUI(_blockData);

		// Initiates the sources object
		var _sources = new Sources(_this);
		_sources.initUI(_blockSources);

		// Initiates the timeline
		var _timeline = new Timeline(_this);
		_timeline.initUI(_blockTimeline);
		window.tl = _timeline;

		/****************************
		 * 
		 */
	};
}

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
	// TODO Assign color codes for each source
	var _this = this;
	this.presentation = {};

	this.load = function(presentation){
		// Clear the container
		while(containerElement.firstChild){
			containerElement.removeChild(containerElement.firstChild);	
		}

		_this.presentation = presentation;

		var _blockHeader = document.createElement("div");
		_blockHeader.className = 'block-header';
		_blockHeader.innerHTML = '<h1>' + presentation.info.name + '</h1>';
		
	
		// Createing blocks
		var _blockPreview = document.createElement('div');
		_blockPreview.className = 'block-preview';
	
		_blockPreview.innerHTML = 
		'<div class="preview"><h2 style="background:hsl(195,100%,40%);"><span class="viewport">A</span><span class="source">YT - Teori</span></h2><div class="media"></div></div>' +
		'<div class="preview"><h2 style="background:hsl(32,100%,50%);"> <span class="viewport">B</span><span class="source">SL - Teori</span></h2><div class="media"></div></div>';
	
	
		// TODO Set up the previews
		// var presenter = new Presentation(presentation, _viewportContainer);
	
	
		// Setting up sources section
		var _blockSources = document.createElement('div');
		_blockSources.className = 'block-sources';
		
		var sources = new Sources(presentation, _blockSources);
		sources.updateSource();
		sources.updatePosition();
	
	
		// Setting up the timeline section
		var _blockTimeline = document.createElement('div');
		_blockTimeline.className = 'block-timeline';
	
		var timeline = new Timeline(presentation, _blockTimeline);
		timeline.render();
	
		window.tl = timeline;
		window.pres = presentation;
	
	
		// Setting up the timeline section
		var _blockData = document.createElement('div');
		_blockData.className = 'block-data';
		_blockData.innerHTML = '<button class="save">Save presentation</button><button class="load">Load presentation</button>';
	
		var data = new Data(_this);
		data.init(_blockData);
		window.dt = data;
	
		containerElement.appendChild(_blockHeader);
		containerElement.appendChild(_blockPreview);
		containerElement.appendChild(_blockSources);
		containerElement.appendChild(_blockTimeline);
		containerElement.appendChild(_blockData);
	};
	
	// Tries to auto load the presentation dependent on the url parmeters
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

	// Childs constant pull of current position.
	// UI Colormanagement is handled here!
}

/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */
var Timelines = function (containerElement) {
	// presentation, timelineBlock
	var _this = this;

	this.htmlElement = document.createElement('div');
	this.htmlElement.className = 'block-timelines';

	var timelineList = document.createElement('div');
	timelineList.className = "timeline-list";
	this.htmlElement.appendChild(timelineList);

	var timelineContainer = document.createElement('div');
	timelineContainer.className = "timeline-container";
	this.htmlElement.appendChild(timelineContainer);

	// Adds and removed class for when a child is focused
	timelineContainer.addEventListener("segueFocused", function(){
		timelineContainer.classList.add("focused");
	});
	timelineContainer.addEventListener("segueBlured", function(){
		timelineContainer.classList.add("focused");
	});

	// Sending event downstream
	containerElement.addEventListener(EventTypes.EVENT_SOURCE_DRAGGED, function(ev){
		// Listen for last dragged source
	});

	// TODO Add addCiewport button

	var data;

	// Renders the source list when the presentation is loaded
	containerElement.addEventListener(EventTypes.EVENT_PRESENTATION_LOADED, function(ev){
		data = ev.detail;
		data.presentation.viewports.forEach(function(viewport, idx){
			viewport.initUI(containerElement);
			timelineList.appendChild(viewport.htmlElementName);
			timelineContainer.appendChild(viewport.htmlElement);
			viewport.update();
		});
	});

	containerElement.addEventListener(EventTypes.EVENT_VIEWPORT_ADDED, function(ev){
		timelineList.appendChild(ev.detail.htmlElementName);
		timelineContainer.appendChild(ev.detail.htmlElement);
	});

	timelineContainer.addEventListener(EventTypes.EVENT_TIMELINE_CHANGED, function(ev){
		var maxLen = data.presentation.viewports.reduce(function(cont, viewport){
			var len = viewport.getLength();
			return cont < len ? len : cont;
		}, 0);
		data.presentation.viewports.forEach(function(viewport){
			if(viewport.htmlElement instanceof HTMLElement){
				viewport.htmlElement.style.width = '' + (maxLen + 50) * 5 + 'px';
			}
		});
	});

	this.addViewport = function(){
		if(!(data instanceof Data)){
			return;
		}
		data.addViewport();
	};
};
/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */
var Timelines = function (containerElement) {

	this.htmlElement = document.createElement('div');

	var _data;
	var _this = this;
	var _timelineList;
	var _timelineContainer;

	this.addViewport = function(){
		if(!(_data instanceof Data)){
			return;
		}
		_data.addViewport();
	};

	(function(){
		_timelineList = document.createElement('div');
		_timelineContainer = document.createElement('div');
		_this.htmlElement.className = 'block-timelines';
		_timelineList.className = "timeline-list";
		_this.htmlElement.appendChild(_timelineList);
		_timelineContainer.className = "timeline-container";
		_this.htmlElement.appendChild(_timelineContainer);
	
		// Adds and removed class for when a child is focused
		_timelineContainer.addEventListener("segueFocused", function(){
			timelineContainer.classList.add("focused");
		});
		_timelineContainer.addEventListener("segueBlured", function(){
			timelineContainer.classList.add("focused");
		});


		var _addTimeline = function(timeline){
			timeline.initUI(containerElement);
			_timelineList.appendChild(timeline.htmlElementName);
			_timelineContainer.appendChild(timeline.htmlElement);
			timeline.update();
			return;
		};

		// Renders the source list when the presentation is loaded
		containerElement.addEventListener(EventTypes.EVENT_PRESENTATION_LOADED, function(ev){
			_data = ev.detail;
			_data.presentation.timelines.forEach(function(timeline, idx){
				_addTimeline(timeline);
			});
		});
	
		containerElement.addEventListener(EventTypes.EVENT_TIMELINE_ADDED, function(ev){
			_addTimeline(ev.detail);
		});
	
		_timelineContainer.addEventListener(EventTypes.EVENT_TIMELINE_CHANGED, function(ev){
			var maxLen = _data.presentation.timelines.reduce(function(cont, timeline){
				var len = timeline.getLength();
				return cont < len ? len : cont;
			}, 0);
			_data.presentation.timelines.forEach(function(timeline){
				if(timeline.htmlElement instanceof HTMLElement){
					timeline.htmlElement.style.width = '' + (maxLen + 50) * 5 + 'px';
				}
			});
		});

		var addTimelineButton = document.createElement('button');
		addTimelineButton.className = "add-timeline";
		addTimelineButton.innerText = "+";
		addTimelineButton.addEventListener('click', function(){
			_this.addViewport();
		});
		_this.htmlElement.appendChild(addTimelineButton);
	})();
};
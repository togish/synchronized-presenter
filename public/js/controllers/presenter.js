/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */

var Presenter = function (containerElement, controlBar, data) {
	// Declares variables describing the state of the presentation.
	var _this = this;
	var _duration = 0;
	var _position = 0;
	var _lastStart = 0;
	var _status;
	var _timers;
	var _shouldPlay = false;
	var _viewportContainer;

	// Proxy methods for event subscribe, remove and dispatch
	this.addEventListener = function (a,b,c) {containerElement.addEventListener(a,b,c);};
	this.dispatchEvent = function(a){containerElement.dispatchEvent(a);};
	this.removeEventListener = function(a,b,c){containerElement.removeEventListener(a,b,c);};

	// Returns the over all duration of the presentation, in seconds.
	this.getDuration = function(){
		return _duration;
	};
		
	// Returns the current position in the playback, in seconds.
	this.getPosition = function(){
		if (_status != this.PLAYING) return _position;
		return _position + (new Date().getTime() - _lastStart)/1000;
	};
		
	// Returns percent describing how long into the presentation we are.
	this.getCompletedPercent = function(){
		// Avoid division by zero
		if(this.getDuration() === 0) return 0;
		return (this.getPosition()/this.getDuration())*100;
	};

	// Returns true if the presentation is running.
	this.getStatus = function(){
		return _status;
	};

	// Plays/continues the presentation
	this.play = function(leaveShp){
		// if replay seek to start
		if(_this.getDuration() <= _this.getPosition()) {
			_this.seek(0);
			return;
		}

		// Skips executing play routing if allready running
		if(_timers !== undefined) return;
		_timers = [];
		if(!leaveShp) _shouldPlay = true;

		// Register the newest start time
		_lastStart = new Date().getTime();
		
		data.presentation.viewports.forEach(function(viewport, viewportIdx){
			var smallestNegative = {};

			viewport.segues.forEach(function(sg, segueIdx){
				var delay = sg.offset-_position;
				if (0 <= delay){
					var timer = setTimeout(function(){
						// Hide and show viewport
						for(var i = 0; i < viewport.htmlElement.children.length; i++){
							viewport.htmlElement.children[i].style.display = 'none';
						}
						var handler = sg.source.handlers[viewportIdx];
						handler.htmlElement.style.display = 'block';
						viewport.currentHandler = handler;

						_updateRatio();

						handler.seek(sg.value);
						handler.play();
						viewport.lastSegue = sg;
					}, delay*1000);
					_timers.push(timer);
				} else if(smallestNegative.delay === undefined || smallestNegative.delay <= delay) {
					smallestNegative = {delay:delay,segue:sg};
				}
			});

			// Used when paused and starts again.
			if(smallestNegative.delay !== undefined){
				var handler = smallestNegative.segue.source.handlers[viewportIdx];
				if(handler.hasTimestamp()){
					// smallestNegative.segue.position += _position;
				}
				handler.seek(smallestNegative.segue.value);
				handler.play();
			}
		});

		updateStatus();
	};
		
	// Pauses the presentation.
	this.pause = function (leaveShp) {
		if(_timers === undefined) return;
		if(!leaveShp) _shouldPlay = false;

		// Stop all timers
		_timers.forEach(function(timer){
			clearTimeout(timer);
		});

		// Reset the timer variable
		_timers = undefined;

		// Update the current position
		_position = this.getPosition();

		// Pause the presentations
		data.presentation.sources.forEach(function(source){
			if(typeof source.handlers == "undefined") return;
			source.handlers.forEach(function(handler){
				handler.pause();
			});
		});

		updateStatus();
	};
		
	// Seeks the entire presentation to the defined position
	this.seek = function (position) {
		this.pause();
		_position = position;
		this.play();
	};

	var updateDuration = function() {
		// Run through all of the 
		var bef = _duration;
		_duration = 500;


		// Take the last segue in each of the viewports
		// Calculate the latest point bases
		
		/*
		data.presentation.sources.forEach(function(resource){
			var handler = resource.handler;
			// Skips if no duration avaliable
			if(handler.getStatus() != handler.READY && handler.getStatus() != handler.PLAYING) return;
			
			// Checks for negative duration. This means no internal timing.
			var resourceDuration = handler.getDuration();
			if(resourceDuration < 0) return;

			// event from resource withthe largest offset.
			// var latestEvent = resource.events.reduce(function(previous,current){
				// if(previous.offset < current.offset) return current;
				// return previous;
			// },{offset:-1});

			// Checks if a last event was found.
			// TODO Figure out if this will ever happen, if events has elements.
			if(latestEvent.offset < 0) return;

			var latestPoint = latestEvent.offset - latestEvent.position + resourceDuration;
			if (_duration < latestPoint) {
				_duration = latestPoint;
			}
		});
		if(bef != _duration) containerElement.dispatchEvent(new Event(_this.EVENT_DURATION, {bubbles:true,cancelable:true}));
		*/
	};

	// Updates the status of the presentation. Lowest status child decides.
	var updateStatus = function () {
		var statusNew = data.presentation.viewports.reduce(function(previous, viewport, viewportIdx){
			var current = viewport.lastSegue.source.handlers[viewportIdx];
			// TODO Ignore if not in the time scope.
			// return previous;
			if(typeof current === "undefined") return previous;

			if(previous == StatusTypes.ERROR || current.getStatus() == current.ERROR) return StatusTypes.ERROR;
			else if(previous == StatusTypes.LOADING || current.getStatus() == current.LOADING) return StatusTypes.LOADING;
			else if(previous == StatusTypes.READY || current.getStatus() == current.READY) return StatusTypes.READY;
			else if(previous == StatusTypes.PLAYING || current.getStatus() == current.PLAYING) return StatusTypes.PLAYING;
			else return previous;
		}, false);

		if (_status != statusNew) {
			_status = statusNew;
			containerElement.dispatchEvent(new Event(StatusTypes.EVENT_STATUS, {bubbles:true,cancelable:true}));
			return true;
		}
		return false;
	};

	var _updateRatio = function(){
		// Normalization of the ratios
		var Rtot = data.presentation.viewports.reduce(function(cont, v){
			if(typeof v.currentHandler == "undefined") return cont;
			return cont + v.currentHandler.getRatio();
		}, 0);
		if (Rtot == 0) return;

		var xvp = _this.htmlElement.scrollWidth;
		var yvp = _this.htmlElement.scrollHeight;
		var height = Rtot > xvp/yvp ? xvp / Rtot : yvp;
		console.debug("calculated height: " + height);
		data.presentation.viewports.forEach(function(viewport, viewportIdx){
			if(typeof viewport.currentHandler == "undefined") return;
			viewport.currentHandler.setSize(height);
		});
	};

	// Callback function send to the child players
	var childCallback = function(child, status) {
		console.log("CCB from "+child.TYPE+" status: " + status);
		// TODO Handle the error message!

		// A child has started. But we did not ask it to do so. The user might have clicked on the player :D
		if(status == child.PLAYING && _this.getStatus() != StatusTypes.PLAYING && child.getStatusTarget() != child.PLAYING) {
			_this.play();
			updateStatus();
			return;
		}
		// A child has exited playing. But we did not ask it to do so. The user might have clicked on the player :D
		else if(status != child.PLAYING && _this.getStatus() == StatusTypes.PLAYING && child.getStatusTarget() == child.PLAYING) {
			_this.pause();
			updateStatus();
			return;
		}

		// Calculates the new status!		
		updateStatus();
		if(0 === _this.getDuration() && _this.getStatus() == StatusTypes.READY) updateDuration();


		// Update the rest of the players to follow this.! :D
		if(!_shouldPlay || _this.getStatus() == StatusTypes.ERROR || _this.getStatus() == StatusTypes.LOADING){
			// pause all in a playing state
			_this.pause(true);
		} else {
			// Play all in ready state.
			_this.play(true);
		}
	};

	/*
	 * Loads the presentation in the parameter into the presenter
	 */
	this.load = function() {
		// Adding the resource handler to the presentation object
		data.presentation.viewports.forEach(function(viewport, viewportIdx){
			var viewportElement = document.createElement("div");
			viewport.htmlElement = viewportElement;
			viewportElement.className = "viewport";

			// Generated handlers for each source per viewport. Allowing same source in multiple viewports simultaneously.
			viewport.segues.forEach(function(segue, segueIdx){
				// Gets a reference to the source object
				var source = segue.source;

				// Skip if source not avaliable or not needed
				if(typeof source == "undefined" || segue.action == "clear") return;

				// Ensures that the handlers array exists
				if(typeof source.handlers == "undefined") source.handlers = [];

				// Sets the last shown segue to the first segue in the row
				if(typeof viewport.lastSegue == "undefined") viewport.lastSegue = segue;
				
				// Returns if generated
				if(typeof source.handlers[viewportIdx] != "undefined") return;

				var sourceElement = document.createElement("div");
				if(source.type == "slideshare"){
					source.handlers[viewportIdx] = new SlideSharePlayer(source, sourceElement, childCallback);
				} else if(source.type == "youtube"){
					source.handlers[viewportIdx] = new YouTubePlayer(source, sourceElement, childCallback);
				} else if(source.type == "pdfjs"){
					source.handlers[viewportIdx] = new PdfJsPlayer(source, sourceElement, childCallback);
				} else {
					sourceElement.remove();
					return;
				}

				if(segueIdx == 0){
					viewport.currentHandler = source.handlers[viewportIdx];
				}
				viewportElement.appendChild(sourceElement);
			});

			_viewportContainer.appendChild(viewportElement);
		});

		data.presentation.sources.forEach(function(source){
			if(typeof source.handlers == "undefined") return;
			source.handlers.forEach(function(handler){
				handler.init();
			});
		});
		_updateRatio();
	};


	(function(){
		var _hasExternalData = data instanceof Data;
		if(!_hasExternalData){
			data = new Data(_this);
			_this.htmlElement = containerElement;
		} else {
			_this.htmlElement = document.createElement('div');
			_this.htmlElement.className = 'block-presenter';
		}
		
		_viewportContainer = document.createElement('div');
		_viewportContainer.className = 'block-viewports';
		_this.htmlElement.appendChild(_viewportContainer);

		if(!(controlBar instanceof ControlBar)){
			controlBar = new ControlBar();
		}
		controlBar.initUI(_this);

		_this.htmlElement.appendChild(controlBar.htmlElement);

		_this.addEventListener(EventTypes.EVENT_STATUS, function(e){
			if(_this.getStatus() == StatusTypes.READY){
				_updateRatio();
			}
		}, false);

		_this.addEventListener(EventTypes.EVENT_PRESENTATION_LOADED, function(ev){
			data = ev.detail;
			_this.load();
		});
		data.loadAuto();
	})();
};
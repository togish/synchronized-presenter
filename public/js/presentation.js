/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */


var Presentation = function (containerElement) { // TODO Add options, maybe!
	// When the presentation or child player have had an error stopping the execution!
	this.ERROR = "error";

	// When the presentation or child player is getting ready, or is buffering
	this.LOADING = "loading";

	// When the presentation or child player is ready for playback
	this.READY = "ready";

	// When the presentation or child player is executing playback
	this.PLAYING = "playing";

	// Event type constant for changed status
	this.EVENT_STATUS = "statusChanged";

	// Event type constant for changed duration
	this.EVENT_DURATION = "durationChanged";

	// Declares variables describing the state of the presentation.
	var _this = this;
	var _duration = 0;
	var _position = 0;
	var _lastStart = 0;
	var _status;
	var _timers;
	var _shouldPlay = false;

	// Proxy methods for event subscribe, remove and dispatch
	this.addEventListener = function (a,b,c) {containerElement.addEventListener(a,b,c);};
	this.dispatchEvent = function(a){containerElement.addEventListener(a);};
	this.removeEventListener = function(a,b,c){containerElement.removeEventListener(a,b,c);};
	this.presentation = {};


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
		
		_this.presentation.sources.forEach(function(resource){
			var smallestNegative = {};

			resource.events.forEach(function(ev){
				var delay = ev.offset-_position;
				if (0 <= delay){
					var timer = setTimeout(function(){
						resource.handler.seek(ev.position);
						resource.handler.play();
					}, delay*1000);
					_timers.push(timer);
				} else if(smallestNegative.delay === undefined || smallestNegative.delay <= delay) {
					smallestNegative = {delay:delay,position:ev.position};
				}
			});
			if(smallestNegative.delay !== undefined){
				if(resource.handler.hasTimestamp()){
					smallestNegative.position += _position;
				}
				resource.handler.seek(smallestNegative.position);
				resource.handler.play();
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
		presentation.sources.forEach(function(resource){
			resource.handler.pause();
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
		_this.presentation.sources.forEach(function(resource){
			var handler = resource.handler;
			// Skips if no duration avaliable
			if(handler.getStatus() != handler.READY && handler.getStatus() != handler.PLAYING) return;
			
			// Checks for negative duration. This means no internal timing.
			var resourceDuration = handler.getDuration();
			if(resourceDuration < 0) return;

			// event from resource withthe largest offset.
			var latestEvent = resource.events.reduce(function(previous,current){
				if(previous.offset < current.offset) return current;
				return previous;
			},{offset:-1});

			// Checks if a last event was found.
			// TODO Figure out if this will ever happen, if events has elements.
			if(latestEvent.offset < 0) return;

			var latestPoint = latestEvent.offset - latestEvent.position + resourceDuration;
			if (_duration < latestPoint) {
				_duration = latestPoint;
			}
		});
		if(bef != _duration) containerElement.dispatchEvent(new Event(_this.EVENT_DURATION, {bubbles:true,cancelable:true}));
	};

	// Updates the status of the presentation. Lowest status child decides.
	var updateStatus = function () {
		var statusNew = _this.presentation.sources.reduce(function(previous, resource){
			var current = resource.handler;
			// TODO Ignore if not in the time scope.
			// return previous;

			if(previous == _this.ERROR || current.getStatus() == current.ERROR) return _this.ERROR;
			else if(previous == _this.LOADING || current.getStatus() == current.LOADING) return _this.LOADING;
			else if(previous == _this.READY || current.getStatus() == current.READY) return _this.READY;
			else if(previous == _this.PLAYING || current.getStatus() == current.PLAYING) return _this.PLAYING;
			else return previous;
		}, false);

		if (_status != statusNew) {
			_status = statusNew;
			containerElement.dispatchEvent(new Event(_this.EVENT_STATUS, {bubbles:true,cancelable:true}));
			return true;
		}
		return false;
	};

	// Callback function send to the child players
	var childCallback = function(child, status) {
		console.log("CCB from "+child.TYPE+" status: " + status);
		// TODO Handle the error message!

		// A child has started. But we did not ask it to do so. The user might have clicked on the player :D
		if(status == child.PLAYING && _this.getStatus() != _this.PLAYING && child.getStatusTarget() != child.PLAYING) {
			_this.play();
			updateStatus();
			return;
		}
		// A child has exited playing. But we did not ask it to do so. The user might have clicked on the player :D
		else if(status != child.PLAYING && _this.getStatus() == _this.PLAYING && child.getStatusTarget() == child.PLAYING) {
			_this.pause();
			updateStatus();
			return;
		}

		// Calculates the new status!		
		updateStatus();
		if(0 === _this.getDuration() && _this.getStatus() == _this.READY) updateDuration();


		// Update the rest of the players to follow this.! :D
		if(!_shouldPlay || _this.getStatus() == _this.ERROR || _this.getStatus() == _this.LOADING){
			// pause all in a playing state
			_this.pause(true);
		} else {
			// Play all in ready state.
			_this.play(true);
		}

	};

	this.loadAuto = function() {
		// TODO Extract the presentation from the url
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


	this.load = function(presentation) {
		_this.presentation = presentation;

		// Adding the resource handler to the presentation object
		_this.presentation.sources.forEach(function(resource){
			var viewport = document.createElement("div");
			// if (options.viewportClass != undefined) viewport.classList.add(options.viewportClass);
			containerElement.appendChild(viewport);
	
			if(resource.type == "slideshare"){
				resource.handler = new SlideSharePlayer(resource, viewport, childCallback);
			} else if(resource.type == "youtube"){
				resource.handler = new YouTubePlayer(resource, viewport, childCallback);
			} else {
				viewport.remove();
			}
		});

		_this.presentation.sources.forEach(function(resource){
			resource.handler.init();
		});
	};

};
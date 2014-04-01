/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */

var Presenter = function (containerElement) {
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


	var _viewportContainer;
	var _controlBar;
	var _progress;
	var _progressBar;



	// Proxy methods for event subscribe, remove and dispatch
	this.addEventListener = function (a,b,c) {containerElement.addEventListener(a,b,c);};
	this.dispatchEvent = function(a){containerElement.dispatchEvent(a);};
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

	this.updateRatio = function(){
		// Normalization of the ratios
		var Rtot = _this.presentation.viewports.reduce(function(cont, v){
			if(typeof v.currentHandler == "undefined") return cont;
			return cont + v.currentHandler.getRatio();
		}, 0);
		if (Rtot == 0) return;

		var xvp = document.body.scrollWidth;
		var yvp = document.body.scrollHeight;
		var height = Rtot > xvp/yvp ? xvp / Rtot : yvp;
		_this.presentation.viewports.forEach(function(viewport, viewportIdx){
			if(typeof viewport.currentHandler == "undefined") return;
			viewport.currentHandler.setSize(height);
		});
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
		
		_this.presentation.viewports.forEach(function(viewport, viewportIdx){
			var smallestNegative = {};

			viewport.segues.forEach(function(sg, segueIdx){
				var delay = sg.getOffset()-_position;
				if (0 <= delay){
					var timer = setTimeout(function(){
						// Hide and show viewport
						for(var i = 0; i < viewport.htmlElement.children.length; i++){
							viewport.htmlElement.children[i].style.display = 'none';
						}
						var handler = sg.getSource().handlers[viewportIdx];
						handler.htmlElement.style.display = 'block';
						viewport.currentHandler = handler;

						_this.updateRatio();

						handler.seek(sg.getValue());
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
				var handler = smallestNegative.segue.getSource().handlers[viewportIdx];
				if(handler.hasTimestamp()){
					// smallestNegative.segue.position += _position;
				}
				handler.seek(smallestNegative.segue.getValue());
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
		_this.presentation.sources.forEach(function(source){
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
		_this.presentation.sources.forEach(function(resource){
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
		var statusNew = _this.presentation.viewports.reduce(function(previous, viewport, viewportIdx){
			var current = viewport.lastSegue.getSource().handlers[viewportIdx];
			// TODO Ignore if not in the time scope.
			// return previous;
			if(typeof current === "undefined") return previous;

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

	/*
	 * Tries to load the presentation based on the information in the url
	 */
	this.loadAuto = function() {
		var data = new Data(_this);
		if(UrlParams.b64zip != undefined){
			data.fromB64zip(UrlParams.b64zip);
		} else if(UrlParams.url != undefined){
			data.load(UrlParams.url);
		} else {
			data.loadDialog();
			return false;
		}
		return true;
	};

	/*
	 * Loads the presentation in the parameter into the presenter
	 */
	this.load = function(presentation) {
		// TODO Clear the html for rebuilding? Might be a good idea! LOL!
		_this.presentation = presentation;
		window.pres = presentation;

		// Adding the resource handler to the presentation object
		_this.presentation.viewports.forEach(function(viewport, viewportIdx){
			var viewportElement = document.createElement("div");
			viewport.htmlElement = viewportElement;
			viewportElement.className = "viewport";

			// Generated handlers for each source per viewport. Allowing same source in multiple viewports simultaneously.
			viewport.segues.forEach(function(segue, segueIdx){
				// Gets a reference to the source object
				var source = segue.getSource();

				// Skip if source not avaliable or not needed
				if(typeof source == "undefined" || segue.getAction() == "clear") return;

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

				// TODO Hide the source html element. Might be needed to do this post initialization of content.
			});

			_viewportContainer.appendChild(viewportElement);
		});

		_this.presentation.sources.forEach(function(source){
			if(typeof source.handlers == "undefined") return;
			source.handlers.forEach(function(handler){
				handler.init();
			});
		});
	};

	this.initUI = function(){
		_viewportContainer = document.createElement('div');
		_viewportContainer.className = 'block-viewport';
		containerElement.appendChild(_viewportContainer);

		_controlBar = document.createElement('div');
		_controlBar.className = 'control-bar';
		_progress = document.createElement('div');
		_progress.className = 'progress';
		_progressBar = document.createElement('div');
		_progressBar.className = 'progress-bar';
		_progress.appendChild(_progressBar);
		_controlBar.appendChild(_progress);
		containerElement.appendChild(_controlBar);

		var ease = function(e, to, time){
			e.style["-webkit-transition"] = "width "+time+"s linear";
			e.style.transition = "width "+time+"s linear";
			e.style.width = to + "%";
		}

		_btnPlayPause = document.createElement('button');
		_btnPlayPause.className = "play-pause";
		_controlBar.appendChild(_btnPlayPause);

		_this.addEventListener(_this.EVENT_STATUS, function(e){
			var percent = _this.getCompletedPercent();
			_controlBar.classList.remove("ready");
			_controlBar.classList.remove("playing");
			ease(_progressBar, percent, 0);
			if(_this.getStatus() == _this.READY){
				_this.updateRatio();
				_controlBar.classList.add("ready");
			} else if(_this.getStatus() == _this.PLAYING){
				_controlBar.classList.add("playing");
				ease(_progressBar, 100, _this.getDuration() - _this.getPosition());
			}
		}, false);

		_btnPlayPause.addEventListener('click', function(){
			if(_this.getStatus() == _this.READY){
				_this.play();
			} else if(_this.getStatus() == _this.PLAYING){
				_this.pause();
			}
		});


		_this.addEventListener(_this.EVENT_DURATION, function(e){
			console.log("UI EVENT_DURATION changed to: " + _this.getDuration());
		}, false);
	};
};
/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */

var Presenter = function (containerElement, controlBar, data) {
	// Declares variables describing the state of the presentation.
	var _this = this;

	var _playing = false;
	// Where the position is in a paused contition
	var _position = 0;
	// The absolute time for the last press on play
	var _lastStart = 0;


	// Proxy methods for event subscribe, remove and dispatch
	this.addEventListener = function (a,b,c) {containerElement.addEventListener(a,b,c);};
	this.dispatchEvent = function(a){containerElement.dispatchEvent(a);};
	this.removeEventListener = function(a,b,c){containerElement.removeEventListener(a,b,c);};

	/*
	 * Returns the current position in the playback, in seconds.
	 */
	this.getPosition = function(){
		// If paused return the position calculated on last pause
		if (!_playing) return _position;
		return _position + (new Date().getTime() - _lastStart)/1000;
	};

	/*
	 * Returns if the presentation is ready
	 */
	this.isReady = function(){
		return data.presentation.viewports.reduce(function(cont, viewport){
			if(!viewport.isReady()){
				return false;
			}
			return cont;
		}, true);
	};

	/*
	 * Returns if the presentation is playing. If not ready at the same time, it is not actually playing.
	 */
	this.isPlaying = function(){
		return _playing;
	};

	/*
	 * Plays/continues the presentation
	 */
	this.play = function(skip){
		if(_playing || !_this.isReady()) return;

		// TODO Fire event
		if(!skip) _playing = true;

		// Register the newest start time
		_lastStart = new Date().getTime();

		// if replay seek to start
		
		// Update the current position
		data.presentation.viewports.forEach(function(viewport){
			viewport.playFrom(_position);
		});

	};
		
	/*
	 * Pauses the presentation.
	 */
	this.pause = function(skip) {
		if(!_playing) return;
		_position = this.getPosition();

		// TODO Fire event
		if(!skip) _playing = false;

		// Update the current position
		data.presentation.viewports.forEach(function(viewport){
			// No matter what, just pause the media. Better safe than sorry.
			viewport.pause();
		});
	};
		
	/*
	 * Seeks the entire presentation to the defined position
	 */
	this.seek = function (position) {
		this.pause();
		_position = position;
		this.play();
	};

	/*
	 * 
	 */
	var _updateRatio = function(){
		// Normalization of the ratios
		var Rtot = data.presentation.viewports.reduce(function(cont, viewport){
			return cont + viewport.getCurrentRatio();
		}, 0);
		if (Rtot == 0) return;

		var xvp = _this.htmlElement.scrollWidth;
		var yvp = _this.htmlElement.scrollHeight;
		var height = Rtot > xvp/yvp ? xvp / Rtot : yvp;
		data.presentation.viewports.forEach(function(viewport, viewportIdx){
			viewport.setSize(height);
		});
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

		var _viewportContainer = document.createElement('div');
		_viewportContainer.className = 'block-viewports';
		_this.htmlElement.appendChild(_viewportContainer);

		if(!(controlBar instanceof ControlBar)){
			controlBar = new ControlBar();
		}
		controlBar.initUI(_this);

		_this.htmlElement.appendChild(controlBar.htmlElement);


		_this.addEventListener(EventTypes.EVENT_VIEWPORT_PLAYER_CHANGED, function(e){
			_updateRatio();
		});


		// EVENT_VIEWPORT_READYNESS_CHANGED
		_this.addEventListener(EventTypes.EVENT_VIEWPORT_READYNESS_CHANGED, function(ev){
			if(_this.isReady()){
				_updateRatio();
				if(_playing){
					// If becomming ready again, 
					_this.play(true);
				}
			} else {
				// If not ready, ensure nothing is playing.
				_this.pause(true);
			}
		}, false);

		var fillContainer = function(){
			// Empty the presenter
			while(_viewportContainer.firstChild){
				_viewportContainer.removeChild(_viewportContainer.firstChild);
			}

			// Fill it again.
			data.presentation.viewports.forEach(function(viewport, viewportIdx){
				_viewportContainer.appendChild(viewport.htmlElement);
			});
		};

		_this.addEventListener(EventTypes.EVENT_PRESENTATION_LOADED, function(ev){
			data = ev.detail;
			fillContainer();
		});

		_this.addEventListener(EventTypes.EVENT_VIEWPORT_ADDED, function(ev){
			fillContainer();
		});
		_this.addEventListener(EventTypes.EVENT_VIEWPORT_REMOVED, function(ev){
			fillContainer();
		});


		_this.addEventListener(EventTypes.EVENT_SEGUE_ADDED, function(ev){

		});
		_this.addEventListener(EventTypes.EVENT_SEGUE_REMOVED, function(ev){
		});
		_this.addEventListener(EventTypes.EVENT_SEGUE_CHANGED, function(ev){
		});

		// Handle when a timeline is added or removed
			// Invoke the same method as when a presentation is loaded, except for the update data reference
		// Handle when a segue is added or changed
			// Play pause trick

		if(!_hasExternalData){
			data.loadAuto();
		}
	})();



//	var _duration = 0;
//
//	/*
//	 * Returns the over all duration of the presentation, in seconds.
//	 */
//	this.getDuration = function(){
//		return _duration;
//	};
//
//	/*
//	 * Returns percent describing how long into the presentation we are.
//	 */
//	this.getCompletedPercent = function(){
//		// Avoid division by zero
//		if(this.getDuration() === 0) return 0;
//		return (this.getPosition()/this.getDuration())*100;
//	};
//
//	/*
//	 *
//	 */
//	var updateDuration = function() {
//		// Run through all of the 
//		var bef = _duration;
//		_duration = 500;
//
//
//		// Take the last segue in each of the viewports
//		// Calculate the latest point bases
//		
//		/*
//		data.presentation.sources.forEach(function(resource){
//			var handler = resource.handler;
//			// Skips if no duration avaliable
//			if(handler.getStatus() != handler.READY && handler.getStatus() != handler.PLAYING) return;
//			
//			// Checks for negative duration. This means no internal timing.
//			var resourceDuration = handler.getDuration();
//			if(resourceDuration < 0) return;
//
//			// event from resource withthe largest offset.
//			// var latestEvent = resource.events.reduce(function(previous,current){
//				// if(previous.offset < current.offset) return current;
//				// return previous;
//			// },{offset:-1});
//
//			// Checks if a last event was found.
//			// TODO Figure out if this will ever happen, if events has elements.
//			if(latestEvent.offset < 0) return;
//
//			var latestPoint = latestEvent.offset - latestEvent.position + resourceDuration;
//			if (_duration < latestPoint) {
//				_duration = latestPoint;
//			}
//		});
//		if(bef != _duration) containerElement.dispatchEvent(new CustomEvent(_this.EVENT_DURATION, {bubbles:true,cancelable:true}));
//		*/
//	};
};
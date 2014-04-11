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
	// Ready variable
	var _ready = false;
	var _pauseTimer;


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
		if (!(data instanceof Data) || typeof data.presentation.viewports == "undefined") return 0;
		_ready = data.presentation.viewports.reduce(function(cont, viewport){
			if(!viewport.isReady()){
				return false;
			}
			return cont;
		}, true);
		return _ready;
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

		// Register the newest start time
		_lastStart = new Date().getTime();

		if(!skip) {
			_playing = true;
			_this.dispatchEvent(new CustomEvent(EventTypes.EVENT_PRESENTER_STATUS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
		}

		_pauseTimer = setTimeout(function(){
			_this.pause();
		},(_this.getDuration() - _position)*1000);
		
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

		if(!skip) {
			_playing = false;
			_this.dispatchEvent(new CustomEvent(EventTypes.EVENT_PRESENTER_STATUS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
		}

		// Update the current position
		data.presentation.viewports.forEach(function(viewport){
			// No matter what, just pause the media. Better safe than sorry.
			viewport.pause();
		});

		if(typeof _pauseTimer != "undefined") clearTimeout(_pauseTimer);
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


	var _durationOld = 0;

	/*
	 * Returns the over all duration of the presentation, in seconds.
	 */
	this.getDuration = function(){
		if (!(data instanceof Data) || typeof data.presentation.viewports == "undefined") return 0;
		return data.presentation.viewports.reduce(function(cont, viewports){
			var len = viewports.getLength();
			return cont < len ? len : cont;
		}, 0);
	};

	/*
	 * Returns percent describing how long into the presentation we are.
	 */
	this.getCompletedPercent = function(){
		// Avoid division by zero
		if(this.getDuration() === 0) return 0;
		return (this.getPosition()/this.getDuration())*100;
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
			if(_ready != _this.isReady()){
				_this.dispatchEvent(new CustomEvent(EventTypes.EVENT_PRESENTER_READYNESS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
			}
			if(_ready){
				updateDuration();
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

		var updateDuration = function(){
			// Has dat length changed?? :D
			var newDur = _this.getDuration();
			if(_durationOld != newDur){
				_durationOld = newDur;
				_this.dispatchEvent(new CustomEvent(EventTypes.EVENT_PRESENTER_DURATION_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
			}
		};

		var fillContainer = function(){
			// Fill it again.
			data.presentation.viewports.forEach(function(viewport, viewportIdx){
				// todo check if not there allready
				var found = false;
				for (var i = 0;i < _viewportContainer.children.length; i++) {
					if(_viewportContainer.children[i] === viewport.htmlElement) found = true;
				};
				if(!found) _viewportContainer.appendChild(viewport.htmlElement);
			});
			_updateRatio();
		};

		_this.addEventListener(EventTypes.EVENT_PRESENTATION_LOADED, function(ev){
			data = ev.detail;
			fillContainer();
			updateDuration();
			document.title = data.presentation.title;
		});

		_this.addEventListener(EventTypes.EVENT_VIEWPORT_ADDED, function(ev){
			fillContainer();
		});
		_this.addEventListener(EventTypes.EVENT_VIEWPORT_REMOVED, function(ev){
			fillContainer();
		});


		var updateViewports = function(){
			if(_this.isPlaying()){
				_this.pause();
				_this.play();
			} else {
				_this.play();
				_this.pause();
			}
			updateDuration();
			_updateRatio();
		};

		// Do the play pause trick when changes occour
		_this.addEventListener(EventTypes.EVENT_SEGUE_ADDED, function(ev){
			updateViewports();
		});
		_this.addEventListener(EventTypes.EVENT_SEGUE_REMOVED, function(ev){
			updateViewports();
		});
		_this.addEventListener(EventTypes.EVENT_SEGUE_CHANGED, function(ev){
			updateViewports();
		});

		if(!_hasExternalData){
			data.loadAuto();
		}
	})();
};
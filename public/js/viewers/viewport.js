/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */

var Viewport = function (viewportObject) {
	this.segues = viewportObject.segues;
	this.htmlElement = document.createElement('div');
	
	var _this = this;
	var _playing = false;

	var _playersInitiated = false;
	var _currentPlayer;
	var _sources = [];
	var _players = [];

	var _timer;
	var _timerNext;

	/*
	 * Adds a segue to the viewport
	 */
	this.addSegue = function(segue){
		viewportObject.segues.push(segue);
		_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SEGUE_ADDED, {detail: segue, bubbles:true, cancelable:true}));
	};

	/*
	 * Returns the current players ratio
	 */
	this.getCurrentRatio = function(){
		// Depends on the current player
		var ret = _currentPlayer.getRatio();
		if(typeof ret == "number" && 0 <= ret) return ret;
		return 0;
	};

	/*
	 * Sets the viewport and current player's size according to ratio and height
	 */
	this.setSize = function(height){
		if(typeof _currentPlayer != "object" || typeof _currentPlayer.setSize != "function") return;
		_currentPlayer.setSize(height);
	};

	/*
	 * Returns if the viewport is playing
	 */
	this.isPlaying = function(){
		return _playing;
	};

	/*
	 * Returns the viewport is ready for playback
	 */
	this.isReady = function(){
		return _players.reduce(function(cont, player){
			if (!player.isReady()) {
				return false;
			};
			return cont;
		}, true);
	};

	/*
	 * Play the viewport
	 */
	this.playFrom = function(position){
		// find the clostest segue
		_playing = true;
		var currentSegue = _this.segues.reduce(function(cont, segue){
			if(segue.offset <= position || typeof cont == "undefined") return segue;
			return cont;
		}, undefined);

		var currentSeguePos = _this.segues.indexOf(currentSegue);
		if (0 <= currentSeguePos || currentSeguePos < _this.segues.length - 1) {
			var nextSegue = _this.segues[currentSeguePos + 1];
		};

		var timeout = currentSegue.offset - position;
		var value = currentSegue.value;
		if(timeout < 0) {
			if (currentSegue.timed){
				value = value - timeout;
			}
			timeout = 0;
		}
		_timer = setTimeout(function(){
			var playerPos = _sources.indexOf(currentSegue.source);

			// Fail securing
			if (playerPos == -1) return;
			if(_currentPlayer !== _players[playerPos]){
				_currentPlayer = _players[playerPos];
				// if changed fire event about that, let the parent resize and arrange
				_showOnlyCurrentViewport();
				_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_VIEWPORT_PLAYER_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
			}

			_currentPlayer.seek(value);
			_currentPlayer.play();
		}, timeout * 1000);

		if(nextSegue instanceof Segue){
			_timerNext = setTimeout(function(){
				_this.playFrom(nextSegue.offset);
			}, (nextSegue.offset - position) * 1000);
		}
	};

	/*
	 * Pauses the viewport
	 */
	this.pause = function(){
		_playing = true;
		if(typeof _timer != "undefined"){
			clearTimeout(_timer);
			_timer = undefined;
		}
		if(typeof _timerNext != "undefined"){
			clearTimeout(_timerNext);
			_timerNext = undefined;
		}

		// Ensure that every player is paused!
		_players.forEach(function(player){
			player.pause();
		});
	};

	var _setupSource = function(source){
		if(_sources.indexOf(source) == -1){
			var pos = _sources.push(source) - 1;
			if(source.type == "slideshare"){
				_players[pos] = new SlideSharePlayer(source);
			} else if(source.type == "youtube"){
				_players[pos] = new YouTubePlayer(source);
			} else if(source.type == "pdfjs"){
				_players[pos] = new PdfJsPlayer(source);
			} else {
				// Remove that sh** again!
				_sources.splice(pos,1);
				return;
			}
			_this.htmlElement.appendChild(_players[pos].htmlElement);
		}
	};

	var _showOnlyCurrentViewport = function(){
		// hide unneeded players
		_players.forEach(function(player){
			player.htmlElement.style.display = _currentPlayer === player ? 'block' : 'none';
		});
	};

	var _updatePlaying = function(playing){
		if(_playing != playing){
			_playing = playing;
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_PLAYER_STATUS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
		}
	};

	var _lastReadyness = false;
	var _checkReadyness = function(){
		var newReadyness = _this.isReady();
		if(_playersInitiated && newReadyness != _lastReadyness){
			_lastReadyness = newReadyness;
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_VIEWPORT_READYNESS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
		}
	};


	(function(){
		_this.htmlElement.className = 'viewport';

		// Setting up the listner for child state changes
		_this.htmlElement.addEventListener(EventTypes.EVENT_PLAYER_READYNESS_CHANGED ,function(ev){
			_checkReadyness();
		});

		// Set up the players needed
		viewportObject.segues.reduce(function(cont, segue){
			_setupSource(segue.source);
			return cont;
		}, undefined);
		_currentPlayer = _players[0];
		_showOnlyCurrentViewport();
		_playersInitiated = true;
		_checkReadyness();
	})();
};
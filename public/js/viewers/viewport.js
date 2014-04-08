/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */

var Viewport = function (viewportObject) {
	this.segues = viewportObject.segues;
	
	var _this = this;
	var _playing = false;

	var _currentPlayer;
	var _sources = [];
	var _players = [];
	var _playersInitiated = false;

	var _timer;
	var _timerNext;

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
			if(_currentPlayer !== _players[playerPos]){
				_currentPlayer = _players[playerPos];
				// hide unneeded players
				_players.forEach(function(player){
					if(player === _currentPlayer){
						player.htmlElement.style.display = 'block';
					} else {
						player.htmlElement.style.display = 'none';
					}
				});
				// if changed fire event about that, let the parent resize and arrange
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

	(function(){
		_this.htmlElement = document.createElement('div');
		_this.htmlElement.className = 'viewport';

		// Setting up the listner for child state changes
		_this.htmlElement.addEventListener(EventTypes.EVENT_PLAYER_READYNESS_CHANGED ,function(ev){
			if(_this.isReady() && _playersInitiated){
				_players.forEach(function(player, idx){
					if(idx>0){
						player.htmlElement.style.display = 'none';
					} else {
						_currentPlayer = player;
					}
				});
				_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_VIEWPORT_READYNESS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
			}
		});

		// Childplayer autonomus state changes should be handled.! LOL
		_this.htmlElement.addEventListener(EventTypes.EVENT_PLAYER_STATUS_CHANGED, function(ev){
			
			
			//var player = ev.detail;
			//if(_playing && player === _currentPlayer && player.getStatus() != StatusTypes.PLAYING && player.isReady()){
			//	// Force start.. Maybe handle this a little better. Is it still ready??
			//	console.log("force start: is YT? " + (player instanceof YouTubePlayer));
			//	console.debug(player);
			//	player.play();
			//} else if(player !== _currentPlayer && player.getStatus() == StatusTypes.PLAYING){
			//	console.log("force pause: is YT? " + (player instanceof YouTubePlayer));
			//	player.pause();
			//}
		});

		// Set up the players needed
		_sources = viewportObject.segues.reduce(function(cont, segue){
			var source = segue.source;
			if(cont.indexOf(source) == -1){
				cont.push(source);
				var pos = cont.length - 1;
				if(source.type == "slideshare"){
					_players[pos] = new SlideSharePlayer(source);
				} else if(source.type == "youtube"){
					_players[pos] = new YouTubePlayer(source);
				} else if(source.type == "pdfjs"){
					_players[pos] = new PdfJsPlayer(source, sourceElement, childCallback);
				}
				_this.htmlElement.appendChild(_players[pos].htmlElement);
			}
			return cont;
		}, []);
		_playersInitiated = true;
	})();
};
/* jshint strict: false */
/* exported YouTubePlayer */
/* global YT: false */
/* global console: false */

var YouTubeHelpers = function(){
	this.parseUrl = function(url){
		// Thanks for regex to: http://lasnv.net/foro/839/Javascript_parsear_URL_de_YouTube
		var match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);
		// Checks that we got an id
		if (!(match && match[7].length==11)){
			return;
		}
		return match[7];
	};

	this.loadMetadata = function(videoId, callback){
		// Load the metadata about the video in order to get the duration before playback.
		var req = new XMLHttpRequest();
		req.onreadystatechange = function() {
			if (req.readyState === 4){
				callback(JSON.parse(req.responseText).data);
			}
		};
		req.open('GET', 'http://gdata.youtube.com/feeds/api/videos/' + videoId + '?v=2&alt=jsonc', true);
		req.send(null);
	};
	return this;
} ();



var YouTubePlayer = function (resource) {
	var _this = this;
	var _ready = {"meta": false, "player":false};
	var _playing = false;
	var _duration = 0;
	var _lastClickPlay = false;
	var _ratio = 1.777;
	var _player;

	// Returns the players readyness
	this.isReady = function(){
		return _ready['meta'] && _ready['player'];
	};

	// Returns the players current status
	this.isPlaying = function(){
		return _playing;
	};

	// Returns true if the resource is using timestamps
	this.hasTimestamp = function(){
		return true;
	};

	// Returns the position, could be slide number or timestamp.
	this.getPosition = function(){
		if(typeof _player == "undefined") return 0;
		return _player.getCurrentTime();
	};

	// Returns the length of the player
	this.getDuration = function(){
		return _duration;
	};

	// Returns the aspect ratio of the player
	this.getRatio = function(){
		return _ratio;
	};

	// Sets the size of the player based on the height
	this.setSize = function(height){
		if(!_this.isReady()) return;
		var frame= _player.a;
		frame.height = height;
		frame.width = height * _this.getRatio();
		_this.htmlElement.style.height = height + 'px';
		_this.htmlElement.style.width = height * _this.getRatio() + 'px';
	};

	// Starts the playback
	this.play = function(){
		if(typeof _player == "undefined") return;
		_lastClickPlay = true;
		_player.playVideo();
	};

	// Pauses the playback
	this.pause = function(){
		if(typeof _player == "undefined") return;
		_lastClickPlay = false;
		if (typeof _player.pauseVideo == "function") {
			_player.pauseVideo();
		};
	};

	// Sets the position of the playback, could be slidenumber or timestamp
	this.seek = function(position){
		if(typeof _player == "undefined") return;
		_player.seekTo(position, true);
	};

	var _updatePlaying = function(playing){
		if(_playing != playing){
			_playing = playing;
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_PLAYER_STATUS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
		}
	};
	
	var _updateReady = function(src, status){
		var readyBefore = _this.isReady();
		_ready[src] = status;
		if(_this.isReady() != readyBefore){
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_PLAYER_READYNESS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
		}
	};

	(function(){
		_this.htmlElement = document.createElement('div');
		_this.htmlElement.className = 'player-youtube';

		var videoId = YouTubeHelpers.parseUrl(resource.url);
		YouTubeHelpers.loadMetadata(videoId, function(data){
			_ratio = typeof data.aspectRatio == "string" && data.aspectRatio == "widescreen" ? 16/9 : 4/3;
			_duration = data.duration
			_updateReady("meta", true);
		});

		// Construct the player
		var playerElement = document.createElement('div');
		_this.htmlElement.appendChild(playerElement);

		var _abortPlayback = true;

		_player = new YT.Player(playerElement, {
			height: '360',
			width: '640',
			videoId: videoId,
			playerVars: {
				showinfo:0,	// Hides information
				rel:0,	// Hides related videos at end
				controls:0, // Hides controls
				html5:1, // Forces html5
				disablekb:1, // disables keyboard shortcuts
				// disables annotations
				iv_load_policy:3, // jshint ignore:line
			},
			events: {
				'onReady': function(){
					_player.seekTo(0, true);
				},
				'onStateChange': function(s){
					if(_abortPlayback && s.data == 1){ // Successfull playback. But only on init.
						_player.pauseVideo();
						_abortPlayback = false;
						return;
					}

					// Send event upstream and set variables
					// NOT READY/NOT PLAYING:    -1 (unstarted), 3 (buffering)
					if(s.data == -1 || s.data == 3){
						_updateReady("player", false);
						_updatePlaying(false);
					}
					// READY/NOT PLAYING:  0 (ended), 2 (paused), ??? Not relevant 5 (cued)
					else if(s.data == 0 || s.data == 2 || s.data == 5){
						// If supposed to play.. eg. pause is not called as the last instruction.. Just start the party again :D
						if (_lastClickPlay) {
							_player.playVideo();
							return;
						};
						_updateReady("player", true);
						_updatePlaying(false);
					}
					// READY/PLAYING: 1 (playing)
					else if(s.data == 1){
						_updateReady("meta", true);
						_updatePlaying(true);
					}
				},
				'onError': function(e){
					_updateReady("player", false);
					_updatePlaying(false);
					//  This event fires if an error occurs in the player. The value that the API passes to the event listener function will be an integer that identifies the type of error that occurred. Possible values are:
					//  2 – The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.
					//  100 – The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.
					//  101 – The owner of the requested video does not allow it to be played in embedded players.
					//  150 – This error is the same as 101. It's just a 101 error in disguise!
				}
			}
		});
	})();
};

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
	var _ready = {"meta": false,"player":false};
	var _duration = 0;
	var _player;
	var _ratio;
	var _status = StatusTypes.LOADING;

	// Returns the players readyness
	this.isReady = function(){
		return _ready['meta'] && _ready['player'];
	};

	// Returns the players current status
	this.getStatus = function(){
		return _status;
	};

	// Returns true if the resource is using timestamps
	this.hasTimestamp = function(){
		return true;
	};

	// Returns the position, could be slide number or timestamp.
	this.getPosition = function(){
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
		if(!_this.isReady()){
			return;
		}
		var frame= _player.a;
		frame.height = height;
		frame.width = height * _this.getRatio();
		_this.htmlElement.style.height = height + 'px';
		_this.htmlElement.style.width = height * _this.getRatio() + 'px';
	};

	// Starts the playback
	this.play = function(){
		_player.playVideo();
	};

	// Pauses the playback
	this.pause = function(){
		if (typeof _player.pauseVideo == "function") {
			_player.pauseVideo();
		};
	};

	// Sets the position of the playback, could be slidenumber or timestamp
	this.seek = function(position){
		if(_status != this.ERROR) _player.seekTo(position);
		// TODO Do as the target status says?? Maybe..
	};

	var _updateStatus = function(status){
		if(_status != status){
			_status = status;
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
					_updateReady("player", true);
					_updateStatus(StatusTypes.PAUSED); // Ready and paused
				},
				'onStateChange': function(s){
					var c = s.data;
					// -1 (unstarted), 3 (buffering)
					if(c == -1 || c == 3){
						_updateReady("player", false);
						_updateStatus(StatusTypes.LOADING); // Not ready and paused
					}
					// 0 (ended), 2 (paused), 5 (cued)
					else if(c === 0 || c == 2 || c == 5){
						_updateReady("player", true);
						_updateStatus(StatusTypes.PAUSED); // Ready and paused
					}				
					// 1 (playing)
					else if(c == 1) {
						_updateReady("player", true);
						_updateStatus(StatusTypes.PLAYING); // Ready and playing
					}
				},
				'onError': function(e){
					_updateReady("player", false);
					_updateStatus(StatusTypes.ERROR); // Not ready and paused
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

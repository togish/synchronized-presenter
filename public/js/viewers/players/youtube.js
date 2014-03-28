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



var YouTubePlayer = function (resource, targetElement, callback) {
	// The name of the platform integrated
	this.TYPE = 'YouTube';
	
	// When the player is getting ready, or is buffering
	this.LOADING = 'loading';

	// When the player have had an error stopping the execution!
	this.ERROR = 'error';

	// When the player is ready for playback
	this.READY = 'ready';

	// When the player is going from ready to playback
	this.CUED = 'cued';

	// When the player is executing playback
	this.PLAYING = 'playing';

	var _this = this;
	var _duration = 0;
	var _status;
	var _statusTarget;
	var _videoId;
	var _player;
	var _readyMetadata = false;
	var _readyVideo = false;

	var updateStatus = function (status) {
		if (_status == status) return false;
		_status = status;
		callback(_this, _status);
		return true;
	};

	// Returns true if the resource is using timestamps
	this.hasTimestamp = function(){
		return true;
	};

	// Returns the position, could be slide number or timestamp.
	this.getPosition = function(){
		// TODO Check that YT player gives 0 unless it is at a position!
		return _player.getCurrentTime();
	};

	// Returns the length of the player
	this.getDuration = function(){
		return _duration;
	};

	// Returns the players current status
	this.getStatus = function(){
		return _status;
	};

	this.getStatusTarget = function(){
		return _statusTarget;
	};

	// Starts the playback
	this.play = function(){
		if(_status != this.ERROR && _status != this.LOADING && _statusTarget != this.PLAYING) _player.playVideo();
		_statusTarget = this.PLAYING;
	};

	// Pauses the playback
	this.pause = function(){
		if(_status != this.ERROR && _status != this.LOADING && _statusTarget != this.READY) _player.pauseVideo();
		_statusTarget = this.READY;
	};

	// Sets the position of the playback, could be slidenumber or timestamp
	this.seek = function(position){
		if(_status != this.ERROR) _player.seekTo(position);
	};

	var callbackTryReady = function(){
		if(_readyMetadata && _readyVideo) updateStatus(_this.READY);
	};


	this.init = function(){
		updateStatus(_this.LOADING);
		_videoId = YouTubeHelpers.parseUrl(resource.data.url);
	
		YouTubeHelpers.loadMetadata(_videoId, function(data){
			_duration = data.duration;
			_readyMetadata = true;
			callbackTryReady();
		});

		// Construct the player
		_player = new YT.Player(targetElement, {
			height: '360', // TODO Detect the size of the viewport!
			width: '640',
			videoId: _videoId,
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
					_readyVideo = true;
					callbackTryReady();
				},
				'onStateChange': function(s){
					var c = s.data;
					// -1 (unstarted), 3 (buffering)
					if(c == -1 || c == 3) updateStatus(_this.LOADING);

					// 0 (ended), 2 (paused)
					else if(c === 0 || c == 2) updateStatus(_this.READY);
					
					// 5 (video cued).
					else if(c == 5) updateStatus(_this.CUED);
					
					// 1 (playing)
					else if(c == 1) updateStatus(_this.PLAYING);
				},
				'onError': function(e){
					console.log('' + e);
					updateStatus(_this.ERROR);
					//  This event fires if an error occurs in the player. The value that the API passes to the event listener function will be an integer that identifies the type of error that occurred. Possible values are:
					//  2 – The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.
					//  100 – The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.
					//  101 – The owner of the requested video does not allow it to be played in embedded players.
					//  150 – This error is the same as 101. It's just a 101 error in disguise!
				}
			}
		});
	};
};

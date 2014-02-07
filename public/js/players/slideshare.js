/* jshint strict: false */
/* exported SlideSharePlayer */
/* global SlideShareViewer: false */
var SlideSharePlayer = function(resource, targetElement, callback){
	// The name of the platform integrated
	this.TYPE = 'SlideShare';

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
	var _status;
	var _statusTarget;
	var _viewer;

	var updateStatus = function (status) {
		if (_status == status) return false;
		_status = status;
		callback(_this, _status);
		return true;
	};

	// Returns true if the resource is using timestamps
	this.hasTimestamp = function(){
		return false;
	};

	// Returns the position, could be slide number or timestamp.
	this.getPosition = function(){
		return _viewer.getPosition();
	};

	// Returns the length of the player
	this.getDuration = function(){
		return -1;
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
		// TODO Check of possible
		_statusTarget = this.PLAYING;
		if(_status !== undefined) updateStatus(_this.PLAYING);
	};

	// Pauses the playback
	this.pause = function(){
		// TODO Check of possible
		_statusTarget = this.READY;
		if(_status !== undefined) updateStatus(_this.READY);
	};

	// Sets the position of the playback, could be slidenumber or timestamp
	this.seek = function(position){
		// TODO Check of possible
		_viewer.jumpTo(position);
	};

	this.init = function(){
		updateStatus(_this.LOADING);
		_viewer = new SlideShareViewer(resource.data.url, targetElement, {
			readyCallback: function(){
				updateStatus(_this.READY);
			}});
	};
};

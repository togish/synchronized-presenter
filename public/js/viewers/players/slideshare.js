/* jshint strict: false */
/* exported SlideSharePlayer */
/* global SlideShareViewer: false */
var SlideSharePlayer = function(resource){
	var _this = this;
	var _viewer;	
	var _ready;
	var _status = StatusTypes.LOADING;
	var _statusTarget = StatusTypes.READY;


	// Returns the players readyness
	this.isReady = function(){
		return _ready;
	};

	// Returns the players current status
	this.getStatus = function(){
		return _status;
	};

	// Returns true if the resource is using timestamps
	this.hasTimestamp = function(){
		return false;
	};

	// Returns the position, could be slide number or timestamp.
	this.getPosition = function(){
		return _viewer.currentSlide();
	};

	// Returns the length of the player
	this.getDuration = function(){
		return _viewer.length();
	};

	// Returns the aspect ratio of the player
	this.getRatio = function(){
		return _viewer.getRatio();
	};

	// Sets the size of the player based on the height
	this.setSize = function(height){
		_this.htmlElement.style.height = height + 'px';
		_this.htmlElement.style.width = height * _this.getRatio() + 'px';
	};

	// Starts the playback
	this.play = function(){
		if(_ready) _updateStatus(StatusTypes.PLAYING);
	};

	// Pauses the playback
	this.pause = function(){
		if(_ready) _updateStatus(StatusTypes.PAUSED);
	};

	// Sets the position of the playback, could be slidenumber or timestamp
	this.seek = function(position){
		_viewer.jumpTo(position);
	};

	var _updateStatus = function(status){
		if(_status != status){
			_status = status;
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_PLAYER_STATUS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
		}
	};

	(function(){
		_this.htmlElement = document.createElement('div');
		_this.htmlElement.className = 'player-slideshare';
		_updateStatus(_this.LOADING);
		_viewer = new SlideShareViewer(resource.url, _this.htmlElement, {readyCallback: function(){
			if(!_ready){
				_ready = true;
				_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_PLAYER_READYNESS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
			}
			_updateStatus(StatusTypes.PAUSED);
		}});
	})();
};

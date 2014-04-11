/* jshint strict: false */
/* exported SlideSharePlayer */
/* global SlideShareViewer: false */
var SlideSharePlayer = function(resource){
	var _this = this;
	var _ready = false;
	var _playing = false;
	var _viewer;


	// Returns the players readyness
	this.isReady = function(){
		return _ready;
	};

	// Returns the players current status
	this.isPlaying = function(){
		return _playing;
	};

	// Returns true if the resource is using timestamps
	this.hasTimestamp = function(){
		return false;
	};

	// Returns the position, could be slide number or timestamp.
	this.getPosition = function(){
		if(typeof _viewer == "undefined") return 0;
		return _viewer.currentSlide();
	};

	// Returns the length of the player
	this.getDuration = function(){
		if(typeof _viewer == "undefined") return 0;
		return _viewer.length();
	};

	// Returns the aspect ratio of the player
	this.getRatio = function(){
		if(typeof _viewer == "undefined") return 1.777;
		return _viewer.getRatio();
	};

	// Sets the size of the player based on the height
	this.setSize = function(height){
		_this.htmlElement.style.height = height + 'px';
		_this.htmlElement.style.width = height * _this.getRatio() + 'px';
	};

	// Starts the playback
	this.play = function(){
		if(_ready) _updatePlaying(true);
	};

	// Pauses the playback
	this.pause = function(){
		_updatePlaying(false);
	};

	// Sets the position of the playback, could be slidenumber or timestamp
	this.seek = function(position){
		if(typeof _viewer == "undefined") return;
		_viewer.jumpTo(position);
	};

	var _updatePlaying = function(playing){
		if(_playing != playing){
			_playing = playing;
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_PLAYER_STATUS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
		}
	};

	var _updateReady = function(ready){
		if(_ready != ready){
			_ready = ready;
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_PLAYER_READYNESS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
		}
	};

	(function(){
		_this.htmlElement = document.createElement('div');
		_this.htmlElement.className = 'player-slideshare';
		_viewer = new SlideShareViewer(resource.url, _this.htmlElement, {readyCallback: function(){
			_updateReady(true);
			_updatePlaying(false);
		}});
	})();
};

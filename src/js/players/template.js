// template
// Interface definition for external media resource
// The interface is closure based!

// Defines a player wrapper
var TemplatePlayer = function(resource, targetElement){
	var _this = this;

	// Returns the players readyness
	this.isReady = function(){};

	// Returns the players current status
	this.getStatus = function(){};

	// Returns true if the resource is using timestamps
	this.hasTimestamp = function(){};

	// Returns the position, could be slide number or timestamp.
	this.getPosition = function(){};

	// Returns the length of the player
	this.getDuration = function(){};

	// Returns the aspect ratio of the player
	this.getRatio = function(){};

	// Sets the size of the player based on the height
	this.setSize = function(height){};

	// Starts the playback
	this.play = function(){};

	// Pauses the playback
	this.pause = function(){};

	// Sets the position of the playback, could be slidenumber or timestamp
	this.seek = function(position){};

	(function(){
		// Event: ReadynessChanged(_this)
		_this.htmlElement.dispatchEvent(new Event(EventTypes.EVENT_PLAYER_READYNESS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));

		// Event: StatusChange(_this)
		_this.htmlElement.dispatchEvent(new Event(EventTypes.EVENT_PLAYER_STATUS_CHANGED, {detail: _this, bubbles:true, cancelable:true}));
	})();
};
// template
// Interface definition for external media resource
// The interface is closure based!

// Defines a player wrapper
var PdfJsPlayer = function(resource){
	var _this = this;
	var _numOfPages = 0;
	var _current = 0;
	var _playing = false;
	var _ready = false;
	var _ratio = 4/3;
	var _targetHeight = 100;
	var _canvas;
	var _page;
	var _pdf;

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

	// Returns the length of the player
	this.getDuration = function(){
		return _numOfPages;
	};

	// Returns the position, could be slide number or timestamp.
	this.getPosition = function(){
		return _current;
	};

	// Returns the aspect ratio of the player
	this.getRatio = function(){
		return _ratio;
	};

	// Sets the size of the player based on the height
	this.setSize = function(height){
		_targetHeight = height;
		_this.htmlElement.style.height = height;
		_this.htmlElement.style.width = height * _ratio;
		_renderPage();
	};
	window.ses = this.setSize;

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
		if (position >= _numOfPages || position < 0) return;
		_pdf.getPage(position).then(function(page) {
			_page = page;
			_renderPage();
			_current = position;
		});
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


	var _renderPage = function(){
		if(typeof _page == "undefined") return;
		// Initial load of viewport
		var viewport = _page.getViewport(1);
		// Ajusted viewport
		viewport = _page.getViewport(_targetHeight/viewport.height);
		_canvas.height = _targetHeight;
		_canvas.width = _targetHeight * _ratio;
		_page.render({
			canvasContext: _canvas.getContext('2d'), 
			viewport: viewport
		});
	};

	(function(){
		// Grap the url from the configuration
		_this.htmlElement = document.createElement('div');
		_canvas = document.createElement('canvas');
		_this.htmlElement.appendChild(_canvas);
		PDFJS.getDocument(resource.url).then(function(pdf) {
			_pdf = pdf;
			_numOfPages = pdf.numPages;
			_this.seek(1);
			_updateReady(true);
			// Run through all and find most frequent
			// _ratio = viewport.width/viewport.height;
		});
	})();
};
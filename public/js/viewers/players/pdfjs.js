// template
// Interface definition for external media resource
// The interface is closure based!

// Defines a player wrapper
var PdfJsPlayer = function(resource, targetElement, callback){
	// The name of the platform integrated
	this.TYPE = 'pdfjs';

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

	this.htmlElement = targetElement;

	var _this = this;

	// Example:
	// callback(this, this.PLAYING);
	var _numOfPages = 0;
	var _current = 0;
	var _status;
	var _canvas;
	var _ratio = 4/3;
	var _targetHeight = 1;

	var _renderPage = function(pageNo){
		console.log("Starting to render page");
		_pdf.getPage(pageNo).then(function(page) {
			var viewport = page.getViewport(1);
			viewport = page.getViewport(_targetHeight/viewport.height);
			_canvas.height = _targetHeight;
			_canvas.width = _targetHeight * _ratio;
			page.render({
				canvasContext: _canvas.getContext('2d'), 
				viewport: viewport
			});
		});
	};

	// Returns true if the resource is using timestamps
	this.hasTimestamp = function(){
		return false;
	};

	this.getRatio = function(){
		return _ratio;
	};
	this.setSize = function(height){
		targetElement.style.height = height;
		targetElement.style.width = height * _ratio;
		_targetHeight = height;
		_renderPage(_current);
	};


	// Returns the position, could be slide number or timestamp.
	this.getPosition = function(){
		return _current;
	};

	// Returns the length of the player
	this.getDuration = function(){
		return _numOfPages;
	};


	// Returns the players current status
	this.getStatus = function(){
		return _status;
	};

	// 
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
		if (position >= _numOfPages || position < 0) return;
		_renderPage(position);
		_current = position;
	};

	this.init = function(){
		// Grap the url from the configuration
		_canvas = document.createElement('canvas');
		targetElement.appendChild(_canvas);
		PDFJS.getDocument(resource.url).then(function(pdf) {
			_pdf = pdf;
			_numOfPages = pdf.numPages;
			console.log("PDF loaded");
			_renderPage(1);
			// Run through all and find most frequent
			// _ratio = viewport.width/viewport.height;
			if(typeof callback == "function"){
				callback(_this, _this.READY);
			}
		});
	};
};
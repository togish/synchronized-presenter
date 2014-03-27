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

	// Example:
	// callback(this, this.PLAYING);
	var _numOfPages = 0;
	var _current = 0;
	var _status;
	var _transition = function (a, b) {
		a.style.display = 'none';
		b.style.display = 'block';
	};

	// Returns true if the resource is using timestamps
	this.hasTimestamp = function(){
		return false;
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
		_transition(targetElement.children[_current], targetElement.children[position]);
		_current = position;
	};

	this.init = function(){
		// Grap the url from the configuration
		console.debug(resource);
		PDFJS.getDocument(resource.data.url).then(function(pdf) {
			_numOfPages = pdf.numPages;
			var addPage = function(i){
				pdf.getPage(i).then(function(page) {
					var scale = 1;
					var viewport = page.getViewport(scale);
					var canvas = document.createElement('canvas');
					canvas.style.display = i == 1 ? 'block' : 'none';
					targetElement.appendChild(canvas);
					
					var context = canvas.getContext('2d');
					canvas.height = viewport.height;
					canvas.width = viewport.width;
					page.render({canvasContext: context, viewport: viewport});
				});
			};
			for (var i = 1; i <= _numOfPages; i++) {
				addPage(i);
			}
		});
	};
};
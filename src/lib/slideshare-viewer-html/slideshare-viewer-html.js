/* jshint strict: false */
/* exported SlideShareViewer */
/* jshint camelcase: false */
var SlideShareViewer = function (url, element, options) {
	// Sets the initial position and state variables
	var _this = this;
	var current = 0;
	var callbackName = 'callback_' + Math.random().toString(36).substring(7);
	var _ratio = 1.7777;

	this.presentation = {};

	// Defines a defauld transition
	// var transition = options.transition;
	this.transition = function (a, b) {
		a.style.display = 'none';
		b.style.display = 'block';
	};

	// Jumps to a specific slide.
	this.jumpTo = function (slideNumber) {
		if (_this.presentation === undefined || slideNumber >= _this.presentation.total_slides || slideNumber < 0) return;
		_this.transition(element.children[current], element.children[slideNumber]);
		current = slideNumber;
	};

	this.getRatio = function(){
		return _ratio;
	};

	// Returns the title of the slide show
	this.getTitle = function(){
		return _this.presentation.title;
	};
	
	// Returns the number of the current slide
	this.currentSlide = function(){
		return current;
	};

	// Returns the number of slides
	this.length = function(){
		return _this.presentation.total_slides;
	};

	// Goes to the next slide
	this.next = function(){
		this.jumpTo(current+1);
	};
	
	// Goes to the previous slide
	this.prev = function(){
		this.jumpTo(current-1);
	};
	
	// Goes to the first slide
	this.first = function(){
		this.jumpTo(0);
	};

	// Goes to the last slide
	this.last = function(){
		this.jumpTo(_this.presentation.total_slides-1);
	};

	// Defined the callback function for the json response
	window[callbackName] = function(obj){
		if (obj.error === true) {
			element.innerHTML = '<p>Error loading from SlideShare.net</p>';
			return;
		}
		_this.presentation = obj;

		// Build the html for the presentation
		for(var i = 1; i <= _this.presentation.total_slides; i++){
			element.innerHTML += '<img style="display:none;" src="' + _this.presentation.slide_image_baseurl + i + _this.presentation.slide_image_baseurl_suffix + '" />';
		}
		_this.jumpTo(current);

		// Loop arraound until we can get the dimentions :D
		var img = element.children[0];
		img.addEventListener('load', function(ev){
			_ratio = img.naturalWidth / img.naturalHeight;
			
			// Triggers ready callback
			if (typeof options.readyCallback == "function") {
				options.readyCallback();
			}
		});
	};

	// Starts loading data from SlideShare.net
	var script = document.createElement('script');
	script.type= 'text/javascript';
	script.src= 'http://www.slideshare.net/api/oembed/2?url=' + url + '&format=json&callback=window.' + callbackName;
	document.getElementsByTagName('head')[0].appendChild(script);
};

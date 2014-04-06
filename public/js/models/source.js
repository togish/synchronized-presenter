/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */

var Source = function (source, data) {
	// Scope rule hax
	var _this = this;

	// Maybe we should do this :D With a loop :D
	// .__defineGetter__("readOnlyProperty", function() { return 42; });
	this.type = source.type;
	this.timed = source.timed;
	this.url = source.url;
	this.title = source.title;
	this.length = source.length;
	this.color = source.color;

	this.remove = function(){
		_this.htmlElement.remove();
		if(data instanceof Data){
			data.removeSource(_this);
		}
	};

	// Row container element
	this.htmlElement = document.createElement('h3');
	this.htmlElement.style.background = _this.color;

	// Creates the dragzone for the source
	var draggable = document.createElement('span');
	draggable.className = 'drag';
	draggable.draggable = 'true';
	draggable.innerHTML = '+';
	draggable.addEventListener('dragstart', function(e){
		e.dataTransfer.dropEffect = 'copy';
		e.dataTransfer.setData("text/plain", "source");
		_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SOURCE_DRAGGED, {detail: _this, bubbles:true}));
	});
	draggable.addEventListener('dragend', function(e){
		e.dataTransfer.dropEffect = 'copy';
	});
	this.htmlElement.appendChild(draggable);

	// If there is a type on the source, add the type marker icon
	if(typeof _this.type != "undefined"){
		var type = document.createElement('span');
		type.className = 'type type-' + _this.type;
		type.innerHTML = '' + _this.type;
		_this.htmlElement.appendChild(type);
	}

	// Add the title of the source
	var title = document.createElement('span');
	title.className = 'title';
	title.innerHTML = '' + _this.title;
	_this.htmlElement.appendChild(title);

	// Add the container for the position markers
	_this.htmlElementShows = document.createElement('span');
	_this.htmlElementShows.className = 'shows';
	_this.htmlElement.appendChild(_this.htmlElementShows);

	// Adds ability to click and show extra buttons on a source.
	_this.htmlElement.addEventListener('click', function(e){
		_this.htmlElement.classList.add("focused");
	});
	_this.htmlElement.addEventListener('mouseleave', function(e){
		_this.htmlElement.classList.remove("focused");
	});

	var removeSource = document.createElement('a');
	removeSource.className = "remove";
	removeSource.innerHTML = "X";
	removeSource.addEventListener('click', function(e){
		_this.remove();
	});
	this.htmlElement.appendChild(removeSource);
}
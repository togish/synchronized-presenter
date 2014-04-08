/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */
var Timeline = function (viewport, data) {
	this.htmlElementName = document.createElement('div');
	this.htmlElement = document.createElement('div');
	this.segues = viewport.segues;

	// Private instance variables
	var _this = this;
	var _maxTimelineLength = 0;
	var _scale = 5;
	var _lastDraggedSource;

	this.getLength = function() {
		return _maxTimelineLength;
	}

	/*
	 * Initializes the UI that is dependent on event element
	 */
	this.initUI = function(eventElement){
		// Handles element drop over the timeline
		_this.htmlElement.addEventListener('drop', function(e){
			// Calculates the offset position based on the drop position
			var position = Math.round((e.clientX - _this.htmlElement.offsetLeft)/_scale);

			// Finds whether a clear segue is needed
			var clearSeguePosition = viewport.segues.reduceRight(function(cont, segue){
				// If no solution has been found. Go check.
				if (typeof cont == "undefined" && segue.offset < position){
					// Calculates the endposition of the last segue.
					var previousSegueEndPosition = segue.offset + segue.getLength();
					// returns the endposition if a clear segue is needed
					return typeof segue.hasSource && segue.timed && previousSegueEndPosition < position ? previousSegueEndPosition : false;
				}
				// Passes on the result
				return cont;
			}, undefined);

			// Fetches the dropped data
			var transferData = e.dataTransfer.getData("text/plain");
			
			// Inserts a clearsegue if needed
			if (typeof clearSeguePosition == "number" || transferData == "clear") {
				var clearSegue = new Segue({
					offset: (typeof clearSeguePosition == "number" ? clearSeguePosition : position),
					action: "clear",
				});
				viewport.segues.push(clearSegue);
			}

			// If the segue dropped is a real source, add the segue
			if (transferData == "source") {
				var segue = new Segue({
					offset: position,
					action: "playfrom",
					value: 0
				}, _lastDraggedSource);
				viewport.segues.push(segue);
			}

			// Order the segues by their offset.
			viewport.segues.sort(function(a,b){
				return a.offset-b.offset
			});

			// Dispatches event about the change
			if(clearSegue){
				_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SEGUE_ADDED, {detail: clearSegue, bubbles:true}));
			}
			if(segue){
				_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SEGUE_ADDED, {detail: segue, bubbles:true}));
			}
		}, false);

		// Handling custom events	
		eventElement.addEventListener(EventTypes.EVENT_SOURCE_DRAGGED, function(ev){
			// Listen for last dragged source
			_lastDraggedSource = ev.detail;
		});
		
		// Re-add the elements, and calculate the positions
		eventElement.addEventListener(EventTypes.EVENT_SEGUE_REMOVED, function(ev){
			// Update if a segue was removed
			_this.update();
		});
		eventElement.addEventListener(EventTypes.EVENT_SEGUE_ADDED, function(ev){
			// Update if a segue was added
			_this.update();
		});
	}

	/*
	 * Removes the timeline from and all the child elements from the presentation
	 */
	this.remove = function(){
		// Removes HTML elements
		_this.htmlElement.remove();
		_this.htmlElementName.remove();
		// Tells the data class about it
		if(data instanceof Data){
			data.removeViewport(_this);
		}
	};

	/*
	 * Updates the UI
	 * Readds all of the segues and updates width of the items.
	 */
	this.update = function(){
		// Removes the segues html elements from the viewport
		while(_this.htmlElement.firstChild){
			_this.htmlElement.removeChild(_this.htmlElement.firstChild);
		}

		// Adding content to the timeline
		var newMax = 0;
		_this.segues.forEach(function(segue, index, arr){
			_this.htmlElement.appendChild(segue.htmlElement);

			var length = segue.getLength();
			length = index < arr.length-1 ? arr[index+1].offset - segue.offset : length >= 0 ? length : 20;
			segue.htmlElement.style.minWidth = segue.htmlElement.style.width = ''+ (length * _scale) +'px';

			var last = segue.offset + length;
			if (last > newMax) {
				newMax = last;
			};
		}, undefined);

		// Checks if maxLength has changed
		if(_maxTimelineLength != newMax){
			_maxTimelineLength = newMax;
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_TIMELINE_CHANGED, {detail: _this, bubbles:true}));
		}
	};

	// Building html. Non polluting method
	(function(){
		// Builds the name marker for the timeline, including the removebutton
		// this.htmlElementName.innerHTML = 'VPP'; // TODO Get the name from WHERE? WTF!
		var removeButton = document.createElement('a');
		removeButton.innerHTML = 'X';
		removeButton.addEventListener('click', function(e){
			e.preventDefault();
			_this.remove();
		});
		_this.htmlElementName.appendChild(removeButton);
	
	
		// Builds the Segue container
		_this.htmlElement.className = "timeline";

		// Adds and removes class for visual effects on the timeline
		_this.htmlElement.addEventListener('dragenter', function(e){
			this.classList.add('dragover');
		}, true);
		_this.htmlElement.addEventListener('dragleave', function(){
			this.classList.remove('dragover');
		}, false);
	
		// Sets up drag over settings
		_this.htmlElement.addEventListener('dragover', function(e){
			// Necessary. Allows us to drop.
			if (e.preventDefault) {
				e.preventDefault();
			}
			// Shows add icon on the cursor when over the drop zone
			e.dataTransfer.dropEffect = 'copy';
			return false;
		}, false);
		
		// Update if a child segue has changed
		_this.htmlElement.addEventListener(EventTypes.EVENT_SEGUE_CHANGED, function(ev){
			_this.update();
		});
	})();

};
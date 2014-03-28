/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */
var Timeline = function (loadTarget) {
	// presentation, timelineBlock
	var _this = this;

	var _timelineList;
	var _timelineContainer;
	var _scale = 5;

	this.initUI = function(blockTimeline){
		_timelineList = document.createElement('div');
		_timelineList.className = "timeline-list";
 	
		_timelineContainer = document.createElement('div');
		_timelineContainer.className = "timeline-container";

		blockTimeline.appendChild(_timelineList);
		blockTimeline.appendChild(_timelineContainer);

		// Subscribe to events
		loadTarget.addEventListener("presentationLoaded", function(ev){
			// Renders the source list when the presentation is loaded
			_this.render();
		});

		loadTarget.addEventListener("sourceRemoved", function(ev){
			var index = ev.detail;
			// Updates the segues
			loadTarget.presentation.viewports.forEach(function(viewport){
				viewport.segues.forEach(function(segue){
					if(segue.source == index){
						// Segue associated with the source. Remove it!
						viewport.segues.remove(segue);
					} else if (index < segue.source){
						// ajust the offset
						segue.source = segue.source-1;
					}
				});
			});
			_this.render();
		});

		loadTarget.addEventListener("positionChanged", function(ev){
			// TODO Update the cursor
		});

		loadTarget.addEventListener("segueAdded", function(ev){
			// TODO Update the cursor
			_this.render();
		});

		// Maybe we should catch this.. :D
		// loadTarget.dispatchEvent(new CustomEvent("segueChanged"));
	};


	this.render = function(){
		// Clears the containers
		while(_timelineList.firstChild){
			_timelineList.removeChild(_timelineList.firstChild);	
		}
		while(_timelineContainer.firstChild){
			_timelineContainer.removeChild(_timelineContainer.firstChild);	
		}

		_timelineContainer.addEventListener("segueFocused", function(){
			_timelineContainer.classList.add("focused");
		});
		_timelineContainer.addEventListener("segueBlured", function(){
			_timelineContainer.classList.add("focused");
		});



		// Value aligning the length of the timelines representation
		var maxTimelineLength = 0;

		// Generating the viewports
		loadTarget.presentation.viewports.forEach(function(viewport, index){
			// Add the viewport to the viewport list
			var nameElement = document.createElement('div');
			nameElement.innerHTML = '' + index;
			_timelineList.appendChild(nameElement);

			// Add the timeline, it is the segue container
			var timelineElement = document.createElement('div');
			timelineElement.className = "timeline";

			// Sets up drag over settings
			timelineElement.addEventListener('dragover', function(e){
				// Necessary. Allows us to drop.
				if (e.preventDefault) {
					e.preventDefault();
				}
				// Shows add icon on the cursor when over the drop zone
				e.dataTransfer.dropEffect = 'copy';
				return false;
			}, false);

			// Adds and removes class for visual effects on the timeline
			timelineElement.addEventListener('dragenter', function(e){
  				this.classList.add('dragover');
			}, true);
			timelineElement.addEventListener('dragleave', function(){
  				this.classList.remove('dragover');
			}, false);

			// Handles element drop over the timeline
			timelineElement.addEventListener('drop', function(e){
				// Calculates the offset position based on the drop position
				var position = Math.round((e.clientX - timelineElement.offsetLeft)/_scale);

				// Finds whether a clear segue is needed
				var clearSeguePosition = viewport.segues.reduceRight(function(cont, value){
					// If no solution has been found. Go check.
					if (typeof cont == "undefined" && value.offset < position){
						// Gets the source for the segue
						var previousSource = loadTarget.presentation.sources[value.source];
						// console.debug(previousSource);
						// Calculates the endposition of the last segue.
						var previousSegueEndPosition = value.offset + (previousSource.length - value.value);
						// returns the endposition if a clear segue is needed
						return previousSource.timed && previousSegueEndPosition < position ? previousSegueEndPosition : false;
					}
					// Passes on the result
					return cont;
				}, undefined);

				// Fetches the dropped data
				var transferData = e.dataTransfer.getData("text/plain");
				
				// Inserts a clearsegue if needed
				if (typeof clearSeguePosition == "number" || transferData == "clear") {
					viewport.segues.push({
						offset: (typeof clearSeguePosition == "number" ? clearSeguePosition : position),
						action: "clear",
					});
				} 

				// If the segue dropped is a real source, add the segue
				if (!isNaN(transferData)) {
					viewport.segues.push({
						offset: position,
						action: "play",
						value: 0,
						source: parseInt(transferData)
					});
				}

				// Order the segues by their offset.
				viewport.segues.sort(function(a,b){
					return a.offset-b.offset
				});

				// Dispatches event about the change
				loadTarget.dispatchEvent(new CustomEvent("segueAdded"));
			}, false);

			// Adding the element to the DOM
			viewport.htmlElement = timelineElement;
			_timelineContainer.appendChild(timelineElement);


			
			// Adding content to the timeline
			viewport.segues.forEach(function(segue, index, arr){
				// TODO Handle the case where we are handling the last event.! What about the length and if it is rendered at all!
				// The last one should be a stop marker! :D
				var segueSource = loadTarget.presentation.sources[segue.source];
				var isNotLast = index < arr.length-1;

				// Find the length of the segue
				if(isNotLast){
					// Calculate the position based on the start of the next segue
					var length = arr[index+1].offset - segue.offset;
				} else if(sgSource != undefined && sgSource.timed){
					// Special case where the source has its own time relation
					var length = sgSource.length - segue.value;
				} else {
					// Just defaulting to 20 seconds
					var length = 20;
				}

				var timelineLength = segue.offset + length;
				if(!isNotLast && maxTimelineLength < timelineLength){
					maxTimelineLength = timelineLength;
				}

				// Building the html dom element
				// Should we delete the html object?? if(typeof segue.htmlElement != "undefined")
				var sss = new Segue(segue, segueSource);
				sss.initUI();
				timelineElement.appendChild(segue.htmlElement);
			}, undefined);
		});


		loadTarget.presentation.viewports.forEach(function(viewport, index){
			viewport.htmlElement.style.width = '' + (maxTimelineLength + 50) * 5 + 'px';
		});
	}
};
/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */
var Timeline = function (presentation, timelineBlock, editSegueCallback) {
	var _timelineList = document.createElement('div');
	_timelineList.className = "timeline-list";
	timelineBlock.appendChild(_timelineList);


	var _timelineContainer = document.createElement('div');
	_timelineContainer.className = "timeline-container";
	timelineBlock.appendChild(_timelineContainer);
	var _this = this;

	this.render = function(){
		// Clears the containers
		while(_timelineList.firstChild){
			_timelineList.removeChild(_timelineList.firstChild);	
		}
		while(_timelineContainer.firstChild){
			_timelineContainer.removeChild(_timelineContainer.firstChild);	
		}

		var maxTimelineLength = 0;

		// Handling the different viewports
		presentation.viewports.forEach(function(viewport, index){
			// Add the viewport to the viewport list in the left
			var nameElement = document.createElement('div');
			nameElement.innerHTML = '' + index;
			_timelineList.appendChild(nameElement);

			// Add the segue container timeline row
			var timelineElement = document.createElement('div');
			timelineElement.className = "timeline";

			timelineElement.addEventListener('dragover', function(e){
				if (e.preventDefault) {
					e.preventDefault(); // Necessary. Allows us to drop.
				}
				e.dataTransfer.dropEffect = 'copy';  // See the section on the DataTransfer object.
				return false;
			}, false);

			timelineElement.addEventListener('dragenter', function(e){
  				this.classList.add('over');
			}, true);
			timelineElement.addEventListener('dragleave', function(){
  				this.classList.remove('over');
			}, false);
			timelineElement.addEventListener('drop', function(e){
				var poss = Math.round((e.clientX - timelineElement.offsetLeft) * 0.2);

				var lsg = viewport.segues[viewport.segues.length-1];
				var preClear = typeof lsg.length != "undefined";
				
				if (preClear) {
					var lsgSource = presentation.sources[lsg.source];
					var lsgEndPos = lsg.offset + (lsgSource.length - lsg.value);
					var preClear = lsgSource.timed && lsgEndPos < poss;
				};

				var transferData = e.dataTransfer.getData("text/plain");
				
				if (preClear || transferData == "clear") {
					viewport.segues.push({
						offset: (preClear ? lsgEndPos : poss),
						action: "clear",
					});
				} 

				if (!isNaN(transferData)) {
					console.debug(transferSource);
					viewport.segues.push({
						offset: poss,
						action: "play",
						value: 0,
						source: parseInt(transferData)
					});
				}

				// Order the segues by their offset.
				viewport.segues.sort(function(a,b){
					return a.offset-b.offset
				});

				_this.render();

			}, false);


			viewport.htmlElement = timelineElement;
			_timelineContainer.appendChild(timelineElement);

			// Adding content to the timeline
			viewport.segues.forEach(function(segue, index, arr){
				// TODO Handle the case where we are handling the last event.! What about the length and if it is rendered at all!
				// The last one should be a stop marker! :D
				var sgSource = presentation.sources[segue.source];
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
				var segueElement = document.createElement('div');
				segueElement.className ="segue segue-"+segue.action;
				segueElement.style.width = ''+length*5+'px';
				if(sgSource == undefined){
					segueElement.innerHTML = '<svg viewBox="0 0 1 40" preserveAspectRatio="none">'+
					'<polygon class="fill" points="0,18 1,18 1,15 0,15"></polygon>'+
					'<polygon class="fill" points="0,22 1,22 1,25 0,25"></polygon></svg>';
				} else {
					segueElement.style.background = sgSource.color;
					var segueValue = document.createElement('input');
					segueValue.type="text";
					// TODO Format correctly!
					segueValue.value = segue.value;
					
					// Handles enter presses for ending the edit
					segueValue.addEventListener("keyup", function(e){
						if(e.keyCode == 13){
							e.preventDefault();
							segueValue.blur();
						}
					});
					// Attach on focus leave listner for the 
					segueValue.addEventListener("blur", function(e){
						// I know fucking regular expressions! bitches!
						var newValue = sgSource.timed ? e.target.value.match(/[0-9]+\:[0-5][0-9]/) : e.target.value.match(/[1-9][0-9]+|^[0]$/);
						console.debug(newValue);
						if(newValue == null || newValue.length > 1){
							e.target.value = segue.value;
							// TODO Add aditional notification of the mishap
							return;
						}
						// Set the value in the segue
						segue.value = newValue[0];
						e.target.value = segue.value;
						
						// Update the length of the segue on timed sources
						if(sgSource.timed){
							var length = sgSource.length - segue.value;
							segueElement.style.width = ''+length*5+'px';
						}
					}, false);
					// TODO Add drag and drop for moving a segue in time..?
					// Or show a tooltip box for setting the offset, when in edit mode.
					segueElement.appendChild(segueValue);
				}
				timelineElement.appendChild(segueElement);
				segue.htmlElement = segueElement;
			}, undefined);
		});


		presentation.viewports.forEach(function(viewport, index){
			viewport.htmlElement.style.width = '' + (maxTimelineLength + 50) * 5 + 'px';
		});
	}
};
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
	};


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
		loadTarget.presentation.viewports.forEach(function(viewport, index){
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

			// Handles when an element is dropped over the timeline
			timelineElement.addEventListener('drop', function(e){
				var poss = Math.round((e.clientX - timelineElement.offsetLeft) * 0.2);

				var lsg = viewport.segues[viewport.segues.length-1];
				var preClear = typeof lsg != "undefined" && typeof lsg.length != "undefined";
				
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
				var sgSource = loadTarget.presentation.sources[segue.source];
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

					// Tries to ajust the value of a segue. Returns true if success!
					var valueAjust = function(input){
						// Function for encoding seconds into human representation
						var seconds = segue.value;
						if(typeof input == "string"){
							var newValue = null;
							var multiplier = [1, 60, 3600, 86400];
							// I know fucking regular expressions! bitches!
							newValue = sgSource.timed ? input.match(/[0-9]+\:[0-5][0-9]/) : input.match(/[1-9][0-9]?|^[0]$/);
							if(!(newValue == null || newValue.length > 1)){
								// Set the value in the segue. Convert to seconds or slidenumber. Works either case.
								var seconds = newValue[0].split(":").reduceRight(function(cont, val, idx, arr){
									return cont + multiplier[arr.length - idx -1] * val;
								}, 0);
							}
						} else if(typeof input == "number"){
							seconds = input;
						}

						var ret = false;
						// Checks that the value is not out of bounds
						if(0 <= seconds && seconds < sgSource.length){
							segue.value = seconds;
							ret = true;
						}

						// Build the string representation of the value
						segueValue.value = sgSource.timed ? SecondsToTime(segue.value) : segue.value;

						// Ajust the size of the input field
						var inputLen = segueValue.value.length;
						segueValue.size = inputLen > 0 ? Math.round(inputLen / 2) : 2;

						// Update the length of the segue on timed sources

						// TODO What is this shit!
						// if(sgSource.timed){
						// 	var length = sgSource.length - segue.value;
						// 	segueElement.style.width = ''+length*5+'px';
						// }

						loadTarget.dispatchEvent(new CustomEvent("segueChanged"));
						return ret;
					};

					var valueAjustRelative = function(rel){
						valueAjust(segue.value + rel);
					};


					// Builds the bar for ajusting the offset of the segue
					var offsetAjust = document.createElement('a');
					offsetAjust.className = "offset-ajust";
					offsetAjust.innerHTML = "|";
					// TODO Add drag and drop on the segue ajuster

					// Building html element for the value ajust substract
					var valueSub = document.createElement('a');
					valueSub.className = "focused-visible value-sub";
					valueSub.innerHTML = "-";
					valueSub.addEventListener('click', function(e){
						e.preventDefault();
						valueAjustRelative(-1);
					});

					// Building html element for the value ajust add
					var valueAdd = document.createElement('a');
					valueAdd.className = "focused-visible value-add";
					valueAdd.innerHTML = "+";
					valueAdd.addEventListener('click', function(e){
						e.preventDefault();
						valueAjustRelative(1);
					});

					// Building html element for the delete segue
					var segueDelete = document.createElement('a');
					segueDelete.className = "focused-visible remove";
					segueDelete.innerHTML = "X";
					segueDelete.addEventListener('click', function(e){
						e.preventDefault();
						segue.htmlElement.remove();
						arr.splice(index, 1);
						_this.render();
					});

					// Building html element for the value enter field
					var segueValue = document.createElement('input');
					segueValue.type="text";
					valueAjust();

					// Handling the state of the segues focus and show settings
					var focused = false;
					var focusedInput = false;
					var mouseOver = false;
					var focusClass = function(show){
						focused = show;
						if(show){
							segueElement.classList.add("focused");
							_timelineContainer.classList.add("focused");
						} else {
							segueElement.classList.remove("focused");
							_timelineContainer.classList.remove("focused");
						}
					}
				
					// Marks the segue as focused as the working element
					segueValue.addEventListener("focus", function(e){
						focusClass(true);
						focusedInput = true;
					});

					// Attach on focus leave listner for the 
					segueValue.addEventListener("blur", function(e){
						// Tries to execute a value update
						focusedInput = false;
						valueAjust(segueValue.value);
						if(!mouseOver){
							focusClass(false);
						}
					}, false);

					// Handles enter presses for ending the edit
					segueValue.addEventListener("keyup", function(e){
						if(e.keyCode == 13){
							e.preventDefault();
							segueValue.blur();
						}
					});

					// Shows the segue when clicked
					segueElement.addEventListener("click", function(e){
						segueValue.focus();
					});

					segueElement.addEventListener("mouseover", function(e){
						mouseOver = true;
					});

					segueElement.addEventListener("mouseout", function(e){
						mouseOver = false;

						// Hide if needed
						if(!focusedInput){
							focusClass(false);
						}
					});


					// Sets up the html
					segueElement.appendChild(offsetAjust);
					segueElement.appendChild(valueSub);
					segueElement.appendChild(segueValue);
					segueElement.appendChild(valueAdd);
					segueElement.appendChild(segueDelete);
					
				}

				timelineElement.appendChild(segueElement);
				segue.htmlElement = segueElement;
			}, undefined);
		});


		loadTarget.presentation.viewports.forEach(function(viewport, index){
			viewport.htmlElement.style.width = '' + (maxTimelineLength + 50) * 5 + 'px';
		});
	}


/*
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
*/

};
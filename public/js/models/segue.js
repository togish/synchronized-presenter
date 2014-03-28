/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */
var Segue = function (segue, source) {
	// presentation, timelineBlock
	var _this = this;
	var _scale = 5;

	segue.htmlElement.className ="segue segue-"+segue.action;

	this.setScale = function(scale){
		_scale = scale;
		segue.htmlElement.style.width = ''+length*_scale+'px';
		segue.htmlElement.style.minWidth = segue.htmlElement.style.width;
	};

	// Tries to ajust the value of a segue. Returns true if success!
	this.valueAjust = function(input){
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

		segue.htmlElement.dispatchEvent(new CustomEvent("segueChanged"));
		return ret;
	};

	this.valueAjustRelative = function(rel){
		valueAjust(segue.value + rel);
	};


	this.initUI = function(){
		segue.htmlElement = document.createElement('div');

		if(segue.type == "clear"){
			segue.htmlElement.innerHTML = 
				'<svg viewBox="0 0 1 40" preserveAspectRatio="none">'+
					'<polygon class="fill" points="0,18 1,18 1,15 0,15"></polygon>'+
					'<polygon class="fill" points="0,22 1,22 1,25 0,25"></polygon>'+
				'</svg>';
			return;
		}
		
		// Sets the color of the segue according to the source color
		segue.htmlElement.style.background = source.color;

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

		// TODO This needs fucking cleanup!! U get it!
		var focused = false;
		var focusedInput = false;
		var mouseOver = false;
		var focusClass = function(show){
			focused = show;
			if(show){
				segueElement.classList.add("focused");
				segue.htmlElement.dispatchEvent(new CustomEvent("segueFocused"));
			} else {
				segueElement.classList.remove("focused");
				segue.htmlElement.dispatchEvent(new CustomEvent("segueBlured"));
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
		segue.htmlElement.addEventListener("click", function(e){
			segueValue.focus();
		});
		segue.htmlElement.addEventListener("mouseover", function(e){
			mouseOver = true;
		});
		segue.htmlElement.addEventListener("mouseout", function(e){
			mouseOver = false;
			// Hide if needed
			if(!focusedInput){
				focusClass(false);
			}
		});

		// Sets up the html
		segue.htmlElement.appendChild(offsetAjust);
		segue.htmlElement.appendChild(valueSub);
		segue.htmlElement.appendChild(segueValue);
		segue.htmlElement.appendChild(valueAdd);
		segue.htmlElement.appendChild(segueDelete);
	};
}
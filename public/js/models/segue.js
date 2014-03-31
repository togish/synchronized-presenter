/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */
var Segue = function (segue, source) {
	// Scope rule hax
	var _this = this;

	// TODO Define the types in constants

	// State variables for the focus/blur management
	var _isFocused = false;
	var _isFocusedInput = false;
	var _isMouseOver = false;

	// Holding html element
	var _segueValue;

	// Returns the type of the segue
	this.getType = function(){
		return segue.type;
	};
	// Returns the source object
	this.getSource = function(){
		return source;
	};
	this.hasSource = function(){
		return typeof source != "undefined";
	};
	// Returns the offset value
	this.getOffset = function(){
		return segue.offset;
	};
	// Returns the segue value
	this.getValue = function(){
		return segue.value;
	};

	/*
	 * Responds with the length of the segue
	 * If no timing, -1 is returned.
	 */
	this.getLength = function(){
		return _this.hasSource() && source.timed ? source.length - segue.value : -1;
	};


	// Tries to ajust the value of a segue. Returns true if success!
	this.ajustValue = function(input){
		if(!_this.hasSource()){
			return;
		}

		// Save the current value as a fallback for invalid input
		var value = segue.value;
		
		// For string representation. Parse and convert into seconds
		if(typeof input == "string"){
			var newValue = null;
			var multiplier = [1, 60, 3600, 86400];
			// I know fucking regular expressions! bitches!
			newValue = source.timed ? input.match(/[0-9]+\:[0-5][0-9]/) : input.match(/[1-9][0-9]?|^[0]$/);
			// console.debug(newValue);
			if(!(newValue == null || newValue.length > 1)){
				// Set the value in the segue. Convert to seconds or slidenumber. Works either case.
				var value = newValue[0].split(":").reduceRight(function(cont, val, idx, arr){
					return cont + multiplier[arr.length - idx -1] * val;
				}, 0);
			}
		// For a number. Go ahead!
		} else if(typeof input == "number"){
			value = input;
		}

		// Checks if possible to perform the change
		var ret = false;
		if(0 <= value && value < source.length){
			segue.value = value;
			ret = true;
		}

		// Build the string representation of the value
		_segueValue.value = source.timed ? SecondsToTime(segue.value) : segue.value;
		
		// Ajust the size of the input field
		var inputLen = _segueValue.value.length;
		_segueValue.size = inputLen > 0 ? Math.round(inputLen / 2) : 2;


		// Update the length of the segue on timed sources
		// TODO What is this shit!
		// if(sgSource.timed){
		// 	var length = sgSource.length - segue.value;
		// 	segueElement.style.width = ''+length*5+'px';
		// }

		_this.htmlElement.dispatchEvent(new CustomEvent("segueChanged"));
		return ret;
	};

	this.ajustValueRelative = function(rel){
		_this.ajustValue(segue.value + rel);
	};


	this.ajustOffset = function(input){
		// TODO!
	};
	
	this.ajustOffsetRelative = function(input){
		_this.ajustOffset(segue.offset + input);
	};

	this.remove = function(){
		_this.htmlElement.remove();
		// arr.splice(index, 1); WHAT THE FUCK!
		// Fire event
	};

			// TODO This needs fucking cleanup!! U get it!
	this.focus = function(show){
		_isFocused = show;
		if(show){
			_this.htmlElement.classList.add("focused");
			_this.htmlElement.dispatchEvent(new CustomEvent("segueFocused"));
		} else {
			_this.htmlElement.classList.remove("focused");
			_this.htmlElement.dispatchEvent(new CustomEvent("segueBlured"));
		}
	};


	this.initUI = function(){
		_this.htmlElement = document.createElement('div');
		_this.htmlElement.className ="segue segue-"+segue.action;

		// Builds the bar for ajusting the offset of the segue
		var offsetAjust = document.createElement('a');
		offsetAjust.className = "offset-ajust";
		offsetAjust.innerHTML = "|";
		// TODO Add drag and drop on the segue ajuster


		// Building html element for the delete segue
		var segueDelete = document.createElement('a');
		segueDelete.className = "focused-visible remove";
		segueDelete.innerHTML = "X";
		segueDelete.addEventListener('click', function(e){
			e.preventDefault();
			_this.remove();
		});

		// If it is a clear segue, then just stop here
		if(segue.action == "clear"){
			// Adds html element for ajusting offset
			_this.htmlElement.appendChild(offsetAjust);
			_this.htmlElement.appendChild(segueDelete);

			// Adds click listner for showing the buttons
			_this.htmlElement.addEventListener("click", function(e){
				_this.focus(true);
			});

			// And hiding them again
			_this.htmlElement.addEventListener("mouseout", function(e){
				_this.focus(false);
			});
			return;
		}

		// Sets the color of the segue according to the source color
		_this.htmlElement.style.background = source.color;

		// Building html element for the value ajust substract
		var valueSub = document.createElement('a');
		valueSub.className = "focused-visible value-sub";
		valueSub.innerHTML = "-";
		valueSub.addEventListener('click', function(e){
			e.preventDefault();
			_this.ajustValueRelative(-1);
		});
	
		// Building html element for the value ajust add
		var valueAdd = document.createElement('a');
		valueAdd.className = "focused-visible value-add";
		valueAdd.innerHTML = "+";
		valueAdd.addEventListener('click', function(e){
			e.preventDefault();
			_this.ajustValueRelative(1);
		});
	
		
		// Building html element for the value enter field
		_segueValue = document.createElement('input');
		_segueValue.type = "text";
		// TODO Is this a good idea??
		_this.ajustValueRelative(0);
	
		// Marks the segue as focused as the working element
		_segueValue.addEventListener("focus", function(e){
			_isFocusedInput = true;
			_this.focus(true);
		});
	
		// Attach on focus leave listner for the 
		_segueValue.addEventListener("blur", function(e){
			// Tries to execute a value update
			_isFocusedInput = false;
			_this.ajustValue(_segueValue.value);
			if(!_isMouseOver){
				_this.focus(false);
			}
		}, false);
	
		// Handles enter presses for ending the edit
		_segueValue.addEventListener("keyup", function(e){
			if(e.keyCode == 13){
				e.preventDefault();
				_segueValue.blur();
			}
		});
	
		_this.htmlElement.addEventListener("mouseover", function(e){
			_isMouseOver = true;
		});
		_this.htmlElement.addEventListener("mouseout", function(e){
			_isMouseOver = false;
			// Hide if needed
			if(!_isFocusedInput){
				_this.focus(false);
			}
		});

		// Sets up the html
		_this.htmlElement.appendChild(offsetAjust);
		_this.htmlElement.appendChild(valueSub);
		_this.htmlElement.appendChild(_segueValue);
		_this.htmlElement.appendChild(valueAdd);
		_this.htmlElement.appendChild(segueDelete);
	};
}
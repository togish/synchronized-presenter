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
	var _isUIInitialized = false;

	// Holding html element
	var _segueValue;
	var _segueOffset;

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
		_this.updateUI();

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
		_this.htmlElement.classList.remove("focus-offset");
		_this.htmlElement.classList.remove("focus-value");
		if(show === false){
			_this.htmlElement.dispatchEvent(new CustomEvent("segueBlured"));
		} else {
			_this.htmlElement.classList.add("focus-"+show);
			_this.htmlElement.dispatchEvent(new CustomEvent("segueFocused"));
		}
	};

	this.updateUI = function(){
		if(!_isUIInitialized) return;
		// set the input fields correct

		_segueOffset.value = SecondsToTime(segue.offset);
		var inputLen = _segueOffset.value.length;
		_segueOffset.size = inputLen > 0 ? Math.round(inputLen / 2) : 2;

		_segueValue.value = source.timed ? SecondsToTime(segue.value) : segue.value;
		inputLen = _segueValue.value.length;
		_segueValue.size = inputLen > 0 ? Math.round(inputLen / 2) : 2;
	};


	this.initUI = function(){
		if(_isUIInitialized) return;
		_isUIInitialized = true;

		_this.htmlElement = document.createElement('div');
		_this.htmlElement.className ="segue segue-" + segue.action;
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
		// Adds click listner for showing the buttons
		_this.htmlElement.addEventListener("click", function(e){
			console.debug(e);
			if(segue.action != "clear"){
				_segueValue.focus();
			} else {
				// Default to the offset ajustment if nothing else is avaliable
				_segueOffset.focus();
			}
		});


		
		// Builds the offset ajustment block
		var offsetAjust = document.createElement('div');
		offsetAjust.className = "offset-ajust";
		offsetAjust.addEventListener("click", function(e){
			e.stopPropagation();
			console.debug(e);
			_this.focus("offset");
			_segueOffset.focus();
		});


		// Adds offset substraction button
		var offsetSub = document.createElement('a');
		offsetSub.className = "offset-sub";
		offsetSub.innerHTML = "-";
		offsetSub.addEventListener('click', function(e){
			e.preventDefault();
			_this.ajustOffsetRelative(-1);
		});
		offsetAjust.appendChild(offsetSub);

		// Building html element for the value enter field
		_segueOffset = document.createElement('input');
		_segueOffset.type = "text";

		// Marks the segue as focused as the working element
		_segueOffset.addEventListener("focus", function(e){
			_isFocusedInput = true;
			_this.focus("offset");
		});
		
		// Attach on focus leave listner for the 
		_segueOffset.addEventListener("blur", function(e){
			// Tries to execute a value update
			_isFocusedInput = false;
			_this.ajustOffset(_segueOffset.value);
			if(!_isMouseOver){
				_this.focus(false);
			}
		}, false);

		// Handles enter presses for ending the edit
		_segueOffset.addEventListener("keyup", function(e){
			if(e.keyCode == 13){
				e.preventDefault();
				_segueOffset.blur();
			}
		});
		offsetAjust.appendChild(_segueOffset);

		// Building html element for the value ajust add
		var offsetAdd = document.createElement('a');
		offsetAdd.className = "offset-add";
		offsetAdd.innerHTML = "+";
		offsetAdd.addEventListener('click', function(e){
			e.preventDefault();
			_this.ajustOffsetRelative(1);
		});
		offsetAjust.appendChild(offsetAdd);
		_this.htmlElement.appendChild(offsetAjust);


		// If a segue with a value. Then add input for that.
		if(segue.action != "clear"){
			// Sets the color of the segue according to the source color
			_this.htmlElement.style.background = source.color;

			// Builds the offset ajustment bar
			var valueAjust = document.createElement('div');
			valueAjust.className = "value-ajust";
			valueAjust.addEventListener("click", function(e){
				console.debug(e);
				_segueValue.focus();
			});


			// Building html element for the value ajust substract
			var valueSub = document.createElement('a');
			valueSub.className = "focused-visible value-sub";
			valueSub.innerHTML = "-";
			valueSub.addEventListener('click', function(e){
				e.preventDefault();
				_this.ajustValueRelative(-1);
			});
			valueAjust.appendChild(valueSub);

			// Building html element for the value enter field
			_segueValue = document.createElement('input');
			_segueValue.type = "text";

			// Marks the segue as focused as the working element
			_segueValue.addEventListener("focus", function(e){
				_isFocusedInput = true;
				_this.focus("value");
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
			valueAjust.appendChild(_segueValue);

			// Building html element for the value ajust add
			var valueAdd = document.createElement('a');
			valueAdd.className = "value-add";
			valueAdd.innerHTML = "+";
			valueAdd.addEventListener('click', function(e){
				e.preventDefault();
				_this.ajustValueRelative(1);
			});
			valueAjust.appendChild(valueAdd);
			_this.htmlElement.appendChild(valueAjust);
		}


		// Building html element for the delete segue
		var segueDelete = document.createElement('a');
		segueDelete.className = "remove";
		segueDelete.innerHTML = "X";
		segueDelete.addEventListener('click', function(e){
			e.preventDefault();
			_this.remove();
		});
		_this.htmlElement.appendChild(segueDelete);


		_this.updateUI();
	};
}
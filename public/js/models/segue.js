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

	var _focus = function(show){
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
		var newValue = SomethingToSeconds(input, source.timed);

		// Checks if possible to perform the change
		var ret = false;
		if(typeof newValue != "undefined" && 0 <= newValue && newValue < source.length){
			segue.value = newValue;
			ret = true;
		}

		// Build the string representation of the value
		_this.updateUI();
		_this.htmlElement.dispatchEvent(new CustomEvent("segueChanged"));
		return ret;
	};

	this.ajustValueRelative = function(rel){
		_this.ajustValue(segue.value + rel);
	};


	this.ajustOffset = function(input){
		// Save the current value as a fallback for invalid input
		var newValue = SomethingToSeconds(input);

		// Checks if possible to perform the change
		var ret = false;
		if(typeof newValue != "undefined" && 0 <= newValue){
			segue.offset = newValue;
			ret = true;
		}

		// Build the string representation of the value
		_this.updateUI();
		_this.htmlElement.dispatchEvent(new CustomEvent("segueChanged"), true);
		return ret;

	};
	
	this.ajustOffsetRelative = function(input){
		_this.ajustOffset(segue.offset + input);
	};

	this.remove = function(){
		_this.htmlElement.remove();
		// arr.splice(index, 1); WHAT THE FUCK!
		// Fire event
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
				_focus(false);
			}
		});
		// Adds click listner for showing the buttons
		_this.htmlElement.addEventListener("click", function(e){
			if(segue.action == "clear"){
				_segueOffset.focus();
			} else {
				_segueValue.focus();
			}
		});

		var addBlock = function(classType, relativeCallback, absoluteCallback){
			// Builds the offset ajustment block
			var container = document.createElement('div');
			container.className = "ajust-"+classType;
			container.addEventListener("click", function(e){
				e.stopPropagation();
				input.focus();
			});

			// Adds offset substraction button
			var sub = document.createElement('a');
			sub.className = "sub";
			sub.innerHTML = "-";
			sub.addEventListener('click', function(e){
				e.stopPropagation();
				e.preventDefault();
				relativeCallback(-1);
			});
			container.appendChild(sub);

			// Building html element for the value enter field
			var input = document.createElement('input');
			input.type = "text";
			input.addEventListener("focus", function(e){
				_isFocusedInput = true;
				_focus(classType);
			});
			input.addEventListener("blur", function(e){
				// Tries to execute a value update
				 _isFocusedInput = false;
				absoluteCallback(input.value);
				if(!_isMouseOver){
					_focus(false);
				}
			});
			input.addEventListener("keyup", function(e){
				if(e.keyCode == 13){
					e.preventDefault();
					input.blur();
				}
			});
			container.appendChild(input);

			// Building html element for the value ajust add
			var add = document.createElement('a');
			add.className = "add";
			add.innerHTML = "+";
			add.addEventListener('click', function(e){
				e.stopPropagation();
				e.preventDefault();

				relativeCallback(1);
			});
			container.appendChild(add);
			_this.htmlElement.appendChild(container);
			return input;
		};

		_segueOffset = addBlock("offset", _this.ajustOffsetRelative, _this.ajustOffset);

		// If a segue with a value. Then add input for that.
		if(segue.action != "clear"){
			// Sets the color of the segue according to the source color
			_this.htmlElement.style.backgroundColor = source.color;
			_segueValue = addBlock("value", _this.ajustValueRelative, _this.ajustValue);
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
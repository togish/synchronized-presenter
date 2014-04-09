/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */
var Segue = function (segue, source, data) {
	this.htmlElement = document.createElement('div');
	this.source = source;
	this.hasSource = source instanceof Source;
	this.timed = source instanceof Source && source.timed;
	this.action = segue.action;
	this.offset = segue.offset;
	this.value = segue.value;

	// Scope rule hax
	var _this = this;
	var _segueOffset;
	var _segueValue;
	// State variables for the focus/blur management
	var _isFocused = false;
	var _isFocusedInput = false;
	var _isMouseOver = false;

	/*
	 * Tries to ajust the offset of a segue. Returns true if success!
	 */
	this.ajustOffset = function(input){
		// Save the current value as a fallback for invalid input
		var newValue = SomethingToSeconds(input, true);

		// Checks if possible to perform the change
		var ret = false;
		if(typeof newValue == "number" && 0 <= newValue){
			_this.offset = newValue;
			ret = true;
		}

		// Build the string representation of the value
		_this.updateUI();
		_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SEGUE_CHANGED, {detail:_this, bubbles:true}));
		return ret;
	};
	
	/*
	 * Tries to ajust the offset of a segue, relative to the current value. Returns true if success!
	 */
	this.ajustOffsetRelative = function(input){
		_this.ajustOffset(_this.offset + input);
	};

	/*
	 * Tries to ajust the value of a segue. Returns true if success!
	 */
	this.ajustValue = function(input){
		if(!_this.hasSource){
			return false;
		}

		// Save the current value as a fallback for invalid input
		var newValue = SomethingToSeconds(input, _this.timed);

		// Checks if possible to perform the change
		var ret = false;
		if(typeof newValue == "number" && ((source.timed && 0 <= newValue && newValue < source.length) || (!source.timed && 0 < newValue && newValue <= source.length))){
			_this.value = newValue;
			ret = true;
		}

		// Build the string representation of the value
		_this.updateUI();
		_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SEGUE_CHANGED, {detail:_this, bubbles:true}));
		return ret;
	};

	/*
	 * Tries to ajust the value of a segue, relative to the current value. Returns true if success!
	 */
	this.ajustValueRelative = function(rel){
		if(!_this.hasSource){
			return false;
		}
		_this.ajustValue(_this.value + rel);
	};

	/*
	 * Responds with the length of the segue
	 * If no timing, -1 is returned.
	 */
	this.getLength = function(){
		return _this.timed ? source.length - segue.value : -1;
	};

	/*
	 * Removes the segue
	 */
	this.remove = function(){
		_this.htmlElement.remove();
		if(data instanceof Data){
			data.removeSegue(_this);
		}
	};

	/*
	 * Updates the values in the UI
	 */
	this.updateUI = function(){
		_segueOffset.value = SecondsToTime(_this.offset);
		var inputLen = _segueOffset.value.length;
		_segueOffset.size = inputLen > 0 ? Math.round(inputLen / 2) : 2;

		if(!_this.hasSource) return;
		_segueValue.value = _this.timed ? SecondsToTime(_this.value) : _this.value;
		inputLen = _segueValue.value.length;
		_segueValue.size = inputLen > 0 ? Math.round(inputLen / 2) : 2;
	};

	/*
	 * Updates the values in the UI
	 */
	var _focus = function(show){
		_isFocused = show;
		_this.htmlElement.classList.remove("focus-offset");
		_this.htmlElement.classList.remove("focus-value");
		if(show === false){
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SEGUE_BLURED, {bubbles:true}));
		} else {
			_this.htmlElement.classList.add("focus-"+show);
			_this.htmlElement.dispatchEvent(new CustomEvent(EventTypes.EVENT_SEGUE_FOCUED, {bubbles:true}));
		}
	};


	(function(){
		// Setting up the UI
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

		// Helper method for building generic 
		var addBlock = function(classType, relativeCallback, absoluteCallback){
			// Builds the offset ajustment block
			var container = document.createElement('div');
			container.className = "ajust-"+classType;
			container.addEventListener("click", function(e){
				e.stopPropagation();
				input.focus();
			});
			// Adds offset substraction button
			// var sub = document.createElement('a');
			// sub.className = "sub";
			// sub.innerHTML = "-";
			// sub.addEventListener('click', function(e){
			// 	//e.stopPropagation();
			// 	e.preventDefault();
			// 	relativeCallback(-1);
			// });
			// container.appendChild(sub);
			
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
			// var add = document.createElement('a');
			// add.className = "add";
			// add.innerHTML = "+";
			// add.addEventListener('click', function(e){
			// 	e.stopPropagation();
			// 	e.preventDefault();
			// 	relativeCallback(1);
			// });
			// container.appendChild(add);
			_this.htmlElement.appendChild(container);
			return input;
		};

		_segueOffset = addBlock("offset", _this.ajustOffsetRelative, _this.ajustOffset);

		// If a segue with a value. Then add input for that.
		if(_this.action != "clear" && typeof source != "undefined"){
			// Sets the color of the segue according to the source color
			_this.htmlElement.style.backgroundColor = _this.source.color;
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
	})();
}
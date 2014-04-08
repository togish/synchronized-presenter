/* jshint strict: false */
/* exported Presentation */
/* global Event: false */
/* global console: false */
/* global document: false */
/* global Sources: false */
/* global Timeline: false */
/* global Segue: false */
/* global Segue: Presentation */

/**
 * Sets up the child elements
 */
var ControlBar = function () {
	var _this = this;

	this.initUI = function(presentation){
		_this.htmlElement = document.createElement('div');
		var _progress = document.createElement('div');
		var _progressBar = document.createElement('div');
	
		_this.htmlElement.className = 'control-bar';
		_progress.className = 'progress';
		_progressBar.className = 'progress-bar';
		_progress.appendChild(_progressBar);
		_this.htmlElement.appendChild(_progress);
	
		var ease = function(e, to, time){
			e.style["-webkit-transition"] = "width "+time+"s linear";
			e.style.transition = "width "+time+"s linear";
			e.style.width = to + "%";
		}
	
		var _btnPlayPause = document.createElement('button');
		_btnPlayPause.className = "play-pause";
		_this.htmlElement.appendChild(_btnPlayPause);

		var updateUI = function(e){
			var percent = presentation.getCompletedPercent();
			
			_this.htmlElement.classList.remove("ready");
			_this.htmlElement.classList.remove("playing");
			ease(_progressBar, percent, 0);
			if(presentation.isReady()){
				_this.htmlElement.classList.add("ready");
			}
			
			if(presentation.isPlaying()){
				_this.htmlElement.classList.add("playing");
				ease(_progressBar, 100, presentation.getDuration() - presentation.getPosition());
			}
		};

		// presentation.addEventListener(EventTypes.EVENT_STATUS, , false);
	
		_btnPlayPause.addEventListener('click', function(){
			if(presentation.isReady() && !presentation.isPlaying()){
				console.log("play invoked");
				presentation.play();
			} else {
				console.log("pause invoked");
				presentation.pause();
			}
		});
	
		presentation.addEventListener(EventTypes.EVENT_DURATION, function(e){
			// console.log("UI EVENT_DURATION changed to: " + presentation.getDuration());
		}, false);
	}
};
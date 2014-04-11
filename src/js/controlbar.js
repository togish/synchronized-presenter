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
		_this.htmlElement.className = 'control-bar';

		var _progress = document.createElement('div');
		_this.htmlElement.appendChild(_progress);
		_progress.className = 'progress';

		var _progressBar = document.createElement('div');
		_progress.appendChild(_progressBar);
		_progressBar.className = 'progress-bar';
	
		var ease = function(e, to, time){
			e.style["-webkit-transition"] = "width "+time+"s linear";
			e.style.transition = "width "+time+"s linear";
			e.style.width = to + "%";
		}
	
		var _btnPlayPause = document.createElement('button');
		_btnPlayPause.className = "play-pause";
		_this.htmlElement.appendChild(_btnPlayPause);

		var _statusPanel = document.createElement('div');
		_statusPanel.className = 'status-panel';
		_this.htmlElement.appendChild(_statusPanel);

		var _position = document.createElement('span');
		_statusPanel.appendChild(_position);
		_position.className = 'position';

		var _duration = document.createElement('span');
		_statusPanel.appendChild(_duration);
		_duration.className = 'duration';

		var interval;
		var setPosition = function(){
			var pos = Math.round(presentation.getPosition());
			_position.innerHTML = "" + SecondsToTime(pos);
		};
		var updateUI = function(e){

			if(presentation.isReady()){
				_this.htmlElement.classList.add("ready");
			} else {
				_this.htmlElement.classList.remove("ready");
			}
			
			if(presentation.isPlaying()){
				// Mark as playing
				_this.htmlElement.classList.add("playing");

				// Start the progress bar
				ease(_progressBar, 100, presentation.getDuration() - presentation.getPosition());

				// Set interval for 
				setPosition();
				interval = setInterval(function(){
					setPosition();
				},1000);
			} else {
				// Stop the progress bar
				var percent = presentation.getCompletedPercent();
				ease(_progressBar, percent, 0);
				_this.htmlElement.classList.remove("playing");
				if(typeof interval != "undefined") clearInterval(interval);
			}

			setPosition();
			_duration.innerHTML = "" + SecondsToTime(presentation.getDuration());
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


		presentation.addEventListener(EventTypes.EVENT_PRESENTER_STATUS_CHANGED, function(e){
			updateUI();
		}, false);
		presentation.addEventListener(EventTypes.EVENT_PRESENTER_READYNESS_CHANGED, function(e){
			updateUI();
		}, false);
		presentation.addEventListener(EventTypes.EVENT_PRESENTER_DURATION_CHANGED, function(e){
			updateUI();
		}, false);
		updateUI();
	}
};
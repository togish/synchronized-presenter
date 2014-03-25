/* jshint strict: false */
/* exported Presentation */
/* global Event: false */
/* global console: false */


// hsl(32,100%,50%)
// hsl(195,100%,40%)
// hsl( 80,100%,30%)


var Sources = function (presentation, blockSources) {
	var _this = this;

	var _sourcesHeader = document.createElement('h2');
	blockSources.appendChild(_sourcesHeader);

	var _sourcesList = document.createElement('div');
	blockSources.appendChild(_sourcesList);

	var _clearSource;

	this.addSource = function(url){
		var youtubeVidId = YouTubeHelpers.parseUrl(url);
		if(typeof youtubeVidId == "string"){
			YouTubeHelpers.loadMetadata(youtubeVidId,function(d){
				presentation.sources.push({
					type: "youtube",
					timed: true,
					data: {
						url: url
					},
					title: d.title,
					length: d.duration,
				});
				_this.updateSource();
			});
		} else if (url.match(/slideshare/i)){
			var callback = function(){
				var s = {
					type: "slideshare",
					timed: false,
					data: {
						url: url
					},
					title: slsh.presentation.title,
					length: slsh.length(),
				};
				console.debug(s);
				presentation.sources.push(s);
				_this.updateSource();
			};
			var slsh = new SlideShareViewer(url,document.createElement("div"),{readyCallback: callback});

		}
	};


	// Updated the list of sources
	this.updateSource = function(){
		// Clears the container
		while(_sourcesList.firstChild){
			_sourcesList.removeChild(_sourcesList.firstChild);	
		}

		var addLine = function(title, transferData){
			var element = document.createElement('h3');
			element.innerHTML = '<span class="drag" draggable="true">+</span>'+title+'<span>3:25<span class="viewport">A</span></span>';
			element.addEventListener('dragstart', function(e){
				e.dataTransfer.dropEffect = 'copy';
				e.dataTransfer.setData("text/plain", transferData);
			}, false);
			element.addEventListener('dragend', function(e){
				this.style.opacity = '1';
				e.dataTransfer.dropEffect = 'copy';
			}, false);
			_sourcesList.appendChild(element);
			return element;
		};

		presentation.sources.forEach(function(source, index){
			source.htmlElement = addLine(source.title, index);
			source.htmlElement.style.background = source.color;
		});

		_clearSource = addLine("Clear viewport", "clear");
		_clearSource.classList.add("inactive");


		var addSource = document.createElement("h3");
		var addSourceInp = document.createElement("input");
		addSourceInp.type = "text";
		addSourceInp.placeholder = "Add source. Paste link here!";
		addSourceInp.addEventListener("keyup", function(e){
			if(e.keyCode == 13){
				e.preventDefault();
				_this.addSource(addSourceInp.value);
			}
		});
		addSource.appendChild(addSourceInp);
		_sourcesList.appendChild(addSource);
		// TODO Add click lister?
	}

	// Updates the position for updating position. (Called every single second!)
	this.updatePosition = function(position, length){
		// Set the length and position fields
		_sourcesHeader.innerHTML = "Sources <span>" + position + " / " + length + "</span>";
		
		// For source displayed
		// This will fuck up if one source is in two viewports at the same time!
		presentation.sources.forEach(function(source, sourceIndex){
			presentation.viewports.forEach(function(viewport, viewportIndex){
				// Is it among last event in any viewports?
				var segue = viewport.lastSegue; // could be a play segue
				if (segue != undefined && sourceIndex == segue.source) {
					// YAY Jackpot baby!
					source.htmlElement.classList.remove("inactive");
				} else if (segue != undefined && segue.type == "clear") {
					_clearSource.classList.remove("inactive");
				} else {
					source.htmlElement.classList.add("inactive");
				}
			});
		});
	};

}
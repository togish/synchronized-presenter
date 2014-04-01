/* jshint strict: false */
/* exported Presentation */
/* global Event: false */
/* global console: false */


/*
 * 
 */
var Sources = function (loadTarget) {
	// Scope rule hax
	var _this = this;

	// Color list
	this.colors = ["hsl(32,100%,50%)", "hsl(195,100%,40%)", "hsl( 80,100%,30%)"];

	var _sourcesHeader;
	var _sourcesList;


	/*
	 * Adds a source to the presentation
	 */
	this.addSource = function(url){
		// Tries if it is a youtube link
		var youtubeVidId = YouTubeHelpers.parseUrl(url);
		if(typeof youtubeVidId == "string"){
			// Loads metadata
			YouTubeHelpers.loadMetadata(youtubeVidId,function(d){
				// Adds the source to the presentation
				loadTarget.presentation.sources.push({
					type: "youtube",
					timed: true,
					url: url,
					title: d.title,
					length: d.duration,
					color: _this.colors[loadTarget.presentation.sources.length]
				});

				_this.render();
			});
		} else if (url.match(/\.slideshare\.net/i)){
			var callback = function(){
				loadTarget.presentation.sources.push({
					type: "slideshare",
					timed: false,
					url: url,
					title: slideShare.presentation.title,
					length: slideShare.length(),
					color: _this.colors[loadTarget.presentation.sources.length]
				});

				_this.render();
			};
			var slideShare = new SlideShareViewer(url,document.createElement("div"),{readyCallback: callback});
		} else if (url.match(/.*\.pdf$/i)){
			var filename = url;
			var m = filename.match(/^.*\//);
			if(m != null && m.length > 0){
				filename = filename.substring(m[0].length);
			}

			var res = {
				type: "pdfjs",
				timed: false,
				url: url,
				title: filename,
				color: _this.colors[loadTarget.presentation.sources.length]
			};

			var c = function(pp){
				res.length = pp.getDuration();
				loadTarget.presentation.sources.push(res);
				_this.render();
			};

			var pdf = new PdfJsPlayer(res, document.createElement("div"), c);
			pdf.init();
		} else {
			console.debug("No alternative found");
		}
	};

	/*
	 * Adds a source to the presentation
	 */
	this.removeSource = function(index){
		// Removes the source at the given index
		loadTarget.presentation.sources.splice(index, 1);

		// Fires event about the change
		loadTarget.dispatchEvent(new CustomEvent("sourceRemoved", {detail: index}));
	};


	/*
	 * Updates the list of sources
	 */
	this.render = function(){
		// Clears the container
		while(_sourcesList.firstChild){
			_sourcesList.removeChild(_sourcesList.firstChild);	
		}

		// Function for adding a source line to the container
		var addLine = function(titleText, transferData){
			var element = document.createElement('h3');

			var draggable = document.createElement('span');
			draggable.className = 'drag';
			draggable.draggable = 'true';
			draggable.innerHTML = '+';
			draggable.addEventListener('dragstart', function(e){
				e.dataTransfer.dropEffect = 'copy';
				e.dataTransfer.setData("text/plain", transferData);
			}, false);
			draggable.addEventListener('dragend', function(e){
				e.dataTransfer.dropEffect = 'copy';
			}, false);
			element.appendChild(draggable);

			if(typeof type != "undefined"){
				var type = document.createElement('span');
				type.className = 'type type-' + type;
				type.innerHTML = '' + type;
				element.appendChild(type);
			}

			var title = document.createElement('span');
			title.className = 'title';
			title.innerHTML = '' + titleText;
			element.appendChild(title);

			var shows = document.createElement('span');
			shows.className = 'shows';
			element.appendChild(shows);

			// Adds the line to the container
			_sourcesList.appendChild(element);
			return {line: element, shows:shows};
		};

		// Adds the sources to the container
		loadTarget.presentation.sources.forEach(function(source, index){
			
			source.htmlElement = addLine(source.title, index);
			source.htmlElement.line.style.background = source.color;

			// Adds ability to click and show extra buttons on a source.
			source.htmlElement.line.addEventListener('click', function(e){
				source.htmlElement.line.classList.add("focused");
			});
			source.htmlElement.line.addEventListener('mouseleave', function(e){
				source.htmlElement.line.classList.remove("focused");
			});

			// Adds remove button to the source
			var removeSource = document.createElement('a');
			removeSource.className = "remove";
			removeSource.innerHTML = "X";
			removeSource.addEventListener('click', function(e){
				_this.removeSource(index);
			});
			source.htmlElement.line.appendChild(removeSource);
		});

		// Custom source for the clear segue
		_clearSource = addLine("Clear viewport", "clear");

		// Builds the field for adding more sources
		var addSource = document.createElement("h3");
		var addSourceInput = document.createElement("input");
		addSourceInput.type = "text";
		addSourceInput.placeholder = "Add source. Paste link here!";
		addSourceInput.addEventListener("keyup", function(e){
			if(e.keyCode == 13){
				e.preventDefault();
				_this.addSource(addSourceInput.value);
			}
		});
		addSource.appendChild(addSourceInput);
		_sourcesList.appendChild(addSource);
	}

	// Updates the position for updating position. (Called every single second!)
	this.positionChanged = function(position, length){
		// TODO Implement this when the preview is added!
		return;
		// Set the length and position fields
		_sourcesHeader.innerHTML = "Sources <span>" + position + " / " + length + "</span>";

		// <span class="timestamp">3:25<span class="viewport">A</span></span>
		presentation.sources.forEach(function(source, sourceIndex){
			presentation.viewports.forEach(function(viewport, viewportIndex){
				// Is it among last event in any viewports?
				var segue = viewport.lastSegue; // could be a play segue
				if (segue != undefined && sourceIndex == segue.source) {
					// YAY Jackpot baby!
					source.htmlElement.classList.add("active");
				} else if (segue != undefined && segue.type == "clear") {
					_clearSource.classList.add("active");
				} else {
					source.htmlElement.classList.remove("active");
				}
			});
		});
	};


	this.initUI = function(blockSources){
		_sourcesHeader = document.createElement('h2');
		_sourcesList = document.createElement('div');
		
		blockSources.appendChild(_sourcesHeader);
		blockSources.appendChild(_sourcesList);

		_sourcesHeader.innerHTML = "Sources";

		// Subscribe to events
		loadTarget.addEventListener("presentationLoaded", function(ev){
			// Renders the source list when the presentation is loaded
			_this.render();
		});

		loadTarget.addEventListener("sourceRemoved", function(ev){
			_this.render();
		});

		loadTarget.addEventListener("segueChanged", function(ev){
			_this.positionChanged();
		});

		loadTarget.addEventListener("positionChanged", function(ev){
			_this.positionChanged();
		});
	};
}
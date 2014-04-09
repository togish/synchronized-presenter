/* jshint strict: false */
/* exported Presentation */
/* global Event: false */
/* global console: false */


/*
 * Class for managing the UI for the source list representation
 */
var Sources = function (contanerElement) {
	// Scope rule hax
	var _this = this;

	_this.htmlElement = document.createElement('div');
	_this.htmlElement.className = 'block-sources';
	var _sourcesHeader = document.createElement('h2');
	_sourcesHeader.innerHTML = "Sources";
	var _sourcesList = document.createElement('div');
	var _sourcesFooter = document.createElement('div');
	this.htmlElement.appendChild(_sourcesHeader);
	this.htmlElement.appendChild(_sourcesList);
	this.htmlElement.appendChild(_sourcesFooter);


	// Custom source for the clear segue
	var clearSource = new Source({type:"clear", title:"Clear viewport"});
	_sourcesFooter.appendChild(clearSource.htmlElement);

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
	_sourcesFooter.appendChild(addSource);

	var _data;
	
	// Renders the source list when the presentation is loaded
	contanerElement.addEventListener(EventTypes.EVENT_PRESENTATION_LOADED, function(ev){
		_data = ev.detail;
		_data.presentation.sources.forEach(function(source){
			_sourcesList.appendChild(source.htmlElement);
		});
	});

	// Renders the sourcelist when a new source is added.
	contanerElement.addEventListener(EventTypes.EVENT_SOURCE_ADDED, function(ev){
		_sourcesList.appendChild(ev.detail.htmlElement);
	});


	/*
	 * Adds a source, based on the url, to the presentation
	 */
	this.addSource = function(url){
		if(!(_data instanceof Data)) {
			return;
		}

		// Tries if it is a youtube link
		var youtubeVidId = YouTubeHelpers.parseUrl(url);
		if(typeof youtubeVidId == "string"){
			// Loads metadata
			YouTubeHelpers.loadMetadata(youtubeVidId,function(d){
				// Adds the source to the presentation
				var source = {
					type: "youtube",
					timed: true,
					url: url,
					title: d.title,
					length: d.duration,
					color: _data.colors[_data.presentation.sources.length]
				};
				_data.addSource(new Source(source, _data));
				addSourceInput.value = "";
			});
		} else if (url.match(/\.slideshare\.net/i)){
			var callback = function(){
				var source = {
					type: "slideshare",
					timed: false,
					url: url,
					title: slideShare.presentation.title,
					length: slideShare.length(),
					color: _data.colors[_data.presentation.sources.length]
				};
				_data.addSource(new Source(source, _data));
				addSourceInput.value = "";
			};
			var slideShare = new SlideShareViewer(url,document.createElement("div"),{readyCallback: callback});
		} else if (url.match(/.*\.pdf$/i)){
			var filename = url;
			var m = filename.match(/^.*\//);
			if(m != null && m.length > 0){
				filename = filename.substring(m[0].length);
			}

			var source = new Source({
				type: "pdfjs",
				timed: false,
				url: url,
				title: filename,
				color: _data.colors[_data.presentation.sources.length]
			}, _data);

			var player = new PdfJsPlayer(source);
			player.htmlElement.addEventListener(EventTypes.EVENT_PLAYER_READYNESS_CHANGED, function(){
				source = new Source({
					type: "pdfjs",
					timed: false,
					url: url,
					title: filename,
					length: player.getDuration(),
					color: _data.colors[_data.presentation.sources.length]
				}, _data);
				_data.addSource(source);
				addSourceInput.value = "";
			});
		} else {
			console.debug("No alternative found");
		}
	};

	/*
	 * Updates the position markers for the sources
	 */
	//	this.positionChanged = function(position, length){
	//		// TODO Implement this when the preview is added!
	//		
	//		return;
	//		// Set the length and position fields
	//		_sourcesHeader.innerHTML = "Sources <span>" + position + " / " + length + "</span>";
	//
	//		// <span class="timestamp">3:25<span class="viewport">A</span></span>
	//		presentation.sources.forEach(function(source, sourceIndex){
	//			presentation.viewports.forEach(function(viewport, viewportIndex){
	//				// Is it among last event in any viewports?
	//				var segue = viewport.lastSegue; // could be a play segue
	//				if (segue != undefined && sourceIndex == segue.source) {
	//					// YAY Jackpot baby!
	//					source.htmlElement.classList.add("active");
	//				} else if (segue != undefined && segue.type == "clear") {
	//					//_clearSource.classList.add("active");
	//				} else {
	//					source.htmlElement.classList.remove("active");
	//				}
	//			});
	//		});
	//	};
	// Updates the position markers when a segue changes
	//loadTarget.addEventListener("SegueChanged", function(ev){
	//	_this.positionChanged();
	//});
	// Updates the position markers when the playback position changes
	//	loadTarget.addEventListener("PositionChanged", function(ev){
	//		// TODO Parse the event details, and use as parameter
	//		_this.positionChanged();
	//	});

}
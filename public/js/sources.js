/* jshint strict: false */
/* exported Presentation */
/* global Event: false */
/* global console: false */
var Sources = function (presentation, blockSources) {
	var _sourcesHeader = document.createElement('h2');
	blockSources.appendChild(_sourcesHeader);

	var _sourcesList = document.createElement('div');
	blockSources.appendChild(_sourcesList);


	// Updated the list of sources
	this.updateSource = function(){
		// Clears the container
		while(_sourcesList.firstChild){
			_sourcesList.removeChild(_sourcesList.firstChild);	
		}

		presentation.sources.forEach(function(source, index){
			var element = document.createElement('h3');
			element.style.background = source.color;
			element.innerHTML = '<span class="drag" draggable="true">+</span>'+source.title+'<span>3:25<span class="viewport">A</span></span>';

			element.addEventListener('dragstart', function(e){
				//this.style.opacity = '0.4';
				e.dataTransfer.dropEffect = 'copy';
				e.dataTransfer.setData("text/plain", index);
			}, false);
			element.addEventListener('dragend', function(e){
				this.style.opacity = '1';
				e.dataTransfer.dropEffect = 'copy';
			}, false);
			_sourcesList.appendChild(element);
			source.htmlElement = element;
		});

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

					// TODO Find child node for the viewport and timestamp update those
				} else {
					source.htmlElement.classList.add("inactive");
				}
			});
		});
	};

}
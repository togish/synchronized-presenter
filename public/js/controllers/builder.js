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
var Builder = function (containerElement) {
	// Parameter validation
	if(!(containerElement instanceof HTMLElement)){
		throw 'Container element is not and instanceof HTMLElement';
	}

	// Proxy methods for event subscribe, remove and dispatch
	this.addEventListener = function (a,b,c) {containerElement.addEventListener(a,b,c);};
	this.dispatchEvent = function(a){containerElement.dispatchEvent(a);};
	this.removeEventListener = function(a,b,c){containerElement.removeEventListener(a,b,c);};

	// Clear the container
	while(containerElement.firstChild){
		containerElement.removeChild(containerElement.firstChild);	
	}

	// Setting up the header block with title edit field
	var blockHeader = document.createElement("div");
	blockHeader.className = 'block-header';
	
	var titleInput = document.createElement('input');
	titleInput.type = 'text';
	titleInput.placeholder = 'Enter title here....';
	titleInput.addEventListener('keyup', function(e){
			if(e.keyCode == 13){
				e.preventDefault();
				titleInput.blur();
			}
	});
	titleInput.addEventListener('blur', function(e){
		// _this.presentation.title = titleInput.value;
	});
	this.addEventListener("presentation loaded", function(){
		// titleInput.value = "TO SET :D";
	});
	blockHeader.appendChild(titleInput);
	containerElement.appendChild(blockHeader);

	// Sets child modules
	var data = new Data(containerElement);
	// TODO Use a fucking different controlbar!
	var controlBar = new ControlBar();
	var presenter = new Presenter(containerElement, controlBar, data);
	var sources = new Sources(containerElement);
	var timelines = new Timelines(this);

	containerElement.appendChild(data.htmlElement);

	var presenterBlock = document.createElement('div');
	presenterBlock.className = 'block-preview';
	presenterBlock.appendChild(presenter.htmlElement);
	containerElement.appendChild(presenterBlock);

	containerElement.appendChild(sources.htmlElement);
	containerElement.appendChild(timelines.htmlElement);

	data.loadAuto();
};

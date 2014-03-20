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
 * Param load target 
 * 		- must implement load(presentation) 
 *		- and expose the presentation at obj.presentation
 */
var Data = function (loadTarget) {
	var _this = this;
	var _basePath = "http://bachelor.dev/";
	var presentation = loadTarget.presentation != undefined ? loadTarget.presentation : {};
	var _done = function(){};

	// Builds the presentation object from a text string
	var _buildPresentation = function(presentationText){
		var ps = JSON.parse(presentationText);

		var colors = ["hsl(32,100%,50%)", "hsl(195,100%,40%)", "hsl( 80,100%,30%)"];
		ps.sources.forEach(function(s, idx){
			s.color = colors[idx];
		});

		_done();
		loadTarget.load(ps);
	};

	// Clean presentation returns a clean instance of a presentation
	var _cleanPresentation = function(){
		var clean ={};
		clean.info = presentation.info;
		clean.sources = [];
		clean.viewports = [];

		presentation.sources.forEach(function(s){
			clean.sources.push({
				type: s.type,
				title: s.title,
				data: s.data,
			});
		});
		presentation.viewports.forEach(function(v){
			var sgs = [];
			v.segues.forEach(function(s){
				var ss = {
					offset: s.offset,
					action: s.action,
				};

				if(s.value != undefined){
					ss.value = s.value;
				}
				if(s.source != undefined){
					ss.source = s.source;
				}

				sgs.push(ss);
			});
			clean.viewports.push({
				segues: sgs,
			});
		});
		return JSON.stringify(clean);
	};
	

	// Turns the provided base64 encoded zipfile into a presentation
	this.fromB64zip = function(zipString){
		var zip = new JSZip();
		zip.load(zipString, {base64:true});
		var content = zip.file("p.json").asText()
		console.log("Length of content in base64 zip: " + content.length);
		_buildPresentation(content);
	};

	// Returns a base64 encoded zipfile of the current presentation
	this.toB64zip = function(){
		var zip = new JSZip();
		zip.file("p.json", _cleanPresentation(),{compression:"DEFLATE"});
		var content = zip.generate();
		console.log("Length of base64 zip: " + content.length);
		return content;
	};
	
	// Loads the content of the url into the presentation object
	this.load = function(url){
		// TODO Make this request syncronus
		var req = typeof XMLHttpRequest != 'undefined' ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
  		req.open('get', url, true);
  		req.onreadystatechange = function() {
			if (req.readyState == 4 && req.status === 200) {
				_buildPresentation(req.responseText);
			}
		};
		req.send();
	};

	this.saveDialog = function(){
		var pres = _cleanPresentation();
		var filename = "" + presentation.info.name + ".json";

		var fade = document.createElement('div');
		fade.className = "fade";
		fade.addEventListener('click', function(e){
			e.preventDefault();
			if(e.target == fade){
				_done();
			}
		});
		_done = function(){fade.remove();};

		var dialog = document.createElement('div');
		dialog.className = "dialog";
		dialog.innerHTML = "<h1>Save presentation</h1>";

		var sinks = [];

		// Building buttons for save actions
		var btnFile = document.createElement("button");
		btnFile.innerHTML = "Save to file";
		btnFile.addEventListener('click', function(e){
			e.preventDefault();
			var blob = new Blob([pres], {type: "text/json;charset=utf-8"});
			saveAs(blob, filename);
		});
		sinks.push({
			text: "File:",
			button: btnFile 
		});


		// Building save to dropbox shit
		if(typeof Dropbox != "undefined" && Dropbox.isBrowserSupported()){
			var btnDropbox = Dropbox.createSaveButton("data:text/json;base64," + btoa(pres), filename);
			sinks.push({
				text: "Dropbox:",
				button: btnDropbox
			});
		}


		// Generating destination table
		var table = document.createElement("table");
		sinks.forEach(function(ele, idx){
			var row = document.createElement("tr");
			row.innerHTML = "<td><h3>" + ele.text + "</td></h3>";
			
			var cell = document.createElement("td");
			cell.appendChild(ele.button);
			row.appendChild(cell);

			table.appendChild(row);
		});
		dialog.appendChild(table);


		// Close/done button
		var btnDone = document.createElement('button');
		btnDone.innerHTML = "DONE";
		btnDone.className = "done";
		btnDone.addEventListener('click', function(){
			_done();
		});
		dialog.appendChild(btnDone);

		// Adding the dialog to the 
		fade.appendChild(dialog);
		document.body.appendChild(fade);
	};

	this.loadDialog = function(){
		// TODO distinguis between
		// 		forced load due missing presentation
		// 		optinal load

		var fade = document.createElement('div');
		fade.className = "fade";
		fade.addEventListener('click', function(e){
			if(e.target == fade){
				e.preventDefault();
				_done();
			}
		});
		_done = function(){fade.remove();};


		var dialog = document.createElement('div');
		dialog.className = "dialog";
		dialog.innerHTML = "<h1>Load presentation</h1>";

		var sinks = [];

		// Building buttons for save actions
		var btnFile = document.createElement("input");
		btnFile.type = 'file';
		btnFile.name = 'file';
		btnFile.addEventListener('change', function(e){
			var file = e.target.files[0];
			var reader = new FileReader();
			reader.onload = function(e) {
				_buildPresentation(e.target.result);
			};
			reader.readAsText(file);
		}, false);
		sinks.push({
			text: "File:",
			button: btnFile 
		});

		if(typeof Dropbox != "undefined" && Dropbox.isBrowserSupported()){
			var btnDropbox = Dropbox.createChooseButton({
				success: function(files) {
					_this.load(files[0].link);
				},
				linkType: "direct",
				multiselect: false,
				// extensions: ['.pdf', '.doc', '.docx'],
			});
			sinks.push({
				text: "Dropbox:",
				button: btnDropbox
			});
		}

		// Generating destination table
		var table = document.createElement("table");
		sinks.forEach(function(ele, idx){
			var row = document.createElement("tr");
			row.innerHTML = "<td><h3>" + ele.text + "</td></h3>";
			
			var cell = document.createElement("td");
			cell.appendChild(ele.button);
			row.appendChild(cell);

			table.appendChild(row);
		});
		dialog.appendChild(table);


		// Adding the dialog to the 
		fade.appendChild(dialog);
		document.body.appendChild(fade);
	};

	// Setting up listners for the ui actions
	this.init = function(blockData){
		var saveTriggers = blockData.getElementsByClassName('save');
		for(var i = 0; i < saveTriggers.length;i++){
			var e = saveTriggers[i];
			e.addEventListener('click', function(ev){
				_this.saveDialog();
			});
		}
		var loadTriggers = blockData.getElementsByClassName('load');
		for(var i = 0; i < loadTriggers.length;i++){
			var e = loadTriggers[i];
			e.addEventListener('click', function(ev){
				_this.loadDialog();
			});
		}
	}
};


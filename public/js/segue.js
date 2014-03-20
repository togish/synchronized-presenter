/* jshint strict: false */
/* exported Presentation */
/* global SlideSharePlayer: false */
/* global YouTubePlayer: false */
/* global Event: false */
/* global console: false */

var Segue = function (presentation, blockSegue) {
	var _currentSegue;

	var _actionRadio = {};
	
	// Creates the options table for the segue editor
	var _editTable = document.createElement('table');

	// Creates the header for the segue editor
	var _sourcesHeader = document.createElement('h2');
	_sourcesHeader.innerHTML = "Edit segue";
	blockSegue.appendChild(_sourcesHeader);

	// Creates the action row
	var _actionRow = document.createElement('tr');
	_actionRow.className = 'action';
	_actionRow.innerHTML = '<td><h3>Action</h3></td>';
	var _actionFormCell = document.createElement('td');

	//["Play", "Pause", 
	["Play from", "Clear"].forEach(function(ele, idx){
		var key = ele.toLowerCase();
		var input = document.createElement("input");
		input.type="radio";
		input.id ="action_" + key;
		input.name ='LALA';
		input.value = key;
		_actionRadio[key] = input;
		
		var label = document.createElement("label");
		label.innerHTML=ele;
		label.setAttribute('for', 'action_'+key);

		_actionFormCell.appendChild(input);
		_actionFormCell.appendChild(label);
	});
	_actionRow.appendChild(_actionFormCell);
	_editTable.appendChild(_actionRow);

	// Selected source display
	var _sourceRow = document.createElement('tr');
	_sourceRow.className = 'source';
	_sourceRow.innerHTML = '<td><h3>Source</h3></td>';
	var _sourceCell = document.createElement('td');
	_sourceRow.appendChild(_sourceCell);
	_editTable.appendChild(_sourceRow);



	// On source selection update this section
	var _positionRow = document.createElement('tr');
	_positionRow.className = 'position';
	_positionRow.innerHTML = '<td><h3>Position</h3></td>';

	var _positionCell = document.createElement('td');
	_positionCell.innerHTML = '<td>Design this later</td>';
	_positionRow.appendChild(_positionCell);
	_editTable.appendChild(_positionRow);


	blockSegue.appendChild(_editTable);


	this.edit = function(segue){
		// Update the container elements content according to the 
		console.debug(segue);

		
		["Play", "Pause", "Seek", "Clear"].forEach(function(ele, idx){
			_actionRadio[ele.toLowerCase()].checked = false;
			_actionRadio[ele.toLowerCase()].nextSibling.style.display = "inline-block";
		});


		// Dependent on the source
		var source = presentation.sources[segue.source];
		if(!source.timed){
			["Play", "Pause"].forEach(function(ele, idx){
				_actionRadio[ele.toLowerCase()].checked = false;
				_actionRadio[ele.toLowerCase()].nextSibling.style.display = "none";
			});
		}

		_sourceCell.innerHTML = "<h3>"+source.title+"</h3>";
		_sourceCell.style.background = source.color;

		_sourcesHeader.innerHTML = "Edit segue<span>1:55</span>";

		_actionRadio[segue.action].checked = true;
	}


	this.presentationUpdated = function(event){
		// Creates the source selection row
		if(_sourceSelector != undefined){
			_sourceSelector.remove();
		}
	};
}
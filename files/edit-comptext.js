/*\
title: $:/core/modules/widgets/compedit-text.js
type: application/javascript
module-type: widget

Taken from original Edit-text widget
Version 5.1.9 of TW5
Add link-to-tiddler completion

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
    
var DEFAULT_MIN_TEXT_AREA_HEIGHT = "100px"; // Minimum height of textareas in pixels
    
var Widget = require("$:/core/modules/widgets/widget.js").widget;
// to compute pixel coordinates of cursor
var getCaretCoordinates = require("$:/_snowgoon88/lib/cursor_position.js");

var CompEditTextWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
  	// Internal variables
  	this._nbSquareParen = 0;
  	this._pattern = "";
	this._state = "VOID";
	this._bestChoices = [];
};

/*
Inherit from the base widget class
*/
CompEditTextWidget.prototype = new Widget();

/*
Inner function : Show/Hide popupNode
*/
CompEditTextWidget.prototype.popupShow = function ( popup, position) {
    if ( popup.style.display == 'none' ) {
	popup.style.left = position[0] + 'px';
	popup.style.top = position[1] + 'px';
	popup.style.display = 'block';
    }
};
CompEditTextWidget.prototype.popupHide = function( popup ) {
    if ( popup.style.display != 'none' ) {
	popup.style.display = 'none';
    }
};
/*
Inner function : find the best matches
*/
CompEditTextWidget.prototype.bestChoice = function( pattern, nbMax) {
    var allTidTitles = $tw.wiki.getTiddlers(); /*wiki.js*/
    var bestStr = "";
    var nbBest = 0;
   // nbMax set to 2 if no value given
    nbMax = nbMax !== undefined ? nbMax : 2;

    this._bestChoices = [];
    for( var i=0; i<allTidTitles.length; i++ ) {
	    //console.log( "SW "+choices[i]+ " w "+pattern +" ?" );
		if ( allTidTitles[i].startsWith( pattern ) ) {
	        //console.log( "SW => YES");
	    	if (nbBest == nbMax) {
				bestStr += "...";
				this._bestChoices.push( "..." );
				return bestStr;
	    	} else {
				bestStr += allTidTitles[i] + "<br />";
				this._bestChoices.push( allTidTitles[i] );
				nbBest += 1;
	    	}
        }
    }
    return bestStr;
};
/*
Render this widget into the DOM
*/
CompEditTextWidget.prototype.render = function(parent,nextSibling) {
    var self = this;
    // Save the parent dom node
    this.parentDomNode = parent;
    // Compute our attributes
    this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our element
	var editInfo = this.getEditInfo(),
		tag = this.editTag;
	if($tw.config.htmlUnsafeElements.indexOf(tag) !== -1) {
		tag = "input";
	}
	var domNode = this.document.createElement(tag);
	if(this.editType) {
		domNode.setAttribute("type",this.editType);
	}
	if(editInfo.value === "" && this.editPlaceholder) {
		domNode.setAttribute("placeholder",this.editPlaceholder);
	}
	if(this.editSize) {
		domNode.setAttribute("size",this.editSize);
	}
	// Assign classes
	if(this.editClass) {
		domNode.className = this.editClass;
	}
	// Set the text
	if(this.editTag === "textarea") {
		domNode.appendChild(this.document.createTextNode(editInfo.value));
	} else {
		domNode.value = editInfo.value;
	}
	// Add an input event handler, especially for input and keyup (catch ENTER, ARROW, etc)
	$tw.utils.addEventListeners(domNode,[
      {name: "focus", handlerObject: this, handlerMethod: "handleFocusEvent"},
      {name: "input", handlerObject: this, handlerMethod: "handleInputEvent"},
      {name: "keyup", handlerObject: this, handlerMethod: "handleKeyupEvent"}
	]);
	// Insert the element into the DOM
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
    
    // Insert a special "div" element for poping up
    // Its 'display' propeerty in 'style' control its visibility
    var popupNode = this.document.createElement("div");
    popupNode.setAttribute( "style", "border:1px solid gray; display:none; position: absolute; color:blue; background-color: white;");
    popupNode.className = "popup_comptext";
    // Insert the element into the DOM
    parent.insertBefore(popupNode,nextSibling);
    this.domNodes.push(popupNode);
    
    if(this.postRender) {
	this.postRender();
    }
    // Fix height
    this.fixHeight();
    // Focus field
    if(this.editFocus === "true") {
	if(domNode.focus && domNode.select) {
	    domNode.focus();
	    domNode.select();			
	}
    }
};
    
/*
  Get the tiddler being edited and current value
*/
CompEditTextWidget.prototype.getEditInfo = function() {
    // Get the edit value
    var self = this,
    value,
    update;
    if(this.editIndex) {
	value = this.wiki.extractTiddlerDataItem(this.editTitle,this.editIndex,this.editDefault);
	update = function(value) {
			var data = self.wiki.getTiddlerData(self.editTitle,{});
			if(data[self.editIndex] !== value) {
				data[self.editIndex] = value;
				self.wiki.setTiddlerData(self.editTitle,data);
			}
		};
	} else {
		// Get the current tiddler and the field name
		var tiddler = this.wiki.getTiddler(this.editTitle);
		if(tiddler) {
			// If we've got a tiddler, the value to display is the field string value
			value = tiddler.getFieldString(this.editField);
		} else {
			// Otherwise, we need to construct a default value for the editor
			switch(this.editField) {
				case "text":
					value = "Type the text for the tiddler '" + this.editTitle + "'";
					break;
				case "title":
					value = this.editTitle;
					break;
				default:
					value = "";
					break;
			}
			if(this.editDefault !== undefined) {
				value = this.editDefault;
			}
		}
		update = function(value) {
			var tiddler = self.wiki.getTiddler(self.editTitle),
				updateFields = {
					title: self.editTitle
				};
			updateFields[self.editField] = value;
			self.wiki.addTiddler(new $tw.Tiddler(self.wiki.getCreationFields(),tiddler,updateFields,self.wiki.getModificationFields()));
		};
	}
	return {value: value, update: update};
};

/*
Compute the internal state of the widget
*/
CompEditTextWidget.prototype.execute = function() {
	// Get our parameters
	this.editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.editField = this.getAttribute("field","text");
	this.editIndex = this.getAttribute("index");
	this.editDefault = this.getAttribute("default");
	this.editClass = this.getAttribute("class");
	this.editPlaceholder = this.getAttribute("placeholder");
	this.editSize = this.getAttribute("size");
	this.editAutoHeight = this.getAttribute("autoHeight","yes") === "yes";
	this.editMinHeight = this.getAttribute("minHeight",DEFAULT_MIN_TEXT_AREA_HEIGHT);
	this.editFocusPopup = this.getAttribute("focusPopup");
	this.editFocus = this.getAttribute("focus");
	// Get the editor element tag and type
	var tag,type;
	if(this.editField === "text") {
		tag = "textarea";
	} else {
		tag = "input";
		var fieldModule = $tw.Tiddler.fieldModules[this.editField];
		if(fieldModule && fieldModule.editTag) {
			tag = fieldModule.editTag;
		}
		if(fieldModule && fieldModule.editType) {
			type = fieldModule.editType;
		}
		type = type || "text";
	}
	// Get the rest of our parameters
	this.editTag = this.getAttribute("tag",tag);
	this.editType = this.getAttribute("type",type);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CompEditTextWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely rerender if any of our attributes have changed
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || changedAttributes["default"] || changedAttributes["class"] || changedAttributes.placeholder || changedAttributes.size || changedAttributes.autoHeight || changedAttributes.minHeight || changedAttributes.focusPopup) {
		this.refreshSelf();
		return true;
	} else if(changedTiddlers[this.editTitle]) {
		this.updateEditor(this.getEditInfo().value);
		return true;
	}
	return false;
};

/*
Update the editor with new text. This method is separate from updateEditorDomNode()
so that subclasses can override updateEditor() and still use updateEditorDomNode()
*/
CompEditTextWidget.prototype.updateEditor = function(text) {
	this.updateEditorDomNode(text);
};

/*
Update the editor dom node with new text
*/
CompEditTextWidget.prototype.updateEditorDomNode = function(text) {
	// Replace the edit value if the tiddler we're editing has changed
	var domNode = this.domNodes[0];
	if(!domNode.isTiddlyWikiFakeDom) {
		if(this.document.activeElement !== domNode) {
			domNode.value = text;
		}
		// Fix the height if needed
		this.fixHeight();
	}
};

/*
Fix the height of textareas to fit their content
*/
CompEditTextWidget.prototype.fixHeight = function() {
	var self = this,
		domNode = this.domNodes[0];
	if(this.editAutoHeight && domNode && !domNode.isTiddlyWikiFakeDom && this.editTag === "textarea") {
		// Resize the textarea to fit its content, preserving scroll position
		var scrollPosition = $tw.utils.getScrollPosition(),
			scrollTop = scrollPosition.y;
		// Measure the specified minimum height
		domNode.style.height = self.editMinHeight;
		var minHeight = domNode.offsetHeight;
		// Set its height to auto so that it snaps to the correct height
		domNode.style.height = "auto";
		// Calculate the revised height
		var newHeight = Math.max(domNode.scrollHeight + domNode.offsetHeight - domNode.clientHeight,minHeight);
		// Only try to change the height if it has changed
		if(newHeight !== domNode.offsetHeight) {
			domNode.style.height =  newHeight + "px";
			// Make sure that the dimensions of the textarea are recalculated
			$tw.utils.forceLayout(domNode);
			// Check that the scroll position is still visible before trying to scroll back to it
			scrollTop = Math.min(scrollTop,self.document.body.scrollHeight - window.innerHeight);
			window.scrollTo(scrollPosition.x,scrollTop);
		}
	}
};

/*
Handle a dom "input" event
*/
CompEditTextWidget.prototype.handleInputEvent = function(event) {
    // The area for editing text
    var domNode = this.domNodes[0];
    // The popup window 
    var popupNode = this.domNodes[1]; // ugly
    var curPos = domNode.selectionStart;
    var val = domNode.value;
    //var cChar = val[curPos];
    var pChar = val[curPos-1];
    
    // '['
    if (this._state == "VOID" && pChar == '[') {
	//console.log( "VOID and [");
	this._nbSquareParen += 1;
	if (this._nbSquareParen == 2 ) {
	    //console.log( "state switch to PATTERN" );
	    this._state = "PATTERN";
	    this._pattern = "";
	}
    }
    else if (this._state == "PATTERN") {
	// ENTER
	if (pChar == '\n' ) {
	    //console.log( "ENTER pressed" );
	    if (this._bestChoices.length == 1) {
		//console.log( "INSERT");
		var lenPattern = this._pattern.length;
		var newVal = val.slice(0,curPos-1) + this._bestChoices[0].slice(lenPattern) + ']]' + val.slice(curPos);
                // console.log( "NEW VAL = "+newVal );
                // WARN : Directly modifie domNode.value.
                // Not sure it does not short-circuit other update methods of the domNode....
		domNode.value = newVal;
              	domNode.setSelectionRange(curPos+this._bestChoices[0].length-lenPattern+1,curPos+this._bestChoices[0].length-lenPattern+1);
	    }
	    // remove ENTER and INSERT le reste de _bestChoice[0]
	    else {
		//console.log( "ABORT" );
		var newVal = val.slice(0,curPos-1) + val.slice(curPos);
		// WARN : Directly modifie domNode.value.
		// Not sure it does not short-circuit other update methods of the domNode....
		domNode.value = newVal;
		domNode.setSelectionRange(curPos-1,curPos-1);
	    }
	    //console.log( "state switch to VOID" );
	    this._nbSquareParen = 0;
	    this._state = "VOID";
	    this._pattern = "";
	    this.popupHide( popupNode );
	}
	// Building the PATTERN
	else {
	    this._pattern += pChar;
	        //console.log( "state PATTERN pat=" + this._pattern );
	    
	    	var choice = this.bestChoice( this._pattern );
	    	//console.log( "BC "+ this._pattern + " => " + choice );
	    	if (choice != "" ) {
				popupNode.innerHTML = choice;

		// Cursor coordinates within area + area coordinates + scroll		
                var coordinates = getCaretCoordinates(domNode, domNode.selectionEnd);
                var styleSize = getComputedStyle(domNode).getPropertyValue('font-size');
                var fontSize = parseFloat(styleSize); 
		
				this.popupShow( popupNode,  [domNode.offsetLeft-domNode.scrollLeft+coordinates.left, domNode.offsetTop-domNode.scrollTop+coordinates.top+fontSize*2]);
	    	} else {
				this.popupHide( popupNode );
	    	}
		}
    } 
    // Default
    else {
		//console.log( "state switch to VOID" );
		this._nbSquareParen = 0;
		this._state = "VOID";
		this._pattern = "";
		this.popupHide( popupNode );
		// remove ENTER
    }          

    this.saveChanges(this.domNodes[0].value);
    this.fixHeight();
    return true;
};
/** Handle keyup Event
 * Catch ARROW, HOME, END, BACKSPACE, INSERT, SUPPR.
 */
CompEditTextWidget.prototype.handleKeyupEvent = function(event) {
  var domNode = this.domNodes[0];
  var popupNode = this.domNodes[1]; // ugly
  var key = event.keyCode;
  var curPos = domNode.selectionStart;
  var val = domNode.value;
  var pChar = val[curPos-1];
  
  //console.log( "****** handleKeyupEvent" );
  //console.log( "KEYUP> ("+key+") "+ curPos + " => " + pChar+ "|" + this._state );
              
 	// 38:UP; 37:Left, 39:Right, 40:DOWN
    // 35:Home, 36:End
    // 8:BACKSPACE, 45:INSERT, 46:SUPPR
    if (this._state == "PATTERN")
	if (key == 38 || key == 37 || key == 39 || key == 40 || key == 35 || key == 36 || key == 8 || key== 45 || key == 46) {
	    //console.log( "ABORT" );
	    this._nbSquareParen = 0;
	    this._state = "VOID";
	    this._pattern = "";
	    this.popupHide( popupNode );
	    //event.stopPropagation(); // needed ???
	}             
};
CompEditTextWidget.prototype.handleFocusEvent = function(event) {
	if(this.editFocusPopup) {
		$tw.popup.triggerPopup({
			domNode: this.domNodes[0],
			title: this.editFocusPopup,
			wiki: this.wiki,
			force: true
		});
	}
	return true;
};

CompEditTextWidget.prototype.saveChanges = function(text) {
	var editInfo = this.getEditInfo();
	if(text !== editInfo.value) {
		editInfo.update(text);
	}
};

// a new widget :o)
exports["edit-comptext"] = CompEditTextWidget;

})();

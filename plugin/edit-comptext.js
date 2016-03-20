/*\
title: $:/plugins/snowgoon88/edit-comptext/edit-comptext.js
type: application/javascript
module-type: widget

Taken from original Edit-text widget
Version 5.1.9 of TW5
Add link-to-tiddler completion

TODO : where should popupNode be created in the DOM ?
TODO : check that options are valid (numeric ?)
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
    
var DEFAULT_MIN_TEXT_AREA_HEIGHT = "100px"; // Minimum height of textareas in pixels
    
var Widget = require("$:/core/modules/widgets/widget.js").widget;
// to compute pixel coordinates of cursor
var getCaretCoordinates = require("$:/plugins/snowgoon88/edit-comptext/cursor-position.js");
var Completion = require("$:/plugins/snowgoon88/edit-comptext/completion.js").Completion;

var isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

var CompEditTextWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
    
    // a Completion Object
    // Need a display and undisplay function
    var display = function( areaNode, popupNode ) {
	if ( popupNode.style.display == 'none' ) {
	    // Must get coordinate
	    // Cursor coordinates within area + area coordinates + scroll
            var coord = getCaretCoordinates(areaNode, areaNode.selectionEnd);
            var styleSize = getComputedStyle(areaNode).getPropertyValue('font-size');
            var fontSize = parseFloat(styleSize); 
		
	    popupNode.style.left = (areaNode.offsetLeft-areaNode.scrollLeft+coord.left) + 'px';
	    popupNode.style.top = (areaNode.offsetTop-areaNode.scrollTop+coord.top+fontSize*2) + 'px';
	    popupNode.style.display = 'block';
	}
    };
    var undisplay = function( areaNode, popupNode ) {
	if ( popupNode.style.display != 'none' ) {
	    popupNode.style.display = 'none';
	}
    };
    // Options for Completion - Could check for numeric.
    this._compMinPatLen = this.getValue( this._compMinPatLen, "minpatternlength" );
    this._compMaxMatch = this.getValue( this._compMaxMatch, "maxmatch" );
    this._compCaseSensitive = this.getValue( this._compCaseSensitive, "casesensitive" );
    this._compCaseSensitive = this._compCaseSensitive === "no" ? false : true;
    
    this._comp = new Completion( display, undisplay, this.wiki );
    this._comp._maxMatch = this._compMaxMatch;
    this._comp._minPatLen = this._compMinPatLen;
    this._comp._caseSensitive = this._compCaseSensitive;

    //NOconsole.log( "__CHECK $tw="+$tw );
    //NOconsole.log( "__CHECK tw.filter="+$tw.filterTiddlers );

    //YESconsole.log( "__CHECK wiki="+this.wiki );
    //YESconsole.log( "__CHECK filter="+this.wiki.filterTiddlers );

};
    
/*
Inherit from the base widget class
*/
CompEditTextWidget.prototype = new Widget();


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
      {name: "keydown", handlerObject: this, handlerMethod: "handleKeydownEvent"},
      {name: "keypress", handlerObject: this, handlerMethod: "handleKeypressEvent"},
      {name: "keyup", handlerObject: this, handlerMethod: "handleKeyupEvent"}
	]);
	// Insert the element into the DOM
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
    
    // Insert a special "div" element for poping up
    // Its 'display' property in 'style' control its visibility
    var popupNode = this.document.createElement("div");
    popupNode.setAttribute( "style", "display:none; position: absolute;");
    popupNode.className = "tc-block-dropdown ect-block-dropdown";
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
    // Defer to Completion object
    this._comp._onInput(event);

    this.saveChanges(this.domNodes[0].value); // ugly ?
    this.fixHeight();
    return true;
};
/** 
 * Handle keyup Event
 */
CompEditTextWidget.prototype.handleKeyupEvent = function(event) {
    // Defer to Completion
    this._comp._onKeyUp(event, $tw.wiki.getTiddlers(),
			this.domNodes[0], this.domNodes[1]); // ugly

    this.saveChanges(this.domNodes[0].value); // ugly ?
    this.fixHeight();
    return true;
};
/**
 * Handle keypress.
 */
CompEditTextWidget.prototype.handleKeypressEvent = function(event) {
    // Defer to Completion
    this._comp._onKeyPress(event);
};
/**
 * Handle keydown.
 */
CompEditTextWidget.prototype.handleKeydownEvent = function(event) {
    // Defer to Completion
    this._comp._onKeyDown(event);
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

CompEditTextWidget .prototype.getValue = function(value,attr) {
    var tidConfig, fieldVal,
    // Global fallbacks
    fallbacks = {
        minpatternlength : 2,
        maxmatch : 5,
        casesensitive : "no"
    };
    // If there is no value...
    if(value === undefined) {
	// Get default from config tiddler
        tidConfig = this.wiki.getTiddler("$:/plugins/snowgoon88/edit-comptext/config");
	console.log( "__GETVALUE def="+tidConfig.getFieldString(attr) );
	// Got one?
	if(tidConfig) {
	    // Check has proper field
	    fieldVal = tidConfig.getFieldString( attr );
	    console.log( "__Field "+attr+" = "+ fieldVal );
	    if( fieldVal !== "" ) {
		value = fieldVal;
	    }
	}
    }
    // If we still have no value
    if(value === undefined) {
	// Try to read from fallbacks
	value = fallbacks[attr];
    }
    return value;
};

// a new widget :o)
exports["edit-comptext"] = CompEditTextWidget;

})();

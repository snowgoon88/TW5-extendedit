/*\
title: $:/plugins/snowgoon88/edit-comptext/framed.js
type: application/javascript
module-type: library

Taken from $:/core/modules/editor/engines/framed.js
Text editor engine based on a simple input or textarea within an iframe. This is done so that the selection is preserved even when clicking away from the textarea

\*/
(function(){

/*jslint node: true,browser: true */
/*global $tw: false */
"use strict";

var HEIGHT_VALUE_TITLE = "$:/config/TextEditor/EditorHeight/Height";

// Configuration tiddler
var COMPLETION_OPTIONS = "$:/plugins/snowgoon88/edit-comptext/config";
var Completion = require("$:/plugins/snowgoon88/edit-comptext/completion.js").Completion;
	
function FramedCompEngine(options) {
       //DEBUG console.log( "==FramedCompEngine::creation" );
	// Save our options
	options = options || {};
	this.widget = options.widget;
	this.value = options.value;
	this.parentNode = options.parentNode;
	this.nextSibling = options.nextSibling;

	// Completion
	// Load Completion configuration as JSON
    this._configOptions = $tw.wiki.getTiddlerData( COMPLETION_OPTIONS, {} );
	
	// Create our hidden dummy text area for reading styles
	this.dummyTextArea = this.widget.document.createElement("textarea");
	if(this.widget.editClass) {
		this.dummyTextArea.className = this.widget.editClass;
	}
	this.dummyTextArea.setAttribute("hidden","true");
	this.parentNode.insertBefore(this.dummyTextArea,this.nextSibling);
	this.widget.domNodes.push(this.dummyTextArea);
	// Create dummy popup for reading its styles
	//this._dummyCompletion = new Completion( this.widget, this.dummyTextArea, this._configOptions);
	//REMOVEthis._dummyCompletion.setAttribute("hidden","true");
	
	// Create the iframe
	this.iframeNode = this.widget.document.createElement("iframe");
	this.parentNode.insertBefore(this.iframeNode,this.nextSibling);
	this.iframeDoc = this.iframeNode.contentWindow.document;
	// (Firefox requires us to put some empty content in the iframe)
	this.iframeDoc.open();
	this.iframeDoc.write("");
	this.iframeDoc.close();
	// Style the iframe
	this.iframeNode.className = this.dummyTextArea.className;
	this.iframeNode.style.border = "none";
	this.iframeNode.style.padding = "0";
	this.iframeNode.style.resize = "none";
	this.iframeDoc.body.style.margin = "0";
	this.iframeDoc.body.style.padding = "0";
	this.widget.domNodes.push(this.iframeNode);
	// Construct the textarea or input node
	var tag = this.widget.editTag;
	if($tw.config.htmlUnsafeElements.indexOf(tag) !== -1) {
		tag = "input";
	}
	this.domNode = this.iframeDoc.createElement(tag);
	// Set the text
	if(this.widget.editTag === "textarea") {
		this.domNode.appendChild(this.iframeDoc.createTextNode(this.value));
	} else {
		this.domNode.value = this.value;
	}
	// Set the attributes
	if(this.widget.editType) {
		this.domNode.setAttribute("type",this.widget.editType);
	}
	if(this.widget.editPlaceholder) {
		this.domNode.setAttribute("placeholder",this.widget.editPlaceholder);
	}
	if(this.widget.editSize) {
		this.domNode.setAttribute("size",this.widget.editSize);
	}
	if(this.widget.editRows) {
		this.domNode.setAttribute("rows",this.widget.editRows);
	}
	// Copy the styles from the dummy textarea
	this.copyStyles();
	// Add event listeners
	$tw.utils.addEventListeners(this.domNode,[
		{name: "input",handlerObject: this,handlerMethod: "handleInputEvent"},
		{name: "keydown",handlerObject: this.widget,handlerMethod: "handleKeydownEvent"}
	]);
	// Insert the element into the DOM
	this.iframeDoc.body.appendChild(this.domNode);

	// add Completion popup
    this._completion = new Completion( this.widget, this.domNode, this._configOptions, this.dummyTextArea, this.iframeNode.offsetTop, this.iframeNode.offsetLeft );
	// print iframe offset
	//DEBUG console.log( "  __iframe.offsetLeft: "+this.iframeNode.offsetLeft );
    //DEBUG console.log( "  __iframe.offsetTop: "+this.iframeNode.offsetTop );
    
	// Copy all styles from dummyCompletion
	//$tw.utils.copyStyles(this._dummyCompletion._popNode, this._completion._popNode);
	// Override the ones that should not be set the same as the dummy textarea
	//this._completion._popNode.style.display = "block";
	//this._completion._popNode.style.width = "100%";
	//this._completion._popNode.style.margin = "0";
	// In Chrome setting -webkit-text-fill-color overrides the placeholder text colour
	//this._completion._popNode.style["-webkit-text-fill-color"] = "currentcolor";
     
}

/*
Copy styles from the dummy text area to the textarea in the iframe
*/
FramedCompEngine.prototype.copyStyles = function() {
	// Copy all styles
	$tw.utils.copyStyles(this.dummyTextArea,this.domNode);
	// Override the ones that should not be set the same as the dummy textarea
	this.domNode.style.display = "block";
	this.domNode.style.width = "100%";
	this.domNode.style.margin = "0";
	// In Chrome setting -webkit-text-fill-color overrides the placeholder text colour
	this.domNode.style["-webkit-text-fill-color"] = "currentcolor";
};

/*
Set the text of the engine if it doesn't currently have focus
*/
FramedCompEngine.prototype.setText = function(text,type) {
	if(!this.domNode.isTiddlyWikiFakeDom) {
		if(this.domNode.ownerDocument.activeElement !== this.domNode) {
			this.domNode.value = text;
		}
		// Fix the height if needed
		this.fixHeight();
	}
};

/*
Get the text of the engine
*/
FramedCompEngine.prototype.getText = function() {
	return this.domNode.value;
};

/*
Fix the height of textarea to fit content
*/
FramedCompEngine.prototype.fixHeight = function() {
	// Make sure styles are updated
	this.copyStyles();
	// Adjust height
	if(this.widget.editTag === "textarea") {
		if(this.widget.editAutoHeight) {
			if(this.domNode && !this.domNode.isTiddlyWikiFakeDom) {
				var newHeight = $tw.utils.resizeTextAreaToFit(this.domNode,this.widget.editMinHeight);
				this.iframeNode.style.height = (newHeight + 14) + "px"; // +14 for the border on the textarea
			}
		} else {
			var fixedHeight = parseInt(this.widget.wiki.getTiddlerText(HEIGHT_VALUE_TITLE,"400px"),10);
			fixedHeight = Math.max(fixedHeight,20);
			this.domNode.style.height = fixedHeight + "px";
			this.iframeNode.style.height = (fixedHeight + 14) + "px";
		}
	}
};

/*
Focus the engine node
*/
FramedCompEngine.prototype.focus  = function() {
	if(this.domNode.focus && this.domNode.select) {
		this.domNode.focus();
		this.domNode.select();
	}
};

/*
Handle a dom "input" event which occurs when the text has changed
*/
FramedCompEngine.prototype.handleInputEvent = function(event) {
        //DEBUG console.log( "__framed.js::handleInputEvent");
	this.widget.saveChanges(this.getText());
	this.fixHeight();
	return true;
};

/*
Create a blank structure representing a text operation
*/
FramedCompEngine.prototype.createTextOperation = function() {
	var operation = {
		text: this.domNode.value,
		selStart: this.domNode.selectionStart,
		selEnd: this.domNode.selectionEnd,
		cutStart: null,
		cutEnd: null,
		replacement: null,
		newSelStart: null,
		newSelEnd: null
	};
	operation.selection = operation.text.substring(operation.selStart,operation.selEnd);
	return operation;
};

/*
Execute a text operation
*/
FramedCompEngine.prototype.executeTextOperation = function(operation) {
	// Perform the required changes to the text area and the underlying tiddler
	var newText = operation.text;
	if(operation.replacement !== null) {
		newText = operation.text.substring(0,operation.cutStart) + operation.replacement + operation.text.substring(operation.cutEnd);
		// Attempt to use a execCommand to modify the value of the control
		if(this.iframeDoc.queryCommandSupported("insertText") && this.iframeDoc.queryCommandSupported("delete") && !$tw.browser.isFirefox) {
			this.domNode.focus();
			this.domNode.setSelectionRange(operation.cutStart,operation.cutEnd);
			if(operation.replacement === "") {
				this.iframeDoc.execCommand("delete",false,"");
			} else {
				this.iframeDoc.execCommand("insertText",false,operation.replacement);
			}
		} else {
			this.domNode.value = newText;
		}
		this.domNode.focus();
		this.domNode.setSelectionRange(operation.newSelStart,operation.newSelEnd);
	}
	this.domNode.focus();
	return newText;
};

exports.FramedCompEngine = FramedCompEngine;

})();

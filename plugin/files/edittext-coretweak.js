/*\
title: $:/plugins/snowgoon88/edit-comptext/edittext-coretweak.js
type: application/javascript
module-type: widget-subclass


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var Completion = require("$:/plugins/snowgoon88/edit-comptext/completion.js").Completion;
exports.baseClass = "edit"; 

// Specify a different name to make the subclass available as a new widget instead of overwriting the baseclass:
// exports.name = "edit-comptext";

exports.constructor = function(parseTreeNode,options) {	
	this.initialise(parseTreeNode,options);
};

exports.prototype = {};

exports.prototype.render = function(parent,nextSibling) {
	Object.getPrototypeOf(Object.getPrototypeOf(this)).render.call(this,parent,nextSibling);
	if(this.editorType === "text" || this.editorType === "comptext") {
		var editTextWidget = this.children[0];
		var COMPLETION_OPTIONS = "$:/plugins/snowgoon88/edit-comptext/config";
		editTextWidget._configOptions = $tw.wiki.getTiddlerData( COMPLETION_OPTIONS, {} );
		if(editTextWidget.editShowToolbar) {
			editTextWidget._completion = new Completion( editTextWidget, editTextWidget.engine.domNode, editTextWidget._configOptions, editTextWidget.engine.dummyTextArea, editTextWidget.engine.iframeNode.offsetTop, editTextWidget.engine.iframeNode.offsetLeft);			
		} else {
			editTextWidget._completion = new Completion( editTextWidget, editTextWidget.engine.domNode, editTextWidget._configOptions );	
		}
	}
};

})();

//subclass this as comptext for backwards compat
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
var FramedEngine = require("$:/core/modules/editor/engines/framed.js").FramedEngine;
	
function FramedCompEngine(options) {
	FramedEngine.call(this,options);
	this._configOptions = $tw.wiki.getTiddlerData( COMPLETION_OPTIONS, {} );
	this._completion = new Completion( this.widget, this.domNode, this._configOptions, this.dummyTextArea, this.iframeNode.offsetTop, this.iframeNode.offsetLeft );
};

FramedCompEngine.prototype = Object.create(FramedEngine.prototype);

FramedCompEngine.prototype.constructor = FramedCompEngine;

exports.FramedCompEngine = FramedCompEngine;
$tw.modules.types.library["$:/core/modules/editor/engines/framed.js"].exports.FramedEngine = FramedCompEngine;
})();

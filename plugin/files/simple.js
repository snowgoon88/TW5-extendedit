/*\
title: $:/plugins/snowgoon88/edit-comptext/simple.js
type: application/javascript
module-type: library

Taken from $:/core/modules/editor/engines/simple.js
Text editor engine based on a simple input or textarea tag

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var HEIGHT_VALUE_TITLE = "$:/config/TextEditor/EditorHeight/Height";

// Configuration tiddler
var COMPLETION_OPTIONS = "$:/plugins/snowgoon88/edit-comptext/config";
var Completion = require("$:/plugins/snowgoon88/edit-comptext/completion.js").Completion;
var SimpleEngine = require("$:/core/modules/editor/engines/simple.js").SimpleEngine;
	
function SimpleCompEngine(options) {
	SimpleEngine.call(this,options);
	this._configOptions = $tw.wiki.getTiddlerData( COMPLETION_OPTIONS, {} );
	this._completion = new Completion( this.widget, this.domNode, this._configOptions );
};

SimpleCompEngine.prototype = Object.create(SimpleEngine.prototype);

SimpleCompEngine.prototype.constructor = SimpleCompEngine;


exports.SimpleCompEngine = SimpleCompEngine;
$tw.modules.types.library["$:/core/modules/editor/engines/simple.js"].exports.SimpleEngine = SimpleCompEngine;
})();

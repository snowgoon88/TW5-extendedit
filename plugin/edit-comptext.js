/*\
title: $:/plugins/snowgoon88/edit-comptext/edit-comptext.js
type: application/javascript
module-type: widget

Taken from original Edit-text widget
Version 5.1.13 of TW5
Add link-to-tiddler completion in framed.js and simple.js

TODO : CHECK usefull, and particularly save_changes after every input ??
TODO : where should popupNode be created in the DOM ?
TODO : check that options are valid (numeric ?)
var isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var editTextWidgetFactory = require("$:/core/modules/editor/factory.js").editTextWidgetFactory,
	FramedCompEngine = require("$:/plugins/snowgoon88/edit-comptext/framed.js").FramedCompEngine,
	SimpleCompEngine = require("$:/plugins/snowgoon88/edit-comptext/simple.js").SimpleCompEngine;

exports["edit-comptext"] = editTextWidgetFactory(FramedCompEngine,SimpleCompEngine);

})();

/*\
title: $:/plugins/snowgoon88/edit-comptext/completion.js
type: application/javascript
module-type: library

Try to make self-contained completion module.

DONE : test event handler
TODO : test popup window
\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

//TODO pass widget or (wiki, areaNode) ?
var CompMod = function( wiki, areaNode ) {
    this.wiki = wiki;
    this.areaNode = areaNode;
    var keys=Object.keys( window );
    // for (var i in keys)
    // {
    // 	if (typeof window[keys[i]] != 'function')
    // 	    console.log("__GLOBAL :"+keys[i], window[keys[i]]);
    // }
    console.log("__INIT: $tw=",$tw.utils );
    console.log("__INIT: utils=",$tw.utils );
    console.log("__INIT: addEvent=",$tw.utils.addEventListeners);
    console.log("__INIT: area=",areaNode );

    $tw.utils.addEventListeners( this.areaNode,[
	{name: "keyup", handlerObject: this, handlerMethod: "handleKeyupEvent"}
    ]);
};

// Handling event
CompMod.prototype.handleKeyupEvent = function(event) {
    var curPos = this.areaNode.selectionStart;  // cursor position
    var val = this.areaNode.value;   // text in the area
    // key a
    var key = event.keyCode;
    
    console.log( "__KEYUP ("+key+") hasI="+this._hasInput );
};

exports.CompMod = CompMod;

})();


    


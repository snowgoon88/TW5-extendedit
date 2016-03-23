/*\
title: $:/plugins/snowgoon88/edit-comptext/completion.js
type: application/javascript
module-type: library

Try to make self-contained completion module.

DONE : test event handler
DONE : test popup window
TODO : CHECK if needed
\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/**
 * Create popup element.
 */
var createPopup = function( widget, node ) {
    // Insert a special "div" element for poping up
    // Its 'display' property in 'style' control its visibility
    var popupNode = widget.document.createElement("div");
    popupNode.setAttribute( "style", "display:none; position: absolute;");
    popupNode.className = "tc-block-dropdown ect-block-dropdown";
    // Insert the element into the DOM
    node.parentNode.insertBefore(popupNode,node.nextSibling);
    //CHECK the domNodes is a attribute of Widget [widget.js]
    //CHECK this.domNodes.push(popupNode);
    
    return popupNode;
};

//TODO pass (widget,areaNode) or (wiki, areaNode) ?
// Widget is needed in creating popupNode.
var CompMod = function( editWidget, areaNode ) {
    this.widget = editWidget;
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

    // Listen to the Keyboard
    $tw.utils.addEventListeners( this.areaNode,[
	{name: "keyup", handlerObject: this, handlerMethod: "handleKeyupEvent"}
    ]);
    // Create Popup
    this._popNode = createPopup(this.widget, areaNode );
};

// Handling event
CompMod.prototype.handleKeyupEvent = function(event) {
    var curPos = this.areaNode.selectionStart;  // cursor position
    var val = this.areaNode.value;   // text in the area
    // key a
    var key = event.keyCode;
    
    console.log( "__KEYUP ("+key+") hasI="+this._hasInput );

    // Si key=='p' alors display
    if( key===80 ) {
	this._popNode.style.left = "100px";
	this._popNode.style.top = "30px";
	this._popNode.style.display = 'block';
    }
};

exports.CompMod = CompMod;

})();


    


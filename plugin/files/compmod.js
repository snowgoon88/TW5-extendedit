/*\
title: $:/plugins/snowgoon88/edit-comptext/completion.js
type: application/javascript
module-type: library

Try to make self-contained completion module.

DONE : test event handler
DONE : test popup window
TODO : add _extractPattern -> _regExpEscape as private funtion below.
TODO : CHECK if needed
\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// To compute pixel coordinates of cursor
var getCaretCoordinates = require("$:/plugins/snowgoon88/edit-comptext/cursor-position.js");

/** Default Completion Attributes */
var DEFATT = { maxMatch: 5, minPatLen: 2, caseSensitive: false };

/** 
 * Struct for generic Completion Templates.
 */
var Template = function( pat, filter, start, end ) {
    this.pat = pat;
    this.filter = filter;
    this.start = start;
    this.end = end;
    this.pos = 0;
};

//TODO pass (widget,areaNode) or (wiki, areaNode) ?
/**
 * Widget is needed in creating popupNode.
 * - widget.document
 */
var CompMod = function( editWidget, areaNode, param ) {
    // var keys=Object.keys( window );
    // for (var i in keys)
    // {
    // 	if (typeof window[keys[i]] != 'function')
    // 	    console.log("__GLOBAL :"+keys[i], window[keys[i]]);
    // }
    // console.log("__INIT: $tw=",$tw.utils );
    // console.log("__INIT: utils=",$tw.utils );
    // console.log("__INIT: addEvent=",$tw.utils.addEventListeners);
    // console.log("__INIT: area=",areaNode );

    // About underlying Widget
    this.widget = editWidget;
    this.areaNode = areaNode;
    
    // Completions attributes
    /** How many opened '[' */
    this._nbSquareParen = 0;
    /** State */
    this._state = "VOID";
    this._template = undefined;
    /** Best matches */
    this._bestMatches = [];
    this._idxChoice = -1;
    /** Param */
    // maximum nb of match displayed
    this._maxMatch     = param.configuration.maxMatch || DEFATT.maxMatch;   
    this._minPatLen    = param.configuration.minPatLen || DEFATT.minPatLen;
    this._caseSensitive= param.configuration.caseSensitive || DEFATT.caseSensitive;
    /** Input information */
    this._lastChar = "";
    this._hasInput = false;
    /** List of Completion Templates */
    this._listTemp = [];
    
    // Read templates from Param
    if( param.template ) {
    	var idT;
    	for( idT=0; idT<param.template.length; idT++ ) {
    	    var temp = param.template[idT];
    	    //DEBUG console.log( "__CONF : "+temp.pattern+":"+temp.filter+":"+temp.start+":"+temp.end );
    	    this._listTemp.push( 
    		new Template( temp.pattern,
    			      temp.filter,
    			      temp.start,
    			      temp.end )
    	    );
    	}
    }
    // or defaut template
    else {
    	this._listTemp = [
    	    new Template( "[[", "[all[tiddlers]!is[system]]", "[[", "]]" )
    	];
    }

    // Listen to the Keyboard
    $tw.utils.addEventListeners( this.areaNode,[
    	{name: "keyup", handlerObject: this, handlerMethod: "handleKeyupEvent"}
    ]);
    // Create Popup
    this.popNode = createPopup(this.widget, this.areaNode );

    

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
	this.popNode.style.left = "100px";
	this.popNode.style.top = "30px";
	this.popNode.style.display = 'block';
    }
};

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



exports.CompMod = CompMod;

})();


    


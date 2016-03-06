/**
title: $:/plugins/snowgoon88/edit-comptext/completion.js
type: application/javascript
module-type: widget
*/
/**
 * Completion object as used by edit-comptext TW5 widget.
 * Hope this can nearly constitute a 'stand-alone' completion module.
 *
 * @author Alain Dutech snowgoon88ATgmailDOTcom
 *
 * Two Behavior
 * - detect that 2 '[' are typed : PATTERN
 * - CTRL+SPACE : PATTERN (if any)
 * - ESC returns to VOID
 *
 * In any case, pattern is [[->cursorPos.
 * _state : VOID -> (PATTERN -> (SELECT -> VOID) | VOID)
 */
(function(){

var Completion = function( display, undisplay) {
    /** How many opened '[' */
    this._nbSquareParen = 0;
    /** State */
    this._state = "VOID";
    /** Best matches */
    this._bestMatches = [];
    this._idxChoice = -1;
    /** Options */
    this._maxMatch = 5;   // maximum nb of match displayed
    this._minPatLen = 2;
    this._caseSensitive = false;
    /** Input information */
    this._lastChar = "";
    this._hasInput = false;
    /** Display and Undisplay function */
    this._display = display;
    this._undisplay = undisplay;

    /** 
     * Find the bestMatches among listChoice with given pattern
     */
    this._findBestMatches = function( listChoice, pattern, nbMax) {
	// regexp search pattern, case sensitive
	var flagSearch = this._caseSensitive ? "" : "i" ;
	var regpat = RegExp( this._regExpEscape(pattern), flagSearch );
	var nbMatch = 0;
	// nbMax set to _maxMatch if no value given
	nbMax = nbMax !== undefined ? nbMax : this._maxMatch;

	this._bestMatches= [];
	for( var i=0; i< listChoice.length; i++ ) {
	    //DEBUG console.log( "__FIND: "+listChoice[i]+ " w "+pattern +" ?" );
	    // is the regular expression found
	    if( regpat.test( listChoice[i]) ) {
		if (nbMatch >= nbMax) {
		    this._bestMatches.push( "..." );
		    return;
		} else {
		    this._bestMatches.push( listChoice[i] );
		    nbMatch += 1;
		}
	    }
	}
    };
    /**
     * Extract Pattern from text at a give position.
     *
     * Between previous '[[' and pos
     * 
     * If no pattern -> undefined
     */
    this._extractPattern = function( text, pos ) {
	// Detect previous and next ]]=>STOP or [[=>START
	var pos_prevOpen = text.lastIndexOf( '[[', pos );
	var pos_prevClosed = text.lastIndexOf( ']]', pos );
	var pos_nextClosed = text.indexOf( ']]', pos  );
	// console.log ("__CALC po="+pos_prevOpen+" pc="+pos_prevClosed+" nc="+pos_nextClosed+" pos="+pos);
	pos_nextClosed = (pos_nextClosed >= 0) ? pos_nextClosed : pos;
    
	if( (pos_prevOpen >= 0) &&                 // must be opened
	    ((pos_prevOpen > pos_prevClosed ) ||  // not closed yet
	     (pos_prevClosed === pos))) {          // closed at cursor
	    //console.log("     pat="+text.slice( pos_prevOpen+2, pos) );
	    return { text: text.slice( pos_prevOpen+2, pos ),
		     start: pos_prevOpen,
		     end: pos_nextClosed
		   };
	}
    };
    /**
     * Controls how list items are generated.
     * Function that takes two parameters :
     *  - text : suggestion text
     *  - input : the user’s input
     * Returns : list item. 
     * Generates list items with the user’s input highlighted via <mark>.
     */
    this._itemHTML = function (text, input) {
	// text si input === ''
	// otherwise, build RegExp that is global (g) and case insensitive (i)
	// to replace with <mark>$&</mark> where "$&" is the matched pattern
	var html = input === '' ? text : text.replace(RegExp(this._regExpEscape(input.trim()), "gi"), "<mark>$&</mark>");
	return this._create("li", {
	    innerHTML: html,
	    "patt-selected": "false"
	});
    };
    /**
     * Insert text into a textarea node, enclosing in '[[...]]'
     */
    this._insertInto = function(node, text, posBefore, posAfter ) {
	var val = node.value;
	var newVal = val.slice(0, posBefore) + '[[' + text + ']]' + val.slice(posAfter);
	//console.log ("__INSERT pb="+posBefore+" pa="+posAfter+" txt="+text);
	//console.log( "NEW VAL = "+newVal );
	// WARN : Directly modifie domNode.value.
	// Not sure it does not short-circuit other update methods of the domNode....
	node.value = newVal;
	node.setSelectionRange(posBefore+text.length+4, posBefore+text.length+4 );
    };
    /**
     * Add an '\' in front of -\^$*+?.()|[]{}
     */
    this._regExpEscape = function (s) {
	return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
    };
    /**
     * Add an element in the DOM.
     */
    this._create = function(tag, o) {
	var element = document.createElement(tag);
	
	for (var i in o) {
	    var val = o[i];
	    
	    if (i === "inside") {
		$(val).appendChild(element);
	    }
	    else if (i === "around") {
		var ref = $(val);
		ref.parentNode.insertBefore(element, ref);
		element.appendChild(ref);
	    }
	    else if (i in element) {
		element[i] = val;
	    }
	    else {
		element.setAttribute(i, val);
	    }
	}
	
	return element;
    };
    /**
     * Change Selected Status of Items
     */
    this._next = function (node) {
	var count = node.children.length;
	//DEBUG console.log( "__NEXT: co="+count+" nbMatch="+this._bestMatches.length);
	if( this._bestMatches.length > 0 ) 
	    this._goto( node, this._idxChoice < count - 1 ? this._idxChoice + 1 : -1);
	//DEBUG this._logStatus( "NexT" );
    };
    this._previous = function (node) {
	var count = node.children.length;
	var selected = this._idxChoice > -1;
	//DEBUG console.log( "__PREV: co="+count+" nbMatch="+this._bestMatches.length);
	if( this._bestMatches.length > 0 ) 
	    this._goto( node, selected ? this._idxChoice - 1 : count - 1);
	//DEBUG this._logStatus( "PreV" );
    };
    // Should not be used, highlights specific item without any checks!
    this._goto = function (node, idx) {
	var lis = node.children;
	var selected = this._idxChoice > -1;
	if (selected) {
	    lis[this._idxChoice].setAttribute("patt-selected", "false");
	}

	this._idxChoice = idx;
    
	if (idx > -1 && lis.length > 0) {
	    lis[idx].setAttribute("patt-selected", "true");
	}
    };
    /**
     * Abort pattern and undisplay.
     */
    this._abortPattern = function (displayNode) {
	this._state = "VOID";
	this._nbSquareParen = 0;
	this._bestChoices = [];
	this._idxChoice = -1;
	this._undisplay( null, displayNode );
    };
    // **************************************************************************
    // ******************************************************************eventCbk
    // **************************************************************************
    /**
     * Disable the *effects* of ENTER / UP / DOWN / ESC when needed.
     * Set _hasInput to false.
     */
    this._onKeyDown = function(event) {
	// key 
	var key = event.keyCode;
	this._hasInput = false;

	//DEBUG console.log( "__KEYDOWN ("+key+") hasI="+this._hasInput);
	
	// ENTER while selecting
	if( (this._state === "PATTERN" || this._state === "SELECT") && key === 13 ) {
    	    event.preventDefault();
    	    event.stopPropagation();
	}
	// ESC while selecting
	if( (this._state === "PATTERN" || this._state === "SELECT") && key === 27 ) {
    	    event.preventDefault();
    	    event.stopPropagation();
	}
	// UP/DOWN while a pattern is extracted
	if( (key===38 || key===40) && 
	    (this._state === "PATTERN" || this._state === "SELECT") ) {
	    event.preventDefault();
	}
    };
    /**
     * Means that something has been added/deleted => set _hasInput
     */
    this._onInput = function(event) {
	this._hasInput = true;
	//DEBUG console.log( "__INPUT hasI="+this._hasInput );
    };	
    /**
     * Set _lastChar, detects CTRL+SPACE.
     */
    this._onKeyPress = function(event) {
	// key 
	var key = event.keyCode || event.which;
	
	this._lastChar = String.fromCharCode(key);
	//DEBUG console.log( "__KEYPRESS ("+key+") hasI="+this._hasInput+" char="+this._lastChar );
    
	// Détecter Ctrl+Space
	if( key === 32 && event.ctrlKey && this._state === "VOID" ) {
	    this._state = "PATTERN";
	}
    };
    /**
     * ESC -> abort; 
     * Detect [ -> VOID switch to _state=PATTERN
     * PATTERN || SELECT : ENTER -> insertText
     *                     UP/DOWN -> previous/next
     *                     pattern.length > _minPatternLength -> display  
     */
    this._onKeyUp = function(event, listOptions, areaNode, displayNode ) {
	var curPos = areaNode.selectionStart;  // cursor position
	var val = areaNode.value;   // text in the area
	// key 
	var key = event.keyCode;
    
	//DEBUG console.log( "__KEYUP ("+key+") hasI="+this._hasInput );

	// ESC
	if( key === 27 ) {
	    this._abortPattern( displayNode );
	    //DEBUG this._logStatus( "" );
	}
	// add char '['
	if( this._hasInput && this._state === "VOID" && this._lastChar === '[') {
	    //console.log( "VOID and [");
	    this._nbSquareParen += 1;
	    if (this._nbSquareParen === 2 ) {
		//console.log( "state switch to PATTERN" );
		this._state = "PATTERN";
		//DEBUG this._logStatus( "" );
	    }
	}
	// a pattern
	else if( this._state === "PATTERN" || this._state === "SELECT" ) {
	    // Pattern below cursor : undefined if no pattern
	    var pattern = this._extractPattern( val, curPos );
	    if( key === 13 ) { // ENTER
		// console.log( "KEY : Enter" );
    		// Choice made in the displayNode ?
    		var selected = this._idxChoice > -1 && this._idxChoice !== this._maxMatch;
    		// console.log( "   > sel="+selected+" len="+this._bestChoices.length );
    		if( selected ) {
    		    //console.log( "   > selected" );
    		    this._insertInto( areaNode, this._bestMatches[this._idxChoice], pattern.start, curPos );
    		}
    		else if( this._bestMatches.length === 1 ) {
    		    //console.log( "   > only one" );
    		    this._insertInto( areaNode, this._bestMatches[0], pattern.start, curPos );
    		}
		this._abortPattern( displayNode );
		//DEBUG this._logStatus( "" );
    	    }
	    else if( key === 38 && this._hasInput === false) { // up
		this._state = "SELECT";
    		event.preventDefault();
    		this._previous( displayNode );
		//DEBUG this._logStatus( pattern.text );
    		//event.stopPropagation();
    	    }
    	    else if( key === 40 && this._hasInput === false) { // down
		this._state = "SELECT";
    		event.preventDefault();
    		this._next( displayNode );
		//DEBUG this._logStatus( pattern.text );
    		//event.stopPropagation();
    	    }
    	    else if( pattern ) { // pattern changed by keypressed
		//var pattern = calcPattern( val, curPos );
		this._idxChoice = -1;
    		// log
		//DEBUG this._logStatus( pattern.text );
    		// Popup with choices if pattern at least two letters long
		if( pattern.text.length > (this._minPatLen-1) ) {
    		    this._findBestMatches( listOptions, pattern.text );
    		    displayNode.innerHTML = "";
    		    //console.log( "BC "+ this._pattern + " => " + choice );
    		    if (this._bestMatches.length > 0) {
			for( var i=0; i<this._bestMatches.length; i++) {
    			    displayNode.appendChild( 
				this._itemHTML(this._bestMatches[i], 
					       pattern.text));
    			}
			this._display( areaNode, displayNode );			
    		    }
		    else { // no matches
			this._state = "PATTERN";
			this._undisplay( areaNode, displayNode );
		    }
		}
    	    }
	    else { // no pattern detected
		this._abortPattern( displayNode );
	    }
	}
    };
    /**
     * Used for debug
     */
    this._logStatus = function(msg) {
	console.log( "__STATUS: "+this._state+":-"+msg+"- idx="+this._idxChoice );
    };
};

exports.Completion = Completion;

})();

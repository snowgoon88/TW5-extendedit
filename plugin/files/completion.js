/*\
title: $:/plugins/snowgoon88/edit-comptext/completion.js
type: application/javascript
module-type: library

Try to make self-contained completion module.

To use this 'module', you need a `widget` with a kind of `editarea` node.
I do not know the exacte prerequisites of this editarea node for the module to
work, but mostly one should be able to attach the following `eventHandler` to
it:
 - input
 - keydown
 - keypress
 - keyup
The `widget` is needed because I use:
 - widget.document
 - widget.wiki.filterTiddlers(...)

From the Widget, once you have a proper editarea, you just have to call
 - var completion = new Completion( theWidget, theEditAreaNode, configObject);
where `configObject` is expected to have the following fields. if a field is missing, a default value will be given.
One can have many `elements' in the template array.

{
  "configuration": {
      "caseSensitive" : false,
      "maxMatch" : 8,
      "minPatLength" : 2,
      "triggerKeyCombination" : "^ "
  },
  "template": [{
      "pattern": "[[",
      "filter": "[all[tiddlers]!is[system]]",
      "start": "[[",
      "end": "]]"
      }
  ]
}

TODO : CHECK if needed
\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// To compute pixel coordinates of cursor
var getCaretCoordinates = require("$:/plugins/snowgoon88/edit-comptext/cursor-position.js");

/** Default Completion Attributes */
var DEFATT = { maxMatch: 5, minPatLength: 2, caseSensitive: false, triggerKeyCombination: "^ " };

/** 
 * Struct for generic Completion Templates.
 * <ul>
 * <li>pat : pattern searched for.</li>
 * <li>filter : filter operation used to find the list of completion options</li>
 * <li>mask: replaced by "" when presenting completion options</li>
 * </ul>
 */
    var Template = function( pat, filter, mask, field, start, end, startOffset  ) {
    this.pat = pat;
        this.filter = filter;
    this.mask = "^"+regExpEscape(mask);
    this.field = field;
    this.start = start;
    this.end = end;
        this.pos = 0;
        this.startOffset  = startOffset;
};
/**
 * Struct for storing completion options, as we need to memorise 
 * the titles of the tiddlers when masked and when body must be displayed.
 */
var OptCompletion = function( title, str ) {
    this.title = title;
    this.str = str;
};

var keyMatchGenerator = function(combination) {
	let singleMatchGenerator = function(character) {
		if (character === '^') {
			return event => event.ctrlKey;
		}
		else if (character === '+') {
			return event => event.shiftKey;
		}
		else if (character === '!') {
			return event => event.altKey;
		}
		else {
			return event => (event.keyCode || event.which) === character.charCodeAt(0);
		}
	};

	let matchers = [];
	for (let i = 0; i < combination.length; i++) {
		matchers.push(singleMatchGenerator(combination[i]));
	}

	return event => {
		for (let i = 0; i < matchers.length; i++) {
			if (!matchers[i](event)) {
				return false;
			}
		}
		return true;
	};
};

/**
 * Widget is needed in creating popupNode.
 * - widget.document
 * - widget.wiki.filterTiddlers(...)
 * - sibling : where to create the popup in the DOM.
 */
	var Completion = function( editWidget, areaNode, param, sibling, offTop, offLeft ) {
	console.log( "==Completion::creation" );

	//check if the widget uses the framed engine
	if(typeof sibling !== 'undefined') {
		//The framed engine propagates all keydown events to the parent document
		//Disable this and only propagate keydown events not handled by the autocompletion in our handleKeydown method
		editWidget._original_handleKeydownEvent = editWidget.handleKeydownEvent;
		editWidget.handleKeydownEvent = function(event) {
			return false;
		};
	}

    // About underlying Widget
    this._widget = editWidget;
	this._areaNode = areaNode;
	this._sibling  = (typeof sibling !== 'undefined') ?  sibling : this._areaNode;
	this._offTop = (typeof offTop !== 'undefined') ?  offTop : 0;
	this._offLeft = (typeof offLeft !== 'undefined') ?  offLeft : 0;	
		
    // Completions attributes
    /** State */
    this._state = "VOID";
    this._template = undefined;
    /** Best matches */
    this._bestMatches = []; // An array of OptCompletion
    this._idxChoice = -1;
    /** Param */
            // maximum nb of match displayed
            //DEBUG console.log( "__PARAM" );
            //DEBUG console.log( param.configuration );
    this._maxMatch     = param.configuration.maxMatch || DEFATT.maxMatch;   
            // Beware that a (0 || 2) gives 2 !, so change way attributs are checked.
            this._minPatLength = DEFATT.minPatLength;
            if ('minPatLength' in param.configuration) {
                this._minPatLength = param.configuration.minPatLength;
            }
    this._caseSensitive= param.configuration.caseSensitive || DEFATT.caseSensitive;
    this._triggerKeyMatcher = keyMatchGenerator(param.configuration.triggerKeyCombination || DEFATT.triggerKeyCombination);
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
	    // field 'body' ou 'title' (default)
	    if( temp.body ) {		
    		this._listTemp.push( 
    		    new Template( temp.pattern, temp.body,
				  temp.mask ? temp.mask : "",
				  "body",
    				  temp.start, temp.end,
                                temp.startOffset)
    		);
	    }
	    else {
    		this._listTemp.push( 
    		    new Template( temp.pattern, 
				  temp.title ? temp.title : temp.filter,
				  temp.mask ? temp.mask : "",
				  "title",
    				  temp.start, temp.end,
                                temp.startOffset )
    		);
	    }
	    //DEBUG temp = this._listTemp[this._listTemp.length-1];
	    //DEBUG console.log( "__CONF : "+temp.pattern+":"+temp.filter+":"+temp.mask+":"+temp.field+":"+temp.start+":"+temp.end );
    	}
    }
    // or defaut template
    else {
    	this._listTemp = [
    	    new Template( "[[", "[all[tiddlers]!is[system]]", 
			  "", "title",
			  "[[", "]]" )
    	];
    }
    // Create Popup
	//this._popNode = createPopup(this._widget, this._areaNode );
	this._popNode = createPopup(this._widget, this._sibling );	
    
    // Listen to the Keyboard
    $tw.utils.addEventListeners( this._areaNode,[
	{name: "input", handlerObject: this, handlerMethod: "handleInput"},
	{name: "keydown", handlerObject: this, handlerMethod: "handleKeydown"},
	{name: "keypress", handlerObject: this, handlerMethod: "handleKeypress"},
    	{name: "keyup", handlerObject: this, handlerMethod: "handleKeyup"}
    ]);
   
    /** 
     * Find the bestMatches among listChoice with given pattern
     * @param listChoice : array of String
     * @change : this._bestMatches => array of OptCompletion
     */
    this._findBestMatches = function( listChoice, pattern, nbMax) {
	// regexp search pattern, case sensitive
	var flagSearch = this._caseSensitive ? "" : "i" ;
	var regpat = RegExp( regExpEscape(pattern), flagSearch );
	var regpat_start = RegExp( "^"+regExpEscape(pattern), flagSearch );
	var regMask = RegExp( this._template.mask ? this._template.mask : "","");
	var nbMatch = 0;
	// nbMax set to _maxMatch if no value given
	nbMax = nbMax !== undefined ? nbMax : this._maxMatch;

	//DEBUG console.log( "__FIND masked="+regMask+" regPat="+regpat);

	this._bestMatches= [];
	var otherMatches = [];
	// We test every possible choice
	for( var i=0; i< listChoice.length; i++ ) {
	    // apply mask over potential choice
	    var maskedChoice = listChoice[i].replace( regMask, "");
	    // Test first if pattern is found at START of the maskedChoice
	    // THEN added to BestMatches
 	    if( regpat_start.test( maskedChoice )) {
		if (nbMatch >= nbMax) {
		    this._bestMatches.push( new OptCompletion("","...") );
		    return;
		} else {
		    this._bestMatches.push( new OptCompletion(listChoice[i],maskedChoice) );
		    nbMatch += 1;
		}
	    }
	    // then if pattern is found WITHIN the maskedChoice
	    // added AFTER the choices that starts with pattern
	    else if( regpat.test( maskedChoice ) ) {
		if (nbMatch >= nbMax) {
		    // add all otherMatches to _bestMatches
		    this._bestMatches.push( new OptCompletion("","<hr>") ) ; //separator
		    this._bestMatches = this._bestMatches.concat( otherMatches );
		    this._bestMatches.push( new OptCompletion("","...") );
		    return;
		} else {
		    otherMatches.push( new OptCompletion(listChoice[i],maskedChoice) );
		    nbMatch += 1;
		}
	    }
	}
	// Here, must add the otherMatches
	this._bestMatches.push( new OptCompletion("","<hr>") ) ; //separator
	this._bestMatches = this._bestMatches.concat( otherMatches );
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
	this._bestChoices = [];
	this._idxChoice = -1;
	this._undisplay( displayNode );
	this._template = undefined;
    };
    /**
     * Display popupNode at the cursor position in areaNode.
     */
    this._display = function( areaNode, popupNode ) {
	if ( popupNode.style.display == 'none' ) {
	    // Must get coordinate
	    // Cursor coordinates within area + area coordinates + scroll
            var coord = getCaretCoordinates(areaNode, areaNode.selectionEnd);
            var styleSize = getComputedStyle(areaNode).getPropertyValue('font-size');
            var fontSize = parseFloat(styleSize); 
		
	    popupNode.style.left = (this._offLeft+areaNode.offsetLeft-areaNode.scrollLeft+coord.left) + 'px';
	    popupNode.style.top = (this._offTop+areaNode.offsetTop-areaNode.scrollTop+coord.top+fontSize*2) + 'px';
	    popupNode.style.display = 'block';
	}
    };
    /**
     * Undisplay someNode
     */
    this._undisplay = function( displayNode ) {
	if ( displayNode.style.display != 'none' ) {
	    displayNode.style.display = 'none';
	}
    };

     /**
     * Used for debug
     */
    this._logStatus = function(msg) {
	console.log( "__STATUS: "+this._state+":-"+msg+"- idx="+this._idxChoice );
    };

};
// **************************************************************************
// ******************************************************************eventCbk
// **************************************************************************
/**
 * Disable the *effects* of ENTER / UP / DOWN / ESC when needed.
 * Set _hasInput to false.
 */
Completion.prototype.handleKeydown = function(event) {
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
    else if( (this._state === "PATTERN" || this._state === "SELECT") && key === 27 ) {
    	event.preventDefault();
    	event.stopPropagation();
    }
    // UP/DOWN while a pattern is extracted
    else if( (key===38 || key===40) && 
	(this._state === "PATTERN" || this._state === "SELECT") ) {
		event.preventDefault();
    } else {
		//If we have not handled the keydown event, allow the widget to propagate it to the parent document
		if(this._widget._original_handleKeydownEvent) {
			this._widget._original_handleKeydownEvent(event);
		}
	}
};
/**
 * Means that something has been added/deleted => set _hasInput
 */
Completion.prototype.handleInput = function(event) {
    this._hasInput = true;
    //DEBUG console.log( "__INPUT hasI="+this._hasInput );
};
	
/**
 * Set _lastChar, detects CTRL+SPACE.
 */
Completion.prototype.handleKeypress = function(event) {
    var curPos = this._areaNode.selectionStart;  // cursor position
    var val = this._areaNode.value;   // text in the area
    // key 
    var key = event.keyCode || event.which;
	
    this._lastChar = String.fromCharCode(key);
    //DEBUG console.log( "__KEYPRESS ("+key+") hasI="+this._hasInput+" char="+this._lastChar );
    //DEBUG this._logStatus( "KEYPRESS" );
    
    // Detect Ctrl+Space
    if( this._triggerKeyMatcher(event) && this._state === "VOID" ) {
	//Find a proper Template
	// first from which we can extract a pattern
	if( this._template === undefined ) {
	    //DEBUG console.log("__SPACE : find a Template" );
	    var idT, res;
	    for( idT=0; idT < this._listTemp.length; idT++ ) {
		res = extractPattern( val, curPos, this._listTemp[idT] );
		//DEBUG console.log("  t="+this._listTemp[idT].pat+" res="+res);
		// res is not undefined => good template candidate
		if( res ) {
		    this._template = this._listTemp[idT];
		    this._state = "PATTERN";
		    break;
		}
	    }
	}
	else {
	    //DEBUG console.log("__SPACE : already a template" );
	    this._state = "PATTERN";
	}
    }
};
/**
 * ESC -> abort; 
 * Detect [ -> VOID switch to _state=PATTERN
 * PATTERN || SELECT : ENTER -> insertText
 *                     UP/DOWN -> previous/next
 *                     pattern.length > _minPatternLength -> display  
 */
Completion.prototype.handleKeyup = function(event) {
    var curPos = this._areaNode.selectionStart;  // cursor position
    var val = this._areaNode.value;   // text in the area
    // key a
    var key = event.keyCode;
    
    //DEBUG console.log( "__KEYUP ("+key+") hasI="+this._hasInput );

  // ESC
    if( key === 27 ) {
	this._abortPattern( this._popNode );
	//DEBUG this._logStatus( "" );
    }
    // Check for every template
    if( this._hasInput && this._state === "VOID" ) {
	// check every template's pattern
	var idT, template;
	for( idT=0; idT < this._listTemp.length; idT++ ) {
	    template = this._listTemp[idT];
	    if( this._lastChar === template.pat[template.pos] ) {
		template.pos += 1;
		//DEBUG console.log( "__CHECK : pat="+template.pat+" pos="+template.pos );
		// Pattern totaly matched ?
		if( template.pos === template.pat.length ) {
		    //DEBUG console.log( "__CHECK => found "+template.pat );
		    this._state = "PATTERN";
		    this._template = template;
		    
		    break; // get out of loop
		}
	    }
	    else {
		template.pos = 0;
		//DEBUG console.log( "__CHECK : pat="+template.pat+" pos="+template.pos );
	    }
	}
    }
    // a pattern
    else if( this._state === "PATTERN" || this._state === "SELECT" ) {
	// Pattern below cursor : undefined if no pattern
	var pattern = extractPattern( val, curPos, this._template );
	if( key === 13 ) { // ENTER
	    //DEBUG console.log( "KEY : Enter" );
    	    // Choice made in the displayNode ?
    	    var selected = this._idxChoice > -1 && this._idxChoice !== this._maxMatch;
    	    //DEBUG console.log( "   > sel="+selected+" len="+this._bestChoices.length );
    	    if( selected ) {
    		//DEBUG console.log( "   > selected" );
		var temp = this._bestMatches[this._idxChoice];
	      var str = temp.str;
              // if str is "<hr>" or "...", abort
              if (str === "<hr>" || str === "...") {
                this._abortPattern( this._popNode );
                this._areaNode.focus();
                return;
              }
		if( this._template.field === "body" ) {
		    str = $tw.wiki.getTiddlerText( temp.title );
		}
    		insertInto( this._areaNode,
			    str,
			    pattern.start, curPos, this._template );
		// save this new content
		this._widget.saveChanges( this._areaNode.value );
	    }
	    // otherwise take the first choice (if exists)
	    else if( this._bestMatches.length > 0 ) {
    		//DEBUG console.log( "   > take first one" );
		var temp = this._bestMatches[0];
	      var str = temp.str;
              // if str is "<hr>" or "...", abort
              if (str === "<hr>" || str === "...") {
                this._abortPattern( this._popNode );
                this._areaNode.focus();
                return;
              }
		if( this._template.field === "body" ) {
		    str = $tw.wiki.getTiddlerText( temp.title );
		}
    		insertInto( this._areaNode,
			    str,
			    pattern.start, curPos, this._template );
		// save this new content
		this._widget.saveChanges( this._areaNode.value );
	    }
	    this._abortPattern( this._popNode );
		//DEBUG this._logStatus( "" );
    	    }
	    else if( key === 38 && this._hasInput === false) { // up
		this._state = "SELECT";
    		event.preventDefault();
    		this._previous( this._popNode );
		//DEBUG this._logStatus( pattern.text );
    		//event.stopPropagation();
    	    }
    	    else if( key === 40 && this._hasInput === false) { // down
		this._state = "SELECT";
    		event.preventDefault();
    		this._next( this._popNode );
		//DEBUG this._logStatus( pattern.text );
    		//event.stopPropagation();
    	    }
    	    else if( pattern ) { // pattern changed by keypressed
		this._idxChoice = -1;
    		// log
                //DEBUG console.log( "  PATTERN changed" );
		//DEBUG this._logStatus( pattern.text );
                //DEBUG console.log( "  pat.length",pattern.text.length, " min",this._minPatLength);
    		// Popup with choices if pattern at least minPatLength letters long
		if( pattern.text.length > (this._minPatLength-1) ) {
                    //DEBUG console.log( "  should compute" );
		    // compute listOptions from templateFilter
		    var allOptions;
		    if( this._template )
			allOptions = this._widget.wiki.filterTiddlers( this._template.filter );
		    else
			allOptions = this._widget.wiki.filterTiddlers("[all[tiddlers]]");
		    this._findBestMatches( allOptions, pattern.text );
    		    this._popNode.innerHTML = "";
    		    //console.log( "BC "+ this._pattern + " => " + choice );
    		    if (this._bestMatches.length > 0) {
		      for( var i=0; i<this._bestMatches.length; i++) {
                        let li_elem = itemHTML(this._bestMatches[i].str,
					       pattern.text);
                        // pass this as comp to eventHandler
                        li_elem.addEventListener( "click",
                                                  function( idx, event) {
                                                    //DEBUG console.log( "__ITEM Listener", this, idx, event );
                                                    this.handleItemClik( idx );
                                                  }.bind(this,i));
                        li_elem.addEventListener( "touchstart",
                                                  function( idx, event) {
                                                    //comp is the completion object, passed using 'bind' 
                                                    this.handleItemClik( idx );
                                                  }.bind(this,i));
                        li_elem.addEventListener( "mouseover",
                                                  function( idx, event) {
                                                    this._goto( this._popNode,
                                                                idx );
                                                  }.bind(this,i));
                        
                        // li_elem.addEventListener( "click",
                        //                           this.handleItemClick );
    			this._popNode.appendChild( li_elem );
    		      }
		      this._display( this._areaNode, this._popNode );			
    		    }
		    else { // no matches
			this._state = "PATTERN";
			this._undisplay( this._popNode );
		    }
		}
    	    }
	    else { // no pattern detected
		this._abortPattern( this._popNode );
	    }
	}
	// to ensure that one MUST add an input (through onInput())
	this._hasInput = false;
};
// not real event handler as awaits the index of the clicked/touched bestChoice
Completion.prototype.handleItemClik = function( idx_select) {
  
  var curPos = this._areaNode.selectionStart;  // cursor position
  var val = this._areaNode.value;   // text in the area
  var pattern = extractPattern( val, curPos, this._template );
  
  //DEBUG console.log( "__handleItemClik idx="+idx_select, this );
  
  // insert choice into document
  var temp = this._bestMatches[idx_select];
  var str = temp.str;

  // if str is "<hr>" or "...", abort
  if (str === "<hr>" || str === "...") {
    this._abortPattern( this._popNode );
    this._areaNode.focus();
    return;
  }
  
  if( this._template.field === "body" ) {
    str = $tw.wiki.getTiddlerText( temp.title );
  }
  insertInto( this._areaNode,
	      str,
	      pattern.start, curPos, this._template );
  // save this new content
  this._widget.saveChanges( this._areaNode.value );
  this._abortPattern( this._popNode );
  this._areaNode.focus();
  //DEBUG this._logStatus( "" );
}
// **************************************************************************
// ******************************************************** private functions
// **************************************************************************
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
/**
 * Extract Pattern from text at a given position.
 *
 * Between previous template.pat (or '[[') and pos
 * 
 * If no pattern -> undefined
 */
var extractPattern = function( text, pos, template ) {
    // Detect previous and next ]]=>STOP or [[=>START
    var sPat = template.pat ? template.pat : '[[';
    var pos_prevOpen = text.lastIndexOf( sPat, pos );
    var ePat = template.end ? template.end : ']]';
    var pos_prevClosed = text.lastIndexOf( ePat, pos );
    var pos_nextClosed = text.indexOf( ePat, pos  );
    //DEBUG console.log("__CALC st="+sPat+" -> en="+ePat );
    //DEBUG console.log("__CALC po="+pos_prevOpen+" pc="+pos_prevClosed+" nc="+pos_nextClosed+" pos="+pos);
    pos_nextClosed = (pos_nextClosed >= 0) ? pos_nextClosed : pos;
    
    if( (pos_prevOpen >= 0) &&                 // must be opened
	((pos_prevOpen > pos_prevClosed ) ||  // not closed yet
	 (pos_prevClosed === pos))) {          // closed at cursor
	//DEBUG console.log("     pat="+text.slice( pos_prevOpen+sPat.length, pos) );
	return { text: text.slice( pos_prevOpen+sPat.length, pos ),
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
  var itemHTML = function (text, input) {
    // text si input === ''
    // otherwise, build RegExp that is global (g) and case insensitive (i)
    // to replace with <mark>$&</mark> where "$&" is the matched pattern
  var html = input === '' ? text : text.replace(RegExp(regExpEscape(input.trim()), "gi"), "<mark>$&</mark>");
  // the DOM element created
  var elem = create("li", {
    innerHTML: html,
    "patt-selected": "false",
  });
  return elem; 
};
/**
 * Insert text into a textarea node, 
 * enclosing in 'template.start..template.end'
 *
 * - posBefore : where the 'template.pat+pattern' starts
 * - posAfter : where the cursor currently is
 */
var insertInto = function(node, text, posBefore, posAfter, template ) {
    //DEBUG console.log( "__INSERT : "+template.pattern+":"+template.filter+":"+template.mask+":"+template.field+":"+template.start+":"+template.end );
    var val = node.value;
    var sStart = template.start !== undefined ? template.start : '[[';
    var sEnd = template.end !== undefined ? template.end : ']]';
    var newVal = val.slice(0, posBefore) + sStart + text + sEnd + val.slice(posAfter);
    //console.log("__INSERT s="+sStart+" e="+sEnd);
    //console.log ("__INSERT pb="+posBefore+" pa="+posAfter+" txt="+text);
    //console.log( "NEW VAL = "+newVal );
    // WARN : Directly modifie domNode.value.
    // Not sure it does not short-circuit other update methods of the domNode....
    // i.e. could use widget.updateEditor(newVal) from edit-comptext widget.
    //      but how to be sure that cursor is well positionned ?
    node.value = newVal;

    // if startOffset in Template, set cursor at beginning of inserted value,
    // with an Offset (usefull for aliasing links)
    if (template.startOffset) {
        let cursorPos = posBefore+template.startOffset;
        node.setSelectionRange( cursorPos, cursorPos );
    }
    else {
        node.setSelectionRange(posBefore+text.length+sStart.length+sEnd.length, posBefore+text.length+sStart.length+sEnd.length );
    }
};
/**
 * Add an '\' in front of -\^$*+?.()|[]{}
 */
var regExpEscape = function (s) {
    return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
};
/**
 * Add an element in the DOM.
 */
var create = function(tag, o) {
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


exports.Completion = Completion;

})();

    

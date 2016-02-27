/*
 * Gros emprunts a awesomplete.js
 * from @author Lea Verou http://leaverou.github.io/awesomplete
 *
 * @author snowgoon88ATgmailDOTcom
 *
 * Two Behavior
 * - detect that 2 '[' are typed : PATTERN
 * - CTRL+SPACE : PATTERN (if any)
 *
 * In any case, pattern is [[->cursorPos.
 *
 * keyDOWN and INPUT are repeatable, act on keyDOWN
 * keyUP is only once
 * keyPressed can get the Char entred (BEWARE arrow_down ~~ '(' )
 * INPUT : val changed, i.e: add or del character
 * Keys = 17:Ctrl, 32:Space, 53:'5([', 225:AltGr
 *
 * _state : VOID -> (PATTERN -> (SELECT -> VOID) | VOID)
 */

var listeLiens = ['myLink', 'myLore', 'myTruc', 'myOne', 'myTwo', 'myThree', 'myOther', 'other'];
var _nbSquareParen = 0;
var _pattern = "";
var _state = "VOID";
var _bestChoices = [];
var _idxChoice = -1;
var _maxChoice = 4;
var _lastChar = "";
var _hasInput = false;

// var _regexpNode = document.getElementById('regexp');
var _regexpStr = "";


/*
Inner function : find the best matches
*/
var bestChoiceStart = function( pattern, nbMax) {
    //TW5 var allTidTitles = $tw.wiki.getTiddlers(); /*wiki.js*/
    var allTidTitles = listeLiens; /*sandbox*/
    var bestStr = "";
    var nbBest = 0;
    // nbMax set to 2 if no value given
    nbMax = nbMax !== undefined ? nbMax : _maxChoice;
    _maxChoice = nbMax;
    
    this._bestChoices = [];
    for( var i=0; i<allTidTitles.length; i++ ) {
	//console.log( "SW "+choices[i]+ " w "+pattern +" ?" );
	if ( allTidTitles[i].startsWith( pattern ) ) {
	    //console.log( "SW => YES");
	    if (nbBest == nbMax) {
		bestStr += "...";
		this._bestChoices.push( "..." );
		return bestStr;
	    } else {
		bestStr += allTidTitles[i] + "<br />";
		this._bestChoices.push( allTidTitles[i] );
		nbBest += 1;
	    }
        }
    }
    return bestStr;
};
var bestChoice = function( pattern, nbMax) {
    //TW5 var allTidTitles = $tw.wiki.getTiddlers(); /*wiki.js*/
    var allTidTitles = listeLiens; /*sandbox*/
    // regexp search pattern, case sensitive
   //TW5  var regpat = RegExp( $tw.utils.escapeRegExp(pattern) );
     var regpat = RegExp( regExpEscape(pattern) );
    var nbBest = 0;
   // nbMax set to 2 if no value given
    nbMax = nbMax !== undefined ? nbMax : 5;

    this._bestChoices = [];
    for( var i=0; i<allTidTitles.length; i++ ) {
	//console.log( "SW "+allTidTitles[i]+ " w "+pattern +" ?" );
	//regexg if ( allTidTitles[i].startsWith( pattern ) ) {
	if( regpat.test(allTidTitles[i]) ) {
	    //console.log( "SW => YES");
	    if (nbBest == nbMax) {
		this._bestChoices.push( "..." );
		return;
	    } else {
		this._bestChoices.push( allTidTitles[i] );
		nbBest += 1;
	    }
	}
    }
};
/**
 * Inner function : compute pattern.
 *
 * Between previous '[[' and pos
 * 
 * If no pattern -> undefined
 */
var calcPattern = function( text, pos ) {
    // Remonter pour détecter les ]]=>STOP ou les [[=>START
    // Descendre pour détecter les [[=>STOP ou les ]]=>STOP
    var pos_prevOpen = text.lastIndexOf( '[[', pos );
    var pos_prevClosed = text.lastIndexOf( ']]', pos );
    var pos_nextClosed = text.indexOf( ']]', pos  );
    console.log ("__CALC po="+pos_prevOpen+" pc="+pos_prevClosed+" nc="+pos_nextClosed+" pos="+pos);
    pos_nextClosed = (pos_nextClosed >= 0) ? pos_nextClosed : pos;
    
    if( (pos_prevOpen >= 0) &&                 // must be opened
	((pos_prevOpen > pos_prevClosed ) ||  // not closed yet
	 (pos_prevClosed == pos))) {          // closed at cursor
	console.log("     pat="+text.slice( pos_prevOpen+2, pos) );
	return { text: text.slice( pos_prevOpen+2, pos ),
		 start: pos_prevOpen,
		 end: pos_nextClosed
	       };
    };
};
var abortPattern = function () {
    this._state = "VOID";
    this._nbSquareParen = 0;
    this._bestChoices = [];
    this._idxChoice = -1;
};

/*
 * Add an '\' in front of -\^$*+?.()|[]{}
*/
var regExpEscape = function (s) {
	return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
};

/*
 * Controls how list items are generated.
 * Function that takes two parameters :
 *  - text : suggestion text
 *  - input : the user’s input
 * Returns : list item. 
 * Generates list items with the user’s input highlighted via <mark>.
*/
var itemHTML = function (text, input) {
    // text si input === ''
    // sinon construit une RegExp qui est globale (g) et case insensitive (i)
    // pour remplacer par <mark>$&</mark> où "$&" est le pattern matched
    var html = input === '' ? text : text.replace(RegExp(regExpEscape(input.trim()), "gi"), "<mark>$&</mark>");
    return create("li", {
	innerHTML: html,
	"patt-selected": "false"
    });
};
/**
 * Insert into the textarea.
*/
var insertInto = function(node, text, posBefore, posAfter ) {
    // var lenPattern = this._pattern.length;
    var val = node.value;
    var newVal = val.slice(0, posBefore) + '[[' + text + ']]' + val.slice(posAfter);
    console.log ("__INSERT pb="+posBefore+" pa="+posAfter+" txt="+text);
    console.log( "NEW VAL = "+newVal );
    // WARN : Directly modifie domNode.value.
    // Not sure it does not short-circuit other update methods of the domNode....
    node.value = newVal;
    node.setSelectionRange(posBefore+text.length+4, posBefore+text.length+4 );
};
/*
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

/*
 * Change Selected Status
 */
var next = function (node) {
    var count = node.children.length;
    if( this._bestChoices.length > 0 ) 
	this.goto( node, this._idxChoice < count - 1 ? this._idxChoice + 1 : -1);
};
var previous = function (node) {
    var count = node.children.length;
    var selected = this._idxChoice > -1;
    if( this._bestChoices.length > 0 ) 
	this.goto( node, selected ? this._idxChoice - 1 : count - 1);
};
// Should not be used, highlights specific item without any checks!
var goto = function (node, idx) {
    var lis = node.children;
    var selected = this._idxChoice > -1;
    if (selected) {
	lis[this._idxChoice].setAttribute("patt-selected", "false");
    }

    this._idxChoice = idx;
    
    if (idx > -1 && lis.length > 0) {
	lis[idx].setAttribute("patt-selected", "true");
	//this.status.textContent = lis[i].textContent;
    }
};

// Quand on commence par '[[' passe en PATTERN et affiche le nb de choix 
// possibles.
// @todo : prendre en compte BACK et modif de pattern
/*
Handle a dom "input" event
*/
function handleInputEvent(event) {
    // The area for editing text
    //TW5 var domNode = this.domNodes[0];
    var domNode = document.getElementById('entree'); /*sandbox*/
    // The popup window 
    //TW5 var popupNode = this.domNodes[1]; // ugly
    var popupNode = document.getElementById('l_choice');; /*sandbox*/
    var curPos = domNode.selectionStart;
    var val = domNode.value;
    //var cChar = val[curPos];
    var pChar = val[curPos-1];
    var key = event.keyCode;
    console.log( "__INPUT ("+key+") "+ curPos + " => " + pChar+ "|" + this._state );
    
    var pattern = calcPattern( val, curPos );
    if( pattern ) {
	log( 'pattern.text', pattern );
	log( 'regexp', regExpEscape(pattern));
    } 
    else {
	log( 'pattern', "VOID" );
	log( 'regexp', "" );
    }

    // '['
    if (this._state == "VOID" && pChar == '[') {
	//console.log( "VOID and [");
	this._nbSquareParen += 1;
	if (this._nbSquareParen == 2 ) {
	    //console.log( "state switch to PATTERN" );
	    this._state = "PATTERN";
	    this._pattern = "";
	    log( 'pattern', "[[" );
	    log( 'regexp', regExpEscape(this._pattern));
	}
    }
    else if (this._state == "PATTERN") {
	// ENTER
	if (pChar == '\n' ) {
	    event.preventDefault();
	    event.stopPropagation();
	//     console.log( "ENTER pressed" );
	//     if (this._bestChoices.length == 1) {
	// 	//console.log( "INSERT");
	// 	insertInto( domNode, this._bestChoices[0], curPos );
	// 	// var lenPattern = this._pattern.length;
	// 	// var newVal = val.slice(0,curPos-1) + this._bestChoices[0].slice(lenPattern) + ']]' + val.slice(curPos);
        //         // // console.log( "NEW VAL = "+newVal );
        //         // // WARN : Directly modifie domNode.value.
        //         // // Not sure it does not short-circuit other update methods of the domNode....
	// 	// domNode.value = newVal;
        //       	// domNode.setSelectionRange(curPos+this._bestChoices[0].length-lenPattern+1,curPos+this._bestChoices[0].length-lenPattern+1);
	//     }
	//     // remove ENTER and INSERT le reste de _bestChoice[0]
	//     else {
	// 	//console.log( "ABORT" );
		
	// 	// var newVal = val.slice(0,curPos-1) + val.slice(curPos);
	// 	// // WARN : Directly modifie domNode.value.
	// 	// // Not sure it does not short-circuit other update methods of the domNode....
	// 	// domNode.value = newVal;
	// 	// domNode.setSelectionRange(curPos-1,curPos-1);
	//     }
	//     //console.log( "state switch to VOID" );
	//     this._nbSquareParen = 0;
	//     this._state = "VOID";
	//     this._pattern = "";
	//     //TW5 this.popupHide( popupNode ); 
	//     log( 'pattern', "VOID" );
	//     log( 'regexp', regExpEscape(this._pattern));
	}
	// Building the PATTERN
	else {
	//if( pChar != '\n' ) {
	    this._pattern += pChar;
	    log( 'pattern', "[["+this._pattern );
	    log( 'regexp', regExpEscape(this._pattern));
	    //console.log( "state PATTERN pat=" + this._pattern );
	    
	    var choice = this.bestChoice( this._pattern );
	    popupNode.innerHTML = "";
	    //console.log( "BC "+ this._pattern + " => " + choice );
	    if (this._bestChoices.length > 0) {
		this._bestChoices.forEach( function(text) {
		    popupNode.appendChild( itemHTML(text, this._pattern));
		});
	    }
	    // if (choice != "" ) {
	    // 	popupNode.innerHTML = choice;

	    // 	// Cursor coordinates within area + area coordinates + scroll		
            //     //TW5var coordinates = getCaretCoordinates(domNode, domNode.selectionEnd);
            //     var styleSize = getComputedStyle(domNode).getPropertyValue('font-size');
            //     var fontSize = parseFloat(styleSize); 
		
	    // 	//TW5 this.popupShow( popupNode,  [domNode.offsetLeft-domNode.scrollLeft+coordinates.left, domNode.offsetTop-domNode.scrollTop+coordinates.top+fontSize*2]);
	    // } else {
	    // 	//TW5 this.popupHide( popupNode );
	    // }
	}
    } 
    // Default
    else {
	//console.log( "state switch to VOID" );
	this._nbSquareParen = 0;
	this._state = "VOID";
	this._pattern = "";
	log( 'pattern', "VOID" );
	log( 'regexp', regExpEscape(this._pattern));
	//TW5 this.popupHide( popupNode );
	// remove ENTER
    }          
    
    //TW5 this.saveChanges(this.domNodes[0].value);
    //TW5 this.fixHeight();
    return true;
};
// @todo : quand state="PATTERN", ENTER valide si nbChoice = 1 sinon arrete.
function keyCbk(event, elem) {
    var key = event.keyCode;
    var curPos = elem.selectionStart;
    var val = elem.value;
    var cChar = val[curPos];
    var pChar = val[curPos-1];
    
    //console.log( _state + " UP ("+key+") "+ curPos + " => " + pChar+ "|" + cChar );

    // 38:UP; 37:Left, 39:Right, 40:DOWN
    // 35:Home, 36:End
    // 8:BACKSPACE, 45:INSERT, 46:SUPPR
    if (_state == "PATTERN")
	if (key == 38 || key == 37 || key == 39 || key == 40 || key == 35 || key == 36 || key == 8 || key== 45 || key == 46) {
	    console.log( "ABORT" );
	    _nbSquareParen = 0;
	    _state = "VOID";
	    _pattern = "";
	    var _popup = document.getElementById('id_popup');
	    popupHide( _popup );
	    event.stopPropagation();
	}
};

// function clickCbk(event, elem) {
//     var ta = document.getElementById('id_sandbox');

//     console.log( "start=" + ta.selectionStart + " " + elem.selectionStart);
//     console.log( "end  =" + ta.selectionEnd );
    
//     var _popup = document.getElementById('id_popup');
//     var positionner = new maxkir.CursorPosition(elem, 3);
//     var posPx = positionner.getPixelCoordinates();
//     var posCu = positionner.getCursorCoordinates();
//     var offset = elem.cumulativeOffset();
//     console.log( "SHOW " + posPx + " -- " + posCu);
//     popupShow( _popup, [offset.left+posPx[0], offset.top+posPx[1]] );
    
// }

/** Handle keydown Event
 * Catch ARROW, HOME, END, BACKSPACE, INSERT, SUPPR.
 */
function handleKeydownEvent(event) {
    //TW5 var domNode = this.domNodes[0];
    var domNode = document.getElementById('entree'); /*sandbox*/
    // The popup window 
    //TW5 var popupNode = this.domNodes[1]; // ugly
    var popupNode = document.getElementById('l_choice');; /*sandbox*/
    var key = event.keyCode;
    var curPos = domNode.selectionStart;
    var val = domNode.value;
    var pChar = val[curPos-1];

    //console.log( "__KEYDOWN ("+key+") "+ curPos + " => " + pChar+ "|" + this._state );

    var pattern = calcPattern( val, curPos );
    if( pattern ) {
	log( 'pattern', pattern.text );
	log( 'regexp', regExpEscape(pattern));
    } 
    else {
	log( 'pattern', "VOID" );
	log( 'regexp', "" );
    }

     if (this._state == "PATTERN") {
	 if( key == 38 || key == 40 ) {
	     event.preventDefault();
	 }
     }
};
//******************************************************************************
//******************************************************************************
//******************************************************************************
//******************************************************************************
/** 
 * Handle Keyup Event
*/
function onKeyUp(event) {
    // TextareaNode
    var areaNode = document.getElementById('entree'); /*sandbox*/
    var curPos = areaNode.selectionStart;  // cursor position
    var val = areaNode.value;   // text in the area
    // PopupNode
    var popupNode = document.getElementById('l_choice');; /*sandbox*/
    // key 
    var key = event.keyCode;
    var pChar = val[curPos-1];
    
    console.log( "__KEYUP ("+key+") "+ curPos + "'" +pChar+"'" );

    // // Pattern below cursor : undefined if no pattern
    // var pattern = calcPattern( val, curPos );
    
    // ESC
    if( key == 27 ) {
	abortPattern();
	logStatus( "" );
    }
    // add char '['
    if( this._hasInput && this._state == "VOID" && this._lastChar == '[') {
	//console.log( "VOID and [");
	this._nbSquareParen += 1;
	if (this._nbSquareParen == 2 ) {
	    //console.log( "state switch to PATTERN" );
	    this._state = "PATTERN";
	    logStatus( "" );
	}
    }
    // a pattern
    else if( this._state == "PATTERN" || this._state == "SELECT" ) {
	// Pattern below cursor : undefined if no pattern
	var pattern = calcPattern( val, curPos );
	if( key == 13 ) { // ENTER
	    // console.log( "KEY : Enter" );
	    // 	    event.preventDefault();
	    // 	    event.stopPropagation();
    	    // Un choix ?
    	    var selected = this._idxChoice > -1 && this._idxChoice != this._maxChoice;
    	    console.log( "   > sel="+selected+" len="+this._bestChoices.length );
    	    if( selected ) {
    		console.log( "   > selected" );
    		insertInto( areaNode, this._bestChoices[this._idxChoice], pattern.start, curPos );
    	    }
    	    else if( this._bestChoices.length == 1 ) {
    		console.log( "   > only one" );
    		insertInto( areaNode, this._bestChoices[0], pattern.start, curPos );
    	    }
	    abortPattern();
	    logStatus( "" );
    	}
	else if( key == 38 && !this._hasInput) { // up
	    this._state = "SELECT";
    	    event.preventDefault();
    	    previous( popupNode );
	    logStatus( pattern.text );
    	    //event.stopPropagation();
    	}
    	else if( key == 40 && !this._hasInput) { // down
	    this._state = "SELECT";
    	    event.preventDefault();
    	    next( popupNode );
	    logStatus( pattern.text );
    	    //event.stopPropagation();
    	}
    	else { // pattern changed by keypressed
	    //var pattern = calcPattern( val, curPos );
	    this._idxChoice = -1;
    	    // log
	    logStatus( pattern.text );
    	    // Popup with choices if pattern at least two letters long
	    if( pattern.text.length > 1 ) {
    		var choice = this.bestChoice( pattern.text );
    		popupNode.innerHTML = "";
    		//console.log( "BC "+ this._pattern + " => " + choice );
    		if (this._bestChoices.length > 0) {
    		    //this._state = "PATTERN";
    		    this._bestChoices.forEach( function(text) {
    			popupNode.appendChild( itemHTML(text, pattern.text));
    		    });
    		}
	    }
    	}
    }


    // // A pattern ?
    // if( pattern && pattern.text.length > 0 ) {
    // 	if( key == 38 ) {      // up
    // 	    event.preventDefault();
    // 	    previous( popupNode );
    // 	    log( 'pattern', pattern.text );
    // 	    log( 'regexp', regExpEscape(pattern.text));
    // 	    //event.stopPropagation();
    // 	}
    // 	else if( key == 40 ) { // down
    // 	    event.preventDefault();
    // 	    next( popupNode );
    // 	    log( 'pattern', pattern.text );
    // 	    log( 'regexp', regExpEscape(pattern.text));
    // 	    //event.stopPropagation();
    // 	}
    // 	else if( key == 13 ) { // ENTER
    // 	    // console.log( "KEY : Enter" );
    // 	    event.preventDefault();
    // 	    event.stopPropagation();
    // 	    // Un choix ?
    // 	    var selected = this._idxChoice > -1 && this._idxChoice != this._maxChoice;
    // 	    console.log( "   > sel="+selected+" len="+this._bestChoices.length );
    // 	    if( selected ) {
    // 		console.log( "   > selected" );
    // 		insertInto( areaNode, this._bestChoices[this._idxChoice], pattern.start, pattern.end );
    // 	    }
    // 	    else if( this._bestChoices.length == 1 ) {
    // 		console.log( "   > only one" );
    // 		insertInto( areaNode, this._bestChoices[0], pattern.start, pattern.end );
    // 	    }
    // 	    this._bestChoices = [];
    // 	    this._idxChoice = -1;
    // 	    //TW5 this.popupHide( popupNode ); 
    // 	    log( 'pattern', "" );
    // 	    log( 'regexp', "" );
    // 	}
    // 	else {
    // 	    // log
    // 	    log( 'pattern', pattern.text );
    // 	    log( 'regexp', regExpEscape(pattern.text));
    // 	    // Popup with choices
    // 	    var choice = this.bestChoice( pattern.text );
    // 	    popupNode.innerHTML = "";
    // 	    //console.log( "BC "+ this._pattern + " => " + choice );
    // 	    if (this._bestChoices.length > 0) {
    // 		this._state = "SELECTION";
    // 		this._bestChoices.forEach( function(text) {
    // 		    popupNode.appendChild( itemHTML(text, pattern.text));
    // 		});
    // 	    }
    // 	}
    // }
    // else { // no pattern
    // 	// log
    // 	log( 'pattern', "" );
    // 	log( 'regexp', "" );
    // 	// Clear List
    // 	this._state = "VOID";
    // 	popupNode.innerHTML = "";
    // 	this._bestChoices = [];
    // }
};
//******************************************************************************
//******************************************************************************
function onKeyDown(event) {
    // TextareaNode
    var areaNode = document.getElementById('entree'); /*sandbox*/ /*debug*/
    var curPos = areaNode.selectionStart;  // cursor position /*debug*/
    var val = areaNode.value;   // text in the area /*debug*/
    // key 
    var key = event.keyCode;
    var pChar = val[curPos-1]; /*debug*/
    
    console.log( "__DOWN ("+key+") "+ curPos + "'" +pChar+"'" );

    // ENTER while selecting
    if( (this._state == "PATTERN" || this._state == "SELECT") && key == 13 ) {
    	event.preventDefault();
    	event.stopPropagation();
    }
    if( (key==38 || key==40) && 
	(this._state == "PATTERN" || this._state == "SELECT") ) {
	event.preventDefault();
     }
};
//******************************************************************************
//******************************************************************************
function onInput(event) {
    // TextareaNode
    var areaNode = document.getElementById('entree'); /*sandbox*/
    var curPos = areaNode.selectionStart;  // cursor position
    var val = areaNode.value;   // text in the area
    // key 
    var key = event.keyCode || event.which;
    var pChar = val[curPos-1];
    var letter = String.fromCharCode(key);
    
    this._hasInput = true;

    console.log( "__INPUT ("+key+") "+ curPos + "'" +pChar+"' l="+letter );
};
function onKeyPress(event) {
    // TextareaNode
    var areaNode = document.getElementById('entree'); /*sandbox*/
    var curPos = areaNode.selectionStart;  // cursor position
    var val = areaNode.value;   // text in the area
    // key 
    var key = event.keyCode || event.which;
    var pChar = val[curPos-1];
    
    this._lastChar = String.fromCharCode(key);
    this._hasInput = false;
    
    console.log( "__PRESS ("+key+") "+ curPos + "'" +pChar+"' l="+this._lastChar );

    // Détecter Ctrl+Space
    if( key == 32 && event.ctrlKey && this._state == "VOID" ) {
	this._state = "PATTERN";
    }
};
/** Handle keyup Event
 * Catch ARROW, HOME, END, BACKSPACE, INSERT, SUPPR.
 */
function handleKeyupEvent(event) {
    //TW5 var domNode = this.domNodes[0];
    var domNode = document.getElementById('entree'); /*sandbox*/
    // The popup window 
    //TW5 var popupNode = this.domNodes[1]; // ugly
    var popupNode = document.getElementById('l_choice');; /*sandbox*/
    var key = event.keyCode;
    var curPos = domNode.selectionStart;
    var val = domNode.value;
    var pChar = val[curPos-1];
  
  //console.log( "****** handleKeyupEvent" );
  console.log( "__KEYUP ("+key+") "+ curPos + " => " + pChar+ "|" + this._state );
              
 	// 38:UP; 37:Left, 39:Right, 40:DOWN
    // 35:Home, 36:End
    // 8:BACKSPACE, 45:INSERT, 46:SUPPR
    if (this._state == "PATTERN") {
	if( key == 38 ) {      // up
	    event.preventDefault();
	    previous( popupNode );
	    log( 'pattern', "[["+this._pattern );
	    log( 'regexp', regExpEscape(this._pattern));
	    //event.stopPropagation();
	}
	else if( key == 40 ) { // down
	    event.preventDefault();
	    next( popupNode );
	    log( 'pattern', "[["+this._pattern );
	    log( 'regexp', regExpEscape(this._pattern));
	    //event.stopPropagation();
	}
	else if( key == 13 ) { // ENTER
	    console.log( "KEY : Enter" );
	    event.preventDefault();
	    event.stopPropagation();
	    // Un choix ?
	    var selected = this._idxChoice > -1 && this._idxChoice != this._maxChoice;
	    console.log( "   > sel="+selected+" len="+this._bestChoices.length );
	    if( selected ) {
		console.log( "   > selected" );
		insertInto( domNode, this._bestChoices[this._idxChoice], curPos );
	    }
	    else if( this._bestChoices.length == 1 ) {
		console.log( "   > only one" );
		insertInto( domNode, this._bestChoices[0], curPos );
	    }
	    this._nbSquareParen = 0;
	    this._state = "VOID";
	    this._pattern = "";
	    this._bestChoices = [];
	    this._idxChoice = -1;
	    //TW5 this.popupHide( popupNode ); 
	    log( 'pattern', "VOID" );
	    log( 'regexp', regExpEscape(this._pattern));
	}
	// ESC
	else if (key == 27 ) {
	    this._nbSquareParen = 0;
	    this._state = "VOID";
	    this._pattern = "";
	    this._bestChoices = [];
	    this._idxChoice = -1;
	    log( 'pattern', "VOID" );
	    log( 'regexp', regExpEscape(this._pattern));
	    //TW5 this.popupHide( popupNode );
	    //event.stopPropagation(); // needed ???
	}
	// else if (key == 37 || key == 39 || key == 35 || key == 36 || key == 8 || key== 45 || key == 46) {
	//     //console.log( "ABORT" );
	//     this._nbSquareParen = 0;
	//     this._state = "VOID";
	//     this._pattern = "";
	//     //TW5 this.popupHide( popupNode );
	//     //event.stopPropagation(); // needed ???
	// }
        
    }
};


/*
 * LogWrite into Regexp
 */
function logStatus( msg ) {
    log( 'pattern', this._state+":-"+msg+"- idx="+this._idxChoice );
};
function log( where, msg ) {
    var node = document.getElementById( where );
    node.innerHTML = msg;
};
function addRegexp( msg ) {
    _regexpStr += msg;
    _regexpNode.innerHTML = _regexpNode;
};
function clearRegexp() {
    _regexpStr = "";
    _regexpNode.innerHTML = _regexpNode;
};
    

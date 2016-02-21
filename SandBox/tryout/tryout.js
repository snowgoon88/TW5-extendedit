/*
 * Gros emprunts a awesomplete.js
 * from @author Lea Verou http://leaverou.github.io/awesomplete
 *
 * @author snowgoon88ATgmailDOTcom
 */

var listeLiens = ['myLink', 'myLore', 'myTruc', 'myOne', 'myTwo', 'myThree', 'myOther', 'other'];
var _nbSquareParen = 0;
var _pattern = "";
var _state = "VOID";
var _bestChoices = [];
var _idxChoice = -1;
var _maxChoice = 4;

// var _regexpNode = document.getElementById('regexp');
var _regexpStr = "";


/*
Inner function : find the best matches
*/
var bestChoice = function( pattern, nbMax) {
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
var insertInto = function(node, text, pos ) {
    var lenPattern = this._pattern.length;
    var val = node.value;
    var newVal = val.slice(0,pos-1) + text.slice(lenPattern) + ']]' + val.slice(pos);
    // console.log( "NEW VAL = "+newVal );
    // WARN : Directly modifie domNode.value.
    // Not sure it does not short-circuit other update methods of the domNode....
    node.value = newVal;
    node.setSelectionRange(pos+text.length-lenPattern+1,pos+text.length-lenPattern+1);
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

    console.log( "__KEYUP ("+key+") "+ curPos + " => " + pChar+ "|" + this._state );

     if (this._state == "PATTERN") {
	 if( key == 38 || key == 40 ) {
	     event.preventDefault();
	 }
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
	    //event.stopPropagation();
	}
	else if( key == 40 ) { // down
	    event.preventDefault();
	    next( popupNode );
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
	else if (key == 37 || key == 39 || key == 35 || key == 36 || key == 8 || key== 45 || key == 46) {
	    //console.log( "ABORT" );
	    this._nbSquareParen = 0;
	    this._state = "VOID";
	    this._pattern = "";
	    //TW5 this.popupHide( popupNode );
	    //event.stopPropagation(); // needed ???
	}             
    }
};


/*
 * LogWrite into Regexp
 */
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
    

//https://github.com/component/textarea-caret-position
//https://github.com/kir/js_cursor_position

var listeLiens = ['myLink', 'myLore', 'myTruc', 'other'];
var _nbSquareParen = 0;
var _pattern = "";
var _state = "VOID";
var _bestChoices = [];


function popupShow( popup, position) {
    if ( popup.style.display == 'none' ) {
	popup.style.left = position[0] + 'px';
	popup.style.top = position[1] + 'px';
	popup.style.display = 'block';
    }
};
function popupHide( popup ) {
    if ( popup.style.display != 'none' ) {
	popup.style.display = 'none';
    }
};

function matchingStartLength( pat, str ) {
    console.log( "ML : " + pat + " vs " + str );
    if (pat.length > str.length) {
	return -1;
    }
    for( var i=0; i< pat.length; i++ ) {
	if (pat[i] != str[i] ) {
	    return i;
	}
    }
    return pat.length;
};

function bestChoice( pattern, choices, nbMax=2) {
    console.log( "Best choices in " + choices + " with " + pattern);
    var bestStr = "";
    var nbBest = 0;
    // var bestValue = 0;
    
    _bestChoices = [];
    for( var i=0; i<choices.length; i++ ) {
	//console.log( "SW "+choices[i]+ " w "+pattern +" ?" );
	if ( choices[i].startsWith( pattern ) ) {
	    //console.log( "SW => YES");
	    if (nbBest == nbMax) {
		bestStr += "...";
		_bestChoices.push( "..." );
		return bestStr;
	    } else {
		bestStr += choices[i] + "<br />";
		_bestChoices.push( choices[i] );
		nbBest += 1;
	    }
	}
    }
    return bestStr;
};

function eventLogCbk(event, elem) {
    var data = event.data;
    var val = elem.value;
    var curPos = elem.selectionStart;
    var cChar = val[curPos];
    var pChar = val[curPos-1];
    var positionner = new maxkir.CursorPosition(elem, 0);
    var offset = elem.cumulativeOffset();
    var pos = positionner.getPixelCoordinates();
    

    console.log( "INPUT pos=" + curPos + " => " + pChar + " pos=" +offset.left+pos[0] + ", " + offset.top+pos[1] );
    console.log( "      charcode="+event.charCode + " keyCode=" + event.keyCode );
    // for(var key in event) {
    // 	var value = event[key];
    // 	console.log( "      " + key +"="+value );
    // }
}

// Quand on commence par '[[' passe en PATTERN et affiche le nb de choix 
// possibles.
// @todo : prendre en compte BACK et modif de pattern
function inputCbk(event, elem) {
    var val = elem.value;
    var curPos = elem.selectionStart;
    var pChar = val[curPos-1];
    var _popup = document.getElementById('id_popup');
    var positionner = new maxkir.CursorPosition(elem, 3);

    console.log( "INPUT> " + _state + " ("+ curPos + ") =>" + pChar+ "<|");
    // var valBR = val.replace(/\n/g, "CF");
    // console.log( "CR>>"+valBR );

    if (pChar == '\n') console.log( "CF" );
    if (pChar == '\r') console.log( "CR" );

    // '['
    if (_state == "VOID" && pChar == '[') {
	console.log( "VOID and [");
	_nbSquareParen += 1;
	if (_nbSquareParen == 2 ) {
	    console.log( "state switch to PATTERN" );
	    _state = "PATTERN";
	    _pattern = "";
	}
    }
    else if (_state == "PATTERN") {
	// ENTER
	if (pChar == '\n' ) {
	    console.log( "ENTER pressed" );
	    if (_bestChoices.length == 1) {
		console.log( "INSERT");
		var lenPattern = _pattern.length;
		var newVal = val.slice(0,curPos-1) + _bestChoices[0].slice(lenPattern) + ']]' + val.slice(curPos);
		elem.value = newVal;
                elem.setSelectionRange(curPos+_bestChoices[0].length-lenPattern+1,curPos+_bestChoices[0].length-lenPattern+1);
	    }
		// remove ENTER and INSERT le reste de _bestChoice[0]
	    else {
		console.log( "ABORT" );
		var newVal = val.slice(0,curPos-1) + val.slice(curPos);
		elem.value = newVal;
		elem.setSelectionRange(curPos-1,curPos-1);
	    }
	    console.log( "state switch to VOID" );
	    _nbSquareParen = 0;
	    _state = "VOID";
	    _pattern = "";
	    popupHide( _popup );
	}
	// Construction du PATTERN
	else {
	    _pattern += pChar;
	    console.log( "state PATTERN pat=" + _pattern );
	    
	    var choice = bestChoice( _pattern, listeLiens );
	    console.log( "BC "+ _pattern + " => " + choice );
	    if (choice != "" ) {
		_popup.innerHTML = choice;

		var pos = positionner.getPixelCoordinates();
		var offset = elem.cumulativeOffset();
		console.log( "POPUP "+pos );
		
		popupShow( _popup,  [offset.left+pos[0], offset.top+pos[1]]);
	    } else {
		popupHide( _popup );
	    }
	}
    } 
    // Default
    else {
	console.log( "state switch to VOID" );
	_nbSquareParen = 0;
	_state = "VOID";
	_pattern = "";
	popupHide( _popup );
	// remove ENTER
    }
}

// @todo : quand state="PATTERN", ENTER valide si nbChoice = 1 sinon arrete.
function keyCbk(event, elem) {
    var key = event.keyCode;
    var curPos = elem.selectionStart;
    var val = elem.value;
    var cChar = val[curPos];
    var pChar = val[curPos-1];
    
    console.log( _state + " UP ("+key+") "+ curPos + " => " + pChar+ "|" + cChar );

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

function clickCbk(event, elem) {
    var ta = document.getElementById('id_sandbox');

    console.log( "start=" + ta.selectionStart + " " + elem.selectionStart);
    console.log( "end  =" + ta.selectionEnd );
    
    var _popup = document.getElementById('id_popup');
    var positionner = new maxkir.CursorPosition(elem, 3);
    var posPx = positionner.getPixelCoordinates();
    var posCu = positionner.getCursorCoordinates();
    var offset = elem.cumulativeOffset();
    console.log( "SHOW " + posPx + " -- " + posCu);
    popupShow( _popup, [offset.left+posPx[0], offset.top+posPx[1]] );
    
}

function listDom () {
    // where to write
    var viewText = document.getElementById('id_viewText');

    // Find all elements
    var all = document.getElementsByTagName("*");
    console.log( "all->"+all.length );
    
    var htmlText = "this:"+getInfo( this ) + "<br/>";
    for (var i=0, max=all.length; i < max; i++) {
	//  Do something with the element here
	console.log ( i+" -> "+ all[i].name );
	htmlText = htmlText + i +":" + getInfo( all[i] ) + "<br/>";
    }
    console.log( htmlText );

    // Write
    viewText.innerHTML = htmlText;
}

function getInfo(elem) {
    // id -> name (nodeName)
    // nodeName is HTML, BODY, DIV, etc
    info = elem.id + " ->" + elem.name + " (" + elem.nodeName + ")";
    return info;
}

 

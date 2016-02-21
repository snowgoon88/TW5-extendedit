/*\
title: $:_snowgoon88/widget/learn.js
type: application/javascript
module-type: widget

Un module pour test. Ecrit l'attribut 'log' comme un texte.

```
<$learn log="...."/>
```

\*/
(function(){

/** SNOW ; je sais pas à quoi servent les 3 lignes suivantes */ 
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var LearnNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
LearnNodeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
LearnNodeWidget.prototype.render = function(parent,nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    this.log = this.getAttribute("log", "default_log");
    var textNode = this.document.createTextNode(this.log);
    parent.insertBefore(textNode,nextSibling);

    // essai d'afficher tous les titres
    var allTidTiles = $tw.wiki.allTitles();
    for( var index=0; index<allTidTitles.length; index++ ) {
	textNode = this.document.createTextNode( allTitles[i]+" - " );
	parent.insertBefore(textNode,nextSibling);
    }

    this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
LearnNodeWidget.prototype.execute = function() {
    // Nothing to do for a text node
    // Make the child widgets
    this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
LearnNodeWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(changedAttributes.log) {
	this.refreshSelf();
	return true;
    } else {
	return false;	
    }
};

exports.learn = LearnNodeWidget;

})();

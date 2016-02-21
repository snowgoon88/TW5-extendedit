/*\
title: $:/core/modules/widgets/selectWidget.js
type: application/javascript
module-type: widget

Implements the <$select widget - to render a <select> dom element containing an <option> dom element
for each item in an option list. The option list is generated from a filter expression, or a list 
tiddler, or a plain text tiddler. The current selection is stored in a widget variable accessible 
by the child widgets or via template insertion to the any enclosed text and/or child widgets.

```
<$select filter="...." list="...." tiddler="...." name="...."/>
```

Alain : sauf que cela ne marche pas dans mon TW 1.5.9 !!!!!

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SelectWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

SelectWidget.prototype = new Widget();

SelectWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.create(parent,nextSibling);
	this.domNodes.push(domNode);
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
};

SelectWidget.prototype.execute = function() {
	// get attributes
	this.filter = this.getAttribute("filter");
	this.list = this.getAttribute("list");
	this.tiddler = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.selectClass = this.getAttribute("class");
	this.setName = this.getAttribute("name","currentTiddler");
	// make child widgets 
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
SelectWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.filter || changedAttributes.list || changedAttributes.tiddler) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

SelectWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

SelectWidget.prototype.create = function() {
	// create a <div> container for the <select>
	var domNode = $tw.utils.domMaker("div",{class:this.selectClass});
	// create the <select> element
	var select = this.document.createElement("select");
	select.className = this.selectClass;
	// get the list of select options
	var optionList = this.getOptionList();
	// fetch the current selection, defaulting to the first option in the option list
	var selection = this.getVariable(this.setName);
	if(!selection)this.setVariable(this.setName,optionList[0],this.parseTreeNode.params);
	// create and add the <option> elements
	for (var i=0; i < optionList.length; i++) {
		var option = this.document.createElement("option");
		if(selection && selection === optionList[i]) {
			option.setAttribute("selected","true");
		}
		option.appendChild(this.document.createTextNode(optionList[i]));
		select.appendChild(option);
	}
	// add a selection handler
	$tw.utils.addEventListeners(select,[
		{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}
	]);
	// insert the <select> into the enclosing domNode
	domNode.appendChild(select);
	return domNode;
};

SelectWidget.prototype.getOptionList = function() {
	var optionList = [];
	if(this.filter) {
		// process the filter into an array of tiddler titles
		var defaultFilter = "[!is[system]sort[title]]";
		optionList = this.wiki.filterTiddlers(this.getAttribute("filter",defaultFilter),this.getVariable("currentTiddler"));
	} else if(this.list) {
		// parse the given list into an array
		optionList = $tw.utils.parseStringArray(this.list);
	} else {
		// process either the given, or the current tiddler as a list tiddler
		optionList = this.wiki.getTiddlerList(this.tiddler,[]);
		if(optionList.length === 0){
			// process the tiddler text as a list
			optionList = this.wiki.getTiddlerText(this.tiddler).split("\n");
		}
	}
	return optionList ? optionList : [];
};

SelectWidget.prototype.handleChangeEvent = function(event) {
	// set the widget variable to inform the children
	this.setVariable(this.setName,event.target.value,this.parseTreeNode.params);
	// refresh this widget, and thereby the child widgets AND the enclosed content of this widget 
	this.refreshSelf();
	return true;
};

exports.select = SelectWidget;

})();

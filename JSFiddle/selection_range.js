if (!window.maxkir) maxkir = {};

/**
 * Get current selection range for the TEXTAREA or INPUT[text] element.
 *
 * Usage:
 *
 *  var range = new maxkir.SelectionRange(textarea);
 *  var selection = range.get_selection_range()
 *  var selectionStart = selection[0]
 *  var selectionEnd   = selection[1]
 *  On a error, returns [0,0]
 *
 *  var selection_text = range.get_selection_text();
 *
 *
 * */
maxkir.SelectionRange = function(element) {
  this.element = element;
};


maxkir.SelectionRange.prototype.get_selection_range = function() {

  var get_sel_range = function(element) {
    // thanks to http://the-stickman.com/web-development/javascript/finding-selection-cursor-position-in-a-textarea-in-internet-explorer/
    if( (typeof element.selectionStart == 'undefined') && document.selection ){
      // The current selection
      var range = document.selection.createRange();
      // We'll use this as a 'dummy'
      var stored_range = range.duplicate();
      // Select all text
      if (element.type == 'text') {
        stored_range.moveStart('character', -element.value.length);
        stored_range.moveEnd('character', element.value.length);
      } else { // textarea
        stored_range.moveToElementText( element );
      }
      // Now move 'dummy' end point to end point of original range
      stored_range.setEndPoint( 'EndToEnd', range );
      // Now we can calculate start and end points
      var selectionStart = stored_range.text.length - range.text.length;
      var selectionEnd = selectionStart + range.text.length;
      return [selectionStart, selectionEnd];
    }
    return [element.selectionStart, element.selectionEnd];
  };

  try {
    return get_sel_range(this.element);
  }
  catch(e) {
    return [0,0]
  }
};

maxkir.SelectionRange.prototype.get_selection_text = function() {
  var r = this.get_selection_range();
  return this.element.value.substring(r[0], r[1]);
};

if (!window.maxkir) maxkir = {};
maxkir.FF = /Firefox/i.test(navigator.userAgent);

// Unify access to computed styles (for IE)
if (typeof document.defaultView == 'undefined') {
  document.defaultView = {};
  document.defaultView.getComputedStyle = function(element){
    return element.currentStyle;
  }
}

// This class allows to obtain position of cursor in the text area
// The position can be calculated as cursorX/cursorY or
// pointX/pointY
// See getCursorCoordinates and getPixelCoordinates
maxkir.CursorPosition = function(element, padding) {
  this.element = element;
  this.padding = padding;
  this.selection_range = new maxkir.SelectionRange(element);

  var that = this;

  this.get_string_metrics = function(s) {
    return maxkir.CursorPosition.getTextMetrics(element, s, padding);
  };

  var splitter = new maxkir.StringSplitter(function(s) {
    var metrics = that.get_string_metrics(s);
    //maxkir.info(s + " |||" + metrics)
    return metrics[0];
  });

  this.split_to_lines = function() {
    var innerAreaWidth = element.scrollWidth;
    if (maxkir.FF) {  // FF has some implicit additional padding
      innerAreaWidth -= 4;
    }

    var pos = that.selection_range.get_selection_range()[0];
    return splitter.splitString(element.value.substr(0, pos), innerAreaWidth);
  };

};

maxkir.CursorPosition.prototype.getCursorCoordinates = function() {
  var lines = this.split_to_lines();
  return [lines[lines.length - 1].length, lines.length];
};

maxkir.CursorPosition.prototype.getPixelCoordinates = function() {
  var lines = this.split_to_lines();
  var m = this.get_string_metrics(lines[lines.length - 1]);
  var w = m[0];
  var h = m[1] * lines.length - this.element.scrollTop + this.padding;
  return [w, h];
};

/** Return preferred [width, height] of the text as if it was written inside styledElement (textarea)
 * @param styledElement element to copy styles from
 * @s text for metrics calculation
 * @padding - explicit additional padding
 * */
maxkir.CursorPosition.getTextMetrics = function(styledElement, s, padding) {

  var element = styledElement;
  var clone_css_style = function(target, styleName) {
    var val = element.style[styleName];
    if (!val) {
      var css = document.defaultView.getComputedStyle(element, null);
      val = css ? css[styleName] : null;
    }
    if (val) {
      target.style[styleName] = val;
    }
  };

  var widthElementId = "__widther";
  var div = document.getElementById(widthElementId);
  if (!div) {
    div = document.createElement("div");
    document.body.appendChild(div)
    div.id = widthElementId;

    div.style.position = 'absolute';
    div.style.left = '-10000px';
  }

  clone_css_style(div, 'fontSize');
  clone_css_style(div, 'fontFamily');
  clone_css_style(div, 'fontWeight');
  clone_css_style(div, 'fontVariant');
  clone_css_style(div, 'fontStyle');
  clone_css_style(div, 'textTransform');
  clone_css_style(div, 'lineHeight');

  div.style.width = '0';
  div.style.paddingLeft = padding + "px";

  div.innerHTML = s.replace(' ', "&nbsp;");
  div.style.width = 'auto';
  return [div.offsetWidth, div.offsetHeight];

};
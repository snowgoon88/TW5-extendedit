if (!window.maxkir) maxkir = {};

// width_provider_function is a function which takes one argument - a string
// and returns width of the string
maxkir.StringSplitter = function(width_provider_function) {
  this.get_width = width_provider_function;
};

// returns array of strings, as if they are splitted in textarea
maxkir.StringSplitter.prototype.splitString = function(s, max_width) {

  if (s.length == 0) return [""];
  
  var prev_space_pos = -1;
  var width_exceeded = false;

  var that = this;
  var cut_off = function(idx) {
    var remaining = s.substr(idx + 1);
    if (remaining.length > 0) {
      return [s.substr(0, idx + 1)].concat(that.splitString(remaining, max_width));
    }
    return [s.substr(0, idx + 1)]; 
  };

  for(var i = 0; i < s.length; i ++) {
    if (s.charAt(i) == ' ') {

      width_exceeded = this.get_width(s.substr(0, i)) > max_width;
      if (width_exceeded && prev_space_pos > 0) {
        return cut_off(prev_space_pos);
      }
      if (width_exceeded) {
        return cut_off(i);
      }
      prev_space_pos = i;
    }
    if (s.charAt(i) == '\n') {
      return cut_off(i);
    }
  }

  if (prev_space_pos > 0 && this.get_width(s) > max_width) {
    return cut_off(prev_space_pos);
  }
  return [s];
};



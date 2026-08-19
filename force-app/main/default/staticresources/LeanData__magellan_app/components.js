window.Magellan = window.Magellan || {};
Magellan.Models = Magellan.Models || {};
Magellan.Views = Magellan.Views || {};

var j$ = window.j$ = $;
window.fieldMetaData = null;

window.htmlDecode = function(input) {
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

// import and initialize components
require('./components/LDDropdown/LDDropdown')();
require('./components/ButtonDropdown/ButtonDropdown')();
require('./components/LDInput/LDInput')();
require('./components/NestedTypeaheadSelector/NestedTypeaheadSelector')();
require('./components/NestedTypeaheadSelector/MultiNestedTypeaheadSelector')();

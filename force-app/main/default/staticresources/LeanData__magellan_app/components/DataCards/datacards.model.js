module.exports = function() {
  return Backbone.Model.extend({
    defaults: {
      'cardInfo': [],
      'legendInfo': [],
      'lineClasses' : ['primary-line', 'tertiary-line'],
    }
  });
}

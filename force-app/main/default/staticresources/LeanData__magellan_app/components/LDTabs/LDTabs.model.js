module.exports = function() {
  return Backbone.Model.extend({
    defaults: {
      'tabNames': [],
      'selectedTab': '',
    }
  });
}

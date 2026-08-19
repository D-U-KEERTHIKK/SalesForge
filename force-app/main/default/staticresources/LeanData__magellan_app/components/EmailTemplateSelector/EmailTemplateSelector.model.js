module.exports = function() {
  return Backbone.Model.extend({
    defaults: {
      templateId: null,
      templateName: null,
    },
  });
}

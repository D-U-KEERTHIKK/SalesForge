module.exports = function() {
  Magellan.Models.EmailTemplateSelector = require('./EmailTemplateSelector.model')();
  Magellan.Views.EmailTemplateSelector = require('./EmailTemplateSelector.view')();
}

module.exports = function() {
  Magellan.Models.MessageCreator = require('./MessageCreator.model')();
  Magellan.Views.MessageCreator = require('./MessageCreator.view')();
}

/*
  SlackRecipientSelector and EmailRecipientSelector are closely related. 
  If there is a fix in one please be sure to check if that fix also applies to the other.
*/
module.exports = function() {
  Magellan.Models.EmailRecipientSelector = require('./EmailRecipientSelector.model')();
  Magellan.Views.EmailRecipientSelector = require('./EmailRecipientSelector.view')();
}

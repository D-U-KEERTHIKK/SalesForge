/* 
  RECIPIENT DATA
    message: ''
*/
module.exports = function() {
  return Backbone.Model.extend({
    defaults: {
      message: '',
      subject: '',
    },

    initialize: function(config) {

      // Set default config
      this.set(config);
    },
  });
}


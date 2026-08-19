module.exports = function() {
  const DataCardsModel = require('./datacards.model')();

  return Backbone.View.extend({
    template: _.template(require('./datacards.template.html')),
    initialize: function(params) {
      this.initializeModel(params);
      this.listenTo(this.model, 'change:model', this.render);
      this.render();
    },

    initializeModel: function(params) {
      this.model = new DataCardsModel();
      this.model.set('cardInfo', params['cardInfo']);
      this.model.set('legendInfo', params['legendInfo']);
    },

    render: function() {
      const content = this.template({
        model: this.model.toJSON(),
        cardInfo: this.model.get('cardInfo'),
        legendInfo: this.model.get('legendInfo'),
      });
      this.$el.html(content);
      return this;
    }
  });
}

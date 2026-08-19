module.exports = function() {
  const LDTabsModel = require('./LDTabs.model')();

  return Backbone.View.extend({
    template: _.template(require('./LDTabs.template.html')),
    initialize: function(tabNames) {
      this.initializeModel();
      this.updateModel(tabNames);
      this.render();
    },

    events: {
      'click #ld-tabs-container.ld-tabs-div .ld-tab': 'changeTabType',
    },

    initializeModel: function() {
      this.model = new LDTabsModel();
    },

    updateModel: function(tabNames) {
      if (tabNames) {
        const selected = _.isUndefined(tabNames[0]) ? '' : tabNames[0];
        this.model.set({
          'tabNames' : tabNames,
          'selectedTab' : selected,
        });
      };
    },

    render: function() {
      const content = this.template({
        model: this.model.toJSON(),
      });
      this.$el.html(content);
      return this;
    },

    changeTabType: function(event) {
      const selectedTab = $(event.currentTarget).data('tab-name');
      this.model.set('selectedTab', selectedTab);
      this.trigger('selectedTab:changed', selectedTab);
      this.render();
    },

    setSelectedTab: function(tab) {
      this.model.set('selectedTab', tab);
      this.render();
    }
  });
}

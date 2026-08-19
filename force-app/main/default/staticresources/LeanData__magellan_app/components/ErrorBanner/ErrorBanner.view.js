module.exports = function() {
  Magellan.Views.ErrorBanner = Backbone.View.extend({
    template: _.template(require('./ErrorBanner.template.html')),
    initialize: function(config) {
      this.primaryText = config.primaryText || '';
      this.secondaryText = config.secondaryText || '';
      this.container = config.container || '#error-banner-wrapper';
      this.hideCloseButton = config.hideCloseButton || false;
      this.closeButtonCallback = typeof config.closeButtonCallback === 'function' ? config.closeButtonCallback : () => {};
      this.actionButtonText = config.actionButtonText || '';
      this.actionButtonCallback = typeof config.actionButtonCallback === 'function' ? config.actionButtonCallback : () => {};

      this.$container = $(this.container);
    },

    events: {
      'click .error-banner-close-btn': 'hide',
      'click .error-banner-action-btn': 'action',
    },

    show: function(primary, secondary) {
      this.primaryText = primary || this.primaryText;
      this.secondaryText = secondary || this.secondaryText;
      this.setElement(this.$container).render();
      this.$container.css('display', 'flex');
    },

    hide: function(e) {
      this.$container.hide();
      this.closeButtonCallback(this.secondaryText);
      return this;
    },

    action: function(e) {
      this.actionButtonCallback(e);
      this.hide();
    },

    updateSecondaryText: function(text) {
      this.$el.find(".error-banner-secondary-text").html(text);
    },

    render: function() {
      var content = this.template({
        primaryText: this.primaryText,
        secondaryText: this.secondaryText,
        hideCloseButton: this.hideCloseButton,
        actionButtonText: this.actionButtonText,
      });
      this.$el.html(content);

      return this;
    }
  });
}
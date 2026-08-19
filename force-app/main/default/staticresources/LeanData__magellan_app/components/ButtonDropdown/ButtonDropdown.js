module.exports = function() {
  const MIN_NUMBER_OF_OPTIONS = 2;

  const optionTemplate =  _.template(`
    <li class="actions-menu-option" data-model-index="<%- index %>">
      <%- option.label %>
    </li>
  `);

  $.fn.ButtonDropdown = function(config) {
    const buttonDropdown = new Magellan.Views.ButtonDropdown(config);
    $(this).html(buttonDropdown.$el);
    return buttonDropdown;
  };

  return Magellan.Views.ButtonDropdown = Backbone.View.extend({
    template: _.template(require('./ButtonDropdown.template.html')),
    className: 'button-dropdown',
    events: {
      'click .primary-action': 'triggerPrimaryAction',
      'click .actions-menu-option': 'triggerSecondaryAction',
      'click .expand-menu': 'expandClickHandler',
    },

    initialize: function(options) {
      // options[0] is primary
      if (!options || options.length < MIN_NUMBER_OF_OPTIONS) {
        console.warn("ButtonDropdown: There should be at least two options for button dropdown.");
      }
      this.primaryOption = options.shift(); // [{ label, action }]
      this.secondaryOptions = options;

      this.render();

      this.mouseupHandler = (event) => {
        if (event.target.closest('.button-dropdown') !== this.$el[0]) {
          this.$el.toggleClass('open', false);
          $(document).off('mouseup', this.mouseupHandler);
        }
      }
    },

    render: function() {
      this.$el.html(this.template({
        primaryAction: this.primaryOption,
      }));
      this.renderSecondaryActions();
      return this;
    },

    expandClickHandler: function(e) {
      this.toggleDropdown(!this.$el.hasClass('open'));
    },

    toggleDropdown: function(visible) {
      this.$el.toggleClass('open', visible);
      if (visible) {
        $(document).on('mouseup', this.mouseupHandler);
      } else {
        $(document).off('mouseup', this.mouseupHandler);
      }
    },

    triggerPrimaryAction: function() {
      this.primaryOption.action();
    },

    triggerSecondaryAction: function(event) {
      const itemIndex = event.currentTarget.dataset['modelIndex'];
      this.secondaryOptions[itemIndex].action();
      this.toggleDropdown(false);
    },

    renderSecondaryActions: function() {
      const createListItemHtml = (option, index) => optionTemplate({ option, index, });
      const optionsHTML = this.secondaryOptions.reduce((fullHtml, option, modelIndex) => {
        return fullHtml + createListItemHtml(option, modelIndex);
      }, '');
      this.$('.actions-menu').html(optionsHTML);
    },
  });
};

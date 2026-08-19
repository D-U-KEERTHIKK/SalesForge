module.exports = function() {
  return Backbone.View.extend({
      className: 'merge-field-owners',
      initialize: function(options) {
        this.asyncServiceCall = options.asyncServiceCall;
      },
      template: _.template(require("./merge-field-users.template.html")),
      render: function() {
        let content = this.template({});
        this.$el.html(content);

        return this;
      },
      value: null,
      open: function() {
        let fieldSelector = new Magellan.Views.NestedTypeaheadSelector({
          required: false,
          placeholder: 'Select a User',
          disableBreadcrumbs: true,
          asyncServiceCall: this.asyncServiceCall,
          onSelect: (fieldSelector, selection) => {
            let lastField = selection ? selection[selection.length - 1] : null;
            if (lastField && lastField['type'] !== 'REFERENCE') {
              this.mergeFieldsModal.enablePrimaryButton();
            } else {
              this.mergeFieldsModal.disablePrimaryButton();
            }
          }
        });
        this.mergeFieldsModal = new Magellan.Views.ConfirmationModal({
          header: 'Mention Specific User',
          contentElement: this.render().$el,
          primaryButtonText: 'Mention User',
          secondaryButtonText: 'Cancel',
          onConfirmed: () => {
            this.trigger('addUser', fieldSelector.selection);
          }
        });
        this.mergeFieldsModal.open();
        this.mergeFieldsModal.disablePrimaryButton();
        
        this.$el.find('.field-selector').html(fieldSelector.$el);
      },
  });
}
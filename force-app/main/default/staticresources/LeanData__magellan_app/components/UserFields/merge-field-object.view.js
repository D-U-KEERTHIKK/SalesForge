module.exports = function() {
  return Backbone.View.extend({
      className: 'merge-field-owners',
      initialize: function(options) {
        this.fieldMetaDataFilter = _.isFunction(options.fieldMetaDataFilter) 
                                    ? options.fieldMetaDataFilter 
                                    : (suggestions) => suggestions;
        this.fieldMetaData = options.fieldMetaData;
        this.objectType = options.objectType;
      },
      template: _.template(require("./merge-field-object.template.html")),
      render: function() {
        let content = this.template({});
        this.$el.html(content);
        return this;
      },
      open: function() {
        let fieldSelector = new Magellan.Views.NestedTypeaheadSelector({
          root: 'Routed_' + this.objectType,
          data: this.fieldMetaData,
          filter: this.fieldMetaDataFilter,
          required: true,
          onSelect: (fieldSelector, selection) => {
            let lastField = selection ? selection[selection.length - 1] : null;
            if (lastField && lastField['type'] !== 'REFERENCE') {
              this.mergeFieldsModal.enablePrimaryButton();
            } else {
              this.mergeFieldsModal.disablePrimaryButton();
            }
          },
          placeholder: 'Select a User Field'
        });
          
        this.mergeFieldsModal = new Magellan.Views.ConfirmationModal({
          header: 'Mention User Field',
          contentElement: this.render().$el,
          primaryButtonText: 'Mention User Field',
          secondaryButtonText: 'Cancel',
          onConfirmed: () => {
            this.trigger('addUserField', fieldSelector.selection);
          }
        });

        this.mergeFieldsModal.open();
        this.mergeFieldsModal.disablePrimaryButton();
        
        this.$el.find('.field-selector').html(fieldSelector.$el);
      },
  });
}
module.exports = function() {
  return Backbone.View.extend({
   className: 'additional-recipients-wrapper',
   template: _.template(require('./AdditionalRecipientRows.template.html')),
   events: {
     'click .remove-additional-recipient-row': '_removeAdditionalRecipientRow',
   },

   initialize: function(config) {
     this.model = config.model;
     this.type = config.type;
     this.validationErrorMessage = config.validationErrorMessage || '';
     this.additionalObjects = config.additionalObjects;

     this.render();
   },

   getSelections: function() {
     return this.additionalObjects;
   },

   _addAdditionalRecipientRow: function(e) {
     if (!this.additionalRecipientsTypeahead.validate()) return;

     var selections = _.cloneDeep(this.additionalRecipientsTypeahead.selection);

     if (selections.length > 0) this.additionalObjects.push(selections[0]);

     this.render();
   },

   _removeAdditionalRecipientRow: function(e) {
     var idx = $(e.target).data('index');
     this.additionalObjects.splice(idx, 1);
     if (this.type == 'chatter') {
      this.model.set('groups', this.additionalObjects);
     } else {
      this.model.set('users', this.additionalObjects);
     }
     this.render();
   },

   _getAdditionalObjectsLabels: function(selections) {
    return _.map(selections, (selection) => {
      return selection.label;
    });
  },

   render: function() {
     var content = this.template({
       additionalObjectsLabels: this._getAdditionalObjectsLabels(this.additionalObjects),
     });
     this.$el.html(content);

     var asyncCall = function() { return []; };
     if (this.validationErrorMessage === '') {
      asyncCall = this.type === 'chatterUser' 
          ? _LeanData.FlowBuilderController.chatter_getChatterUsersForTypeahead 
          : _LeanData.FlowBuilderController.chatter_getChatterGroupsForTypeahead;
     }
     this.additionalRecipientsTypeahead = new Magellan.Views.NestedTypeaheadSelector({
       required: false,
       disableBreadcrumbs: true,
       asyncServiceCall: asyncCall,
       requireSelectionFromData: true,
       onSelect: this._addAdditionalRecipientRow.bind(this)
     });

     this.$el.find('.additional-recipient-typeahead').html(this.additionalRecipientsTypeahead.$el);

     return this;
   }

 });
}

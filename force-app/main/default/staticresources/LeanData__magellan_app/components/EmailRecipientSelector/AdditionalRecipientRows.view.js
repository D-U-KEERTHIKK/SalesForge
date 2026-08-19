module.exports = function() {
   return Backbone.View.extend({
    className: 'additional-recipients-wrapper',
    template: _.template(require('./AdditionalRecipientRows.template.html')),
    events: {
      'click .remove-additional-recipient-row': '_removeAdditionalRecipientRow',
    },

    initialize: function(config) {
      this.additionalObjects = config.additionalObjects;
      this._getAdditionalObjectsLabels = config._getAdditionalObjectsLabels;
      this.model = config.model;

      var contextOptions = _.map(_LeanData.MetaDataController.getObjectContextDropdownOptions(
        this.model.get('primaryObjectType'),
        this.model.get('matchedObjectTypes'),
        this.model.get('createdObjectTypes'),
        this.model.get('triggeredObjectTypes')
      ), (objectType) => {
        if (objectType) return objectType.label;
      });
      contextOptions = contextOptions.filter((elem) => !_.isUndefined(elem) && !_.isNull(elem));
      this.contextOptionsSet = new Set(contextOptions);

      this.render();
    },

    getSelections: function() {
      return this.additionalObjects;
    },

    _addAdditionalRecipientRow: function(e) {
      if (!this.additionalObjectsTypeahead.validate()) return;
      
      var selections = _.cloneDeep(this.additionalObjectsTypeahead.selection);

      this.additionalObjects.push({
        userField: _LeanData.Util.convertFieldSelectionArrayToString(selections.slice(1)),
        objectType: selections[0].objectType,
        contextType: selections[0].contextType.toLowerCase(),
      });

      this.render();
    },

    _removeAdditionalRecipientRow: function(e) {
      var idx = $(e.target).data('index');
      this.additionalObjects.splice(idx, 1);
      this.model.set('additionalObjectUserFields', this.additionalObjects);
      this.render();
    },

    render: function() {
      var content = this.template({
        additionalObjectsLabels: this._getAdditionalObjectsLabels(this.additionalObjects),
      });
      this.$el.html(content);

      var userFieldsFilter = _LeanData.Util.createUserFieldsFilter();
      var chatterUserFieldsFilter = _LeanData.Util.createChatterUserFieldsFilter();
      var ownerToOwnerMappingFilter = _LeanData.Util.createOwnerToOwnerMappingFilter();
      var relatedActivityUserFieldsFilter = _LeanData.Util.createRelatedActivityUserFieldsFilter(this.model.get('matchedObjectTypes'));
      this.additionalObjectsTypeahead = new Magellan.Views.NestedTypeaheadSelector({
        required: false,
        root: 'Object',
        data: function(metaData = fieldMetaData, isRefresh = false) {
          return metaData;
        },
        filter: (suggestions) => {
          var blacklistFilter = _LeanData.Util.createBlacklistFilter();
          suggestions = _.filter(suggestions, (suggestion) => suggestion.contextType || suggestion.label == 'Audit Log Link' ? (this.contextOptionsSet.has(suggestion.label) || _LeanData.AppState.getCurrentVariablesHandler().hasVariableByName(suggestion.name)) : true);

          suggestions = blacklistFilter(suggestions);
          suggestions = this.model.get('chatter') ? chatterUserFieldsFilter(suggestions) : userFieldsFilter(suggestions);
          if (this.model.get('matchedObjectTypes') && this.model.get('matchedObjectTypes').includes('Activity')) suggestions = relatedActivityUserFieldsFilter(suggestions);
          suggestions = ownerToOwnerMappingFilter(suggestions);

          if (this.model.get('primaryObjectType') === 'Meeting') {
            suggestions = _.filter(suggestions, (suggestion) => suggestion.objectType !== _LeanData._function.VARIABLES_FIELDNAME);
          }

          return suggestions;
        },
        customValidationFunction: function() {
          var lastSelection = this.selection[this.selection.length - 1];
          var isParent = lastSelection && lastSelection['parent'] && lastSelection['parent'].length > 0 && lastSelection['type'] === 'REFERENCE';
          return this.selection.length > 1 && !isParent;
        },
        onSelect: this._addAdditionalRecipientRow.bind(this)
      });

      this.$el.find('.additional-recipient-typeahead').html(this.additionalObjectsTypeahead.$el);

      return this;
    },
  });
}

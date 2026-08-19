module.exports = function() {
    return Backbone.View.extend({
        className: 'merge-field-selector',
        initialize: function(options) {
            this.nodeModel = options.nodeModel;
            this.disableAuditLogFullLink = options.hideAuditLogFullLink;
            if (!this.nodeModel) throw(new Error("merge-field-creator.view: options.nodeModel are required."));
            
            this.onSelect = _.isFunction(options.onSelect) ? options.onSelect : _.noop;
            this.fieldMetadataFilter = _.isFunction(options.fieldMetadataFilter) ? options.fieldMetadataFilter : null;
        },
        template: _.template(require("./merge-field-selector.template.html")),
        render: function() {
            var content = this.template({});
            this.$el.html(content);

            return this;
        },
        onSelect: _.noop,
        fieldMetadataFilter: null,
        groupingFunction: function(primaryObjectType, sug) {
          if (sug.label === 'Owner') {
            return 'owner';
          }
          
          let prefix = 'other';
          if (_LeanData.Variables.isReservedVariableLabel(sug.label, primaryObjectType)) {
            const sugLabel = sug.label.toLowerCase();
            const prefixes = ['routed', 'matched', 'created'];
            for (const p of prefixes) {
              if (sugLabel.startsWith(p)) {
                prefix = p;
                break;
              }
            }
          }
          return prefix;
        },
        open: function() {
            const nodeFieldsFilter = _LeanData.Util.createBlacklistFilter();
            var fieldSelector = new Magellan.Views.NestedTypeaheadSelector({
                getDynamicData: _LeanData.Util.getDynamicFieldMetaData(_LeanData._function.VARIABLES_FIELDNAME, _LeanData.AppState.PrimarySObjectType, null),
                root: _LeanData._function.VARIABLES_FIELDNAME,
                filter: (suggestions) => {
                    // need to do some sorting if the suggestions are variables, which is true only when the selection is empty.
                    const requireSorting = _.isEmpty(fieldSelector.selection);

                    let retSuggestions = nodeFieldsFilter(suggestions);
                    if (_.isFunction(this.fieldMetadataFilter)) retSuggestions = this.fieldMetadataFilter(retSuggestions);
                    if (requireSorting) {
                      let primaryObjectType = _LeanData.AppState.PrimarySObjectType;
                      let grouped = _.groupBy(retSuggestions, _LeanData.Variables.groupSuggestionsByRoutingCategory.bind(null, primaryObjectType));
                      grouped = _.mapValues(grouped, _.bind(_.sortBy, null, _, 'label'));

                      retSuggestions = [
                        ...(grouped.owner || []), ...(grouped.routed || []),
                        ...(grouped.matched || []), ...(grouped.created || []),
                        ...(grouped.other || []), ...(grouped.link || [])
                      ];
                    }
                    if (fieldSelector.selection.length === 0 && !this.disableAuditLogFullLink) {
                        retSuggestions.push({
                            "type":"STRING",
                            "label":"Full Audit Log Link",
                            "name":"Full Audit Log Link"
                        });
                    }
                    return retSuggestions;
                },
                required: true,
                onSelect: (fieldSelector, selection) => {
                    var lastField = selection ? selection[selection.length - 1] : null;
                    if (lastField && lastField["type"] !== "REFERENCE") this.mergeFieldsModal.enablePrimaryButton();
                    else this.mergeFieldsModal.disablePrimaryButton();
                }
            });
            
            this.mergeFieldsModal = new Magellan.Views.ConfirmationModal({
                header: 'Insert Variables',
                contentElement: this.render().$el,
                primaryButtonText: "Insert",
                secondaryButtonText: "Cancel",
                onConfirmed: () => {
                    var lastField = fieldSelector.selection[fieldSelector.selection.length - 1]; 
                    if (!lastField || lastField["type"] === "REFERENCE") return;
                    const mergeField = lastField.name === 'Full Audit Log Link' ? '<Audit.Log.Full>' : _LeanData.Util.createMergeField(fieldSelector.selection);
                    this.onSelect(mergeField);
                }
            });

            this.mergeFieldsModal.open();
            this.mergeFieldsModal.disablePrimaryButton();
            
            this.$el.find('.field-selector').html(fieldSelector.$el);
        },
    });
}

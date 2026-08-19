module.exports = function() {
    return Backbone.View.extend({
        className: "variable-insert-button",
        initialize: function(options) {
            this.name = options.name;
            this.nodeModel = options.nodeModel;
            this.typeahead = options.typeahead;
            if (this.typeahead) {
              const selections = this.typeahead.selection || this.typeahead.selections; // angular uses 'selections' while backbone uses 'selection' as the property
              this.selections = Array.isArray(selections) ? selections : [];
            }
            this.onSelect = _.isFunction(options.onSelect) ? options.onSelect : _.noop;
            this.fieldMetadataFilter = _.isFunction(options.fieldMetadataFilter) ? options.fieldMetadataFilter : null;
            this.render();
            this.hideAuditLogFullLink = options.hideAuditLogFullLink;
            if (this.typeahead) {
              this.typeahead.onSelectPostCallback = (() => {
                this.render();
              });
            }

            // Add option to open dropdown to the left, in the case of the node editor where this button is to the ar right
            let className = 'variable-insert-button';
            if (options.openDropdownLeft) {
              className += ' open-dropdown-left';
            }
            this.$el.prop('class', className);
        },
        //Only add relative date option if the field type is compatible or if it is a non update node, add merge fields for all
        getDropdownOptions: function() {
            if (this.name === 'Additional Fields') {
                return ['Relative Date'];
            }
            
            let dropdownOptions = ['Variables'];

            const isDateTimeTypeaheadSelection = this.selections
              && this.selections.length > 0
              && this.selections[this.selections.length - 1].type
              && ['DATE', 'DATETIME'].includes(this.selections[this.selections.length - 1].type);
            
            if (isDateTimeTypeaheadSelection || this.name === 'Opportunity Name' || this.name === 'Task Subject') {
                dropdownOptions = dropdownOptions.concat(['Relative Date']);
            }
            return dropdownOptions;
        },
        onSelect: _.noop,
        fieldMetadataFilter: null,
        render: function() {
            const dropdownOptions = this.getDropdownOptions();
            const openSelectedValue = (selected) => {
              switch (selected) {
                  case 'Variables':
                      let mergeFieldSelector = new Magellan.Views.MergeFieldSelector({
                          nodeModel: this.nodeModel,
                          onSelect: this.onSelect,
                          hideAuditLogFullLink: this.hideAuditLogFullLink
                      });
                      mergeFieldSelector.fieldMetadataFilter = this.fieldMetadataFilter;
                      mergeFieldSelector.open();
                      dropdownButton.set(null); // reset LDDropdown
                      break;
                  case "Relative Date":
                      let relativeDateModal = new Magellan.Views.RelativeDateModal({
                          nodeModel: this.nodeModel,
                          onSelect: this.onSelect,
                          selections: this.selections,
                          name: this.name,
                          isDatetime: this.isDatetime
                      });
                      relativeDateModal.open();
                      dropdownButton.set(null);
                      break;
                  default:
                      console.log("Invalid option:",selected);
              }
            };
            var dropdownButton = new Magellan.Views.LDDropdown({ // modify so 1 entry -> auto pop up
                required: false,
                options: dropdownOptions,
                placeholder: 'Insert',
                conditionalOpen: () => {
                  if (_LeanData.AppState.PrimarySObjectType !== 'Meeting') return false; // this function is only needed for calendaring
                  if (dropdownOptions.length === 1) {
                    openSelectedValue(dropdownOptions[0]);
                    return true;
                  }
                  return false;
                  
                },
                optionTemplate: function(option) {
                    return _.template('<span><%-option%></span>')({ option: option })
                },
                onChange: openSelectedValue,
            });
            this.$el.html(dropdownButton.$el);
            return this;
        }
    });
}
module.exports = function() {
    Magellan.Views.MergeFieldSelector = require('./merge-field-selector.view')();
    Magellan.Views.RelativeDateModal = require('./relative-date-modal.view')();
    Magellan.Views.VariableInsertButton = require('./variable-insert-button.view')();
    
    Magellan.Controllers.VariableCreator = {
        createVariableInsertButton: function(nodeModel, typeahead, onSelect, openDropdownLeft, name, hideAuditLogFullLink) {
            if (!nodeModel) throw(new Error("variable-insert-button.view: nodeModel is required."));
            return new Magellan.Views.VariableInsertButton({
              nodeModel: nodeModel, 
              typeahead: typeahead, 
              onSelect: onSelect,
              openDropdownLeft: openDropdownLeft,
              name: name,
              hideAuditLogFullLink: hideAuditLogFullLink
            });
        }
    };
}
module.exports = function() {
    Magellan = Magellan || {};
    Magellan.Views = Magellan.Views || {};
    Magellan.Models = Magellan.Models || {};

    var template = require('./SOFieldUpdater.template.html');
    var updateRowTemplate = require('./update-row.template.html');
    var updaterModel = require('./SOFieldUpdater.model')();
    var nillableFields = []; //adding this here because nillable can be changed by user, we need to keep fetching for the most up to date status


    Magellan.Views.UpdateRow = Backbone.View.extend({
        initialize: function(options) {
            // properties
            this.editable = typeof options.editable === 'boolean' ? options.editable : true;
            // variables
            this.renderParent = options.renderParent;
            this.onUpdatesChange = options.onUpdatesChange;
            this.model = options.model;
            this.update = options.update;
            this.nodeModel = options.nodeModel;
            this.expandTextArea = _LeanData.Util.expandTextArea(30, 50);
            this.collapseTextArea = _LeanData.Util.collapseTextArea(17);
            this.typeaheadDropdowns = [];
            this.expandedText = options.update.get('value');
            this.collapsedText = _LeanData.Util.truncateText(this.expandedText, 30);

            this.SET_OF_VALID_FIELD_TYPE_MAPPING = {};
            var allFieldTypes = Object.keys(_LeanData._function.SFDC_VALID_TYPE_MAPPING);
            _.each(allFieldTypes, (fieldType) => {
                let compatibleFieldTypes = _.clone(_LeanData._function.SFDC_VALID_TYPE_MAPPING[fieldType]);
                if (fieldType === "TEXTAREA" || fieldType === "STRING" || fieldType === "URL") {
                    compatibleFieldTypes.push(...allFieldTypes);
                }
                this.SET_OF_VALID_FIELD_TYPE_MAPPING[fieldType] = new Set(compatibleFieldTypes);
            });

            this.render();
        },

        template: _.template(updateRowTemplate),

        events: {
            'focus .sofu-update-value.ld-textarea-small': 'expandTextAreaTrigger',
            'blur .sofu-update-value.ld-textarea-small': 'collapseTextAreaTrigger'
        },

        render: function() {
                var dropdownData = {};
                dropdownData[this.model.get('object')] = this.model.get('fields').toJSON();
                this.$el.html(this.template({
                  update: this.update, 
                  collapsedText: this.collapsedText,
                  hideDeleteButton: !this.editable || this.model.get('updates').length === 1,
                }));
                var dropdown = this._createFieldsDropdown(this.update, dropdownData);
                this.$el.find('.sofu-field-selector').html(dropdown.$el);
                this.$el.find('.sofu-delete-column').on('click', this.deleteRow.bind(this, this.$el, this.update));
                this.$el.find('.sofu-update-value').on('change', this._setUpdateValue.bind(this, this.update));
                $(this.$el.find('.sofu-ld-dropdown')).LDDropdown({options: [true, false], value: this.update.get('value')});
                this.$el.find('.sofu-ld-dropdown').on('LDDropdown:change', this._setUpdateValue.bind(this, this.update));
                //adding new rows/ opening node for first time hits the conditions below
                if (_.isEmpty(this.update.get('field'))) {
                    var picklistTypeahead = this._createValueTypeahead(this.update, dropdownData);
                    this.$el.find('.sofu-ld-typeahead').html(picklistTypeahead.$el);
                    picklistTypeahead.$el.on('nestedTypeaheadSelector:select .sofu-ld-typeahead', this._setUpdateValue.bind(this, this.update));
                }
                this._refreshUpdateValueColumn(this.$el.find('.update-row'), this.update);

            var variableInsertButton = Magellan.Controllers.VariableCreator.createVariableInsertButton(
                this.nodeModel,
                dropdown,
                (variable) => {
                    var newValue = variable;
                    if (this.update.get('type') === 'STRING' || this.update.get('type') === 'TEXTAREA' || this.update.get('type') === 'URL') {
                        var insertPosition = this.expandedText > this.collapsedText ? this.expandedText.length : this.$el.find('.sofu-update-value')[0].selectionStart;
                        var currentText = this.expandedText || '';
                        newValue = currentText.substring(0, insertPosition) + variable + currentText.substring(insertPosition);
                    }
                    this.setUpdateValue(this.update, newValue, this.$el.find('.update-row'));
                    var newUpdateRow = this.render();
                    this.$el.replaceWith(newUpdateRow.$el);

                    if (!this.$el.find('.sofu-update-value').hasClass('hidden')) this.expandedText = newValue;

                    var newCursorPosition = insertPosition + variable.length;
                    newUpdateRow.$el.find('.sofu-update-value')[0].setSelectionRange(newCursorPosition, newCursorPosition);
                    if(this.update.get('type') !== 'DATE' && this.update.get('type') !== 'DATETIME') {
                    	$(newUpdateRow.$el).find('.sofu-update-value').datepicker('destroy').removeClass('hasDatepicker');
                        newUpdateRow.$el.find('.sofu-update-value').focus();
                    }
                });

                var validFieldTypesMapping = this.SET_OF_VALID_FIELD_TYPE_MAPPING;

                variableInsertButton.fieldMetadataFilter = (fieldSuggestions) => {
                    var updateFieldType = this.update.get('type');
                    if (!updateFieldType) return fieldSuggestions;

                    return _.filter(fieldSuggestions, (sugg) => {
                        var validFieldTypes = validFieldTypesMapping[updateFieldType];

                        return sugg.type === 'REFERENCE' || sugg.type === 'SOBJECT' || validFieldTypes.has(sugg.type);
                    });
                };
                this.$el.find('.merge-field-insert-button-container').html(variableInsertButton.$el);
                return this;
            },

        _createValueTypeahead: function (update) {
            var cachedValues = _LeanData.MetaDataController.getCachedPicklistValues(this.model.get('object') + update.get('field'));
            if (cachedValues != null) {
                cachedValues = JSON.parse(cachedValues);
            }
            var emptyData = {};
            emptyData[this.model.get('object')] = [];
            var picklistTypeahead = new Magellan.Views.NestedTypeaheadSelector({
                data: cachedValues == null ? emptyData : cachedValues,
                root: this.model.get('object'),
                disableBreadcrumbs: true,
                requireSelectionFromData: false,
                required: false,
                includeNoValueOption: true,
                fetchData: cachedValues == null ? _LeanData.MetaDataController.getPicklistFields.bind(null,this.model.get('object'), update.get('field')) : null,
                currentTextValue: update.get('value'),
                selection: _LeanData.Util.convertStringSelectionToArray(update.get('value'))
            });
            return picklistTypeahead;
        },

        _createMultiValueTypeahead: function(update){
          var cachedValues = _LeanData.MetaDataController.getCachedPicklistValues(this.model.get('object') + update.get('field'));
          if (cachedValues != null) {
            cachedValues = JSON.parse(cachedValues);
          }
          var emptyData = {};
          emptyData[this.model.get('object')] = [];
          var picklistTypeahead = new Magellan.Views.MultiNestedTypeaheadSelector({
            type: update.get('type'),
            data: cachedValues == null ? emptyData : cachedValues,
            root: this.model.get('object'),
            onSelect: this._setUpdateValue.bind(this, update),
            disableBreadcrumbs: true,
            requireSelectionFromData: false,
            required: false,
            fetchData: cachedValues == null ? _LeanData.MetaDataController.getPicklistFields.bind(null,this.model.get('object'), update.get('field')) : null,
            currentTextValue: update.get('value'),
            selection: _LeanData.Util.convertStringSelectionToArray(update.get('value'))
          });
          return picklistTypeahead;
        },

        _createFieldsDropdown: function(update, fieldsData) {
            var selection = _.find(fieldsData[this.model.get('object')], function(fld) { return fld.name === update.get('field') });
            var trimmedFieldsData = {}; //removes all items in fieldsData that are not updatetable like id,createdDate...
            var customUserFields = _LeanData.MetaDataController.getCustomUserFieldsByObject(_LeanData.AppState.PrimarySObjectType); //potential loophole possibilities - remove these from available list
            var illegalAssignmentList = ['ownerid']; //populates a list by name from the above list for faster checking (ownerid is default salesforce field)
            _.each(customUserFields, function(customUserField) {
                if (customUserField['name'].endsWith('__r.id')) {
                    illegalAssignmentList.push(customUserField['name'].substring(0,customUserField['name'].length-6) + '__c');
                }
                else if (customUserField['name'].endsWith('.id')) {
                    illegalAssignmentList.push(customUserField['name'].substring(0,customUserField['name'].length-3));
                }
            });

            nillableFields = fieldsData[this.model.get('object')].filter(function(fieldProperties) {
                return fieldProperties['isNillable'] === true;
            });

            var dropdown = new Magellan.Views.NestedTypeaheadSelector({
                required: true,
                root: this.model.get('object'),
                currentTextValue: update.get('field'),
                data: ((trimmedFieldsData, isRefresh) => {
                  //removes all items in fieldsData that are not updatetable like id,createdDate...
                  var trimmedFieldsData = {};
                  // normally uses closure to draw from cached fields metadata in localStorage
                  // override with new fields metadata if this is a hard refresh
                  fieldsData = isRefresh ? {[this.model.get('object')]:_LeanData.MetaDataController.getFlattenedFieldsByObject(this.model.get('object'))} : fieldsData;

                  trimmedFieldsData[this.model.get('object')] = fieldsData[this.model.get('object')].filter(function(fieldProperties) {
                    return fieldProperties['isUpdateable'] === true && illegalAssignmentList.includes(fieldProperties['name']) === false;
                  });

                  return trimmedFieldsData;
                }),
                selection: selection ? [selection] : [],
                onSelect: this._updateFieldOnSelected.bind(this, update)
            });
            dropdown.validate();

            this.typeaheadDropdowns.push(dropdown);

            return dropdown;
        },

        _triggerModelChangeEvent: function() {
            this.onUpdatesChange();
        },

        deleteRow: function(row, update) {
            if (this.model.get('updates').length == 1) return;
            
            row.remove();
            this.model.get('updates').remove(update);
            if (this.model.get('updates').length === 1) this.renderParent(); // hide remove button if one row remains
            this._triggerModelChangeEvent();
        },

        _setUpdateValue: function(update, evt, vwLDDropdown) {
            var rowEl, updateValue;
            var updateFieldType = update.get('type');
            if (vwLDDropdown instanceof Magellan.Views.LDDropdown) {
                rowEl = vwLDDropdown.$el.closest('.update-row');
                updateValue = this.setUpdateValue(update, vwLDDropdown.val(), rowEl);
            } else if (vwLDDropdown instanceof Magellan.Views.MultiNestedTypeaheadSelector) {
                if (_.isEmpty(vwLDDropdown.selection)) updateValue = '';
                else {
                    updateValue = vwLDDropdown.selection.reduce(function(str, field) {
                        if (str!== "") str += "; ";
                        if (field.type === 'REFERENCE')
                            return str += _LeanData.Util.flattenReferenceAPIs(field.name);
                        else
                            return str += field.name;
                    }, "");
                }
                rowEl = vwLDDropdown.$el.closest('.update-row');
                updateValue = this.setUpdateValue(update, updateValue, rowEl);
            } else if (vwLDDropdown instanceof Magellan.Views.NestedTypeaheadSelector) {
                if (_.isEmpty(vwLDDropdown.selection)) updateValue = '';
                else updateValue = vwLDDropdown.selection[0]['name'];

                rowEl = vwLDDropdown.$el.closest('.update-row');
                updateValue = this.setUpdateValue(update, updateValue, rowEl);
            } else {
                rowEl = $(evt.target).closest('.update-row');
                updateValue = $(evt.target).val();
                if (updateFieldType === 'DATETIME') {
                    if (_.isEmpty(updateValue)) { //if it's not true, it is a null field and we should just set the value to updateVal without converting using moment
                        updateValue = null;
                    } else {
                        const dateValue = moment(updateValue);
                        if (dateValue.isValid()) updateValue = dateValue.format(_LeanData._datetime.DATETIME_FORMAT);
                    }
                    $(evt.target).val(updateValue);
                }
                updateValue = this.setUpdateValue(update, updateValue, rowEl);

            }
            this.setUpdateValue(update, updateValue, rowEl);
        },

        setUpdateValue: function(update, newValue, rowEl) {
            if (this._isFieldNillable(update.get('field')) && (newValue === '' || newValue === null || newValue === undefined)) {
                newValue = null;
            }

            update.set('value', newValue);
            this._validateRow(update, rowEl);
            return newValue;
        },

        _updateFieldOnSelected: function(update, dropdownVw, selected) {
            var field = null;
            if (selected.length > 0) {
              field = selected[selected.length - 1];
            }
            update.set({
              'field': field ? field['name'] : '',
              'type': field ? field['type']: '',
            });

            this._refreshUpdateValueColumn(dropdownVw.$el.closest('.update-row'), update);
        },

        _renderInputOrTextArea: function (fieldType, rowEl) {
            // This method renders an input or textarea element in each row, depending on the type of field
            if (fieldType === 'date' || fieldType === 'datetime') {
                rowEl.find('.sofu-update-value.sofu-input').hide();
                rowEl.find('.sofu-update-value.sofu-date').show();
            } else {
                rowEl.find('.sofu-update-value.sofu-input').show();
                rowEl.find('.sofu-update-value.sofu-date').hide();
            }
        },

        _refreshUpdateValueColumn: function(rowEl, update) {
            $(rowEl).find('.sofu-update-value').datepicker('destroy').removeClass('hasDatepicker');
            var hideBooleanDropdown = true;
            var hidePicklistDropdown = true;
            var fieldType = (update.get('type') || '').toLowerCase();

            this._renderInputOrTextArea(fieldType, rowEl);

            if (fieldType === 'date') {
                $(rowEl).find('.sofu-update-value.sofu-date').datepicker({ dateFormat: 'yy-mm-dd'});
            } else if (fieldType === 'datetime') {
                $(rowEl).find('.sofu-update-value.sofu-date').datetimepicker({
                    dateFormat: 'yy-mm-dd',
                    timeFormat: 'HH:mm:ss',
                    timeInput: true,
                    showHour: false,
                    showMinute: false,
                    showSecond: false
                });
            } else if (fieldType === 'boolean') {
                hideBooleanDropdown = false;
            } else if (fieldType === 'picklist') {
                hidePicklistDropdown = false;
                var picklistTypeahead = this._createValueTypeahead(update);
                rowEl.find('.sofu-ld-typeahead').html(picklistTypeahead.$el);
                picklistTypeahead.$el.on('nestedTypeaheadSelector:select .sofu-ld-typeahead', this._setUpdateValue.bind(this, update));
            } else if (fieldType === 'multipicklist') {
                hidePicklistDropdown = false;
                var picklistTypeahead = this._createMultiValueTypeahead(update);
                rowEl.find('.sofu-ld-typeahead').html(picklistTypeahead.$el);
                picklistTypeahead.$el.on('multiNestedTypeaheadSelector:select .sofu-ld-typeahead', this._setUpdateValue.bind(this, update));
            }

            rowEl.find('.sofu-update-value').toggleClass('hidden', !hideBooleanDropdown || !hidePicklistDropdown);
            rowEl.find('.sofu-ld-dropdown').toggleClass('hidden', hideBooleanDropdown);
            rowEl.find('.sofu-ld-typeahead').toggleClass('hidden', hidePicklistDropdown);
            if (fieldType === 'boolean') rowEl.find('.sofu-ld-dropdown .ld-dropdown-value').html(`<span>${update.get('value')}</span>`);
            else rowEl.find('.sofu-update-value').val(_LeanData.Util.truncateText(update.get('value'), 30));

            this._validateRow(update, rowEl);
        },

        _validateRow: function(update, updateRowEl) {
            const sObjectType = this.model.get('object');
            const updateValue = update.get('value');
            const updateField = update.get('field');
            const updateFieldType = update.get('type');

            // Merge field validation
            let errorMessages =  Magellan.Validation.isValidMergeFieldValueMessages(this.nodeModel.nodeInfo.name, updateValue, updateFieldType, updateField);
            const mergeFields = (typeof updateValue === 'string' && updateValue.match(/{!([^}]+)}/gi)) || [];
            if (mergeFields.length > 0) {
              // Additional validation for value containing merge fields
              if (_LeanData._function.SFDC_TYPE_TO_GROUPING[updateFieldType] !== 'String' && mergeFields[0] !== updateValue) {
                // Since we don't allow concatenation for non-string type, the value should only have 1 merge field
                errorMessages = [`Field '${_LeanData.Util.getFieldLabel(sObjectType, updateField)}' must contain a valid value`];
              }
            } else if (_.isEmpty(errorMessages)) {
              // Validate value with no merge fields, only if no error message has been generated -- 'isValidMergeFieldValueMessages' generates an error message if the update field is empty
              const isFieldRequired = !this._isFieldNillable(updateField);
              const isFieldEmpty = updateValue === '' || updateValue === null;
              let isValidValueOfType = !isFieldRequired && isFieldEmpty; // Optional fields that are empty should be considered valid
              if (!isValidValueOfType) {
                // If the field is not optional and empty, validate the value's type
                if (updateFieldType === 'PICKLIST') isValidValueOfType = true;
                else isValidValueOfType = Magellan.Validation.isValidValueOfType(updateFieldType, updateValue);
              }
              if ((isFieldRequired && isFieldEmpty) || !isValidValueOfType) {
                errorMessages = [`Field '${_LeanData.Util.getFieldLabel(sObjectType, updateField)}' must contain a valid value`];
              }
            }

            let stringErrorMessage = '';
            if (errorMessages.length > 0 && (!_.isEmpty(updateField) || !_.isEmpty(updateValue))) {
              stringErrorMessage = errorMessages.join('; ');
            }

            updateRowEl.find('.sofu-ld-dropdown .ld-dropdown, .sofu-update-value, .sofu-ld-typeahead').toggleClass('input-invalid', errorMessages.length > 0);
            updateRowEl.closest('.update-row-container').find('.sofu-error-feedback').text(stringErrorMessage);
        },

        collapseTextAreaTrigger: function(event) {
            this.expandedText = event.target.value;
            this.collapsedText = _LeanData.Util.truncateText(this.expandedText, 30);
            this.collapseTextArea.call(event.target);
            event.target.value = this.collapsedText;
        },

        expandTextAreaTrigger: function(event) {
            if (this.expandedText !== this.collapsedText) {
                event.target.value = this.expandedText;
            }
            this.expandTextArea.call(event.target);
        },

        _isFieldNillable: function(fieldName) {
            var nillableField = _.find(nillableFields, function(fld) { return fld.name === fieldName });
            return nillableField != undefined;
        },

        remove: function() {
            this.typeaheadDropdowns.forEach(function(dropdown) {
                dropdown.remove();
            });
            Backbone.View.prototype.remove.apply(this, arguments);
        }
    });

    Magellan.Views.SOFieldUpdater = Backbone.View.extend({
        tagName: "div",
        className: "so-field-updater",
        initialize: function(options) {
          // component properties
          this.editable = typeof options.editable === 'boolean' ? options.editable : true;
          // Blacklist fields
          let fields = options.fields || [];
          let blacklistSet = _LeanData._blacklist.FIELD_BLACKLIST_SETS[`${options.object.toUpperCase()}_FIELDS`];
          if (blacklistSet) fields = _.filter(fields, (field) => !blacklistSet.has(field.name));
          this.nodeModel = options.nodeModel || null;

            this.model = new updaterModel({
                object: options.object,
                fields: fields || [],
                updates: options.updates || [] //the only fields that will be populated when editable == false
            });

            this.model.get('updates').on('add', this._renderUpdates.bind(this));
            this.model.get('updates').on('change', this._triggerModelChangeEvent.bind(this));

            this.render();
        },

        template: _.template(template),

        events: {
            'click .add-rule-div': 'addRow',
            'click .sofu-boolean-dropdown-option': '_booleanDropdownHandler'
        },

        render: function() {
            this.$el.html(this.template({ 
              model: this.model,
              editable: this.editable,
              objectLabelData: _LeanData.MetaDataController.getObjectMetaDataObject(this.model.get('object'), true)
            }));
            this._renderUpdates();

            ld_initializeToolTip(this.$el.find('.sofu-note-tooltip'), {
                title: 'Insert Merged Fields & Relative Dates',
                body: 'Select a compatible Field to insert a <b>Merged Field.</b><br>' +
                  'Select a Date/Time Field to insert a <b>Relative Date.</b>',
            });
            return this;
        },

        addRow: function() {
            this.model.get('updates').add({ field: null, value: null, type: null });
        },

        val: function() {
            return this.model.get("updates").toJSON();
        },

        _triggerModelChangeEvent: function() {
            this.$el.trigger('SOFieldUpdater:change', this);
        },

        _renderUpdates: function() {
          this.$('.sofu-field-updates-list').empty();

          this.model.get('updates').each((update) => {
            let updateRowView = new Magellan.Views.UpdateRow({
              editable: this.editable,
              model: this.model,
              update: update,
              nodeModel: this.nodeModel,
              renderParent: this.render.bind(this),
              onUpdatesChange: this._triggerModelChangeEvent.bind(this),
            });
            this.$('.sofu-field-updates-list').append(updateRowView.$el);
          });

          return this;
        },

        _booleanDropdownHandler: function(event) {
            event.preventDefault();
            var dropdownOption = $(event.target).text();
            var dropdownOptionValue = $(event.target).data('value');
            $(event.target).closest('.sofu-boolean-dropdown').find('.sofu-boolean-dropdown-value-text').text(dropdownOption);
            $(event.target).closest('.sofu-boolean-dropdown').find('.sofu-boolean-dropdown-value').val(dropdownOptionValue).trigger('change');
            $(event.target).closest('.sofu-boolean-dropdown').toggleClass('input-invalid', false);
        },

    });
};

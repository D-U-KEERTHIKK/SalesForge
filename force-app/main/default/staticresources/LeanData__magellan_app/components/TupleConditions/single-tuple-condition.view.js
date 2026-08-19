 module.exports = function() {
  Magellan.Views.SingleTupleCondition = Backbone.View.extend({
    template: _.template(require('./single-tuple-condition.template.html')),
    initialize: function(config) {
      // Required variables
      this.idx = config.idx;
      this.selectedRoutingType = this.model.get('selectedRoutingType');
      this.fieldObjectType = this.model.get('fieldObjectType');
      this.operandObjectType = this.model.get('operandObjectType');
      this.fieldData = this.model.get('fieldData');
      this.operandData = this.model.get('operandData');
      this.condition = config.condition;
      this.filterOutTextArea = this.model.get('filterOutTextArea');
      this.allowFormulaField = this.model.get('allowFormulaField');
      this.customPlaceholderText = this.model.get('customPlaceholderText');

      // cache
      this.operandFieldCache = null;
      this.operandValueCache = null;
      
      this.render();
      this.validate();
    },

    validate: function() {
      let isValidOperand = true;
      let isValidField = true;
      let errorMsg = "";
      const fieldTypeHead = this.$el.find('.tuple-condition-field');
      const operandElement = this.$el.find('.tuple-condition-operand-input');
      const errorMessage = this.$el.find('.error-message')
      const fieldSelection = this.getFieldSelection();
      if(fieldSelection && fieldSelection[0] && fieldSelection[0].type != this.condition.type) {
        this.condition.type = fieldSelection[0].type
      }
      // Validation for operand
      // Operand won't need to be validated if operator is checking for null value
      if(!['is null', 'not null'].includes(this.condition.operator))
      {
        // Don't include number or boolean because it messes with _.isEmpty
        // Mostly for dropdown when a boolean is selected
        isValidOperand = (['number', 'boolean'].includes(typeof this.condition.operand) || !_.isEmpty(this.condition.operand)) 
                          && Magellan.Validation.isValidValueOfType(this.condition.type, this.condition.operand)
      }
      
      // Field validation, just checking if field exist and not empty
      isValidField = !_.isEmpty(this.condition.field) && Magellan.Validation.metadataFieldExists(this.operandObjectType, this.condition.field)

      operandElement.toggleClass('input-invalid', !isValidOperand);
      fieldTypeHead.toggleClass('input-invalid', !isValidField);
      const isValid = isValidField && isValidOperand;
      if(!isValid) {
        errorMsg = "Invalid field selected.  Please check the field is active and compatible with corresponding values.";
      }
      errorMessage.html(errorMsg);
      return isValid;
    },

    events: {
      'click .tuple-condition-delete': 'deleteCondition',
      'change .tuple-fieldset-radiogroup input': 'radioButtonHandler',
      'keyup .tuple-condition-operand-input': 'operandInputHandler',
      'change .tuple-condition-operand-input': 'operandInputHandler',
    },

    deleteCondition: function(e) {
      var index = $(e.target).closest('.tuple-condition').data('ruleIndex');
      this.model.deleteCondition(index);  // this will trigger a re-render of all rows in tuple-conditions.view.js
      this.handleConditionChange();
    },

    radioButtonHandler: function(e) {
      this.condition['value/field'] = this.$el.find('fieldset input:checked').val();

      var operandDropdown = this.$el.find('.tuple-condition-operand-dropdown');
      var operandInput = this.$el.find('.tuple-condition-operand-input');
      if (this.condition['value/field'] === 'field') {
        this.condition.operand = this.operandFieldCache;
      } else {
        this.condition.operand = this.operandValueCache;
      }

      this.render();
    },

    operandInputHandler: function(e) {
      var $input = $(e.target);
      var inputVal = $input.val();
      this.condition.operand = _.isEmpty(inputVal) ? null : inputVal;
      this.operandValueCache = _.isEmpty(inputVal) ? null : inputVal;
      this.handleConditionChange();
    },

    getFieldSelection() {
      let fieldSelection = null;
      if (this.model.get('flattenField')) {
        fieldSelection = _LeanData.Util.convertFieldSelectionStringToArray(this.condition.field, this.fieldObjectType, _LeanData.MetaDataController.getFlattenedFieldMetaDataMap());
      } else {
        fieldSelection = _LeanData.Util.convertFieldSelectionStringToArray(this.condition.field, this.fieldObjectType, _LeanData.MetaDataController.getFieldMetaDataMap());
      }
      
      if (fieldSelection.length === 0) {
        //this.condition.field = null;
      } else {
        fieldSelection = _LeanData.Util.createFlattenedFields(fieldSelection);
      }
      return fieldSelection
    },

    _createFieldNestedTypeahead: function() {
      const fieldSelection = this.getFieldSelection();
      
      var blacklistFilter = _LeanData.Util.createBlacklistFilter();
      
      //cappingFilter includes textarea filter and formula filter
      var cappingFilter = function(suggestions, filterOutTextArea, allowFormulaField) {
        return _.filter(suggestions, function(suggestion) {
          return (filterOutTextArea ? suggestion.type !== 'TEXTAREA' : true) && (allowFormulaField || suggestion.isFormula === false);
        });
      };
      
      this.fieldNestedTypeahead = new Magellan.Views.NestedTypeaheadSelector({
        required: true,
        data: (metaData = this.fieldData) => {
          this.model.set('data', metaData);
          this.model.processData();
          return metaData;
        },
        root: this.fieldObjectType,
        selection: fieldSelection,
        currentTextValue: this.condition.field,
        filter: function(suggestions) {
          suggestions = blacklistFilter(suggestions);
          suggestions = cappingFilter(suggestions, this.filterOutTextArea, this.allowFormulaField);
          return suggestions;
        }.bind(this),
        onSelect: function(dropdownView, selection) {
          this.condition.field = _LeanData.Util.convertFieldSelectionArrayToString(selection);
          this.condition.type = selection[selection.length - 1] ? selection[selection.length - 1].type : null;
          if (this.condition.type !== 'REFERENCE') {
            this._createOperatorDropdown();
            this._createOperandColumn();
          }
          this.handleConditionChange();
        }.bind(this),
      });
      this.$el.find('.tuple-condition-field').html(this.fieldNestedTypeahead.$el);
    },

    _createOperatorDropdown: function() {
      var operators;
      var routingType = this.model.get('selectedRoutingType');
      var typeGrouping = _LeanData._function.SFDC_TYPE_TO_GROUPING[this.condition.type];

      if (routingType === 'Update') {
        operators = _LeanData._function.UT_DATATYPE_TO_OPERATORS[typeGrouping];
      } else {
        operators = _LeanData._function.DATATYPE_TO_OPERATORS[typeGrouping];
      }

      var selectedOperator;
      if (operators && operators.indexOf(this.condition.operator) !== -1) {
        selectedOperator = this.condition.operator;
      } else {
        selectedOperator = this.condition.operator = null;
      }

      if (this.model.get('isApiRouting') && operators) {
        operators = operators.filter(condition => condition !== 'has changed');
      }
      $(this.$el.find('.tuple-condition-operator')).LDDropdown({ 
        required: true, 
        options: operators, 
        value: selectedOperator, 
        optionTemplate: (option) => {
          return `<span>${_LeanData.Util.datatypeToOperatorLabel(option, this.condition.type)}</span>`;
        },
        enableSearch: this.model.get('enableSearch'),
        onChange: function(val) {
          this.condition.operator = val;
          this.render();
          this.handleConditionChange();
        }.bind(this),
      });
    },

    _createOperandColumn: function() {
      var operandDropdown = this.$el.find('.tuple-condition-operand-dropdown');
      var operandInput = this.$el.find('.tuple-condition-operand-input');
      $(operandInput).datepicker('destroy');

      if (_LeanData._function.UNARY_OPERATORS.has(this.condition.operator)) {
        // If operator is any of the above, do not show operand column since it's not needed
        operandDropdown.hide();
        operandInput.hide();
        this.condition.operand = '';
        this.handleConditionChange();
      } else if (this.condition['value/field'] === 'field') {
        // If type of field is 'field', create nested typeahead selector for operand column
        this.$el.find('fieldset input[value="field"]').prop('checked', true);
        operandInput.hide();
        var fieldGroupingType = _LeanData._function.SFDC_TYPE_TO_GROUPING[this.condition.type];
        var operandSelection = _LeanData.Util.convertFieldSelectionStringToArray(this.condition.operand, this.operandObjectType, _LeanData.MetaDataController.getFieldMetaDataMap());
        if (operandSelection.length === 0 || (operandSelection.length > 0 && _LeanData._function.SFDC_TYPE_TO_GROUPING[operandSelection[operandSelection.length - 1].type] !== fieldGroupingType)) {
          operandSelection = [];
          this.condition.operand = null;
        }
        this.operandFieldCache = this.condition.operand;
        
        var fieldsFilter = _LeanData.Util.createFieldsFilter(_LeanData._function.SFDC_TYPE_TO_GROUPING[this.condition.type]);
        var blacklistFilter = _LeanData.Util.createBlacklistFilter();
        
        this.operandNestedTypeahead = new Magellan.Views.NestedTypeaheadSelector({
          required: true,
          data: this.operandData,
          root: this.operandObjectType,
          selection: operandSelection,
          filter: function(suggestions) {
            suggestions = fieldsFilter(suggestions);
            suggestions = blacklistFilter(suggestions);
            return suggestions;
          },
          onSelect: function(dropdownView, selection) {
            this.condition.operand = _LeanData.Util.convertFieldSelectionArrayToString(selection);
            this.condition['operand type'] = selection[selection.length - 1].type;
            this.operandFieldCache = this.condition.operand;
            this.handleConditionChange();
          }.bind(this),
        });
        operandDropdown.html(this.operandNestedTypeahead.$el);
      } else {
        // If type of field is 'value' (default), need to check type of the condition, then show different inputs
        this.$el.find('fieldset input[value="value"]').prop('checked', true);
        switch (this.condition.type) {
          case 'BOOLEAN':
            operandInput.hide();
            $(operandDropdown).LDDropdown({
              required: true, 
              options: [true, false],
              value: this.condition.operand, 
              onChange: function(val) {
                this.condition.operand = val;
                this.handleConditionChange();
              }.bind(this),
            })
            operandDropdown.show();
            break;
          case 'COMBOBOX':
          case 'MULTIPICKLIST':
          case 'PICKLIST':
            
            if(this.condition.operator === 'equals' || this.condition.operator === 'not equal to') {
                operandInput.hide();

                var cachedValues = _LeanData.MetaDataController.getCachedPicklistValues(this.operandObjectType + this.condition.field);
                if (!_.isEmpty(cachedValues)) cachedValues = JSON.parse(cachedValues);

                var emptyData = {};
                emptyData[this.operandObjectType] = [];

                var picklistTypeahead = new Magellan.Views.MultiNestedTypeaheadSelector({
                    required: true,
                    requireSelectionFromData: false,
                    disableBreadcrumbs: true,
                    data: _.isEmpty(cachedValues) ? emptyData : cachedValues,
                    root: this.operandObjectType,
                    selection: _.isEmpty(this.condition.operand) ? _LeanData.Util.convertStringSelectionToArray('') : _LeanData.Util.convertStringSelectionToArray(this.condition.operand),
                    fetchData: _.isEmpty(cachedValues) ? _LeanData.MetaDataController.getPicklistFields.bind(null, this.operandObjectType, this.condition.field) : null,
                    onSelect: this.updateModelOnMultiNestedDropdownChange.bind(this)
            });
                operandDropdown.html(picklistTypeahead.$el);
                operandDropdown.show();
            }
            break;
          case 'DATE':
          case 'DATETIME': 
            operandDropdown.hide();
            if (!Magellan.Validation.isValidValueOfType(this.condition.type, this.condition.operand)) {
              operandInput.toggleClass('input-invalid', true).val(this.condition.operand);
            }
              
            if (this.condition.type === 'DATE') {
              $(operandInput).datepicker({ 
                dateFormat: 'yy-mm-dd',
                constrainInput: !this.model.get('allowDateLiterals')
              });
            } else {
              $(operandInput).datetimepicker({
                dateFormat: 'yy-mm-dd',
                timeFormat: 'HH:mm:ss',
                timeInput: true,
                showHour: false,
                showMinute: false,
                showSecond: false,
                constrainInput: !this.model.get('allowDateLiterals')
              });
            }
            operandInput.show();
            break;
          default: 
            operandDropdown.hide();
            operandInput.show();
            if (!Magellan.Validation.isValidValueOfType(this.condition.type, this.condition.operand)) {
              operandInput.toggleClass('input-invalid', true).val(this.condition.operand);
            }
            operandInput.show();
        }
        operandInput.val(this.condition.operand);
        this.operandValueCache = this.condition.operand;
        this.condition['operand type'] = 'STRING';
      }
    },
      
    handleConditionChange: function() {
      this.model.trigger('conditionChange', this.model.toJSON())
      this.validate();
    }, 
      
    updateModelOnMultiNestedDropdownChange: function(dropdownView, selectedFields) {
      var lastSelection = selectedFields[selectedFields.length - 1];
      if(_.isUndefined(lastSelection) && lastSelection.type === 'REFERENCE') return false;
      var selectedValue = selectedFields.map(function(field) {
        if (field.type === 'REFERENCE')
          return _LeanData.Util.flattenReferenceAPIs(field.name);
        else
          return field.name;
      });
         
        if(dropdownView.attributes && dropdownView.attributes.isMatchedField) {
          this.condition.field = selectedValue;
          this.condition.type = (lastSelection) ? lastSelection['type'] : 'undefined';
          this.condition['picklist field'] = (lastSelection) ? lastSelection['name'] : 'undefined';
          this.condition['picklist object'] = (lastSelection) ? lastSelection['objectType'] : 'undefined';
        }  else {
          this.condition.operand = selectedValue;
          this.condition['operand type'] = (lastSelection) ? lastSelection['type'] : 'undefined';
        }
        this.handleConditionChange();
      },
      
      render: function() {
      var content = this.template({
        idx: this.idx,
        condition: this.condition,
        hideToggleColumn: this.model.get('hideToggleColumn'),
        showSeparatorPerRow: this.model.get('showSeparatorPerRow'),
        customPlaceholderText: this.customPlaceholderText
      });
      this.$el.html(content);

      this._createFieldNestedTypeahead();
      this._createOperatorDropdown();
      this._createOperandColumn();

      return this;
    }
  });
}

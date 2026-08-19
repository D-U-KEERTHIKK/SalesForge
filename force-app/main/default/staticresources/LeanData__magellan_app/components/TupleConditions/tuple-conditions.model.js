module.exports = function() {
  Magellan.Models.TupleConditions = Backbone.Model.extend({
    defaults: {

    },

    initialize: function(config) {
      this.set({
        'data': config.data || {},
        'selectedRoutingType': config.selectedRoutingType || 'New',
        'fieldObjectType': config.fieldObjectType || 'Lead',
        'operandObjectType': config.operandObjectType || 'Lead',
        'flattenField': config.flattenField || false,
        'flattenOperand': config.flattenOperand || false,
        'conditions': config.conditions || [],
        'logic': config.logic || '',
        'rpnLogic': config.rpnLogic || [],
        'rpnLogicErrorMessages': [],
        'hideToggleColumn': config.hideToggleColumn || false,
        'enableSearch': config.enableSearch,
        'operandHeader': config.operandHeader || 'Value',
        'showSeparatorPerRow': config.showSeparatorPerRow || false,
        'filterOutTextArea': config.filterOutTextArea || false,
        'allowFormulaField': config.allowFormulaField || false,
        'allowDateLiterals': config.allowDateLiterals || false,
        'customPlaceholderText': config.customPlaceholderText || 'Input the API Name of the Value',
      });
      this.rpnLogicIsValid = true;
      if (config.logic && config.conditions) {
        let parsedLogicObject = this.getParsedLogicObject(config.logic);
        this.rpnLogicIsValid = this.isRpnLogicValid(parsedLogicObject);
      } 
      this.processData();
    },

    processData: function() {
      var data = this.get('data');

      var fieldData = {};
      var fieldObjectType = this.get('fieldObjectType');
      if (this.get('flattenField')) {
        fieldData[fieldObjectType] = _LeanData.Util.createFlattenedFields(data[fieldObjectType]);
      } else {
        fieldData[fieldObjectType] = data[fieldObjectType];
      }
      this.set('fieldData', fieldData);

      var operandData = {};
      var operandObjectType = this.get('operandObjectType');
      if (this.get('flattenOperand')) {
        operandData[operandObjectType] = _LeanData.Util.createFlattenedFields(data[operandObjectType]);
      } else {
        operandData[operandObjectType] = data[operandObjectType];
      }
      this.set('operandData', operandData);
    },

    addCondition: function(condition, logic) {
      // Add new or existing condition
      if (_.isEmpty(condition)) {
        condition = {
          'value/field':'value',
          'field':null,
          'type':null,
          'operator':null,
          'operand':null,
        };
      }
      var conditions = _.cloneDeep(this.get('conditions'));
      conditions.push(condition);
      this.set('conditions', conditions);

      this.parseLogic(logic);
      this.trigger('addedCondition');
    },

    deleteCondition: function(index) {
      var conditions = _.cloneDeep(this.get('conditions'));
      conditions.splice(index, 1);
      this.set('conditions', conditions);

      var num = conditions.length + 1;
      var re = new RegExp(' AND '+num+'| OR '+num, 'g');
      this.set('logic', this.get('logic').replace(re, ''));

      this.parseLogic(this.get('logic'));
      this.trigger('deletedCondition');
    },

    isRpnLogicValid: function (parsedLogicObject) {
      return parsedLogicObject.feedbackMessage.length === 0
    },

    getParsedLogicObject: function(logic) {
      let conditions = this.get('conditions');
      var newLogic = typeof logic !== 'undefined' ? logic : (conditions.length === 1 ? '1' : this.get('logic') + ' AND ' + conditions.length);
      return _LeanData.Util.parseLogic(conditions.length, newLogic, true);
    },

    parseLogic: function(logic) {
      var conditions = this.get('conditions');

      let parsedLogicObject = this.getParsedLogicObject(logic);
      var newLogic = typeof logic !== 'undefined' ? logic : (conditions.length === 1 ? '1' : this.get('logic') + ' AND ' + conditions.length);

      this.set('logic', newLogic);
      this.set('rpnLogic', parsedLogicObject.RPNTokens);
      this.rpnLogicIsValid = this.isRpnLogicValid(parsedLogicObject);
      this.set('rpnLogicErrorMessages', parsedLogicObject.feedbackMessage);
    },

    setDefaultLogic: function() {
      var conditions = this.get('conditions');
      var logic = [];
      for (var i = 0; i < conditions.length; i++) {
        logic.push(i + 1);
      }
      var logicString = logic.join(' AND ');
      this.parseLogic(logicString);
      this.trigger('resetLogic');
    },

    validate: function() {
      var valid = true;
      var conditions = this.get('conditions');

      // Parse current logic when validating
      this.parseLogic(this.get('logic'));

      // Check if logic is valid, and there is at least 1 condition
      valid = valid && this.rpnLogicIsValid;
      valid = valid && conditions.length > 0;

      // Check if each condition entry/row is valid
      _.each(conditions, (condition, idx) => {
        var conditionValid = Magellan.Validation.validateSingleCondition(condition, this.get('fieldObjectType'), this.get('operandObjectType'));
        valid = valid && conditionValid === true;
      });

      return valid;
    },

  });
}

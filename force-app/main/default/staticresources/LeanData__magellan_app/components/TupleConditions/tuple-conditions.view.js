module.exports = function() {
  require('./tuple-conditions.model')();

  Magellan.Views.TupleConditions = Backbone.View.extend({
    className: 'tuple-conditions-wrapper',
    template: _.template(require('./tuple-conditions.template.html')),
    initialize: function(config) {
      this.model = new Magellan.Models.TupleConditions(config);
      
      this.listenTo(this.model, 'addedCondition', this.render);
      this.listenTo(this.model, 'deletedCondition', this.render);
      this.listenTo(this.model, 'resetLogic', this.render);
      this.customRPNValidation = config.customRPNValidation && config.customRPNValidation.constructor.name === "AsyncFunction" ? config.customRPNValidation : null;
      
      this.render();
    },

    events: {
      'click .add-tuple-condition-btn': 'addConditionButtonHandler',
      'click .reset-tuple-rule-logic': 'setDefaultLogic',
      'keyup .tuple-rule-logic-input': 'ruleLogicInputHandler',
    },

    returnModelValues: function() {
      return this.model.toJSON();
    },

    returnConditionValues: function() {
      return {
        conditions: this.model.get('conditions'),
        logic: this.model.get('logic'),
        rpnLogic: this.model.get('rpnLogic'),
      }
    },

    validate: function() {
      return this.model.validate();
    },

    setDefaultLogic: function() {
      this.model.setDefaultLogic();
    },

    ruleLogicInputHandler: async function(e) {
      var $ruleLogicInput = $(e.target);
      var logic = $ruleLogicInput.val();
      
      this.model.parseLogic(logic);
      
      var isRPNValid = this.model.isRpnLogicValid(this.model.getParsedLogicObject(logic));
      var customValidationError = '';
      if (this.customRPNValidation) {
        customValidationError = await this.customRPNValidation();
        isRPNValid = isRPNValid && _.isEmpty(customValidationError);
      }

      var $ruleErrorDiv = this.$el.find('.rule-logic-error-row')
      if (!isRPNValid) {
        $ruleLogicInput.toggleClass('input-invalid', true);
        var errorMessages = [];
        if (!_.isEmpty(this.model.get('rpnLogicErrorMessages')[0])) errorMessages.push(this.model.get('rpnLogicErrorMessages')[0]);
        if (!_.isEmpty(customValidationError)) errorMessages.push(customValidationError);
        $ruleErrorDiv.html(errorMessages.join('; '));
        $ruleErrorDiv.show();
      } else {
        $ruleLogicInput.toggleClass('input-invalid', false);
        $ruleErrorDiv.html('');
        $ruleErrorDiv.hide();
      }
      this.model.trigger('conditionChange', this.model.toJSON());
    },

    addConditionButtonHandler: function(e) {
      this.addCondition(null);
    },

    addCondition: function(params) {
      this.model.addCondition(params);
    },

    createRuleRows: function() {
      var $conditionsRow = this.$el.find('.tuple-conditions-row');
      $conditionsRow.empty();

      var conditions = this.model.get('conditions');

      if (conditions.length === 0) {
        this.addCondition(null);
      } else {
        _.each(conditions, (condition, idx) => {
          var condRow = new Magellan.Views.SingleTupleCondition({
            idx: idx,
            model: this.model,
            condition: condition,
          });
          $conditionsRow.append(condRow.$el);
        });

        this.model.validate();
      }
    },

    render: function() {
      var content = this.template({
        fieldObjectType: _LeanData.MetaDataController.getObjectMetaDataObject(this.model.get('fieldObjectType'), true).label || this.model.get('fieldObjectType'),
        operandObjectType: this.model.get('operandObjectType'),
        logic: this.model.get('logic'),
        showRpnContent: this.model.get('conditions').length > 1,
        rpnLogicIsValid: this.model.rpnLogicIsValid,
        operandHeader: this.model.get('operandHeader'),
        showSeparatorPerRow: this.model.get('showSeparatorPerRow'),
      });
      this.$el.html(content);
      this.model.trigger('conditionChange', this.model.toJSON());

      this.createRuleRows();

      return this;
    }
  });
}

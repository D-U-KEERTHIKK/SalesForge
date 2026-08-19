module.exports = function() {
  return Backbone.View.extend({
    className: 'relative-date-modal',
    $duration: null,
    $durationValue: null,
    $durationLabel: null,

    initialize: function(options) {
      this.nodeModel = options.nodeModel;
      this.selections = options.selections;
      this.isComparison = options.nodeModel != null && options.nodeModel.isComparison == true;
      if (this.selections && this.selections.length && this.selections[0].type === 'DATETIME') {
        this.isDatetime = true; 
      } else {
        this.isDatetime = options.isDatetime === true;
      }
      this.onSelect = _.isFunction(options.onSelect) ? options.onSelect : _.noop;
      this.beforeAfterSelection = 'After';
      this.name = options.name;
    },

    template: _.template(require('./relative-date-modal.template.html')),

    render: function() {
      var content = this.template({
        isDatetime: this.isDatetime, 
        isComparison : this.isComparison
      });
      this.$el.html(content);

      this.$beforeAfterDropdown = new Magellan.Views.LDDropdown( {
        value: 'After',
        options: ['After','Before'],
        required: false,
        onChange: (selectedVal) => {
          this.beforeAfterSelection = selectedVal;
        }
      });
      this.$el.find('#beforeAfterDropdown').html(this.$beforeAfterDropdown.$el);
      return this;
    },
    
    events: {
      "input input[id=duration-value]": 'isValidDuration',
      "change input[id=duration-num]": 'isValidDuration'
    },

    isValidDuration: function(e) {
      let val = this.$el.find('#duration-value').val();
      if (val === '') {
        this.relativeDateModal.disablePrimaryButton();
      }
      else {
        this.relativeDateModal.enablePrimaryButton();
      }
		},

    onSelect: _.noop,

    toggleDisabledInputs: function() {
      var durationValueDisabled = !(this.$el.find('input[name="duration"]:checked').val() === 'beforeAfter');
      this.$durationValue.prop('disabled', durationValueDisabled);
      if (durationValueDisabled) {
        this.$durationLabel.addClass('disabled-label');
        this.$beforeAfterDropdown.addClass('disabled');
        this.relativeDateModal.enablePrimaryButton();
      } else {
        this.$durationLabel.removeClass('disabled-label');
        this.$beforeAfterDropdown.removeClass('disabled');
      }

      if (!(durationValueDisabled)) {
        this.$el.find('label[for="duration-today"]').addClass('disabled-label');
      } else {
        this.$el.find('label[for="duration-today"]').removeClass('disabled-label');
      }
    },

    generateString: function() {
      const todayOrNow = this.isDatetime ? '[!Datetime.now()]' : '[!Datetime.today()]';
      const checkedOption = this.$el.find('input[name="duration"]:checked').val();
      let durationValue;

      switch (checkedOption) {
        case 'today':
          durationValue = '0';
          break;
        case 'beforeAfter':
          durationValue = this.$durationValue.val();
          if (this.beforeAfterSelection === 'Before') {
            durationValue = '-' + durationValue;
          }
          break;
      }

      return `[!Datetime.daysAfter(${todayOrNow},${durationValue})]`;
    },

    open: function() {
      this.relativeDateModal = new Magellan.Views.ConfirmationModal({
        header: 'Insert - Relative Date',
        contentElement: this.render().$el,
        primaryButtonText: 'Insert',
        secondaryButtonText: 'Cancel',
        isDatetime: this.isDatetime,
        onConfirmed: () => {
          return this.onSelect(this.generateString());
        }
      });
      this.relativeDateModal.open();
      this.$duration = this.$el.find('input[name="duration"]');
      this.$durationValue = this.$el.find('input[name="duration-value"]');
      this.$durationLabel = this.$el.find('.duration-label');
      this.$beforeAfterDropdown = this.$el.find('#beforeAfterDropdown');
      
      let insertFieldString = ' ' + (this.name ? this.name + ' ' : ((this.selections && this.selections.length > 0) ? (this.selections[0].label + ' ') : ''));
      this.$el.find('.relative-date-modal-text').text('Specify a relative date to insert in the' + insertFieldString + 'field.');
      if (this.isComparison) {
        ld_initializeToolTip(this.$el.find(".comparison-tooltip"), {
          title: "Relative Date Comparison",
          body: "LeanData compares the dates of the selected fields (not date/time)."
        });
      }
      this.relativeDateModal.enablePrimaryButton();
      this.toggleDisabledInputs();
      this.$duration.on('input', () => {
        this.toggleDisabledInputs();
      });
    }
  });
}

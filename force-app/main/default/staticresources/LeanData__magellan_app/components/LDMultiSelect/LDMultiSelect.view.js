module.exports = function() {
  var Magellan = window.Magellan = window.Magellan || Magellan || {};
  window.LD_MULTI_SELECT_DROPDOWN_MAP = window.LD_MULTI_SELECT_DROPDOWN_MAP || {};

  // Clicking out of the multi select will close all multi selects
  $(window).click(function(e){
    e.stopPropagation();
    var el = $(e.target);
    if (el.parents('.multiselect-dropdown').length === 0 && !el.hasClass('multiselect-dropdown')) {
      var lastOpenMultiSelect = $('.multiselect-dropdown.open');
      lastOpenMultiSelect.toggleClass('open', false);
      if (lastOpenMultiSelect.length > 0) {
        var lastMultiselectView = lastOpenMultiSelect.parent();
        var msdView = window.LD_MULTI_SELECT_DROPDOWN_MAP[lastMultiselectView[0].className];
        if (msdView) {
          var selectedItems = msdView._getSelectedItems(true);
          msdView.onCloseCallback(selectedItems.string, selectedItems.object);
        }
      }
    }
  });

  // Directly attach multi select to a DOM element
  $.fn.MultiSelectDropdown = function(config) {
    var currentClasses = $(this)[0].className;

    if (config === 'MultiSelectDropdown') {
      return window.LD_MULTI_SELECT_DROPDOWN_MAP[currentClasses] || null;
    }

    var MultiSelectDropdownView = new Magellan.Views.MultiSelectDropdown(config);
    $(this).html(MultiSelectDropdownView.$el);
    window.LD_MULTI_SELECT_DROPDOWN_MAP[currentClasses] = MultiSelectDropdownView;

    return MultiSelectDropdownView;
  };

  var MultiSelectDropdownModel = Backbone.Model.extend({
    defaults: {
      options: []
    }
  });

  Magellan.Views.MultiSelectDropdown = Backbone.View.extend({
    tagName: 'div',
    template: _.template(require('./LDMultiSelect.template.html')),
    optionTemplate: _.template(require('./LDMultiSelectOption.template.html')),
    initialize: function(config) {
      config = config || {};
      this.model = new MultiSelectDropdownModel({ options: config.options || [] });

      this.dropdownType = config.dropdownType || 'items';
      this.placeholder = config.placeholder || 'Select ' + this.dropdownType;
      this.allSelectedPlaceholder = 'All ' + this.dropdownType + ' selected';
      this.selectAll = config.selectAll || false;
      this.selected = config.selectedOptions || [];
      this.labelPropertyName = config.customLabelProperty || 'label';
      this.valuePropertyName = config.customValueProperty || 'value';
      this.generatePlaceholder = typeof config.generatePlaceholder === 'function' ? config.generatePlaceholder : null;
      this.onChangeCallback = typeof config.onChange === 'function' ? config.onChange : _.noop;
      this.onCloseCallback = typeof config.onClose === 'function' ? config.onClose : _.noop;
      this.hasAdaptiveDropdownWidth = config.hasAdaptiveDropdownWidth;
      this.dropdownWidth = (!this.hasAdaptiveDropdownWidth) ? config.dropdownWidth : null; 
      this.size = config.size && config.size === 'large' ? 'large' : 'small';
      this.checkboxClass = 'cb-container-' + this.size;
      this.$el.prop('class', 'multiselect-dropdown multiselect-dropdown-' + this.size);

      this.listenTo(this, 'setToggleCheckboxState', this.setToggleCheckboxState);

      this.render();
    },

    events: {
      'mouseup .multiselect-dropdown-option-list-item': 'selectOption',
      'mouseup .multiselect-toggle-all-list-item': 'toggleAllOptions',
      'mouseup': 'toggleDropdown'
    },

    toggleDropdown: function(e) {
      e.stopPropagation();
      var el = $(e.target);
      var thisDropdown = el.closest('.multiselect-dropdown');
      var isOpen = thisDropdown.hasClass('open');
      if (el.parents('.multiselect-dropdown-menu').length === 0 && !el.hasClass('multiselect-dropdown-menu')) {
        $('.multiselect-dropdown.open').not(thisDropdown).toggleClass('open', false);
        thisDropdown.toggleClass('open').find('.multiselect-dropdown-toggle').focus();
        if (isOpen) {
          var selectedItems = this._getSelectedItems(true);
          this.onCloseCallback(selectedItems.string, selectedItems.object);
          this.trigger('MultiSelectDropdown:close', selectedItems.string, selectedItems.object, this);
        }
      }
      if (this.hasAdaptiveDropdownWidth) this._setDropdownWidth.bind(this)();
    },

    toggleAllOptions: function(e) {
      var toggleCheckbox = $(e.currentTarget).find('input[type="checkbox"]');
      var listItemCheckboxes = this.$el.find('.multiselect-dropdown-option-list-item input[type="checkbox"]');
      toggleCheckbox.prop('checked', !toggleCheckbox.is(':checked'));
      listItemCheckboxes.prop('checked', toggleCheckbox.is(':checked'));
      
      var selectedItems = this._getSelectedItems(true);
      var totalSelected = selectedItems.string.length;
      var totalOptions = this.model.get('options').length;

      if(_.isNull(this.generatePlaceholder)) {
        this.$el.find('.placeholder-text').text(toggleCheckbox.is(':checked') ? this.allSelectedPlaceholder : this.placeholder);
      } else {
        this.$el.find('.placeholder-text').html(this.generatePlaceholder(null, selectedItems.string, selectedItems.object, totalOptions, this.dropdownType));
      }
      this.$el.find('.toggleText').text(toggleCheckbox.is(':checked') ? 'Deselect All' : 'Select All');

      this.onChangeCallback(null, selectedItems.string, selectedItems.object, totalOptions);
      this.trigger('MultiSelectDropdown:select', null, selectedItems.string, selectedItems.object, totalOptions, this);
      this.trigger('setToggleCheckboxState', totalSelected === totalOptions, totalSelected, totalOptions);
    },

    checkAllOptions: function(e) {
      let toggleCheckbox = $(e.currentTarget).find('input[type="checkbox"]');
      let listItemCheckboxes = this.$el.find('.multiselect-dropdown-option-list-item input[type="checkbox"]');
      toggleCheckbox.prop('checked', true);
      listItemCheckboxes.prop('checked', true);
      
      let selectedItems = this._getSelectedItems(true);
      let totalSelected = selectedItems.string.length;
      let totalOptions = this.model.get('options').length;

      if(_.isNull(this.generatePlaceholder)) {
        this.$el.find('.placeholder-text').text(this.allSelectedPlaceholder);
      } else {
        this.$el.find('.placeholder-text').html(this.generatePlaceholder(null, selectedItems.string, selectedItems.object, totalOptions, this.dropdownType));
      }
      this.$el.find('.toggleText').text('Select All');

      this.onChangeCallback(null, selectedItems.string, selectedItems.object, totalOptions);
      this.trigger('MultiSelectDropdown:select', null, selectedItems.string, selectedItems.object, totalOptions, this);
      this.trigger('setToggleCheckboxState', totalSelected === totalOptions, totalSelected, totalOptions);
    },

    setToggleCheckboxState: function(allSelected, selectedCount, totalCount) {
      var cb = this.$el.find('.multiselect-toggle-all-list-item input[type="checkbox"]');
      cb.prop('checked', allSelected);
      this.$el.find('.toggleText').text(allSelected ? 'Deselect All' : 'Select All');
    },

    selectOption: function(e) {
      var targetEl = $(e.currentTarget).find('input[type="checkbox"]');
      targetEl.prop('checked', !targetEl.is(':checked'));
 
      var value = targetEl.data('value');
      var selectedItems = this._getSelectedItems(true);
      var totalSelected = selectedItems.string.length;
      var totalOptions = this.model.get('options').length;

      if(!_.isNull(this.generatePlaceholder)) {
        this.$el.find('.placeholder-text').html(this.generatePlaceholder(null, selectedItems.string, selectedItems.object, totalOptions, this.dropdownType));
      } else if (totalSelected === totalOptions) {
        this.$el.find('.placeholder-text').text(this.allSelectedPlaceholder);
      } else if (totalSelected > 0) {
        this.$el.find('.placeholder-text').text(totalSelected + ' of ' + totalOptions + ' ' + this.dropdownType + ' selected');
      } else {
        this.$el.find('.placeholder-text').text(this.placeholder);
      }

      this.onChangeCallback(value, selectedItems.string, selectedItems.object, totalOptions);
      this.trigger('MultiSelectDropdown:select', value, selectedItems.string, selectedItems.object, totalOptions, this);
      this.trigger('setToggleCheckboxState', totalSelected === totalOptions, totalSelected, totalOptions);
    },

    _getSelectedItems: function(returnBothFormats) {
      var valuesArr = [];
      var objectArr = [];
      var allSelectedItems = this.$el.find('.' + this.checkboxClass + ' input[type="checkbox"]:checked');
      _.each(Array.prototype.slice.apply(allSelectedItems), (item) => {
        // Toggle all checkbox will not have any data and should be excluded in general
        var data = $(item).data();
        if (!_.isEmpty(data)) {
          var obj = {};
          obj[this.labelPropertyName] = data.label;
          obj[this.valuePropertyName] = data.value;
          objectArr.push(obj);
          valuesArr.push(obj[this.valuePropertyName]);
        }
      });
      return returnBothFormats ? { 'object': objectArr, 'string': valuesArr } : valuesArr;
    },

    _updateSelectList: function(options) {
      this.model.set('options', options || []);
      this._renderSelectList();
    },

    _renderSelectList: function() {
      var options = this.model.get('options');
      var optionList = '';
      this.$el.find('.multiselect-dropdown-option-list-item').remove();
      _.each(options, (option) => {
        var listItem = this.optionTemplate({
          label: option[this.labelPropertyName],
          value: option[this.valuePropertyName],
          checkboxClass: this.checkboxClass,
        });
        optionList += listItem;
      });

      if (options.length > 0) {
        this.$el.find('.multiselect-toggle-all-list-item').show();
        this.$el.find('.multiselect-dropdown-menu').append(optionList);
        if (this.selectAll || _.isEmpty(this.selected)) {
          this.$el.find(`.${this.checkboxClass} input[type="checkbox"]`).prop('checked', this.selectAll);
        } else {
          this.selected.forEach((option) => {
            this.$el.find(`.${this.checkboxClass} input[type="checkbox"][data-value="${option}"]`).prop('checked', true);
          });
        }

        this.$el.find('.toggleText').text(this.selectAll ? 'Deselect All' : 'Select All');
      } else {
        this.$el.find('.multiselect-toggle-all-list-item').hide();
      }

      var selectedItems = this._getSelectedItems(true);
      var totalSelected = selectedItems.string.length;
      var totalOptions = this.model.get('options').length;

      if(!_.isNull(this.generatePlaceholder)) {
        this.$el.find('.placeholder-text').html(this.generatePlaceholder(null, selectedItems.string, selectedItems.object, totalOptions, this.dropdownType));
      } else if(options.length > 0) {
        this.$el.find('.placeholder-text').text(this.selectAll ? this.allSelectedPlaceholder : this.placeholder);
      } else {
        this.$el.find('.placeholder-text').text('No ' + this.dropdownType + ' to select');
      }

      setTimeout(this._setDropdownWidth.bind(this));
    },

    _setDropdownWidth: function() {
      var dropdownEl = this.$el.find('.multiselect-dropdown-menu');
      var contentWidth = this.$el.width();
      var dropdownWidth = dropdownEl.width();
      if (this.hasAdaptiveDropdownWidth || dropdownWidth < contentWidth) {
        dropdownEl.css({'width': contentWidth + 32});
      } else {
        this.$el.css({'width': this.dropdownWidth|| (dropdownWidth + 2)});
      }
    },

    render: function() {
      var content = this.template({
        placeholder: this.placeholder,
        allSelectedPlaceholder: this.allSelectedPlaceholder,
        selectAll: this.selectAll,
        checkboxClass: this.checkboxClass,
      });
      this.$el.html(content);

      this._renderSelectList();

      return this;
    }
  });
}

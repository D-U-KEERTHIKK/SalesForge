module.exports = function(){
    /**
   * MultiNestedFieldSelect component
   * @description: render a dropdown select that allows user to search for a field given a root object
   *      or a field in another object which the root object references and allows you to select multiple objects.
   * @object: an object has "label", "name", and ("parent" which is an array of keys to a other objects)
   */

  var fieldSelectionTemplate = require("./multiple-field-selection.template.html");
  var multiSelectionTemplate = require("./multi-select.template.html")

  const nestingFieldTypes = new Set([
    'REFERENCE',  // standard reference fields from fieldMetaData
    'SOBJECT',  // variables
    'Team',  // Microsoft Teams
  ]);

  var hasChildren = function (obj) {
    return obj && nestingFieldTypes.has(obj.type);
  } // helper

  var model = Magellan.Models.MultiNestedTypeaheadSelector = Magellan.Models.NestedTypeaheadSelector.extend({
    defaults: {}
  });

  Magellan.Views.MultiNestedTypeaheadSelector = Magellan.Views.NestedTypeaheadSelector.extend({

    multiSelectTemplate: _.template(multiSelectionTemplate),
    events: {
        'click .tt-custom-input' : '_onCustomInputSelect',
        'click .multi-nestedtypeahead-checkbox': '_onSelectCheckBox',
        'typeahead:autocomplete .typeahead': '_selectFirstItemOnMenu',
        'typeahead:render .typeahead': '_onSuggestionsRendered',
        'input .typeahead': '_onInputChange',
        'blur .typeahead': function (evt) {
          this._setInputValueWithSelected(evt, true);
        },
        'focus .typeahead': function (evt) {
            this.$('.tt-custom-input').toggleClass('hidden', true); 
            this.$(evt.target).typeahead('val', '');
            this._refreshSelectionBreadcrumbs();
        }
    },

    initialize: function(options){
      this.type = options.type || 'PICKLIST';
      this.multiSelect = true;
      Magellan.Views.MultiNestedTypeaheadSelector.__super__.initialize.apply(this, arguments);
      this.selection = [];
      // attach components to template and render
      this.selectionTemplate = _.template(fieldSelectionTemplate);
      this.render();
      if (options.selection) this.setSelection(options.selection);
    },

    processFetchedData: function(fetchedData, options) {
      var parsedData = JSON.parse(fetchedData);
      this.model = new model(parsedData);
      this.bloodHound = options.asyncServiceCall != undefined ? this._getAsyncBloodHound(options.asyncServiceCall) : this._getBloodHound(this.model.get(this.root));
      this.searchEngine = this._getSearchEngine(this.bloodHound);
      this.render();
      if (options.selection) this.setSelection(options.selection);       
    },

    getTypeaheadConfigurations: function (name, searchEngine) {
      var context = this;
      var noSuggestionTemplate = context.requireSelectionFromData ? context.notFoundTemplate : function() { return '<div></div>'; };
      var config = {
        name: name || 'multi-nested-typeahead-selector',
        limit: 1000, //For async functions, ensure the method that fetches results returns a LIMIT 100~ to improve performance
        display: function (obj) {
          if (hasChildren(obj)) return obj['label'].replace(' ID', '');
          else if (context.multiSelect) return obj['label'].replace(' ID', ', ');
          else return obj['label'];
        },
        source: searchEngine,
        templates: {
          header: _.template('<div class="mnts-selected-field-container"></div>'),
          suggestion: function (obj) {
            var templateData = {
              suggestion: obj,
              title: obj.name
            };
            if (obj.isCategoryLabel) {
              return context.categoryLabelTemplate(templateData);
            } else {
              return context.multiSelectTemplate(templateData);
            }
          },
          notFound: noSuggestionTemplate
        }
      };
      return config;
    },

    _onCustomInputSelect: function (evt) {
      var selectedText = $(evt.currentTarget).text();
      var customObj = _.find(this.model.get(this.root) || this.lastReceivedResult || [], (option) => {
        return option.label === selectedText;
      });
      if (!customObj) {
        customObj = _LeanData.Util.convertStringSelectionToArray(selectedText)[0];
        customObj['custom'] = true;
      }

      var indexInSelection = this._indexInSelection(customObj);
      var data = this.model.get(this.root) || this.lastReceivedResult || [];
      if (indexInSelection !== -1 ) {
        this.selection.splice(indexInSelection, 1);
        data = this._removeCustomObjectFromData(data, customObj);
      } else {
        this.selection.push(customObj);
        if (customObj.custom) data.push(customObj);
      }
      this._resetBloodHoundData(data);
      this._refreshSelectionBreadcrumbs();
      this.onSelectCallback(this, this.selection);
      this.$('.typeahead.tt-input').blur();
      this.customInputSelect = true;
    },

    _removeCustomObjectFromData: function(data, obj) {
      if (obj.custom) {
        for (var i = data.length - 1; i >= 0; i--){
          if (obj.label === data[i].label && obj.name === data[i].name) {
            data.splice(i, 1);
            break;
          }
        }
      }
      return data;
    },

    _onSelectCheckBox: function (evt, selected) {
      var targetE = $(evt.currentTarget);
      var isChecked = targetE.is(':checked')
      var label = targetE.data('label').toString();

      var optionObj = _.find(this.model.get(this.root) || this.lastReceivedResult || [], (option) => {
        return option.label === label;
      });

      var objIndex = this._indexInSelection(optionObj)

      if (isChecked && objIndex == -1){
        this.selection.push(optionObj);
      } else {
        this.selection.splice(objIndex, 1);
        if (optionObj['custom']) {
          var data = this.model.get(this.root) || this.lastReceivedResult || [];
          data = this._removeCustomObjectFromData(data, optionObj);
          this._resetBloodHoundData(data);
        }
      }

      this._refreshSelectionBreadcrumbs();

      if (_.isEmpty(this.bloodHound.remote)) this._refreshSelectionMenu(false);
      else this.$('.typeahead').focus();

      this.onSelectCallback(this, this.selection);
    },
    _refreshSelectionBreadcrumbs: function () {
      var renderedSelection = this.selectionTemplate({
        root: this.root,
        selection: this.selection,
        currentCustomValue: this.currentCustomValue,
        type: this.type,
      });

      if (this.breadcrumbsEl) this.breadcrumbsEl.remove();
      this.breadcrumbsEl = $(renderedSelection);
      this.$('.tt-menu').prepend(this.breadcrumbsEl);
    },

    _indexInSelection: function(obj) {
      for(var i = 0; i < this.selection.length; i++){
        if (obj.label === this.selection[i].label && obj.name === this.selection[i].name) {
          return i;
        }
      }
      return -1;
    },

    setSelection: function(newSelection) {
      if (!newSelection) return false;
      //This will split all of the labels into recognizeable labels
      if (newSelection.length > 0){
        this.selection = [];
        //handle labels with labels surrounded by quotes in them
        var data = this.model.get(this.root) || this.lastReceivedResult || [];
        if (newSelection[0].name.constructor == Array) {
          var names = newSelection[0].name;
        } else {
          var names = (this.type === 'PICKLIST') ? newSelection[0].name.split(/,/) : newSelection[0].name.split(/;/);
        }
        for (var i = 0; i < names.length; i++){
          names[i] = names[i].trim();
          var optionObj = _.find(this.model.get(this.root) || this.lastReceivedResult || [], (option) => {
            return option.name === names[i];
          });
          if (!optionObj) {
            optionObj = _LeanData.Util.convertStringSelectionToArray(names[i])[0];
            // if option the string now exists push into model and make it custom else do nothing
            if (optionObj) {
              optionObj.custom = true;
              data.unshift(optionObj);
            }
          }
          if (optionObj && this._indexInSelection(optionObj) == -1 ) {
            this.selection.push(optionObj);
          }
        }
        this._resetBloodHoundData();
        this.$('.typeahead.tt-input').blur();
      }
    },

    _setInputValueWithSelected: function (evt, closeFlag=false) {
      var punct = (this.type === 'PICKLIST') ? ', ' : '; ';
      var inputValue = this.selection.map(function (item) {
        var itemLabel = hasChildren(item) ? item['label'].replace(' ID', '') : item['label'];
        if(punct === ', ' && itemLabel.includes(',')) itemLabel = JSON.stringify(itemLabel);
        return htmlDecode(itemLabel);
      });
      
      //behavior as of original nestedtypeahead 
      if (this.requireSelectionFromData) {
        this.$(evt.target).typeahead('val', inputValue);
      }
      else if (this.currentTextValue !== '' && this.customInputSelect) {
        this.$(evt.target).typeahead('val', this.currentTextValue);
        this.$el.trigger("multiNestedTypeaheadSelector:select", this);
      }
      //a selection has been made without requireSelectionFromData, emptyTextDesired differentiates this case from when user deletes stuff from input field
      else if (inputValue !== null && inputValue !== '' && !this.emptyTextDesired) {
        this.$(evt.target).typeahead('val', inputValue);
        this.$el.trigger("multiNestedTypeaheadSelector:select", this);
      }
      else if (inputValue !== null && inputValue !== '' && closeFlag) {
        this.$(evt.target).typeahead('val', inputValue);
        this.$el.trigger("multiNestedTypeaheadSelector:select", this);
      }
      else {
        this.$(evt.target).typeahead('val', this.currentTextValue);
        this.$el.trigger("multiNestedTypeaheadSelector:select", this);
      }
      this.customInputSelect = false;
      this.validate();
    },
  });
};

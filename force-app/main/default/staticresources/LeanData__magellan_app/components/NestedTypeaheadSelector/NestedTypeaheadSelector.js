module.exports = function() {
    /**
     * NestedTypeaheadSelector component
     * 
     * @description: render a dropdown select that allows user to search for a field given a root object
     *      or a field in another object which the root object references.
     * 
     * @param asyncServiceCall
     *   Callback that takes one param (user's string input in typeahead)
     *   and returns a promise which resolves with a list of filtered
     *   objects with 2-3 key-value pairs (custom keys can exist also):
     *   {
     *     name: 'foo', // string
     *     label: 'bar', // string
     *     parents: [] // optional, array of keys to a other objects
     *   }
     * 
     *   NOTE: the first item (index 0) of the returned list helps
     *         populate the suggestion (via Bloodhound, the suggestion engine)
     * 
     * @param size
     *   optional (defaults to 'small')
     *   can be 'large', 'small' or 'xtra-small'
     * 
     * See https://twitter.github.io/typeahead.js/examples/ for more info
     * on generic typeahead.js uses.
     */

    var template = require("./NestedTypeaheadSelector.template.html");
    var fieldSelectionTemplate = require("./field-selection.template.html");
    
    const nestingFieldTypes = new Set([
      'REFERENCE',  // standard reference fields from fieldMetaData
      'SOBJECT',  // variables
      'Team',  // Microsoft Teams
    ]);
  
    var hasChildren = function (obj) {
      return obj && nestingFieldTypes.has(obj.type);
    } // helper

    Magellan = Magellan || {};
    Magellan.Models = Magellan.Models || {};
    Magellan.Views = Magellan.Views || {};

    var model = Magellan.Models.NestedTypeaheadSelector = Backbone.Model.extend({
        defaults: {}
    });

    Magellan.Views.NestedTypeaheadSelector = Backbone.View.extend({
        tagName: "span",
        selection: null,
        fieldSuggestionTemplate: _.template('<p title="<%-title%>"><%-suggestion.label%></p>'),
        categoryLabelTemplate: _.template('<p class="nts-category-label" title="<%-title%>"><%-suggestion.label%></p>'),
        objectSuggestionTemplate: _.template(
            '<p title="<%-title%>">' +
            '<span><%-suggestion.label.replace(" ID", "")%></span>' +
            '&nbsp;&nbsp;<span class="expand-arrow">▸</span>' +
            '</p>'
        ),
        disabledSuggestionTemplate: _.template(
            '<p class="disabled" title="<%-title%>">' +
            '<span><%-suggestion.label.replace(" ID", "")%></span>' +
            '&nbsp;&nbsp;<span class="expand-arrow">▸</span>' +
            '&nbsp;&nbsp;<span class="glyphicon glyphicon-warning-sign text-danger"></span>' +
            '</p>'
        ),
        disableSelectedFieldSuggestionTemplate: _.template('<p title="<%-title%>" class="disabled selected-option"><%-suggestion.label%></p>'),
        notFoundTemplate: _.template(
            '<div class="alert alert-danger" style="padding: 0 5px; margin: 0">No Suggestion Found.</div>'
        ),
        notFoundMetaDataTemplate: _.template(
          '<div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center">' +
          '<div class="alert alert-danger" style="padding: 0 5px; margin: 0">No Suggestion Found.</div>' +
          '<div class="refresh-icon" title="Refresh MetaData"></div>' +
          '</div>'
        ),
        customValueTemplate: _.template(
            '<div class="tt-dataset tt-dataset-nested-typeahead-selector">' + 
                '<div class="nts-selected-field-container">' + 
                    '<p title="" class="tt-suggestion tt-custom-input tt-selectable hidden"></p>' +
                '</div>' + 
            '</div>'
        ),
        bloodHound: null,
        searchEngine: null,
        breadcrumbsEl: null,
        customValueEl: null,
        onSelectCallback: null,
        onSelectPostCallback: null,
        filterSuggestions: null,
        currentCustomValue: null,
        events: {
          'click .tt-custom-input' : '_onCustomInputSelect',
          'typeahead:select .typeahead': '_onSelect',
          'typeahead:autocomplete .typeahead': '_selectFirstItemOnMenu',
          'typeahead:render .typeahead': '_onSuggestionsRendered',
          'input .typeahead': '_onInputChange',
          'keydown .typeahead': '_onKeyPress',
          'blur .typeahead': '_onBlurTypeahead',
          'focus .typeahead': function (evt) {
            this.$('.tt-custom-input').toggleClass('hidden', true); 
            this.$('.typeahead-input').attr('autocomplete', 'chrome-off');
            if (this.clearOnFocus) {
              this.$(evt.target).typeahead('val', '');
            }
            this._refreshSelectionBreadcrumbs();
            if (this.customOnFocusTypeahead) this.customOnFocusTypeahead(evt);
            this.$('.tt-hint').toggleClass('hidden', false);
          },
          'click .refresh-icon': '_refreshMetaData',
        },

        initialize: function (options) {
            // check for data
            var that = this;

            // getDynamicData will now support the same paramters as `data` function, so no need to define both data and getDynamicData moving forward
            this.getDynamicData = options.getDynamicData;
            if (this.getDynamicData && !options.data) {
              options.data = this.getDynamicData();
            }
            if (typeof options.data === 'object') {
                this.model = new model(options.data);
            } else if (typeof options.data === 'function') {
                this.processDataCallback = options.data;
                this.model = new model(options.data());
            } else if (options.model instanceof model) {
                this.model = options.model;
            } else {
                this.model = new model();
            }
            this.includeNoValueOption = typeof options.includeNoValueOption === 'boolean' ? options.includeNoValueOption : false;
            if (this.includeNoValueOption) this._insertNoValueOption();
            this.selection = [];
            this.customRootLabel = options.customRootLabel;
            this.root = options.root;
            this.placeholder = options.placeholder || 'Search';
            this.filterSuggestions = typeof options.filter === 'function' ? options.filter : null;
            this.onSelectCallback = typeof options.onSelect === 'function' ? options.onSelect : function() {};
            this.onSelectPostCallback = typeof options.onSelectPost === 'function' ? options.onSelectPost : function() {};
            this.refreshMetaDataPostCallback = typeof options.refreshMetaDataPostCallback === 'function' ? options.refreshMetaDataPostCallback : function() {};
            this.onInputChange = options.onInputChange;
            this.onEnter = options.onEnter;
            this.closeOnEnter = (options.closeOnEnter === true) || false;
            this.required = (options.required === true) || false;
            this.isOptionalTypeahead = typeof options.isOptionalTypeahead === 'boolean' ? options.isOptionalTypeahead : false;
            this.aliases = options.aliases || {};
            this.disableBreadcrumbs = typeof options.disableBreadcrumbs === 'boolean' ? options.disableBreadcrumbs : false;
            this.requireSelectionFromData = typeof options.requireSelectionFromData === 'boolean' ? options.requireSelectionFromData : true;
            this.emptyTextDesired = false;
            this.clearOnFocus = typeof options.clearOnFocus === 'boolean' ? options.clearOnFocus : true;
            this.minLength = options.minLength || null;
            if (typeof options.data === 'function' || typeof options.getDynamicData === 'function') {
              this.selectedNotFoundTemplate = this.notFoundMetaDataTemplate;
            } else if (this.requireSelectionFromData) {
              this.selectedNotFoundTemplate = this.notFoundTemplate;
            } else {
              this.selectedNotFoundTemplate = function() { return '<div></div>'; };
            }
            this.disableEmptySearchString = options.disableEmptySearchString || false;
            this.disableDownArrow = options.disableDownArrow || false;
            // if options.asynServiceCall is defined, the instance wants to have the remote functionality - thus initialize a different kind of bloodhound
            this.datumTokenizer = options.datumTokenizer;
            this.queryTokenizer = options.queryTokenizer;
            this.currentTextValue = options.currentTextValue ? options.currentTextValue : ''; //Tracks the current search so it does not get reset on clicking
            if (window._LeanData && window._LeanData.AppState.fromOverlord) {
              if (options.asyncServiceCall) {
                // async call handling for beacon, since we don't make any data-fetching async calls in beacon
                options.asyncServiceCall = ((value) => {
                  return new Promise((resolve) => {
                    resolve({
                      label: value,
                      name: value,
                      value: value,
                      parent: [],
                      type: 'STRING',
                    });
                  });
                });
              } else {
                if (!this.currentTextValue && !options.selection) {
                  let event = {
                    reason: 'Typeahead will be blank even if a value is currently selected',
                  };
                  if (window.backboneGlobalEmitter) window.backboneGlobalEmitter.emit(event);
                }
                this.currentTextValue = this.currentTextValue || (options.selection || []).map(e => e.name).join('.');
              }
            }
            this.bloodHound = _.isFunction(options.asyncServiceCall) ? this._getAsyncBloodHound(options.asyncServiceCall) : this._getBloodHound(this.model.get(this.root));
            this.currentCustomValue = {'label' : 'blah', 'name' : 'blah', 'isCustomValue' : true};
            this.customValidationFunction = _.isFunction(options.customValidationFunction) ? options.customValidationFunction : null;
            this.cachedValidValues = []; //async validation cache, do not have to requery to see if IDs exist
            this.customOnBlurTypeahead = options.customOnBlurTypeahead;
            this.customOnFocusTypeahead = options.customOnFocusTypeahead;
            this.asyncServiceCall = _.isFunction(options.asyncServiceCall) ? options.asyncServiceCall : null;
            //used for picklist typeahead, use when data fields are not loaded in metadata
            if (_.isFunction(options.fetchData)) {
                options.fetchData().then(function(fetchedData){
                    that.processFetchedData(fetchedData, options);    
                }).catch(function(result, event) {
                    that.render();
                    if (that.bloodHound) that.bloodHound.clear();
                    that.$('.typeahead-input').toggleClass('input-invalid', true);
                });
            }
            this.searchEngine = _.isUndefined(options.asyncServiceCall) ? this._getSearchEngine(this.bloodHound) : this.bloodHound;
            // typeahead size
            if (options.size) {
                this.$el.prop('class', 'nested-typeahead-selector typeahead-' + options.size);
            } else {
                this.$el.prop('class', 'nested-typeahead-selector typeahead-small');
            }

            if (options.classNames) {
                this.$el.addClass(options.classNames.join(' '));
            }
            // attach component templates and render

            this.template = _.template(template);
            this.selectionTemplate = _.template(fieldSelectionTemplate);
            if (options.customObjectSuggestionTemplate) {
              this.customObjectSuggestionTemplate = options.customObjectSuggestionTemplate;
            }

            this.render();

            if (options.selection) {
              // PERFORMANCE IMPROVEMENT NOTE:
              // In many cases `getDynamicData` and `selection` gets defined at the same time
              // That means `getDynamicData` will get called twice every time
              this.setSelection(this.includeNoValueOption && options.selection.length === 0 ? [{label: '< No Value >', name: ''}] : options.selection);
            }
            
            if (options.validateOnCreate) {
              this.validate();
            }
        },

        render: function () {
          this.$el.empty(''); // in the event of re-rendering
          this.$el.append(this.template(this));          
          this._initTypeahead(this.$('.typeahead'), this.searchEngine);
          if (this.currentTextValue) {
            this.$('.typeahead.tt-input').val(this.currentTextValue);
          }
          return this;
        },

        processFetchedData: function(fetchedData, options) {
          parsedData = JSON.parse(fetchedData);
          this.model = new model(parsedData);
          if (this.includeNoValueOption) this._insertNoValueOption();
          this.bloodHound = options.asyncServiceCall != undefined ? this._getAsyncBloodHound(options.asyncServiceCall) : this._getBloodHound(this.model.get(this.root));
          this.searchEngine = this._getSearchEngine(this.bloodHound);
          this.render();
        },

        getTypeaheadOptions: function () {
            return {
                hint: true,
                highlight: true,
                minLength: this.minLength ? this.minLength : (this.disableEmptySearchString ? 1 : 0)
            }
        },

        getTypeaheadConfigurations: function (name, searchEngine) {
            var context = this;
            var noSuggestionTemplate = context.selectedNotFoundTemplate;
            var config = {
                name: name || 'nested-typeahead-selector',
                limit: 1000, //For async functions, ensure the method that fetches results returns a LIMIT 100~ to improve performance
                display: function (obj) {
                    return obj['label'];
                },
                source: searchEngine,
                templates: {
                    header: _.template('<div class="nts-selected-field-container"></div>'),
                    suggestion: function (obj) {
                        var templateData = {
                            suggestion: obj,
                            title: obj.name
                        };
                        if (obj.isCategoryLabel) {
                            return context.categoryLabelTemplate(templateData);
                        } else if (obj.disabled) {
                            templateData.title = obj.disabledReason;
                            return context.disabledSuggestionTemplate(templateData);
                        } else if (hasChildren(obj)) {
                            if (context.selection.length >= 4) {
                                templateData.title = "Maximum number of objects selected reached.";
                                return context.disabledSuggestionTemplate(templateData);
                            } else {
                                return context.objectSuggestionTemplate(templateData);
                            }
                        } else if (context.customObjectSuggestionTemplate) {
                            const customTemplateMarkup = typeof context.customObjectSuggestionTemplate === 'function'
                              ? _.template(context.customObjectSuggestionTemplate(templateData.suggestion))
                              : _.template(context.customObjectSuggestionTemplate);
                            return customTemplateMarkup(templateData);
                        } else if (obj.disableSelectedField) {
                            return context.disableSelectedFieldSuggestionTemplate(templateData);
                        } else {
                            return context.fieldSuggestionTemplate(templateData);
                        }
                    },
                    notFound: noSuggestionTemplate
                }
            };

            return config;
        },

        setSelection: function(newSelection) {
          if (_.isEmpty(newSelection)) {
            if (this.currentTextValue) this.$('.tt-input').val(this.currentTextValue);
            return false;
          }
          this.selection = newSelection;
          this._resetBloodHoundDataUsingCurrentSelection();
          this.close();
        },
        
        fetchSelectionWithAsyncService(selectionId, onChange) {
            var promise = $.Deferred();
            if (!selectionId && !onChange) return promise.resolve();
              this.bloodHound.search(selectionId, () => {}, function(results) {
                this.setSelection(results);
                promise.resolve(results);
            }.bind(this));
            
            return promise;
        },

        /**
         * Refresh bloodhound and re-prefetch data from
         * source. In most cases can be used to clear
         * cached data and re-call asyncServiceCall.
         */
        refreshBloodhoundData: function () {
          this.searchEngine.initialize(true);
        },

        validate: function() {
            if (this.customValidationFunction) {
              this.$('.typeahead-input').toggleClass('input-invalid', !this.customValidationFunction(this));
              return this.customValidationFunction(this);
            }
            var that = this;

            var validationPromise = $.Deferred().always(function(isValid) {
                that.$('.typeahead-input').toggleClass('input-invalid', !isValid);
            });

            if (this.selection.length === 0) {
                return this.required ? validationPromise.reject() : validationPromise.resolve(true);
            } else {
                // validation for nested fields: only valid if hasChildren return false (leaf field)
                // ex: Lead.Account is invalid, Lead.Account.Id or Lead.AccountId is valid
                return hasChildren(this.selection[this.selection.length - 1]) ? validationPromise.reject() : validationPromise.resolve(true);
            }
        },

        close() {
          this.$('.typeahead.tt-input').blur();
        },

        _insertNoValueOption: function () {
            let newModel = this.model.attributes;
            Object.keys(newModel).forEach( (key) => {
                newModel[key].unshift({label: '< No Value >', name: ''});
            })
            this.model.set(newModel);
        },

        _getParentFields: function (objectKeys) {
            var context = this;
            var allFields = [];
            var aliases = this.aliases;
            var appendedFields = {};
            let standardFieldSet = new Set(['id']);
            let standardFieldMap = {} 
            // nested loops ok here, the number of objectKeys are small enough to not affect any performance
            _.each(objectKeys, function(objectKey) {
                var objectFields = context.model.get(objectKey);
                if (objectKeys.length > 1) {
                    // add in a fake Field item as Category label separator for displaying on the menu
                    allFields.push({label: objectKey, isCategoryLabel: true});
                }

                _.each(objectFields, function(field) {
                    var fieldFullName = objectKey + "." + field['name'];
                    // only add to fields list if NOT already aliased by other field before it
                    if (!field.isCategoryLabel && standardFieldSet.has(field.name.toLowerCase())) {
                      field.label = _LeanData.Util.capitalizeString(field.name, false);
                      standardFieldMap[field.name.toLowerCase()] = field;
                    } else {
                      if (!aliases.hasOwnProperty(fieldFullName) || !appendedFields.hasOwnProperty(aliases[fieldFullName])) {
                          allFields.push(field);
                          appendedFields[fieldFullName] = field;
                      }
                    }
                });
            });


            return [
              ...Object.values(standardFieldMap), 
              ...allFields
            ];
        },

        _resetBloodHoundData: function (newData) {
            if (this.bloodHound != null) this.bloodHound.clear();
            if (newData) this.bloodHound.local = newData;
            if (this.bloodHound != null) this.bloodHound.initialize(true);
        },

        _resetBloodHoundDataUsingCurrentSelection: function() {
          if (this.getDynamicData) {
            this.data = this.getDynamicData(this.selection);
            this.model.clear({ silent: true }).set(this.data);
          }
            var lastItemWithParent = null;
            for (var i = this.selection.length - 1; i >= 0; i--) {
                if (hasChildren(this.selection[i])) {
                    lastItemWithParent = this.selection[i];
                    break;
                }
            }

            if (this.selection.length === 0 || lastItemWithParent === null) {
                var rootDataset = this.model.get(this.root);
                if (rootDataset != null){
                    this._resetBloodHoundData(rootDataset);
                }
            } else {
                // if selected field has parent then we go one level in and refresh the menu with parents' fields
                const newDataset = this._getParentFields(lastItemWithParent.parent || (lastItemWithParent.sObject ? [lastItemWithParent.sObject] : []));
                if (newDataset != null) {
                    this._resetBloodHoundData(newDataset);
                }
            }
        },

        _onSuggestionsRendered: function(evt, suggestions) {
          this.emptyTextDesired = this.currentTextValue.length > 0 && this.$(evt.target).typeahead('val') == '';
          this.currentTextValue = this.$(evt.target).typeahead('val');
          
          this.$el.trigger('nestedTypeaheadSelector:onSuggestionsRendered', this);
          
            this.$('.tt-suggestion.disabled, .tt-suggestion.nts-category-label').on('click', function(e) {
               e.preventDefault();
               return false;
            });
        },

        _onInputChange: function(evt) {
          let updatedInput = $(evt.currentTarget).val();
          if (typeof this.onInputChange === 'function') {
            this.onInputChange(updatedInput);
          }
          if (this.requireSelectionFromData === false) {
            this.$('.tt-custom-input').text(updatedInput);
            this.$('.tt-custom-input')[0].title = updatedInput;
            if (updatedInput == '') {
              this.$('.tt-custom-input').toggleClass('hidden', true);           
            }
            else {
              this.$('.tt-custom-input').toggleClass('hidden', false);
            }
          }
        },

        _onCustomInputSelect: function (evt) {
          var selectedText = $(evt.currentTarget).text();
          this._addToSelection(_LeanData.Util.convertStringSelectionToArray(selectedText)[0]);
          this.$el.trigger("nestedTypeaheadSelector:select", this);
          this.onSelectCallback(this, this.selection);
          this.onSelectPostCallback(this, this.selection);
          this.close();
          this.customInputSelect = true;
        },

        _onSelect: function (evt, selected, isRefresh) {
            isRefresh ? this.setSelection(selected) : this._addToSelection(selected);
            this._refreshSelectionBreadcrumbs();
            this._resetBloodHoundDataUsingCurrentSelection();
            if (_.isEmpty(this.bloodHound.remote)) this._refreshSelectionMenu();

            this.$el.trigger("nestedTypeaheadSelector:select", this);
            this.onSelectCallback(this, this.selection);
            this.onSelectPostCallback(this, this.selection);
            if (!hasChildren(selected)) this.$('.typeahead-input').trigger('blur');
        },

        _selectFirstItemOnMenu: function (evt) {
            // on autocomplete select the first one on the list with the down arrow key
            var e = $.Event("keydown");
            e.keyCode = e.which = 40; // 40 === arrow down
            this.$(evt.target).triggerHandler(e);
        },

        _onBlurTypeahead: function (event) {
          // Phoenix rebase / security branch: was this supposed to be removed?
          // This was an item amber worked on, unless this got reverted at some point
          // Comment back in if auto-select item doesn't work
          /*if (this.selection.length > 0 && $(event.target).val() === '') {
            // If there is a last selected item and it's a reference field, find the next item and push
            const lastSelection = this.selection[this.selection.length - 1];
            if (lastSelection.type === 'REFERENCE') {
              let parentFields = this.model.get(lastSelection.parent[0]);
              if (typeof this.filterSuggestions === 'function') {
                parentFields = this.filterSuggestions(parentFields);
              }
              // Select the first non-reference field by default
              const fieldToPush = parentFields.find((field) => field.type !== 'REFERENCE');
              if (fieldToPush) {
                this.selection.push(fieldToPush);
              }
            }
          }*/

          this._setInputValueWithSelected(event);
          if (this.customOnBlurTypeahead) this.customOnBlurTypeahead(event);
          this.$('.tt-hint').toggleClass('hidden', true);
        },

        _onKeyPress: function (event) {
          if (event.keyCode === 13) { //prevent `enter` from clearing input
            if (typeof this.onEnter === 'function') {
              this.onEnter();
            }
            if (this.closeOnEnter) {
              this.close();
            }
            event.preventDefault();
            return false;
          }
        },

        _setInputValueWithSelected: function (evt) {
          if (this.isOptionalTypeahead) {
            return;
          }

          let inputValue = this.selection
            .map(item => item.label)
            .join('.');

          // behavior as of original nestedtypeahead 
          if (this.requireSelectionFromData) {
            this.$(evt.target).typeahead('val', inputValue);
          } else if (this.currentTextValue !== '' && this.customInputSelect) {
            this.$(evt.target).typeahead('val', this.currentTextValue);
            this._addToSelection(_LeanData.Util.convertStringSelectionToArray(this.currentTextValue)[0]);
            this.$el.trigger("nestedTypeaheadSelector:select", this);
          } else if (inputValue !== null && inputValue !== '' && !this.emptyTextDesired) {
            // a selection has been made without requireSelectionFromData,
            // emptyTextDesired differentiates this case from when user deletes stuff from input field
            this.$(evt.target).typeahead('val', inputValue);
          } else {
            this.$(evt.target).typeahead('val', this.currentTextValue);
            this._addToSelection(_LeanData.Util.convertStringSelectionToArray(this.currentTextValue)[0]);
            this.$el.trigger("nestedTypeaheadSelector:select", this);
          }
          this.customInputSelect = false;
          this.validate();
        },

        _getAsyncBloodHound: function(serviceCall) {
            var context = this;
            var filter = typeof this.filterSuggestions === 'function' ? this.filterSuggestions : null;
            var showOverlay = () => {
              this.$el.find('.typeahead-input.tt-input').prop('placeholder', 'Loading...');
            };
            var hideOverlay = () => {
              this.$el.find('.typeahead-input.tt-input').prop('placeholder', this.placeholder);
            };
            var cacheControl = (query, results) => {
                context.cachedLastResult[query] = results;
                setTimeout(() => { context.cachedLastResult = {} }, 5000);
            };
            context.cachedLastResult = {}; 
            return new Bloodhound({
                remote: {
                    //url usage will change with Overlord implementation
                    url: '%query%',
                    wildcard: '%query%',
                    transport: function(options, onSuccess, onError) {
                        if (context.cachedLastResult[options.url]) {
                            onSuccess(context.cachedLastResult[options.url]);
                            return;
                        }

                        showOverlay();

                        if (filter === null) {
                            serviceCall(decodeURIComponent(options.url)).then(function(result) {
                                context.lastReceivedResult = result;
                                onSuccess(result);
                                cacheControl(options.url, result);
                            }, onError).finally(hideOverlay);
                        } else {
                            serviceCall(decodeURIComponent(options.url)).then(function(result) {
                                let filteredResults = filter(result);
                                context.lastReceivedResult = filteredResults;
                                onSuccess(filteredResults);
                                cacheControl(options.url, result);
                            }, onError).finally(hideOverlay);
                        }
                    },
                    cache: false
                },
                sufficient: 100,
                queryTokenizer: context.queryTokenizer || function(query) { return [query]; },
                datumTokenizer: context.datumTokenizer || function(datum) { return datum },
                identify: function(obj) { return obj.Id; }
            });
        },

        _getBloodHound: function (data) {
            if (!data) throw("NestedTypeaheadSelector Error: Invalid data. Failed to create bloodhound.");
            var context = this;
            return new Bloodhound({
                local: data,
                identify: function (obj) {
                    return obj.name + " / " + obj.label
                },
                datumTokenizer: context.datumTokenizer || function (datum) {
                    var nameTokens = Bloodhound.tokenizers.whitespace(datum['name']);
                    var labelTokens = Bloodhound.tokenizers.whitespace(datum['label']);
                    return nameTokens.concat(labelTokens).concat(datum.parent || datum.sObject ? [datum.sObject] : []);
                },
                
                queryTokenizer: context.queryTokenizer || Bloodhound.tokenizers.whitespace
            });
        },

        _getSearchEngine: function (theHound) {
            var filter = this.filterSuggestions;
            // Bloodhound Doc: https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md
            return (q, sync) => {
                if (q === '') {
                    if (typeof filter === 'function') sync(filter(theHound.all()));
                    else sync(theHound.all());
                } else {
                  theHound.search(q, function(suggestions) {
                    if (typeof filter === 'function') sync(filter(suggestions));
                    else sync(suggestions);
                });
                }
            }
        },

        _initTypeahead: function (inputEl, searchEngine) {
            // Typeahead Doc: https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
            // in case of re-initialization
            inputEl.typeahead('destroy');

            // avoid typeahead cached being shared with other typeaheads
            var typeaheadInstanceName = 'nested-typeahead-selector' + "-" + Date.now();

            // initialize Typeahead
            inputEl.typeahead(
                this.getTypeaheadOptions(),
                this.getTypeaheadConfigurations(typeaheadInstanceName, searchEngine)
            );

            if (this.requireSelectionFromData === false) {
                this.customValueEl = this.customValueTemplate;
                this.$('.tt-menu').prepend(this.customValueEl);
            }

            this._refreshSelectionBreadcrumbs();
        },

        _addToSelection: function (selectedField) {
            if (!selectedField) return this;
            var lastIndex = this.selection.length - 1;
            if (lastIndex > -1 && !hasChildren(this.selection[lastIndex])) {
                this.selection[lastIndex] = selectedField;
            } else {
                this.selection.push(selectedField);
            }
        },

        _refreshSelectionBreadcrumbs: function () {
            var renderedSelection = this.selectionTemplate({
                root: (this.root === 'CampaignMember') ? 'Campaign Member' : this.customRootLabel || _LeanData.Util.getSObjectLabel(this.root, false) || this.root,
                selection: this.selection,
                currentCustomValue: this.currentCustomValue,
                hasChildren: hasChildren
            });

            if (this.breadcrumbsEl) this.breadcrumbsEl.remove();
            this.breadcrumbsEl = $(renderedSelection);
            this.breadcrumbsEl.find('.nts-selected-node.nts-parent-node').each((function(index, nodeEl) {
                $(nodeEl).on('click', this._deselectTo.bind(this, index));
            }).bind(this));

            if (!this.disableBreadcrumbs){
                this.$('.tt-menu').prepend(this.breadcrumbsEl);
            }
        },

        _refreshSelectionMenu: function(sliding=true) {
            this._initTypeahead(this.$('.typeahead'), this._getSearchEngine(this.bloodHound));
            this.$('.typeahead').focus();
            if (sliding){
              this.$('.tt-dataset').hide(0, function () {
                  $(this).slideDown();
              });
            }
        },

        _deselectTo: function(index) {
            // note: selection does not contain root.
            this.selection.splice(index);
            this._resetBloodHoundDataUsingCurrentSelection();
            this._refreshSelectionMenu();
            this._refreshSelectionBreadcrumbs();
            this.onSelectCallback(this, this.selection);
            this.onSelectPostCallback(this, this.selection);
        },

        _refreshMetaData: function(e) {
          if ($('#node-editor-sidebar').length) {
            _LeanData.FlowBuilderGraph.toggleNodePanelOverlay(true);
          } else {
            _LeanData.Notification.showLoadingOverlay('Refreshing MetaData');
          }
          const additionalObjects = _LeanData.AppState.getCurrentVariablesHandler() ? _LeanData.AppState.getCurrentVariablesHandler().getVariableObjectTypes() : [];
          _LeanData.MetaDataController.getFieldsMetaData(true, additionalObjects, true)
          .then((metaData) => {
            let selectableMetaData
            if (typeof this.processDataCallback === 'function') {
              selectableMetaData = this.processDataCallback(metaData, true);
            }
            if (typeof this.getDynamicData === 'function') {
              selectableMetaData = this.getDynamicData(this.selection, metaData, true);
            }
            if (!selectableMetaData) return;
            this.model.clear({ silent: true }).set(selectableMetaData);
            if (this.includeNoValueOption) this._insertNoValueOption();
            this._onSelect(null, this.selection || [], true);
            if ($('#node-editor-sidebar').length) {
              _LeanData.FlowBuilderGraph.toggleNodePanelOverlay(false, true);
            } else {
              _LeanData.Notification.hideLoadingOverlay();
            }
          })
          .finally(() => {
            if (typeof this.refreshMetaDataPostCallback === 'function') {
              this.refreshMetaDataPostCallback(this);
            }
          });
        },

        disableTypeahead(isDisabled) {
          this.$el.toggleClass('disabled', isDisabled);
          this.$el.find('input.tt-input').prop('disabled', isDisabled);
        },

        updatePlaceholder(newPlaceholder) {
          this.$el.find('.typeahead-input').prop('placeholder', newPlaceholder);
        },
    });

};

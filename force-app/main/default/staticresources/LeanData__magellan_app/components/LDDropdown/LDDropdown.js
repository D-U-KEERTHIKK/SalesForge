var LDDropdown = function() {
    var template = require('./LDDropdown.template.html');
    $(document).on('mouseup', function() {
        $('.ld-dropdown.open').toggleClass('open', false);
    });

    var listItemTemplate =  '<li title="<%- disabledDescription %>" class="ld-dropdown-option-list-item <%- additionalClasses %>"><div class="ld-dropdown-option" data-model-index="<%-modelIndex%>">' +
        '<%=renderedOptionTemplate%>' +
        '</div></li>';
    var cacheRenderedOptionItem = {};

    $.fn.LDDropdown = function(option) {
        if (option === 'val') return (this.magellanLDDropdown instanceof Magellan.Views.LDDropdown ? this.magellanLDDropdown.val() : null);
        if (option === 'LDDropdown') return this.magellanLDDropdown || null;

        var vwLDDropdown = new Magellan.Views.LDDropdown(option);
        $(this).html(vwLDDropdown.$el);

        this.magellanLDDropdown = vwLDDropdown;

        return $(this);
    }

    var model = Magellan.Models.LDDropdown = Backbone.Model.extend({
        defaults: {
            value: null,
            options: null,
            required: false
        },

        isValid: function() {
            var isValid = true;

            if (this.get('required') === false) return isValid;

            var value = this.get('value');
            if (_.isNull(value) || _.isUndefined(value) || value === '' || this.get('options').indexOf(value) < 0) {
                isValid = false;
            }

            return isValid;
        }
    });

    var view = Magellan.Views.LDDropdown = Backbone.View.extend({
        tagName: 'div',
        optionTemplate: _.template('<span><%-option%></span>'),
        customOptionTemplate: null,
        customSelectedOptionTemplate: null,
        customValues: null,
        template: _.template(template),
        bloodhound: null,
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        enableSearch: false,
        menuAlignClass: '',
        placeholder: null,
        disabled: false,
        onChangeCallback:  null,
        isActionMenu: false,
        alwaysEnableDropdown: false,
        conditionalOpen: null,
        initialize: function(config) {
            this.model = new model();
            this.width = config.width;

            if (!_.isUndefined(config)) {
                this.model.set('value', _.isUndefined(config.value) ?  null : config.value);
                this.model.set('options', config.options || []);
                this.model.set('required', config.required === true);
                this.model.set('customValues', config.customValues || {});
                this.model.set('preferredOptions', config.preferredOptions || []);
                this.model.set('hidePreferredOptions', config.hidePreferredOptions === true);
                this.model.set('disabledOptions', new Set(config.disabledOptions || []));
                this.model.set('disabledDescriptions', config.disabledDescriptions || {});
                //new implementation 
                this.model.set('disableSelectedOptions', config.disableSelectedOptions === true);
                this.model.set('selectedOptions', config.selectedOptions);

                if (typeof config.optionTemplate === 'string') {
                    this.customOptionTemplate = _.template(config.optionTemplate);
                } else {
                    this.customOptionTemplate = config.optionTemplate || null;
                }
                this.customSelectedOptionTemplate = config.hasOwnProperty('customSelectedOptionTemplate') ? config.customSelectedOptionTemplate : this.customOptionTemplate;
                
                this.queryTokenizer = config.queryTokenizer || this.queryTokenizer;
                this.datumTokenizer = config.datumTokenizer || this.datumTokenizer;
                this.disabled = config.disabled;
                this.enableSearch = _.isBoolean(config.enableSearch) ? config.enableSearch : this.model.get('options').length >= 10;
                this.menuAlignClass = config.alignMenuRight ? 'pull-right' : '';
                this.placeholder = typeof config.placeholder === 'string' && config.placeholder ? config.placeholder : 'Select One';
                this.onChangeCallback = typeof config.onChange === 'function' ? config.onChange : _.noop;
                this.isActionMenu = typeof config.isActionMenu === 'boolean' ? config.isActionMenu : false;
                if (this.enableSearch) this._initBloodhound(this.model.get('options'));
                this.isValid = _.isFunction(config.isValid) ? config.isValid : this.model.isValid.bind(this.model);
                this.alwaysEnableDropdown = config.alwaysEnableDropdown || this.alwaysEnableDropdown;
                if (typeof config.conditionalOpen === 'function') { 
                  this.conditionalOpen = config.conditionalOpen;
                }
            }
            if (config && config.size) {
                switch (config.size) {
                    case 'large':
                        this.$el.prop('class', 'ld-dropdown ld-dropdown-large');
                        break;
                    case 'xtra-small':
                        this.$el.prop('class', 'ld-dropdown ld-dropdown-xtra-small');
                        break;
                    default: 
                        this.$el.prop('class', 'ld-dropdown ld-dropdown-small');
                }
            } else {
                this.$el.prop('class', 'ld-dropdown ld-dropdown-small');
            }

            this.render();

            this.listenTo(this.model, 'change', this._handleModelChange);
        },
        _initBloodhound: function(data) {
            this.bloodhound = new Bloodhound({
                local: data,
                queryTokenizer: this.queryTokenizer,
                datumTokenizer: this.datumTokenizer
            });
            
            this.bloodhound
                .initialize()
                .then(this._search.bind(this, this.$('.ld-dropdown-search-filter-input').val()));
        },

        events: {
            'click .ld-dropdown-search-filter-container': function(e) { e.preventDefault(); e.stopPropagation(); },
            'click .ld-dropdown-option-list-item': 'selectOption',
            'mouseup .ld-dropdown-search-filter-input': function(e) { e.stopPropagation(); },
            'keyup .ld-dropdown-search-filter-input': '_searchInputChanged',
            'mouseup .ld-dropdown-toggle': function(e) {
                if (this.conditionalOpen && this.conditionalOpen()) {
                  return;
                }
                e.stopPropagation();
                var thisDropdown = $(e.target).closest('.ld-dropdown');
                $('.ld-dropdown.open').not(thisDropdown).toggleClass('open', false);
                thisDropdown.toggleClass('open').find('.ld-dropdown-toggle').focus();
                if (this.enableSearch) {
                  this.$('.ld-dropdown-search-filter-input').focus();
                  // By default, show all options unless there are over 100. Then the user should search for the option.
                  if (this.alwaysEnableDropdown || this.model.get('options').length < 100) {
                      this.$('.ld-dropdown-option-list-item').show();
                  }
                }
            },
            'mouseup .ld-dropdown': function(e) {
                e.stopPropagation();
            }
        },

        render: function() {
            var content = this.template(this);

            this.$el.html(content);

            this._renderSelectList();
            this._renderSelectedValue();

            this.$el.toggleClass('disabled', this.disabled === true);
            if(this.disabled){
                this.$el.removeClass('input-invalid');
            }
            this.$('.ld-dropdown-search-filter-container').toggleClass('hidden', this.enableSearch === false);

            if (this.width) this.$el.find('.dropdown-menu').css('min-width', this.width + 'px');
            return this;
        },

        selectOption: function(evt) {
            var targetEl = $(evt.target);
            if (!$(evt.target).is('.ld-dropdown-option-list-item')) targetEl = $(evt.target).closest('.ld-dropdown-option-list-item');
            var itemIndex = targetEl.find('.ld-dropdown-option').data('model-index');
            var optionData = this.model.get('options')[itemIndex];

            if (this.model.get('disabledOptions').has(optionData)) {
              return;
            } else if (this.isActionMenu) {
              this.onChangeCallback(optionData, this);
              return;
            } else {
              this.model.set('value', optionData);
            }

            this.$('.ld-dropdown-option-list-item.selected').toggleClass('selected', false);
            targetEl.toggleClass('selected', true);
        },

        val: function() {
            return this.model.get('value');
        },
        
        set: function(option) {
            this.model.set('value', option);
            this._renderSelectList();
            this._renderSelectedValue();
        },

        validate: function() {
            var isValid = this.isValid();
            this.$el.toggleClass('input-invalid', !isValid);
            return isValid;
        },

        toggleDisabled: function(value = undefined) {
          if (value === undefined) {
            this.$el.toggleClass('disabled');
          } else {
            this.$el.toggleClass('disabled', value);
          }
        },

        setOptionState: function(option, disable) {
          if (disable) {
            this.model.get('disabledOptions').add(option);
          } else {
            this.model.get('disabledOptions').delete(option);
          }
          this._renderSelectList();
        },

        updatePlaceholderText: function(text) {
          this.$('.ld-dropdown-value').html(text);
        },

        // Passes in two arguments to the callback function provided. The second argument is optional but it allows
        // the callback function to have access to the dropdown element. This is helpful in the case where you need
        // to find the closest element/parent 
        _handleModelChange: function() {
          this._renderSelectedValue();
          this.$el.trigger('LDDropdown:change', this);
          this.onChangeCallback(this.val(), this);
        },

        _getOptionItemMarkup: function(option, customOptionTemplate) {
            var renderedOptTpl = '';

            if (typeof customOptionTemplate === 'function') {
                renderedOptTpl = customOptionTemplate(option);
            } else if (typeof option === 'object' && _.isNull(option) === false) {
                console.warn("LDDropdown: option an item is an object, but no custom template was provided (optionTemplate)");
                renderedOptTpl =  this.optionTemplate({ option: JSON.stringify(option) });
            } else if (typeof option === 'boolean') {
                renderedOptTpl =  this.optionTemplate({ option: _.capitalize(option + '') });
            } else {
                renderedOptTpl =  this.optionTemplate({ option: ((_.isNull(option) || _.isUndefined(option)) ? '' : option) + '' });
            }

            return renderedOptTpl;
        },

        _renderSelectedValue: function() {
            var selectedValue = this.model.get('value');
            var valueText = this.placeholder; // default

            if (!_.isEmpty(selectedValue) || _.isBoolean(selectedValue) || _.isNumber(selectedValue)) {
                valueText = this._getOptionItemMarkup(selectedValue, this.customSelectedOptionTemplate);
            }

            this.$('.ld-dropdown-value').html(valueText);
            this.$('.ld-dropdown-value').prop('title', $('<div>').html(valueText).text()); // extract only text if it's html
            this.validate();
        },

        _renderSelectList: function() {
            var optionList = '';
            this.$('.dropdown-menu .ld-dropdown-option-list-item').remove();
            var preferredIndexToModelIndex = {};
            var preferredOptions = this.model.get('preferredOptions');
            var hidePreferredOptions = this.model.get('hidePreferredOptions');
            var disabledOptions = this.model.get('disabledOptions') || new Set();
            let disabledDescriptions = this.model.get('disabledDescriptions') || {};

            var createListItemHtml = (function(option, index, isPreferredList) {
                var isPreferredOption = preferredOptions.includes(option);
                let isDisabledOption = option ? disabledOptions.has(option) || disabledOptions.has(option.value) : false;
                var additionalClasses = '';
                additionalClasses += option === this.model.get('value') ? 'selected ' : '';
                additionalClasses += (hidePreferredOptions && isPreferredOption && !isPreferredList) ? 'hidden ' : '';
                additionalClasses += (isDisabledOption) ? 'disabled ' : '';
                
                let disabledDescription = option ? disabledDescriptions[option] || disabledDescriptions[option.value] : null ;
                
                
                var listItem = _.template(listItemTemplate)({
                    renderedOptionTemplate:  this._getOptionItemMarkup(option, this.customOptionTemplate),
                    modelIndex: index,
                    additionalClasses: additionalClasses,
                    disabledDescription
                });

                
                return listItem;
            }).bind(this);
            
            // assemble a big HTML string and render using $.html() at the end to improve performance
            var preferredIndex = 0;
            _.each(this.model.get('options'), (option, modelIndex) => {
                
                if(this.model.get('disableSelectedOptions') && this.model.get('selectedOptions').includes(option)) return;
                
                optionList += createListItemHtml(option, modelIndex, false);
                if (option == preferredOptions[preferredIndex]) {
                    preferredIndexToModelIndex[preferredIndex] = modelIndex;
                    preferredIndex++;
                }
            });
           
            var preferredItems = '' 
            _.each(preferredOptions, (option, preferredIndex) => {
                preferredItems += createListItemHtml(option, preferredIndexToModelIndex[preferredIndex], true); 
            });
           
            if (!_.isEmpty(preferredItems)) {
                optionList = preferredItems + '<li class="separator preferred-section-separator" style="border-bottom: 1px solid #CCC;"></li>' + optionList;
            } 
            
            this.$('.dropdown-menu').append(optionList);
                        
            var separatorIndex = this.$('.preferred-section-separator').index();
            if (separatorIndex > -1) {
                this.$('.dropdown-menu li').slice(0, separatorIndex).each(function() {
                    if ($(this).hasClass('ld-dropdown-option-list-item')) {
                        $(this).toggleClass('is-preferred-option', true);      
                    }
                });
            }
        },

        _searchInputChanged: _.debounce(function(e) {
            var keywords = $(e.currentTarget).val();
            if (!keywords) {
                this.$('.ld-dropdown-option-list-item').show();
            } else {
                this._search(keywords);
            }
        }, 300),
        
        _search:function(keywords) {
            this.bloodhound.search(keywords, this._filterByItems.bind(this));
        },
        
        _filterByItems: function(itemsToShow) {
            var options = this.model.get('options');
            if (itemsToShow.length === options.length) {
                this.$('.dropdown-menu .ld-dropdown-option-list-item').show();
                return;
            }
            
            this.$('.dropdown-menu .ld-dropdown-option-list-item').hide();
            _.each(itemsToShow, (item) => {
                var modelIndex = options.indexOf(item);
                this.$('.dropdown-menu .ld-dropdown-option-list-item:not(.is-preferred-option)').eq(modelIndex).show();
            });
        }
    });

    return view;
};

module.exports = LDDropdown;

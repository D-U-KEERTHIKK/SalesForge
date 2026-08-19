module.exports = function() {
    var template = require("./LDInput.template.html");
    
    var view = Magellan.Views.LDInput = Backbone.View.extend({
        inputEl: null,
        labelEl: null,
        errorEl: null,
        validate: null,
        className: "ld-input-container",
        tagName: "span",
        _isEditing: false,
        events: {
            "change .ld-input": "update",
            "blur .ld-input": function() { if (this.isValid()) this.viewMode(); },
            "click .ld-input-label": "editMode",
            "keyup .ld-input": "_onTyping",
            "LDInput:validate .ld-input": "isValid",
            "LDInput:edit .ld-input": "editMode",
            "LDInput:view .ld-input": "viewMode"
        },
        initialize: function(options) {
            if (!_.isUndefined(options)) {
                if (options.inputEl) this.inputEl = options.inputEl;
                if (options.validate) this.validate = options.validate;
                this.showError = _.isBoolean(options.showError) ? options.showError : true;
                this._isEditing  = (options.mode === 'edit') || false;
                this.style = options.style;
            }

            // To handle clicking on the graph to trigger editing edit mode in the graph title input
            $('#paper').off();
            $('#paper').on('click', (function() {
                this.viewMode();
            }).bind(this));

            this.render();
        }, 

        template: _.template(template), 

        render: function() {
            this.$el.html(this.template({
                editIconURL: resourceURL + "/images/Edit_Icon_Unselected_50x50.png",
                style: this.style
            }));

            if (this.inputEl !== null) {
                this.$('.ld-input').replaceWith(this.inputEl);
                this.inputEl.toggleClass('ld-input', true);
            } else {
                this.inputEl = this.$('.ld-input');
            }

            this.labelEl = this.$('.ld-input-label');
            this.labelEl.find('.label-text').text(this.inputEl.val());

            this.errorEl = this.$('.ld-input-error');

            this._isEditing ? this.editMode() : this.viewMode();
            this.update();

            return this;
        },

        editMode: function() {
            //input.hide($.fadeIn.bind(label));
            this._isEditing = true;
            this.$el
                .toggleClass("ld-input-mode-edit", this._isEditing)
                .toggleClass("ld-input-mode-view", false);
            this.inputEl.focus();
        },

        viewMode: function() {
            //label.hide($.fadeIn.bind(input));
            this._isEditing = false;
            this.$el
                .toggleClass("ld-input-mode-view", true)
                .toggleClass("ld-input-mode-edit", this._isEditing);
        },

        isValid: function() {
            var err = this.validate(this.inputEl.val());
            if (!_.isEmpty(err)) {
                this.inputEl.toggleClass('input-invalid', true);

                if (this.showError) {
                    this.errorEl.show();
                    this.errorEl.html(err);
                } else {
                    this.$el.prop('title', err);
                }
                this.inputEl.trigger('LDInput:isInvalid');
                return false;
            } else {
                this.inputEl.toggleClass('input-invalid', false);
                this.errorEl.hide();
                this.inputEl.trigger('LDInput:isValid', this.inputEl.val());
                this.$el.prop('title', '');
                return true;
            }
        },

        update: function() {
            const previousValue = this.labelEl.find('.label-text').text();
            this.labelEl.find('.label-text').text(this.inputEl.val());
            this.inputEl.trigger('LDInput:updated', { newValue: this.inputEl.val(), previousValue: previousValue });
            return this.isValid();
        },

        _onTyping: function(ev) {
            if (ev.keyCode == 13) { // pressed Enter
                this.update() ? this.viewMode() : this.editMode();
            }
            if (_.isUndefined(this._debouncedIsValid))
                this._debouncedIsValid = _.debounce(this.isValid.bind(this), 50);
            this._debouncedIsValid();
        }
    });

    // BONUS: jquery extension to quickly initialize the existing input
    $.fn.LDInput = function(options) {
        if (options && !_.isUndefined(options.defaultValue)) {
          $(this).val(options.defaultValue);
        }

        if (typeof options === 'string') {
            switch (options) {
                case 'validate':
                    $(this).trigger('LDInput:validate');
                    break;
                case 'edit':
                    $(this).trigger('LDInput:edit');
                    break;
                case 'view':
                    $(this).trigger('LDInput:view');
                    break;
            }

        } else if (!$(this).hasClass('ld-input')) {
            options = options || {};
            options.inputEl = $(this);
            var tmp = $('<span></span>');
            $(this).replaceWith(tmp);
            var inputVw = new view(options);
            tmp.replaceWith(inputVw.$el);
        } else {
            options = options || {};
            options.mode && options.mode === 'edit' ? $(this).trigger('LDInput:edit') : $(this).trigger('LDInput:view');
            $(this).trigger('change');
        }

        return $(this);
    }
};
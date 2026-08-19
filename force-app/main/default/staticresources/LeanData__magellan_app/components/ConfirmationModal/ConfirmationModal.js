module.exports = function() {
    var template = require('./ConfirmationModal.template.html');

    return Magellan.Views.ConfirmationModal = Backbone.View.extend({
        _promise: null,
        header: "Confirmation Dialog",
        message: "Are you sure?",
        footer: "",
        container: '#magellan-modals',
        showTypeahead: false,
        template: _.template(template),
        events: {
            "click .cancel-button": "onCancel",
            "click .confirm-button": "onConfirm",
            'click .modal': 'handleOutsideClick',
        },
        initialize: function(options) {
            this._promise = $.Deferred();
            this.container = options.container || this.container;

            if (typeof options.onConfirmed === 'function')
                this._promise.then(options.onConfirmed);
            if (typeof options.onCancelled === 'function')
                this._promise.fail(options.onCancelled);
            if (typeof options.cancelConfirmation === 'function')
                this.cancelConfirmation = options.cancelConfirmation;
            if (typeof options.confirmConfirmation === 'function')
                this.confirmConfirmation = options.confirmConfirmation;
                
            this._promise.always(this.close.bind(this));

            this.header = options.header || this.header;
            this.message = options.message || this.message;
            this.$contentElement = options.contentElement || null;
            this.footer = options.footer || this.footer;
            this.warningText = options.warningText || null;
            this.largeModal = options.largeModal;
            this.innerModal = options.innerModal;
            this.verticallyResizable = options.verticallyResizable;
            this.noContentPadding = options.noContentPadding; // set true to remove padding around content

            this.primaryButtonText = options.primaryButtonText || 'Confirm';
            this.hideSecondaryButton = options.hideSecondaryButton || false;
            this.secondaryButtonText = options.secondaryButtonText || 'Cancel';
            this.hasExtraContent = typeof options.hasExtraContent === 'boolean' ? options.hasExtraContent : false;

            //Additional logic for having a nested Typeahead in the modal
            this.showTypeahead = options.showTypeahead || false;
            if (this.showTypeahead) {
              const dataFields = { objects : [] };
              this.customOnConfirmWithNestedTypeahead = options.customOnConfirmWithNestedTypeahead || null;
              this.nestedTypeaheadPlaceholder = options.nestedTypeaheadPlaceholder || 'Search';
              options.typeaheadData.forEach((obj) => {
                if (typeof obj === 'string') {
                  dataFields.objects.push(_LeanData.Util.convertStringToTypeaheadObject(obj));
                } else {
                  dataFields.objects.push(obj);
                }
              });

              this.objTypeaheadSelector = new Magellan.Views.NestedTypeaheadSelector({
                required: false,
                disableBreadcrumbs: true,
                data: dataFields,
                root: 'objects',
                selection: null,
                placeholder: this.nestedTypeaheadPlaceholder,
                onSelect: (el, selection) => {
                  this.el = el;
                  this.selection = selection;
                  this.enablePrimaryButton();
                },
              });
              this.objTypeaheadSelector.validate();
            }
            this.render();
        },
        _cancel: function(event) {
            this._promise.reject(event);
        },
        _confirm: function(event) {
          if (this.showTypeahead) {
            // If there is a custom 
            if (this.customOnConfirmWithNestedTypeahead && this.el && this.selection) {
              this.customOnConfirmWithNestedTypeahead(this.el, this.selection);
            }
          }
          this._promise.resolve(event);
        },

        onCancel: function (event) {
            if (this.cancelConfirmation) {
                event.preventDefault();
                this.cancelConfirmation(
                    () => { this._cancel(event); }, //On confirming the cancel
                    () => { return false } //On cancelling the cancel
                )
            } else {
                this._cancel(event);
            }
        },
        onConfirm: function (event) {
            if (this.confirmConfirmation) {
                event.preventDefault();
                this.confirmConfirmation(
                    () => { this._confirm(event); }, //On confirming the confirmation
                    () => { return false } //On cancelling the confirmation
                )
            } else {
                this._confirm(event);
            }
        },
        /**
         * Triggers off of all click events on .modal but only
         * processes outside of the modal box.
         * @param {*} event
         */
        handleOutsideClick: function (event) {
            // event not associated with children, confirm outside click
            if (event.target === event.currentTarget) {
                if (!this.hideSecondaryButton) {
                    // secondary button exists, can cancel
                    this.onCancel(event);
                } else {
                    // secondary button hidden, can't cancel have to confirm
                    this.onConfirm(event);
                }
            }
        },

        render: function() {
            this.$el.html(this.template({
                header: this.header,
                message: this.message,
                footer: this.footer,
                warningText: this.warningText,
                primaryButtonText: this.primaryButtonText,
                hideSecondaryButton: this.hideSecondaryButton,
                secondaryButtonText: this.secondaryButtonText,
                hasExtraContent: this.hasExtraContent,
                largeModal: this.largeModal,
                innerModal: this.innerModal,
                verticallyResizable: this.verticallyResizable,
                noContentPadding: this.noContentPadding,
                showTypeahead: this.showTypeahead
            }));
            $(this.container).append(this.$el);
            if (this.showTypeahead) {
                this.$el.find(".modal-nested-typeahead-selector").html(this.objTypeaheadSelector.$el);
                this.disablePrimaryButton();
            }
            if(this.verticallyResizable) {
                this.$el.find('.modal-content-section').resizable({ //Makes modal vertically resizable. NOTE: Not turnkey, the inner content must also be made responsive
                    handles: { 's': $('.bottom-handle')},
                    containment: $('.confirmation-modal'),
                    resize: (event, ui) => { //Make the handle element stay with mouse on vertically centered modals
                        var heightChange = ui.size.height - ui.originalSize.height;
                        var scaledHeight = ui.originalSize.height + heightChange * 1.33;
                        ui.size.height = scaledHeight;
                    }
                });
            }
            return this;
        },

        open: function() {
          this.$el.find('.modal').modal({'show': true, backdrop: 'static'});
          if (this.$contentElement) this.$el.find('.modal-content-section').html(this.$contentElement);
        },
        close: function() {
            var that = this;
            this.$el.find('.modal').on('hidden.bs.modal', function() {
                that.remove();
            });
            this.$el.find(".modal").modal('hide');
            return this;
        },
        onConfirmed: function(callback) {
            if (typeof callback === 'function') this._promise.then(callback);
            else throw("ConfirmationModal Error: confirmation callback must be a function.");

            return this;
        },
        onCancelled: function(callback) {
            if (typeof callback === 'function') this._promise.fail(callback);
            else throw("ConfirmationModal Error: cancellation callback must be a function.");

            return this;
        },
        disablePrimaryButton: function() {
            this.$el.find('.confirm-button').toggleClass('disabled', true);
        },
        enablePrimaryButton: function() {
            this.$el.find('.confirm-button').toggleClass('disabled', false);
        },
    });
};

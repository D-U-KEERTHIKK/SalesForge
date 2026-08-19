module.exports = function() {
  var template = require('./PaginatedModal.template.html');

  return Magellan.Views.PaginatedModal = Backbone.View.extend({
    /*
     * Paginated Modal component.
     *
     * A modification of the ConfirmationModal view which allows for multiple pages in one modal like a setup wizard.
     *
     * ==== Required ====
     * @param {[[String]]} selectorsByPage     List of lists of classnames to be displayed, indexed by page number
     * @param {[[Object]]} viewsByPage         List of lists of Views to be rendered, indexed by page number
     * @param {[Function]} onForward           List of callbacks to be executed on page turn forward, indexed by page number
     * @param {[Function]} onBack              List of callbacks to be executed on page turn backward, indexed by page number
     *                                          Input for index 0 is typically null, as Back btn is hidden
     *
     * ==== Optional ====
     * @param {[String]} forwardButtonTextByPage  Text to be displayed on clear forward button, indexed by page number
     * @param {[String]} backButtonTextByPage     Text to be displayed on clear back button, indexed by page number
     * @param {String}   cancelButtonText         Text to be displayed in Cancel button
     * @param {Function} confirmActionHandler     Callback to trigger confirmation alert after proceeding past last page
     * @param {Function} cancelActionHandler      Callback to trigger confirmation alert after cancelling out of modal
     * @param {Number}   pageIndex                Index of modal page upon first opening
     * @param {[Object]} disableForward           List of callbacks to lock forward btn, true === 'valid', indexed by page number
     *                                              NOTE: requires model to be listened to, passed in as options.model
    */

    header: 'Confirmation Dialog',
    message: 'Are you sure?',
    footer: '',
    container: '#magellan-modals',
    pageIndex: 0,
    forwardButtonTextByPage: [],
    backButtonTextByPage: [],
    // map of button type to list of input callbacks, indexed by page number
    onSelect: {
      'onForward': [],
      'onBack': [],
    },
    // list of lists of classnames to be displayed, indexed by page number
    selectorsByPage: [],
    viewsByPage: [],
    pageIndexToButtonLock: {},
    template: _.template(template),
    events: {
      'click .forward-button': 'onForward',
      'click .back-button': 'onBack',
      'click .cancel-button': 'onCancel',
    },

    initialize: function(options) {
      _.each(options.onForward, (forwardCB, pageIndex) => {
        const onForward = typeof forwardCB === 'function' ? forwardCB : () => {};
        this.onSelect['onForward'][pageIndex] = onForward;
      });
      _.each(options.onBack, (backCB, pageIndex) => {
          const onBack = typeof backCB === 'function' ? backCB : () => {};
          this.onSelect['onBack'][pageIndex] = onBack;
      });
      const onCancel = typeof options.onCancel === 'function' ? options.onCancel : () => {};
      this.cancel = () => {
        Promise.resolve(onCancel()).then(() => {
          this.close();
        }).catch((err) => {
          console.log('error in cancellation callback: ', err);
        });
      };

      _.each(options.disableForward, (callback, index) => {
        if (callback && options.model) {
          this.pageIndexToButtonLock[index] = callback;
          this.listenTo(options.model, 'change', this.toggleForwardButtonLock.bind(this));
        }
      });

      if (typeof options.confirmActionHandler === 'function') {
        this.confirmActionHandler = options.confirmActionHandler;
      }
      if (typeof options.cancelActionHandler === 'function') {
        this.cancelActionHandler = options.cancelActionHandler;
      }

      if (Array.isArray(options.selectorsByPage)) {
        this.selectorsByPage = options.selectorsByPage;
      }
      if (Array.isArray(options.viewsByPage)) {
        this.viewsByPage = options.viewsByPage;
      }

      this.container = options.container || this.container;
      this.header = options.header || this.header;
      this.message = options.message || this.message;
      this.$contentElement = options.contentElement || null;
      this.footer = options.footer || this.footer;
      this.warningText = options.warningText || null;
      this.largeModal = options.largeModal;
      this.innerModal = options.innerModal;
      this.verticallyResizable = options.verticallyResizable;
      this.noContentPadding = options.noContentPadding; // set true to remove padding around content
      this.pageIndex = options.pageIndex || 0;
      this.pageIndexMax = this.viewsByPage.length - 1;

      this.forwardButtonTextByPage = options.forwardButtonTextByPage || [];
      this.forwardButtonText = options.forwardButtonTextByPage ? options.forwardButtonTextByPage[0] : 'Next';
      this.backButtonTextByPage = options.backButtonTextByPage || [];
      this.backButtonText = options.backButtonTextByPage ? options.backButtonTextByPage[0] : 'Back';
      this.cancelButtonText = options.cancelButtonText || 'Cancel';
      this.hasExtraContent = typeof options.hasExtraContent === 'boolean' ? options.hasExtraContent : false;

      this.modalClasses = options.modalClasses || '';
      this.backdropClasses = options.backdropClasses || '';

      this.render();
    },

    onForward: function(event) {
      if (this.confirmActionHandler && this.pageIndex >= this.pageIndexMax) {
        event.preventDefault();
        this.confirmActionHandler(
          () => this.handlePageTurn('onForward'), // on confirming the confirmation
          () => false                             // on cancelling the confirmation
        )
      } else {
        this.handlePageTurn('onForward');
      }
    },

    onBack: function(event) {
      this.handlePageTurn('onBack');
    },

    onCancel: function (event) {
      if (this.cancelActionHandler) {
        event.preventDefault();
        this.cancelActionHandler(
          () => { this.cancel(); }, //On confirming the cancel
          () => { return false } //On cancelling the cancel
        )
      } else {
        this.cancel();
      }
    },

    handlePageTurn: function(selectType) {
      const callback = this.onSelect[selectType][this.pageIndex];
      if (typeof callback === 'function') {
        this.$el.find('.forward-button').LoadingOverlay('show');

        // Return the promise to the child
        return Promise.resolve(callback())
        .then((res) => {
          selectType === 'onForward' ? this.pageIndex++ : this.pageIndex--;
          this.updateView();
        })
        .catch((err) => {
          console.error('error in page-turn callback: ', err);
        })
        .finally(() => {
          this.$el.find('.forward-button').LoadingOverlay('hide', true);
        });
      } else {
        throw('PaginatedModal Error: page-turn callback must be a function.');
      }
    },

    updateView: function() {
      if (this.pageIndex < 0 || this.pageIndex > this.pageIndexMax) {
        return this.close();
      }

      this.forwardButtonText = this.forwardButtonTextByPage[this.pageIndex];
      this.backButtonText = this.backButtonTextByPage[this.pageIndex];
      this.$el.find('.forward-button').html(this.forwardButtonText);
      this.$el.find('.back-button').html(this.backButtonText);

      this.toggleBackButtonHidden(this.pageIndex <= 0);
      this.toggleForwardButtonLock();


      this.togglePageDisplay();
    },

    togglePageDisplay: function() {
      _.each(this.selectorsByPage, (selectors, pageIndex) => {
        _.each(selectors, (selector) => {
          if (this.pageIndex === pageIndex) {
            this.$el.find(selector).removeClass('hidden');
          } else {
            this.$el.find(selector).addClass('hidden');
          }
        });
      });

      _.each(this.viewsByPage, (views, pageIndex) => {
        _.each(views, (view) => {
          if (this.pageIndex === pageIndex) {
            view.render();
          }
        });
      });
    },

    render: function() {
      this.$el.html(this.template({
        header: this.header,
        message: this.message,
        footer: this.footer,
        warningText: this.warningText,
        forwardButtonText: this.forwardButtonText,
        backButtonText: this.backButtonText,
        cancelButtonText: this.cancelButtonText,
        hasExtraContent: this.hasExtraContent,
        largeModal: this.largeModal,
        innerModal: this.innerModal,
        verticallyResizable: this.verticallyResizable,
        noContentPadding: this.noContentPadding,
        modalClasses: this.modalClasses
      }));
      $(this.container).append(this.$el);

      this.pageIndex <= 0 ? this.toggleBackButtonHidden(true) : this.toggleBackButtonHidden(false);

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
      $('.modal-backdrop').addClass(this.backdropClasses);
      if (this.$contentElement) this.$el.find('.modal-content-section').html(this.$contentElement);
    },

    close: function() {
      this.$el.find('.modal').on('hidden.bs.modal', () => {
          this.remove();
      });
      this.$el.find('.modal').modal('hide');
      return this;
    },

    toggleForwardButtonLock: function() {
      let isButtonDisabled = false;
      if (typeof this.pageIndexToButtonLock[this.pageIndex] === 'function') {
        isButtonDisabled = !this.pageIndexToButtonLock[this.pageIndex]();
      }
      this.toggleForwardButtonDisabled(isButtonDisabled);
    },

    toggleForwardButtonDisabled: function(isDisabled) {
      this.$el.find('.forward-button').toggleClass('disabled', isDisabled);
    },

    toggleBackButtonHidden: function(isHidden) {
      this.$el.find('.back-button').toggleClass('hidden', isHidden);
    },
  });
};

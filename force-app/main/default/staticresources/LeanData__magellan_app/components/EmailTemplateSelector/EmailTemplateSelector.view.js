module.exports = function() {
  return Backbone.View.extend({
    className: 'email-template-selector-wrapper',
    template: _.template(require('./EmailTemplateSelector.template.html')),
    events: {
      'click .view-email-template-link': '_viewTemplate',
    },

    initialize: function(config) {
      // Check if config exists, otherwise initialize empty object
      config = config || {};
      // Set on change handler
      this.onChangeCallback = typeof config.onChange === 'function' ? config.onChange : _.noop;
      // Set model values
      this.model = new Magellan.Models.EmailTemplateSelector();
      this.model.set('templateId', config.templateId || null);
      // Render view after initialize
      this.render();
    },

    getTemplateInfo: function() {
      return this.model.get('templateId');
    },

    _initializeEmailTypeahead: function() {
      // Initialize typeahead
      if (this.emailNestedTypeaheadView) this.emailNestedTypeaheadView.remove();
      this.emailNestedTypeaheadView = new Magellan.Views.NestedTypeaheadSelector({
        required: true,
        disableBreadcrumbs: true,
        requireSelectionFromData: true,
        selection: [],
        asyncServiceCall: _LeanData.FlowBuilderController.searchEmailTemplates
      });
      this.$el.find('.email-template-selector').html(this.emailNestedTypeaheadView.$el);
      this.emailNestedTypeaheadView.$el.on('nestedTypeaheadSelector:select', this._selectTemplate.bind(this));

      // Fetch template name, then update typeahead
      this.emailNestedTypeaheadView.fetchSelectionWithAsyncService(this.model.get('templateId'))
      .then((templates) => {
        if (_.isEmpty(templates)) {
          var $emailTemplateErrorMessage = this.$el.find('.email-template-error-message');
          $emailTemplateErrorMessage.toggleClass('hidden', false);
          if (!_.isEmpty(this.model.get('templateId'))) {
            $emailTemplateErrorMessage.html('Previously selected template (Id: ' + this.model.get('templateId') + ') is invalid');
          }
        } else {
          this.model.set('templateName', templates[0]["Name"]);
        }
      })
      .always(() => {
        this.emailNestedTypeaheadView.validate();
      });
    },

    _selectTemplate: function(e, typeaheadSelector) {
      // Remove invalid template error (if shown) once valid template is selected
      this.$el.find('.email-template-error-message').toggleClass('hidden', true);
      // Set values
      var selection = typeaheadSelector.selection[0];
      var selectionObject = selection ? { id: selection.Id, Name: selection.Name } : {};
      this.model.set('templateId', selectionObject.id);
      this.model.set('templateName', selectionObject.Name);
      // Trigger change
      this.trigger('selectedTemplate', this.getTemplateInfo());
      this.onChangeCallback(this.getTemplateInfo());
    },

    _viewTemplate: function() {
      var templateId = this.model.get('templateId');
      if (!_.isNull(templateId)) {
        window.open('/' + templateId);
      }
    },

    render: function() {
      var content = this.template({})
      this.$el.html(content);

      // Create nested typeahead
      // Use "defer" to allow parent and this component to render first before fetching data and initializing typeahead
      _.defer(() => {
        this._initializeEmailTypeahead();
      });

      return this;
    },

  });
}

/*
  SlackRecipientSelector and EmailRecipientSelector are closely related. 
  If there is a fix in one please be sure to check if that fix also applies to the other.
*/
module.exports = function() {
  var AdditionalRecipientRowsView = require('./AdditionalRecipientRows.view')();

  return Backbone.View.extend({
    className: 'email-recipient-selector-wrapper',
    template: _.template(require('./EmailRecipientSelector.template.html')),
    events: {
      'click .edit-recipients-button': '_showEditor',
      'click .save-receipients-button': '_hideEditor',
      'click .notif-owner-checkbox': '_toggleOwner',
      'input .emails-text-area': '_emailTextareaHandler',
      'click .subcontent-toggle': '_toggleSubcontentForm',
      'click .additional-options-checkbox' : '_toggleAdditionalOptions'
    },

    initialize: function(config) {
      // Check if config exists, otherwise initialize empty object
      config = config || {};
      this.hasOwnerField = config.hasOwnerField;
      // Set config value
      this.editMode = config.editMode || false;
      // Set on save handler
      this.onSaveCallback = _.isFunction(config.onSave) ? config.onSave : _.noop;
      // Set limit on explicit emails you can send. Based on salesforce email limits for a single action
      this.emailRecipientLimit = Magellan.Validation.EMAIL_RECIPIENT_LIMIT || 20;
      // Set Additional Options
      this.additionalRecipients = config.additionalNotificationOptions ? config.additionalNotificationOptions : {};
      // Set model values
      this.model = new Magellan.Models.EmailRecipientSelector(config);
      this.model.set('fieldMetaData', fieldMetaData);
      this.model.set('additionalOptions', this.additionalRecipients);
      // Parse "additionalObjectUserFields" with dropdowns
      this._processAdditionalObjectUserFields();
    },

    _processAdditionalObjectUserFields: function() {
      var userFieldOptions = {};
      var userFieldOptionsMap = {};
      _.forEach(_LeanData._app.OBJECT_TYPES, (sobject) => {
        var flattenedFields = _.cloneDeep(_LeanData.MetaDataController.getFlattenedFieldsByObject(sobject));
        userFieldOptions[sobject] = _.filter(flattenedFields, (field) => {
          if (!_LeanData._blacklist.FIELD_BLACKLIST_SETS.USER_FIELDS.has(field.name) && _.includes(field.parent, 'User')) {
            if (field.name.endsWith('id')) {
              var insertAt = field.name.length - 2;
              field.name = field.name.substr(0, insertAt) + '.' + field.name.substr(insertAt);
            } else {
              field.name = field.name.replace('__c', '__r.id');
            }
            return true;
          } else {
            return false;
          }
        });
        userFieldOptionsMap[sobject] = _.keyBy(userFieldOptions[sobject], 'name');
      });
      this.model.set('userFieldOptions', userFieldOptions);
      this.model.set('userFieldOptionsMap', userFieldOptionsMap);

      // Declare view variables used for additional object user fields
      this.matchedObjectData = new Set();
      this.matchedObjectDropdownViews = {};
      this.additionalObjects = [];

      // In additionalObjectUserFields, if the type is "Match" and only a single layer deep (first level user field), create dropdown
      _.each(this.model.get('additionalObjectUserFields'), (obj) => {
        this.additionalObjects.push(obj);
      });


      // Render
      this.render();
    },


    _setAdditionalObjectUserFieldsInModel: function() {
      var additionalObjectUserFields = [];
      // If .matched-object-toggle is not checked, dont iterate through the dropdown views to get values
      var that = this;
      if (this.$el.find('.matched-object-toggle').prop('checked')) {
        this.$el.find('.matched-object-checkbox').each(function() {
          var $checkbox = $(this);
          var sobjectType = $checkbox.data('objectType');
          var isChecked = $checkbox.prop('checked');
          var matchedObjSelection = that.matchedObjectDropdownViews[sobjectType].view.val();

          if (isChecked && !_.isEmpty(matchedObjSelection)) {
            additionalObjectUserFields.push({
              userField: matchedObjSelection.name,
              objectType: sobjectType,
              contextType: 'matched',
            });
            that.matchedObjectData.add(sobjectType);
          } else {
            that.matchedObjectData.delete(sobjectType);
          }
        });
      } else {
        this.matchedObjectData.clear();
      }
      // if .additional-recipients-toggle is not checked, dont iterate through the dropdown views to get values
      if (this.$el.find('.additional-recipients-toggle').prop('checked')) {
        additionalObjectUserFields = additionalObjectUserFields.concat(this.additionalRecipientRowsView.getSelections());
      }
      // Set valid user field data into model
      this.model.set('additionalObjectUserFields', additionalObjectUserFields);
    },

    _showEditor: function() {
      // Enter edit mode
      this.editMode = true;
      this._processAdditionalObjectUserFields();
    },

    _hideEditor: function() {
      this._setAdditionalObjectUserFieldsInModel();

      // Validate and set data
      this.validate().then((function(errorMessages) {
        if (!_.isEmpty(errorMessages)) {
          this.$el.find('.email-recipients-error-messages').html(Object.values(errorMessages).join('<br>'));
          return;
        }
        // Compile data to send back in trigger/callback
        var recipientData = { emails: this.model.get('emails') };
        if (this.model.get('showOwnerOptions')) {
          recipientData.notifyPostOwner = this.model.get('notifyPostOwner');
          recipientData.notifyPreOwner = this.model.get('notifyPreOwner');
          recipientData.notifyNewObjectOwner = this.model.get('notifyNewObjectOwner');
        }
        if (this.model.get('showAdditionalObjectUserOptions')) {
          recipientData.additionalObjectUserFields = this.model.get('additionalObjectUserFields');
        }
        //update additionalOptions to send to callback
        recipientData.additionalOptions = this.model.get('additionalOptions');
        // Trigger change
        this.trigger('savedRecipients', recipientData);
        this.onSaveCallback(recipientData);
        // Exit edit mode
        this.editMode = false;
        this._processAdditionalObjectUserFields();
      }).bind(this));
    },

    _toggleOwner: function(e) {
      // Next / Previous owner checkbox handler
      var $target = $(e.target);
      this.model.set($target.data('ownerType'), $target.prop('checked'));
    },

    _toggleSubcontentForm: function(e) {
      // Toggle subcontent for Emails and Matched Objects
      var $target = $(e.target);
      var isChecked = $target.prop('checked');
      $target.closest('.recipient-editor-row').find('.recipient-editor-subcontent').toggleClass('hidden', !isChecked);
    },
    _toggleAdditionalOptions: function(e) {
      let $target = $(e.target);
      let index = $target.data('ownerType');
      let additionalOptions = this.model.get('additionalOptions');
      additionalOptions[index] = $target.prop('checked');
      this.model.set('additionalOptions', additionalOptions);

    },
    _getAdditionalObjectsLabels: function(additionalObjects) {
      return _.map(additionalObjects, (obj) => {
        var selectionsString = `${obj.contextType} ${obj.objectType}.${obj.userField}`.toLowerCase();
        var selectionsLabels = _.map(_LeanData.Util.convertFieldSelectionStringToArray(selectionsString, 'Object', _LeanData.MetaDataController.getFieldMetaDataMap()), (selection, a, b) => {
          return (a === b.length - 1) ? selection.label : selection.label.replace(' ID', '');
        });
        return selectionsLabels.join(' > ');
      });
    },

    _createRecipientCards: function() {
      this.recipientCards = [];

      if (this.model.get('notifyPostOwner')) this.recipientCards.push('New Owner');
      if (this.model.get('notifyPreOwner')) this.recipientCards.push('Previous Owner');
      if (this.model.get('notifyNewObjectOwner')) this.recipientCards.push('Created Object Owner');
      _.each(this.model.get('emails'), (email) => { this.recipientCards.push(email) });
      _.each(this.model.get('additionalObjectUserFields'), (obj) => {
        if (!Magellan.Validation.isValidUserFieldValues(obj.userField, obj.objectType, _LeanData.MetaDataController.getFieldMetaDataMap())) {
          this.recipientCards.push(_.capitalize(obj.contextType) + ' ' + obj.objectType + ' > ' + obj.userField + ' (DELETED)');
        } else {
          this.recipientCards.push(this._getAdditionalObjectsLabels([obj]));
        }
      });
      _.each(this.model.get('additionalOptions'), (checked, name) => {if (checked) this.recipientCards.push(name)});
    },

    _getElementClasses: function() {
      var classes = {
        'edit-recipients-button': new Set(['edit-recipients-button']),
        'email-recipients-wrapper': new Set(['email-recipients-wrapper']),
        'email-recipients-editor': new Set(['email-recipients-editor', 'hidden']),
        'empty-recipients-message': new Set(['empty-recipients-message']),
        'next-owner-row': new Set(['next-owner-row', 'hidden']),
        'previous-owner-row': new Set(['previous-owner-row', 'hidden']),
        'new-object-owner-row': new Set(['new-object-owner-row', 'hidden']),
        'matched-object-row': new Set(['matched-object-row', 'hidden']),
        'additional-recipients-row': new Set(['additional-recipients-row', 'hidden']),
      };
      if (this.editMode) {
        classes['edit-recipients-button'].add('invisible');
        classes['email-recipients-wrapper'].add('hidden');
        classes['email-recipients-editor'].delete('hidden');
      }
      if (this.model.get('showOwnerOptions')) {
        if (this.model.get('showNewPreviousOwnerOptions')) {
          classes['next-owner-row'].delete('hidden');
          classes['previous-owner-row'].delete('hidden');
        }
        if (this.model.get('showNewObjectOption')) {
          classes['new-object-owner-row'].delete('hidden');
        }
      }
      if (this.model.get('showAdditionalObjectUserOptions')) {
        classes['matched-object-row'].delete('hidden');
        classes['additional-recipients-row'].delete('hidden');
      }
      if (this.recipientCards.length > 0) {
        classes['empty-recipients-message'].add('hidden');
      }

      return classes;
    },

    _emailTextareaHandler: function(e) {
      this.model.set('emails', $(e.target).val());
    },

    validate: function(forceUpdateEmails) {
      var promise = $.Deferred();
      var errorMessages = {};
      
      // Validate the emails string. Regex removes all whitespace and line/carriage returns, and returns an array of emails or null
      var emailValidationResult = _LeanData.Validation.validateEmailString(this.$el.find('.emails-text-area').val());
      var isValidEmails = emailValidationResult.isValid;
      var validEmails = emailValidationResult.validEmails;
      var invalidEmails = emailValidationResult.invalidEmails;

      var isEmailsChecked = this.$el.find('.emails-toggle').prop('checked');
      var allEmailsValid = !isEmailsChecked || (isEmailsChecked && isValidEmails);
      this.$el.find('.emails-text-area').toggleClass('input-invalid', !allEmailsValid);
      if (!allEmailsValid) {
        errorMessages.invalidEmailRecipients = 'Invalid email recipients listed: ' + invalidEmails.join(', ');
      } else if (validEmails.length > this.emailRecipientLimit) {
        errorMessages.emailRecipientCountExceedsLimit = 'Number of valid email recipients exceeds limit of ' + this.emailRecipientLimit;
      } else {
        this.model.set('emails', isEmailsChecked ? validEmails : []);
      }
      // This is to handle the case when the recipients are saved when you click on the "OK" button in the edit node panel
      if (forceUpdateEmails) {
        this.model.set('emails', validEmails);
      }

      // Check if checkbox for "Created Object Owner" is still valid when detached from created objects
      if (!this.model.get('showNewObjectOption') && this.model.get('notifyNewObjectOwner')) {
        errorMessages.missingCreatedObject = 'Created object node no longer exists';
        this.model.set('notifyNewObjectOwner', false);
      }

      // Validate Additional Recipients options
      var validAdditionalObjectUserFields = [];
      _.each(this.model.get('additionalObjectUserFields'), (obj, idx) => {
        if (obj.contextType === 'matched' && !this.model.get('matchedObjectTypes').includes(obj.objectType)) {
          errorMessages.missingMatchedObject = 'Previously selected ' + obj.contextType + ' ' + obj.objectType + ' object node no longer exists (selected user field: ' + obj.userField + ')';
          this.matchedObjectData.delete(obj.objectType);
        } else if (obj.contextType === 'created' && !this.model.get('createdObjectTypes').includes(obj.objectType)) {
          errorMessages.missingCreatedObject = 'Previously selected ' + obj.contextType + ' ' + obj.objectType + ' object node no longer exists (selected user field: ' + obj.userField + ')';
        } else if (obj.contextType === 'triggered' && !this.model.get('triggeredObjectTypes').includes(obj.objectType)) {
          errorMessages.missingTriggeredObject = 'Previously selected ' + obj.contextType + ' ' + obj.objectType + ' object node no longer exists (selected user field: ' + obj.userField + ')';
        } else if (!Magellan.Validation.isValidUserFieldValues(obj.userField, obj.objectType, _LeanData.MetaDataController.getFieldMetaDataMap())) {
          errorMessages.invalidMatchedObjectData = 'Previously selected ' + obj.contextType + ' ' + obj.objectType + ' object field ' + obj.userField + ' no longer exists or is not a valid User field.';
        } else {
          validAdditionalObjectUserFields.push(obj);
        }
      });
      this.model.set('additionalObjectUserFields', validAdditionalObjectUserFields);

      return promise.resolve(errorMessages);
    },

    render: function() {
      this._createRecipientCards();

      var classes = _.mapValues(this._getElementClasses(), function(val) {
        return Array.from(val).join(' ');
      });

      var content = this.template({
        classes: classes,
        hasOwnerField: this.hasOwnerField,
        recipientCards: this.recipientCards,
        recipientData: this.model.toJSON(),

        matchedObjectTypes: this.model.get('matchedObjectTypes'),
        matchedObjectData: this.matchedObjectData,
        hasAdditionalObjectData: this.additionalObjects.length > 0,
        additionalOptions: this.model.get('additionalOptions') ? this.model.get('additionalOptions') : []
      })
      this.$el.html(content);

      // Render matched object dropdowns
      _.each(this.matchedObjectDropdownViews, (dropdown) => {
        this.$el.find(dropdown.selector).html(dropdown.view.$el);
        dropdown.view.delegateEvents();
      });

      // Render additional recipients dropdowns
      this.additionalRecipientRowsView = new AdditionalRecipientRowsView({
        model: this.model,
        additionalObjects: this.additionalObjects,
        _getAdditionalObjectsLabels: this._getAdditionalObjectsLabels,
      });
      this.$el.find('.additional-recipients-content').html(this.additionalRecipientRowsView.$el)

      // Initialize tooltips
      ld_initializeToolTip(this.$el.find(".additional-object-recipient-tooltip"), {
        title: _LeanData.AppState.PrimarySObjectType === "Meeting" ? "Recipients " :  "Additional Recipients",
        body: "Add users from the routed, created, or matched object as recipients here.  This node must be connected to the match or create node in order for the options to display."
      });

      // Validate
      this.validate().then((function(errorMessages) {
        if (_.isEmpty(this.recipientCards)) errorMessages.emptyEmailRecipients = 'Recipient is required';
        var $errorMessageDiv = this.$el.find('.email-recipients-error-messages');
        $errorMessageDiv.html(!_.isEmpty(errorMessages) ? Object.values(errorMessages).join('<br>') : '');
      }).bind(this));

      return this;
    },
  });
}

/*
  ChatterRecipientSelector, SlackRecipientSelector and EmailRecipientSelector are closely related. 
  If there is a fix in one please be sure to check if that fix also applies to the other.
*/
module.exports = function() {
  var AdditionalRecipientRowsView = require('../EmailRecipientSelector/AdditionalRecipientRows.view')();
  var AdditionalNonObjectRecipientRowsView = require('../RecipientSelector/AdditionalNonObjectRecipientRows.view')();

  return Backbone.View.extend({
    className: 'chatter-recipient-selector-wrapper',
    template: _.template(require('./ChatterRecipientSelector.template.html')),
    events: {
      'click .edit-recipients-button': '_showEditor',
      'click .save-receipients-button': '_hideEditor',
      'click .notif-owner-checkbox': '_toggleOwner',
      'click .subcontent-toggle': '_toggleSubcontentForm',
      'click .additional-options-checkbox' : '_toggleAdditionalOptions'
    },

    initialize: function(config) {
      //set cache state
      this.currentCacheState = _LeanData.MetaDataController.getPartnerMetaDataCache('searchChatterGroups') || {};
      this.hasOwnerField = config.hasOwnerField;
      // Check if config exists, otherwise initialize empty object
      config = config || {};
      // Set config value
      this.editMode = config.editMode || false;
      this.additionalRecipients = config.additionalNotificationOptions ? config.additionalNotificationOptions : {};
      // Set on save handler
      this.onSaveCallback = _.isFunction(config.onSave) ? config.onSave : _.noop;
      // Set limit on explicit chatter you can send. Based on salesforce chatter limits for a single action
      this.chatterRecipientLimit = Magellan.Validation.EMAIL_RECIPIENT_LIMIT || 20;
      // valid objects types for additional recipients for a chatter message
      this.chatterRecipientObjs = { 'Lead': true, 'Account': true, 'Opportunity': true, 'Case': true, 'Contact': true };
      // Set model values
      this.model = new Magellan.Models.ChatterRecipientSelector(config);

      this.model.set('chatter', true);
      this.model.set('additionalOptions', this.additionalRecipients);
      // Parse chatter channels and users dropdowns
      this._processChatterFields();
      // Parse "additionalObjectUserFields" with dropdowns
      this._processAdditionalObjectUserFields();

    },

    _processChatterFields: function() {
      this.chatterGroups = [];
      _.each(this.model.get('groups'), (chatterGroup) => {
        this.chatterGroups.push(chatterGroup);
      });
      this.chatterUsers = [];
      _.each(this.model.get('users'), (chatterUser) => {
        this.chatterUsers.push(chatterUser);
      });
    },

    _processAdditionalObjectUserFields: function() {
      var userFieldOptions = {};
      var userFieldOptionsMap = {};
      _.forEach(_LeanData._app.OBJECT_TYPES, (sobject) => {
        var flattenedFields = _.cloneDeep(_LeanData.MetaDataController.getFlattenedFieldsByObject(sobject));
        userFieldOptions[sobject] = _.filter(flattenedFields, function(field) {
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

      this.matchedObjectData = new Set();
      this.matchedObjectDropdownViews = {};
      this.additionalObjects = [];
      // Render

      _.each(this.model.get('additionalObjectUserFields'), (obj) => {
          this.additionalObjects.push(obj);
      });

      this.render();
    },

    _isValidChatterAdditionalRecipient: function(field, objType){
      if ((field === 'id' || field.endsWith('__c') || field.endsWith('__r.id'))
        && this.chatterRecipientObjs.hasOwnProperty(objType)){
        return true;
      }
      return false;
    },

    _setChatterGroupInModel: function() {
      var groups = [];
      // If .matched-object-toggle is not checked, dont iterate through the dropdown views to get values

      // if .group-toggle is not checked, dont iterate through the dropdown views to get values
      if (this.$el.find('.group-toggle').prop('checked')) {
        groups = groups.concat(this.chatterGroupRecipientRowsView.getSelections());
        this.chatterGroupRecipientRowsView.getSelections().forEach((selection) => {
          if (!(selection.id in this.currentCacheState)) this.currentCacheState[selection.id] = selection;
        });
      }
      this.model.set('groups', _.cloneDeep(groups));
    },

    _setChatterUserInModel: function() {
      var users = [];
      // If .matched-object-toggle is not checked, dont iterate through the dropdown views to get values

      // if .group-toggle is not checked, dont iterate through the dropdown views to get values
      if (this.$el.find('.user-toggle').prop('checked')) {
        users = users.concat(this.chatterUserRecipientRowsView.getSelections());
      }
      this.model.set('users', users);
    },

    _setAdditionalObjectUserFieldsInModel: function() {
      var additionalObjectUserFields = [];
      // If .matched-object-toggle is not checked, dont iterate through the dropdown views to get values
      this.matchedObjectData.clear();
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
      this._processChatterFields();
      this._processAdditionalObjectUserFields();
    },

    _setDataInModel: function() {
      this._setAdditionalObjectUserFieldsInModel();
      this._setChatterGroupInModel();
      this._setChatterUserInModel();
    },

    _hideEditor: function() {
      this._setDataInModel();
      // Validate and set data
      this.validate().then(((errorMessages) => {
        if (!_.isEmpty(errorMessages)) {
          this.$el.find('.chatter-recipients-error-messages').html(Object.values(errorMessages).join('<br>'));
          return;
        }
        // Compile data to send back in trigger/callback
        var recipientData = this._getSaveableData();
        // Trigger change
        this.trigger('savedRecipients', recipientData);
        this.onSaveCallback(recipientData);
        // Exit edit mode
        this.editMode = false;
        this._processChatterFields();
        this._processAdditionalObjectUserFields();
      }).bind(this));
    },

    _getSaveableData: function() {
      var recipientData = { groups: this.model.get('groups'), users: this.model.get('users'), };

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
      return recipientData;
    },

    _toggleOwner: function(e) {
      // Next / Previous owner checkbox handler
      var $target = $(e.target);
      this.model.set($target.data('ownerType'), $target.prop('checked'));
    },

    _toggleSubcontentForm: function(e) {
      // Toggle subcontent for Chatter and Matched Objects
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
      const getCardModel = (name, valid) => ({name: name, valid: valid});

      if (this.model.get('notifyPostOwner')) this.recipientCards.push(getCardModel('New Owner',true));
      if (this.model.get('notifyPreOwner')) this.recipientCards.push(getCardModel('Previous Owner',true));
      _.forEach(this.model.get('groups'), (chatterGroup) => { this.recipientCards.push(getCardModel(chatterGroup.label, !!this.currentCacheState[chatterGroup.id]))});
      _.forEach(this.model.get('users'), (chatterUser) => { this.recipientCards.push(getCardModel(chatterUser.label, true)) });
      _.forEach(this.model.get('additionalObjectUserFields'), (obj) => {
        if (!Magellan.Validation.isValidUserFieldValues(obj.userField, obj.objectType, _LeanData.MetaDataController.getFieldMetaDataMap())
            && !this._isValidChatterAdditionalRecipient(obj.userField, obj.objectType)) {
          this.recipientCards.push(getCardModel(_.capitalize(obj.contextType) + ' ' + obj.objectType + ' > ' + obj.userField + ' (DELETED)', false));
        } else {
          this.recipientCards.push(getCardModel(this._getAdditionalObjectsLabels([obj]), true));
        }
      });
      _.each(this.model.get('additionalOptions'), (checked, name) => {if(checked) this.recipientCards.push(getCardModel(name, true));});
    },

    _getElementClasses: function() {
      var classes = {
        'edit-recipients-button': new Set(['edit-recipients-button']),
        'chatter-recipients-wrapper': new Set(['chatter-recipients-wrapper']),
        'chatter-recipients-editor': new Set(['chatter-recipients-editor', 'hidden']),
        'empty-recipients-message': new Set(['empty-recipients-message']),
        'next-owner-row': new Set(['next-owner-row', 'hidden']),
        'previous-owner-row': new Set(['previous-owner-row', 'hidden']),
        'new-object-owner-row': new Set(['new-object-owner-row', 'hidden']),
        'matched-object-row': new Set(['matched-object-row', 'hidden']),
        'group-row': new Set(['group-row', 'hidden']),
        'user-row': new Set(['user-row', 'hidden']),
        'additional-recipients-row': new Set(['additional-recipients-row', 'hidden']),
      };
      if (this.editMode) {
        classes['edit-recipients-button'].add('invisible');
        classes['chatter-recipients-wrapper'].add('hidden');
        classes['chatter-recipients-editor'].delete('hidden');
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
      if (this.model.get('showChatterOptions')) {
        classes['group-row'].delete('hidden');
        classes['user-row'].delete('hidden');
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

    validate: function(forceUpdateChatter) {
      var promise = $.Deferred();
      var errorMessages = {};
      
      // This is to handle the case when the recipients are saved when you click on the "OK" button in the edit node panel
      if (forceUpdateChatter) this.model.set('groups', this.chatterGroups);
      if (forceUpdateChatter) this.model.set('users', this.chatterUsers);

      // Check if checkbox for "Created Object Owner" is still valid when detached from created objects
      if (!this.model.get('showNewObjectOption') && this.model.get('notifyNewObjectOwner')) {
        errorMessages.missingCreatedObject = 'Created object node no longer exists';
        this.model.set('notifyNewObjectOwner', false);
      }

      // Validate Additional Recipients options
      var validAdditionalObjectUserFields = [];
      _.each(this.model.get('additionalObjectUserFields'), (obj, idx) => {
        // Used to compare the length of simply splitting the userField string and getting the selection array from the fieldMetaData
        // If the lengths are different, a field or reference no longer exists in the fieldMetaData
        if (obj.contextType === 'matched' && !this.model.get('matchedObjectTypes').includes(obj.objectType)) {
          errorMessages.missingMatchedObject = 'Previously selected ' + obj.contextType + ' ' + obj.objectType + ' object node no longer exists (selected user field: ' + obj.userField + ')';
          this.matchedObjectData.delete(obj.objectType);
        } else if (obj.contextType === 'created' && !this.model.get('createdObjectTypes').includes(obj.objectType)) {
          errorMessages.missingCreatedObject = 'Previously selected ' + obj.contextType + ' ' + obj.objectType + ' object node no longer exists (selected user field: ' + obj.userField + ')';
        } else if (obj.contextType === 'triggered' && !this.model.get('triggeredObjectTypes').includes(obj.objectType)) {
          errorMessages.missingTriggeredObject = 'Previously selected ' + obj.contextType + ' ' + obj.objectType + ' object node no longer exists (selected user field: ' + obj.userField + ')';
        } else if (!Magellan.Validation.isValidUserFieldValues(obj.userField, obj.objectType, _LeanData.MetaDataController.getFieldMetaDataMap()) && !this._isValidChatterAdditionalRecipient(obj.userField, obj.objectType)) {
          errorMessages.invalidMatchedObjectData = 'Previously selected ' + obj.contextType + ' ' + obj.objectType + ' object field ' + obj.userField + ' no longer exists.';
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
        primaryObjectType: this.model.get('primaryObjectType'),
        recipientCards: this.recipientCards,
        recipientData: this.model.toJSON(),

        matchedObjectTypes: this.model.get('matchedObjectTypes'),
        matchedObjectData: this.matchedObjectData,
        hasAdditionalObjectData: this.additionalObjects.length > 0,
        hasChatterGroups: this.chatterGroups.length > 0,
        hasChatterUsers: this.chatterUsers.length > 0,
        additionalOptions: this.model.get('additionalOptions')
      })
      this.$el.html(content);


      // Render Chatter Group dropdown
      this.chatterGroupRecipientRowsView = new AdditionalNonObjectRecipientRowsView({
        model: this.model,
        additionalObjects: this.chatterGroups,
        type: 'chatter',
      });
      this.$el.find('.chatter-group-recipients-content').html(this.chatterGroupRecipientRowsView.$el);

      // Render Chatter User dropdown
      this.chatterUserRecipientRowsView = new AdditionalNonObjectRecipientRowsView({
        model: this.model,
        additionalObjects: this.chatterUsers,
        type: 'chatterUser',
      });
      this.$el.find('.chatter-user-recipients-content').html(this.chatterUserRecipientRowsView.$el);

      // Render additional recipients dropdowns
      this.additionalRecipientRowsView = new AdditionalRecipientRowsView({
        model: this.model,
        additionalObjects: this.additionalObjects,
        _getAdditionalObjectsLabels: this._getAdditionalObjectsLabels,
      });
      this.$el.find('.additional-recipients-content').html(this.additionalRecipientRowsView.$el);

      // Initialize tooltips
      ld_initializeToolTip(this.$el.find(".additional-object-recipient-tooltip"), {
        title: _LeanData.AppState.PrimarySObjectType === "Meeting" ? "Recipients " :  "Additional Recipients",
        body: "Add users from the routed, created, or matched object as recipients here.  This node must be connected to the match or create node in order for the options to display."
      });
      $('.additional-object-recipient-tooltip .ld-tooltip').css("display","block");
      $('.additional-object-recipient-tooltip .ld-tooltip').css("position","absolute");
      _LeanData.RemotingRouter.chatterLoggingEnabled()
      .then((result) =>{
        if (result) {
          ld_initializeToolTip(this.$el.find(".chatter-recipient-tooltip"), {
            title: "Standard LeanData Chatter Notifications",
            body: "If you’d like to disable the standard LeanData Chatter posts, please navigate to ",
            clickableContent: true,
          });
          $('.chatter-recipient-tooltip .ld-tooltip-body').append('<a href="#admin/settings" style="display:contents;font-size:12px;color:var(--ld-green)" class="hoverLink">Admin > Settings</a>.'); 
          $("a.hoverLink").hover(function() {
            $(this).css("color","var(--ld-green)");
          });
        } else {
          this.$el.find(".chatter-recipient-tooltip").hide();
        }
      });


      // Validate
      const validCards = this.recipientCards.reduce((prev, curr) => prev && curr.valid, true);
      this.validate().then((function(errorMessages) {
        if (!validCards) errorMessages.invalidGroup = 'One or more recipients are invalid. Please enter valid recipients.';
        if (_.isEmpty(this.recipientCards)) errorMessages.emptyChatterRecipients = 'Recipient is required';
        var $errorMessageDiv = this.$el.find('.chatter-recipients-error-messages');
        $errorMessageDiv.html(!_.isEmpty(errorMessages) ? Object.values(errorMessages).join('<br>') : '');
      }).bind(this));

      return this;
    },
  });
}

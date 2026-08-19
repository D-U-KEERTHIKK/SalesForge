module.exports = function() {
  return Backbone.View.extend({
    className: 'custom-message-creator-wrapper',
    template: _.template(require('./MessageCreator.template.html')),
    events: {
      'click .relative-date-btn' : '_addRelativeDate',
      'input .message-text-area': '_customTextareaHandler',
      'input .subject-input': '_subjectInputHandler',
      'click .message-text-area' : '_setCursorLocation',
      'keydown .message-text-area' : '_setCursorLocation',
      'click .subject-input' : '_setCursorLocation',
      'keydown .subject-input' : '_setCursorLocation',
      'click .restore-default' : '_setDefaultMessage',
    },

    initialize: function(config) {
      // Check if config exists, otherwise initialize empty object
      config = config || {}
      if (!config.message) config.message = '';
      if (!config.subject) config.subject = '';
      this.hasOwnerField = config.hasOwnerField;
      this.defaultMessage = config.defaultMessage;
      this.model = new Magellan.Models.MessageCreator(config);
      // Set on change handler
      this.onChangeCallback = typeof config.onChange === 'function' ? config.onChange : _.noop;
      this.messageType = this.model.get('messageType');
      var contextOptions = _.map(_LeanData.MetaDataController.getObjectContextDropdownOptions(
        this.model.get('primaryObjectType'),
        this.model.get('matchedObjectTypes'),
        this.model.get('createdObjectTypes'),
        this.model.get('triggeredObjectTypes')
      ), (objectType) => {
        if (objectType) return objectType.label;
      });
      contextOptions = contextOptions.filter((elem) => !_.isUndefined(elem) && !_.isNull(elem));
      this.contextOptionsSet = new Set(contextOptions);
      this.cursorTextArea = 'message';
      this.showNewPreviousOwnerMergeFields = this.model.get('showNewPreviousOwnerMergeFields') || false;
      this.cursorLocation = this.model.get('message').length || 0;

      // Render view after initialize
      this.render();
    },

    _initializeFieldTypeahead: function() {
      if (this.fieldTypeahead) this.fieldTypeahead.remove();
      if (this.userDropdown) this.userDropdown.remove();
      const primaryObjectType = this.model.get('primaryObjectType');
      const getDynamicData = _LeanData.Util.getDynamicFieldMetaData(_LeanData._function.VARIABLES_FIELDNAME, this.model.get('primaryObjectType'), null, null);
      const hasOwnerField = this.hasOwnerField;
      const cardData = {};
      if (hasOwnerField) {
        if (this.messageType === 'outreachCreateTask') {
          cardData['Owner'] = [
            {'type': 'owner', 'email': '', 'id': 'New.Account.Owner', 'label': 'New Account Owner', 'name': 'New Account Owner'},
            {'type': 'owner', 'email': '', 'id': 'Previous.Account.Owner', 'label': 'Previous Account Owner', 'name': 'Previous Account Owner'}
          ];
        } else {
          cardData['Owner'] = [
            {'type': 'owner', 'email': '', 'id': 'New.Owner', 'label': 'New Owner', 'name': 'New Owner'},
            {'type': 'owner', 'email': '', 'id': 'Previous.Owner', 'label': 'Previous Owner', 'name': 'Previous Owner'}
          ];
        }
      }
      cardData['Field']=[];
      if(this.messageType !== 'outreachCreateTask') {
        cardData['Field'].push(
          {'type': 'audit log', 'email': '', 'id': 'Audit.Log', 'label': 'Audit Log Link', 'name': 'Audit Log Link'}
        );
      }

      if (primaryObjectType !== 'Meeting') {
        if (hasOwnerField) cardData['Field'].push({'parent': ['Owner'], 'type': 'REFERENCE', 'label': 'Owner', 'name': 'Owner'});
        if (this.messageType !== 'outreachCreateTask') cardData['Field'].push({'type': 'audit log', 'email': '', 'id': 'Audit.Log.Full', 'label': 'Full Audit Log Link', 'name': 'Full Audit Log Link'});
      }

      let processRefreshedMetaData = function(metaData, isRefresh = false) {
        const sourceModel = this.model && !isRefresh ? this.model.toJSON() : _.cloneDeep(cardData);
        const fieldData = Object.assign({}, metaData, sourceModel);
        fieldData[_LeanData._function.VARIABLES_FIELDNAME] = cardData.Field.concat(fieldData[_LeanData._function.VARIABLES_FIELDNAME]);
        return fieldData;
      }

      // const _this = this;
      const parameters = {
        selector: 'ld-typeahead-angular#field-typeahead',
        events: {
          onSelect: (selection) => {
            if (!selection.length || (selection[selection.length-1].parent && selection[selection.length-1].parent.length !== 0) ||  selection[selection.length-1].type === 'SOBJECT') return;

            let message = '';
            const lastSelectionType = selection[selection.length-1].type;
            if (lastSelectionType === 'user') {
              message += '<@' + selection[1].id + '>';
            } else if (lastSelectionType === 'owner' || lastSelectionType === 'audit log') {
              message += '<' + selection[selection.length-1].id + '>';
            } else {
              const name = selection[0].name.startsWith('{!') ? selection[0].name.slice(2, -1) : selection[0].name;
              message += '{!' + name.toLowerCase();
              for (let index = 1; index < selection.length - 1; index++) {
                message += '.';
                if (selection[index].name.endsWith('__c')) {
                  message += selection[index].name.slice(0,-1) + 'r';
                } else {
                  message += selection[index].name.slice(0,-2);
                }
              }
              if (selection.length > 1) {
                message += '.' + selection[selection.length-1].name;
              }
              message += '}';
            }
            this._insertText(message);
          }
        },
        inputs: {
          nestingRoot: _LeanData._function.VARIABLES_FIELDNAME,
          placeholder: 'Insert Variables',
          data: processRefreshedMetaData(getDynamicData()),
          getDynamicData: function(selection) {
            const metaData = getDynamicData(selection);
            const sourceModel = this.model ? this.model.toJSON() : _.cloneDeep(cardData);
            const fieldData = Object.assign({}, metaData, sourceModel);
            fieldData[_LeanData._function.VARIABLES_FIELDNAME] = cardData.Field.concat(fieldData[_LeanData._function.VARIABLES_FIELDNAME]);
            return fieldData;
          },
          refreshMetaData: () => {
              const additionalObjects = (_LeanData.AppState && _LeanData.AppState.getCurrentVariablesHandler()) ? _LeanData.AppState.getCurrentVariablesHandler().getVariableObjectTypes() : [];
              return _LeanData.MetaDataController.getFieldsMetaData(true, additionalObjects, true);
          },
          processRefreshedMetaData: processRefreshedMetaData,
          filter: (suggestions) => {
            const objectType = suggestions[0] ? suggestions[0].objectType : '';
            const blacklistFilter = _LeanData.Util.createBlacklistFilter(objectType);

            if (!this.showNewPreviousOwnerMergeFields) {
              suggestions = _.filter(suggestions, (suggestion) => suggestion.name !== 'Owner');
            }
  
            // suggestions = _.filter(suggestions, (suggestion) => {
            //   return (suggestion.contextType || suggestion.type === 'SOBJECT') ? true : true;
            // });
            suggestions = blacklistFilter(suggestions);
            let auditElement;
            for (let i = 0; i < suggestions.length; i++) {
              if (suggestions[i].type == 'audit log') {
                auditElement = suggestions[i];
                suggestions.splice(i, 1);
                break;
              }
            }
            if (auditElement) {
              suggestions.push(auditElement);
            }

            let hasCategoryLabels = suggestions && suggestions.filter((val) => val.isCategoryLabel).length > 0;
            if (hasCategoryLabels) return suggestions;

            // so now it's {routed: [suggestions], matched: ...}
            let grouped = _.groupBy(suggestions, _LeanData.Variables.groupSuggestionsByRoutingCategory.bind(null, primaryObjectType));
            // sort each of the suggestions arrays by label
            // now it's {routed: [sorted suggestions], ...}
            grouped = _.mapValues(grouped, _.bind(_.sortBy, null, _, 'label'));

            suggestions = [
              ...(grouped.owner || []), ...(grouped.routed || []),
              ...(grouped.matched || []), ...(grouped.created || []),
              ...(grouped.other || []), ...(grouped.link || [])
            ];
            return suggestions;
          },
          validationFunction: (selection) => {
            const lastSelection = selection[selection.length - 1];
            const isParent = lastSelection && lastSelection['parent'] && lastSelection['parent'].length > 0 && lastSelection['type'] === 'REFERENCE';
            const isObjectVariable = lastSelection && lastSelection.sObject === 'SOBJECT';
            return selection.length > 1 && !isParent && !isObjectVariable;
          },
        },
      };
      _LeanData.Util.loadAngularComponent(this, parameters);

      let userDropdownOptions = ['Specific User'] ;
      if (this.model.get('primaryObjectType') !== 'Meeting') {
        if (this.hasOwnerField) userDropdownOptions = userDropdownOptions.concat(['New Owner', 'Previous Owner']);
        userDropdownOptions = userDropdownOptions.concat(['User in Field']);
      }
      this.userDropdown =  new Magellan.Views.LDDropdown({
        value: null,
        options: userDropdownOptions,
        alignMenuRight: false,
        placeholder: 'Mention User',
        onChange: (selected) => {
          switch (selected) {
            case 'New Owner':
            case 'Previous Owner':
              this._addOwnerToMessage(selected); 
              break;
            case 'Specific User':
              var specificUserSelector = new Magellan.Views.MergeFieldUsers({
                asyncServiceCall: _LeanData.FlowBuilderController.searchUsers,
              });
              specificUserSelector.open();
              this.listenTo(specificUserSelector, 'addUser', this._addUserToMessage);
              break;
            case 'User in Field':
              var routedObjectSelector = new Magellan.Views.MergeFieldObject({
                fieldMetaData: _LeanData.MetaDataController.getFieldMetaData(),
                objectType: primaryObjectType,
                fieldMetaDataFilter: _LeanData.Util.createUserFieldsFilter()
              });
              routedObjectSelector.open();
              this.listenTo(routedObjectSelector, 'addUserField', this._addUserFieldToMessage);
              break;
            default:
                console.log("Invalids option:",selected);
          }
          this.userDropdown.set(null); //default LDD Dropdown value should be here
        }
      });

      this.$el.find('.user-dropdown').html(this.userDropdown.$el);
    },

    _addUserToMessage: function(selection) {
      if ((selection[selection.length-1].parent && selection[selection.length-1].parent.length !== 0) || selection[selection.length-1].type === 'SOBJECT') return;

      var message = '';
      message += '<@' + selection[0].Id + '>';
      this._insertText(message);
    },

    _addOwnerToMessage: function(selection) {
      //separate because owners is directly from dropdown instead of modal;
      var message = '';
      message += '<' + selection.replace(' ', '.') + '>';
      this._insertText(message)
    },

    _addUserFieldToMessage: function(selection) {
      //unless there's an alternative but to pass validation which requires a '!routed {object}' in mergeFields this initial line has to be added
      //for the Mention Users portion of UserFields
      let mergeField = _LeanData.Util.convertFieldSelectionArrayToString(selection);
      const message = `<@{!routed ${this.model.get('primaryObjectType').toLowerCase()}.${mergeField}}>`
      this._insertText(message);
    },

    _addRelativeDate: function(e) {
      var relativeDateModal = new Magellan.Views.RelativeDateModal({
        isDatetime: true,
        onSelect: this._insertText.bind(this)
      });
      relativeDateModal.open();
    },

    _insertText: function(message) {
      var messageModel = this.model.get(this.cursorTextArea) || '';
      var firstHalf = messageModel.substring(0, this.cursorLocation);
      var secondHalf = messageModel.substring(this.cursorLocation, messageModel.length);
      this.model.set(this.cursorTextArea, firstHalf + message + secondHalf);
      this.render();
    },

    _customTextareaHandler: function(e) {
      this.model.set('message', $(e.target).val());

      var messageData = { message: this.model.get('message') };
      this.checkValidation();
    },

    _subjectInputHandler: function(e) {
      this.model.set('subject', $(e.target).val());
      this.checkValidation();
    },

    _setCursorLocation: function(e) {
      this.cursorTextArea = '.subject-input' === e.handleObj.selector ? 'subject' : 'message';
      this.cursorLocation =  e.target.selectionStart;
      if (e.handleObj.type === 'keydown') { 
        this.cursorLocation++;
        $('.restore-default').removeClass('disabled');
      }
    },

    _setDefaultMessage: function(e) {
      this.model.set('message', this.defaultMessage);
      var messageData = { message: this.model.get('message') };
      this.onChangeCallback(messageData);
      this.render();
    },

    checkValidation: function() {
      this.validate().then((function(errorMessages) {
        this.$el.find('.custom-error-message').html((!_.isEmpty(errorMessages)) ? Object.values(errorMessages).join('<br>') : '');
        // Compile data to send back in trigger/callback
        var messageData = { message: this.model.get('message'), subject: this.model.get('subject') };
        if (messageData && this.defaultMessage && !_LeanData.FlowBuilderGraph.isReadOnly) {
          if (messageData.message.toLowerCase() === this.defaultMessage.toLowerCase()) {
            $('.restore-default').addClass('disabled');
          } else {
            $('.restore-default').removeClass('disabled');
          }
        }

        // Trigger change
        this.trigger('createMessage', messageData);
        this.onChangeCallback(messageData);
      }).bind(this));
    },

    validate: function() {
      let promise = $.Deferred();
      let errorMessages = {};
      let emailMessageErrors = [];
      let message = this.model.get('message');
      let nodeInfo = this.model.get('nodeInfo');
      if (this.messageType === 'email') { // Only validate subject for emails
        let subject = this.model.get('subject');
        if (subject === null) errorMessages.nullSubject = 'Subject does not exist';
        if (subject === '') errorMessages.emptySubject = 'Required: Must input a subject';
        if (subject.length > 998) errorMessages.subjectLimit = 'Subject has exceeded 998 character limit';
        if (subject.includes('<Audit.Log>')) errorMessages.subjectAuditLog ='Subject may not contain a hyperlink to Audit Logs';
        emailMessageErrors = emailMessageErrors.concat(Magellan.Validation.isValidMergeFieldValueMessages(nodeInfo.name, subject, 'STRING', 'Send Notification'));
        if (!Magellan.Validation.isValidRelativeDateValue({ nodeInfo }, subject, 'DATETIME', 'Send Notification')) {
          emailMessageErrors.push('Incorrectly formatted subject. Please check the formatting of dates.');
        }
        if (!Magellan.Validation.isValidRelativeDateValue({ nodeInfo }, message, 'DATETIME', 'Send Notification')) {
          emailMessageErrors.push('Incorrectly formatted message. Please check the formatting of dates.');
        }
        this.model.set('subject', subject);
      }

      if (message === null) errorMessages.nullMessage = 'Message does not exist';
      if (message === '') errorMessages.emptyMessage = 'Required: Must input a message';

      emailMessageErrors = emailMessageErrors.concat(Magellan.Validation.isValidMergeFieldValueMessages(nodeInfo.name, message, 'STRING', 'Send Notification'));
      if (emailMessageErrors.length !== 0) {
        const escapedEmailMessageErrors = emailMessageErrors.map((unescaped) => {return _.escape(unescaped)});
        errorMessages.invalidMessage = '<i>' + escapedEmailMessageErrors.join('</i><br><i>') + '</i>';
      }

      if (!this.showNewPreviousOwnerMergeFields && this.messageType !== 'chatter') {
        if (message.includes('<New.Owner>')  || message.includes('<Previous.Owner>') ) {
          errorMessages.invalidOwner = 'New Owner and Previous Owner cannot be inserted in this message.';
        }
      }
      this.model.set('message', message);
      return promise.resolve(errorMessages);
    },

    render: function() {
      var content = this.template({
        subject: this.model.get('subject'),
        message: this.model.get('message'),
        messageType: this.messageType,
        disabled: _LeanData.FlowBuilderGraph.isReadOnly
      });
      this.$el.html(content);
      $('.restore-default').addClass('disabled');
      $('.message-text-area').on('click keydown', e => {
        this.cursorTextArea = 'message';
        this.cursorLocation =  e.target.selectionStart;
      });

      // Create nested typeahead
      this._initializeFieldTypeahead();

      this.checkValidation();

      return this;
    }

  });
}

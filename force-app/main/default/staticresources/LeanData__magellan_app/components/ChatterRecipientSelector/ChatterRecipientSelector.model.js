/* 
  RECIPIENT DATA
    notifyPostOwner: false,
    notifyPreOwner: false,
    notifyNewObjectOwner: false,
    slack: null,
    additionalObjectUserFields: [
      {
        userField: "someUserFieldName"
        objectType: "Lead"/"Contact"/"Account"/"Opportunity"
        contextType: "matched"/"created"
      },
      ...
   ]
*/
/*
  ChatterRecipientSelector and SlackRecipientSelector and EmailRecipientSelector are closely related. 
  If there is a fix in one please be sure to check if that fix also applies to the other.
*/
module.exports = function() {
  return Backbone.Model.extend({
    initialize: function(config) {
      // Defaults when model is initialized
      this.set(_LeanData.Util.getDefaultChatterNotificationSettings().recipients);
      // Set default config
      this.set(config);
      // Set specific defaults
      this.set('matchedObjectTypes', config.matchedObjectTypes || []);
      this.set('showOwnerOptions', _.isBoolean(config.notifyOwners) ? config.notifyOwners : true);
      this.set('showAdditionalObjectUserOptions', _.isBoolean(config.notifyAdditionalObjectUsers) ? config.notifyAdditionalObjectUsers : true);
      this.set('showChatterOptions', _.isBoolean(config.notifyChatterRecipients) ? config.notifyChatterRecipients : true);
      this.set('groups', config.groups || []);
      this.set('users', config.users || []);
      // For detecting when changes are made
      this.originalModel = _.cloneDeep(this.toJSON());
    }
  });
}

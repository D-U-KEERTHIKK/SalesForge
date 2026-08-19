module.exports = function() {
    return Backbone.Model.extend({
        defaults: {
            object: 'Object',
            fields: new Backbone.Collection([]),
            updates: new Backbone.Collection([])
        },

        initialize: function() {
            if (!(this.get('fields') instanceof Backbone.Collection) && _.isArray(this.get('fields'))) {
                this.set('fields', new Backbone.Collection(this.get('fields')));
            }

            if (!(this.get('updates') instanceof Backbone.Collection) && _.isArray(this.get('updates'))) {
                this.set('updates', new Backbone.Collection(this.get('updates')));
            }
        }
    });
}
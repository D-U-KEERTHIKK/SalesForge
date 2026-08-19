module.exports = function() {
    var waitingScreenTemplate = require('./waiting-screen.template.html');
    
    var WaitingScreen = Magellan.Views.WaitingScreen = Backbone.View.extend({
        tagName: 'div',
        className: 'ld-waiting-screen hidden',
        template: _.template(waitingScreenTemplate),
        messageTemplate: _.template('<div class="waiting-message"><%-message%></div>'),
        initialize: function(options) {
            this.pendingPromises = new Backbone.Collection();
            this.container = options.container || null;
            if (this.container) $(this.container).html(this.$el);
            this.render();
        },
        
        render: function() {
            this.$el.html(this.template());
            return this;
        },
        
        show: function(message) {
            message = message || 'Loading...';
            
            var aMessageEl = $(this.messageTemplate({ message : message }));
            this.$('.waiting-message-wrapper').append(aMessageEl);
            
            var waitingScreenMessagePromise = $.Deferred();
            var newPromiseModel = this.pendingPromises.add({
                promise: waitingScreenMessagePromise,
                messageEl: aMessageEl
            });
            waitingScreenMessagePromise.always(this.hide.bind(this, newPromiseModel));
            
            this.$el.toggleClass('hidden', false);
            
            return waitingScreenMessagePromise;
        },
        
        hide: function(waitingScreenMessagePromiseModel) {
            if (waitingScreenMessagePromiseModel) {
                waitingScreenMessagePromiseModel.get("messageEl").remove(); 
                this.pendingPromises.remove(waitingScreenMessagePromiseModel);
            } else {
                this.pendingPromises.reset();
            }
            
            if (this.pendingPromises.length === 0) {
                this.$el.toggleClass('hidden', true);
                this.$('.waiting-message-wrapper').empty();
            }
            
        }
    });
    
    return WaitingScreen;
}
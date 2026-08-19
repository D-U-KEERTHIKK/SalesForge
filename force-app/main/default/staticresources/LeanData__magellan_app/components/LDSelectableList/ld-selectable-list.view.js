module.exports = function() {
    var template = require("./ld-selectable-list.template.html");
    
    return Magellan.Views.LDSelectableList = Backbone.View.extend({
        tagName: 'div',
        className: 'ld-selectable-list-component',
        selected: null,
        template: _.template(template),
        listItemContentTemplate: _.template('<span><%-item%></span>'),
        _originalSelected: null,
        initialize: function(options) {
            this.model = new (Backbone.Model.extend({
                validate: _.isFunction(options.validate) ? options.validate : _.noop
            }))({
                data: options.data || []
            });
            
            this._originalSelected = options.selected || null;
            this.header = options.header || null;
            
            if (_.isFunction(options.itemTemplate)) 
                this.listItemContentTemplate = options.itemTemplate;
            else if (_.isString(options.itemTemplate) && !_.isEmpty(options.itemTemplate)) 
                this.listItemContentTemplate = _.template(options.itemTemplate);
            
            if (_.isFunction(options.notFoundTemplate))
                this.notFoundTemplate = options.notFoundTemplate;
            else if (_.isString(options.notFoundTemplate) && !_.isEmpty(options.notFoundTemplate))
                this.notFoundTemplate = _.template(options.notFoundTemplate);
            
            this.listenTo(this.model, 'change:data', this.render);
            this.listenTo(this.model, 'change:selected', this._handleModelSelectedChange);
        },
        
        events: {
            'click .ld-selectable-list-item': '_handleListItemClick'
        },
        
        render: function() {
            var content = this.template({ 
                model: this.model,
                header: this.header,
                itemContentTemplate: this.listItemContentTemplate
            });
            
            this.$el.html(content);
            this.setSelected(this.model.get('selected') || this._originalSelected);
            
            return this;
        },
        
        setSelected: function(selected) {
            selected = selected || null;
            this.model.set('selected', selected);
            
            this.validate();
        },
        
        validate: function() {
            var error = "";
            if (!this.model.isValid()) {
                error = this.model.validationError;
            }
            
            this.$('.error-message').html(error);
        },
        
        _setActiveListItem: function(itemIndex) {
            this.$('.ld-selectable-list-item.active').removeClass('active');
            if (itemIndex < 0) return;
            
            this.$('.ld-selectable-list-item').eq(itemIndex).toggleClass('active', true);
            var selected = this.model.get('data')[itemIndex];
            
            this.setSelected(selected);
        },
        
        _handleModelSelectedChange: function() {
            var selected = this.model.get('selected');
            var selectedItemIndex = this.model.get('data').indexOf(selected);
            this._setActiveListItem(selectedItemIndex);
            
            if (_.isNull(selected) || _.isUndefined(selected)) {
                this.$('.selected').html('<em class="text-muted">None</em>');
            } else if (selectedItemIndex < 0) {
                this.$('.selected').html(this.notFoundTemplate({ notFound: this._originalSelected || '' }));
            } else {
                this.$('.selected').html(this.listItemContentTemplate(this.model.get('selected')));
            }

        },
        
        _handleListItemClick: function(e) {
            var clickedAt = this.$('.ld-selectable-list-item').index(e.currentTarget);
            this._setActiveListItem(clickedAt);            
        }
    })
}
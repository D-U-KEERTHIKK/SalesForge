/**
 * Reusable Component to reproduce one radio button.
 * 
 * Instead of using pure vanilla HTML to produce:
 * <div id="radio-button">
 *   <label>
 *     <input type="radio" name="foo" value="bar" />
 *     <span>Foobar</span>
 *   </label>
 * </div>
 * 
 * Use this:
 * <div id="radio-button"></div>
 * ...
 * const radioButton = this.$el.find('#radio-button') // or $('#radio-button')
 * radioButton.LDRadioButton({
 *   label: 'Foobar',
 *   checked: true, // or false
 *   name: 'foo',
 *   value: 'bar',
 *   onSelectCallback: (value, event) => console.log(value, event),
 * });
 * 
 * Use the same name like normal to allow multiple LDRadioButtons to
 * interact as a set.
 */
module.exports = function() {
  const template = require('./LDRadioButton.template.html');

  const RadioButton = Backbone.View.extend({
    template: _.template(template),
    events: {
      'change input': 'onSelect',
    },

    // quirk with javascript only triggers 'change input' for
    // the radio button selected, but we future-proof with
    // if check anyways
    onSelect: function (event) {
      const checked = event.currentTarget.checked;
      if (checked) {
        this.onSelectCallback(this.value, event);
      }
    },

    initialize: function (options) {
      this.label = options.label;
      this.name = options.name;
      this.checked = options.checked;
      this.value = options.value;
      this.onSelectCallback = options.onSelectCallback;
      this.render();
    },

    render: function() {
      this.$el.html(
        this.template({
          label: this.label,
          name: this.name,
          checked: this.checked,
          value: this.value,
        })
      );
    },
  });

  $.fn.LDRadioButton = function (options) {
    const radioButton = new RadioButton(options);
    $(this).html(radioButton.$el);
    return radioButton;
  };
};

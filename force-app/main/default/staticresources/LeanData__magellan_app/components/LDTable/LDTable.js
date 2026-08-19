module.exports = function() {

  var view = Magellan.Views.LDTable = Backbone.View.extend({

    events: {
      'click .edit-button': 'handleEditButtonClick',
      'click .cancel-button': 'handleCancelButtonClick',
      'click .save-button': 'handleSaveButtonClick',
      'click .delete-button': 'handleDeleteButtonClick',
    },

    handleDeleteButtonClick: function(e) {
      var $row = $(e.target).closest('tr');
      var rowData = this.table.row($row).data();
      this.table.row($row).remove().draw();
      this.trigger('delete', rowData);
    },

    clear: function() {
      this.table.clear().draw();
    },

    handleCancelButtonClick: function(e) {
      var that = this;
      var $row = $(e.target).closest('tr');

      this.$el.find('.edit-button').show();
      $(".disable-while-row-edit").removeClass('disabled-by-edit');
      $row.removeClass('editing');

      var datatableRow = this.table.row($row);
      var unsavedData = this.columns.map(function(d, i) {
        var cellEditorView = d.editor;
        return cellEditorView.getValue();
      });

      var nonEmptyCells = this.currentRowData.filter(function(d) {
        return d !== "" && !_.isNull(d) && !_.isUndefined(d);
      });

      if(nonEmptyCells.length !== 0) {
        datatableRow.data(this.currentRowData);
      } else {
        datatableRow.remove();
        this.table.draw();
      }

      this.currentRowData = null;
      this.trigger('cancel');
    },

    handleSaveButtonClick: function(e) {
      var that = this;
      var $row = $(e.target).closest('tr');

      var datatableRow = this.table.row($row);
      var dateValueEditors = { start: null, end: null };
      var unsavedData = this.columns.map(function(d, i) {
        var cellEditorView = d.editor;
        if (d.name.startsWith('Start Date')) dateValueEditors.start = d.editor;
        if (d.name.startsWith('End Date')) dateValueEditors.end = d.editor;
        return cellEditorView.getValue();
      });
      var validationStatuses = this.columns.map(function(d, i) {
        var cellEditorView = d.editor;
        // each cellEditorView's validate function also handles displaying errors
        return cellEditorView.validate();
      });

      var isValidDateRange = true;
      if (!_.isEmpty(dateValueEditors.start) && !_.isEmpty(dateValueEditors.end)) {
        var start = +moment(dateValueEditors.start.getValue());
        var end = +moment(dateValueEditors.end.getValue());
        isValidDateRange = start < end;
        if (!isValidDateRange) {
          dateValueEditors.start.validate(true);
        }
      }

      if(validationStatuses.includes(false) || !isValidDateRange) {
        return;
      } else {
        this.$el.find('.edit-button').show();
        $(".disable-while-row-edit").removeClass('disabled-by-edit');
        $row.removeClass('editing');
        datatableRow.data(unsavedData.concat(this.editColHtml));
        this.trigger('change', unsavedData);
      }
    },

    handleEditButtonClick: function(e) {
      var that = this;
      var $row = $(e.target).closest('tr');
      this.enterEditMode($row);

      this.trigger('edit', $row.data());
    },

    enterEditMode: function($row) {
      var that = this;
      this.$el.find('.edit-button').hide();
      $(".disable-while-row-edit").addClass('disabled-by-edit');
      $row.addClass('editing');

      var rowIdx = this.table.row($row).index();
      this.currentRowData = _.cloneDeep(this.table.row($row).data());

      for(var colIdx = 0; colIdx < this.tableColCount; colIdx++) {
        var datatableCell = that.table.cell(rowIdx, colIdx);
        var isButtonCol = (colIdx === that.tableColCount - 1) && that.isInlineEditorEnabled;
        if(isButtonCol) {
          var editableData = '<div class="cancel-button ld-secondary-small-button">Cancel</div><div class="save-button ld-primary-small-button">Done</div>'
          datatableCell.data(editableData);
          return;
        }
        var cellData = this.currentRowData[colIdx];
        var editorView = that.columns[colIdx].editor;
        var isEditable = (!_.isUndefined(editorView) && !_.isNull(editorView));
        if(isEditable) {
          datatableCell.data('');
          editorView.setValue(cellData);
          editorView.setElement(datatableCell.node());
          editorView.render();
        } else {
          datatableCell.data(cellData);
        }
      }
    },

    addRow: function() {
      var data = Array(this.dataColCount).fill('');
      data.push(null);
      var row = this.table.row.add(data);
      this.table.draw();
      //$(row.node()).find('.edit-button').click();
      var $row = $(row.node());
      this.enterEditMode($row);
    },

    reset: function() {
      this.table.clear().draw();
      this.table.columns.adjust().draw();
      this.trigger('reset');
    },

    revert: function() {
      this.table.clear();
      this.table.rows.add(_.cloneDeep(this.originalData));
      this.table.draw();
      this.trigger('revert');
    },

    // returns table data as a 2d array
    getData: function() {
      // remove extra attributes on the data
      var datatablesData = this.table.rows().data();
      var cleanData = [];
      for(var i = 0; i < datatablesData.length; i++) {
        // remove last column
        var cleanRow = _.clone(datatablesData[i]);
        if(this.isInlineEditorEnabled) { cleanRow = cleanRow.slice(0,this.dataColCount); }
        cleanData.push(cleanRow);
      }

      return cleanData;
    },

    // returns table data as an array of maps, keyed by supplied column name
    // e.g. [
    // { 'Name': 'A US Holiday', 'Date': '10/10/2018' },
    // { 'Name': 'A Singapore Holiday', 'Date': '10/10/2018' }
    // ]
    getNamedData: function() {
      var that = this;
      var datatablesData = this.table.rows().data();
      var cleanData = [];
      for(var i = 0; i < datatablesData.length; i++) {
        // remove last column
        var cleanRow = _.clone(datatablesData[i]);
        if(this.isInlineEditorEnabled) { cleanRow = cleanRow.slice(0,this.dataColCount); }
        var rowData = {};
        cleanRow.forEach(function(d,i) {
          var colName = that.columns[i].name;
          rowData[colName] = d;
        });
        cleanData.push(rowData);
      }

      return cleanData;
    },

    initialize: function(options) {
      var that = this;

      _anyNumberSort = function(a, b, high) {
        // Remove any html tags and retrieve plain text, then convert plain text strings to integers before sorting
        a = parseInt(a.replace(/<[^>]+>/g, ''));
        a = a !== null ? a : high;
        b = parseInt(b.replace(/<[^>]+>/g, ''));
        b = b !== null ? b : high;
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
      }
      
      $.extend( $.fn.dataTableExt.oSort, {
        "any-number-asc": function (a, b) {
          return _anyNumberSort(a, b, Number.POSITIVE_INFINITY);
        },
        "any-number-desc": function (a, b) {
          return _anyNumberSort(a, b, Number.NEGATIVE_INFINITY) * -1;
        }
      });

      this.columns = options.columns;

      this.givenDatatableOptions = options.datatableOptions || {};
      this.isInlineEditorEnabled = options.isInlineEditorEnabled;
      this.dataColCount = options.columns.length;
      this.tableColCount = options.columns.length + (this.isInlineEditorEnabled ? 1 : 0);
      this.originalData = options.data;
      this.editColHtml = '<div class="edit-button ld-secondary-small-button">Edit</div><div class="delete-button ld-secondary-small-button">Delete</div>';
    }, 

    template: _.template(require("./LDTable.template.html")), 

    render: function() {
      var content = this.template({});
      this.$el.html(content);

      initializeHeaderRow.call(this);
      theview = this;
      this.table = initializeDatatable.call(this, {
        data: this.originalData,
        givenDatatableOptions: this.givenDatatableOptions,
      });

      return this;
    },

  });

  Magellan.Views.LDTableCellEditors = Magellan.Views.LDTableCellEditors || {};

  // Generic input, never instantiated
  Magellan.Views.LDTableCellEditors.Input = Backbone.View.extend({
    initialize: function() {},
    setValue: function(value) {},
    getValue: function() {},
    validate: function() {return true},
    getDisplayText: function() {}, // define this if non-edit text is different from model text
  });

  Magellan.Views.LDTableCellEditors.Text = Magellan.Views.LDTableCellEditors.Input.extend({

    template: _.template('<input class="ld-input-large" placeholder="<%- placeholder %>" value="<%- value %>"></input>'),

    initialize: function(options) {
      this.value = '';
      this.placeholder = options.placeholder || '';
    },

    render: function() {
      var content = this.template({
        value: this.value,
        placeholder: this.placeholder,
      });
      this.$el.html(content);
    },

    setValue: function(value) {
      this.value = value;
    },

    getValue: function() {
      this.value = this.$el.find('input').val();
      return this.value;
    },

    validate: function() {
      var value = this.getValue();
      if(value === '') {
        this.$el.find('input').css('border', '1px solid #ff6e6e');
        return false;
      } else {
        this.$el.find('input').css('border', '1px solid var(--lt-grey-2)');
        return true;
      }
    },

  });

  Magellan.Views.LDTableCellEditors.AsyncTypeahead = Magellan.Views.LDTableCellEditors.Input.extend({
    initialize: function(options) {
      this.placeholder = options.placeholder || 'Search';
      this.asyncServiceCall = options.asyncServiceCall || _.noop;
      this.onSelect = options.onSelect || _.noop;
      this.typeahead = null;
      this.value = null;
    },

    render: function () {
      this.typeahead = new Magellan.Views.NestedTypeaheadSelector({
          required: true,
          disableBreadcrumbs: true,
          requireSelectionFromData: true,
          selection: _.isEmpty(this.value) ? [] : [this.value],
          size: 'large',
          asyncServiceCall: this.asyncServiceCall,
          onSelect: this._onSelect.bind(this),
          placeholder: this.placeholder
      });
      this.typeahead.validate();
      this.$el.html(this.typeahead.$el);
    },
    
    _onSelect: function(typeaheadView, selection) {
      this.value = _.isArray(selection) ? selection[0] : null;
      this.onSelect(this.value);
    },
      
    getValue: function() {
      return _.isArray(this.typeahead.selection) ? this.typeahead.selection[0] : null;
    },
      
    setValue: function(value) {
      if (this.typeahead && !_.isUndefined(value)) this.typeahead.setSelection([value]);
    }, 
      
    getRenderFunction: function() {
      return _.bind(() => _.isObject(this.value) ? this.value['label'] : '');
    }
  });

  Magellan.Views.LDTableCellEditors.ReadOnly = Magellan.Views.LDTableCellEditors.Text.extend({

    template: _.template('<%- value %>'),

    initialize: function(options) {
      options = options || {};
      this.value = options.value || '';
      this.placeholder = options.placeholder || '';
      this.readOnly = true;
    },

    render: function() {
      var content = this.template({ value: this.value });
      this.$el.html(content);
    },

    setValue: function(value) {
      this.value = value || this.placeholder;
    },

    getValue: function() {
      return this.value;
    },

    validate: function() {
      return true;
    },

  });

  Magellan.Views.LDTableCellEditors.DateTime = Magellan.Views.LDTableCellEditors.Text.extend({

    template: _.template('<input placeholder="<%- placeholder %>" class="datetime-cell-input ld-input-large" value="<%- value %>"></input>'),

    initialize: function(options) {
      this.value = '';
      this.placeholder = options.placeholder || '';
      this.timeFormat = options.timeFormat || 'HH:mm:ss';
      this.isEndDate = options.isEndDate || false;
    },

    render: function() {
      var content = this.template({
        value: this.value,
        placeholder: this.placeholder,
      });
      this.$el.html(content);

      $(this.$el.find('input')).datetimepicker({
        dateFormat: 'yy-mm-dd',
        timeFormat: this.timeFormat,
        timeInput: true,
        showHour: false,
        showMinute: false,
        showSecond: false,
        hour: this.isEndDate ? 23 : 0,
        minute: this.isEndDate ? 59 : 0,
        second: this.isEndDate ? 59 : 0,
      });
    },

    setValue: function(value) {
      this.value = value;
    },

    getValue: function() {
      this.value = this.$el.find('input').val();
      return this.value;
    },

    validate: function(forceInvalidate) {
      var value = this.getValue();
      if(value === '' || forceInvalidate) {
        this.$el.find('input').css('border', '1px solid #ff6e6e');
        return false;
      } else {
        this.$el.find('input').css('border', '1px solid var(--lt-grey-2)');
        return true;
      }
    },

  });

  Magellan.Views.LDTableCellEditors.TimeZone = Magellan.Views.LDTableCellEditors.Input.extend({

    template: _.template('<div class="ld-dropdown-small timezone-dropdown"></div>'),

    initialize: function(options) {
      this.value = options.value || '';
      this.placeholder = options.placeholder || 'Select one';
    },

    render: function() {
      var content = this.template({
        value: this.value,
        placeholder: this.placeholder,
      });
      this.$el.html(content);

      var browserTimezone = _LeanData.DateUtil.guessUserTimezone();
      var preferredTimezones = browserTimezone ? [browserTimezone] : null;        
      this.tzDropdown = new Magellan.Views.LDDropdown({
        required: true,
        value: this.value || undefined,
        options: Object.keys(_LeanData.DateUtil.getTimezonesMap()),
        placeholder: this.placeholder,
        optionTemplate: function(option) {
          return _.template('<span><%- option %></span>')({ option: _LeanData.DateUtil.getTimezonesNameMap()[option] })
        },
        onChange: function(name) {
          this.value = name;
        }.bind(this),
        preferredOptions: preferredTimezones,
        tokenizer: _LeanData.DateUtil.timezoneTokenizer.bind(_LeanData.Util),
      });
      this.$el.find(".timezone-dropdown").html(this.tzDropdown.$el);
    },

    setValue: function(value) {
      this.value = value;
    },

    getValue: function() {
      return this.value;
    },

    validate: function() {
      return this.tzDropdown.validate();
    },

  });

};

function initializeDatatable(params) {
  var defaultDatatableOptions = {
    "columns": this.columns,
    "columnDefs": [
    ],
    "data": params.data,
    "paginate": false,
    "autoWidth": true,
    "scrollInfinite":true,
    "scrollCollapse":false,
    "scrollY":"450px",
    "searchDelay":0,
    "deferRender": false,
    "dom": "frtp", // 'lfrtip' is default Datatables initialization.
    "select": true,
    "rowId": 'data-cid',
    "language": {
      "search": "",
      "searchPlaceholder": "Search"
    },
    createdRow: function(row, data, index) {
      if (!params.givenDatatableOptions.disableRowHover) {
        $(row).addClass('hover-row');
      }
      _.each(params.givenDatatableOptions.additionalRowDataAttributes, (attr) => {
        $(row).prop(attr.prop, data[attr.dataVal]);
      });
    },
    drawCallback: function(d) {
    },

  };
  var overriddenOptions = {
    "columnDefs": []
  };
  if(this.isInlineEditorEnabled) {
    var lastColIdx = this.tableColCount - 1;
    overriddenOptions['columnDefs'].push({
      orderable: false,
      targets: lastColIdx,
      defaultContent: this.editColHtml
    });
  }
  this.columns.forEach(function(d, i) {
    var editor = d.editor;
    if(editor && 'getRenderFunction' in editor) {
      overriddenOptions['columnDefs'].push({
        targets: i,
        render: editor.getRenderFunction()
      });
    }
  });
  var options = _.defaultsDeep(params.givenDatatableOptions, defaultDatatableOptions, overriddenOptions);
  var table = $(this.$el.find(".ld-table")).DataTable(options);
  return table;
}
function initializeHeaderRow() {
  var $headerRow = this.$el.find('.header-row');

  this.columns.forEach(function(column) {
    $headerRow.append('<th>' + column.name + '</th>');
  });

  if(this.isInlineEditorEnabled) {
    $headerRow.append('<th></th>');
  }

}
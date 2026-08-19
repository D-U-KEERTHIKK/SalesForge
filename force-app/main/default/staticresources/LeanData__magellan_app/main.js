// When exporting this components in this file into Overlord / Beacon, the Magellan global variables must be defined
// This will actuall run before Dashboard.page defines these variables due to the fact that this webpack-bundled main.js file will be imported via "apex:includeScript" rather than a standard script tag
window.Magellan = window.Magellan || {
  Initializers: {},
  Models: {},
  Views: {},
  Controllers: {},
  Navigation: {}, 
  Migration: {},
  Validation: {}, 
};

// FlowBuilder
window.initializeNewViews = require('./flowbuilder/new_view');
window.initializeMagellanValidation = require('./flowbuilder/validation');

window.initializePendingDetail= require('./flowbuilder/PendingDetails/pending_detail.js');
window.initializePendingDetailView = require('./flowbuilder/PendingDetails/pending_detail_view.js');
window.initializePendingDetailTable = require('./flowbuilder/PendingDetails/pending_detail_table.js');
window.initializePendingDetailTableRow = require('./flowbuilder/PendingDetails/pending_detail_table_row.js');
window.initializePendingDetailModels = require('./flowbuilder/PendingDetails/pending_model.js');
// Help
window.initializeMyAccountModule = require('./flowbuilder/Help/help.module');
// AdvancedSettings - New Account Creation
window.initializeAdvancedSettingsAccountCreationModule = require('./flowbuilder/AdvancedSettings/AccountCreation/account-creation.module');

// account router
window.accountRouterModule = require('./flowbuilder/AccountRouter/account-router.module');
// case router
window.caseRouterModule = require('./flowbuilder/CaseRouter/case-router.module');
// ContactRouter
window.contactRouterModule = require('./flowbuilder/ContactRouter/contact-router.module');
// OpportunityRouter
window.opportunityRouterModule = require('./flowbuilder/OpportunityRouter/opportunity-router.module');

// Territory
window.initializeTerritorySegments = require('./flowbuilder/Territory/territory-segments.module');
window.initializeTerritorySegmentAssignments = require('./flowbuilder/Territory/territory-segment-assignments.module');
window.initializeTerritorySegmentEditor = require('./flowbuilder/Territory/territory-segment-editor.module');

// Round Robin
window.initializeRoundRobinPools = require('./flowbuilder/RoundRobin/RoundRobinPools/round-robin-pools.module');
window.initializeRoundRobinPoolsCreator = require('./flowbuilder/RoundRobin/RoundRobinPools/Creator/round-robin-pools-creator.module');

window.meetingRouterModule = require('./flowbuilder/MeetingRouter/meeting-router.module');

// import and initialize components
require('./components/SOFieldUpdater/SOFieldUpdater')();
require('./components/ConfirmationModal/ConfirmationModal')();
require('./components/PaginatedModal/PaginatedModal')();
require('./components/LDInput/LDInput')();
require('./components/LDTable/LDTable')();
require('./components/LDDropdown/LDDropdown')();
require('./components/ButtonDropdown/ButtonDropdown')();
require('./components/NestedTypeaheadSelector/NestedTypeaheadSelector')();
require('./components/NestedTypeaheadSelector/MultiNestedTypeaheadSelector')();
require('./components/LDSelectableList/ld-selectable-list.view')();
require('./components/WaitingScreen/waiting-screen.view')();
require('./components/LDMultiSelect/LDMultiSelect.view')();
require('./components/TupleConditions/tuple-conditions.view')();
require('./components/TupleConditions/single-tuple-condition.view')();
require('./components/ErrorBanner/ErrorBanner.view')();
require('./components/EmailTemplateSelector/EmailTemplateSelector.module')();
require('./components/EmailRecipientSelector/EmailRecipientSelector.module')();
require('./components/ChatterRecipientSelector/ChatterRecipientSelector.module')();
require('./components/MessageCreator/MessageCreator.module')();
require('./components/DataCards/datacards.view')();
require('./components/LineGraph/linegraph.view')();
require('./components/LDRadioButton/LDRadioButton')();
require('./components/VariableCreator/variable-creator.module')();
require('./components/UserFields/user-fields.module')();

// Templates that are loaded in initializers.js, but not webpacked through this file
window.modal_template = require("./templates/modal_template.html");
window.territory_rename = require("./templates/modals/territory-rename.html");
window.territory_create = require("./templates/modals/territory-create.html");
window.territory_copy = require("./templates/modals/territory-copy.html");

// Legacy util to package, temporary exception case. DO NOT add additional util methods in this file
/**
 * Generates the tooltip for a given element
 * @param {any} $elem The tooltip element
 * @param {string} options.title The tooltip title text
 * @param {string} options.body The tooltip body text
 * @param {boolean} [options.fixedPosition] Determines if the tooltip position is fixed or absolute
 * @param {string | number} [options.fixedLeft] The left positioning of a fixed tooltip. Requires 'fixedPosition' to be true
 * @param {string | number} [options.fixedTop] The top positioning of a fixed tooltip. Requires 'fixedPosition' to be true
 * @param {boolean} [options.renderOnLeft] Determines if the tooltip opens to the left or right of the element. Requires 'fixedPosition' to be false
 * @param {string | number} [options.width] The width of the tooltip
 * @param {boolean} [options.clickableContent] Determines if the tooltip is clickable
 */
window.ld_initializeToolTip = function($elem, options) {
  var fadeDuration = 100;
  var tooltipHtml = _.template(require('./templates/tooltip.html')) ({
    title: options.title,
    body: options.body
  });
  var $tooltip = $(tooltipHtml).appendTo($elem);
  if (options.fixedPosition) {
    $tooltip.css('position', 'fixed');
    if (options.fixedLeft) $tooltip.css('left', options.fixedLeft);
    if (options.fixedTop) $tooltip.css('top', options.fixedTop);
  } else {
    if (options.renderOnLeft) {
      $tooltip.css('right', '25px');
      $tooltip.css('left', 'unset');
    } else {
      $tooltip.css('right', 'unset');
      $tooltip.css('left', '25px');
    }
  }
  if (options.width) $tooltip.css('width', options.width);
  $elem.off();
  $elem.click(function(d) {
    d.stopPropagation();
    if (!options.clickableContent) d.preventDefault(); //This option will not work if used inside a radio button
    $('.page-content .ld-tooltip').not($tooltip).fadeOut(fadeDuration);
    if(!$(d.target).hasClass('ld-tooltip-close-icon')) {
      $tooltip.fadeIn(fadeDuration);
    }
  });
  $tooltip.find('.ld-tooltip-close-icon').click(function(d) { $tooltip.fadeOut(fadeDuration); });

  $('.page-content').off();
  $('.page-content').click(function(e) {
    if(!$(e.target).closest('.ld-tooltip-hint').length) {
      $('.ld-tooltip').fadeOut(fadeDuration);
    }
  });
}

//# sourceURL=magellan/main.js

angular
  .module('dcApp', ['dcApp.services', 'dcApp.controllers', 'dcApp.directives', 'ngSanitize', 'plauti-ng-slds'])

  .filter('valueToLabel', function () {
    return function (input) {
      var labels = {
        scenarioCount: 'Scenario Limit',
        batchFilter: 'Batch Filter',
        batchSchedule: 'Batch Schedule',
        crossObject: 'Cross Object',
        recordType: 'Record Type',
        customFields: 'Custom Fields',
        customObjects: 'Custom Objects',
        standardObject: 'Standard Object',
        advancedMatching: 'Advanced Fuzzy Matching',
        configuredMerge: 'Merge Configuration',
        multipleMerge: 'Multiple Merge',
        batchMerge: 'Batch Merge',
        quickMerge: 'Quick Merge',
        batchConvert: 'Batch Convert',
        quickConvert: 'Quick Convert',
        pageConvert: 'Deduplicate Convert',
        pageMerge: 'Deduplicate Merge',
        pageCheck: 'Deduplicate Check',
        api: 'API Enabled',
        uniqueUpload: 'Unique Upload',
        web2Lead: 'Web2Lead',
        batchDeduplication: 'Deduplicate Job',
        duplicatePrevention: 'Duplicate Prevention',
        basicObject: 'Basic Objects',
        batchExport: 'Batch Objects',
        pageLayout: 'Deduplicate Live',
        pageEntry: 'Deduplicate Entry',
        advancedDiscard: 'Deduplicate Discard',
        directProcessing: 'Deduplicate Direct',
        plugin: 'Extension Plugins',
        setForMerge: 'Set For Merge',
        directProcessing: 'Direct Processing',
        auditLogging: 'Audit Logging',
        frequentWords: 'Deduplicate Frequent Words'
      };

      return labels[input];
    };
  });

angular
  .module('dcApp.controllers', [])
  .controller('licenseController', function ($scope, $rootScope, $interval, remoting, $location) {
    $scope.init = function () {
      $scope.dataContainer = angular.element('div#dataStore');
      $scope.endpoint = {};
      $scope.endpoint.getLicense = $scope.dataContainer.data('sf-get-license');
      $scope.endpoint.refreshLicense = $scope.dataContainer.data('sf-refresh-license');
      $scope.endpoint.getSandboxList = $scope.dataContainer.data('sf-get-sandbox-list');
      $scope.endpoint.addSandbox = $scope.dataContainer.data('sf-get-add-sandbox');
      $scope.endpoint.deleteSandbox = $scope.dataContainer.data('sf-delete-sandbox');

      $scope.meta = {};
      $scope.meta.isLoading = false;
      $scope.meta.sbLoading = false;
      $scope.meta.trialCheckbox = true;

      $scope.data = {};
      $scope.sbList = [];

      $scope.sbmodel = {};
      $scope.sbmodel.open = false;
      $scope.sbmodel.name;
      $scope.sbmodel.org;

      $location.absUrl().match(/\?refresh=true/) != null
        ? $scope.retrieveLicense('refresh')
        : $scope.retrieveLicense('init');
    };

    $scope.deleteSandbox = function (sbId) {
      if (empty(sbId)) {
        alert('Please provide the org id for delete');
        return;
      }
      $scope.meta.sbLoading = true;
      var getter = remoting.singleService($scope.endpoint.deleteSandbox, sbId);
      getter.then(
        function (result) {
          if (result.value) {
            $scope.sbList = result.value;
          }
          $scope.meta.sbLoading = false;
        },
        function (reason) {
          alert(reason);
          $scope.meta.sbLoading = false;
        }
      );
    };

    $scope.getSandboxList = function () {
      $scope.meta.sbLoading = true;
      var getter = remoting.emptyService($scope.endpoint.getSandboxList);
      getter.then(
        function (result) {
          if (result.value) {
            $scope.sbList = result.value;
          }
          $scope.meta.sbLoading = false;
        },
        function (reason) {
          alert(reason);
          $scope.meta.sbLoading = false;
        }
      );
    };

    $scope.sbModelClose = function () {
      $scope.sbmodel = {};
      $scope.sbmodel.open = false;
      $scope.sbmodel.name = '';
      $scope.sbmodel.org = '';
      $scope.sbmodel.creating = false;
    };

    $scope.addSandbox = function () {
      $scope.sbmodel.creating = true;
      if (empty($scope.sbmodel.name)) {
        alert('Please provide a name for the sandbox');
        $scope.sbmodel.creating = false;
        return;
      }

      if (empty($scope.sbmodel.org)) {
        alert('Please provide a correct Organization Id for the sandbox');
        $scope.sbmodel.creating = false;
        return;
      }

      var setter = remoting.doubleService($scope.endpoint.addSandbox, $scope.sbmodel.name, $scope.sbmodel.org);
      setter.then(
        function (result) {
          if (result.value) {
            $scope.sbList = result.value;
            $scope.sbModelClose();
          }
        },
        function (reason) {
          alert(reason);
          $scope.sbmodel.creating = false;
        }
      );
    };

    $scope.openUrl = function (url) {
      dcNavigate(url, '');
    };

    $scope.openFreePlus = function (orgId) {
      dcNavigateNew(
        'https://www.duplicatecheck.com/register/' + orgId + '/' + ($scope.data.information.isSandbox ? '1' : '0'),
        'utm_source=DC3&utm_medium=applicatie&utm_campaign=Register%20Free%20Plus'
      );
    };

    $scope.openPricing = function () {
      dcNavigateNew(
        'https://www.duplicatecheck.com/pricing',
        'utm_source=DC3&utm_medium=applicatie&utm_campaign=License%20Price'
      );
    };

    $scope.retrieveLicense = function (type) {
      $scope.meta.isLoading = true;
      var endpoint = $scope.endpoint.refreshLicense;

      if (type.toLowerCase() == 'init') {
        endpoint = $scope.endpoint.getLicense;
      }

      var getter = remoting.emptyService(endpoint);
      getter.then(
        function (result) {
          if (result.value) {
            $scope.data = result.value;

            $scope.data.available = {};
            $scope.data.locked = {};

            angular.forEach(result.value.features, function (v, k) {
              if (k != 'multipleScenarios' && k != 'sandboxCount' && k != 'scenarioCount') {
                if (v == true) {
                  $scope.data.available[k] = v;
                } else {
                  $scope.data.locked[k] = v;
                }
              }
            });
          }

          $scope.data.lockedSize = Object.keys($scope.data.locked).length;

          $scope.meta.isLoading = false;
        },
        function (reason) {
          alert(reason);
          $scope.meta.isLoading = false;
        }
      );
    };

    $scope.init();
  });

angular.module('dcApp', [
  'dcApp.services',
  'dcApp.controllers',
  'dcApp.directives',
  'ngSanitize',
  'plauti-ng-slds',
  'LocalStorageModule'
]);

angular
  .module('dcApp.controllers', [])
  .controller('searchController', function ($scope, $rootScope, remoting, localStorageService) {
    var dataContainer = angular.element('div#dataStore');
    $rootScope.endpoint = {};
    $rootScope.endpoint.getLayout = dataContainer.data('sf-get-layout');
    $rootScope.endpoint.search = dataContainer.data('sf-search');
    $rootScope.endpoint.relatedTypeAhead = dataContainer.data('sf-typeahead');
    $rootScope.endpoint.url = dataContainer.data('url-entry');
    $rootScope.endpoint.currentPage = dataContainer.data('base-url');
    $scope.helpPage =
      dc3Translate('URL_SUPPORT_USAGE_DC_SEARCH_PAGE', 'https://support.duplicatecheck.com') +
      '?utm_source=dcApp&utm_medium=app&utm_campaign=help_link';

    $scope.openUrl = function (url) {
      dcNavigateNew(url, '');
    };
  })
  .controller('templateController', function ($scope, $rootScope, remoting, localStorageService) {
    var init = function () {
      $scope.referenceOptions = {};
      $scope.integerPattern = '[0-9]*';
      $scope.isLoading = false;
      $scope.objectPrefix = $scope.activeTab;
      $scope.data = {};

      $scope.isSearching = false;
      $scope.hasSearched = false;
      $scope.isEmpty = false;
      $scope.showInput = true;
    };

    $scope.toggleInput = function () {
      $scope.showInput = true;
    };

    var getLayout = function () {
      $scope.isLoading = true;
      var getter = remoting.singleService($rootScope.endpoint.getLayout, $scope.objectPrefix);
      getter.then(
        function (searchResult) {
          $scope.meta = searchResult.value;
          if (searchResult.objectData) {
            $scope.data = searchResult.objectData;
          }
          $scope.isLoading = false;
        },
        function (reason) {
          alert(reason);
          $scope.isLoading = false;
        }
      );
    };

    $scope.doSearch = function () {
      $scope.isSearching = true;
      $scope.isEmpty = false;
      var getter = remoting.doubleService(
        $rootScope.endpoint.search,
        $scope.meta.objectMeta.Prefix,
        inputArrayToJson($scope.data)
      );
      getter.then(
        function (searchResult) {
          if (searchResult.value.objectCount == 0) {
            $scope.isEmpty = true;
          } else {
            $scope.isEmpty = false;
          }
          $scope.result = searchResult.value;
          $scope.isSearching = false;
          $scope.hasSearched = true;
          $scope.showInput = false;
        },
        function (reason) {
          alert(reason);
          $scope.isSearching = false;
        }
      );
    };

    $scope.doCreateRecord = function () {
      var inputData = $scope.data;

      if (isSalesforce1()) {
        if (inputData.hasOwnProperty('recordTypeId')) {
          sforce.one.createRecord($scope.meta.objectMeta.NameCorrect, inputData['recordTypeId']);
          return;
        } else {
          sforce.one.createRecord($scope.meta.objectMeta.NameCorrect);
          return;
        }
      }

      var uri = '';
      if (inputData.hasOwnProperty('recordTypeId')) {
        if (inputData['recordTypeId'] != 'empty') {
          uri = uri + '&RecordType=' + window.encodeURIComponent(inputData['recordTypeId']);
        }
        delete inputData['recordTypeId'];
      }
      uri = uri + '&input=' + utf8_to_b64(JSON.stringify(inputData));
      dcNavigateNew('/' + window.encodeURIComponent($scope.meta.objectMeta.PrefixCorrect) + '/e', uri);
    };

    $scope.getLookup = function (relatedObject, searchText, field, optionalFields) {
      angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

      var getter = remoting.tripleService(
        $rootScope.endpoint.relatedTypeAhead,
        relatedObject,
        searchText,
        optionalFields
      );
      getter.then(
        function (searchResult) {
          $scope.referenceOptions[field] = searchResult;
        },
        function (reason) {
          alert(reason);
        }
      );
    };

    init();
    getLayout();
  });

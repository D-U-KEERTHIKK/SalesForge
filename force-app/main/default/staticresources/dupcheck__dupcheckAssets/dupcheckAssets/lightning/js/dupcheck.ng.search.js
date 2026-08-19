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
  .controller('searchController', function ($scope, $rootScope, remoting) {
    var dataContainer = angular.element('div#dataStore');
    $rootScope.endpoint = {};
    $rootScope.endpoint.getLayout = dataContainer.data('sf-get-layout');
    $rootScope.endpoint.search = dataContainer.data('sf-search');
    $rootScope.endpoint.relatedTypeAhead = dataContainer.data('sf-typeahead');

    $scope.openUrl = function (url) {
      dcNavigateNew(url, '');
    };
  })
  .controller('templateController', function ($scope, $rootScope, remoting, localStorageService) {
    var init = function () {
      $scope.data = {};

      $scope.meta = {};
      $scope.meta.integerPattern = '[0-9]*';
      $scope.meta.isLoading = false;
      $scope.meta.objectPrefix = $scope.activeTab;
      $scope.meta.isSearching = false;
      $scope.meta.hasSearched = false;
      $scope.result = {};
      $scope.referenceOptions = {};

      $scope.getLayout();
    };

    $scope.getLayout = function () {
      $scope.meta.isLoading = true;
      var getter = remoting.singleServiceEscape($rootScope.endpoint.getLayout, $scope.meta.objectPrefix);
      getter.then(
        function (searchResult) {
          $scope.meta = searchResult.value;
          if (searchResult.objectData) {
            $scope.data = searchResult.objectData;
          }
          $scope.meta.isLoading = false;
        },
        function (reason) {
          alert(reason);
          $scope.meta.isLoading = false;
        }
      );
    };

    $scope.doSearch = function () {
      $scope.meta.isSearching = true;
      $scope.meta.isEmpty = false;
      var getter = remoting.doubleService(
        $rootScope.endpoint.search,
        $scope.meta.objectMeta.Prefix,
        inputArrayToJson($scope.data)
      );
      getter.then(
        function (searchResult) {
          $scope.result = searchResult.value;
          $scope.meta.isSearching = false;
          $scope.meta.hasSearched = true;
        },
        function (reason) {
          alert(reason);
          $scope.meta.isSearching = false;
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
      if (relatedObject == 'RecordType') {
        relatedObject = relatedObject + '.' + $scope.meta.objectMeta.Prefix;
      }

      var getter = remoting.tripleService(
        $rootScope.endpoint.relatedTypeAhead,
        relatedObject,
        searchText,
        optionalFields
      );
      getter.then(
        function (result) {
          $scope.referenceOptions[field] = result;
        },
        function (reason) {
          alert(reason);
        }
      );
    };

    init();
  });

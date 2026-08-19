angular
  .module('dcApp.controllers', ['LocalStorageModule'])
  .controller('auditController', function ($scope, $rootScope, remoting, localStorageService) {
    var dataStore = angular.element('#dataStore');
    $rootScope.endpoint = {};
    $rootScope.endpoint.getAuditData = dataStore.data('sf-get-audit-data');
    $rootScope.endpoint.related = dataStore.data('sf-related');
    $rootScope.endpoint.deleteAudit = dataStore.data('sf-delete-audit');

    $scope.meta = {};
    $scope.meta.ownerId = 'Owner ID';
    $scope.meta.userLookupObject = { User: { Label: 'User', Name: 'User', SldsIcon: 'user' } };
    $scope.data = {};
    $scope.lookupData = {};
    $scope.referenceData = {};

    $scope.filter = {};
    var resetFilter = function () {
      var filterData = {};
      filterData.startDate = undefined;
      filterData.endDate = undefined;
      filterData.userId = undefined;
      filterData.recordId = undefined;
      filterData.auditType = undefined;
      filterData.objectPrefix = undefined;
      filterData.pageSize = 10;
      filterData.pageCount = 0;
      $scope.filter = filterData;
    };

    $scope.getLookup = function (objectList, needle, field, optionalFields) {
      /*
        var objectItem = '';
        if (angular.isArray(objectList)) {
            objectItem = objectList.join();
        } else {
            objectItem = objectList;
        }
        */

      angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

      var options = [];

      if (needle && needle.length > 1) {
        var getter = remoting.tripleService($rootScope.endpoint.related, objectList, needle, optionalFields);
        getter.then(
          function (searchResult) {
            options = searchResult;
            $scope.lookupData[field] = options;
          },
          function (reason) {
            $scope.lookupData[field] = [];
          }
        );
      } else {
        $scope.lookupData[field] = options;
      }
    };

    $scope.openObject = function (recordId) {
      dcNavigateRecordNew(recordId);
    };

    $scope.openUrl = function (url) {
      dcNavigateNew(url, '');
    };

    $scope.doDeleteAudit = function () {
      $scope.meta.loadingDelete = true;
      var getter = remoting.emptyService($rootScope.endpoint.deleteAudit);
      getter.then(
        function (searchResult) {
          $scope.meta.loadingDelete = false;
          $scope.meta.ModalDelete = false;
          resetFilter();
          $scope.getAuditData(false);
        },
        function (reason) {
          $scope.meta.loadingDelete = false;
          alert(reason);
        }
      );
    };

    $scope.doRefresh = function () {
      $scope.filter.pageSize = 10;
      $scope.filter.pageCount = 0;
      $scope.getAuditData(false);
    };

    $scope.getMore = function () {
      $scope.filter.pageCount = $scope.filter.pageCount + 1;
      $scope.getAuditData(true);
    };

    $scope.getAuditData = function (fetchExtra) {
      $scope.meta.loadingData = true;

      if (!fetchExtra) {
        $scope.data = {};
      }

      var getter = remoting.singleService($rootScope.endpoint.getAuditData, $scope.filter);
      getter.then(
        function (searchResult) {
          if (!fetchExtra) {
            $scope.data = searchResult;
          } else {
            angular.forEach(searchResult.auditList, function (v, k) {
              $scope.data.auditList.push(v);
            });

            angular.forEach(searchResult.auditData, function (v, k) {
              $scope.data.auditData[k] = v;
            });

            angular.forEach(searchResult.recordMap, function (v, k) {
              $scope.data.recordMap[k] = v;
            });

            $scope.data.isMore = searchResult.isMore;
            $scope.data.deleteActive = searchResult.deleteActive;
          }

          $scope.meta.loadingData = false;
        },
        function (reason) {
          $scope.meta.loadingData = false;
          alert(reason);
        }
      );
    };

    $scope.clearFilter = function () {
      resetFilter();
    };

    $scope.applyFilter = function () {
      $scope.filter.pageSize = 10;
      $scope.filter.pageCount = 0;
      $scope.getAuditData(false);
      $scope.meta.ModalFilter = false;
    };

    var init = function () {
      $scope.meta.loadingData = true;
      resetFilter();
      $scope.getAuditData(false);
    };
    init();
  });

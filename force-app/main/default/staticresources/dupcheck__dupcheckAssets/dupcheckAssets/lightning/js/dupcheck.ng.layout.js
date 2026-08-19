angular.module('dcApp', ['dcApp.services', 'dcApp.controllers', 'dcApp.directives', 'ngSanitize', 'plauti-ng-slds']);

angular
  .module('dcApp.controllers', [])
  .controller('rootController', function ($scope, $rootScope, remoting) {
    var dataContainer = angular.element('div#dataStore');
    $rootScope.endpoint = {};
    $rootScope.endpoint.doCheck = dataContainer.data('sf-check');
    $rootScope.endpoint.objectId = dataContainer.data('object-id');
  })
  .controller('searchController', function ($scope, $rootScope, remoting) {
    $scope.init = function () {
      $scope.resultCount = 0;
      $scope.isLoading = false;
      $scope.isEmpty = false;
    };

    $scope.doCheck = function () {
      $scope.isLoading = true;
      $scope.resultCount = 0;
      var getter = remoting.singleService($rootScope.endpoint.doCheck, $rootScope.endpoint.objectId);
      getter.then(
        function (result) {
          $scope.noScenario = result.value.noScenario;
          $scope.resultCount = result.value.objectCount;
          $scope.searchResult = result.value.searchResult;
          $scope.objectMeta = result.value.objectMeta;
          $scope.resultField = result.value.resultField;
          $scope.resultCard = result.value.resultCard;
          $scope.objectMap = result.value.objectMap;
          $scope.resultData = result.value.resultData;

          if ($scope.resultCount == 0) {
            $scope.isEmpty = true;
          }

          $scope.isLoading = false;
        },
        function (reason) {
          alert(reason);
          $scope.isLoading = false;
        }
      );
    };

    $scope.init();
    $scope.doCheck();
  });

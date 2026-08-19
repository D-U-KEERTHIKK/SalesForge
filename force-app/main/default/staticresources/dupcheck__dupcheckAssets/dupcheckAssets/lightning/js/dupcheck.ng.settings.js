angular.module('dcApp', ['dcApp.services', 'dcApp.controllers', 'dcApp.directives', 'ngSanitize', 'plauti-ng-slds']);

angular
  .module('dcApp.controllers', [])
  .controller('settingsController', function ($scope, $rootScope, $interval, remoting) {
    $scope.init = function () {
      var dataContainer = angular.element('div#dataStore');

      $scope.endpoint = {};
      $scope.endpoint.getConfig = dataContainer.data('sf-get-config');
      $scope.endpoint.deleteTempAll = dataContainer.data('sf-delete-temp-all');
      $scope.endpoint.updateSetting = dataContainer.data('sf-update-setting');

      $scope.meta = {};
      $scope.meta.isLoading = false;

      $scope.getConfig();
    };

    $scope.openUrl = function (url) {
      dcNavigate(url, '');
    };

    $scope.getConfig = function () {
      $scope.meta.isLoading = true;
      var getter = remoting.emptyService($scope.endpoint.getConfig);
      getter.then(
        function (result) {
          if (result.value) {
            $scope.data = result.value;
          }
          $scope.meta.isLoading = false;
        },
        function (reason) {
          alert(reason);
          $scope.meta.isLoading = false;
        }
      );
    };

    $scope.startDeleteTempAll = function () {
      $scope.data.dc3SearchBatchDelete = true;

      var setter = remoting.emptyService($scope.endpoint.deleteTempAll);
      setter.then(
        function (result) {
          $scope.data.dc3SearchBatchDelete = false;
        },
        function (reason) {
          alert(reason);
          $scope.data.dc3SearchBatchDelete = false;
        }
      );
    };

    $scope.updateSetting = function (name) {
      var setter = remoting.doubleService($scope.endpoint.updateSetting, name, $scope.data.settings[name]);
      setter.then(
        function (result) {},
        function (reason) {
          alert(reason);
        }
      );
    };

    $scope.init();
  });

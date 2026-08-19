angular
  .module('dcApp.controllers', [])
  .controller('mergeCheckController', function ($scope, $rootScope, remoting, $location) {
    var dataContainer = angular.element('div#dataStore');
    $scope.endpoint = {};
    $scope.endpoint.getRelatedCount = dataContainer.data('sf-related-count');
    $scope.endpoint.idList = dataContainer.data('sf-id-list').split(',');
    $scope.endpoint.relatedList = dataContainer.data('sf-related-list').split(',');

    $scope.data = {};
    $scope.data.count = {};

    $scope.related = {};

    $scope.fetchRelatedCount = function () {
      angular.forEach($scope.endpoint.relatedList, function (v) {
        var rel = v.split('#');
        var getter = remoting.tripleServiceBuffer(
          $scope.endpoint.getRelatedCount,
          rel[0],
          rel[1],
          $scope.endpoint.idList
        );
        getter.then(
          function (result) {
            $scope.data.count[v] = result;
          },
          function (reason) {}
        );
      });
    };

    $scope.doReturn = function () {
      if (angular.isDefined($scope.data.returnUrl)) {
        dcNavigate($scope.data.returnUrl);
      }
    };

    $scope.init = function () {
      $scope.data.showReturn = true;

      if ($location.absUrl().indexOf('group=') != -1) {
        //user is forwarded from merge page
        var urlCollection = $location.absUrl().split('&'); //
        urlCollection.splice(0, 1);
        urlCollection = '/apex/dc3Merge?' + urlCollection.join('&');
        $scope.data.returnUrl = urlCollection;
      } else {
        $scope.data.showReturn = false;
      }

      $scope.fetchRelatedCount();
    };
    $scope.init();
  });

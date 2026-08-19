angular.module('dcApp', ['dcApp.services', 'dcApp.controllers', 'dcApp.directives', 'ngSanitize', 'plauti-ng-slds']);

angular
  .module('dcApp.controllers', [])
  .controller('rootController', function ($scope, $rootScope, remoting) {
    var dataContainer = angular.element('div#dataStore');
    $rootScope.endpoint = {};
    $rootScope.endpoint.addWords = dataContainer.data('sf-add-words');
    $rootScope.endpoint.fetchWords = dataContainer.data('sf-fetch-words');
    $rootScope.endpoint.deleteWord = dataContainer.data('sf-delete-word');
    $rootScope.helpPage =
      dc3Translate('URL_SUPPORT_USAGE_FREQUENT_WORDS', 'https://support.duplicatecheck.com') +
      '?utm_source=dcApp&utm_medium=app&utm_campaign=help_link';

    $scope.openUrl = function (url) {
      dcNavigateNew(url, '');
    };
  })
  .controller('pageController', function ($scope, $rootScope, remoting, $filter, $timeout) {
    $scope.init = function () {
      $scope.frequentType = $scope.activeTab;
      $scope.isLoading = false;
      $scope.data = {};
      $scope.input = {};
      $scope.input.wordString = '';
      $scope.fetchWords();
      $scope.modalStatus = false;
    };

    $scope.$watch(
      'activeTab',
      function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.frequentType = $scope.activeTab;
          $scope.fetchWords();
        }
      },
      true
    );

    $scope.deleteWord = function (recordId) {
      var record;
      var index;
      angular.forEach($scope.data, function (v, k) {
        if (angular.isDefined(v.recordId) && v.recordId == recordId) {
          record = v;
          index = k;
        }
      });

      if (angular.isDefined(record)) {
        var getter = remoting.singleService($rootScope.endpoint.deleteWord, record.recordId);
        getter.then(
          function (result) {
            if (result.value) {
              $scope.data.splice(index, 1);
            }
          },
          function (reason) {
            alert(reason);
          }
        );
      }
    };

    $scope.toggleModal = function () {
      $scope.modalStatus = !$scope.modalStatus;
    };

    $scope.$watch(
      'input.wordString',
      function (val) {
        $scope.input.wordString = $filter('uppercase')(val);
      },
      true
    );

    // Find character groups that end with a comma that aren't escaped with a backslash
    const FREQUENTWORD_REGEX = /((?:[^,\\]|\\.)+)/g;
    $scope.addWord = function () {
      const wordArray = $scope.input.wordString.match(FREQUENTWORD_REGEX)
        ?.map((synonym) => synonym.trim())
        .filter((synonym) => '' !== synonym);
      $scope.isLoading = true;
      var getter = remoting.doubleService($rootScope.endpoint.addWords, $scope.frequentType, wordArray);
      getter.then(
        function (result) {
          $scope.input.wordString = '';
          $scope.isLoading = false;
        },
        function (reason) {
          alert(reason);
          $scope.isLoading = false;
        }
      );

      $scope.toggleModal();
      $scope.fetchWords($scope.frequentType);
    };

    $scope.fetchWords = function () {
      $scope.isLoading = true;
      var getter = remoting.singleService($rootScope.endpoint.fetchWords, $scope.frequentType);
      getter.then(
        function (result) {
          if (result.value) {
            $scope.data = result.value;
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
  });

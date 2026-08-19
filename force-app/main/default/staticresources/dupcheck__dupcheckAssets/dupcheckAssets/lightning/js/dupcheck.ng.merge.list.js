angular
  .module('dcApp.controllers', [])
  .controller('mergeListController', function ($scope, $rootScope, remoting, $window) {
    $scope.loadingData = false;

    $scope.selectedRecords = angular.element('div#dataContainer').data('selected-records');
    $scope.allRecords = angular.element('div#dataContainer').data('all-records');

    $scope.endpoint = {};
    $scope.endpoint.merge = angular.element('div#dataContainer').data('page-merge');
    $scope.endpoint.mergeData = angular.element('div#dataContainer').data('sf-merge-data');

    $scope.selected = {};
    $scope.data = {};
    $scope.data.objectData = [];
    $scope.data.resultField = [];

    $scope.selectAll = false;

    $scope.closeMergeModal = function () {
      var payload = JSON.stringify({ name: 'CLOSE_MODAL' });
      window.dispatchEvent(new CustomEvent('dupcheck__dc3Merge', { detail: payload }));
    };

    $scope.refreshNav = function (recordId) {
      sforce.console.getNavigationTabs(function (navItems) {
        if (navItems.success) {
          var tempItem = JSON.parse(navItems.items);
          for (var i = 0, len = tempItem.length; i < len; i++) {
            if (recordId.startsWith(tempItem[i].keyprefix) || recordId == tempItem[i].keyprefix) {
              sforce.console.setSelectedNavigationTab(function (a) {
                if (!a.success) {
                  dcNavigateRecord(recordId);
                }
              }, tempItem[i].navigationTabId);
            }
          }
        } else {
          dcNavigateRecord(recordId);
        }
      });
    };

    $window.addEventListener('message', function (event) {
      if (!event || !/^{.+}$/.test(event.data)) {
        return;
      }

      var eventData = JSON.parse(event.data);
      if (eventData.name === 'dupcheck__dc3Merge' && eventData.payload.status.startsWith('MERGE_OK')) {
        if (isConsole()) {
          $scope.refreshNav(eventData.payload.recordId);
        } else {
          dcNavigateRecord(eventData.payload.recordId);
        }
      }
    });

    $scope.goBack = function () {
      if (isConsole()) {
        $scope.refreshNav($scope.allRecords[0]);
      } else {
        dcNavigate('/' + $scope.allRecords[0].substring(0, 3));
      }
    };

    $scope.gotoMerge = function () {
      var idList = [];
      angular.forEach($scope.selected, function (v, k) {
        if (v) {
          idList.push(k);
        }
      });
      var payload = JSON.stringify({ name: 'OPEN_MODAL', idList: idList, type: 'idList', meta: 'REDIRECT' });
      window.dispatchEvent(new CustomEvent('dupcheck__dc3Merge', { detail: payload }));
      return;
    };

    $scope.mergeDisabled = function () {
      var selectedCount = 0;
      angular.forEach($scope.selected, function (v, k) {
        if (v) {
          selectedCount++;
        }
      });
      return selectedCount > 1;
    };

    $scope.doSelectAll = function (button) {
      var newValue = false;
      if ($scope.selectAll) {
        var newValue = button ? false : true;
      } else {
        var newValue = button ? true : false;
      }

      angular.forEach($scope.selected, function (v, k) {
        $scope.selected[k] = newValue;
      });
    };

    $scope.$watchCollection('selected', function (newData, oldData) {
      var recordCount = $scope.data.objectData.length;
      var selectedCount = 0;
      angular.forEach(newData, function (v, k) {
        if (v) {
          selectedCount++;
        }
      });

      if (recordCount == selectedCount) {
        $scope.selectAll = true;
      } else {
        $scope.selectAll = false;
      }
    });

    $scope.selectRecord = function (recordId) {
      var existingValue = $scope.selected[recordId];
      if (existingValue) {
        $scope.selected[recordId] = false;
      } else {
        $scope.selected[recordId] = true;
      }
    };

    $scope.getMergeData = function () {
      if (!empty($scope.selectedRecords) || $scope.selectedRecords.length > 1) {
        var payload = JSON.stringify({
          name: 'OPEN_MODAL',
          idList: $scope.selectedRecords,
          type: 'idList',
          meta: 'REDIRECT',
          context: 'ListView'
        });
        window.dispatchEvent(new CustomEvent('dupcheck__dc3Merge', { detail: payload }));
      }

      $scope.loadingData = true;
      var getter = remoting.singleService($scope.endpoint.mergeData, $scope.allRecords);
      getter.then(
        function (searchResult) {
          $scope.data.objectData = searchResult.objectData;
          $scope.data.resultField = searchResult.resultField;

          angular.forEach($scope.data.objectData, function (v, k) {
            $scope.selected[v.Id] = false;
          });
          $scope.doSelectAll();
          $scope.loadingData = false;
        },
        function (reason) {
          alert(reason);
          $scope.loadingData = false;
        }
      );
    };
  });

angular.module('dcApp', [
  'dcApp.services',
  'dcApp.controllers',
  'dcApp.directives',
  'ngSanitize',
  'plauti-ng-slds',
  'ngCsv',
  'LocalStorageModule'
]);

angular.module('dcApp').filter('scenarioScore', function () {
  return function (input) {
    let inp = window.atob(input);
    let j = JSON.parse(inp);

    let r = '<table class="dc-table--not-bordered" border="0" style="width: 100%">';
    var i;
    for (i = 0; i < j.length; i++) {
      r +=
        '<tr><td class="slds-text-color_inverse" style="word-wrap: break-word; white-space: normal;">' +
        j[i].scenarioName +
        '</td><td class="slds-text-color_inverse">' +
        j[i].scenarioScore +
        '%</td></tr>';
    }
    r += '</table>';
    return r;
  };
});

angular
  .module('dcApp.controllers', ['rzModule', 'LocalStorageModule'])
  .controller(
    'jobController',
    function ($scope, $parse, $rootScope, $interval, remoting, $location, $window, localStorageService) {
      $scope.deleteJob = function () {
        remoting.singleService($rootScope.ds.endpointDeleteJob, $rootScope.ds.jobId).then(
          function (remoteResult) {
            dcNavigate($scope.data.pageJob, '');
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.abortJob = function () {
        remoting.singleService($rootScope.ds.endpointAbortJob, $rootScope.ds.jobId).then(
          function (remoteResult) {
            init();
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.openAllGroups = function () {
        angular.forEach($scope.data.groupList, function (v, k) {
          $scope.data.groupList[k].isOpen = true;
          if ($scope.data.groupList[k].isOpen && !$scope.data.groupList[k].isFetched) {
            fetchGroup(k);
          }
        });
      };

      $scope.closeAllGroups = function () {
        angular.forEach($scope.data.groupList, function (v, k) {
          $scope.data.groupList[k].isOpen = false;
        });
      };

      $scope.refreshPage = function () {
        //
        $location.path('/page=0');
        $scope.dataFilter.pageNumber = 0;
        fetchData(true);
      };

      $scope.openGroup = function (index) {
        if (!$scope.data.groupList[index].isOpen) {
          $scope.data.groupList[index].isOpen = true;
        } else {
          $scope.data.groupList[index].isOpen = !$scope.data.groupList[index].isOpen;
        }

        if ($scope.data.groupList[index].isOpen && !$scope.data.groupList[index].isFetched) {
          fetchGroup(index);
        }
      };

      var fetchGroup = function (index) {
        $scope.data.groupList[index].isLoading = true;
        remoting
          .doubleServiceBuffer(
            $rootScope.ds.endpointFetchGroupData,
            $scope.data.groupList[index].Id,
            $rootScope.ds.jobId
          )
          .then(
            function (remoteResult) {
              $scope.data.groupData[$scope.data.groupList[index].Id] = remoteResult;
              $scope.data.groupList[index].isFetched = true;
              $scope.data.groupList[index].isLoading = false;
            },
            function (reason) {
              alert(reason);
            }
          );
      };

      $scope.fetchMore = function () {
        if ($scope.data.groupList.length == 0) {
          $scope.dataFilter.pageNumber = 0;
        } else {
          $scope.dataFilter.pageNumber = $scope.data.groupList.length;
        }

        //$scope.data.groupList.length == 0 ? $scope.dataFilter.pageNumber = 0 : ;
        fetchData(false);
      };

      var fetchData = function (resetData) {
        if (resetData) {
          $scope.data.groupList = [];
        }
        $scope.meta.loadingData = true;
        remoting.doubleService($rootScope.ds.endpointFetchData, $rootScope.ds.jobId, $scope.dataFilter).then(
          function (remoteResult) {
            processGroupData(remoteResult, resetData);
          },
          function (reason) {
            $scope.meta.loadingData = false;
            alert(reason);
          }
        );
      };

      var processGroupData = function (groupData, resetData) {
        if (resetData) {
          $scope.data.groupList = groupData.groupList;
        } else {
          angular.forEach(groupData.groupList, function (value, key) {
            $scope.data.groupList.push(value);
          });
        }

        $scope.data.isMore = groupData.isMore;
        $scope.meta.loadingData = false;

        if ($rootScope.ds.groupAutoOpen) {
          $scope.openAllGroups();
        }
      };

      $scope.applyFilter = function () {
        $scope.dataFilter.pageNumber = 0;
        $scope.meta.ModalFilter = false;

        localStorageService.set('dcBatchDetail_' + $rootScope.ds.jobId, $scope.dataFilter);
        $scope.meta.filtering = !angular.equals($scope.dataFilter, $scope.meta.originalFilter);

        fetchData(true);
      };

      $scope.clearFilter = function () {
        resetFilter();
        localStorageService.remove('dcBatchDetail_' + $rootScope.ds.jobId);
        $scope.meta.filtering = !angular.equals($scope.dataFilter, $scope.meta.originalFilter);
      };

      var jobPoller;
      var fetchJob = function () {
        if ($scope.masterCheck) {
          Object.keys($scope.masterCheck).forEach(key => {
            $scope.masterCheck[key] = false;
          });
        }

        remoting.singleService($rootScope.ds.endpointgetJobData, $rootScope.ds.jobId).then(
          function (remoteResult) {
            $scope.data.job = remoteResult;

            for (var i = $scope.data.job.lowScore; i <= 100; i++) {
              $scope.data.autoScoreList.push(i);
            }
            $rootScope.ds.autoScore = $scope.data.job.lowScore;

            if (
              remoteResult.status == 'Aborted' ||
              remoteResult.status == 'Failed' ||
              remoteResult.status == 'Completed'
            ) {
              stopJobPoller();
            }
          },
          function (reason) {
            stopJobPoller();
            alert(reason);
          }
        );
      };
      var startJobPoller = function () {
        if (angular.isDefined(jobPoller)) {
          return;
        }
        fetchJob();
        jobPoller = $interval(fetchJob, 5000);
      };
      var stopJobPoller = function () {
        if (angular.isDefined(jobPoller)) {
          $interval.cancel(jobPoller);
          jobPoller = undefined;
        }
      };

      var resetFilter = function () {
        var f = {};
        f.pageSize = 20;
        f.pageNumber = 0;
        f.startGroup = null;
        f.endGroup = null;
        f.averageScore = null;
        f.duplicateCount = null;
        f.orderBy = 'group__c';
        f.orderSort = 'ASC';
        f.hasError = 'false';
        f.ownerId = null;
        f.recordTypeId = null;
        f.filterValue = null;
        $scope.meta.userName = null;
        $scope.dataFilter = f;
        $scope.meta.originalFilter = angular.copy($scope.dataFilter);
        $scope.meta.maxPageNumber = 2000;
      };

      $scope.selectItem = function (grpId, itemId) {
        var trueCount = 0;
        var totalCount = 0;
        angular.forEach($scope.selectList[grpId], function (v, k) {
          if (v) {
            trueCount = trueCount + 1;
          }
          totalCount = totalCount + 1;
        });
        $scope.selectCount[grpId] = trueCount;

        if (trueCount == totalCount) {
          $scope.masterCheck[grpId] = true;
        } else {
          $scope.masterCheck[grpId] = false;
        }
      };

      $scope.selectMaster = function (grpId) {
        angular.forEach($scope.selectList[grpId], function (v, k) {
          $scope.selectList[grpId][k] = $scope.masterCheck[grpId];
        });
        $scope.selectItem(grpId, '');
      };

      $scope.getReturnUrl = function () {
        var urlBuild = $rootScope.ds.endpointSelfUrl;
        if (urlBuild.indexOf('?') == -1) {
          urlBuild += '?id=' + $rootScope.ds.jobId;
        } else {
          urlBuild += '&id=' + $rootScope.ds.jobId;
        }

        if ($rootScope.ds.openFilter) {
          urlBuild += '&filter=' + $rootScope.ds.openFilter;
        }

        urlBuild += '#page=' + $scope.dataFilter.pageNumber;
        return '&retUrl=' + window.encodeURIComponent(urlBuild);
      };

      $scope.quickConvert = function (groupId) {
        $scope.meta.inprocess[groupId] = true;
        var getter = remoting.singleService($rootScope.ds.endpointQuickConvert, groupId);
        getter.then(
          function (result) {
            $scope.spliceGroup(groupId);
            $scope.meta.inprocess[groupId] = false;
          },
          function (reason) {
            alert(reason);
            $scope.meta.inprocess[groupId] = false;
          }
        );
      };

      $scope.quickConvertPair = function (pairId, groupId) {
        $scope.meta.inprocess[pairId] = true;
        var getter = remoting.singleService($rootScope.ds.endpointQuickConvert, pairId);
        getter.then(
          function (result) {
            $scope.refreshGroup(groupId);
            $scope.meta.inprocess[pairId] = false;
          },
          function (reason) {
            alert(reason);
            $scope.meta.inprocess[pairId] = false;
          }
        );
      };

      $scope.convert = function (sourceId, matchId, groupId) {
        var sourcePrefix = getPrefixById(sourceId);
        var matchPrefix = getPrefixById(matchId);

        var leadId;
        var contactId;
        var accountId;

        switch (sourcePrefix) {
          case '00Q':
            leadId = sourceId;
            break;
          case '001':
            accountId = sourceId;
            break;
          case '003':
            contactId = sourceId;
            break;
        }

        switch (matchPrefix) {
          case '00Q':
            leadId = matchId;
            break;
          case '001':
            accountId = matchId;
            break;
          case '003':
            contactId = matchId;
            break;
        }

        let payload = JSON.stringify({
          name: 'OPEN_MODAL',
          contactId: contactId,
          accountId: accountId,
          groupId: groupId,
          leadId: leadId
        });

        let event = { detail: payload };
        console.log(event);
        window.dispatchEvent(new CustomEvent('dupcheck__dc3Convert', event));
      };

      $scope.mergeGroup = function (groupId) {
        var payload = JSON.stringify({ name: 'OPEN_MODAL', groupId: groupId, type: 'group' });
        window.dispatchEvent(new CustomEvent('dupcheck__dc3Merge', { detail: payload }));
      };

      $scope.closeMergeModal = function () {
        var payload = JSON.stringify({ name: 'CLOSE_MODAL' });
        window.dispatchEvent(new CustomEvent('dupcheck__dc3Merge', { detail: payload }));
      };

      $scope.newMergeModal = function (url, uri) {
        var payload = JSON.stringify({ name: 'RELOAD_MODAL', url: url, uri: uri });
        window.dispatchEvent(new CustomEvent('dupcheck__dc3Merge', { detail: payload }));
      };

      const messageEventListener = function (event) {
        console.log(event);

        if (!event || !/^{.+}$/.test(event.data)) {
          return;
        }

        var eventData = JSON.parse(event.data);
        if (eventData.name === 'dupcheck__dc3Merge' && eventData.payload.status.startsWith('MERGE_OK')) {
          var groupIndex;

          if (eventData.payload.returnData) {
            if (eventData.payload.returnData.type == 'group') {
              groupIndex = $scope.getGroupIndex(eventData.payload.returnData.id);
              $scope.spliceGroup(eventData.payload.returnData.id);
            } else if (eventData.payload.returnData.type == 'pair') {
              $scope.refreshGroup(eventData.payload.returnData.id);
            } else if (eventData.payload.returnData.type == 'selection') {
              if (eventData.payload.returnData.groupId) $scope.refreshGroup(eventData.payload.returnData.groupId);
            }
          }

          fetchJob();
          $scope.$apply();

          if (eventData.payload.status == 'MERGE_OK_NEXT' && groupIndex >= 0 && $scope.data.groupList.length > 0) {
            if (groupIndex + 1 > $scope.data.groupList.length) {
              groupIndex = 0;
            }
            const nextGroupId = $scope.data.groupList[groupIndex].Id;
            $scope.mergeGroup(nextGroupId);
          } else {
            $scope.closeMergeModal();
          }
        } else if (eventData.name === 'dupcheck__dc3Convert_converted') {
          if (eventData.payload.groupId) {
            console.log('Refreshing group');
            $scope.refreshGroup(eventData.payload.groupId);
          }
          fetchJob();
          $scope.$apply();
        }
      };

      $window.addEventListener('message', messageEventListener); // the old angular way of listening for events.
      window.addEventListener('message', messageEventListener); // the 'new' way to listen for events from the LWC merge page.

      $scope.quickMerge = function (groupId) {
        $scope.meta.inprocess[groupId] = true;

        var getter = remoting.singleService($rootScope.ds.endpointQuickMerge, groupId);
        getter.then(
          function (result) {
            $scope.meta.inprocess[groupId] = false;
            if (!result.isError) {
              $scope.spliceGroup(groupId);
            } else {
              alert('Merge failed.');
            }
            fetchJob();
          },
          function (reason) {
            $scope.meta.inprocess[groupId] = false;
            alert(reason);
          }
        );
      };

      $scope.mergePair = function (pairId, groupId) {
        var payload = JSON.stringify({ name: 'OPEN_MODAL', groupId: groupId, pairId: pairId, type: 'pair' });
        window.dispatchEvent(new CustomEvent('dupcheck__dc3Merge', { detail: payload }));
      };

      $scope.quickMergePair = function (pairId, groupId) {
        $scope.meta.inprocess[pairId] = true;

        var getter = remoting.singleService($rootScope.ds.endpointQuickMerge, pairId);
        getter.then(
          function (result) {
            $scope.meta.inprocess[pairId] = false;
            $scope.refreshGroup(groupId);
            fetchJob();
            if (result.isError) {
              alert('Merge failed.');
            }
          },
          function (reason) {
            $scope.meta.inprocess[pairId] = false;
            alert(reason);
          }
        );
      };

      $scope.mergeSelection = function (groupId, index) {
        var idList = [];
        angular.forEach($scope.selectList[index], function (v, k) {
          if (v) {
            idList.push(k);
          }
        });
        console.log(groupId);

        var payload = JSON.stringify({
          name: 'OPEN_MODAL',
          groupId: groupId,
          idList: idList,
          type: 'idList',
          meta: 'NOREDIRECT'
        });
        window.dispatchEvent(new CustomEvent('dupcheck__dc3Merge', { detail: payload }));
      };

      $scope.discardSelection = function (groupId, index) {
        var idList = [];
        angular.forEach($scope.selectList[index], function (v, k) {
          if (v) {
            idList.push(k);
          }
        });
        var getter = remoting.doubleService($rootScope.ds.endpointNotDuplicate, $rootScope.ds.jobId, idList);
        getter.then(
          function (result) {
            $scope.refreshGroup(groupId);
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.getGroupIndex = function (groupId) {
        var i = 0;
        for (; i <= $scope.data.groupList.length; i++) {
          if ($scope.data.groupList[i].Id == groupId) {
            console.log(i);
            break;
          }
        }
        return i;
      };

      $scope.spliceGroup = function (groupId) {
        angular.forEach($scope.data.groupList, function (v, k) {
          if (v.Id == groupId) {
            $scope.data.groupList.splice(k, 1);
          }
        });
      };

      $scope.updateGroup = function (grp) {
        angular.forEach($scope.data.groupList, function (v, k) {
          if (v.Id == grp.Id) {
            v.dupcheck__ErrorCount__c = grp.dupcheck__ErrorCount__c;
            v.dupcheck__avgScore__c = grp.dupcheck__avgScore__c;
            v.dupcheck__duplicateCount__c = grp.dupcheck__duplicateCount__c;
            v.dupcheck__group__c = grp.dupcheck__group__c;
            v.dupcheck__highScore__c = grp.dupcheck__highScore__c;
            v.dupcheck__lowScore__c = grp.dupcheck__lowScore__c;
            v.dupcheck__recordCount__c = grp.dupcheck__recordCount__c;
            return;
          }
        });
      };

      $scope.refreshGroup = function (groupId) {
        var getter = remoting.doubleService($rootScope.ds.endpointFetchGroupData, groupId, $rootScope.ds.jobId);

        getter.then(
          function (result) {
            if (empty(result) || empty(result.pairList) || result.pairList.length == 0) {
              //Werkt deze if?
              $scope.spliceGroup(groupId);
            } else {
              $scope.data.groupData[groupId] = result;
              $scope.updateGroup(result.group);
            }

            let remainingIds = Object.keys(
              $scope.data.groupData[groupId].objectList[$scope.data.groupData[groupId].matchPrefix]
            );

            let groupIdx = $scope.getGroupIndex(groupId);
            angular.forEach($scope.selectList[groupIdx], function (v, k) {
              if (!remainingIds.includes(k)) {
                delete $scope.selectList[groupIdx][k];
              } else {
                $scope.selectList[groupIdx][k] = false;
              }
            });
            $scope.selectCount[groupIdx] = 0;
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.notduplicate = function (groupId) {
        var idListArray = [];
        if (groupId instanceof Array) {
          idListArray = groupId;
        } else {
          idListArray.push(groupId);
        }

        var getter = remoting.doubleService($rootScope.ds.endpointNotDuplicate, $rootScope.ds.jobId, idListArray);
        getter.then(
          function (result) {
            $scope.spliceGroup(groupId);
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.notDuplicateRelation = function (groupId, relation) {
        var idListArray = [];
        if (groupId instanceof Array) {
          idListArray = groupId;
        } else {
          idListArray.push(groupId);
        }

        var getter = remoting.tripleService(
          $rootScope.ds.endpointNotDuplicateRelation,
          $rootScope.ds.jobId,
          idListArray,
          relation
        );
        getter.then(
          function (result) {
            $scope.spliceGroup(groupId);
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.notDuplicatePair = function (pairId, groupId) {
        var idListArray = [];
        if (pairId instanceof Array) {
          idListArray = pairId;
        } else {
          idListArray.push(pairId);
        }
        var getter = remoting.doubleService($rootScope.ds.endpointNotDuplicate, $rootScope.ds.jobId, idListArray);
        getter.then(
          function (result) {
            $scope.refreshGroup(groupId);
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.notDuplicatePairRelation = function (pairId, groupId, relation) {
        var idListArray = [];
        if (pairId instanceof Array) {
          idListArray = pairId;
        } else {
          idListArray.push(pairId);
        }
        var getter = remoting.tripleService(
          $rootScope.ds.endpointNotDuplicateRelation,
          $rootScope.ds.jobId,
          idListArray,
          relation
        );
        getter.then(
          function (result) {
            $scope.refreshGroup(groupId);
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.openRecord = function (recordId) {
        dcNavigateRecordNew(recordId);
      };

      $scope.openShareModal = function () {
        var getter = remoting.tripleServiceEscape(
          $rootScope.ds.endpointShareUrl,
          $rootScope.ds.jobId,
          $scope.dataFilter,
          $rootScope.ds.theme
        );
        getter.then(
          function (result) {
            window.openShareModal(
              result.value,
              dc3TemplateReplace(dc3Translate('SHARE_SUBJECT_JOB', 'Deduplicate Job - {{jobName}}'), {
                jobName: $rootScope.ds.jobName
              }),
              dc3TemplateReplace(
                dc3Translate(
                  'SHARE_BODY_JOB',
                  'Hi There, \n\nPlease have a look at the Deduplicate Job {{jobName}} via the following link.\n\nThanks,\n{{userName}}'
                ),
                { jobName: $rootScope.ds.jobName, userName: $rootScope.ds.userName }
              )
            );
          },
          function (reason) {
            //
          }
        );
      };

      $scope.ModaldeleteRecord = function (recordId, index) {
        $scope.meta.modalDeleteRecord = true;
        $scope.meta.deleteRecordId = recordId;
        $scope.meta.deleteIndex = index;
      };

      $scope.deleteRecord = function () {
        var setter = remoting.singleService($rootScope.ds.endpointDeleteRecord, $scope.meta.deleteRecordId);
        setter.then(
          function (result) {
            $scope.meta.modalDeleteRecord = false;
            $scope.data.groupList[$scope.meta.deleteIndex].isFetched = false;
            $scope.data.groupList[$scope.meta.deleteIndex].isOpen = false;
            fetchGroup($scope.meta.deleteIndex);
            $scope.data.groupList[$scope.meta.deleteIndex].isOpen = true;
            fetchJob();
          },
          function (reason) {
            $scope.meta.modalDeleteRecord = false;
            //$scope.data.groupList[$scope.meta.deleteIndex].isOpen = false;
            alert(reason);
          }
        );
      };

      $scope.openUrl = function (url, uri) {
        dcNavigate(url, uri);
      };

      $scope.openUrlNew = function (url, uri) {
        !uri ? (uri = 'utm_source=dcApp&utm_medium=app&utm_campaign=help_inline') : '';
        dcNavigateNew(url, uri);
      };

      $scope.openUrlIH = function (url) {
        //Open Url Inline Help
        dcNavigateNew(url, 'utm_source=dcApp&utm_medium=app&utm_campaign=help_inline');
      };

      $scope.startConvert = function () {
        $scope.meta.converting = true;
        var ownerId = $rootScope.ds.convertOwner;
        if ($rootScope.ds.convertOwner == 'OTHER') {
          ownerId = $rootScope.ds.convertOwnerAlt;
        }

        var getter = remoting.quadService(
          $rootScope.ds.endpointautoConvert,
          $rootScope.ds.jobId,
          $rootScope.ds.autoScore,
          ownerId,
          $rootScope.ds.convertStatus
        );
        getter.then(
          function (result) {
            //dcNavigate($rootScope.ds.endpointBatchOverview, '');
            dcNavigate($rootScope.ds.endpointBatchOverview, '#OpenId=' + $rootScope.ds.jobId);
            //$scope.meta.converting = false;
          },
          function (reason) {
            alert(reason);
            $scope.meta.converting = false;
          }
        );
      };

      $scope.startMerge = function () {
        $scope.meta.merging = true;
        var getter = remoting.doubleService(
          $rootScope.ds.endpointautoMerge,
          $rootScope.ds.jobId,
          $rootScope.ds.autoScore
        );
        getter.then(
          function (result) {
            //dcNavigate($rootScope.ds.endpointBatchOverview, '');
            dcNavigate($rootScope.ds.endpointBatchOverview, '#OpenId=' + $rootScope.ds.jobId);
            //$scope.meta.merging = false;
          },
          function (reason) {
            alert(reason);
            $scope.meta.merging = false;
          }
        );
      };

      $scope.getLookup = function (relatedObject, searchText, optionalFields) {
        angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

        var getter = remoting.tripleService($rootScope.ds.relatedTypeAhead, relatedObject, searchText, optionalFields);
        getter.then(
          function (result) {
            $rootScope.ds.referenceOptions = result;
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.getLookupInputField = function (resultVar, relatedObject, searchText, optionalFields) {
        angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

        var getter = remoting.tripleService($rootScope.ds.relatedTypeAhead, relatedObject, searchText, optionalFields);
        getter.then(
          function (result) {
            var model = $parse(resultVar);
            model.assign($scope, result);
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.openExportModal = function (index) {
        $scope.meta.jobId = $rootScope.ds.jobId;
        $scope.meta.exportJobModal = true;
      };

      $scope.closeExportModal = function () {
        $scope.meta.exportJobModal = false;
        $scope.meta.jobId = undefined;
      };

      $scope.$watch(
        '$location.absUrl()',
        function (oldVal, newVal) {
          try {
            $scope.dataFilter.pageNumber = parseInt(
              $location
                .absUrl()
                .match(/page\=\d+/)[0]
                .substring(5)
            );
          } catch (exception) {
            //console.log('niks te laden');
          }
        },
        true
      );

      $scope.calcTableWidth = function () {
        $scope.meta.tableWidth = $window.innerWidth - 20;
        if (!isSalesforce1()) {
          $scope.meta.tableWidth = $window.innerWidth - 20;
        }
      };

      angular.element($window).bind('resize', function () {
        $scope.calcTableWidth();
        $scope.$apply();
      });

      var init = function () {
        var dataStore = angular.element('div#dataStore');
        if (!dataStore.data('job-status')) return;
        var ds = {};
        ds.jobId = dataStore.data('job-id');
        ds.jobName = dataStore.data('job-name');
        ds.userName = dataStore.data('user-name');
        ds.endpointFetchData = dataStore.data('sf-fetch-data');
        ds.endpointFetchGroupData = dataStore.data('sf-fetch-group-data');
        ds.endpointgetJobData = dataStore.data('sf-get-job');
        ds.endpointAbortJob = dataStore.data('sf-abort-job');
        ds.endpointDeleteJob = dataStore.data('sf-delete-job');
        ds.endpointQuickConvert = dataStore.data('sf-quick-convert');
        ds.endpointNotDuplicate = dataStore.data('sf-not-duplicate');
        ds.endpointNotDuplicateRelation = dataStore.data('sf-not-duplicate-relation');
        ds.endpointSelfUrl = dataStore.data('self-url');
        ds.endpointConvertUrl = dataStore.data('convert-url');
        ds.endpointMergeUrl = dataStore.data('merge-url');
        ds.endpointQuickMerge = dataStore.data('sf-quick-merge');
        ds.defaultConvertOwner = dataStore.data('sf-convert-owner');
        ds.defaultConvertStatus = dataStore.data('sf-convert-status');
        ds.relatedTypeAhead = dataStore.data('sf-related-object');
        ds.endpointautoMerge = dataStore.data('sf-auto-merge');
        ds.endpointautoConvert = dataStore.data('sf-auto-convert');
        ds.endpointBatchOverview = dataStore.data('batch-overview');
        ds.endpointDeleteRecord = dataStore.data('sf-delete-record');
        ds.matchObjectName = dataStore.data('match-object-name');
        ds.sourceObjectName = dataStore.data('source-object-name');
        ds.endpointShareUrl = dataStore.data('sf-share-url');
        ds.sessionId = dataStore.data('sf-session-id');
        ds.openFilter = dataStore.data('open-filter');
        ds.theme = dataStore.data('sf-theme');
        ds.groupAutoOpen = dataStore.data('sf-group-auto-open');

        $rootScope.ds = ds;

        $scope.data = {};
        $scope.data.groupList = [];
        $scope.data.groupData = {};
        $scope.data.autoScoreList = [];
        $scope.data.pageJob = dataStore.data('page-job');

        $scope.meta = {};
        $scope.meta.pageName = 'dcBatchDetail_';
        $scope.meta.slider = { options: { floor: 1, ceil: 100, step: 1 } };
        $scope.meta.helpUrl = dc3Translate('URL_SUPPORT_USAGE_DC_JOB', 'https://support.duplicatecheck.com');
        $scope.meta.deleteRecordId;
        $scope.meta.modalDeleteRecord = false;
        $scope.meta.deleteRecordObject;
        $scope.meta.ownerId = 'Owner ID';
        $scope.meta.userLookupObject = { User: { Label: 'User', Name: 'User', SldsIcon: 'user' } };
        $scope.meta.converting = false;
        $scope.meta.merging = false;
        $scope.meta.filtering = false;
        $scope.meta.mergeReady = false;
        $scope.meta.convertReady = true;

        $scope.selectList = {};
        $scope.masterCheck = {};
        $scope.selectCount = {};
        $scope.meta.inprocess = {};

        $scope.lookup = {};

        resetFilter();

        $scope.calcTableWidth();

        //remember last id's' - only append

        //Adds filter to job detail if user hasnt logged out in the same session as a filter has been applied to job

        //'dcBatchDetail_' + $rootScope.ds.jobId

        if (ds.openFilter) {
          $scope.dataFilter = JSON.parse(atob(ds.openFilter));
          $scope.meta.filtering = !angular.equals($scope.dataFilter, $scope.meta.originalFilter);
          console.log($scope.dataFilter);
        } else if (localStorageService.keys().indexOf('dcBatchDetail_' + $rootScope.ds.jobId) > -1) {
          $scope.dataFilter = localStorageService.get('dcBatchDetail_' + $rootScope.ds.jobId);
          $scope.meta.filtering = !angular.equals($scope.dataFilter, $scope.meta.originalFilter);
        }

        fetchData(true);
        stopJobPoller();
        startJobPoller();
      };

      init();
    }
  );

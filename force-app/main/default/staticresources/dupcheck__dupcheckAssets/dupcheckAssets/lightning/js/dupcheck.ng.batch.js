/* eslint-disable no-undef */
angular
  .module('dcApp', [
    'dcApp.controllers',
    'ngSanitize',
    'plauti-ng-slds',
    'dcApp.services',
    'dcApp.directives',
    'LocalStorageModule',
    'ngCsv'
  ])

  .filter('orderObjectBy', function () {
    return function (items, qfield, reverse) {
      var field = '';

      if (dcEndsWith(qfield, 'groupCounter__c')) {
        field = 'groupCount';
      } else if (dcEndsWith(qfield, 'duplicateCounter__c')) {
        field = 'duplicateCount';
      } else if (dcEndsWith(qfield, 'avgScore__c')) {
        field = 'averageScore';
      } else if (dcEndsWith(qfield, 'Started__c')) {
        field = 'startDate';
      } else if (dcEndsWith(qfield, 'Ended__c')) {
        field = 'endDate';
      } else if (dcEndsWith(qfield, 'LastDuplicateAdded__c')) {
        field = 'lastDuplicateAdded';
      } else {
        field = 'startDate';
      }

      var filtered = [];

      angular.forEach(items, function (item) {
        filtered.push(item);
      });
      filtered.sort(function (a, b) {
        if (empty(a[field])) {
          return -1;
        }

        if (empty(b[field])) {
          return 1;
        }

        return a[field] > b[field] ? 1 : -1;
      });
      if (reverse == 'DESC') filtered.reverse();
      return filtered;
    };
  })

  .filter('orderByFieldType', function () {
    return function (items, sorting, fieldName, objectName) {
      sorting = sorting.toLowerCase();
      var filtered = [];
      if (sorting == 'string' || sorting == 'url' || sorting == 'email' || sorting == 'phone') {
        return items.filter(function (el) {
          return (
            el.value == '=' ||
            el.value == '!=' ||
            el.value == 'startWith' ||
            el.value == 'endWith' ||
            el.value == 'like'
          );
        });
      } else if (
        sorting == 'dateliteral' ||
        sorting == 'double' ||
        sorting == 'currency' ||
        sorting == 'integer' ||
        sorting == 'int' ||
        sorting == 'percent'
      ) {
        return items.filter(function (el) {
          return (
            el.value == '=' ||
            el.value == '!=' ||
            el.value == '<' ||
            el.value == '>' ||
            el.value == '<=' ||
            el.value == '>='
          );
        });
      } else if (sorting == 'date' || sorting == 'datetime') {
        return items.filter(function (el) {
          return (
            el.value == 'dateliteral' ||
            el.value == '=' ||
            el.value == '!=' ||
            el.value == '<' ||
            el.value == '>' ||
            el.value == '<=' ||
            el.value == '>='
          );
        });
      } else if (sorting == 'boolean' || sorting == 'reference' || sorting == 'picklist') {
        return items.filter(function (el) {
          return el.value == '=' || el.value == '!=';
        });
      } else if (sorting == 'multipicklist') {
        return items.filter(function (el) {
          return el.value == '=' || el.value == '!=' || el.value == 'includes';
        });
      } else if (sorting == 'id') {
        return items.filter(function (el) {
          if (fieldName == 'Id' && (objectName == '003' || objectName == '00Q')) {
            return el.value == '=' || el.value == '!=' || el.value == 'campaign';
          }
          if (fieldName == 'PersonContactId' && objectName == '001') {
            return el.value == '=' || el.value == '!=' || el.value == 'campaign';
          } else {
            return el.value == '=' || el.value == '!=';
          }
        });
      } else {
        return items;
      }
    };
  })

  .filter('capitalize', function () {
    return function (input) {
      return !!input ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    };
  })

  .filter('ordinal', function () {
    return function (input) {
      var s = ['th', 'st', 'nd', 'rd'],
        v = input % 100;
      return input + (s[(v - 20) % 10] || s[v] || s[0]);
    };
  })

  .filter('translateCron', [
    '$filter',
    function ($filter) {
      return function (input) {
        var dayOfTheWeek = [null, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var month = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ];
        var time = '';
        inputAr = input.split(' ');

        if (inputAr[6] != undefined) {
          if (inputAr[6] != '*' && inputAr[6] != '/') {
            time += 'In ' + inputAr[6];
          } else if (inputAr[6] == '/') {
            time += 'Starting in ' + inputAr[6].split('/')[0] + ' for every ' + inputAr[6].split('/')[1] + ' year ';
          }
        }

        if (inputAr[5] != undefined) {
          if (
            inputAr[5] != '*' &&
            inputAr[5] != '/' &&
            inputAr[5].indexOf('L') == -1 &&
            inputAr[5].indexOf('#') == -1 &&
            inputAr[5] != '?'
          ) {
            time += ' every ' + dayOfTheWeek[parseInt(inputAr[5])];
          } else if (inputAr[5] == '/') {
            time +=
              ' beginning on ' +
              inputAr[5].split('/')[0] +
              ' for every ' +
              inputAr[5].split('/')[1] +
              ' day of the week ';
          } else if (inputAr[5] == 'L') {
            time += ' every last day of the week ';
          } else if (inputAr[5].indexOf('#') != -1) {
            time += ' every ' + inputAr[5].split('#')[1] + dayOfTheWeek[parseInt(inputAr[5].split('#')[0])];
          } else if (inputAr[5] == '*') {
            time += ' daily ';
          } else if (inputAr[5].indexOf('L') != -1) {
            time += ' every last ' + dayOfTheWeek[parseInt(inputAr[5].split('L')[0])] + ' of every month ';
          }
        }

        if (inputAr[4] != undefined && inputAr[4] != '/' && inputAr[4] != '*') {
          time += inputAr[4] + ' month ';
        } else if (inputAr[4] == '/') {
          time +=
            ' beginning in ' +
            month(parseInt(inputAr[4].split('/')[0])) +
            ' and runs every ' +
            inputAr[4].split('/')[1] +
            ' month(s) ';
        }

        if (inputAr[3] != undefined && inputAr[3] != '?') {
          if (inputAr[3] == '/') {
            time +=
              ' beginning on ' +
              inputAr[3].split('/')[0] +
              ' for every ' +
              $filter('ordinal')(inputAr[3].split('/')[1]) +
              ' day of the month ';
          } else if (inputAr[3] == 'L') {
            time += ' last day of the month ';
          } else if (inputAr[3] == 'W') {
            time += ' closest weekday of the ' + $filter('ordinal')(inputAr[3]) + ' of the month';
          } else if (!isNaN(parseInt(inputAr[3]))) {
            time += ' every ' + $filter('ordinal')(inputAr[3]) + ' day of the month';
          } else if (inputAr[3] == '*') {
            time += ' daily ';
          }
        }

        if (inputAr[2] != undefined && parseInt(inputAr[2]) != 0) {
          if (inputAr[2] != '*' && inputAr[2] != '/' && !inputAr[2].includes('-')) {
            time += ' at ' + inputAr[2] + " o'clock ";
          } else if (inputAr[2] == '/') {
            time +=
              ' beginning on ' + inputAr[2].split('/')[0] + 'and runs every ' + inputAr[2].split('/')[1] + ' hours ';
          } else if (inputAr[2] == '*') {
            time += ' every hour ';
          } else if (inputAr[2].includes('-')) {
            time += ' at ' + inputAr[2] + ' hours ';
          }
        }

        if (inputAr[1] != undefined && parseInt(inputAr[1]) != 0) {
          time += inputAr[1] + ' minutes ';
        }

        if (inputAr[0] != undefined && parseInt(inputAr[0]) != 0) {
          time += inputAr[0] + ' seconds';
        }

        time += '  (' + input + ')';
        time = $filter('capitalize')(time.trim());
        return time;
      };
    }
  ]);

angular
  .module('dcApp.controllers', ['rzModule', 'LocalStorageModule'])
  .controller(
    'batchController',
    function ($scope, $rootScope, $interval, remoting, $location, $filter, localStorageService) {
      //FIXME root

      var init = function () {
        $scope.meta = {};
        $scope.meta.uniqueUpload = true;
        $scope.meta.modalFilter = false;
        $scope.meta.dataFilter = {};
        $scope.meta.jobListPage = 1;
        $scope.meta.pageInit = true;
        $scope.meta.scheduledPageInit = true;
        $scope.meta.statuses = ['Completed', 'Aborted', 'Failed'];
        $scope.meta.autoProcessMultiSelect = [
          { Label: dc3Translate('MERGE', 'Merge'), value: 'MERGE' },
          { Label: dc3Translate('CONVERT', 'Convert'), value: 'CONVERT' }
        ];
        $scope.meta.pollingLoading = true;
        $scope.meta.pollingService = undefined;

        $rootScope.meta = {};
        $rootScope.meta.isLoading = false;
        $rootScope.meta.fetchMoreLoading = false;
        $rootScope.meta.state = {};
        $rootScope.meta.checkCount = 0;
        $rootScope.meta.deleteIds = [];
        $rootScope.meta.maxPageSize = 10;
        $rootScope.meta.dataFilter = {};
        $rootScope.meta.isDataFilter = false;
        $rootScope.meta.loadMoreButton = true;

        $rootScope.modal = {};
        $rootScope.modal.modalStartJob = true;

        $rootScope.data = {};
        $rootScope.data.jobList = Array();

        buildDefaultFilter();
        if (localStorageService.keys().indexOf('dcBatchFilter') > -1) {
          $rootScope.meta.dataFilter = localStorageService.get('dcBatchFilter');
          $rootScope.meta.isDataFilter = !angular.equals($rootScope.meta.dataFilter, $rootScope.meta.defaultFilter);
        }

        // GET FILTER FROM LOCAL STORAGE
        // $rootScope.meta.dataFilter =

        $rootScope.helpUrl = dc3Translate('URL_SUPPORT_GUIDE_DC_JOB', 'https://support.duplicatecheck.com');
        $rootScope.helpFilter = dc3Translate('URL_SUPPORT_USAGE_DC_FILTER', 'https://support.duplicatecheck.com');

        buildDataStore();
      };

      $scope.openNewJobModal = function () {
        window.recordEvt('DC Job - New Job Button Clicked', {});
        window.persistEvt();
        $rootScope.modal.modalStartJob = true;
      };

      var buildDataStore = function () {
        var dataStore = angular.element('div#dataStore');
        var endpoint = {};
        endpoint.startDelta = dataStore.data('sf-action-delta');
        endpoint.jobListFilter = dataStore.data('sf-job-list-filter');
        endpoint.scenarioList = dataStore.data('sf-scenario');
        endpoint.crossObject = dataStore.data('sf-cross-object');
        endpoint.filterField = dataStore.data('sf-filter-field');
        endpoint.relatedTypeAhead = dataStore.data('sf-type-ahead');
        endpoint.startJob = dataStore.data('sf-start-job');
        endpoint.deleteJob = dataStore.data('sf-action-delete');
        endpoint.abortJob = dataStore.data('sf-abort-job');
        endpoint.startMerge = dataStore.data('sf-action-merge');
        endpoint.startMergeDCLocal = dataStore.data('sf-action-merge-dc-local');
        endpoint.startConvert = dataStore.data('sf-action-convert');
        endpoint.scheduledList = dataStore.data('sf-scheduled-list');
        endpoint.scheduledListSorted = dataStore.data('sf-scheduled-list-sorted');
        endpoint.scheduledStart = dataStore.data('sf-scheduled-start');
        endpoint.scheduledActivate = dataStore.data('sf-scheduled-activate');
        endpoint.scheduledDeactivate = dataStore.data('sf-scheduled-deactivate');
        endpoint.scheduledDelete = dataStore.data('sf-scheduled-delete');
        endpoint.totalRecordMatches = dataStore.data('sf-total-record-matches');
        endpoint.cloneAndStart = dataStore.data('sf-clone-and-start');

        $rootScope.endpoint = endpoint;
      };

    $rootScope.navigateToLwc = function (jobId) {
        window.location.href = '/lightning/n/dupcheck__dc3JobPage?jobId=' +jobId;
    }

    var buildDefaultFilter = function () {
        var df = {};
        $rootScope.meta.defaultFilter = {};
        df.pageSize = 10;
        df.pageNumber = 0;
        df.jobName = '';
        df.objectName = 'None';
        df.objectMatchName = 'None';
        df.filter = 'ANY';
        df.autoProcess;
        df.startedAfter = undefined;
        df.finishedBefore = undefined;
        df.groups = undefined;
        df.duplicate = undefined;
        df.averageScore = undefined;
        df.orderBy = 'Started__c';
        df.sorting = 'DESC';

        $rootScope.meta.defaultFilter = df;
        $rootScope.meta.dataFilter = angular.copy($rootScope.meta.defaultFilter);
        $rootScope.meta.tempDataFilter = angular.copy($rootScope.meta.defaultFilter);
      };

      init();

      $rootScope.openUrlIH = function (url) {
        //Open Url Inline Help
        dcNavigateNew(url, 'utm_source=dcApp&utm_medium=app&utm_campaign=help_inline');
      };

      $rootScope.reloadPage = function () {
        var refreshFilter = angular.copy($rootScope.meta.dataFilter);
        refreshFilter.pageSize = ($rootScope.meta.dataFilter.pageNumber + 1) * $rootScope.meta.dataFilter.pageSize;
        refreshFilter.pageNumber = 0;
        $rootScope.getJobList(true, refreshFilter);
      };

      var buildStatusObject = function () {
        $scope.meta.pollingLoading = false;

        var continueLoop = true;
        angular.forEach($rootScope.data.jobList, function (v, k) {
          if (
            continueLoop &&
            ($scope.meta.statuses.indexOf($rootScope.data.jobList[k].status) == -1 ||
              $rootScope.data.jobList[k].jobType == 'search-del')
          ) {
            continueLoop = false;
            $rootScope.startJobPoller();
          }
          angular.forEach(v.childJobs, function (vv, kk) {
            if (continueLoop && $scope.meta.statuses.indexOf(vv.status) == -1 && vv.status !== undefined) {
              continueLoop = false;
              $rootScope.startJobPoller();
            }
          });
        });

        if (!continueLoop) {
          return;
        }

        $interval.cancel($scope.meta.pollingService);
        $scope.meta.pollingService = undefined;
      };

      $rootScope.startJobPoller = function () {
        if (angular.isDefined($scope.meta.pollingService)) {
          return;
        }

        $scope.meta.pollingService = $interval(function () {
          $rootScope.reloadPage();
        }, 5000);
      };

      $rootScope.openUrl = function (url, uri) {
        dcNavigate(url, uri);
      };

      $scope.uniqueUploadJob = function () {
        var getter = remoting.emptyService($rootScope.endpoint.startDelta).then(
          function (result) {
            $scope.meta.uniqueUpload = false;
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $rootScope.showTabAccessAlert = function() {
        var dismissed = window.localStorage.getItem('dismissedTabAccessAlert');
      
        if (!dismissed) {
          return true;
        }
        return false;
      };

      $rootScope.dismissTabAccessAlert = function() {
        window.localStorage.setItem('dismissedTabAccessAlert', 'true');
      };

      $scope.openAllGroups = function () {
        angular.forEach($rootScope.data.jobList, function (v, k) {
          if (angular.isUndefined($rootScope.meta.state[v.jobId])) {
            $rootScope.meta.state[v.jobId] = {};
          }
          $rootScope.meta.state[v.jobId].isOpen = true;
        });
      };

      $scope.closeAllGroups = function () {
        angular.forEach($rootScope.data.jobList, function (v, k) {
          if (angular.isDefined($rootScope.meta.state[v.jobId])) {
            $rootScope.meta.state[v.jobId].isOpen = false;
          }
        });
      };

      $scope.openFilterModal = function () {
        window.recordEvt('DC Job - Filter Button Clicked', {});
        window.persistEvt();
        $scope.meta.modalFilter = true
      };

      $rootScope.resetFilter = function () {
        $rootScope.meta.tempDataFilter = angular.copy($rootScope.meta.defaultFilter);
        // REMOTE FILTER FROM LOCALSTORAFE
        localStorageService.remove('dcBatchFilter');
        $rootScope.meta.isDataFilter = !angular.equals($rootScope.meta.dataFilter, $rootScope.meta.defaultFilter);
      };

      $rootScope.applyFilter = function () {
        $rootScope.data.jobList = [];
        $scope.meta.modalFilter = false;
        $rootScope.meta.dataFilter = angular.copy($rootScope.meta.tempDataFilter);
        $rootScope.meta.dataFilter.pageNumber = $rootScope.meta.dataFilter.pageNumber;
        $rootScope.meta.dataFilter.pageSize = $rootScope.meta.defaultFilter.pageSize;

        localStorageService.set('dcBatchFilter', $rootScope.meta.dataFilter, 'sessionStorage');
        $rootScope.meta.isDataFilter = !angular.equals($rootScope.meta.dataFilter, $rootScope.meta.defaultFilter);
        // SAVE FILTER TO LOCALSTORAGE

        $rootScope.getJobList(true, $rootScope.meta.dataFilter);
        $rootScope.meta.loadMoreButton = true;
      };

      $rootScope.getJobList = function (resetData, filterData) {
        //FIXME getJobList
        $scope.meta.pollingLoading = true;
        $rootScope.meta.jobListSize = filterData.pageSize;
        $rootScope.data.filterData = filterData;
        var getter = remoting.singleService($rootScope.endpoint.jobListFilter, $rootScope.data.filterData).then(
          function (result) {
            $scope.processJobData(result, resetData);
            buildStatusObject();
            $rootScope.meta.fetchMoreLoading = false;

            try {
              var OpenId = $location
                .absUrl()
                .match(/OpenId=.{18}/)[0]
                .substring(7);
              angular.forEach($rootScope.data.jobList, function (v, k) {
                if (v.jobId == OpenId) {
                  $rootScope.meta.state[v.jobId].isOpen = true;
                }
              });
            } catch (exception) {
              //Triggered when the url no longer contains an OpenId
            }

            $location.url('');

            if ($scope.meta.pageInit) {
              window.recordEvt('DC Job - Loaded', {load_time: new Date().getTime() - $rootScope.meta.batchProcessLoadingStart, component_title: 'Job Overview', number_of_jobs: result.totalJobs, dc_job_beta: false});
              window.persistEvt();
            }
            $scope.meta.pageInit = false;
            $rootScope.meta.isProcessLoading = false;
          },
          function (reason) {
            $scope.meta.pageInit = false;
            $rootScope.meta.isProcessLoading = false;
            $rootScope.meta.fetchMoreLoading = false;
            alert(reason);
          }
        );
      };

      $scope.processJobData = function (jobData, resetData) {
        if (jobData.JobList.length == 0) {
          $rootScope.meta.loadMoreButton = false;
        }

        if (resetData) {
          $scope.data.tempJobData = jobData.JobList;
        } else {
          $scope.data.tempJobData = angular.copy($rootScope.data.jobList);
          angular.forEach(jobData.JobList, function (v, k) {
            $scope.data.tempJobData.push(v);
          });
        }

        $rootScope.data.jobList = angular.copy($scope.data.tempJobData);
        $rootScope.data.isMore = jobData.isMore;

        $rootScope.data.jobList = $rootScope.data.jobList;
        // $filter('orderObjectBy')($rootScope.data.jobList, $rootScope.data.filterData.orderBy, $rootScope.data.filterData.sorting);
      };

      $rootScope.processDeleteIds = function (ids) {
        $rootScope.meta.deleteIds = [];
        if (typeof ids == 'string') {
          $rootScope.meta.deleteIds.push(ids);
          $rootScope.meta.checkCount = 1;
        } else {
          angular.forEach(ids, function (v, k) {
            if (v.isChecked) {
              $rootScope.meta.deleteIds.push(k);
            }
          });
        }
        $rootScope.meta.deleteJobModal = true;
      };

      $rootScope.getScheduledJobList = function () {
        var getter = remoting.quadService($rootScope.endpoint.scheduledListSorted, 0, 1000, 'column', true).then(
          function (result) {
            $rootScope.data.scheduledJobList = result.value;
            angular.forEach($rootScope.data.scheduledJobList, function (v, k) {
              if (empty($rootScope.meta.state[v.jobId])) {
                $rootScope.meta.state[v.jobId] = {};
              }
            });
            if ($scope.meta.scheduledPageInit) {
              window.recordEvt('DC Scheduled Job - Loaded', {load_time: new Date().getTime() - $rootScope.meta.scheduledJobLoadingStart, component_title: 'Scheduled Job Overview', number_of_jobs: result.totalPages, dc_job_beta: false});
              window.persistEvt();
            }
            $scope.meta.scheduledPageInit = false;
            $rootScope.meta.isScheduledLoading = false;
          },
          function (reason) {
            $rootScope.meta.isScheduledLoading = false;
            alert(reason);
          }
        );
      };
    }
  )
  .controller(
    'batchProcessController',
    function ($scope, $rootScope, $interval, remoting, $location, localStorageService) {
      //FIXME batchProcessController

      var init = async function () {
        $rootScope.meta.batchProcessLoadingStart = new Date().getTime();

        $rootScope.meta.isProcessLoading = true;
        $scope.meta = {};
        $scope.meta.deleteModalSingle = false;
        $scope.meta.autoMergeModal = false;
        $scope.meta.autoConvertModal = false;
        $scope.meta.slider = { options: { floor: 1, ceil: 100, step: 1 } };
        $scope.meta.autoMergeThreshold = 100;
        $scope.meta.autoConvertThreshold = 100;
        $scope.meta.deleteModalMultiple = false;
        $scope.meta.autoMergeJobName;
        $scope.meta.autoMergeIndex;
        $scope.meta.autoConvertJobName;
        $scope.meta.autoConvertJobId;
        $scope.meta.autoConvertIndex;
        $scope.meta.removeJobName;
        $scope.meta.removeJobId;
        $scope.meta.autoConvertStatus;
        $scope.meta.autoConvertOwner = 'LEAD';
        $scope.meta.autoConvertOwnerName;
        $scope.meta.maxJobSize = 100;
        $scope.meta.checkCount = 0;
        $scope.meta.selected = Object();
        $scope.meta.ownerId = 'Owner ID';
        $scope.meta.removingJobs = false;
        $scope.meta.userLookupObject = { User: { Label: 'User', Name: 'User', SldsIcon: 'user' } };
        $scope.meta.converting = false;
        $scope.meta.merging = false;
        $scope.meta.masterCheck = false;

        $scope.data = {};

        $rootScope.getJobList(true, $rootScope.meta.dataFilter);
      };

      $scope.openExportModal = function (index) {
        $scope.meta.jobName = $rootScope.data.jobList[index].jobName;
        $scope.meta.jobId = $rootScope.data.jobList[index].jobId;
        $scope.meta.job = null;
        $scope.meta.exportJobModal = true;
      };

      $scope.openExportResultsModal = function (index) {
        $scope.meta.job = $rootScope.data.jobList[index];
        $scope.meta.exportJobResultslModal = true;
        $scope.meta.exportJobModal = false;
      };

      $scope.closeExportModal = function () {
        $scope.meta.exportJobModal = false;
        $scope.meta.jobId = undefined;
        $scope.meta.exportJobResultslModal = false;
        $scope.meta.jobName = undefined;
      };

      $scope.fetchMore = function () {
        $rootScope.meta.fetchMoreLoading = true;
        $rootScope.meta.dataFilter.pageNumber++;
        $rootScope.getJobList(false, $rootScope.meta.dataFilter);
      };

      $scope.cancelDelete = function () {
        $rootScope.meta.deleteJobModal = false;
        $scope.meta.masterCheck = false;
        $scope.checkAll();
      };

      $scope.selectMasterCheck = function ($event) {
        var counter = 0;
        angular.forEach($rootScope.data.jobList, function (v, k) {
          if (angular.isUndefined($rootScope.meta.state[v.jobId])) {
            $rootScope.meta.state[v.jobId] = {};
          }
          $rootScope.meta.state[v.jobId].isChecked = $event.currentTarget.checked;
          if ($event.currentTarget.checked) counter++;
        });
        $rootScope.meta.checkCount = counter;
      };

      $scope.selectItem = function (jobId, $event) {
        if (Object.keys($rootScope.meta.state).length == 0) {
          return;
        }
        var counter = 0;

        if ($event && $event.currentTarget) {
          $rootScope.meta.state[jobId].isChecked = $event.currentTarget.checked;
        }

        angular.forEach($rootScope.meta.state, function (v, k) {
          if (v.isChecked) {
            counter++;
          }
        });

        $rootScope.data.jobList.length == counter
          ? ($scope.meta.masterCheck = true)
          : ($scope.meta.masterCheck = false);
        $rootScope.meta.checkCount = counter;
      };

      $scope.deleteJobs = function () {
        $rootScope.meta.deleteJobModal = false;
        angular.forEach($rootScope.meta.deleteIds, function (k) {
          if (angular.isUndefined($rootScope.meta.state[k])) {
            $rootScope.meta.state[k] = {};
          }
          $rootScope.meta.state[k].isOpen = false;
        });

        $rootScope.startJobPoller();
        var setter = remoting.singleService($rootScope.endpoint.deleteJob, $rootScope.meta.deleteIds).then(
          function (result) {
            angular.forEach($rootScope.meta.deleteIds, function (k) {
              delete $rootScope.meta.state[k];
            });
            $rootScope.meta.deleteIds = [];
            $rootScope.reloadPage();
            $scope.meta.masterCheck = false;
            $rootScope.meta.checkCount = 0;
          },
          function (reason) {
            alert(reason);
            $scope.meta.masterCheck = false;
          }
        );
      };

      $scope.getLookup = function (relatedObject, searchText, optionalFields) {
        angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

        var getter = remoting
          .tripleService($rootScope.endpoint.relatedTypeAhead, relatedObject, searchText, optionalFields)
          .then(
            function (result) {
              $scope.meta.referenceOptions = result;
            },
            function (reason) {
              alert(reason);
            }
          );
      };

      $scope.calcLowScore = function (index) {
        var jobMap = {};
        angular.forEach($rootScope.data.jobList, function (v, k) {
          jobMap[v.jobId] = v;
        });
        $rootScope.data.jobMap = jobMap;

        var job = $scope.jobMap[jobId];

        $scope.mergeJobId = jobId;
        $scope.mergeJob = job.jobName;

        var scoreList = [];
        for (var i = job.lowScore; i <= 100; i++) {
          scoreList.push(i);
        }
        $scope.mergeScore = job.lowScore;
      };

      $scope.toggleAutoConvertModal = function (jobName, jobId, index, sourceKey, matchKey) {
        $scope.meta.autoConvertModal = !$scope.meta.autoConvertModal;
        $scope.meta.autoConvertJobName = jobName;
        $scope.meta.autoConvertJobId = jobId;
        $scope.meta.autoConvertIndex = index;
        $scope.meta.autoConvertThreshold = $rootScope.data.jobList[index].lowScore;
        $scope.meta.autoConvertLeadAccount = false;
        $scope.meta.autoConvertOwner = 'LEAD';

        if (sourceKey == '001' && matchKey == '00Q') {
          $scope.meta.autoConvertLeadAccount = true;
        } else if (sourceKey == '00Q' && matchKey == '001') {
          $scope.meta.autoConvertLeadAccount = true;
        }
      };

      $scope.startConvert = function () {
        $scope.meta.converting = true;
        var ownerId = $scope.meta.autoConvertOwner;
        if ($scope.meta.autoConvertOwner == 'OTHER') {
          ownerId = $scope.meta.autoConvertOwnerName;
        }

        var getter = remoting
          .quadService(
            $rootScope.endpoint.startConvert,
            $scope.meta.autoConvertJobId,
            $scope.meta.autoConvertThreshold,
            ownerId,
            $scope.meta.autoConvertStatus
          )
          .then(
            function (result) {
              $scope.meta.autoConvertModal = false;
              $scope.meta.autoConvertThreshold = 100;
              if (angular.isUndefined($rootScope.meta.state[$scope.meta.autoConvertJobId])) {
                $rootScope.meta.state[$scope.meta.autoConvertJobId] = {};
              }
              $rootScope.meta.state[$scope.meta.autoConvertJobId].isOpen = true;
              $scope.meta.converting = false;
              $rootScope.reloadPage();
            },
            function (reason) {
              $scope.meta.autoConvertModal = false;
              alert(reason);
              $scope.meta.autoConvertThreshold = 100;
              $scope.meta.converting = false;
            }
          );
      };

      $scope.toggleAutoMergeModal = function (jobName, jobId, index) {
        $scope.meta.autoMergeModal = !$scope.meta.autoMergeModal;
        $scope.meta.autoMergeJobName = jobName;
        $scope.meta.autoMergeJobId = jobId;
        $scope.meta.autoMergeIndex = index;
        $scope.meta.autoMergeThreshold = $rootScope.data.jobList[index].lowScore;
      };

      $scope.startMerge = function () {
        $scope.meta.merging = true;
        var getter = remoting
          .doubleService($rootScope.endpoint.startMerge, $scope.meta.autoMergeJobId, $scope.meta.autoMergeThreshold)
          .then(
            function (result) {
              $scope.meta.autoMergeModal = false;
              $scope.meta.autoMergeThreshold = 100;
              if (angular.isUndefined($rootScope.meta.state[$scope.meta.autoMergeJobId])) {
                $rootScope.meta.state[$scope.meta.autoMergeJobId] = {};
              }
              $rootScope.meta.state[$scope.meta.autoMergeJobId].isOpen = true;
              $scope.meta.merging = false;
              $rootScope.reloadPage();
            },
            function (reason) {
              $scope.meta.autoMergeModal = false;
              alert(reason);
              $scope.meta.autoMergeThreshold = 100;
              $scope.meta.merging = false;
            }
          );
      };

      $scope.startMergeDCLocal = function () {
        $scope.meta.merging = true;
        var getter = remoting
          .doubleService(
            $rootScope.endpoint.startMergeDCLocal,
            $scope.meta.autoMergeJobId,
            $scope.meta.autoMergeThreshold
          )
          .then(
            function (result) {
              $scope.meta.autoMergeModal = false;
              $scope.meta.autoMergeThreshold = 100;
              if (angular.isUndefined($rootScope.meta.state[$scope.meta.autoMergeJobId])) {
                $rootScope.meta.state[$scope.meta.autoMergeJobId] = {};
              }
              $rootScope.meta.state[$scope.meta.autoMergeJobId].isOpen = true;
              $scope.meta.merging = false;
              $rootScope.reloadPage();
            },
            function (reason) {
              $scope.meta.autoMergeModal = false;
              alert(reason);
              $scope.meta.autoMergeThreshold = 100;
              $scope.meta.merging = false;
            }
          );
      };

      $scope.cloneAndStart = function (jobId) {
        if (angular.isUndefined($rootScope.meta.state[jobId])) {
          $rootScope.meta.state[jobId] = {};
        }

        var getter = remoting.singleService($rootScope.endpoint.cloneAndStart, jobId).then(
          function (result) {
            $rootScope.meta.state[jobId].isRestarting = false;
            $rootScope.reloadPage();
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.abortJob = function (jobId) {
        var idList = [];
        idList.push(jobId);
        if (angular.isUndefined($rootScope.meta.state[jobId])) {
          $rootScope.meta.state[jobId] = {};
        }
        $rootScope.meta.state[jobId].isAborting = true;
        var getter = remoting.singleService($rootScope.endpoint.abortJob, idList).then(
          function (result) {
            $rootScope.reloadPage();
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.toggleRow = function (jobId) {
        if (angular.isUndefined($rootScope.meta.state[jobId])) {
          $rootScope.meta.state[jobId] = {};
        }
        $rootScope.meta.state[jobId].isOpen = !$rootScope.meta.state[jobId].isOpen;
      };

      init();
    }
  )
  .controller(
    'batchScheduledController',
    function ($scope, $rootScope, $interval, remoting, $location, localStorageService) {
      //FIXME batchScheduledController

      var init = function () {
        $rootScope.meta.scheduledJobLoadingStart = new Date().getTime();
        $scope.meta = {};
        $scope.meta.active = dc3Translate('ACTIVE', 'Active');
        $scope.meta.inactive = dc3Translate('INACTIVE', 'Inactive');
        $scope.meta.modalDeleteSchedule = false;
        $rootScope.meta.isScheduledLoading = true;

        $rootScope.getScheduledJobList();
      };

      $scope.startScheduledJob = function (jobId) {
        $rootScope.meta.state[jobId].isProcessing = true;
        var getter = remoting.singleService($rootScope.endpoint.scheduledStart, jobId).then(
          function (result) {
            $rootScope.meta.state[jobId].isProcessing = false;
          },
          function (reason) {
            $rootScope.meta.state[jobId].isProcessing = false;
            alert(reason);
          }
        );
      };

      $scope.toggleScheduledJob = function (jobId, jobStatus) {
        const functionStartTime = new Date().getTime();
        $rootScope.meta.state[jobId].isProcessing = true;
        let eventName = 'DC Scheduled Job - Activate Clicked';
        var endpoint = $rootScope.endpoint.scheduledActivate;
        if (jobStatus == 'Active') {
          eventName = 'DC Scheduled Job - Deactivate Clicked';
          endpoint = $rootScope.endpoint.scheduledDeactivate;
        }

        var getter = remoting.singleService(endpoint, jobId).then(
          function (result) {
            const functionFinishTime = new Date().getTime();
            window.recordEvt(eventName, 'Active' === jobStatus ? {time_to_deactivate: functionFinishTime - functionStartTime} : {time_to_activate: functionFinishTime - functionStartTime});
            window.persistEvt();
            $rootScope.meta.state[jobId].isProcessing = false;
            $rootScope.getScheduledJobList();
          },
          function (reason) {
            $rootScope.meta.state[jobId].isProcessing = false;
            alert(reason);
          }
        );
      };

      $scope.toggleDeleteScheduledJob = function (jobId, jobName) {
        $scope.meta.modalDeleteSchedule = !$scope.meta.modalDeleteSchedule;
        $scope.meta.removeJobId = jobId;
        $scope.meta.removeJobName = jobName;
      };

      $scope.deleteScheduledJob = function () {
        window.recordEvt('DC Scheduled Job - Delete Clicked', {});
        window.persistEvt();

        $rootScope.meta.state[$scope.meta.removeJobId].isProcessing = true;
        var getter = remoting.singleService($rootScope.endpoint.scheduledDelete, $scope.meta.removeJobId).then(
          function (result) {
            resetDeleteModal();

            $rootScope.getScheduledJobList();
          },
          function (reason) {
            resetDeleteModal();
            alert(reason);
          }
        );
      };

      var resetDeleteModal = function () {
        $rootScope.meta.state[$scope.meta.removeJobId].isProcessing = false;
        $scope.meta.modalDeleteSchedule = false;
        $scope.meta.removeJobId = undefined;
        $scope.meta.removeJobName = undefined;
      };

      $scope.toggleRow = function (jobId) {
        if (angular.isUndefined($rootScope.meta.state[jobId])) {
          $rootScope.meta.state[jobId] = {};
        }
        $rootScope.meta.state[jobId].isOpen = !$rootScope.meta.state[jobId].isOpen;
      };

      init();
    }
  )
  .controller(
    'batchStartJobController',
    function ($scope, $rootScope, $interval, $timeout, remoting, $location, $filter, localStorageService) {
      //FIXME batchStartJobController

      $rootScope.modal.modalDCLocal = false;
      $scope.init = function () {
        $scope.data = {};
        $scope.data.sourceObject;
        $scope.data.scenario = [];
        $scope.data.scenarioList = [];
        $scope.data.crossObjectList = null;
        $scope.data.crossObject = null;
        $scope.data.batchName = '';
        $scope.data.filterLogic = '';
        $scope.data.matchfilterLogic = '';
        $scope.data.filters = [];
        $scope.data.matchFilters = [];

        $scope.meta = {};
        $scope.meta.externalJob = false;
        $scope.meta.autoProcess = {};
        $scope.meta.autoProcess.type = 'NONE';
        $scope.meta.autoProcess.threshold = 100;
        $scope.meta.autoProcess.isConvert = false;
        $scope.meta.autoProcess.isMerge = false;
        $scope.meta.autoProcess.isLeadAccount = false;
        $scope.meta.autoProcess.convertOwner = 'LEAD';
        $scope.meta.filterApplied = {};
        $scope.meta.filterApplied.on = '';
        $scope.meta.filterApplied.with = '';
        $scope.meta.schedule = {};
        $scope.meta.schedule.isSchedule = false;
        $scope.meta.filter = {};
        $scope.meta.filter.filterValid = true;
        $scope.meta.filter.matchFilterValid = true;

        $scope.meta.filter.isFilter = false;
        $scope.meta.slider = { options: { floor: 1, ceil: 100, step: 1 } };
        $scope.meta.referenceOptions;
        $scope.meta.buttonAutoConvert = false;
        $scope.meta.buttonAutoMerge = false;
        $scope.meta.fieldExpressions = [
          { label: 'In Campaign', value: 'campaign' },
          { label: 'Date Literal', value: 'dateliteral' },
          { label: 'Equal', value: '=' },
          { label: 'Not Equal', value: '!=' },
          { label: 'Less than', value: '<' },
          { label: 'Greater than', value: '>' },
          { label: 'Less than or Equal', value: '<=' },
          { label: 'Greater than or equal', value: '>=' },
          { label: 'Start With', value: 'startWith' },
          { label: 'End With', value: 'endWith' },
          { label: 'Like', value: 'like' },
          { label: 'Includes', value: 'includes' }
        ];
        $scope.meta.ownerId = 'Owner ID';
        $scope.meta.userLookupObject = { User: { Label: 'User', Name: 'User', SldsIcon: 'user' } };
        $rootScope.modal.modalStartJob = false;
        $scope.meta.jobStarting = false;
        $scope.meta.campaignMeta = {
          Campaign: {
            CardIcon: 'context-campaign',
            Icon: 's1icon-s-campaign',
            isAccessible: true,
            isBasic: true,
            isCreateable: true,
            isCustom: false,
            isDeletable: true,
            isFeedEnabled: true,
            isQueryable: true,
            isRecordType: true,
            isSearchable: true,
            isStandard: false,
            isUpdateable: true,
            Label: 'Campaign',
            LabelPlural: 'Campaigns',
            Name: 'Campaign',
            NameCorrect: 'Campaign',
            Prefix: '701',
            PrefixCorrect: '701',
            SldsIcon: 'campaign'
          }
        };

        $scope.meta.checkingJob = false;
        $scope.meta.correctJob = false;
        $scope.meta.showAlert = false;
        $scope.meta.showMatchWith = false;

        $scope.form = {};
      };

      $scope.$watchGroup(['data.sourceObject', 'data.crossObject'], function (newValues, oldValues) {
        $scope.meta.autoProcess.type = 'NONE';
        $scope.buttonState();
      });

      var jobCheckFailed = function () {
        $scope.meta.correctJob = false;
        $scope.meta.checkingJob = false;
      };

      var initializing = true;
      $scope.$watch(
        function () {
          return [
            'data.sourceObject',
            'data.crossObject',
            'data.scenario',
            'data.batchName',
            'meta.filter.filterValid',
            'meta.filter.matchFilterValid',
            'meta.filterApplied.with',
            'meta.filterApplied.on'
          ].map(function (item) {
            return $scope.$eval(item);
          });
        },
        function (n, o) {
          if (initializing || $scope.meta.crossObjectLoading) {
            initializing = false;
            return;
          }
          $scope.meta.recordTotal = undefined;
          $scope.meta.checkingJob = true;
          $scope.meta.correctJob = false;
          $timeout.cancel($scope.meta.recordTimeout);

          if (
            $scope.data.sourceObject == undefined ||
            $scope.data.crossObject == undefined ||
            $scope.data.batchName == undefined ||
            $scope.data.batchName.length == 0 ||
            $scope.data.scenario.length == 0
          ) {
            return jobCheckFailed();
          }

          if ($scope.meta.filterApplied.on == 'filter' && !$scope.meta.filter.filterValid) {
            return jobCheckFailed();
          }

          if ($scope.meta.filterApplied.with == 'filter' && !$scope.meta.filter.matchFilterValid) {
            return jobCheckFailed();
          }

          $scope.meta.correctJob = true;
          $scope.meta.recordTimeout = $timeout(function () {
            $scope.meta.showAlert = true;
            recordTotal();
          }, 750);
        },
        true
      );

      var recordTotal = function () {
        remoting
          .quintService(
            $rootScope.endpoint.totalRecordMatches,
            $scope.data.sourceObject,
            $scope.data.crossObject,
            $scope.meta.filterApplied.on,
            angular.toJson($scope.data.filters),
            $scope.data.filterLogic
          )
          .then(
            function (result) {
              $scope.meta.recordTotal = result;
              $scope.meta.checkingJob = false;
            },
            function (reason) {
              $scope.meta.checkingJob = false;
              $scope.meta.recordTotal = {
                size: 1,
                isLimit: true,
                suggestExternal: true
              };
            }
          );
      };

      $scope.openUrlNew = function (url) {
        dcNavigateNew(url, '');
      };

      $scope.buttonState = function () {
        if (empty($scope.data.crossObject) || empty($scope.data.sourceObject)) {
          $scope.isCrossJob = false;
        } else if ($scope.data.crossObject == $scope.data.sourceObject) {
          $scope.isCrossJob = false;
        } else {
          $scope.isCrossJob = true;
        }

        if (empty($scope.data.sourceObject)) {
          $scope.meta.autoProcess.isMerge = false;
        } else if (empty($scope.data.crossObject)) {
          $scope.meta.autoProcess.isMerge = true;
        } else if ($scope.data.crossObject == $scope.data.sourceObject) {
          $scope.meta.autoProcess.isMerge = true;
        } else {
          $scope.meta.autoProcess.isMerge = false;
        }

        if (empty($scope.data.crossObject) || empty($scope.data.sourceObject)) {
          $scope.meta.autoProcess.isConvert = false;
        } else if ($scope.data.crossObject == $scope.data.sourceObject) {
          $scope.meta.autoProcess.isConvert = false;
        } else if (
          ($scope.data.sourceObject == '00Q' &&
            ($scope.data.crossObject == '001' ||
              $scope.data.crossObject == '001P' ||
              $scope.data.crossObject == '003')) ||
          ($scope.data.sourceObject == '001' && $scope.data.crossObject == '00Q') ||
          ($scope.data.sourceObject == '001P' && $scope.data.crossObject == '00Q') ||
          ($scope.data.sourceObject == '003' && $scope.data.crossObject == '00Q')
        ) {
          $scope.meta.autoProcess.isConvert = true;
        } else {
          $scope.meta.autoProcess.isConvert = false;
        }

        if ($scope.meta.autoProcess.isConvert) {
          if ($scope.data.sourceObject == '00Q' && $scope.data.crossObject == '001') {
            $scope.meta.autoProcess.isLeadAccount = true;
          } else if ($scope.data.sourceObject == '001' && $scope.data.crossObject == '00Q') {
            $scope.meta.autoProcess.isLeadAccount = true;
          } else {
            $scope.meta.autoProcess.isLeadAccount = false;
          }
        }

        $scope.meta.buttonAutoMerge = false;
        $scope.meta.buttonAutoConvert = false;
      };

      $scope.objectSelect = function () {
        $scope.meta.crossObjectLoading = true;
        $scope.meta.scenarioListLoading = true;
        $scope.meta.showAlert = false;
        $scope.data.crossObject = '';
        $scope.resetFilter();
        $scope.meta.showMatchWith = true;

        remoting.singleService($rootScope.endpoint.crossObject, $scope.data.sourceObject).then(

          function (result) {
            if (result.value.returnList == null) {
              $scope.meta.showMatchWith = false;
            }

            $scope.data.crossObject = $scope.data.sourceObject;
            $scope.data.crossObjectList = result.value.returnList;
            $scope.data.recordLimit = result.value.recordLimit;
            $scope.data.recordCount = result.value.recordCount;
            $scope.data.licenseEdition = result.value.licenseEdition;
            $scope.data.sourceObjectPredefinedFilters = result.value.predefinedFilter;
            $scope.meta.objectMeta = result.value.objectMeta;
            $scope.meta.crossObjectLoading = false;
            $scope.crossObjectSelect(false);

            window.recordEvt('New Job modal - Select Records - Select Object dropdown clicked', {add_cross_object: $scope.data.sourceObject !== $scope.data.crossObject, add_filter: $scope.meta.filter.isFilter});
            window.persistEvt();
          },
          function (reason) {
            $scope.meta.crossObjectLoading = false;
            alert(reason);
          }
        );
      };

      $scope.crossObjectSelect = function (allowTelemetry = true) {
        $scope.meta.showAlert = false;
        $scope.meta.scenarioListLoading = true;
        $scope.data.scenario = [];
        $scope.data.scenarioList = [];
        var prefix;
        if ($scope.data.crossObject == null && $scope.data.sourceObject == null) {
          return;
        } else if ($scope.data.crossObject == null) {
          prefix = angular.copy($scope.data.sourceObject);
        } else {
          prefix = angular.copy($scope.data.crossObject);
        }

        $scope.resetFilter();

        remoting.singleService($rootScope.endpoint.scenarioList, prefix).then(
          function (result) {
            angular.forEach(result.value.scenarioList, function (result) {
              if (result.onBatch) {
                $scope.data.scenario.push(result.scenarioId);
              }
              $scope.data.scenarioList.push(result);
            });

            $scope.data.matchObjectPredefinedFilters = result.value.predefinedFilter;

            if ($scope.data.scenarioList.length == 0) {
              alert(
                dc3Translate(
                  'NO_SCENARIOS_FOUND_PLEASE_CREATE_ON_DC_SETUP',
                  'No scenarios have been found. Please create a scenario for the selected object on the Deduplicate Setup page'
                )
              );
            }

            if (allowTelemetry) {
              window.recordEvt('New Job modal - Select Records - Select Object dropdown clicked', {add_cross_object: $scope.data.sourceObject !== $scope.data.crossObject, add_filter: $scope.meta.filter.isFilter});
              window.persistEvt();
            }

            $scope.meta.scenarioListLoading = false;
          },
          function (reason) {
            $scope.meta.scenarioListLoading = false;
            alert(reason);
          }
        );
      };

      $scope.resetFilter = function () {      

        if ($scope.meta.filter.isFilter == false) {
          $scope.meta.filterApplied.on = '';
          $scope.meta.filterApplied.with = '';
          $scope.data.filters = [];
          $scope.data.filterLogic = '';
          $scope.data.matchFilters = [];
          $scope.data.matchfilterLogic = '';
        } else {
          $scope.meta.filterApplied.on = 'filter';
          if ($scope.data.sourceObject != $scope.data.crossObject) {
            $scope.meta.filterApplied.with = 'all';
          } else {
            $scope.meta.filterApplied.with = 'source';
          }
        }
      };

      $scope.toggleFilter = function () {
        window.recordEvt('New Job modal - Select Records - Add Filter Button clicked', {});
        window.persistEvt();

        $scope.meta.filter.isFilter = !$scope.meta.filter.isFilter;
        $scope.resetFilter();
      };

      $scope.getFilterFields = function (prefix, callback, callbackError) {
        remoting.singleServiceEscape($rootScope.endpoint.filterField, prefix).then(callback, callbackError);
      };

      $scope.toggleSchedule = function () {
        $scope.meta.schedule.isSchedule = !$scope.meta.schedule.isSchedule;
      };

      $scope.scenarioChangedTelemetry = function () {
        const scenarioNames = [];
        $scope.data.scenarioList.forEach(scenario => {
          if ($scope.data.scenario.includes(scenario.scenarioId)) {
            scenarioNames.push(scenario.scenarioName);
          }
        });
        window.recordEvt('New Job modal - Select Records - Scenario dropdown clicked', {selected_scenario_name: scenarioNames.join(', ')});
        window.persistEvt();
      };

      $scope.getLookup = function (relatedObject, searchText, optionalFields) {
        if (relatedObject == 'RecordType') {
          relatedObject = relatedObject + '.' + $scope.data.sourceObject;
        }

        angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

        remoting.tripleService($rootScope.endpoint.relatedTypeAhead, relatedObject, searchText, optionalFields).then(
          function (result) {
            $scope.meta.referenceOptions = result;
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.getLookupCallback = function (relatedObject, searchText, optionalFields, callback, callbackError) {
        if (relatedObject == 'RecordType') {
          relatedObject = relatedObject + '.' + $scope.data.sourceObject;
        }

        angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

        remoting
          .tripleService($rootScope.endpoint.relatedTypeAhead, relatedObject, searchText, optionalFields)
          .then(callback, callbackError);
      };

      $scope.toggleAuto = function (process) {
        window.recordEvt(`New Job modal - Job Options - Add Auto ${'CONVERT' === process ? 'Convert' : 'Merge'} Menu item Clicked`, {});
        window.persistEvt();

        if ($scope.meta.autoProcess.type !== process) {
          $scope.meta.autoProcess.type = process;
        } else {
          $scope.meta.autoProcess.type = 'NONE';
        }
        $scope.meta.buttonAutoMerge = !$scope.meta.buttonAutoMerge;
        $scope.meta.buttonAutoConvert = !$scope.meta.buttonAutoConvert;
      };

      $scope.startBatch = function (external) {
        //$rootScope.modal.modalStartJob = false;
        window.recordEvt('New Job modal - Start button clicked', {processing_options: external ? dc3Translate('START_LOCAL', 'Plauti Desktop/Server') : dc3Translate('START', 'Start')});
        window.persistEvt();
        $scope.data.isStartBatch = true;
        if ($scope.data.sourceObject == null) {
          alert(dc3Translate('PLEASE_PROVIDE_AN_OBJECT', 'Please provide an object'));
          $scope.data.isStartBatch = false;
          return;
        }

        if ($scope.data.batchName == null) {
          alert(dc3Translate('PLEASE_PROVIDE_A_BATCH_NAME', 'Please provide a batch name'));
          $scope.data.isStartBatch = false;
          return;
        }

        if (external) {
          $rootScope.meta.externalJob = true;
        }

        if ($scope.data.crossObject == null) {
          $scope.data.crossObject = $scope.data.sourceObject;
        }

        if ($scope.data.scenarioList == null || $scope.data.scenarioList.length == 0) {
          $scope.data.scenario = [];
        }

        if ($scope.meta.schedule.isSchedule) {
          if ($scope.meta.schedule.frequency == 'weekly') {
            $scope.meta.schedule.weekdayString = $scope.meta.schedule.weekday;
          }
        }

        if (!$scope.meta.filter.isFilter) {
          $scope.meta.filterApplied.on = '';
          $scope.meta.filterApplied.with = '';
          $scope.data.filters = [];
          $scope.data.filterLogic = '';
          $scope.data.matchFilters = [];
          $scope.data.matchfilterLogic = '';
        }

        remoting
          .triDecService(
            $rootScope.endpoint.startJob,
            $scope.data.batchName,
            $scope.data.sourceObject,
            $scope.data.crossObject,
            $scope.data.scenario,
            angular.toJson($scope.data.filters),
            $scope.data.filterLogic,
            $scope.meta.schedule,
            $scope.meta.autoProcess,
            $scope.meta.filterApplied.on,
            external,
            $scope.meta.filterApplied.with,
            angular.toJson($scope.data.matchFilters),
            $scope.data.matchfilterLogic
          )
          .then(
            function (result) {
              if ($rootScope.activeTab == 'Processed') {
                $rootScope.reloadPage();
                $rootScope.startJobPoller();
              } else {
                $rootScope.getScheduledJobList();
              }

              $rootScope.modal.modalStartJob = false;
              $scope.data.isStartBatch = false;
              if (external) {
                $rootScope.modal.modalDCLocal = true;
              }

              $scope.init();
            },
            function (error) {
              alert(error);
              $scope.data.isStartBatch = false;
            }
          );
      };

      $scope.init();
    }
  );

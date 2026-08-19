angular.module('dcApp', [
  'dcApp.services',
  'dcApp.controllers',
  'dcApp.filters',
  'dcApp.directives',
  'ngSanitize',
  'plauti-ng-slds'
]);

angular
  .module('dcApp.filters', [])

  .filter('customPickList', function () {
    return function (input) {
      var obj = JSON.parse(input);
      return obj.picklistValues;
    };
  })

  .filter('customTextToBool', function () {
    return function (input) {
      return stringToBoolean(input);
    };
  })

  .filter('customNum', function () {
    return function (input) {
      return parseFloat(input, 10);
    };
  })

  .filter('customDate', function () {
    return function (input) {
      if (!input) {
        return null;
      }

      return moment(input).toDate();
    };
  })

  .filter('customSplit', function () {
    return function (input, splitChar) {
      if (!angular.isArray(input)) {
        return input.split(splitChar);
      } else {
        return input;
      }
    };
  })

  .filter('customJoin', function () {
    return function (input) {
      return input.join();
    };
  })

  .filter('customRemoveBrackets', function () {
    return function (input) {
      return input.replace('[', '').replace(']', '').replace(/\s/g, '');
    };
  });

angular
  .module('dcApp.controllers', ['ngCookies', 'LocalStorageModule'])
  .controller(
    'mergeController',
    function ($scope, $rootScope, remoting, $timeout, $cookies, localStorageService, $location, $window) {
      if (angular.element('div#dataStore').data('is-modal')) {
        window.parent.postMessage('MERGE_IFRAME_LOADED', angular.element('div#dataStore').data('lwc-url'));
      }
      $scope.init = function () {
        Visualforce.remoting.timeout = 120000;

        var dataContainer = angular.element('div#dataStore');
        $scope.endpoint = {};
        $scope.endpoint.masterId = dataContainer.data('master-id');
        $scope.endpoint.objectPrefix = dataContainer.data('object-prefix');
        $scope.endpoint.objectName = dataContainer.data('object-name');
        $scope.endpoint.objectIds = dataContainer.data('object-list').split(',');
        $scope.endpoint.groupId = dataContainer.data('group-id');
        $scope.endpoint.pairId = dataContainer.data('pair-id');
        $scope.endpoint.idSet = dataContainer.data('id-set');
        $scope.endpoint.jobId = dataContainer.data('job-id');
        $scope.endpoint.relatedTypeAhead = dataContainer.data('sf-typeahead');
        $scope.endpoint.returnUrl = dataContainer.data('url-return');
        $scope.endpoint.theme = dataContainer.data('sf-theme');
        $scope.endpoint.userName = dataContainer.data('user-name');
        $scope.endpoint.isModal = dataContainer.data('is-modal');
        $scope.endpoint.returnData = dataContainer.data('return-data');
        $scope.endpoint.lwcUrl = dataContainer.data('lwc-url');
        $scope.endpoint.dependentPicklist = dataContainer.data('sf-dependent-picklist');

        $scope.endpoint.setForMerge = dataContainer.data('sf-set-for-merge');
        $scope.endpoint.recordSetForMerge = dataContainer.data('sf-record-set-for-merge');
        $scope.endpoint.merge = dataContainer.data('sf-merge');
        $scope.endpoint.dcMergeUrl = dataContainer.data('merge-page-url');
        $scope.endpoint.endpointShareUrl = dataContainer.data('sf-share-url');

        $scope.data = {};
        $scope.data.objectIncludeList = {};
        $scope.data.referenceOptions = {};
        $scope.data.custom = {};
        $scope.data.selected = {};
        $scope.data.mergeFieldList = {};
        $scope.data.selected['masterRecord'] = $scope.endpoint.masterId;

        $scope.meta = {};
        $scope.meta.nextMerge = dataContainer.data('next-merge');
        $scope.meta.isLoading = false;
        $scope.meta.readOnly = false;
        $scope.meta.empty = false;
        $scope.meta.equal = false;
        $scope.meta.resultfield = false;
        $scope.meta.isMerging = false;
        $scope.meta.showMerge = false;
        $scope.meta.helpUrl = dc3Translate('URL_SUPPORT_USAGE_DC_MERGE', 'https://support.duplicatecheck.com');
        $scope.meta.referenceDisplay = {};
        $scope.meta.cookieDefaults = {};
        $scope.meta.dependentPicklist = {};
        $scope.meta.dependentPicklistLoading = {};
        var now = new Date();
        $scope.meta.cookieDefaults.expires = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        //'Field' field. checkbox tick all
        angular.forEach($scope.endpoint.objectIds, function (value, key) {
          $scope.data.objectIncludeList[value] = true;
        });

        if (empty($scope.endpoint.groupId)) {
          $scope.endpoint.groupId = null;
        }

        var cookieEmpty = $cookies.get('dc3MergeEmpty');
        if (!empty(cookieEmpty)) {
          $scope.meta.empty = cookieEmpty == 'true';
        }

        var cookieEqual = $cookies.get('dc3MergeEqual');
        if (!empty(cookieEqual)) {
          $scope.meta.equal = cookieEqual == 'true';
        }

        var cookieReadonly = $cookies.get('dc3MergeReadonly');
        if (!empty(cookieReadonly)) {
          $scope.meta.readOnly = cookieReadonly == 'true';
        }

        var cookieResultfield = $cookies.get('dc3MergeResultField');
        if (!empty(cookieResultfield)) {
          $scope.meta.resultfield = cookieResultfield == 'true';
        }

        angular.element(document).ready(function () {
          if (empty($('#scrollableDiv'))) {
            $scope.meta.scrollableDiv = $('#scrollableDiv').offset().top;
            $scope.meta.viewportHeight =
              ($(document).height() - $scope.meta.scrollableDiv - $('#scrollableDiv').height()).toString() + 'px';
            $scope.meta.sfVersion = isSalesforce1();
          }
        });
      };

      $scope.setMergeData = function (field, data) {
        $scope.data.mergeFieldList[field] = JSON.parse(b64_to_utf8(data));
      };

      $scope.openRecord = function (record) {
        if ($scope.endpoint.isModal) {
          window.open('/' + record, '_blank');
        } else {
          dcNavigateRecordNew(record);
        }
      };

      $scope.openShareModal = function () {
        var getter = remoting.quadServiceEscape(
          $scope.endpoint.endpointShareUrl,
          $scope.endpoint.groupId,
          $scope.endpoint.pairId,
          $scope.endpoint.idSet,
          $scope.endpoint.theme
        );
        getter.then(
          function (result) {
            window.openShareModal(
              result.value,
              dc3Translate('SHARE_SUBJECT_MERGE', 'Deduplicate Merge review'),
              dc3TemplateReplace(
                dc3Translate(
                  'SHARE_BODY_MERGE',
                  'Hi There, \n\nPlease review the merge via the following link.\n\nThanks,\n{{userName}}'
                ),
                { userName: $scope.endpoint.userName }
              )
            );
          },
          function (reason) {}
        );
      };

      $scope.clickInclude = function (record) {
        $scope.meta.showMerge = true;

        if ($scope.data.selected['masterRecord'] == record) {
          alert(
            dc3Translate(
              'CANNOT_EXCLUDE_MASTER_RECORD_SELECT_DIFFERENT_MASTER_RECORD_FIRST',
              'You cannot exclude the master record from the Merge. Please select a different master record first.'
            )
          );
          $scope.data.objectIncludeList[record] = true;
          $scope.meta.showMerge = false;
          return;
        } else {
          var counter = 0;
          angular.forEach($scope.data.objectIncludeList, function (value, key) {
            if (value) {
              counter = counter + 1;
            }
          });

          if (counter < 2) {
            alert(
              dc3Translate(
                'YOU_NEED_TO_SELECT_AT_LEAST_TWO_RECORDS_TO_MERGE',
                'You need to select at least two records to merge.'
              )
            );
            //prevent double $digest/$apply triggering
            $scope.data.objectIncludeList[record] = true;
          }
          $scope.meta.showMerge = false;
        }

        angular.forEach($scope.data.mergeFieldList, function (value, key) {
          if ($scope.data.selected[key] == record) {
            $scope.data.selected[key] = $scope.data.selected['masterRecord'];
            $scope.selectField(key, $scope.data.mergeFieldList[key].fieldType);
          }
        });
      };

      $scope.selectMaster = function (master) {
        $scope.data.selected['masterRecord'] = master;
        $scope.data.objectIncludeList[master] = true;
        angular.forEach($scope.data.mergeFieldList, function (value, key) {
          if (value.isReadonly) {
            $scope.data.selected[key] = master;
          }
        });
      };

      $scope.selectAllFields = function (record) {
        angular.forEach($scope.data.mergeFieldList, function (value, key) {
          $scope.data.selected[key] = record;
        });

        angular.forEach($scope.data.mergeFieldList, function (v, k) {
          $scope.selectField(k, $scope.data.mergeFieldList[k].fieldType);
        });
      };

      $scope.selectCustom = function (fieldName) {
        $scope.data.selected[fieldName] = 'custom';
      };

      $scope.getLookup = function (relatedObject, searchText, field, optionalFields) {
        angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

        var getter = remoting.tripleServiceBuffer(
          $scope.endpoint.relatedTypeAhead,
          relatedObject,
          searchText,
          optionalFields
        );
        getter.then(
          function (result) {
            $scope.data.referenceOptions[field] = result;
          },
          function (reason) {
            alert(reason);
          }
        );
      };

      $scope.fetchDependentPickList = function (controller, field) {
        console.log('fetching dependent for : ' + field);
        $scope.meta.dependentPicklist[field] = {};
        $scope.meta.dependentPicklistLoading[field] = true;

        var getter = remoting.tripleServiceBuffer(
          $scope.endpoint.dependentPicklist,
          $scope.endpoint.objectName,
          controller,
          field
        );
        getter.then(
          function (result) {
            $scope.meta.dependentPicklist[field] = result;
            $scope.meta.dependentPicklistLoading[field] = false;
          },
          function (reason) {
            alert(reason);
            $scope.meta.dependentPicklistLoading[field] = false;
          }
        );
      };

      $scope.selectField = function (fieldName, fieldType) {
        if (
          !angular.isDefined($scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]]) ||
          !angular.isDefined(
            $scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]].value
          ) ||
          $scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]].value.length == 0
        ) {
          $scope.data.custom[fieldName] = undefined;
          return;
        }

        if (fieldType == 'INTEGER' || fieldType == 'CURRENCY' || fieldType == 'DOUBLE' || fieldType == 'PERCENT') {
          $scope.data.custom[fieldName] = parseFloat(
            $scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]].value,
            10
          );
        } else if (fieldType == 'DATE' || fieldType == 'DATETIME' || fieldType == 'TIME') {
          $scope.data.custom[fieldName] = moment(
            $scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]].value
          ).toDate();
        } else if (fieldType == 'MULTIPICKLIST') {
          var v = $scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]].value;
          $scope.data.custom[fieldName] = v.split(';');
        } else if (fieldType == 'REFERENCE') {
          $scope.data.custom[fieldName] =
            $scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]].value;
          $scope.data.custom[fieldName + '.value'] =
            $scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]].label;
        } else if (fieldType == 'BOOLEAN') {
          $scope.data.custom[fieldName] = stringToBoolean(
            $scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]].value
          );
        } else {
          $scope.data.custom[fieldName] =
            $scope.data.mergeFieldList[fieldName].recordValues[$scope.data.selected[fieldName]].value;
        }
      };

      $scope.openMergeCheck = function (url, method) {
        var finalUrl = url;

        //future to do: implement regex to catch any page preceding a question mark
        if ($location.absUrl().indexOf('dc3Merge?')) {
          finalUrl = url + '&' + $location.absUrl().split('dc3Merge?', 2)[1];
        }

        if ($scope.endpoint.isModal) {
          window.open(finalUrl, '_blank');
        } else if (angular.equals(method, 'EXIST')) {
          dcNavigateTop(finalUrl);
        } else {
          dcNavigateNew(finalUrl);
        }
      };

      $scope.doCancel = function () {
        if (!empty($scope.endpoint.returnUrl) && $scope.endpoint.returnUrl.length > 5) {
          $scope.doFinalReturn($scope.endpoint.returnUrl, false, false);
        } else {
          $scope.doFinalReturn('/' + $scope.endpoint.objectPrefix, false, false);
        }
      };

      $scope.doCancelSet = function () {
        if (!empty($scope.endpoint.returnUrl) && $scope.endpoint.returnUrl.length > 5) {
          $scope.doFinalReturn($scope.endpoint.returnUrl, false, true);
        } else {
          $scope.doFinalReturn('/' + $scope.endpoint.objectPrefix, false, true);
        }
      };

      $scope.doReturn = function (id) {
        var ret = $scope.endpoint.returnUrl;
        if (/^\/([a-zA-Z0-9]{18}|[a-zA-Z0-9]{15})$/.test(ret)) {
          ret = undefined;
        }

        if (!empty(ret) && ret.length > 5) {
          dcNavigate($scope.endpoint.returnUrl, '');
        } else if (!empty(id)) {
          dcNavigateRecord(id);
        }
      };

      $scope.toggleShow = function (button) {
        button = button.toLowerCase();
        if (button === 'readonly') {
          $scope.meta.readOnly = !$scope.meta.readOnly;
          $cookies.put('dc3MergeReadonly', $scope.meta.readOnly, { expires: $scope.meta.cookieDefaults.expires });
        } else if (button === 'empty') {
          $scope.meta.empty = !$scope.meta.empty;
          $cookies.put('dc3MergeEmpty', $scope.meta.empty, { expires: $scope.meta.cookieDefaults.expires });
        } else if (button === 'resultfield') {
          $scope.meta.resultfield = !$scope.meta.resultfield;
          $cookies.put('dc3MergeResultField', $scope.meta.resultfield, { expires: $scope.meta.cookieDefaults.expires });
        } else {
          $scope.meta.equal = !$scope.meta.equal;
          $cookies.put('dc3MergeEqual', $scope.meta.equal, { expires: $scope.meta.cookieDefaults.expires });
        }
      };

      $scope.showRow = function (empty, equal, readonly, resultfield) {
        if ($scope.meta.resultfield) {
          return resultfield;
        }

        if (!empty && !equal && !readonly) {
          return true;
        }
        if ($scope.meta.empty && empty) {
          return true;
        }
        if ($scope.meta.equal && equal) {
          return true;
        }
        if ($scope.meta.readOnly && readonly) {
          return true;
        }

        return false;
      };

      $scope.doRecordSetForMerge = function () {
        $scope.meta.isMerging = true;

        var getter = remoting.singleService($scope.endpoint.recordSetForMerge, $scope.endpoint.objectIds);
        getter.then(
          function (result) {
            if (result.value) {
              $scope.doCancelSet();
            }
          },
          function (reason) {
            alert(reason);
            $scope.meta.isMerging = false;
          }
        );
      };

      $scope.doSetForMerge = function (next) {
        $scope.meta.isMerging = true;
        var objectList = [];
        angular.forEach($scope.data.objectIncludeList, function (value, key) {
          if (value) {
            objectList.push(key);
          }
        });

        var master = $scope.data.selected['masterRecord'];
        var fieldSelect = {};
        angular.forEach($scope.data.selected, function (v, k) {
          if (k != 'masterRecord') {
            fieldSelect[k] = v;
          }
        });

        var getter = remoting.quadService(
          $scope.endpoint.setForMerge,
          objectList,
          master,
          fieldSelect,
          inputArrayToJson($scope.data.custom)
        );
        getter.then(
          function (result) {
            $scope.doFinalReturn(result.value, next, true);
          },
          function (reason) {
            alert(reason);
            $scope.meta.isMerging = false;
          }
        );
      };

      $scope.doMerge = function (next) {
        $scope.meta.isMerging = true;

        var objectList = [];
        angular.forEach($scope.data.objectIncludeList, function (value, key) {
          if (value) {
            objectList.push(key);
          }
        });

        var master = $scope.data.selected['masterRecord'];
        var fieldSelect = {};
        angular.forEach($scope.data.selected, function (v, k) {
          if (k != 'masterRecord') {
            fieldSelect[k] = v;
          }
        });

        //var customValues = $scope.data.custom;

        var getter = remoting.quadService(
          $scope.endpoint.merge,
          objectList,
          master,
          fieldSelect,
          inputArrayToJson($scope.data.custom)
        );
        getter.then(
          function (result) {
            $scope.doFinalReturn(result.value, next, false);
          },
          function (reason) {
            alert(reason);
            $scope.meta.isMerging = false;
          }
        );
      };

      $scope.nextMergeGroup = function (returnValue) {
        //replace current groupId with the next in the array. if array ends, start from the beginning
        //if array is empty refer to the batch detail
        var ls = localStorageService.get('dcBatchDetail.next.merge')[$scope.endpoint.jobId];
        var index = ls.indexOf($scope.endpoint.groupId);
        var next = ls[index + 1];

        if (angular.isUndefined(next)) {
          return undefined;
        }

        ls.splice(index, 1);
        var lsObject = {};
        lsObject[$scope.endpoint.jobId] = ls;
        localStorageService.set('dcBatchDetail.next.merge', lsObject);
        return next;
      };

      $scope.doNextMergeGroup = function (retValue) {
        var next = $scope.nextMergeGroup();
        if (angular.isUndefined(next)) {
          $scope.doFinalReturn(returnValue, false, false);
        } else {
          dcNavigate($scope.endpoint.dcMergeUrl + window.location.search.replace($scope.endpoint.groupId, next));
        }
      };

      $scope.doFinalReturn = function (retValue, next, setformerge) {
        if ($scope.endpoint.isModal) {
          if (next && setformerge) {
            $scope.doModalReturnTotal(retValue, 'MERGE_OK_SET_NEXT');
          } else if (next) {
            $scope.doModalReturnNext(retValue);
          } else if (setformerge) {
            $scope.doModalReturnTotal(retValue, 'MERGE_OK_SET');
          } else {
            $scope.doModalReturn(retValue);
          }
        } else if (next) {
          $scope.doNextMergeGroup(retValue);
        } else {
          $scope.doReturn(retValue);
        }
      };

      $scope.doModalReturnNext = function (masterId) {
        $scope.doModalReturnTotal(masterId, 'MERGE_OK_NEXT');
      };

      $scope.doModalReturn = function (masterId) {
        $scope.doModalReturnTotal(masterId, 'MERGE_OK');
      };

      $scope.doModalReturnTotal = function (masterId, message) {
        var m = {
          name: 'dupcheck__dc3Merge',
          payload: {
            status: message,
            recordId: masterId
          }
        };

        if ($scope.endpoint.returnData) {
          console.log($scope.endpoint.returnData);
          m.payload.returnData = $scope.endpoint.returnData;
        }

        parent.postMessage(JSON.stringify(m), '*');
      };

      $scope.resetPage = function () {
        //$scope.doModalReturn('00Q0q000002QozR');
        $window.location.reload();
      };

      $scope.init();
    }
  );

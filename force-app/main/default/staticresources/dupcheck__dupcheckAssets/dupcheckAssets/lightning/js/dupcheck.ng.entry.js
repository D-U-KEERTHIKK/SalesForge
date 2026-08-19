angular
  .module('dcApp', [
    'dcApp.services',
    'dcApp.controllers',
    'dcApp.config',
    'ngSanitize',
    'dcApp.directives',
    'plauti-ng-slds',
    'LocalStorageModule'
  ])

  .filter('orderObjectBy', function () {
    return function (items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function (item) {
        filtered.push(item);
      });
      filtered.sort(function (a, b) {
        return a[field] > b[field] ? 1 : -1;
      });
      if (reverse) filtered.reverse();
      return filtered;
    };
  });

angular.module('dcApp.config', ['LocalStorageModule']).config(function (localStorageServiceProvider) {
  localStorageServiceProvider.setPrefix('dcEntry');
});

angular
  .module('dcApp.controllers', [])
  .controller('entryController', function ($scope, remoting) {
    var dataContainer = angular.element('div#dataContainer');

    $scope.meta = {};
    $scope.meta.objectPrefix = dataContainer.data('object');
    $scope.meta.objectName = dataContainer.data('object-name');
    $scope.meta.objectNameCorrect = dataContainer.data('object-name-correct');
    $scope.meta.entryStage = dataContainer.data('stage');
    $scope.meta.recordId = dataContainer.data('record-id');
    $scope.meta.recordTypeId = dataContainer.data('record-type');
    $scope.meta.inputData = dataContainer.data('input-data');
    $scope.meta.storageName = dataContainer.data('storage-name');
    $scope.meta.returnUrl = dataContainer.data('return-url');
    $scope.meta.isSaveAndNew = dataContainer.data('save-and-new');
    $scope.meta.isClone = dataContainer.data('is-clone');
    $scope.meta.currentPage = dataContainer.data('current-page');

    $scope.meta.pageLoad = true;

    $scope.endpoint = {};
    $scope.endpoint.layout = dataContainer.data('sf-layout');
    $scope.endpoint.objectList = dataContainer.data('sf-object-list');
    $scope.endpoint.recordTypeList = dataContainer.data('sf-record-type-list');
    $scope.endpoint.save = dataContainer.data('sf-save');
    $scope.endpoint.search = dataContainer.data('sf-search');
    $scope.endpoint.related = dataContainer.data('sf-related');
    $scope.endpoint.setDefaultCountry = dataContainer.data('sf-set-default-country');
    $scope.endpoint.dependentPick = dataContainer.data('sf-depended-picklist');

    $scope.layout = {};

    $scope.getRecordTypeList = function (callback) {
      var getter = remoting.singleService($scope.endpoint.recordTypeList, $scope.meta.objectPrefix);
      getter.then(
        function (remoteResult) {
          $scope.recordTypeList = remoteResult;
          var activeRTList = [];

          console.log($scope.recordTypeList);
          console.log($scope.recordTypeList.recordTypeList.length);

          angular.forEach($scope.recordTypeList.recordTypeList, function (v, k) {
            if (v.isActive && v.recordTypeId != '012000000000000AAA') {
              activeRTList.push(v);
            }
          });

          if (activeRTList.length == 0) {            
            $scope.meta.entryStage = 'entry';
          } else if (activeRTList.length == 1) {
            $scope.meta.recordTypeId = activeRTList[0].recordTypeId;
            $scope.meta.entryStage = 'entry';
            return;
          } else {
            $scope.meta.entryStage = 'recordTypeSelect';
            return;
          }
        },
        function (reason) {
          alert(reason);
        }
      );
    };

    $scope.scrollTo = function (elementId) {
      document.getElementById(elementId).scrollIntoView();
    };
  })
  .controller('objectController', function ($scope, remoting, $filter) {
    var getObjectList = function () {
      var getter = remoting.emptyService($scope.endpoint.objectList);
      getter.then(
        function (remoteResult) {
          $scope.objectList = remoteResult;
          //$scope.objectList.objectList = $filter('orderObjectBy')($scope.objectList.objectList, 'Label');
          $scope.objectList.ConfiguredObjects = $filter('orderObjectBy')(
            $scope.objectList.ConfiguredObjects,
            'objectLabel'
          );
          $scope.meta.pageLoad = false;
        },
        function (reason) {
          alert(reason);
          $scope.meta.pageLoad = false;
        }
      );
    };
    getObjectList();

    $scope.selectObject = function (index) {
      $scope.meta.pageLoad = true;
      $scope.meta.objectPrefix = $scope.objectList.ConfiguredObjects[index].objectPrefix;
      $scope.meta.objectName = $scope.objectList.ConfiguredObjects[index].objectName;
      $scope.meta.objectNameCorrect = $scope.objectList.ConfiguredObjects[index].objectNameCorrect;

      if (
        $scope.objectList.objectList[$scope.meta.objectPrefix] &&
        $scope.objectList.objectList[$scope.meta.objectPrefix].isRecordType
      ) {
        $scope.getRecordTypeList();
        $scope.meta.pageLoad = false;
      } else {
        $scope.meta.entryStage = 'entry';
        $scope.meta.pageLoad = false;
      }
    };
  })
  .controller('recordTypeController', function ($scope, remoting) {
    $scope.meta.pageLoad = true;

    $scope.selectRecordType = function (recordTypeId) {
      $scope.meta.pageLoad = true;
      $scope.meta.recordTypeId = recordTypeId;
      $scope.meta.entryStage = 'entry';
    };

    if (!angular.isDefined($scope.recordTypeList) || !angular.isDefined($scope.recordTypeList.recordTypeList)) {
      $scope.getRecordTypeList();
      $scope.meta.pageLoad = false;
    } else {
      $scope.meta.pageLoad = false;
    }
  })
  .controller(
    'inputController',
    function ($scope, $window, $timeout, $parse, $location, remoting, localStorageService) {
      $scope.meta.isSaving = false;
      $scope.meta.isSearching = false;
      $scope.meta.pageLoad = true;
      $scope.dependentPick = {};
      $scope.searchResult = {};
      $scope.lookupData = {};
      $scope.referenceData = {};

      try {
        $scope.meta.cancelReturnUrl = $location
          .absUrl()
          .match(/cancelReturnUrl=[^(&|\s)]*/g)[0]
          .substring(16);
      } catch (exception) {
        //No customReturnUrl found
      }

      if (empty($scope.meta.recordTypeId)) {
        $scope.meta.recordTypeId = '012000000000000AAA';
      }

      $scope.getLookup = function (objectList, needle, field, optionalFields) {
        var options = [];

        angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

        if (needle && needle.length > 1) {
          var k;
          var v;

          $window.Visualforce.remoting.esape = false;
          var getter = remoting.tripleService($scope.endpoint.related, objectList, needle, optionalFields);
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

      $scope.dependantUpdate = function (fieldName) {
        if (angular.isDefined($scope.data.dependantMap) && angular.isDefined($scope.data.dependantMap[fieldName])) {
          var fieldData = $scope.data.objectData[fieldName];
          angular.forEach($scope.data.dependantMap[fieldName], function (v, k) {
            delete $scope.dependentPick[v];
            var pickValue = $scope.data.objectData[v];
            $scope.data.objectData[v] = null;

            if (!empty(fieldData)) {
              var pickList = remoting.tripleServiceEscape(
                $scope.endpoint.dependentPick,
                $scope.data.objectMeta.Name,
                fieldName,
                v
              );
              pickList.then(
                function (remoteResult) {
                  if (angular.isDefined(remoteResult[fieldData]) && Object.keys(remoteResult[fieldData]).length > 0) {
                    $scope.dependentPick[v] = remoteResult[fieldData];
                  }

                  if (!empty(pickValue) && pickValue in $scope.dependentPick[v]) {
                    $scope.data.objectData[v] = pickValue;
                  }

                  if ($scope.data.fieldMeta[v].Type == 'PICKLIST' || $scope.data.fieldMeta[v].Type == 'MULTIPICKLIST') {
                    $scope.dependantUpdate(v);
                  }
                },
                function (reason) {}
              );
            } else {
              if ($scope.data.fieldMeta[v].Type == 'PICKLIST' || $scope.data.fieldMeta[v].Type == 'MULTIPICKLIST') {
                $scope.dependantUpdate(v);
              }
            }
          });
        }
      };

      $scope.fieldChange = function (fieldName) {
        $scope.dependantUpdate(fieldName);

        if ($scope.data.searchFields.indexOf(fieldName) >= 0) {
          $scope.search();
        }
      };

      $scope.search = function () {
        $scope.meta.isSearching = true;

        var inputData = {};
        angular.forEach($scope.data.objectData, function (v, k) {
          if (angular.isUndefined($scope.data.objectData[k])) {
            inputData[k] = null;
          } else if (Array.isArray($scope.data.objectData[k])) {
            inputData[k] = JSON.stringify($scope.data.objectData[k]);
          } else {
            inputData[k] = $scope.data.objectData[k];
          }
        });

        var getter = remoting.quadService(
          $scope.endpoint.search,
          $scope.meta.objectPrefix,
          $scope.meta.recordTypeId,
          $scope.meta.recordId,
          inputData
        );
        getter.then(
          function (remoteResult) {
            $scope.searchResult = remoteResult;
            $scope.meta.isSearching = false;
          },
          function (reason) {
            alert(reason);
            $scope.meta.isSearching = false;
          }
        );
      };

      $scope.cancel = function () {
        if (angular.isDefined($scope.meta.cancelReturnUrl)) {
          dcNavigate($scope.meta.cancelReturnUrl);
        } else if (empty($scope.meta.returnUrl)) {
          dcNavigate('/' + $scope.meta.objectPrefix);
        } else {
          dcNavigate($scope.meta.returnUrl);
        }
      };

      $scope.save = function (createNew) {
        $scope.meta.isSaving = true;

        var inputData = {};
        angular.forEach($scope.data.objectData, function (v, k) {
          if (angular.isUndefined($scope.data.objectData[k])) {
            inputData[k] = null;
          } else if (Array.isArray($scope.data.objectData[k])) {
            inputData[k] = JSON.stringify($scope.data.objectData[k]);
          } else {
            inputData[k] = $scope.data.objectData[k];
          }
        });

        var setter = remoting.sixServiceLong(
          $scope.endpoint.save,
          $scope.meta.objectPrefix,
          $scope.meta.objectName,
          $scope.meta.recordTypeId,
          $scope.meta.recordId,
          $scope.meta.isClone,
          inputData
        );
        setter.then(
          function (remoteResult) {
            if (createNew) {
              dcNavigate(
                $scope.meta.currentPage +
                  '?object=' +
                  $scope.meta.objectPrefix +
                  '&save_new=' +
                  ($scope.meta.isSaveAndNew ? '1' : '0'),
                ''
              );
            } else {
              dcNavigateRecord(remoteResult);
            }
          },
          function (reason) {
            alert(reason);
            $scope.meta.isSaving = false;
          }
        );
      };

      $scope.openHelp = function () {
        dcNavigateNew(
          dc3Translate('URL_SUPPORT_USAGE_DC_ENTRY', 'https://support.duplicatecheck.com') +
            '?utm_source=dcApp&utm_medium=app&utm_campaign=help_link',
          ''
        );
      };

      var builtLayout = function (layout) {
        $scope.meta.pageLoad = true;

        $scope.layout.recordTypeMap = {};

        if (angular.isArray(layout.recordTypeMappings)) {
          angular.forEach(layout.recordTypeMappings, function (v, k) {
            var rt = v;
            rt.pickList = {};
            angular.forEach(v.picklistsForRecordType, function (p, i) {
              if (angular.isArray(p.picklistValues)) {
                rt.pickList[p.picklistName] = p.picklistValues;
              } else {
                rt.pickList[p.picklistName] = [];
                rt.pickList[p.picklistName].push(p.picklistValues);
              }
            });
            rt.picklistsForRecordType = undefined;
            $scope.layout.recordTypeMap[v.recordTypeId] = rt;
          });
        } else if (!empty(layout.recordTypeMappings)) {
          var rt = layout.recordTypeMappings;
          rt.pickList = {};
          angular.forEach(rt.picklistsForRecordType, function (p, i) {
            if (angular.isArray(p.picklistValues)) {
              rt.pickList[p.picklistName] = p.picklistValues;
            } else {
              rt.pickList[p.picklistName] = [];
              rt.pickList[p.picklistName].push(p.picklistValues);
            }
          });
          rt.picklistsForRecordType = undefined;
          $scope.layout.recordTypeMap[layout.recordTypeMappings.recordTypeId] = rt;
        }

        $scope.layout.view = {};
        if (angular.isArray(layout.layouts)) {
          angular.forEach(layout.layouts, function (v, k) {
            var layoutId = v.id;
            $scope.layout.view[v.id] = v.editLayoutSections;
          });
        } else {
          $scope.layout.view[layout.layouts.id] = layout.layouts.editLayoutSections;
        }

        if (angular.isDefined($scope.data.dependantMap)) {
          angular.forEach($scope.data.dependantMap, function (v, k) {
            $scope.dependantUpdate(k);
          });
        }
        $scope.meta.pageLoad = false;
      };

      var getLayout = function () {
        $scope.meta.pageLoad = true;
        Visualforce.remoting.esape = false;
        var getter = remoting.quadServiceEscape(
          $scope.endpoint.layout,
          $scope.meta.objectPrefix,
          $scope.meta.recordTypeId,
          $scope.meta.recordId,
          $scope.meta.inputData ? $scope.meta.inputData : ''
        );
        getter.then(
          function (remoteResult) {
            $scope.data = remoteResult;
            // CONVERT DATE STRING TO JS DATE OBJECT
            angular.forEach($scope.data.fieldMeta, function (fieldData, fieldName) {
              if (!empty($scope.data.objectData[fieldName])) {
                if (fieldData.Type == 'DATE') {
                  const d = $scope.data.objectData[fieldName];
                  let output = new Date();
                  output.setFullYear(Number(d.substring(0, 4)));
                  output.setMonth(Number(d.substring(5, 7)) - 1, Number(d.substring(8, 10)));
                  $scope.data.objectData[fieldName] = output;
                } else if (fieldData.Type == 'DATETIME') {
                  var momentDate = moment.tz($scope.data.objectData[fieldName], userTimeZone);
                  $scope.data.objectData[fieldName] = momentDate.toDate();
                } else if (fieldData.Type == 'MULTIPICKLIST') {
                  $scope.data.objectData[fieldName] = $scope.data.objectData[fieldName].split(';');
                }
              }
            });

            var storageName = 'dc3layout_' + $scope.meta.objectPrefix + '_' + $scope.meta.recordTypeId;

            var savedLayout = localStorageService.get(storageName);
            //var savedLayout;
            var now = moment();

            if (
              empty(savedLayout) ||
              empty(savedLayout.saveDataTime) ||
              now.diff(moment(savedLayout.saveDataTime), 'days') > 0 ||
              sforce.connection.sessionId != savedLayout.sessionId ||
              savedLayout.storageKey !== $scope.meta.storageName
            ) {
              localStorageService.remove(storageName);
              // FETCH & BUILT LAYOUT
              sforce.connection.describeLayout($scope.meta.objectNameCorrect, '', '', function (layout) {
                $scope.$apply(function () {
                  savedLayout = {};
                  savedLayout.storageKey = $scope.meta.storageName;
                  savedLayout.sessionId = sforce.connection.sessionId;
                  savedLayout.saveDataTime = new Date();
                  savedLayout.layout = layout;

                  localStorageService.set(storageName, savedLayout);
                  builtLayout(layout);
                });
              });
            } else {
              // BUILT LAYOUT FROM LOCAL STORAGE
              builtLayout(savedLayout.layout);
            }
          },
          function (reason) {
            alert(reason);
            $scope.meta.pageLoad = false;
          }
        );
      };
      getLayout();
    }
  );

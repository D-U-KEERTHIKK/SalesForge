angular
  .module('dcApp.directives', [])
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
  .filter('trustAsUrl', [
    '$sce',
    function ($sce) {
      return function (val) {
        return $sce.trustAsUrl(val);
      };
    }
  ])
  .filter('trustAsResourceUrl', [
    '$sce',
    function ($sce) {
      return function (val) {
        return $sce.trustAsResourceUrl(val);
      };
    }
  ])
  .directive('plautiButtonTooltip', function () {
    return {
      restrict: 'A',
      replace: 'true',
      scope: {
        buttonText: '=',
        iconName: '=',
        tooltipText: '=',
        slds: '@'
      },
      link: function ($scope, element, attrs) {},
      controller: function ($scope, $window, $document) {
        $scope.meta = {};
        $scope.meta.filterLoading = true;
        $scope.meta.sldsUrl = $scope.slds;

        $scope.mouseOut = function (event) {
          $scope.show = false;
        };

        $scope.mouseOver = function (event) {
          $scope.top = -90 + 'px';
          $scope.left = event.offsetY / 2 + 'px';
          $scope.show = true;
          $scope.$broadcast('plauti-popover-open', { top: $scope.top, left: $scope.left });
          $window.dispatchEvent(
            new CustomEvent('plauti-popover-open', { detail: { left: $scope.left, top: $scope.top } })
          );
        };

        $window.addEventListener('plauti-popover-open', function (evt) {
          if (evt.detail.top != $scope.top || evt.detail.left != $scope.left) {
            $scope.show = false;
          }
        });

        $scope.$on('plauti-popover-open', function (evt, args) {
          if (args.top != $scope.top || args.left != $scope.left) {
            $scope.show = false;
          }
        });

        $document.on('scroll', function () {
          $scope.$apply(function () {
            $scope.show = false;
          });
        });

        $document.on('click', function (event) {
          var ztop = -90 + 'px';
          var zleft = event.offsetY / 2 + 'px';

          if (ztop == $scope.top && zleft == $scope.left) {
            return;
          }

          $scope.$apply(function () {
            $scope.show = false;
          });
        });
      },
      templateUrl: function (elem, attrs) {
        return attrs.templateUrl + '/lightning/html/plauti-button-tooltip.html';
      }
    };
  })
  .directive('plautiFilterSection', function () {
    return {
      restrict: 'A',
      replace: 'true',
      scope: {
        filterList: '=',
        filterLogic: '=',
        filterValid: '=',
        objectPrefix: '=',
        slds: '@',
        getFields: '&',
        getLookup: '&',
        uniqueId: '@'
      },
      link: function ($scope, element, attrs) {
        $scope.$on('$destroy', function () {
          $scope.filterList = [];
          $scope.filterLogic = '';
          $scope.filterValid = true;
          $scope.meta.filterLogicDisplay = '';
        });
      },
      controller: function ($scope, $window, $sce) {
        $scope.meta = {};
        $scope.meta.filterLoading = true;
        $scope.meta.sldsUrl = $scope.slds;
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
        $scope.filterValid = true;
        $scope.meta.filterLogicDisplay = '';
        $scope.filterList = [];
        $scope.filterLogic = '';
        $scope.filterValid = true;
        $scope.meta.filterLogicDisplay = '';
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

        $scope.getLookupFn = function (objectItem, searchText, fields) {
          if (objectItem == 'RecordType') {
            objectItem = 'RecordType.' + $scope.objectPrefix;
          }

          $scope.getLookup({
            relatedObject: objectItem,
            searchText: searchText,
            optionalFields: fields,
            callback: function (res) {
              console.log(res);
              $scope.meta.referenceOptions = res;
            },
            callbackError: function (err) {
              alert(err);
            }
          });
        };

        $scope.translate = function (LABEL, ALT) {
          return $window.dc3Translate(LABEL, ALT);
        };

        $scope.addFilter = function () {
          var filter = {};
          filter.fieldType = 'ID';
          filter.fieldLength = 18;
          filter.selectList = [];
          filter.fieldValue = undefined;
          filter.fieldName = 'Id';
          filter.expression = '=';
          filter.position = $scope.filterList.length == 0 ? 1 : $scope.filterList.length + 1;
          $scope.filterList.push(filter);
          $scope.checkLogic();
        };

        $scope.deleteFilter = function (index) {
          $scope.filterList.splice(index, 1);

          angular.forEach($scope.filterList, function (v, k) {
            v.position = k + 1;
          });

          if ($scope.filterList.length == 0) {
            $scope.filterLogic = '';
          }

          $scope.checkLogic();
        };

        $scope.fieldSelect = function (index) {
          var filter = $scope.filterList[index];

          filter.fieldValue = undefined;
          if (filter.fieldName != 'custom') {
            var fieldMeta = $scope.meta.fieldMap[filter.fieldName];
            filter.fieldType = fieldMeta.Type;
            filter.fieldLength = fieldMeta.Length != 0 ? fieldMeta.Length : 200;
          } else {
            filter.fieldType = 'custom';
            filter.fieldExpression = 'custom';
          }

          if (filter.fieldType == 'PICKLIST' || filter.fieldType == 'MULTIPICKLIST') {
            filter.selectList = fieldMeta.selectList;
          }

          if (filter.fieldType == 'REFERENCE') {
            filter.referenceTo = fieldMeta.RelatedObjectMeta;
          }

          filter.expression = '=';
          $scope.filterList[index] = filter;
        };

        $scope.checkLogic = function () {
          if (empty($scope.filterLogic) && empty($scope.meta.filterLogicDisplay)) {
            $scope.filterValid = true;
            return true;
          }

          var value = $scope.meta.filterLogicDisplay;

          var matches = value.match(/((^\()|(^\d+))((\sOR\s(?!\))|\sAND\s(?!\))|\d+|\((?!\))|\)(?!\())+)?/gi);
          var length = 0;
          angular.forEach(matches, function (v, k) {
            length += v.length;
          });

          var bracketOpen = value.match(/\(/g);
          var bracketClose = value.match(/\)/g);
          var bracketValid = true;

          if ((bracketOpen != null && bracketClose == null) || (bracketOpen == null && bracketClose != null)) {
            bracketValid = false;
          } else if (bracketOpen != null && bracketClose != null && bracketOpen.length != bracketClose.length) {
            bracketValid = false;
          }

          if (length != value.length || !bracketValid) {
            $scope.filterValid = false;
            $scope.filterLogic = '';
            return false;
          }

          var filterNumbers = value.match(/(\d+)+/g);

          var contentValid = true;
          var highestNumber = 0;
          angular.forEach(filterNumbers, function (v, k) {
            if (Number(v) > highestNumber) highestNumber = Number(v);
          });

          if (highestNumber != $scope.filterList.length) {
            contentValid = false;
          }

          $scope.filterValid = contentValid;
          if ($scope.filterValid) {
            $scope.filterLogic = value.replace(/(\d+)/g, '[plauti$1]');
          }
          return contentValid;
        };

        $scope.init = function () {
          $scope.getFields({
            prefix: $scope.objectPrefix,
            callback: function (result) {
              $scope.meta.fieldMap = result.value;
              $scope.meta.fieldList = [];
              angular.forEach(result.value, function (v, k) {
                $scope.meta.fieldList.push(v);
              });
              $scope.meta.filterLoading = false;

              if ($scope.filterList.length == 0) {
                $scope.addFilter();
              }
            },
            callbackError: function (error) {
              $scope.meta.filterLoading = false;
              alert(reason);
            }
          });
        };
        $scope.init();
      },
      templateUrl: function (elem, attrs) {
        return attrs.templateUrl + '/lightning/html/plauti-filter-section.html';
      }
    };
  })
  .directive('plautiDuplicateResult', function () {
    return {
      restrict: 'A',
      replace: 'true',
      scope: {
        duplicateData: '=',
        basePrefix: '@',
        alertStyle: '@',
        checkBox: '@',
        maxResults: '@',
        mergeUrl: '@',
        convertUrl: '@',
        resultType: '@',
        openTarget: '@',
        licenseConvert: '@',
        objectId: '@', //meegeven voor de sldsCheck. nodig voor convert.
        buttonRowSelect: '&?',
        searching: '=',
        searchText: '@',
        resource: '@',
        noScenario: '=?',
        componentName: '@?',
        currentPage: '@?'
      },

      link: function ($scope, element, attrs) {
        $scope.$watch(
          'duplicateData',
          function (value) {
            if (angular.isUndefined($scope.maxResults)) {
              angular.forEach($scope.duplicateData.searchResult, function (v, k) {
                $scope.prefixTotalResults[k] = v.length;
              });
            } else {
              angular.forEach($scope.duplicateData.searchResult, function (v, k) {
                $scope.prefixTotalResults[k] = $scope.maxResults;
              });
            }

            angular.forEach($scope.duplicateData.searchResult, function (v, k) {
              $scope.listSelect[k] = {};
              $scope.listMaster[k] = false;
              angular.forEach(v, function (vv, kk) {
                $scope.listSelect[k][vv.objectData.Id] = false;
              });
            });

            $scope.returnVar = {};

            $scope.activeTab = $scope.basePrefix;
            angular.forEach($scope.duplicateData.searchResult, function (data, key) {
              // if (data.length > 0) {
              // $scope.returnVar[key] = data;  //filtert alle tabjes zonder resultaten uit de table
              // }
              $scope.returnVar[key] = data;
              if (empty($scope.activeTab)) {
                $scope.activeTab = key;
              }
            });

            var continueLoop = true;
            if (angular.isUndefined($scope.returnVar[$scope.basePrefix])) {
              angular.forEach($scope.returnVar, function (v, k) {
                if (continueLoop) {
                  $scope.activeTab = k;
                  continueLoop = false;
                }
              });
            }

            if (!angular.isUndefined($scope.objectId)) {
              //waarom niet meteen de baseprefix gebruiken?
              if ($scope.basePrefix == '001P') {
                $scope.objectIdPrefix = $scope.basePrefix;
              } else {
                $scope.objectIdPrefix = $scope.objectId.substring(0, 3);
              }
            }

            $scope.rowButton = false;
            if ($scope.buttonRowSelect === undefined) {
              $scope.rowButton = 'true';
            }

            if (
              Object.keys($scope.duplicateData.searchResult).length == 1 &&
              $scope.returnVar[$scope.activeTab].length < 1 &&
              !$scope.checkBoxEnabled()
            ) {
              $scope.style = { 'padding-top': '28px' };
            }
          },
          true
        );
      },

      controller: function ($scope, $window) {
        $scope.init = function () {
          $scope.trans = {};
          $scope.trans.merge = dc3Translate('MERGE', 'Merge');
          $scope.trans.noDuplicateFound = dc3Translate('NO_DUPLICATES_FOUND', 'No Duplicates Found');
          $scope.trans.noResultsFound = dc3Translate('NO_RESULTS_FOUND', 'No Results Found');
          $scope.trans.selectAll = dc3Translate('SELECT_ALL', 'Select all');
          $scope.trans.score = dc3Translate('SCORE', 'Score');
          $scope.trans.action = dc3Translate('ACTION', 'Action');
          $scope.trans.individualSelect = dc3Translate('INDIVIDUAL_SELECT', 'Individual Select');
          $scope.trans.open = dc3Translate('OPEN', 'Open');
          $scope.trans.convert = dc3Translate('CONVERT', 'Convert');
          $scope.trans.select = dc3Translate('SELECT', 'Select');
          $scope.trans.showMore = dc3Translate('SHOW_MORE', 'Show More');
          $scope.trans.noDuplicatesFound = dc3Translate('NO_DUPLICATES_FOUND', 'No Duplicates Found');
          $scope.tableWidth = 1000;
          $scope.activeTab = $scope.basePrefix;
          $scope.listSelect = {};
          $scope.listMaster = {};
          $scope.prefixTotalResults = {};
          $scope.elementStart = angular.element('#rvDuplicateResult')[0].getBoundingClientRect().left;
          $scope.elementEnd = angular.element('#rvDuplicateResult')[0].getBoundingClientRect().right;
          $scope.noScenarioLabel = dc3Translate('COMPONENT_NOT_CONFIGURED_NO_SCENARIO_APPLIED', 'No Scenario applied');

          if (angular.isUndefined($scope.noScenario)) {
            $scope.noScenario = false;
          }

          if (angular.isUndefined($scope.currentPage)) {
            $scope.currentPage = false;
          }

          $scope.clearSvg = $scope.resource + '/assets/icons/utility-sprite/svg/symbols.svg#clear';
          $scope.checkSvg = $scope.resource + '/assets/icons/utility-sprite/svg/symbols.svg#check';

          $scope.calcTableWidth();
        };

        $scope.calcTableWidth = function () {
          $scope.tableWidth = $scope.elementEnd - $scope.elementStart - 10;
          if (!isSalesforce1()) {
            $scope.tableWidth = $scope.elementEnd - $scope.elementStart - 20;
          }
        };

        angular.element($window).bind('resize', function () {
          $scope.calcTableWidth();
          $scope.$apply();
        });

        $scope.showMore = function () {
          return (
            $scope.duplicateData.searchResult[$scope.activeTab].length - $scope.prefixTotalResults[$scope.activeTab]
          );
        };

        $scope.limitResults = function (prefix) {
          $scope.prefixTotalResults[prefix] = $scope.duplicateData.searchResult[prefix].length;
          $scope.maxResults = $scope.prefixTotalResults[prefix];
        };

        $scope.determineResultType = function (count) {
          if ($scope.resultType == 'Duplicate') {
            if (count > 1) {
              return dc3Translate('DUPLICATES', 'Duplicates');
            } else {
              return dc3Translate('DUPLICATE', 'Duplicate');
            }
          } else {
            if (count > 1) {
              return dc3Translate('RESULTS', 'Results');
            } else {
              return dc3Translate('RESULT', 'Result');
            }
          }
        };

        $scope.openRecord = function (recordId) {
          if ($scope.openTarget == 'EXIST') {
            dcNavigateRecordTop(recordId);
          } else {
            dcNavigateRecordNew(recordId);
          }
        };

        $scope.openTab = function (tab) {
          $scope.activeTab = tab;
        };

        $scope.getAlertStyle = function () {
          if (angular.isUndefined($scope.alertStyle) || $scope.alertStyle.length == 0) {
            return 'slds-theme--error slds-theme--alert-texture';
          } else {
            return $scope.alertStyle;
          }
        };

        $scope.checkBoxEnabled = function () {
          if (angular.isDefined($scope.checkBox) && $scope.checkBox == 'true') {
            return true;
          } else {
            return false;
          }
        };

        $scope.doMerge = function (key) {
          var idList = [];
          if (!angular.isUndefined($scope.objectId) && $scope.objectIdPrefix == $scope.activeTab) {
            idList.push($scope.objectId);
          }

          angular.forEach($scope.listSelect[key], function (v, k) {
            if (v) {
              idList.push(k);
            }
          });
          var uri = 'ids=' + window.encodeURIComponent(idList.join(','));

          try {
            var payload = JSON.stringify({ name: 'OPEN_MODAL', idList: idList, type: 'idList', meta: 'REDIRECT', context: 'Check' });
            window.dispatchEvent(new CustomEvent('dupcheck__dc3Merge', { detail: payload }));
          } catch (e) {
            $scope.openAutoProcess($scope.mergeUrl, uri);
            console.error(e);
          }
        };

        $scope.doConvert = function (recordId) {
          var recordPrefix = getPrefixById(recordId);
          var uri = '';
          var leadId;
          var contactId;
          var accountId;

          switch ($scope.basePrefix) {
            case '00Q':
              leadId = $scope.objectId;
              break;
            case '001':
              accountId = $scope.objectId;
              break;
            case '003':
              contactId = $scope.objectId;
              break;
          }

          switch (recordPrefix) {
            case '00Q':
              leadId = recordId;
              break;
            case '001':
              accountId = recordId;
              break;
            case '003':
              contactId = recordId;
              break;
          }

          if (!empty(leadId)) {
            uri = uri + 'id=' + leadId;
          }
          if (!empty(accountId)) {
            uri = uri + '&account=' + accountId;
          }
          if (!empty(contactId)) {
            uri = uri + '&contact=' + contactId;
          }

          if ($scope.currentPage) {
            uri += '&retUrl=' + $scope.currentPage;
          }
          $scope.openAutoProcess($scope.convertUrl, uri);
        };

        $scope.openAutoProcess = function (url, uri) {
          dcNavigateTop(url, uri);
        };

        $scope.checkSingle = function (index, prefix) {
          var counter = 0;
          var objLength = Object.keys($scope.listSelect[prefix]).length;
          $scope.checkBoxID = Object.keys($scope.listSelect[prefix])[index];

          angular.forEach($scope.listSelect[prefix], function (v, k) {
            if (k == $scope.checkBoxID) {
              $scope.listSelect[prefix][k] = v;
            }
          });

          angular.forEach($scope.listSelect[prefix], function (v, k) {
            if (v == true) {
              counter += 1;
            }
          });

          if (counter == objLength) {
            $scope.listMaster[prefix] = true;
          } else {
            $scope.listMaster[prefix] = false;
          }
        };

        $scope.checkAll = function (masterCheck, prefix) {
          angular.forEach($scope.listSelect[prefix], function (v, k) {
            $scope.listSelect[prefix][k] = $scope.listMaster[prefix];
            $scope.listMaster[prefix] = $scope.listMaster[prefix];
          });
        };

        $scope.selectCount = function () {
          if (!angular.isUndefined($scope.objectId) && $scope.objectIdPrefix == $scope.activeTab) {
            $scope.counter = 1;
          } else {
            $scope.counter = 0;
          }

          angular.forEach($scope.listSelect[$scope.activeTab], function (v, k) {
            if (v == true) {
              $scope.counter++;
            }
          });
          return $scope.counter;
        };

        $scope.init();
      },
      template:
        '<div id="rvDuplicateResult" style="width: {{tableWidth}}px;">' +
        '<div style="position:relative">' +
        '<div plauti-loading="plauti-loading" show-if="searching" bounding="absolute" background="false" resource="{{resource}}" />' +
        '<div class="slds-notify slds-notify_alert slds-grid {{getAlertStyle()}}" role="alert" ng-style="{{style}}" >' +
        '<button class="slds-button slds-button--neutral slds-button--small slds-float--left" ng-click="doMerge(activeTab)" ng-disabled="selectCount() < 2" ng-show="checkBoxEnabled()" ng-bind-html="trans.merge"></button>' +
        '<div class="slds-align_absolute-center">' +
        '<h2 ng-show="!searching" ng-if="!noScenario"><b class="slds-grid"><span ng-bind-html="duplicateData.duplicateCount"/>&nbsp;<span ng-bind-html="determineResultType(duplicateData.duplicateCount)"/></b></h2>' +
        '</div>' +
        '</div>' +
        '<div class="slds-tabs--scoped">' +
        '<ul class="slds-tabs--scoped__nav rv-duplicate-tab" role="tablist">' +
        '<li ng-click="openTab(prefix)" class="slds-tabs__item slds-text-heading--label" ng-class="activeTab==prefix ? \'slds-active\' : \'\'" title="{{duplicateData.objectMeta[prefix].LabelPlural}}" role="presentation" ng-repeat="(prefix, data) in returnVar">' +
        '<a  href="#" class="slds-tabs--scoped__link" role="tab" tabindex="{{$index}}" aria-selected="false" aria-controls="sr-{{prefix}}" ng-class="{\'dc-blur-text\':searching}">' +
        '<span ng-bind-html="duplicateData.objectMeta[prefix].LabelPlural"/> ' +
        '<span class="slds-badge" ng-class="{\'slds-theme--info\': data.length > 0}" ng-bind-html="data.length"/>' +
        '</a>' +
        '</li>' +
        '</ul>' +
        '<div id="sr-{{prefix}}" class="slds-tabs__content rv-duplicate-tab-content" ng-class="activeTab==prefix ? \'slds-show\' : \'slds-hide\'" role="tabpanel" ng-repeat="(prefix, data) in returnVar">' +
        '<div ng-if="returnVar[activeTab].length > 0" class="slds-scrollable--x" style="width: {{tableWidth}}px;">' +
        '<table class="slds-table slds-table--bordered slds-max-medium-table--stacked-horizontal" style="border-top:0;border-bottom:0">' +
        '<thead>' +
        '<tr class="slds-text-heading--label" ng-class="{\'dc-blur-text\':searching}">' +
        '<th class="slds-cell-shrink" scope="col" ng-if="checkBoxEnabled()">' +
        '<label class="slds-checkbox">' +
        '<input name="checkbox" type="checkbox" ng-model="listMaster[prefix]" ng-change="checkAll(listMaster[prefix], prefix)" />' +
        '<span class="slds-checkbox--faux"></span>' +
        '<span class="slds-form-element__label slds-assistive-text" ng-bind-html="trans.selectAll"></span>' +
        '</label>' +
        '</th>' +
        '<th scope="col" ng-bind-html="trans.score"></th>' +
        '<th scope="col" ng-repeat="field in duplicateData.searchResultField[prefix]" ng-bind-html="field.fieldLabel"/>' +
        '<th class="slds-cell-shrink dc-text-align-right" scope="col" ng-bind-html="trans.action"></th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '<tr ng-repeat="duplicate in data | limitTo: prefixTotalResults[prefix]" ng-class="{\'dc-blur-text\':searching}">' +
        '<td class="slds-cell-shrink" scope="col" ng-if="checkBoxEnabled()">' +
        '<label class="slds-checkbox">' +
        '<input name="cb{{duplicate.objectData.Id}}" type="checkbox" ng-model="listSelect[prefix][duplicate.objectData.Id]" ng-click="checkSingle($index, prefix)" />' +
        '<span class="slds-checkbox--faux"></span>' +
        '<span class="slds-form-element__label slds-assistive-text" ng-bind-html="trans.individualSelect"></span>' +
        '</label>' +
        '</td>' +
        '<td data-label="{{trans.score}}"><span ng-bind-html="duplicate.score"/>%</td>' +
        '<td data-label="{{field.fieldLabel}}" ng-repeat="field in duplicateData.searchResultField[prefix]">' +
        '<span ng-bind-html="duplicate.objectData[field.fieldName]" ng-if="duplicateData.fieldMeta[prefix][field.fieldName].Type != \'BOOLEAN\'"></span>' +
        '<svg class="slds-icon slds-icon-text-default slds-icon_xx-small" ng-if="duplicateData.fieldMeta[prefix][field.fieldName].Type == \'BOOLEAN\'">' +
        '<use ng-if="duplicate.objectData[field.fieldName] != \'X\'" xlink:href="{{clearSvg}}"></use>' +
        '<use ng-if="duplicate.objectData[field.fieldName] == \'X\'" xlink:href="{{checkSvg}}"></use>' +
        '</svg>' +
        '</td>' +
        '<td class="slds-cell-shrink" scope="col" data-label="{{action}}">' +
        "<button ng-if=\"licenseConvert && ((prefix == '00Q' && basePrefix == '001') || (prefix == '00Q' && basePrefix == '003') || (prefix == '001' && basePrefix == '00Q') || (prefix == '003' && basePrefix == '00Q'))\" class=\"slds-button slds-button--neutral rv-table-action slds-x-small-button--stacked\" ng-click=\"doConvert(duplicate.objectData.Id)\" ng-bind-html=\"trans.convert\"></button>" +
        '<button ng-if="rowButton" ng-class="{\'dc-blur-text\':searching}" class="slds-button slds-button--neutral rv-table-action slds-x-small-button--stacked" ng-click="openRecord(duplicate.objectData.Id)" ng-bind-html="trans.open"></button>' +
        '<button ng-if="!rowButton" ng-class="{\'dc-blur-text\':searching}" class="slds-button slds-button--neutral rv-table-action slds-x-small=button--stacked" ng-click="buttonRowSelect({param: duplicate.objectData})" ng-bind-html="trans.select"></button>' +
        '</td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>' +
        '<div ng-if="returnVar[activeTab].length < 1">' +
        '<div class="slds-grid slds-grid--align-spread slds-m-left--medium">' +
        '<h3 ng-if="noScenario" class="slds-text-heading--small slds-p-bottom--large slds-m-top--large">{{componentName}}&nbsp;{{noScenarioLabel}}</h3>' +
        '<h3 ng-if="!noScenario" class="slds-text-heading--small slds-p-bottom--large slds-m-top--large" ng-show="resultType == \'Duplicate\'" ng-bind-html="trans.noDuplicatesFound"></h3>' +
        '<h3 ng-if="!noScenario" class="slds-text-heading--small slds-p-bottom--large slds-m-top--large" ng-show="resultType == \'Result\'" ng-class="{\'dc-blur-text\':searching}" ng-bind-html="trans.noResultsFound"></h3>' +
        '</div>' +
        '</div>' +
        '<div class="slds-text-heading--label slds-m-left--large slds-m-top--x-small slds-m-bottom--x-small" ng-hide="prefixTotalResults[prefix] >= duplicateData.searchResult[prefix].length">' +
        '<a ng-click="limitResults(prefix)" ng-class="{\'dc-blur-text\':searching}">' +
        '<span ng-bind-html="trans.showMore"></span>' +
        '<span class="slds-badge" ng-bind-html="showMore()"></span>' +
        '</a>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    };
  })
  .directive('plautiLoading', function () {
    return {
      restrict: 'A',
      replace: 'true',
      scope: {
        showIf: '=',
        bounding: '@',
        move: '@',
        background: '=?',
        size: '@?',
        fixed: '=?'
      },
      link: function (scope, element, attrs) {},
      controller: function ($scope) {
        if (angular.isUndefined($scope.background)) {
          $scope.background = true;
        }
        if (angular.isUndefined($scope.size)) {
          $scope.size = 'slds-spinner_medium';
        }
        if (angular.isUndefined($scope.fixed)) {
          $scope.fixed = false;
        }
      },
      template:
        '<div ng-show="showIf" style="width:-moz-available; width:-webkit-fill-available; width:fill-available; height:100%; {{background ? \'background: #FFFFFFAA;\' : \'\'}} position: {{bounding}}; z-index: 9000; opacity : 1;">' +
        '<div role="status" class="slds-spinner slds-spinner_brand {{size}}" ng-style="fixed && {\'position\': \'static\'}">' +
        '<span class="slds-assistive-text">Loading</span>' +
        '<div class="slds-spinner__dot-a"></div>' +
        '<div class="slds-spinner__dot-b"></div>' +
        '</div>' +
        '</div>'
    };
  })
  .directive('plautiProgressBar', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        status: '@',
        percentage: '@'
      },
      link: function (scope, element, attrs) {},
      controller: function ($scope) {
        $scope.widthStyle;
        $scope.barClass;
        $scope.textColor;
        $scope.transText;

        $scope.$watch('status', function () {
          init();
        });

        $scope.$watch('percentage', function () {
          init();
        });

        var setBarClass = function () {
          switch ($scope.status) {
            case 'Aborted':
              $scope.transText = dc3Translate('ABORTED', 'Aborted');
              $scope.barClass = 'slds-theme--warning';
              $scope.textColor = {};
              $scope.showPercentage = 100;
              break;
            case 'Completed':
              $scope.transText = dc3Translate('COMPLETED', 'Completed');
              $scope.barClass = 'slds-theme--success';
              $scope.textColor = { color: '#FFFFFF' };
              $scope.showPercentage = 100;
              break;
            case 'Processing':
              $scope.transText = dc3Translate('PROCESSING', 'Processing');
              $scope.barClass = 'slds-theme--info slds-theme--alert-texture';
              $scope.textColor = { color: '#000000' };
              break;
            case 'Preparing':
              $scope.transText = dc3Translate('PREPARING', 'Preparing');
              $scope.barClass = 'slds-theme--default';
              $scope.textColor = {};
              $scope.showPercentage = 100;
              break;
            case 'Queued':
              $scope.transText = dc3Translate('QUEUED', 'Queued');
              $scope.barClass = 'slds-theme--default';
              $scope.textColor = {};
              $scope.showPercentage = 100;
              break;
            case 'Holding':
              $scope.transText = dc3Translate('HOLDING', 'Holding');
              $scope.barClass = 'slds-theme--offline';
              $scope.textColor = { color: '#FFFFFF' };
              $scope.showPercentage = 100;
              break;
            case 'Failed':
              $scope.transText = dc3Translate('FAILED', 'Failed');
              $scope.barClass = 'slds-theme--error';
              $scope.textColor = { color: '#FFFFFF' };
              $scope.showPercentage = 100;
              break;
            default:
              $scope.barClass = 'slds-theme--shade';
              $scope.textColor = { color: '#FFFFFF' };
          }
        };

        var init = function () {
          $scope.showPercentage = $scope.percentage;
          setBarClass();
          $scope.widthStyle = {};
          $scope.widthStyle.width = $scope.showPercentage + '%';
        };
        init();
      },
      template:
        '' +
        '<div class="plauti-progress">' +
        '<div class="plauti-progress-bar" ng-class="barClass" role="progressbar" aria-valuenow="{{showPercentage}}" aria-valuemin="0" aria-valuemax="100" ng-style="widthStyle">' +
        '</div>' +
        '<div class="plauti-progress-label slds-text-body--small" ng-style="textColor" ng-bind-html="transText"></div>' +
        '</div>'
    };

    //plauti-slds-ng module
  })
  .directive('lookup', function () {
    return {
      restrict: 'E',
      scope: {
        field: '@',
        ngModel: '=',
        minChar: '@',
        objectList: '@'
      },
      controller: function ($scope, $rootScope, $timeout, remoting) {
        $scope.resultList = [];
        $scope.inputLabel = '';
        $scope.isClosed = true;
        $scope.isSearching = false;

        $scope.onChange = function () {
          $scope.ngModel = '';
          if ($scope.inputLabel.length >= $scope.minChar) {
            $scope.doSearch();
          } else {
            $scope.resultList = [];
          }
        };

        $scope.onBlur = function (event) {
          $timeout(function () {
            $scope.isClosed = true;
          }, 200);
        };

        $scope.selectItem = function (id, name) {
          $scope.inputLabel = name;
          $scope.ngModel = id;
          $scope.isClosed = false;
        };

        $scope.doSearch = function () {
          $scope.isSearching = true;
          var getter = remoting.doubleService($rootScope.endpoint.typeahead, $scope.objectList, $scope.inputLabel);
          getter.then(
            function (searchResult) {
              $scope.resultList = searchResult;
              $scope.isClosed = false;
              $scope.isSearching = false;
            },
            function (reason) {
              alert(reason);
              $scope.isSearching = false;
            }
          );
        };
      },
      template:
        '<input id="{{field}}" name="{{field}}" class="slds-input" ng-blur="onBlur($event)" ng-change="onChange()" ng-model="inputLabel" type="text" />' +
        '<div class="slds-lookup__menu" ng-show="isSearching"><ul class="slds-lookup__list" ><li class="slds-lookup__item">Searching..</li></ul></div>' +
        '<div class="slds-lookup__menu" ng-show="!isClosed"><ul class="slds-lookup__list" ><li class="slds-lookup__item" ng-repeat="item in resultList"><a id="{{item.id}}" href="#" ng-click="selectItem(item.id, item.name)">{{item.name}}</a></li></ul></div>'
    };
  })
  .directive('tabsetlazy', function () {
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      scope: {
        active: '@',
        tabStyle: '@'
      },
      controller: function ($scope) {
        $scope.templateUrl = '';
        $scope.activeTab = '';
        var tabs = ($scope.tabs = []);
        var controller = this;

        if (!$scope.tabStyle) {
          $scope.tabStyle = 'default';
        }

        $scope.selectTab = function (tab) {
          angular.forEach(tabs, function (tab) {
            tab.selected = false;
          });
          tab.selected = true;
          $scope.activeTab = tab.name;
        };
        this.selectTab = $scope.selectTab;

        this.setTabTemplate = function (templateUrl) {
          $scope.templateUrl = templateUrl;
        };

        this.addTab = function (tab) {
          if (tabs.length === 0) {
            $scope.selectTab(tab);
          } else if ($scope.active == tab.name) {
            $scope.selectTab(tab);
          }
          tabs.push(tab);
        };
      },
      template:
        '<div class="slds-tabs--{{tabStyle}}"><ul class="slds-tabs--{{tabStyle}}__nav" ng-transclude></ul><ng-include src="templateUrl"></ng-include></div>'
    };
  })
  .directive('tablazy', function () {
    return {
      restrict: 'E',
      replace: true,
      require: '^tabsetlazy',
      scope: {
        title: '@',
        templateUrl: '@',
        name: '@'
      },
      link: function (scope, element, attrs, tabsetlazyController) {
        tabsetlazyController.addTab(scope);

        if (!empty(attrs.icon) && !empty(attrs.svgicon)) {
          scope.icon = attrs.icon;
          scope.svgicon = attrs.svgicon;
        }

        scope.select = function () {
          tabsetlazyController.selectTab(scope);
        };

        scope.$watch('selected', function () {
          if (scope.selected) {
            tabsetlazyController.setTabTemplate(scope.templateUrl);
          }
        });
      },
      template:
        '<li class="slds-tabs__item slds-text-heading--label" ng-class="{\'slds-active\': selected}"><a href="#" ng-click="select()"><div class="slds-media slds-media--center slds-has-flexi-truncate"><div class="slds-media__figure"><img class="slds-icon slds-icon-standard-{{icon}} slds-icon--small" src="{{svgicon}}"/></div><div class="slds-media__body"><span ng-bind-html="title"/></div></div></a></li>'
    };
  })
  .directive('ngEnter', function () {
    return function (scope, element, attrs) {
      element.bind('keydown keypress', function (event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.ngEnter);
          });

          event.preventDefault();
        }
      });
    };
  });

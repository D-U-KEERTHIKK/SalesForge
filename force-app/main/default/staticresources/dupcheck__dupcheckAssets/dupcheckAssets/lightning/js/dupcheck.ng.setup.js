angular
    .module('dcApp', ['dcApp.services', 'dcApp.controllers', 'dcApp.directives', 'ngSanitize', 'plauti-ng-slds', 'LocalStorageModule', 'ngCookies'])

    .directive('strToInt', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$formatters.push(function (v) {
                    return parseInt(v, 10);
                });
            }
        };
    })

    .filter('sanitize', ['$sce', function($sce) {
        return function(input) {
            return $sce.trustAsHtml(input);
        };
    }])

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
    })

    .factory('utils', function () {
        return {
            compareStr: function (stra, strb) {
                stra = ('' + stra).toLowerCase();
                strb = ('' + strb).toLowerCase();
                return -1 !== stra.indexOf(strb);
            }
        };
    })

    .filter('afFilter', function (utils) {
        return function (input, query) {
            if (!query) return input;
            var result = {};

            angular.forEach(input, function (availableField, field) {
                if (utils.compareStr(field, query) || utils.compareStr(availableField, query)) result[field] = availableField;
            });
            return result;
        };
    })

    .filter('orderByFieldType', function () {
        return function (items, sorting, scope, master) {
            if (angular.isUndefined(sorting)) {
                return;
            }

            sorting = sorting.toLowerCase();

            if ('string' == sorting || 'email' == sorting || 'phone' == sorting || 'address' == sorting || 'textarea' == sorting || 'url' == sorting) {
                if (master) return scope.meta.text;
                return items.filter(function (el) {
                        return 'SHORTEST' == el.value || 'LONGEST' == el.value || 'Record Based Rules' == el.type;
                    });
            } else if ('double' == sorting || 'currency' == sorting || 'integer' == sorting || 'int' == sorting || 'percent' == sorting) {
                if (master) return scope.meta.number;
                return items.filter(function (el) {
                        return 'MIN' == el.value || 'MAX' == el.value || 'Record Based Rules' == el.type;
                    });
            } else if ('boolean' == sorting) {
                if (master) return scope.meta.boo;
                return scope.meta.booAlt;
            } else if ('date' == sorting || 'datetime' == sorting || 'id' == sorting) {
                if (master) return scope.meta.moment;
                return items.filter(function (el) {
                        return 'LATEST' == el.value || 'OLDEST' == el.value || 'Record Based Rules' == el.type;
                    });
            } else if ('picklist' == sorting || 'multipicklist' == sorting) {
                if (master) return scope.meta.list;
                return items.filter(function (el) {
                        return 'LIST-ASC' == el.value || 'LIST-DESC' == el.value || 'Record Based Rules' == el.type;
                    });
            } else if ('reference' == sorting && !master) {
                return items.filter(function (el) {
                    return 'Record Based Rules' == el.type;
                });
            } 
                
            
        };
    })

    .filter('filterReference', function () {
        return function (items) {
            let toDelete = [];
            angular.forEach(items, function (v, k) {
                if (angular.equals(v.Type, 'REFERENCE')) {
                    toDelete.push(k);
                }
            });
            for (x of toDelete) {
                delete items[x];
            }

            return items;
        };
    })

    //dc3License Filter
    .filter('valueToLabel', function () {
        return function (input) {
            var labels = {
                scenarioCount: 'Scenario Limit',
                batchFilter: 'Batch Filter',
                batchSchedule: 'Batch Schedule',
                crossObject: 'Cross Object',
                recordType: 'Record Type',
                customFields: 'Custom Fields',
                customObjects: 'Custom Objects',
                standardObject: 'Standard Object',
                advancedMatching: 'Advanced Fuzzy Matching',
                configuredMerge: 'Merge Configuration',
                multipleMerge: 'Multiple Merge',
                batchMerge: 'Batch Merge',
                quickMerge: 'Quick Merge',
                batchConvert: 'Batch Convert',
                quickConvert: 'Quick Convert',
                pageConvert: 'Deduplicate Convert',
                pageMerge: 'Deduplicate Merge',
                pageCheck: 'Deduplicate Check',
                api: 'API Enabled',
                uniqueUpload: 'Unique Upload',
                web2Lead: 'Web-to-Lead',
                batchDeduplication: 'Deduplicate Job',
                duplicatePrevention: 'Duplicate Prevention',
                basicObject: 'Basic Objects',
                batchExport: 'Batch Objects',
                pageLayout: 'Deduplicate Live',
                pageEntry: 'Deduplicate Entry',
                advancedDiscard: 'Deduplicate Discard',
                plugin: 'Extension Plugins',
                setForMerge: 'Set For Merge',
                directProcessing: 'Direct Processing',
                auditLogging: 'Audit Logging',
                frequentWords: 'Deduplicate Frequent Words',
                dataApi: 'Data API',
                objectFilter: 'Object Filter',
                batchExternal: 'DC Local',
                batchExternalService: 'DC Local Service',
                share: 'Share Duplicate Results',
                predefinedFilter: 'Predefined Filter',
                configExport: 'Config Import/Export',
                flow: 'Flow Actions'
            };

            return labels[input];
        };
    });

angular
    .module('dcApp.controllers', ['rzModule'])
    .controller('setupController', function ($scope, $rootScope, $interval, remoting, $location) {
        $scope.init = function () {
            var dataContainer = angular.element('div#dataStore');
            $rootScope.dcSetupStartRenderTime = new Date().getTime();
            $rootScope.endpoint = {};
            //$rootScope.endpoint.getAddObjectList = dataContainer.data('sf-get-add-object-list');
            $rootScope.endpoint.addObject = dataContainer.data('sf-add-object');
            $rootScope.endpoint.objectLabel = dataContainer.data('object-label');
            $rootScope.endpoint.currentPage = dataContainer.data('sf-current-page');
            $rootScope.endpoint.license = dataContainer.data('license');
            $rootScope.endpoint.crossObjectEnabled = dataContainer.data('is-cross-object-enabled');
            $rootScope.endpoint.advancedMatchingEnabled = dataContainer.data('is-advanced-matching-enabled');

            $rootScope.endpoint.getScenarioList = dataContainer.data('sf-scenario-list');
            $rootScope.endpoint.deleteScenario = dataContainer.data('sf-delete-scenario');
            $rootScope.endpoint.addScenario = dataContainer.data('sf-add-scenario');
            $rootScope.endpoint.addDefaultScenario = dataContainer.data('sf-add-default-scenario');
            // TODO: rootScope.endpoint.configId should be deprecated in favor of using rootScope.endpoint.objectName
            $rootScope.endpoint.configId = dataContainer.data('object-config-id');
            $rootScope.endpoint.updateScenario = dataContainer.data('sf-update-scenario');
            $rootScope.endpoint.licenseFrequentWords = dataContainer.data('sf-license-fw');

            $rootScope.endpoint.recordTypeConfig = dataContainer.data('sf-record-type-config');
            $rootScope.endpoint.updateRecordTypeConfig = dataContainer.data('sf-update-record-type-config');

            $rootScope.endpoint.getSettings = dataContainer.data('sf-get-settings');
            $rootScope.endpoint.updateConfigField = dataContainer.data('sf-update-config-field');
            $rootScope.endpoint.getRelatedMergeList = dataContainer.data('sf-get-related-merge-list');
            $rootScope.endpoint.getRelatedMergeUniqueList = dataContainer.data('sf-get-related-merge-unique-list');
            $rootScope.endpoint.getMergeFieldIgnoreOptions = dataContainer.data('sf-get-merge-field-ignore');
            $rootScope.endpoint.getIndexFieldList = dataContainer.data('sf-get-index-field-list');
            $rootScope.endpoint.addScenarioField = dataContainer.data('sf-add-scenario-field');
            $rootScope.endpoint.deleteScenarioField = dataContainer.data('sf-delete-scenario-fields');
            $rootScope.endpoint.updateScenarioField = dataContainer.data('sf-update-scenario-field');
            $rootScope.endpoint.indexObject = dataContainer.data('sf-index-object');
            $rootScope.endpoint.deleteObject = dataContainer.data('sf-delete-object');

            $rootScope.endpoint.getResultField = dataContainer.data('sf-get-result-field');
            $rootScope.endpoint.updateResultField = dataContainer.data('sf-update-result-field');

            $rootScope.endpoint.getCrossObject = dataContainer.data('sf-get-cross-config');
            $rootScope.endpoint.getCrossObjectOptions = dataContainer.data('sf-get-cross-object-options');
            $rootScope.endpoint.getCrossObjectFieldOptions = dataContainer.data('sf-get-cross-object-field-options');
            $rootScope.endpoint.deleteCrossObject = dataContainer.data('sf-delete-cross-object');
            $rootScope.endpoint.deleteCrossObjectField = dataContainer.data('sf-delete-cross-object-field');
            $rootScope.endpoint.insertUpdateCrossObjectField = dataContainer.data('sf-insert-update-cross-object-field');

            $rootScope.endpoint.getRelatedData = dataContainer.data('sf-related');
            $rootScope.endpoint.getObjectFilterOptions = dataContainer.data('sf-get-object-filter-options');

            $rootScope.endpoint.getJobListByPage = dataContainer.data('sf-get-job-list-by-page');
            $rootScope.endpoint.startIndexJob = dataContainer.data('sf-start-index-job');
            $rootScope.endpoint.createLocalIndexJob = dataContainer.data('sf-create-local-index-job');
            $rootScope.endpoint.createAccountHierarchyIndex = dataContainer.data('sf-create-account-hierachy-index-job');
            $rootScope.endpoint.abortJob = dataContainer.data('sf-abort-job');
            $rootScope.endpoint.deleteIndexJob = dataContainer.data('sf-delete-index-job');
            $rootScope.endpoint.currentObject = dataContainer.data('sf-current-object');
            $rootScope.endpoint.defaultPage = dataContainer.data('sf-default-page');
            $rootScope.endpoint.getFilterList = dataContainer.data('sf-get-filterlist');
            $rootScope.endpoint.addFilter = dataContainer.data('sf-add-filter');
            $rootScope.endpoint.updateFilter = dataContainer.data('sf-update-filter');
            $rootScope.endpoint.deleteFilter = dataContainer.data('sf-delete-filter');
            $rootScope.endpoint.addFilterRule = dataContainer.data('sf-add-filter-rule');
            $rootScope.endpoint.getFilterRules = dataContainer.data('sf-get-filter-rules');
            $rootScope.endpoint.updateFilterRule = dataContainer.data('sf-update-filter-rule');
            $rootScope.endpoint.getFilterFields = dataContainer.data('sf-get-filterfields');
            $rootScope.endpoint.deleteFilterRule = dataContainer.data('sf-delete-filter-rule');
            $rootScope.endpoint.getFilterExpressionList = dataContainer.data('sf-get-filter-expression-list');
            $rootScope.endpoint.relatedTypeAhead = dataContainer.data('sf-typeahead');
            $rootScope.endpoint.fetchObjectList = dataContainer.data('sf-add-object-list');

            // these data attributes exist in both data and endpoint
            $rootScope.endpoint.objectPrefix = dataContainer.data('object-prefix');
            $rootScope.endpoint.objectName = dataContainer.data('object-name');

            $rootScope.data = {};
            $rootScope.data.objectPrefix = $rootScope.endpoint.objectPrefix;
            $rootScope.data.objectName = $rootScope.endpoint.objectName;

            $scope.meta = {};
            $scope.meta.addObjectLoading = false;
            $scope.meta.selectPage = $rootScope.data.objectPrefix;
            $scope.meta.stretchNav = isSalesforce1() ? true : false;
            $scope.meta.dcDiscard = dataContainer.data('dc-discard');
            $scope.meta.absUrl = $location.absUrl();
            $scope.meta.addObjectList;

            $scope.data = {};
            $scope.data.page = '';

            $scope.endpoint.getAiMergeRecommendationStatus = dataContainer.data('sf-get-merge-recommendation-status');
            if ($scope.endpoint.getAiMergeRecommendationStatus) {
                var getter = remoting.emptyService($scope.endpoint.getAiMergeRecommendationStatus);
                getter.then((result) => {
                    // Parse special characters
                    const el = document.createElement('textarea');
                    el.innerHTML = result.value.message;
                    if (result.value?.signedButNotEnabled) {
                        sforce.one.showToast({
                            message: el.value,
                            // messageLinks: {
                            //     salesforceLink: {
                            //         url: 'http://www.salesforce.com',
                            //         label: 'Salesforce link'
                            //     },
                            // },
                            type: 'success',
                            mode: 'sticky'
                        });
                    }
                });
            }
        };

        $scope.$watch('meta.absUrl', function (v) {
            if (0 == $rootScope.data.objectPrefix.length) {
                $scope.meta.selectPage = $rootScope.endpoint.defaultPage;
            }
        });

        $scope.openAddObjectModal = function () {
            window.dispatchEvent(new CustomEvent('addObject'));
        };

        $scope.addObject = function () {
            $scope.meta.addObjectLoading = true;
            var setter = remoting.singleService($scope.endpoint.addObject, $scope.meta.AddObjectPrefix);
            setter.then(
                function (result) {
                    dcNavigate($rootScope.endpoint.currentPage, 'object=' + $scope.meta.AddObjectPrefix);
                },
                function (reason) {
                    $scope.meta.addObjectLoading = false;
                    alert(reason);
                }
            );
        };

        $scope.selectPage = function () {
            var target = 'object';
            if ('DCDISCARD' == $scope.meta.selectPage) {
                return dcNavigate($scope.meta.dcDiscard);
            }
            var pages = ['HOME', 'DCSETTINGS', 'DCLICENSE', 'DCAUDIT', 'DCFREQUENT', 'DCSETUPCHECK'];
            if (-1 < pages.indexOf($scope.meta.selectPage)) {
                target = 'page';
            }
            dcNavigate($rootScope.endpoint.currentPage, target + '=' + $scope.meta.selectPage);
        };

        $rootScope.openPage = function (action, object, external, objectLabel) {
            //ugly temporary solution until all setup pages are converted in components
            //remaining page: DC Discard
            if (angular.equals(action, 'OBJECT')) {
                $scope.data.page = '';
                if(objectLabel) {
                    window.recordEvt('DC Object Setup - Object', { source_object: objectLabel });
                }
                
                dcNavigate($rootScope.endpoint.currentPage, 'object=' + object);
            } else if (null != external) {
                dcNavigate(external, '');
            } else {
                dcNavigate($rootScope.endpoint.currentPage, 'page=' + object);
            }
        };

        $rootScope.openExternalPage = function (location) {
            dcNavigateNew(location, '');
        };

        $scope.init();
    })

    .controller('scenarioController', function ($scope, $rootScope, $interval, remoting, $timeout, $filter, $window) {
        //FIXME scenarioController

        $scope.init = function () {
         
            $scope.data = {};
            $scope.data.scenarioApply = {};
            $scope.data.scenarioScore = {};
            $scope.data.actionList = $window.actionList;
            $scope.data.groupList = [
                {Value: '1', Label: 'Group 1'},
                {Value: '2', Label: 'Group 2'},
                {Value: '3', Label: 'Group 3'},
                {Value: '4', Label: 'Group 4'},
                {Value: '5', Label: 'Group 5'},
                {Value: '6', Label: 'Group 6'},
                {Value: '7', Label: 'Group 7'},
                {Value: '8', Label: 'Group 8'},
                {Value: '9', Label: 'Group 9'},
                {Value: '10', Label: 'Group 10'}
            ];
            $scope.meta = {};
            $scope.meta.slider = {options: {floor: 1, ceil: 100, step: 1}};
            $scope.meta.deleteScenarioModal = false;
            $scope.meta.open = {};
            $scope.meta.editName = [];
            $scope.meta.scenarioSize = 0;
            $scope.meta.loading = false;
            $scope.meta.addScenarioModal = false;
            $scope.meta.addScenarioField = false;
            $scope.meta.addDefault = false;
            $scope.meta.deletingScenario = false;
            $scope.meta.numeric = /^\d+$/;
            $scope.meta.addScenarioPlaceholder = dc3Translate('EXAMPLE', 'Example') + ': ' + $rootScope.endpoint.objectLabel + ' ' + dc3Translate('SCENARIO', 'Scenario');

            $scope.meta.threshold = dc3Translate('SETUP_SCENARIO_THRESHOLD_HELP', 'The threshold level determines from what percentage a match is defined as a potential duplicate record and should return as a result.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_SETUP_SCENARIOS', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario#threshold', '')\">" + dc3Translate('READ_MORE', 'Read More') + '</a>';

            $scope.meta.scenario = dc3Translate('SETUP_SCENARIO_SCENARIO_HELP', 'A scenario determines how Plauti Deduplicate compares and scores records.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_SETUP_SCENARIOS', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario#scenario', '')\">" + dc3Translate('READ_MORE', 'Read More') + '</a>';

            $scope.meta.emptyFields = dc3Translate('SETUP_SCENARIO_EMPTY_FIELDS_HELP', 'The empty fields setting determines how to handle (possible) empty fields in the comparison process.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_SETUP_SCENARIOS', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario#emptyfields', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';

            $scope.meta.applyTo = dc3Translate('SETUP_SCENARIO_APPLY_TO_HELP', 'Decide in what feature you want to use your scenario.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_SETUP_SCENARIOS', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario#applyto', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';
            $scope.meta.fields = dc3Translate('SETUP_SCENARIO_FIELDS_HELP', 'The fields defined in the scenario are the fields that are used to compare records.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_SETUP_SCENARIOS', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario#fields', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';
            $scope.meta.synonym = dc3Translate('SETUP_SCENARIO_SYNONYM_HELP', 'Select a synonym list to use for this field. Records with values that are listed as synonyms of each other will be considered a match.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_USAGE_SYNONYM_MATCHING', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';
            $scope.meta.frequent = dc3Translate('SETUP_SCENARIO_FREQUENT_HELP', 'Apply a list of frequently used words. Plauti Deduplicate will exclude them in the comparison process.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_USAGE_FREQUENT_WORDS', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';
            $scope.meta.weighting = dc3Translate('SETUP_SCENARIO_WEIGHTING_HELP', 'Use the weighting setting to decide what fields should weigh the most when comparing records. A field with a higher weighting, has more impact on the matching percentage than a field with a lower weighting.') + '<a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_SETUP_SCENARIOS', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario#weighting', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';
            $scope.meta.matchingMethod = dc3Translate('THE_MATCHING_METHOD_DECIDES_HOW_VALUE_IS_ANALYSED_AND_SCORED', 'The matching method decides how a value is analysed and scored.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_SETUP_MATCHING_METHODS', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';
            $scope.meta.doNotIndex = "Decide if a field should not be taken into account when creating the search index. <a ng-click=\"openUrl('https://support.duplicatecheck.com/setup-guide/when-to-exclude-a-field-from-the-search-index?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';
            $scope.meta.indexGrouping = "By creating groups of logical fields Deduplicate can do a better job while searching for possible duplicates. This really usefull in LDV Orgs. <a ng-click=\"openUrl('https://go.plauti.com/DC-Index_Grouping', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';

            if(localStorage.getItem('eventStore')) {
                window.persistEvt();
            }

            $scope.getScenarioList();
            $scope.getConfig();
        };

        $scope.openInfo = function (url, uri) {
            dcNavigateNew(url, uri);
        };

        $scope.getConfig = function () {
            $scope.meta.loading = true;
            var getter = remoting.singleServiceBuffer($rootScope.endpoint.getSettings, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    if (result.value) {
                        $scope.data.config = result.value;
                    }
                    $scope.meta.loading = false;                   
                },
                function (reason) {
                    $scope.meta.loading = false;
                    alert(reason);
                }
            );
        };
        
        $scope.getScenarioList = function () {
            $scope.meta.loading = true;
            $scope.meta.scenarioLoading = true;
            var getter = remoting.singleServiceEscape($rootScope.endpoint.getScenarioList, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    $scope.data.scenarioList = result.value.scenario;
                    $scope.data.fieldList = result.value.fieldSelect;
                    $scope.meta.scenarioSize = Object.keys($scope.data.scenarioList).length;

                    $timeout(
                        function () {
                            $scope.$broadcast('rzSliderForceRender');
                        },
                        0,
                        false
                    );

                    $scope.meta.loading = false;
                    $scope.meta.scenarioLoading = false;
                },
                function (reason) {
                    $scope.meta.loading = false;
                    $scope.meta.scenarioLoading = false;
                    alert(reason);
                }
            );
        };

        $scope.toggleScenario = function (id) {
            $scope.meta.open[id] = $scope.meta.open[id] ? false : true;

            $timeout(
                function () {
                    $scope.$broadcast('rzSliderForceRender');
                },
                0,
                false
            );
        };

        $scope.$on('slideEnded', function (evt) {
            var threshold = evt.targetScope.rzSliderModel;
            var scenarioId = evt.targetScope.slider.options.customTemplateScope.scenarioId;
            var fieldId = evt.targetScope.slider.options.customTemplateScope.fieldId;
            var type = evt.targetScope.slider.options.customTemplateScope.type;

            if (angular.equals(type, 'threshold')) {
                $scope.updateScenario(scenarioId, type, threshold);
            } else if (angular.equals(type, 'matchConfig')) {
                $scope.updateScenarioField(fieldId, type, threshold, scenarioId);
            } else {
                $scope.updateScenarioField(fieldId, type, threshold, scenarioId);
            }
        });

        $scope.toggleDeleteScenario = function (id, label) {
            $scope.meta.deleteScenarioModal = !$scope.meta.deleteScenarioModal;
            $scope.data.deleteScenarioLabel = label;
            $scope.data.deleteScenarioId = id;
        };

        $scope.deleteScenario = function () {
            remoting.doubleService($rootScope.endpoint.deleteScenario, $rootScope.data.objectPrefix, $scope.data.deleteScenarioId).then(
                function (result) {
                    delete $scope.data.scenarioList[$scope.data.deleteScenarioId];
                    $scope.meta.deleteScenarioModal = false;
                    $scope.meta.scenarioSize -= 1;
                },
                function (reason) {
                    $scope.meta.deleteScenarioModal = false;
                    alert(reason);
                }
            );
        };

        $scope.addDefaultScenario = function (scenarioName) {
            $scope.meta.addDefault = false;
            remoting.doubleService($rootScope.endpoint.addDefaultScenario, $rootScope.data.objectPrefix, scenarioName).then(
                function (result) {
                    $scope.data.scenarioList[result.value.scenarioId] = result.value;
                    $scope.meta.open[result.value.scenarioId] = true;
                    $scope.meta.scenarioSize += 1;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.insertScenario = function (scenarioName) {
            remoting.doubleService($rootScope.endpoint.addScenario, $rootScope.data.objectPrefix, scenarioName).then(
                function (result) {
                    var a = angular.copy(actionList);
                    $scope.data.scenarioList[result.value.scenarioId] = result.value;
                    $scope.data.scenarioApply[result.value.scenarioId] = a;
                    $scope.meta.open[result.value.scenarioId] = true;
                    $scope.meta.scenarioSize += 1;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.updateScenario = function (scenarioId, fieldName, fieldData) {
            remoting.quadService($rootScope.endpoint.updateScenario, $rootScope.data.objectPrefix, scenarioId, fieldName, fieldData).then(
                function (result) {},
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.addScenarioField = function (scenarioId) {
            $scope.meta.addScenarioField = true;

            if (empty($scope.data.scenarioList[scenarioId].scenarioFields)) {
                $scope.data.scenarioList[scenarioId].scenarioFields = [];
            }

            var setter = remoting.doubleService($rootScope.endpoint.addScenarioField, $rootScope.data.objectPrefix, scenarioId);
            setter.then(
                function (result) {
                    $scope.data.scenarioList[scenarioId].scenarioFields.push(result.value);
                    $scope.meta.addScenarioField = false;
                },
                function (reason) {
                    $scope.meta.addScenarioField = false;
                    alert(reason);
                }
            );
        };

        $scope.toggleAddScenario = function () {
            $scope.data.newScenarioName = undefined;
            $scope.meta.addScenarioModal = true;
            window.recordEvt('Object Setup - Scenarios - Add New Scenario Button clicked.');
            window.persistEvt();
        };

        $scope.editScenarioName = function (scenarioId) {
            if (empty($scope.data.scenarioList[scenarioId].scenarioName)) {
                alert(dc3Translate('THE_SCENARIO_NAME_CANNOT_BE_EMPTY', 'The Scenario Name cannot be empty'));
                return;
            }

            $scope.meta.editName[scenarioId] = false;
            $scope.updateScenario(scenarioId, 'scenarioName', $scope.data.scenarioList[scenarioId].scenarioName);
        };

        $scope.saveScenarioName = function () {
            if (empty($scope.data.newScenarioName)) {
                alert(dc3Translate('THE_SCENARIO_NAME_CANNOT_BE_EMPTY', 'The Scenario Name cannot be empty'));
                return;
            }

            $scope.meta.addScenarioModal = false;
            if ($scope.meta.addDefault) {
                $scope.addDefaultScenario($scope.data.newScenarioName);
            } else {
                $scope.insertScenario($scope.data.newScenarioName);
            }
        };

        $scope.deleteScenarioField = function (scenarioId, fieldId) {
            $scope.meta.deletingScenarioField = true;
            $scope.meta.deletingScenarioFieldId = fieldId;
            var setter = remoting.doubleService($rootScope.endpoint.deleteScenarioField, $rootScope.data.objectPrefix, fieldId);
            setter.then(
                function (result) {
                    angular.forEach($scope.data.scenarioList[scenarioId].scenarioFields, function (value, key) {
                        if (value.scenarioFieldId == fieldId) {
                            $scope.data.scenarioList[scenarioId].scenarioFields.splice(key, 1);
                            
                        }
                    });
                    $scope.meta.deletingScenarioField = false;
                    $scope.meta.deletingScenarioFieldId = undefined;
                },
                function (reason) {
                    $scope.meta.deletingScenarioField = false;
                    $scope.meta.deletingScenarioFieldId = undefined;
                    alert(reason);
                }
            );
        };

        $scope.updateScenarioField = function (fieldId, fieldName, fieldData, scenarioId) {
            if (angular.equals(fieldName, 'doNotIndex')) {
                var fieldApiName = '';
                for (var i = 0; i < Object.keys($scope.data.scenarioList[scenarioId].scenarioFields).length; i++) {
                    if ($scope.data.scenarioList[scenarioId].scenarioFields[i].scenarioFieldId == fieldId) {
                        fieldApiName = $scope.data.scenarioList[scenarioId].scenarioFields[i].field;
                    }
                }

                if (0 < fieldApiName.length) {
                    angular.forEach($scope.data.scenarioList, function (value, key) {
                        for (var i = 0; i < Object.keys($scope.data.scenarioList[key].scenarioFields).length; i++) {
                            if ($scope.data.scenarioList[key].scenarioFields[i].field == fieldApiName) {
                                if ($scope.data.scenarioList[key].scenarioFields[i].doNotIndex != fieldData) {
                                    $scope.data.scenarioList[key].scenarioFields[i].doNotIndex = fieldData;
                                    $scope.updateScenarioField($scope.data.scenarioList[key].scenarioFields[i].scenarioFieldId, 'doNotIndex', fieldData, key);
                                }
                            }
                        }
                    });
                }
            }

            if (angular.equals(fieldName, 'matchConfig')) {
                for (var i = 0; i < Object.keys($scope.data.scenarioList[scenarioId].scenarioFields).length; i++) {
                    let scenarioFields = $scope.data.scenarioList[scenarioId].scenarioFields[i];
                    if (scenarioFields.scenarioFieldId == fieldId && ('DATE_DISTANCE_DAYS' == scenarioFields.matchMethod || 'DATE_DISTANCE_WEEKS' == scenarioFields.matchMethod || 'DATE_DISTANCE_MONTHS' == scenarioFields.matchMethod)) {
                        var timePeriod = parseInt(fieldData, 10);
                        if (0 > timePeriod || 10 < timePeriod) {
                            alert('Date Distance Days must be between 0 and 10');
                        }
                    }
                }
            }

            if (angular.equals(fieldData, 'DATE_DISTANCE_DAYS') || angular.equals(fieldData, 'DATE_DISTANCE_WEEKS') || angular.equals(fieldData, 'DATE_DISTANCE_MONTHS')) {
                for (var i = 0; i < Object.keys($scope.data.scenarioList[scenarioId].scenarioFields).length; i++) {
                    if ($scope.data.scenarioList[scenarioId].scenarioFields[i].scenarioFieldId == fieldId) {
                        $scope.data.scenarioList[scenarioId].scenarioFields[i].matchConfig = 0;
                        $scope.updateScenarioField($scope.data.scenarioList[scenarioId].scenarioFields[i].scenarioFieldId, 'matchConfig', $scope.data.scenarioList[scenarioId].scenarioFields[i].matchConfig, scenarioId);
                    }
                }
            }

            if (angular.equals(fieldName, 'synonymList') && angular.isUndefined(fieldData)) {
                fieldData = '';
            }

            if (angular.equals(fieldName, 'frequentList') && angular.isUndefined(fieldData)) {
                fieldData = '';
            }

            if (angular.isUndefined(fieldData)) {
                return;
            }

            var setter = remoting.quadService($rootScope.endpoint.updateScenarioField, $rootScope.data.objectPrefix, fieldId, fieldName, fieldData);
            setter.then(
                function (result) {},
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.updateAction = function (scenarioId) {
            if (angular.isDefined($scope.meta.timer)) {
                $timeout.cancel($scope.meta.timer);
            }
            $scope.meta.timer = $timeout(function () {
                $scope.updateScenario(scenarioId, 'actionList', $scope.data.scenarioList[scenarioId].actionList.join(','));
            }, 1000);
        };

        $scope.updateGrouping = function (scenarioId, scenarioFieldId) {
            var fieldValue;
            for (var i = 0; i < Object.keys($scope.data.scenarioList[scenarioId].scenarioFields).length; i++) {
                if ($scope.data.scenarioList[scenarioId].scenarioFields[i].scenarioFieldId == scenarioFieldId) {
                    fieldValue = $scope.data.scenarioList[scenarioId].scenarioFields[i].indexGroup;
                }
            }

            if (angular.isDefined($scope.meta.timer)) {
                $timeout.cancel($scope.meta.timer);
            }
            $scope.meta.timer = $timeout(function () {
                $scope.updateScenarioField(scenarioFieldId, 'indexGroup', fieldValue, scenarioId);
            }, 1000);
        };
    })

    .controller('recordTypeController', function ($scope, $rootScope, $interval, remoting) {
        //FIXME recordTypeController

        $scope.init = function () {
            $scope.meta = {};
            $scope.meta.loading = false;
            $scope.meta.rtMatchWith = dc3Translate('CHOOSE_WHICH_RECORD_TYPE_TO_MATCH_WITH_WHAT_RECORD_TYPE', 'Choose which record type to match with what record type.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_SETUP_RECORD_TYPES', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_recordtype', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';
            $scope.meta.rtScenario = dc3Translate('CHOOSE_WHICH_SCENARIO_TO_APPLY_TO_WHAT_RECORD_TYPE', 'Choose which scenario to apply to what record type.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_SETUP_RECORD_TYPES', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_recordtype', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';
            $scope.data = {};

            $scope.getConfig();
        };

        $scope.getConfig = function () {
            $scope.meta.loading = true;
            var getter = remoting.singleService($rootScope.endpoint.recordTypeConfig, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    $scope.data.config = result.value;
                    $scope.data.recordTypeScenario = {};
                    $scope.data.recordTypeMatch = {};
                    angular.forEach($scope.data.config.recordTypeConfig, function (v, k) {
                        $scope.data.recordTypeScenario[k] = angular.copy($scope.data.config.scenarioList);
                        $scope.data.recordTypeMatch[k] = angular.copy($scope.data.config.recordTypeList);
                    });

                    $scope.meta.loading = false;
                },
                function (reason) {
                    $scope.meta.loading = false;
                    alert(reason);
                }
            );
        };

        $scope.updateConfig = function (recordTypeId, fieldName) {
            var recordList = [];
            if ('scenarioRecordType' == fieldName) {
                recordList = $scope.data.config.recordTypeConfig[recordTypeId].scenarios;
            } else if ((fieldName = 'matchRecordType')) {
                recordList = $scope.data.config.recordTypeConfig[recordTypeId].matchWith;
            }

            var setter = remoting.quadService($rootScope.endpoint.updateRecordTypeConfig, $rootScope.endpoint.objectPrefix, fieldName, recordTypeId, recordList);
            setter.then(
                function (result) {
                    //$scope.data.config.scenarioList[scenarioId].scenarioFields.push(result.value); why is this line here?
                },
                function (reason) {
                    alert(reason);
                }
            );
        };
    })

    .controller('settingController', function ($scope, $rootScope, $interval, remoting, $cookies, $timeout) {
        //FIXME settingController

        $scope.init = function () {
            $scope.data = {};
            $scope.meta = {};
            $scope.meta.index = {};
            $scope.meta.loading = false;
            $scope.meta.fieldLoading = {};
            $scope.meta.isMergeUniqueListLoading = false;
            $scope.meta.isMergeFieldListLoading = false;
            $scope.meta.deleteObjectModal = false;
            $scope.meta.isIndexFieldLoading = false;
            $scope.meta.referenceOptions = {};
            $scope.meta.CRUDMessage = dc3Translate('ALL_USERS_CAN_MERGE_WHEN_THEY_HAVE_READ_ACCESS_TO_THE_RECORD', 'All users can merge when they have read access to the record');

            var cookieAS = $cookies.showAdvancedSettings;
            if (!empty(cookieAS)) {
                $scope.meta.showAdvanced = 'true' == cookieAS;
            }

            $scope.getConfig();
        };

        $scope.toggleAdvancedSettings = function () {
            $cookies.showAdvancedSettings = $scope.meta.showAdvanced;
            window.recordEvt('Object Setup - Object Settings - Show Advanced Settings Toggle Button Clicked', { tab_name: `${$rootScope.data.objectName} Settings`, source_object: $rootScope.data.objectName });
            window.persistEvt();

            $timeout(
                function () {
                    $scope.$broadcast('rzSliderForceRender');
                },
                0,
                false
            );
        };

        $scope.getConfig = function () {
            $scope.meta.loading = true;
            var getter = remoting.singleServiceEscape($rootScope.endpoint.getSettings, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    if (result.value) {
                        $scope.data.config = result.value;
                        $scope.processIndex();
                        $scope.getRelatedMergeList();
                        $scope.getRelatedMergeUniqueList();
                        $scope.getMergeFieldIgnoreOptions();
                        $scope.getIndexFieldList();
                    }

                    $timeout(
                        function () {
                            $scope.$broadcast('rzSliderForceRender');
                        },
                        0,
                        false
                    );

                    $scope.meta.loading = false;
                },
                function (reason) {
                    $scope.meta.loading = false;
                    alert(reason);
                }
            );
        };

        $scope.processIndex = function () {
            if (-1 < $scope.data.config.indexField.indexOf('object:')) {
                $scope.meta.index.showObject = true;
                $scope.data.config.indexCustomObject = $scope.data.config.indexField.split(':')[1];

                var getter = remoting.singleService($rootScope.endpoint.indexObject, $scope.data.config.indexCustomObject);
                getter.then(
                    function (result) {
                        $scope.meta.index.selectValues = result.value;
                    },
                    function (reason) {
                        alert(reason);
                    }
                );
            } else {
                $scope.meta.index.showObject = false;
                $scope.data.config.indexCustomIndexField = '';
                $scope.data.config.indexCustomRecordTypeField = '';
            }
        };

        $scope.updateSetting = function (fieldName, callback) {
            if ($scope.meta.loading) {
                // Prevent race conditions when saving multiple values
                return;
            }

            $scope.meta.loading = true;
            $scope.meta.fieldLoading[fieldName] = true;

            var updateValue = $scope.data.config[fieldName];
            if (angular.isArray(updateValue)) {
                updateValue = updateValue.join(';');
            }

            if (angular.equals(fieldName, 'crossObject')) {
                $rootScope.endpoint.crossObjectEnabled = updateValue;
            }

            if (angular.equals(fieldName, 'indexCreate')) {
                $rootScope.endpoint.advancedMatchingEnabled = updateValue;
            }

            const getter = remoting.tripleService($rootScope.endpoint.updateConfigField, $rootScope.endpoint.objectPrefix, fieldName, updateValue);
            getter.then(
                function (result) {
                    //loading handeling?
                    $scope.meta.fieldLoading[fieldName] = false;
                    $scope.meta.loading = false;

                    if ('indexCreate' === fieldName && updateValue) {
                        sforce.one.showToast({
                            message: 'Please run the `Create Search Index` job on `Index Batch` tab to activate this setting.',
                            type: 'info',
                            mode: 'sticky'
                        });
                    }
                    if ('hierarchyEnabled' === fieldName && updateValue) {
                        sforce.one.showToast({
                            message: 'Please run the `Create Incremental Hierarchy Index` job on `Index Batch` tab to activate this setting.',
                            type: 'info',
                            mode: 'sticky'
                        });
                    }
                    if ('function' === typeof callback) {
                        callback();
                    }
                },
                function (reason) {
                    $scope.meta.fieldLoading[fieldName] = false;
                    $scope.meta.loading = false;
                    alert(reason);
                }
            );
        };

        $scope.$on('slideEnded', function (evt) {
            var type = evt.targetScope.slider.options.customTemplateScope.type;
            $scope.updateSetting(type);
        });

        $scope.sliderOptions = function (fieldName) {
            return {
                floor: 1,
                ceil: 'batchDedupChunkSize' == fieldName ? 10 : 100,
                step: 1,
                onEnd: function (id) {
                    $scope.updateSetting(fieldName);
                }
            };
        };

        $scope.getObjectFilterOptions = function () {
            $scope.meta.isObjectFilterLoading = true;
            var getter = remoting.singleServiceEscape($rootScope.endpoint.getObjectFilterOptions, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    $scope.meta.objectFilterFieldMap = result.value;

                    var listF = [];
                    angular.forEach(result.value, function (v, k) {
                        listF.push(v);
                    });
                    $scope.meta.objectFilterOptions = listF;

                    $scope.meta.isObjectFilterLoading = false;
                },
                function (reason) {
                    $scope.meta.isObjectFilterLoading = false;
                    alert(reason);
                }
            );
        };

        $scope.getMergeFieldIgnoreOptions = function () {
            $scope.meta.isMergeFieldListLoading = true;
            var getter = remoting.singleServiceEscape($rootScope.endpoint.getMergeFieldIgnoreOptions, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    $scope.meta.mergeFieldIgnoreOptions = result.value;
                    $scope.meta.isMergeFieldListLoading = false;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.getRelatedMergeList = function (prefix) {
            if ('001' == $rootScope.data.objectPrefix || '003' == $rootScope.data.objectPrefix || '00Q' == $rootScope.data.objectPrefix || '001P' == $rootScope.data.objectPrefix) {
                $scope.meta.isMergeListLoading = false;
                return;
            }

            var getter = remoting.singleServiceEscape($rootScope.endpoint.getRelatedMergeList, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    $scope.meta.relatedMergeList = result.value;
                    $scope.meta.isMergeListLoading = false;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.getRelatedMergeUniqueList = function (prefix) {
            $scope.meta.isMergeUniqueListLoading = true;
            if ('001' == $rootScope.data.objectPrefix || '003' == $rootScope.data.objectPrefix || '00Q' == $rootScope.data.objectPrefix || '001P' == $rootScope.data.objectPrefix) {
                $scope.meta.isMergeUniqueListLoading = false;
                return;
            }

            var getter = remoting.singleServiceEscape($rootScope.endpoint.getRelatedMergeUniqueList, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    $scope.meta.relatedMergeUniqueList = result.value;
                    $scope.meta.isMergeUniqueListLoading = false;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.changeFilterType = function () {
            if ('NONE' == $scope.data.config.filterType) {
                $scope.data.config.filterValue = undefined;
                $scope.data.config.filterField = undefined;
            }

            if ('V' == $scope.data.config.filterType || 'Z' == $scope.data.config.filterType) {
                $scope.data.config.filterValue = undefined;
            }
            $scope.updateFilter();
        };

        $scope.changeFilterField = function () {
            $scope.data.config.filterValue = undefined;
            $scope.updateFilter();
        };

        $scope.changeFilterValue = function () {
            $scope.updateFilter();
        };

        $scope.updateFilter = function () {
            console.log('update filter');
            console.log($scope.data.config.filterField);
            if ($scope.data.config.filterField && 'BOOLEAN' == $scope.meta.objectFilterFieldMap[$scope.data.config.filterField].Type) {
                if ($scope.data.config.filterValue == undefined) {
                    $scope.data.config.filterValue = true;
                }
            }
            var filterData = $scope.data.config.filterType + ';';

            if (angular.isDefined($scope.data.config.filterField)) {
                filterData = filterData + $scope.data.config.filterField + ';';
            }

            if (('V' == $scope.data.config.filterType || 'Z' == $scope.data.config.filterType) && $scope.data.config.filterValue != undefined) {
                filterData = filterData + $scope.data.config.filterValue + ';';
            }

            var setter = remoting.tripleServiceEscape($rootScope.endpoint.updateConfigField, $rootScope.endpoint.objectPrefix, 'filter', filterData);
            setter.then(
                function (result) {
                    //loading handeling?
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.getIndexFieldList = function (prefix) {
            $scope.meta.isIndexFieldLoading = true;
            var getter = remoting.singleServiceBuffer($rootScope.endpoint.getIndexFieldList, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    if (result.value) {
                        $scope.meta.indexFieldList = result.value;
                        $scope.meta.isIndexFieldLoading = false;
                    }
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.updateIndex = function () {
            $scope.updateSetting('indexField', () => {
                $scope.getConfig();
            });
        };

        $scope.deleteObject = function () {
            var setter = remoting.singleService($rootScope.endpoint.deleteObject, $rootScope.endpoint.configId);
            setter.then(
                function (result) {
                    dcNavigate($rootScope.endpoint.currentPage, '');
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.getLookup = function (relatedObject, searchText, optionalFields, configField) {
            if ('RecordType' == relatedObject) {
                relatedObject = relatedObject + '.' + $rootScope.data.objectPrefix;
            }

            angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

            console.log(' Object: ' + relatedObject);
            console.log(searchText);
            console.log(optionalFields);

            remoting.tripleService($rootScope.endpoint.relatedTypeAhead, relatedObject, searchText, optionalFields).then(
                function (result) {
                    console.log(result);
                    $scope.meta.referenceOptions[configField] = result;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };
    })

    .controller('resultFieldController', function ($scope, $rootScope, $interval, remoting, $filter) {
        //FIXME resultFieldController

        $scope.init = function () {
            $scope.data = {};
            $scope.data.headerList = [];
            $scope.data.mainList = [];
            $scope.data.fieldList = [];

            $scope.meta = {};
            $scope.meta.selectedRemove = {};
            $scope.meta.selectedAdd = {};
            $scope.meta.search = '';
            $scope.meta.loading = true;

            $scope.getConfig();
        };

        $scope.getConfig = function (prefix) {
            $scope.meta.loading = true;
            var getter = remoting.singleServiceEscape($rootScope.endpoint.getResultField, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    if (result.value) {
                        $scope.data.config = result.value;
                        defaults();
                    }
                },
                function (reason) {
                    $scope.meta.loading = false;
                    alert(reason);
                }
            );
        };

        var defaults = function () {
            if (empty($scope.data.config)) {
                return;
            }

            $scope.data.availableFields = $scope.data.config.fieldSelect;
            angular.forEach($scope.data.config.resultField, function (v, k) {
                delete $scope.data.availableFields[v.fieldName];
            });
            $scope.data.originalAvailableFields = $scope.data.availableFields;
            $scope.meta.loading = false;
        };

        $scope.moveField = function (field, remove) {
            if (remove) {
                for (var i = 0; i < $scope.data.config.resultField.length; i++) {
                    if ($scope.data.config.resultField[i].fieldName == field.fieldName) {
                        $scope.data.config.resultField.splice(i, 1);
                        $scope.data.availableFields[field.fieldName] = {label: field.fieldLabel, value: field.fieldName};
                        break;
                    }
                }
                delete $scope.meta.selectedRemove[field.fieldName];
            } else {
                delete $scope.data.availableFields[field.value];
                $scope.data.config.resultField.push({fieldLabel: field.label, fieldName: field.value});
                delete $scope.meta.selectedAdd[field.value];
            }
        };

        $scope.highlightField = function (field, remove) {
            //faster than forEach and allows break
            if (remove) {
                for (var i = 0; i < $scope.data.config.resultField.length; i++) {
                    if ($scope.data.config.resultField[i].fieldName == field.fieldName) {
                        $scope.data.config.resultField[i].selected = !$scope.data.config.resultField[i].selected;
                        //if else structure to allow multiple moveTop() without screwing up the order of previous selected fields
                        if (!$scope.data.config.resultField[i].selected) {
                            delete $scope.meta.selectedRemove[field.fieldName];
                        } else {
                            $scope.meta.selectedRemove[field.fieldName] = {
                                fieldName: field.fieldName,
                                fieldLabel: field.fieldLabel,
                                selected: $scope.data.config.resultField[i].selected
                            };
                        }
                        break;
                    }
                }
            } else {
                $scope.data.availableFields[field.value].selected = !$scope.data.availableFields[field.value].selected;
                if (!$scope.data.availableFields[field.value].selected) {
                    delete $scope.meta.selectedAdd[field.value];
                } else {
                    $scope.meta.selectedAdd[field.value] = {
                        value: field.value,
                        label: field.label,
                        selected: $scope.data.availableFields[field.value].selected
                    };
                }
            }
        };

        $scope.$watchCollection(
            'data.config.resultField',
            function (n, o) {
                if (n !== o && angular.isDefined(o)) {
                    //prevents an update when page is loaded
                    var fieldOrder = {};
                    var position = 0;
                    angular.forEach(n, function (v, k) {
                        fieldOrder[v.fieldName] = position;
                        position++;
                    });

                    var setter = remoting.doubleService($rootScope.endpoint.updateResultField, $rootScope.endpoint.objectPrefix, fieldOrder);
                    setter.then(
                        function (result) {},
                        function (reason) {
                            alert(reason);
                        }
                    );
                }
            },
            true
        );

        $scope.horizontalMove = function (remove) {
            var moveObject;
            remove ? (moveObject = $scope.meta.selectedRemove) : (moveObject = $scope.meta.selectedAdd);

            if (empty(moveObject)) {
                return;
            }
            angular.forEach(moveObject, function (v, k) {
                $scope.moveField(v, remove);
            });
        };

        $scope.verticalMove = function (top, down) {
            if (1 < Object.keys($scope.meta.selectedRemove).length && !top) {
                alert(dc3Translate('PLEASE_SELECT_A_SINGLE_FIELD_TO_MOVE_A_SINGLE_SPACE_UP_OR_DOWN', 'Please select a single field to move a single space up or down'));
                return;
            }

            var position = 0;
            var object = [];

            angular.forEach($scope.meta.selectedRemove, function (v, k) {
                var index = $scope.data.config.resultField
                    .map(function (x) {
                        return x.fieldName;
                    })
                    .indexOf(k);
                $scope.data.config.resultField.splice(index, 1);
                if (top) {
                    $scope.data.config.resultField.splice(position, 0, v);
                    position++;
                } else if (down) {
                    index == $scope.data.config.resultField.length ? (position = 0) : (position = index + 1);
                    $scope.data.config.resultField.splice(position, 0, v);
                } else {
                    0 == index ? $scope.data.config.resultField.push(v) : $scope.data.config.resultField.splice(index - 1, 0, v);
                }
            });
        };

        $scope.filterAvailableList = function () {
            var fieldFiltered = {};
            angular.forEach($scope.data.availableFields, function (v, k) {
                angular.forEach(v, function (vv, kk) {
                    if (('label' == kk || 'value' == kk) && -1 !== vv.toLowerCase().indexOf($scope.meta.search)) {
                        fieldFiltered[k] = v;
                    }
                });
            });
        };
    })

    .controller('crossObjectController', function ($scope, $rootScope, $interval, remoting) {
        //FIXME crossObjectController

        $scope.init = function () {
            $scope.meta = {};
            $scope.meta.info = dc3Translate('ONLY_FIELDS_THAT_ARE_DEFINED_IN_SCENARIOS_ARE_AVAILABLE_FOR_MAPPING', 'Only fields that are defined in your scenarios are available for mapping');
            $scope.meta.deleteObjectModal = false;
            $scope.meta.addObjectModal = false;
            $scope.meta.open = [];
            $scope.meta.loading = true;
            $scope.data = {};

            $scope.Utils = {
                keys: Object.keys
            };

            $scope.getConfig();
        };

        $scope.getConfig = function () {
            var getter = remoting.singleService($rootScope.endpoint.getCrossObject, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    $scope.data.config = result.value;
                    $scope.meta.crossObjectLength = Object.keys($scope.data.config.crossConfig).length;
                    getFieldDropDown($rootScope.data.objectPrefix, false);
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.addField = function (prefix) {
            //apex calls. add loading to UI?
            var fieldMapping = {};

            fieldMapping.fromField = null;
            fieldMapping.toField = null;
            fieldMapping.fieldId = '';

            $scope.data.config.crossConfig[prefix].fieldMapping.push(fieldMapping);
        };

        var getFieldDropDown = function (prefix, add) {
            var inputArray = [];
            inputArray.push(prefix);
            var getter = remoting.singleServiceEscape($rootScope.endpoint.getCrossObjectFieldOptions, inputArray);
            getter.then(
                function (result) {
                    $scope.data.config.fieldSelect[prefix] = result.value[prefix];
                    $scope.meta.open[prefix] = true;
                    if (add) {
                        $scope.addField(prefix);
                    } else {
                        $scope.meta.fieldDefined = 0 < Object.keys($scope.data.config.fieldSelect[$rootScope.data.objectPrefix]).length;
                    }
                    $scope.meta.loading = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.loading = false;
                }
            );
        };

        $scope.toggleAddObject = function () {
            var getter = remoting.singleService($rootScope.endpoint.getCrossObjectOptions, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    addObjectProcess(result.value);
                    window.recordEvt('Object Setup - Cross Objcet - Add cross Object button clicked')
                    window.persistEvt()
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.deleteObject = function (prefix) {
            var setter = remoting.doubleService($rootScope.endpoint.deleteCrossObject, $rootScope.data.objectPrefix, prefix);
            setter.then(
                function (result) {
                    delete $scope.data.config.crossConfig[prefix];
                    $scope.meta.crossObjectLength = Object.keys($scope.data.config.crossConfig).length;
                    $scope.meta.deleteObjectModal = false;
                },
                function (reason) {
                    $scope.meta.deleteObjectModal = false;
                    alert(reason);
                }
            );
        };

        $scope.toggleDeleteObject = function (name, prefix) {
            $scope.meta.deleteName = name;
            $scope.meta.deletePrefix = prefix;
            $scope.meta.deleteObjectModal = true;
        };

        var addObjectProcess = function (options) {
            if (0 == options.length) {
                alert(dc3Translate('THERE_ARE_NO_OBJECT_TO_CONFIGURE_CROSS_OBJECT_PLEASE_SELECT_OBJECT', 'There are no objects to configure cross object with. Please configure an object first.'));
            } else if (1 == options.length) {
                addObjectFinal(options[0]);
                $scope.meta.crossObjectLength = 1; //length does not have to be accurate, just > 0
            } else {
                $scope.meta.addObjectModal = true;
                $scope.data.newObjectSelect = options[0];
                $scope.data.newObjectList = options;
            }
        };

        $scope.addObjectSelect = function () {
            angular.forEach($scope.data.newObjectList, function (v, k) {
                if (v.objectPrefix == $scope.data.newObjectSelect) {
                    addObjectFinal(v);
                    $scope.data.newObjectList = [];
                    
                }
            });
            $scope.meta.addObjectModal = false;
            $scope.meta.crossObjectLength = 1; //length does not have to be accurate, just > 0
        };

        var addObjectFinal = function (objectData) {
            objectData.fieldMapping = [];
            $scope.data.config.crossConfig[objectData.objectPrefix] = objectData;
            getFieldDropDown(objectData.objectPrefix, true);
        };

        $scope.deleteField = function (prefix, index) {
            var field = $scope.data.config.crossConfig[prefix].fieldMapping[index];
            if (!empty(field.fieldId)) {
                var setter = remoting.tripleService($rootScope.endpoint.deleteCrossObjectField, $rootScope.data.objectPrefix, prefix, field.fieldId);
                setter.then(
                    function (result) {
                        $scope.data.config.crossConfig[prefix].fieldMapping.splice(index, 1);
                    },
                    function (reason) {
                        alert(reason);
                    }
                );
            } else {
                $scope.data.config.crossConfig[prefix].fieldMapping.splice(index, 1);
            }
        };

        $scope.updateField = function (prefix, index) {
            var field = $scope.data.config.crossConfig[prefix].fieldMapping[index];
            if (!empty(field.fromField) && !empty(field.toField)) {
                var setter = remoting.quintService($rootScope.endpoint.insertUpdateCrossObjectField, $rootScope.data.objectPrefix, prefix, field.fromField, field.toField, field.fieldId);
                setter.then(
                    function (result) {
                        $scope.data.config.crossConfig[prefix].fieldMapping[index].fieldId = result.value;
                    },
                    function (reason) {
                        alert(reason);
                    }
                );
            }
        };
    })

    .controller('mergeController', function ($scope, $rootScope, $interval, remoting, $timeout, $cookies) {
        //FIXME mergeController

        $scope.init = function () {
            $scope.data = {};
            $scope.meta = {};
            $scope.meta.text = [
                {label: dc3Translate('SHORTEST_VALUE', 'Shortest Value'), value: 'SHORTEST'},
                {label: dc3Translate('LONGEST_VALUE', 'Longest Value'), value: 'LONGEST'}
            ];
            $scope.meta.number = [
                {label: dc3Translate('MINIMUM_VALUE', 'Minimum Value'), value: 'MIN'},
                {label: dc3Translate('MAXIMUM_VALUE', 'Maximum Value'), value: 'MAX'}
            ];
            $scope.meta.boo = [
                {label: dc3Translate('TRUE_OVER_FALSE', 'True over False'), value: 'SHORTEST'},
                {label: dc3Translate('FALSE_OVER_TRUE', 'False over True'), value: 'LONGEST'}
            ];
            $scope.meta.booAlt = [
                {label: dc3Translate('GENERAL_RULE', 'General Rule'), type: 'Record Based Rules', value: 'GENERAL'},
                {label: dc3Translate('LAST_MODIFIED', 'last Modified'), type: 'Record Based Rules', value: 'LATEST-MODIFIED'},
                {
                    label: dc3Translate('OLDEST_MODIFIED', 'Oldest Modified'),
                    type: 'Record Based Rules',
                    value: 'OLDEST-MODIFIED'
                },
                {label: dc3Translate('LAST_CREATED', 'Last Created'), type: 'Record Based Rules', value: 'LATEST-CREATED'},
                {
                    label: dc3Translate('OLDEST_CREATED', 'Oldest Created'),
                    type: 'Record Based Rules',
                    value: 'OLDEST-CREATED'
                },
                {label: dc3Translate('TRUE_OVER_FALSE', 'True over False'), type: 'Field Based Rules', value: 'SHORTEST'},
                {label: dc3Translate('FALSE_OVER_TRUE', 'False over True'), type: 'Field Based Rules', value: 'LONGEST'}
            ];
            $scope.meta.moment = [
                {label: dc3Translate('OLDEST_VALUE', 'Oldest Value'), value: 'OLDEST'},
                {label: dc3Translate('LATEST_VALUE', 'Latest Value'), value: 'LATEST'}
            ];
            $scope.meta.list = [
                {label: dc3Translate('PICKLIST_FIRST', 'Picklist First'), value: 'LIST-ASC'},
                {label: dc3Translate('PICKLIST_LAST', 'Picklist Last'), value: 'LIST-DESC'}
            ];
            $scope.meta.loading = false;
            $scope.meta.referenceOptions = {};
            $scope.meta.objectLabel = dc3Translate('FIELD_VALUE', 'Field Value');
            $scope.meta.fallbackApply = [
                {label: 'All Records', value: 'ALL'},
                {label: 'Records Selected By General Rule', value: 'GENERAL'}
            ];
            $scope.getConfig();

            var cookieRO = $cookies.showReadOnlyFields;
            if (!empty(cookieRO)) {
                $scope.meta.readOnlyFields = 'true' == cookieRO;
            }
        };

        $scope.toggleReadOnly = function () {
            $cookies.showReadOnlyFields = $scope.meta.readOnlyFields;
        };

        $scope.getLookup = function (relatedObject, searchText, field, optionalFields) {
            if ('RecordType' == relatedObject) {
                relatedObject = relatedObject + '.' + $rootScope.data.objectPrefix;
            }

            angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

            var getter = remoting.tripleService($rootScope.endpoint.getRelatedData, relatedObject, searchText, optionalFields);
            getter.then(
                function (result) {
                    $scope.meta.referenceOptions[field] = result;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.selectFieldMerge = function () {
            $scope.meta.filter = {};
            var field = $scope.data.config.generalMergeField;
            if (empty(field)) {
                return;
            }

            var fieldMeta = $scope.data.config.fieldMeta[field];

            $scope.meta.filter.fieldType = fieldMeta.Type;
            if ('PICKLIST' == $scope.meta.filter.fieldType || 'MULTIPICKLIST' == $scope.meta.filter.fieldType) {
                $scope.meta.filter.selectList = fieldMeta.selectList;
            } else if ('REFERENCE' == $scope.meta.filter.fieldType) {
                $scope.meta.filter.referenceTo = fieldMeta.RelatedObjectMeta;
            } else if ('DATE' == $scope.meta.filter.fieldType || 'DATETIME' == $scope.meta.filter.fieldType) {
                var model = $scope.data.config.generalMergeFieldValue;
                $scope.data.config.generalMergeFieldValue = moment(model).toDate();
            }

            $scope.meta.filter.fieldLength = 0 != fieldMeta.Length ? fieldMeta.Length : 200;
        };

        $scope.$watch('data.config.generalMergeRule', function (n, o) {
            if ('VALUE' == n && 'VALUE' != o) {
                $scope.selectFieldMerge();
            }
        });

        $scope.$watch('data.config.generalMergeField', function (n, o) {
            if (angular.isDefined(o)) {
                $scope.data.config.generalMergeFieldValue = undefined;
                $scope.data.config.generalMergeFieldLabel = undefined;
            }
        });

        $scope.updateGeneralMerge = function () {
            var rule = $scope.data.config.generalMergeRule;
            var model = $scope.data.config.generalMergeFieldValue;

            if ('FIELD' == rule) {
                if (empty($scope.data.config.generalMergeField) || empty($scope.data.config.generalMergeFieldRule)) {
                    return;
                }

                rule = 'FIELD;' + $scope.data.config.generalMergeField + ';' + $scope.data.config.generalMergeFieldRule;
            } else if ('VALUE' == rule) {
                if (empty($scope.data.config.generalMergeField) || empty(model)) {
                    return;
                }

                if (model instanceof Date) {
                    model = model.toJSON();
                } else if (-1 != model.indexOf(';')) {
                    alert(dc3Translate('FIELD_VALUE_CANNOT_CONTAIN_PERCENTAGE_CHARACTER', "Field Value cannot contain the ';' character."));
                    return;
                }

                rule = 'VALUE;' + $scope.data.config.generalMergeField + ';' + model;
            }

            var setter = remoting.tripleService($rootScope.endpoint.updateConfigField, $rootScope.endpoint.objectPrefix, 'mergeRule', rule);
            setter.then(
                function (result) {},
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.updateFallbackMerge = function () {
            var setter = remoting.tripleService($rootScope.endpoint.updateConfigField, $rootScope.endpoint.objectPrefix, 'mergeFallback', $scope.data.config.fallbackMergeRule);
            setter.then(
                function (result) {},
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.updateFallbackMergeApply = function () {
            var setter = remoting.tripleService($rootScope.endpoint.updateConfigField, $rootScope.endpoint.objectPrefix, 'mergeFallbackApply', $scope.data.config.fallbackMergeRuleApply);
            setter.then(
                function (result) {},
                function (reason) {
                    alert(reason);
                }
            );
        };
    })

    .controller('directController', function ($scope, $rootScope, $interval, remoting, $timeout) {
        //FIXME directController

        $scope.init = function () {
            $scope.meta = {};
            $scope.meta.loading = false;
            $scope.data = {};
            $scope.meta.sliderWarning = false;
            $scope.meta.slider = {options: {floor: 1, ceil: 100, step: 1}};
            $scope.meta.applyMerge = [
                {value: 'onInsert', label: 'API / Apex Insert'},
                {value: 'onUpdate', label: 'API / Apex Update'},
                {value: 'onUpload', label: 'Unique Import / API Bulk Insert'},
                {value: 'onApi', label: 'Deduplicate Apex API'},
                {value: 'onFlow', label: 'Flow'}
            ];
            '00Q' == $rootScope.data.objectPrefix ? $scope.meta.applyMerge.push({value: 'onWeb2Lead', label: 'Web-to-Lead'}) : '';
            $scope.meta.applyConvert = $scope.meta.applyMerge;

            $scope.getConfig();
        };

        $scope.getConfig = function () {
            $scope.meta.loading = true;
            var getter = remoting.singleService($rootScope.endpoint.getSettings, $rootScope.data.objectPrefix);
            getter.then(
                function (result) {
                    $scope.data.config = result.value;
                    if (angular.isUndefined($scope.data.config.directConvertStatus)) {
                        $scope.data.config.directConvertStatus = $scope.data.config.convertStatusList[0].MasterLabel;
                    }
                    $scope.meta.loading = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.loading = false;
                }
            );
        };

        $scope.$watch('data.config.directConvertOn', function (n, o) {
            if(n.length !== o.length) {
                window.recordEvt('DC Object Setup - Direct processing- Applying Direct Convert picklist clicked', { apply_on: n.join(', ') });
                window.persistEvt();
            }
        }, true);
     
        $scope.$watch('data.config.directMergeOn', function (n, o) {
            if(n.length !== o.length) {
                window.recordEvt('DC Object Setup - Direct Processing - Applying Direct Merge picklist clicked', { apply_on: n.join(', ') });
                window.persistEvt();
            }
            }, true);

        $scope.updateSetting = function (fieldName) {
            var updateValue = $scope.data.config[fieldName];
            
            if (angular.isArray(updateValue)) {
                updateValue = updateValue.join(';');

                if (angular.isDefined($scope.meta.timer)) {
                    $timeout.cancel($scope.meta.timer);
                }
                $scope.meta.timer = $timeout(function () {
                    $scope.updateSettingCall(fieldName, updateValue);
                }, 1000);
            } else {
                $scope.updateSettingCall(fieldName, updateValue);
            }
        };

        $scope.updateSettingCall = function (fn, uv) {
            var setter = remoting.tripleService($rootScope.endpoint.updateConfigField, $rootScope.endpoint.objectPrefix, fn, uv);
            setter.then(
                function (result) {},
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.$on('slideEnded', function (evt) {
            $scope.meta.type = evt.targetScope.slider.options.customTemplateScope.type;
            window.recordEvt(`Object Setup - Direct processing - ${'directMergeThreshold' == $scope.meta.type ? 'Merge' : 'Convert'} setting - Threshold change`, { threshold_percentage: $scope.data.config[$scope.meta.type] });
            window.persistEvt();

            if (90 > $scope.data.config[$scope.meta.type]) {
                $scope.$apply(function () {
                    //apply needed to update view. weird behaviour and shouldn't be necessary
                    $scope.meta.sliderWarning = true;
                    'directMergeThreshold' == $scope.meta.type ? ($scope.meta.autoProcess = 'Merging') : ($scope.meta.autoProcess = 'Converting');
                });
            } else {
                $scope.updateSetting($scope.meta.type);
            }
        });

        $scope.applyThreshold = function (apply) {
            if (apply) {
                $scope.updateSetting($scope.meta.type);
            } else {
                'directMergeThreshold' == $scope.meta.type ? ($scope.data.config.directMergeThreshold = 100) : ($scope.data.config.directConvertThreshold = 100);
                $scope.updateSetting($scope.meta.type);
            }
            $scope.meta.sliderWarning = false;
        };
    })

    .controller('searchIndexController', function ($scope, $rootScope, $interval, remoting, $window) {
        //FIXME searchIndexController

        $scope.init = function () {
            $scope.meta = {};
            $scope.meta.currentPage = 1;
            $scope.meta.indexing = false;
            $scope.meta.loading = false;
            $scope.data = {};
            $scope.openDropdownButton = '';

            getJobList();
            startPollingService();
            setupCloseButtonEvent();
        };

        var setupCloseButtonEvent = function () {
            $window.addEventListener('mouseup', function () {
                $scope.openDropdownButton = '';
            });
        };

        $scope.toggleOpenDropdownButton = function (buttonName, $event) {
            $event.stopPropagation();
            $event.currentTarget.blur();
            console.log($scope.openDropdownButton);
            if (buttonName == $scope.openDropdownButton) {
                $scope.openDropdownButton = '';
                return;
            }

            $scope.openDropdownButton = buttonName;
        };

        var getJobList = function () {
            $scope.meta.loading = true;
            var getter = remoting.doubleService($rootScope.endpoint.getJobListByPage, $rootScope.data.objectPrefix, $scope.meta.currentPage);
            getter.then(
                function (result) {
                    builtJobList(result);
                },
                function (reason) {
                    $scope.meta.loading = false;
                    alert(reason);
                }
            );
        };

        var pollingService;
        var startPollingService = function () {
            $interval.cancel(pollingService);
            pollingService = $interval(function () {
                var getter = remoting.doubleService($rootScope.endpoint.getJobListByPage, $rootScope.data.objectPrefix, $scope.meta.currentPage);
                getter.then(
                    function (jobList) {
                        builtJobList(jobList);
                    },
                    function (reason) {
                        alert(reason);
                    }
                );
            }, 5000);
        };

        var builtJobList = function (jobData) {
            $scope.data.jobList = jobData.value.jobList;
            $scope.meta.indexCreate = jobData.value.indexCreate;
            $scope.meta.localIndexCreate = jobData.value.localIndexCreate;
            $scope.meta.allowIncremental = jobData.value.allowIncremental;
            $scope.meta.allowHierarchy = jobData.value.allowHierarchy;
            $scope.meta.totalItems = jobData.totalPages;

            var isActive = false;
            angular.forEach($scope.data.jobList, function (v, k) {
                if ('Holding' == v.status || 'Processing' == v.status || 'Queued' == v.status || 'Preparing' == v.status) {
                    isActive = true;
                }
            });

            if (false == isActive) {
                $interval.cancel(pollingService);
            }
            $scope.meta.loading = false;
        };

        $scope.startIndex = function (incremental) {
            $scope.openDropdownButton = '';
            $scope.meta.indexing = true;
            var setter = remoting.doubleService($rootScope.endpoint.startIndexJob, $rootScope.data.objectPrefix, incremental);
            setter.then(
                function (result) {
                    getJobList();
                    startPollingService();
                    $scope.meta.indexing = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.indexing = false;
                }
            );
        };

        $scope.createAccountHierarchyIndex = function (incremental) {
            $scope.openDropdownButton = '';
            $scope.meta.hierarchy = true;
            var setter = remoting.doubleService($rootScope.endpoint.createAccountHierarchyIndex, $rootScope.data.objectPrefix, incremental);
            setter.then(
                function (result) {
                    getJobList();
                    startPollingService();
                    $scope.meta.hierarchy = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.hierarchy = false;
                }
            );
        };

        $scope.createLocalIndexJob = function (incremental, runInCloud) {
            console.log('creating local index job');
            $scope.meta.indexing = true;
            var setter = remoting.tripleService($rootScope.endpoint.createLocalIndexJob, $rootScope.data.objectPrefix, incremental, runInCloud);
            setter.then(
                function (result) {
                    getJobList();
                    $scope.meta.indexing = false;
                    if (!runInCloud) {
                        $scope.modal = {};
                        $scope.modal.modalDCLocal = true;
                    }
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.indexing = false;
                }
            );
        };

        $scope.openUrlNew = function (url) {
            dcNavigateNew(url, '');
        };

        $scope.deleteIndex = function () {
            $scope.meta.indexing = true;
            var setter = remoting.singleService($rootScope.endpoint.deleteIndexJob, $rootScope.data.objectPrefix);
            setter.then(
                function (result) {
                    getJobList();
                    startPollingService();
                    $scope.meta.indexing = false;
                },
                function (reason) {
                    $scope.meta.indexing = false;
                    alert(reason);
                }
            );
        };

        $scope.abortJob = function (jobId) {
            var setter = remoting.singleService($rootScope.endpoint.abortJob, jobId);
            setter.then(
                function (result) {
                    getJobList();
                    startPollingService();
                },
                function (reason) {
                    alert(reason);
                }
            );
        };
    })

    .controller('predefinedFilterController', function ($scope, $rootScope, remoting, $timeout) {
        $scope.loadFilters = function () {
            remoting.singleServiceEscape($rootScope.endpoint.getFilterList, $rootScope.data.objectPrefix).then(
                function (result) {
                    //for (var filter of result.value){
                    for (var i = 0; i < result.value.length; i++) {
                        var filter = result.value[i];

                        //for (var rule of filter.rules){
                        for (var j = 0; j < filter.rules.length; j++) {
                            var rule = filter.rules[j];

                            if ('PICKLIST' == rule.fieldType) {
                                if (rule.field.endsWith('StateCode') || rule.field.endsWith('CountryCode')) {
                                    rule.fieldType = 'STRING';
                                }
                            }

                            if (rule.value) {
                                if ('DATE' == rule.fieldType && !$scope.isDateLiteral(rule.expression)) {
                                    let year = rule.value.substring(0, 4);
                                    let month = rule.value.substring(5, 7);
                                    let day = rule.value.substring(8, 10);
                                    let d = new Date(year, month - 1, day);
                                    d.setHours(0);
                                    d.setMinutes(0);
                                    d.setSeconds(0);
                                    d.setMilliseconds(0);
                                    rule.value = d;
                                } else if ('DATETIME' == rule.fieldType && !$scope.isDateLiteral(rule.expression)) {
                                    let year = rule.value.substring(0, 4);
                                    let month = rule.value.substring(5, 7);
                                    let day = rule.value.substring(8, 10);
                                    let hours = rule.value.substring(11, 13);
                                    let minutes = rule.value.substring(14, 16);
                                    let d = new Date(year, month - 1, day);
                                    d.setHours(hours);
                                    d.setMinutes(minutes);
                                    d.setSeconds(0);
                                    d.setMilliseconds(0);
                                    rule.value = d;
                                } else if ('MULTIPICKLIST' == rule.fieldType) {
                                    rule.value = JSON.parse(rule.value);
                                }
                            }
                        }
                        console.log(filter);
                    }

                    $scope.filters = result.value;
                    $scope.meta.loading = false;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.loadFields = function () {
            remoting.singleServiceEscape($rootScope.endpoint.getFilterFields, $rootScope.data.objectPrefix).then(
                function (result) {
                    $scope.data.fieldList = result.value;
                    console.log(result.value);
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.loadExpressions = function () {
            remoting.singleService($rootScope.endpoint.getFilterExpressionList, $rootScope.data.objectPrefix).then(
                function (result) {
                    $scope.data.expressions = result.value;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.init = function () {
            $scope.meta = {};
            $scope.meta.loading = true;
            $scope.filters = [];
            $scope.data = {};
            $scope.data.fieldList = [];
            $scope.data.expressions = [];
            $scope.loadFilters();
            $scope.loadFields();
            $scope.loadExpressions();
            $scope.searchText = '';
            $scope.emptyArray = [];
            $rootScope.data.objectName = $rootScope.endpoint.objectName;
        };

        $scope.openNewFilterModal = function () {
            $scope.newFilterName = null;
            $scope.meta.addFilterModal = true;
        };

        $scope.addNewFilter = function () {
            $scope.meta.addFilterModal = false;
            $scope.meta.loading = true;

            remoting.doubleServiceEscape($rootScope.endpoint.addFilter, $rootScope.endpoint.configId, $scope.newFilterName).then(
                function (result) {
                    result.value.rules = [];
                    $scope.filters.push(result.value);
                    $scope.meta.loading = false;
                    window.recordEvt('DC Object Setup - Predefined Filters - Add Filter modal - Add button clicked');
                    window.persistEvt();
                },
                function (reason) {
                    $scope.meta.loading = false;
                    alert(reason);
                }
            );
        };

        $scope.updateFilter = function (filter) {
            $scope.meta.loading = true;
            let input = {
                Id: filter.id,
                configId: filter.configId,
                filterName: filter.filterName,
                queryLogic: filter.queryLogic,
                apiName: filter.apiName
            };

            remoting.singleServiceEscape($rootScope.endpoint.updateFilter, input).then(
                function (result) {
                    filter.query = result.value.query;
                    filter.queryLogic = result.value.queryLogic;
                    $scope.meta.loading = false;
                },
                function (reason) {
                    $scope.meta.loading = false;
                    alert(reason);
                }
            );
        };

        $scope.updateFilterRule = function (rule, filter) {
            $timeout(function () {
                $scope.meta.loading = true;
                let input = {
                    Id: rule.id,
                    field: rule.field,
                    expression: rule.expression,
                    value: rule.value,
                    fieldType: rule.fieldType
                };

                if ('MULTIPICKLIST' == rule.fieldType && rule.value) {
                    input.value = JSON.stringify(rule.value);
                }

                if ('PICKLIST' == rule.fieldType) {
                    if (rule.field.endsWith('StateCode') || rule.field.endsWith('CountryCode')) {
                        rule.fieldType = 'STRING';
                    }
                }

                remoting.doubleServiceEscape($rootScope.endpoint.updateFilterRule, input, filter.id).then(
                    function (result) {
                        filter.query = result.value;
                        $scope.meta.loading = false;
                    },
                    function (reason) {
                        $scope.meta.loading = false;
                        alert(reason);
                    }
                );
            }, 300);
        };

        $scope.expressionChanged = function (rule, filter) {
            if ('DATE' == rule.fieldType || 'DATETIME' == rule.fieldType) {
                if (rule.expression) {
                    if ($scope.isDateLiteral(rule.expression)) {
                        if (rule.value instanceof Date) {
                            rule.value = 'TODAY';
                        }
                    } else if (!(rule.value instanceof Date)) {
                        if ('DATE' == rule.fieldType) {
                            rule.value = $scope.createDate();
                        } else if ('DATETIME' == rule.fieldType) {
                            rule.value = $scope.createDateTime();
                        }
                    }
                }
            }

            $scope.updateFilterRule(rule, filter);
        };

        $scope.isDateLiteral = function (expression) {
            return expression && -1 != expression.indexOf('date-literal');
        };

        $scope.fieldChanged = function (rule, filter) {
            let fieldType = null;
            //for (let field of $scope.data.fieldList) {
            for (var i = 0; i < $scope.data.fieldList.length; i++) {
                var field = $scope.data.fieldList[i];
                if (field.name == rule.field) {
                    fieldType = field.fieldType;
                    break;
                }
            }
            rule.fieldType = fieldType;

            let expressionFound = false;
            let expressionList = $scope.getExpressionList(fieldType);
            //for (let ex of expressionList){
            for (var i = 0; i < expressionList.length; i++) {
                var ex = expressionList[i];
                if (ex.value == rule.expression) {
                    expressionFound = true;
                    break;
                }
            }

            if (!expressionFound) {
                rule.expression = 'equal';
            }

            if ('DATE' == rule.fieldType) {
                if (!$scope.isDateLiteral(rule.expression)) {
                    rule.value = $scope.createDate();
                }
            } else if ('DATETIME' == rule.fieldType) {
                if (!$scope.isDateLiteral(rule.expression)) {
                    rule.value = $scope.createDateTime();
                }
            } else if ('BOOLEAN' == rule.fieldType) {
                rule.value = 'true';
            } else {
                rule.value = '';
            }
            $scope.updateFilterRule(rule, filter);
        };

        $scope.createDate = function () {
            let date = new Date();
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        };

        $scope.createDateTime = function () {
            let date = new Date();
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        };

        $scope.toggleFilter = function (filter) {
            if (filter.open || filter.loaded) {
                filter.open = !filter.open;
                return;
            }

            $scope.meta.loading = true;
            remoting.singleServiceEscape($rootScope.endpoint.getFilterRules, filter.id).then(
                function (result) {
                    filter.rules = result.value;
                    filter.open = true;
                    filter.loaded = true;
                    $scope.meta.loading = false;

                    for (var j = 0; j < filter.rules.length; j++) {
                        var rule = filter.rules[j];
                        if (rule.value) {
                            if ('PICKLIST' == rule.fieldType) {
                                if (rule.field.endsWith('StateCode') || rule.field.endsWith('CountryCode')) {
                                    rule.fieldType = 'STRING';
                                }
                            }

                            if ('DATE' == rule.fieldType && !$scope.isDateLiteral(rule.expression)) {
                                let year = rule.value.substring(0, 4);
                                let month = rule.value.substring(5, 7);
                                let day = rule.value.substring(8, 10);
                                let d = new Date(year, month - 1, day);
                                d.setHours(0);
                                d.setMinutes(0);
                                d.setSeconds(0);
                                d.setMilliseconds(0);
                                rule.value = d;
                            } else if ('DATETIME' == rule.fieldType && !$scope.isDateLiteral(rule.expression)) {
                                let year = rule.value.substring(0, 4);
                                let month = rule.value.substring(5, 7);
                                let day = rule.value.substring(8, 10);
                                let hours = rule.value.substring(11, 13);
                                let minutes = rule.value.substring(14, 16);
                                let d = new Date(year, month - 1, day);
                                d.setHours(hours);
                                d.setMinutes(minutes);
                                d.setSeconds(0);
                                d.setMilliseconds(0);
                                rule.value = d;
                            } else if ('MULTIPICKLIST' == rule.fieldType) {
                                rule.value = JSON.parse(rule.value);
                            }
                        }
                    }
                    console.log(filter);
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.loading = false;
                }
            );
        };

        $scope.addNewRule = function (filter, index) {
            $scope.meta.loading = true;
            remoting.singleServiceEscape($rootScope.endpoint.addFilterRule, filter.id).then(
                function (result) {
                    filter.rules.push(result.value.rule);
                    filter.query = result.value.query;
                    $scope.meta.loading = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.loading = false;
                }
            );
        };

        $scope.getExpressionList = function (fieldType) {
            return $scope.data.expressions[fieldType];
        };

        $scope.getSelectList = function (rule) {
            //for (let field of $scope.data.fieldList) {
            for (var i = 0; i < $scope.data.fieldList.length; i++) {
                var field = $scope.data.fieldList[i];
                if (field.name == rule.field) {
                    return field.selectList;
                }
            }
            return $scope.emptyArray;
        };

        $scope.getReferenceTo = function (rule) {
            //for (let field of $scope.data.fieldList) {
            for (var i = 0; i < $scope.data.fieldList.length; i++) {
                var field = $scope.data.fieldList[i];
                if (field.name == rule.field) {
                    return field.relatedObjectMeta;
                }
            }
            return [];
        };

        $scope.getLookup = function (relatedObject, searchText, optionalFields) {
            if ('RecordType' == relatedObject) {
                relatedObject = relatedObject + '.' + $rootScope.data.objectPrefix;
            }

            angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

            console.log(' Object: ' + relatedObject);
            console.log(searchText);
            console.log(optionalFields);

            remoting.tripleService($rootScope.endpoint.relatedTypeAhead, relatedObject, searchText, optionalFields).then(
                function (result) {
                    console.log(result);
                    $scope.meta.referenceOptions = result;
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.deleteRule = function (filter, ruleId, ruleIndex) {
            $scope.meta.loading = true;
            remoting.doubleServiceEscape($rootScope.endpoint.deleteFilterRule, ruleId, filter.id).then(
                function (result) {
                    filter.rules.splice(ruleIndex, 1);
                    filter.query = result.value;
                    $scope.meta.loading = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.loading = false;
                }
            );
        };

        $scope.toggleDeleteFilter = function (index) {
            $scope.meta.deleteFilterModal = true;
            $scope.meta.deleteFilterIndex = index;
        };

        $scope.deleteFilter = function () {
            let index = $scope.meta.deleteFilterIndex;
            $scope.meta.deleteFilterModal = false;
            $scope.meta.deleteFilterIndex = null;
            $scope.meta.loading = true;
            remoting.singleService($rootScope.endpoint.deleteFilter, $scope.filters[index].id).then(
                function (result) {
                    $scope.filters.splice(index, 1);
                    $scope.meta.loading = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.loading = false;
                }
            );
        };
    })

    .controller('homeController', function ($scope) {
        $scope.init = function () {
            $scope.meta = {};
            $scope.meta.recordError = dc3Translate('RECORD_COUNT_EXCEEDS_CURRENT_LICENSED_LIMIT', 'Record count exceeds current licensed limit.') + " <a ng-click=\"openUrl('https://duplicatecheck.com/pricing', '')\">" + dc3Translate('UPGRADE_NOW', 'Upgrade Now') + '</a>';
        };
    })

    .controller('dcSettingsController', function ($scope, $rootScope, $interval, remoting, $timeout) {
        //FIXME dcSettingsController

        $scope.init = function () {
            var dataContainer = angular.element('div#dcSettingsDataStore');

            $scope.endpoint = {};
            $scope.endpoint.getConfig = dataContainer.data('sf-get-config');
            $scope.endpoint.deleteTempAll = dataContainer.data('sf-delete-temp-all');
            $scope.endpoint.updateSetting = dataContainer.data('sf-update-setting');

            $scope.meta = {};
            $scope.meta.deleteTemp = false;
            $scope.data.dc3SearchBatchDelete = false;
            $scope.meta.isLoading = false;

            $scope.meta.userLookupObject = {User: {Label: 'User', Name: 'User', SldsIcon: 'user'}};

            $scope.lookupData = {};
            $scope.referenceData = {};

            $scope.meta.ConvertDefaultOwnerOptions = [
                {value: 'RECORD_OWNER', label: 'Lead Owner'},
                {value: 'CONVERTING_USER', label: 'Converting user'},
                {value: 'CUSTOM_USER', label: 'Set specific user'}
            ];

            $scope.meta.activeFrequentWordsImprovement = dc3Translate('SETUP_SETTINGS_ACTIVATE_IMPROVED_FREQ_WORDS', 'Activate improved frequent words will result in different scoring for scenarios where frequent words are applied.') + ' <a ng-click="openUrl(\'' + dc3Translate('URL_SUPPORT_ACTIVATE_IMPROVED_FREQUENT_WORDS', 'https://support.duplicatecheck.com') + "?utm_source=dcApp&utm_medium=app&utm_campaign=dc_setup_scenario#emptyfields', '')\">" + dc3Translate('READ_MORE', 'Read more') + '</a>';

            $scope.getConfig();
        };

        $scope.openUrl = function (url) {
            console.log(url);
            dcNavigateNew(url, '');
        };

        $scope.getConfig = function () {
            $scope.meta.isLoading = true;
            var getter = remoting.emptyService($scope.endpoint.getConfig);
            getter.then(
                function (result) {
                    if (result.value) {
                        $scope.data = result.value;
                        if (angular.isUndefined($scope.data.settings.DefaultSearchTab)) {
                            $scope.data.settings.DefaultSearchTab = $scope.data.searchTab[0].label;
                        }
                        if (result.value.convertDefaultOwnerUserName && result.value.settings.ConvertDefaultOwnerUserId) {
                            $scope.referenceData.userId = result.value.settings.ConvertDefaultOwnerUserId;
                            $scope.referenceData.name = result.value.convertDefaultOwnerUserName;
                        }
                    }
                    $scope.meta.isLoading = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.isLoading = false;
                }
            );
        };

        $scope.$watch('data.dc3SearchBatchDelete', function (n, o) {
            if (n && !o) {
                $timeout(function () {
                    $scope.meta.deleteTemp = false;
                }, 6000);
            }
        });

        $scope.$watch('data.settings.ConvertDefaultOwnerUserId', function (n, o) {
            if (n !== o && n && 0 < n.length) {
                $scope.updateSetting('ConvertDefaultOwnerUserId');
            }
        });

        $scope.startDeleteTempAll = function () {
            $scope.data.dc3SearchBatchDelete = true;
            $scope.meta.deleteTemp = true;

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
            if (empty($scope.data.settings[name])) {
                return false;
            }

            var setter = remoting.doubleService($scope.endpoint.updateSetting, name, $scope.data.settings[name]);
            setter.then(
                function (result) {},
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.getLookup = function (objectList, needle, field, optionalFields) {
            angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

            var options = [];

            if (needle && 1 < needle.length) {
                var getter = remoting.tripleService($rootScope.endpoint.relatedTypeAhead, objectList, needle, optionalFields);
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

        $scope.getLookupPrefill = function () {};

        $scope.init();
    })

    .controller('dcLicenseController', function ($scope, $rootScope, $interval, remoting, $location) {
        //FIXME dcLicenseController

        $scope.init = function () {
            $scope.dataContainer = angular.element('div#dcLicenseDataStore');
            $scope.endpoint = {};
            $scope.endpoint.getLicense = $scope.dataContainer.data('sf-get-license');
            $scope.endpoint.refreshLicense = $scope.dataContainer.data('sf-refresh-license');
            $scope.endpoint.getSandboxList = $scope.dataContainer.data('sf-get-sandbox-list');
            $scope.endpoint.addSandbox = $scope.dataContainer.data('sf-get-add-sandbox');
            $scope.endpoint.deleteSandbox = $scope.dataContainer.data('sf-delete-sandbox');

            $scope.meta = {};
            $scope.meta.isLoading = false;
            $scope.meta.sbLoading = false;
            $scope.meta.trialCheckbox = true;

            $scope.data = {};
            $scope.sbList = [];

            $scope.sbmodel = {};
            $scope.sbmodel.open = false;
            $scope.sbmodel.name;
            $scope.sbmodel.org;

            null != $location.$$absUrl.match(/\&refresh=true/) ? $scope.retrieveLicense('refresh') : $scope.retrieveLicense('init');
        };

        $scope.deleteSandbox = function (sbId) {
            if (empty(sbId)) {
                alert(dc3Translate('PLEASE_PROVIDE_THE_ORG_ID_TO_DELETE', 'Please provide the org id to delete'));
                return;
            }
            $scope.meta.sbLoading = true;
            var getter = remoting.singleService($scope.endpoint.deleteSandbox, sbId);
            getter.then(
                function (result) {
                    if (result.value) {
                        $scope.sbList = result.value;
                    }
                    $scope.meta.sbLoading = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.sbLoading = false;
                }
            );
        };

        $scope.getSandboxList = function () {
            $scope.meta.sbLoading = true;
            var getter = remoting.emptyService($scope.endpoint.getSandboxList);
            getter.then(
                function (result) {
                    if (result.value) {
                        $scope.sbList = result.value;
                    }
                    $scope.meta.sbLoading = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.sbLoading = false;
                }
            );
        };

        $scope.sbModelClose = function () {
            $scope.sbmodel = {};
            $scope.sbmodel.open = false;
            $scope.sbmodel.name = '';
            $scope.sbmodel.org = '';
            $scope.sbmodel.creating = false;
        };

        $scope.addSandbox = function () {
            $scope.sbmodel.creating = true;
            if (empty($scope.sbmodel.name)) {
                alert(dc3Translate('PLEASE_PROVIDE_A_NAME_FOR_THE_SANDBOX', 'Please provide a name for the sandbox'));
                $scope.sbmodel.creating = false;
                return;
            }

            if (empty($scope.sbmodel.org)) {
                alert(dc3Translate('PLEASE_PROVIDE_A_CORRECT_ORGANIZATION_ID_FOR_THE_SANDBOX', 'Please provide a correct Organization Id for the sandbox'));
                $scope.sbmodel.creating = false;
                return;
            }

            var setter = remoting.doubleService($scope.endpoint.addSandbox, $scope.sbmodel.name, $scope.sbmodel.org);
            setter.then(
                function (result) {
                    if (result.value) {
                        $scope.sbList = result.value;
                        $scope.sbModelClose();
                    }
                },
                function (reason) {
                    alert(reason);
                    $scope.sbmodel.creating = false;
                }
            );
        };

        $scope.openUrl = function (url) {
            console.log(url);
            dcNavigateNew(url, '');
        };

        $scope.openFreePlus = function (orgId) {
            dcNavigateNew('https://get.plauti.com/freeplus/?org=' + orgId + '&sanbdox=' + ($scope.data.information.isSandbox ? '1' : '0'), 'utm_source=DC3&utm_medium=applicatie&utm_campaign=Register%20Free%20Plus');
        };

        $scope.openPricing = function () {
            dcNavigateNew('https://www.duplicatecheck.com/pricing', 'utm_source=DC3&utm_medium=applicatie&utm_campaign=License%20Price');
        };

        $scope.retrieveLicense = function (type) {
            $scope.meta.isLoading = true;
            var endpoint = $scope.endpoint.refreshLicense;

            if ('init' == type.toLowerCase()) {
                endpoint = $scope.endpoint.getLicense;
            }

            var getter = remoting.emptyService(endpoint);
            getter.then(
                function (result) {
                    if (result.value) {
                        $scope.data = result.value;

                        $scope.data.available = {};
                        $scope.data.locked = {};

                        angular.forEach(result.value.features, function (v, k) {
                            if ('multipleScenarios' != k && 'sandboxCount' != k && 'scenarioCount' != k) {
                                if (true == v) {
                                    $scope.data.available[k] = v;
                                } else {
                                    $scope.data.locked[k] = v;
                                }
                            }
                        });
                    }

                    $scope.data.lockedSize = Object.keys($scope.data.locked).length;

                    $scope.meta.isLoading = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.isLoading = false;
                }
            );
        };

        $scope.init();
    })

    .controller('dcAuditController', function ($scope, remoting, localStorageService) {
        //FIXME dcAuditController

        var init = function () {
            var dataStore = angular.element('#dcAuditDataStore');
            $scope.endpoint = {};
            $scope.endpoint.getAuditData = dataStore.data('sf-get-audit-data');
            $scope.endpoint.related = dataStore.data('sf-related');
            $scope.endpoint.deleteAudit = dataStore.data('sf-delete-audit');
            $scope.endpoint.enableAudit = dataStore.data('sf-enable-audit');

            $scope.meta = {};
            $scope.meta.ownerId = 'Owner ID';
            $scope.meta.userLookupObject = {User: {Label: 'User', Name: 'User', SldsIcon: 'user'}};
            $scope.data = {};
            $scope.lookupData = {};
            $scope.referenceData = {};

            $scope.meta.loadingData = true;
            $scope.meta.initPage = true;
            resetFilter();
            $scope.getAuditData(false);
            
            window.recordEvt('DC Setup - Audit Logging clicked');  
            window.persistEvt(); 
        };

        $scope.filter = {};
        var resetFilter = function () {
            var filterData = {};
            filterData.startDate = undefined;
            filterData.endDate = undefined;
            filterData.userId = undefined;
            filterData.recordId = undefined;
            filterData.auditType = undefined;
            filterData.objectPrefix = undefined;
            filterData.pageSize = 10;
            filterData.pageCount = 0;
            $scope.filter = filterData;
        };

        $scope.getLookup = function (objectList, needle, field, optionalFields) {
            angular.isUndefined(optionalFields) ? (optionalFields = []) : optionalFields;

            var options = [];

            if (needle && 1 < needle.length) {
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

        $scope.openObject = function (recordId) {
            dcNavigateRecordNew(recordId);
        };

        $scope.openUrl = function (url) {
            console.log(url);
            dcNavigateNew(url, '');
        };

        $scope.doDeleteAudit = function () {
            $scope.meta.loadingDelete = true;
            var getter = remoting.emptyService($scope.endpoint.deleteAudit);
            getter.then(
                function (searchResult) {
                    $scope.meta.loadingDelete = false;
                    $scope.meta.ModalDelete = false;
                    resetFilter();
                    $scope.getAuditData(false);
                },
                function (reason) {
                    $scope.meta.loadingDelete = false;
                    alert(reason);
                }
            );
        };

        $scope.doRefresh = function () {
            $scope.meta.initPage = true;
            $scope.filter.pageSize = 10;
            $scope.filter.pageCount = 0;
            $scope.getAuditData(false);
        };

        $scope.enableAudit = function () {
            var getter = remoting.emptyService($scope.endpoint.enableAudit);
            getter.then(
                function (searchResult) {
                    $scope.doRefresh();
                },
                function (reason) {
                    alert(reason);
                }
            );
        };

        $scope.getMore = function () {
            $scope.filter.pageCount = $scope.filter.pageCount + 1;
            $scope.getAuditData(true);
        };

        $scope.getAuditData = function (fetchExtra) {
            $scope.meta.loadingData = true;

            if (!fetchExtra) {
                $scope.data = {};
            }

            var apexFilter = angular.copy($scope.filter);

            if (angular.isDefined(apexFilter.startDate)) {
                apexFilter.startDate = apexFilter.startDate.toGMTString();
            }

            if (angular.isDefined(apexFilter.endDate)) {
                apexFilter.endDate = apexFilter.endDate.toGMTString();
            }

            var getter = remoting.singleService($scope.endpoint.getAuditData, apexFilter);
            getter.then(
                function (searchResult) {
                    if (!fetchExtra) {
                        $scope.data = searchResult;
                    } else {
                        angular.forEach(searchResult.auditList, function (v, k) {
                            $scope.data.auditList.push(v);
                        });

                        angular.forEach(searchResult.auditData, function (v, k) {
                            $scope.data.auditData[k] = v;
                        });

                        angular.forEach(searchResult.recordMap, function (v, k) {
                            $scope.data.recordMap[k] = v;
                        });

                        $scope.data.isMore = searchResult.isMore;
                        $scope.data.deleteActive = searchResult.deleteActive;
                    }

                    $scope.meta.initPage = false;
                    $scope.meta.loadingData = false;
                },
                function (reason) {
                    $scope.meta.initPage = false;
                    $scope.meta.loadingData = false;
                    alert(reason);
                }
            );
        };

        $scope.clearFilter = function () {
            resetFilter();
        };

        $scope.applyFilter = function () {
            $scope.filter.pageSize = 10;
            $scope.filter.pageCount = 0;
            $scope.getAuditData(false);
            $scope.meta.ModalFilter = false;
        };

        init();
    })

    .controller('dcFrequentWordsController', function ($scope, $rootScope, remoting, $filter, $timeout) {
        //FIXME dcFrequentWordsController

        $scope.init = function () {
            var dataContainer = angular.element('div#dcFrequentWordsDataStore');
            $scope.endpoint = {};
            $scope.endpoint.addWords = dataContainer.data('sf-add-words');
            $scope.endpoint.fetchWords = dataContainer.data('sf-fetch-words');
            $scope.endpoint.deleteWord = dataContainer.data('sf-delete-word');
            $scope.endpoint.frequentTypes = dataContainer.data('frequent-types');

            $scope.helpPage = dc3Translate('URL_SUPPORT_USAGE_FREQUENT_WORDS', 'https://support.duplicatecheck.com') + '?utm_source=dcApp&utm_medium=app&utm_campaign=help_link';

            $scope.frequentTypeList = $scope.endpoint.frequentTypes.replace(/\s|\[|\]/g, '').split(',');
            $scope.frequentType = $scope.frequentTypeList[0];
            $scope.deleteLoading = false;

            $scope.initPage = true;
            $scope.isLoading = false;
            $scope.dataWords = {};
            $scope.input = {};
            $scope.input.wordString = '';
            $scope.fetchWords();
            $scope.modalStatus = false;
            
            window.recordEvt('DC Setup - Frequent words clicked');  
            window.persistEvt(); 
        };

        $scope.openUrl = function (url) {
            console.log(url);
            dcNavigateNew(url, '');
        };

        $scope.$watch('frequentType', function (n, o) {
            if (n !== o) {
                $scope.fetchWords();
            }
        });

        $scope.deleteWord = function (recordId) {
            $scope.deleteLoading = true;
            var record;
            var index;
            angular.forEach($scope.dataWords, function (v, k) {
                if (angular.isDefined(v.recordId) && v.recordId == recordId) {
                    record = v;
                    index = k;
                }
            });

            if (angular.isDefined(record)) {
                var getter = remoting.singleService($scope.endpoint.deleteWord, record.recordId);
                getter.then(
                    function (result) {
                        if (result.value) {
                            $scope.dataWords.splice(index, 1);
                        }
                        $scope.deleteLoading = false;
                    },
                    function (reason) {
                        $scope.deleteLoading = false;
                        alert(reason);
                    }
                );
            }
            $scope.deleteLoading = false;
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
            var getter = remoting.doubleService($scope.endpoint.addWords, $scope.frequentType, wordArray);
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
            if (angular.isUndefined($scope.frequentType)) {
                return;
            }

            var getter = remoting.singleService($scope.endpoint.fetchWords, $scope.frequentType);
            getter.then(
                function (result) {
                    $scope.dataWords = result.value;
                    $scope.isLoading = false;
                    $scope.initPage = false;
                },
                function (reason) {
                    alert(reason);
                    $scope.isLoading = false;
                    $scope.initPage = false;
                }
            );
        };

        $scope.init();
    })

    .controller('dcExportImportConfigController', function ($scope, $rootScope, $timeout, remoting) {
        $scope.init = function () {
            var dataContainer = angular.element('div#dcExportImportConfigDataStore');
            $scope.endpoint = {};
            $scope.endpoint.exportFileUrl = dataContainer.data('sf-export-page-url');
            $scope.endpoint.exportJobUrl = dataContainer.data('sf-export-job-url');
            $scope.endpoint.jobInfoUrl = dataContainer.data('sf-config-job-info-url');
            $scope.endpoint.importJobUrl = dataContainer.data('sf-import-job-url');
            $scope.endpoint.importJobResultUrl = dataContainer.data('sf-import-job-result-url');
            $scope.isLoading = false;
            $scope.currentTab = 'export';
            $scope.showConfirmationModal = false;
            
            window.recordEvt('DC Setup - Export / Import configuration clicked');  
            window.recordEvt('DC Export / Import Configuration - Loaded', { loading_time: new Date().getTime() - $rootScope.dcSetupStartRenderTime });  
            window.persistEvt(); 
            $timeout(function () {
                setImportConfigButtonState(true);
            }, 1000);
        };

        $scope.openUrl = function (url) {
            console.log(url);
            dcNavigateNew(url, '');
        };

        $scope.showExport = function () {
            $scope.currentTab = 'export';
        };

        $scope.showImport = function () {
            $scope.currentTab = 'import';
        };

        $scope.downloadConfigFile = function () {
            console.log('Getting export file download url');
            let url = null;
            if (-1 == $scope.endpoint.exportFileUrl.indexOf('?')) {
                url = $scope.endpoint.exportFileUrl + '?exportFileJobId=' + $scope.exportJobId;
            } else {
                url = $scope.endpoint.exportFileUrl + '&exportFileJobId=' + $scope.exportJobId;
            }
            console.log('Url ' + url);
            document.location.href = url;
        };

        $scope.submitExportConfigJob = function () {
            const startExportTime = new Date().getTime();
            console.log('Creating export job');
            $scope.clearMessage();
            $scope.exportJobId = null;
            $scope.isLoading = true;
            let getter = remoting.emptyServiceEscape($scope.endpoint.exportJobUrl);
            getter.then(
                function (result) {
                    $scope.exportJobId = result;
                    console.log('Job id: ' + $scope.exportJobId);
                    $timeout($scope.pollExportConfigJob, 5000);
                    window.recordEvt('DC Export/Import Configuration - Export Configuration Clicked', { export_time: new Date().getTime() - startExportTime });  
                    window.persistEvt(); 
                },
                function (reason) {
                    alert(reason);
                    $scope.isLoading = false;
                }
            );
        };

        $scope.pollExportConfigJob = function () {
            console.log('Checking job status for export job: ' + $scope.exportJobId);
            let getter = remoting.singleServiceEscape($scope.endpoint.jobInfoUrl, $scope.exportJobId);
            getter.then(
                function (result) {
                    console.log(result);
                    if ('Failed' == result.Status) {
                        $scope.isLoading = false;
                        $scope.hasError = true;
                        $scope.errorMessage = result.ExtendedStatus;
                    } else if ('Aborted' == result.Status) {
                        $scope.isLoading = false;
                        $scope.hasError = true;
                        $scope.errorMessage = 'Job aborted';
                    } else if ('Completed' == result.Status) {
                        $scope.isLoading = false;
                        $scope.downloadConfigFile();
                    } else {
                        $timeout($scope.pollExportConfigJob, 5000);
                    }
                },
                function (reason) {
                    alert(reason);
                    $scope.isLoading = false;
                }
            );
        };

        $scope.pollImportConfigJob = function () {
            console.log('Checking job status for import job: ' + $scope.importJobId);
            let getter = remoting.singleServiceEscape($scope.endpoint.jobInfoUrl, $scope.importJobId);
            getter.then(
                function (result) {
                    console.log(result);
                    if ('Failed' == result.Status) {
                        $scope.isLoading = false;
                        $scope.hasError = true;
                        $scope.errorMessage = result.ExtendedStatus;
                    } else if ('Aborted' == result.Status) {
                        $scope.isLoading = false;
                        $scope.hasError = true;
                        $scope.errorMessage = 'Job aborted';
                    } else if ('Completed' == result.Status) {
                        $scope.getImportJobResults();
                    } else {
                        $timeout($scope.pollImportConfigJob, 5000);
                    }
                },
                function (reason) {
                    alert(reason);
                    $scope.isLoading = false;
                }
            );
        };

        $scope.getImportJobResults = function () {
            console.log('Getting import file results ' + $scope.importJobId);
            var getter = remoting.singleServiceEscape($scope.endpoint.importJobResultUrl, $scope.importJobId);
            getter.then(
                function (result) {
                    console.log(result);
                    if (result.warnings && 0 < result.warnings.length) {
                        $scope.warnings = result.warnings;
                    }
                    $scope.imported = true;
                    $scope.isLoading = false;
                },
                function (reason) {
                    $scope.isLoading = false;
                    alert(reason);
                }
            );
        };

        $scope.clearMessage = function () {
            $scope.hasError = false;
            $scope.errorMessage = null;
            $scope.imported = false;
            $scope.exported = false;
            $scope.warnings = null;
        };

        $scope.showConfirmation = function () {
            $scope.showConfirmationModal = true;
        };

        $scope.hideConfirmation = function () {
            $scope.showConfirmationModal = false;
        };

        $scope.importConfig = function () {
            setImportConfigButtonState(true);
            $scope.showConfirmationModal = false;
            $scope.clearMessage();
            $scope.importJobId = null;
            $scope.isLoading = true;
            let file = document.getElementById('file-upload-input-01').files[0];
            var reader = new FileReader();

            reader.onload = function (e) {
                var text = reader.result;
                console.log(text);

                var getter = remoting.singleServiceEscape($scope.endpoint.importJobUrl, text);
                getter.then(
                    function (result) {
                        console.log(result);
                        $scope.importJobId = result;
                        console.log('Job id: ' + $scope.importJobId);
                        $timeout($scope.pollImportConfigJob, 3000);
                        window.recordEvt('DC Export/Import Configuration - Import Configuration  clicked');  
                        window.persistEvt(); 
                    },
                    function (reason) {
                        alert(reason);
                        $scope.isLoading = false;
                    }
                );

                document.getElementById('file-upload-input-01').value = '';
                document.getElementById('fileName').innerHTML = '';
                setImportConfigButtonState(true);
            };

            reader.readAsText(file, 'utf-8');
        };

        $scope.init();
    })

    .controller('dcSetupCheckController', function ($scope, $rootScope, remoting, $timeout) {
        //FIXME dc3SetupCheckController

        $scope.init = function () {
            var dataStore = angular.element('#dcSetupCheckDataStore');
            $scope.endpoint = {};
            $scope.endpoint.fetchConfigList = dataStore.data('sf-fetch-config-list');
            $scope.endpoint.checkExist = dataStore.data('sf-check-exist');
            $scope.endpoint.checkScenario = dataStore.data('sf-check-scenario');
            $scope.endpoint.checkResultField = dataStore.data('sf-check-result-field');
            $scope.endpoint.checkMerge = dataStore.data('sf-check-merge');
            $scope.endpoint.checkRecordType = dataStore.data('sf-check-record-type');
            $scope.endpoint.checkCross = dataStore.data('sf-check-cross');
            $scope.endpoint.mergerules = dataStore.data('sf-check-mergerules');
            $scope.endpoint.startFix = dataStore.data('sf-fix-error');

            $scope.meta = {};
            $scope.meta.initPage = true;
            $scope.meta.isLoading = true;
            $scope.meta.queue = [];
            $scope.meta.showFixAll = false;

            $scope.data = {};
            $scope.data.errorList = {};
            $scope.data.configList = [];
            $scope.data.check = {};
            $scope.data.check.basic = {};
            $scope.data.check.scenario = {};
            $scope.data.check.result = {};
            $scope.data.check.merge = {};
            $scope.data.check.cross = {};
            $scope.data.check.recordtype = {};
            $scope.data.check.mergerules = {};

            $scope.fetchConfigList();
        };

        var builtCheckList = function () {
            angular.forEach($scope.data.configList, function (v, k) {
                $scope.data.check.basic[v.Id] = 'pending';
                $scope.data.check.scenario[v.Id] = 'pending';
                $scope.data.check.result[v.Id] = 'pending';
                $scope.data.check.merge[v.Id] = 'pending';
                $scope.data.check.recordtype[v.Id] = 'pending';
                $scope.data.check.cross[v.Id] = 'pending';
                $scope.data.check.mergerules[v.Id] = 'pending';
                $scope.data.errorList[v.Id] = [];
            });
        };

        $scope.fixAll = function () {
            const fixStartTime =  new Date().getTime();
            $scope.meta.isLoading = true;

            angular.forEach($scope.data.errorList, function (v, k) {
                if (0 < v.length) {
                    angular.forEach(v, function (vv, kk) {
                        $timeout(function () {
                            remoting.singleService($scope.endpoint.startFix, angular.copy(vv)).then(
                                function (result) {
                                    if (result) {
                                        var index = angular.copy($scope.data.errorList[k].indexOf(vv));
                                        if (-1 < index) {
                                            var deletedItem = angular.copy($scope.data.errorList[k][index]);
                                            $scope.data.errorList[k].splice(index, 1);
                                        }
                                    }
                                    window.recordEvt('DC Setup Check - Fix All clicked', { time_to_fix: new Date().getTime() - fixStartTime});  
                                    window.persistEvt(); 
                                },
                                function (reason) {
                                    alert(reason);
                                }
                            );
                        }, 1000);
                    });
                }
            });
            $scope.startCheckBlockEvents = true;
            $scope.startCheck();
        };

        $scope.startFix = function (configId, errorItem) {
            $scope.meta.isLoading = true;
            var getter = remoting.singleService($scope.endpoint.startFix, angular.copy(errorItem));
            getter.then(
                function (searchResult) {
                    if (searchResult) {
                        var index = $scope.data.errorList[configId].indexOf(errorItem);
                        if (-1 < index) {
                            $scope.data.errorList[configId].splice(index, 1);
                        }

                        $scope.meta.isLoading = false;
                    } else {
                        $scope.meta.isLoading = false;
                    }
                },
                function (reason) {
                    alert(reason);
                    $scope.meta.isLoading = false;
                }
            );
        };

        $scope.$watch(
            'data.errorList',
            function (v) {
                var errors = false;
                angular.forEach(v, function (x, y) {
                    length++;
                    if (0 < x.length) {
                        errors = true;
                        $scope.meta.showFixAll = true;
                    }
                });

                if (!errors) {
                    $scope.meta.showFixAll = false;
                }
            },
            true
        );

        $scope.openUrl = function (url) {
            console.log(url);
            dcNavigate(url, '');
        };

        $scope.startCheck = function () {
            $scope.setupCheckStartTime = new Date().getTime();
            $scope.meta.isLoading = true;
            $scope.meta.queue = [];
            builtCheckList();

            angular.forEach($scope.data.configList, function (v, k) {
                var basic = {};
                basic.id = v.Id;
                basic.type = 'basic';
                $scope.meta.queue.push(basic);

                var scenario = {};
                scenario.id = v.Id;
                scenario.type = 'scenario';
                $scope.meta.queue.push(scenario);

                var result = {};
                result.id = v.Id;
                result.type = 'result';
                $scope.meta.queue.push(result);

                var cross = {};
                cross.id = v.Id;
                cross.type = 'cross';
                $scope.meta.queue.push(cross);

                var merge = {};
                merge.id = v.Id;
                merge.type = 'merge';
                $scope.meta.queue.push(merge);

                var recordtype = {};
                recordtype.id = v.Id;
                recordtype.type = 'recordtype';
                $scope.meta.queue.push(recordtype);

                var mergerules = {};
                mergerules.id = v.Id;
                mergerules.type = 'mergerules';
                $scope.meta.queue.push(mergerules);
            });

            runQueue();
        };

        let sendStartCheckEvent = function () {
            window.recordEvt('DC Setup Check - Start Check clicked', { time_to_check: new Date().getTime() - $scope.setupCheckStartTime });
            window.persistEvt();
        }

        var runQueue = function () {
            if (empty($scope.meta.queue)) {
                if(!$scope.startCheckBlockEvents) {
                    sendStartCheckEvent();
                }
                $scope.meta.isLoading = false;
                $scope.startCheckBlockEvents = false;
                return;
            }

            var run = $scope.meta.queue.shift();
            if (empty(run)) {
                if(!$scope.startCheckBlockEvents) {
                    sendStartCheckEvent();
                }
                $scope.meta.isLoading = false;
                $scope.startCheckBlockEvents = false;
                return;
            }

            if ('error' == $scope.data.check.basic[run.id]) {
                runQueue();
                return;
            }

            if ('basic' == run.type) {
                $scope.data.check.basic[run.id] = 'processing';
                var getter = remoting.singleService($scope.endpoint.checkExist, run.id);
                getter.then(
                    function (searchResult) {
                        if (searchResult.isCorrect) {
                            $scope.data.check.basic[run.id] = 'success';
                        } else {
                            $scope.data.check.basic[run.id] = 'error';
                            angular.forEach(searchResult.errorList, function (v, k) {
                                $scope.data.errorList[run.id].push(v);
                            });
                        }
                        runQueue();
                    },
                    function (reason) {
                        runQueue();
                    }
                );
            } else if ('scenario' == run.type) {
                $scope.data.check.scenario[run.id] = 'processing';
                var getter = remoting.singleService($scope.endpoint.checkScenario, run.id);
                getter.then(
                    function (searchResult) {
                        if (searchResult.isCorrect) {
                            $scope.data.check.scenario[run.id] = 'success';
                        } else {
                            $scope.data.check.scenario[run.id] = 'error';
                            angular.forEach(searchResult.errorList, function (v, k) {
                                $scope.data.errorList[run.id].push(v);
                            });
                        }
                        runQueue();
                    },
                    function (reason) {
                        runQueue();
                    }
                );
            } else if ('result' == run.type) {
                $scope.data.check.result[run.id] = 'processing';
                var getter = remoting.singleService($scope.endpoint.checkResultField, run.id);
                getter.then(
                    function (searchResult) {
                        if (searchResult.isCorrect) {
                            $scope.data.check.result[run.id] = 'success';
                        } else {
                            $scope.data.check.result[run.id] = 'error';
                            angular.forEach(searchResult.errorList, function (v, k) {
                                $scope.data.errorList[run.id].push(v);
                            });
                        }
                        runQueue();
                    },
                    function (reason) {
                        runQueue();
                    }
                );
            } else if ('merge' == run.type) {
                $scope.data.check.merge[run.id] = 'processing';
                var getter = remoting.singleService($scope.endpoint.checkMerge, run.id);
                getter.then(
                    function (searchResult) {
                        if (searchResult.isCorrect) {
                            $scope.data.check.merge[run.id] = 'success';
                        } else {
                            $scope.data.check.merge[run.id] = 'error';
                            angular.forEach(searchResult.errorList, function (v, k) {
                                $scope.data.errorList[run.id].push(v);
                            });
                        }
                        runQueue();
                    },
                    function (reason) {
                        runQueue();
                    }
                );
            } else if ('recordtype' == run.type) {
                $scope.data.check.recordtype[run.id] = 'processing';
                var getter = remoting.singleService($scope.endpoint.checkRecordType, run.id);
                getter.then(
                    function (searchResult) {
                        if (searchResult.isCorrect) {
                            $scope.data.check.recordtype[run.id] = 'success';
                        } else {
                            $scope.data.check.recordtype[run.id] = 'error';
                            angular.forEach(searchResult.errorList, function (v, k) {
                                $scope.data.errorList[run.id].push(v);
                            });
                        }
                        runQueue();
                    },
                    function (reason) {
                        runQueue();
                    }
                );
            } else if ('cross' == run.type) {
                $scope.data.check.cross[run.id] = 'processing';
                var getter = remoting.singleService($scope.endpoint.checkCross, run.id);
                getter.then(
                    function (searchResult) {
                        if (searchResult.isCorrect) {
                            $scope.data.check.cross[run.id] = 'success';
                        } else {
                            $scope.data.check.cross[run.id] = 'error';
                            angular.forEach(searchResult.errorList, function (v, k) {
                                $scope.data.errorList[run.id].push(v);
                            });
                        }
                        runQueue();
                    },
                    function (reason) {
                        runQueue();
                    }
                );
            } else if ('mergerules' == run.type) {
                $scope.data.check.mergerules[run.id] = 'processing';
                var getter = remoting.singleService($scope.endpoint.mergerules, run.id);
                getter.then(
                    function (searchResult) {
                        if (searchResult.isCorrect) {
                            $scope.data.check.mergerules[run.id] = 'success';
                        } else {
                            $scope.data.check.mergerules[run.id] = 'error';
                            angular.forEach(searchResult.errorList, function (v, k) {
                                $scope.data.errorList[run.id].push(v);
                            });
                        }
                        runQueue();
                    },
                    function (reason) {
                        runQueue();
                    }
                );
            }
        };

        $scope.fetchConfigList = function () {
            $scope.meta.isLoading = true;

            var getter = remoting.emptyService($scope.endpoint.fetchConfigList);
            getter.then(
                function (searchResult) {
                    $scope.data.configList = searchResult;
                    builtCheckList();
                    $scope.meta.initPage = false;
                    $scope.startCheckBlockEvents = true;
                    $scope.startCheck();
                    window.recordEvt('DC Setup - Setup Check clicked');
                    window.recordEvt('DC Setup Check - Loaded', { loading_time: new Date().getTime() - $rootScope.dcSetupStartRenderTime, start_check: true, show_fixAll: $scope.meta.showFixAll });
                    window.persistEvt();
                },
                function (reason) {
                    $scope.meta.isLoading = false;
                    $scope.meta.initPage = false;
                    alert(reason);
                }
            );
        };

        $scope.init();
    });

function updateFileName() {
    window.recordEvt('DC Export/Import Configuration - Upload file clicked');
    window.persistEvt();
    let file = document.getElementById('file-upload-input-01').files[0];
    if (file) {
        document.getElementById('fileName').innerHTML = file.name;
        setImportConfigButtonState(false);
    } else {
        document.getElementById('fileName').innerHTML = '';
        setImportConfigButtonState(true);
    }
}

function setImportConfigButtonState(disable) {
    document.getElementById('importButton').disabled = disable;
}

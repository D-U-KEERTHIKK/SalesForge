//angular.module('dcApp', ['dcApp.services', 'dcApp.controllers', 'dcApp.directives', 'ngSanitize', 'plauti-ng-slds', 'ngCsv']);

angular
  .module('dcApp.controllers')
  .controller('batchExportController', function ($scope, $rootScope, $interval, remoting) {
    $scope.init = function () {
      $scope.bExport = {};
      $scope.bExport.callOffset = 0;
      $scope.bExport.callCount = 1000;
      $scope.bExport.dataList = [];
      $scope.bExport.isLoading = false;
      $scope.bExport.helpPage = dc3Translate('URL_SUPPORT_USAGE_DC_EXPORT', 'https://support.duplicatecheck.com');
      $scope.bExport.largeExport = dc3Translate(
        'URL_SUPPORT_USAGE_DC_EXPORT_lARGE',
        'https://support.duplicatecheck.com'
      );
      $scope.bExport.text = dc3Translate('BUTTON_CANCEL', 'fetching records');
      $scope.dataStore = angular.element('#dc3ModalExport');
      $scope.bExport.jobId = $scope.dataStore.data('export-job-id');
      $scope.bExport.exportJobModal = $scope.dataStore.data('export-modal');
      $scope.bExport.getExportData = $scope.dataStore.data('sf-get-export-data');
    };

    $scope.init();

    $scope.$watch($scope.bExport.exportJobModal, function (v) {
      if (angular.isDefined(v) && !v) {
        $scope.getData = false;
        $scope.init();
      }
    });

    $scope.$watch($scope.bExport.jobId, function (v) {
      if (angular.isDefined(v)) {
        $scope.bExport.jobName = $scope.$eval($scope.dataStore.data('export-job-name'));
        $scope.getData = true;
        $scope.getExportData($scope.meta.jobId, $scope.bExport.callOffset);
      }
    });

    $scope.openExternalUrl = function (url) {
      dcNavigateNew(url, 'utm_source=dcApp&utm_medium=app&utm_campaign=help_inline');
    };

    $scope.handleDownload = function () {
      if (!this.bExport.isLoading && $scope.fileBlob) {
        // add a fake link to the html dom
        var fakeLink = document.createElement('a');

        fakeLink.style = 'display: none';

        // assign a dataUri with our file content to our fake link
        var dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent($scope.fileBlob);

        fakeLink.href = dataUri;
        fakeLink.download = 'export.csv';
        document.body.appendChild(fakeLink);

        // trigger a click on the fake download link
        fakeLink.click();

        // clean up the mess
        // window.URL.revokeObjectURL(url);
        fakeLink.remove();
      }
    };

    $scope.getExportData = function (jobId, offSet) {
      $scope.bExport.isLoading = true;
      $scope.bExport.text = dc3Translate('FETCHING_RECORDS', 'Fetching records');
      $scope.fileBlob = '';

      var getter = remoting.tripleService($scope.bExport.getExportData, jobId, $scope.bExport.callCount, offSet);
      getter.then(
        function (result) {
          if (result.value) {
            $scope.bExport.csvHeader = [
              'Group',
              'Pair Id',
              'Record A Id',
              'Record B Id',
              'Record A Name',
              'Record B Name',
              'Score'
            ];

            if (!result.value.crossObject) {
              angular.forEach(result.value.resultFields, function (v, k) {
                $scope.bExport.csvHeader.push('Record A ' + v.fieldLabel);
                $scope.bExport.csvHeader.push('Record B ' + v.fieldLabel);
              });

              angular.forEach(result.value.exportList, function (v, k) {
                angular.forEach(result.value.resultFields, function (vv, kk) {
                  v[vv.fieldName + 'A'] = v.fieldsA[vv.fieldName];
                  v[vv.fieldName + 'B'] = v.fieldsB[vv.fieldName];
                });
                delete v.fieldsA;
                delete v.fieldsB;
              });
            } else {
              angular.forEach(result.value.exportList, function (v, k) {
                delete v.fieldsA;
                delete v.fieldsB;
              });
            }

            $scope.bExport.dataList.push.apply($scope.bExport.dataList, result.value.exportList);
            var offSetNew = $scope.bExport.callOffset + parseInt(result.totalItems);

            $scope.bExport.callOffset = offSetNew;

            if ($scope.bExport.dataList.length == 1) {
              $scope.bExport.text =
                $scope.bExport.dataList.length + ' ' + dc3Translate('RECORD_FETCHED', 'record fetched');
            } else {
              $scope.bExport.text =
                $scope.bExport.dataList.length + ' ' + dc3Translate('RECORDS_FETCHED', 'records fetched');
            }

            var data = [];
            data.push(JSON.stringify($scope.bExport.csvHeader));
            $scope.bExport.dataList.forEach(function (item) {
              data.push(JSON.stringify(Object.values(item)));
            });

            // convert to csv
            $scope.fileBlob = data.join('\n').replace(/(^\[)|(\]$)/gm, '');

            $scope.bExport.isLoading = false;
          }
        },
        function (reason) {
          $scope.bExport.isLoading = false;
          alert(reason);
        }
      );
    };

    $scope.$watch('bExport.callOffset', function (newOffSet, oldOffSet) {
      if (newOffSet !== oldOffSet && $scope.getData) {
        $scope.bExport.isLoading = true;
        $scope.getExportData($scope.meta.jobId, $scope.bExport.callOffset);
      } else {
        $scope.bExport.isLoading = false;
      }
    });
  })
  .controller('batchExportResultController', function ($scope, $rootScope, $interval, remoting) {
    $scope.init = function () {
      console.log('init batchExportResultController');
      let dataStore = angular.element('#dc3ModalExportResults');
      $scope.modalData = {
        creatingJob : false,
        exportUrl : dataStore.data('sf-create-export-job-url'),
        resultFieldUrl : dataStore.data('sf-result-fields-url')
      };

      remoting.singleService($scope.modalData.resultFieldUrl, $scope.meta.job.jobId).then(
        function (result) {
          console.log(result.value)
          $scope.modalData.resultFields = result.value;
        },
        function (reason) {
          console.error(reason);
          alert(reason);
        }
      );
    };

    $scope.init();

    $scope.createExportJob = function () {
      $scope.creatingJob = true;
      remoting.singleService($scope.modalData.exportUrl, $scope.meta.job.jobId).then(
        function (result) {
          $scope.creatingJob = false;
          $scope.closeExportModal();
          $rootScope.modal.modalDCLocal = true;
        },
        function (reason) {
          $scope.creatingJob = false;
          console.error(reason);
          alert(reason);
        }
      );
    };

    $scope.getResultFields = function(){
      if ($scope.modalData.resultFields){
        return $scope.modalData.resultFields.map((rs) => {
          return rs.fieldLabel;
        })
        .sort( )
        .join(', ');
      }
      return '';
    };
  });
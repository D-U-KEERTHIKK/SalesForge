var G2 = G2 || {};
G2.AssetLibrary = G2.AssetLibrary || {};
G2.setupAssetLibrary = function (initializer) {
  G2.app.controller('AssetLibrary', function ($sce, $scope, $uibModal, $controller) {
    $controller('BaseController', { $scope: $scope });
    $scope.$on('loaded', function (e) {
      $scope.init();
    })

    $scope.init = function () {
      $scope.Assets = G2.$.parseJSON(initializer.vars.Assets);
      G2.$.each($scope.Assets, function (i, asset) {
        if ($scope.$parent.types.indexOf(asset.G2Crowd__Type__c) == -1) {
          $scope.$parent.types.push(asset.G2Crowd__Type__c)
        }

        asset.G2Crowd__ProductName__c = asset.G2Crowd__G2_Product__r.Name;
        asset.ImageUrl = $scope.image(asset.G2Crowd__Type__c);
        if ($scope.$parent.FormattedFavorites['mine'] !== undefined && $scope.$parent.FormattedFavorites['mine'][asset.Id] !== undefined) {
          asset.folders = $scope.$parent.FormattedFavorites['mine'][asset.Id];
        }

        if ($scope.$parent.FormattedFavorites['shared'] !== undefined && $scope.$parent.FormattedFavorites['shared'][asset.Id] !== undefined) {
          asset.sharedFolders = $scope.$parent.FormattedFavorites['shared'][asset.Id];
        }
      });
    }

    $scope.image = function (type) {
      var imageList = G2.ImageMap[type]
      return imageList[Math.floor(Math.random() * imageList.length)];
    }

    $scope.share = function (asset, size) {
      var parentElem = angular.element(G2.$('.G2Crowd'));
      $uibModal.open({
        animation: $scope.animationsEnabled,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'G2Share.html',
        controller: function ($uibModalInstance, asset) {
          var $ctrl = this;
          $ctrl.asset = asset
          $ctrl.encodedURL = encodeURIComponent(asset.G2Crowd__URL__c);
          $ctrl.isClassic = $scope.isClassic;
          $ctrl.redirect = function (url) {
            sforce.one.navigateToURL(url);
          }

          $ctrl.copy = function (createType) {
            $uibModalInstance.close();
          };

          $ctrl.cancel = function () {
            $uibModalInstance.dismiss();
          };
          $scope.$ctrl = $ctrl;
        },
        controllerAs: '$ctrl',
        size: size,
        appendTo: parentElem,
        resolve: {
          asset: function () {
            return asset;
          }
        }
      });
    };

    $scope.favorite = function (asset) {
      $scope.$parent.open(asset);
    }

    G2.$('.G2Crowd').on("click", function () {
      G2.$(".showup").hide();
    });

    G2.$('.G2Crowd').on("click", ".showup, .showup-button", function (event) {
      event.stopPropagation();
    });

    $scope.focus = function (id) {
      var $container = G2.$('#' + id);
      G2.$(".showup").hide();
      $container.show();
    }

    $scope.isClassic = initializer.vars.isClassic;

    $scope.isNew = function (asset) {
      if (asset === undefined) {
        return false;
      }
      return Date.now() - Date.parse(asset.CreatedDate) < (1 * 24 * 60 * 60 * 1000);
    }

    $scope.isUpdated = function (asset) {
      if (asset === undefined) {
        return false;
      }
      return !$scope.isNew(asset) && Date.now() - Date.parse(asset.G2Crowd__G2_Updated_At__c) < (7 * 24 * 60 * 60 * 1000);
    }

    $scope.encodeUrl = function (url, recordUrl) {
      var encodedURL = encodeURIComponent(recordUrl);
      return url + encodedURL;
    }
  });
}
document.addEventListener('readyAssetLibrary', function () {
  G2.setupAssetLibrary(G2.AssetLibrary)
});

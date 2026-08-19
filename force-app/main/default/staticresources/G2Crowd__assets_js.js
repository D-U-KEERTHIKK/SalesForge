var G2 = G2 || {};
G2.Assets = G2.Assets || {};
G2.setupAssets = function (initializer) {
  G2.app.factory('AssetRemotingFactory', function ($q, $rootScope) {
    var factory = {};
    factory.ReloadFolders = function () {
      var deferred = $q.defer();
      G2.Assets.ReloadFolders(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      });
      return deferred.promise;
    }
    factory.ReloadFolder = function (id) {
      var deferred = $q.defer();
      G2.Assets.ReloadFolder(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, id);
      return deferred.promise;
    }
    factory.GetFavorites = function (folderId) {
      var deferred = $q.defer();
      G2.Assets.GetFavorites(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, folderId);
      return deferred.promise;
    }
    factory.RemoveFavorite = function (id) {
      var deferred = $q.defer();
      G2.Assets.RemoveFavorite(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, id);
      return deferred.promise;
    }
    factory.RemoveFolder = function (id) {
      var deferred = $q.defer();
      G2.Assets.RemoveFolder(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, id);
      return deferred.promise;
    }
    factory.AddToFolder = function (assetId, FolderId, type) {
      var deferred = $q.defer();
      G2.Assets.AddToFolder(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, assetId, FolderId, type);
      return deferred.promise;
    }
    factory.CreateAndAddToFolder = function (name, description, assetId, type, shared) {
      var deferred = $q.defer();
      G2.Assets.CreateAndAddToFolder(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, name, description, assetId, type, shared);
      return deferred.promise;
    }
    factory.UpdateFolder = function (name, description, shared, id) {
      var deferred = $q.defer();
      G2.Assets.UpdateFolder(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, name || '', description || '', shared || false, id);
      return deferred.promise;
    }
    factory.GetEvents = function (recordId) {
      var deferred = $q.defer();
      G2.Assets.GetEvents(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, recordId);
      return deferred.promise;
    }
    return factory;
  });

  G2.Assets.GetEvents = function (callback, recordId) {
    var method = initializer.callouts.GetAccountEvents;
    if (initializer.vars.Type === 'Lead') {
      method = initializer.callouts.GetLeadEvents;
    }
    Visualforce.remoting.Manager.invokeAction(method, recordId, callback, { escape: false });
  }

  G2.Assets.CreateAndAddToFolder = function (callback, name, description, assetId, type, shared) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.CreateAndAddToFolder, name, description || '', assetId, type, shared || false,
      callback,
      { escape: false }
    );
  }

  G2.Assets.GetFavorites = function (callback, folderId) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.GetFavorites, folderId,
      callback,
      { escape: false }
    );
  }

  G2.Assets.UpdateFolder = function (callback, name, description, shared, id) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.UpdateFolder, name, description, shared || false, id,
      callback,
      { escape: false }
    );
  }

  G2.Assets.ReloadFolders = function (callback) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.ReloadFolders,
      callback,
      { escape: false }
    );
  }

  G2.Assets.ReloadFolder = function (callback, id) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.ReloadFolder, id,
      callback,
      { escape: false }
    );
  }

  G2.Assets.AddToFolder = function (callback, assetId, FolderId, type) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.AddToFolder, assetId, FolderId, type,
      callback,
      { escape: false }
    );
  }

  G2.Assets.RemoveFavorite = function (callback, id) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.RemoveFavorite, id + '',
      callback,
      { escape: false }
    );
  }

  G2.Assets.RemoveFolder = function (callback, id) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.RemoveFolder, id + '',
      callback,
      { escape: false }
    );
  }

  G2.ImageMap = {
    'Reference': ['https://s3.amazonaws.com/sf-app-build/references.png'],
    'Report': ['https://s3.amazonaws.com/sf-app-build/comparisons.png', 'https://s3.amazonaws.com/sf-app-build/g2reports.png', 'https://s3.amazonaws.com/sf-app-build/indexes.png']
  };
  G2.app.controller('G2CrowdLibrary', function ($scope, $uibModal, AssetRemotingFactory, $controller) {
    $controller('BaseController', { $scope: $scope });
    //DEFAULTS
    $scope.Folders = { 'mine': [], 'shared': [] };
    $scope.folders = 1;
    $scope.tabIndex = 5;
    $scope.RecordId = initializer.vars.RecordId;
    $scope.pagesLoading = [];
    $scope.types = [''];
    $scope.fullAccess = initializer.vars.fullAccess;
    $scope.FormattedFavorites = { 'mine': [], 'shared': [] };
    $scope.isEmbedded = initializer.vars.isEmbedded;
    $scope.Type = initializer.vars.Type;

    $scope.setLoading = function (page) {
      $scope.pagesLoading.push(page);
    };

    $scope.doneLoading = function (page) {
      var index = $scope.pagesLoading.indexOf(page);
      if (index !== -1) {
        $scope.pagesLoading.splice(index, 1);
      }
    };

    $scope.processFolder = function (folder) {
      var public = 'mine';
      if (folder.G2Crowd__Shared__c == true) {
        public = 'shared';
      }
      folder.index = $scope.tabIndex;
      $scope.tabIndex++;
      $scope.processFormattedFavorites(folder, public);
      $scope.Folders[public].push(folder);
    }

    $scope.processFormattedFavorites = function (folder, public) {
      if (folder.G2Crowd__G2_Favorites__r) {
        G2.$.each(folder.G2Crowd__G2_Favorites__r, function (i, favorite) {
          var folder_data = folder;
          folder_data.favoriteId = favorite.Id;
          var item_id = favorite.G2Crowd__G2_Asset__c;
          if (favorite.G2Crowd__G2_Review__r !== undefined) {
            item_id = favorite.G2Crowd__G2_Review__r.G2Crowd__G2_Review_ID__c;
          }
          $scope.FormattedFavorites[public][item_id] = $scope.FormattedFavorites[public][item_id] || [];
          $scope.FormattedFavorites[public][item_id].push(folder_data);
        })
      }
    }

    $scope.fetchFavorites = function (folder) {
      $scope.expanded = [];
      $scope.selectedForCopy = [];
      G2.$('.copy-content-to-here .Review').html('');
      G2.$('.copy-content-to-here .Content').html('');
      $scope.selectedFolder = folder.Name;
      $scope.setLoading('FolderFavorites');
      AssetRemotingFactory.GetFavorites(folder.Id).then(function (result) {
        $scope.processFavorites(result, folder);
        $scope.doneLoading('FolderFavorites');
      })
    }

    $scope.processFavorites = function (favorites, folder) {
      var public = 'mine';
      if (folder.G2Crowd__Shared__c == true) {
        public = 'shared';
      }
      $scope.favorites[public][folder.Name] = { favorites: [] };
      G2.$.each(favorites, function (i, favorite) {
        if (favorite.favorite.G2Crowd__G2_Review__c !== undefined) {
          favorite.Title = favorite.favorite.G2Crowd__G2_Review__r.G2Crowd__Title__c;
          favorite.URL = favorite.favorite.G2Crowd__G2_Review__r.G2Crowd__G2_URL__c;
          favorite.Type = 'Review';
          favorite.G2Crowd__ProductName__c = favorite.favorite.G2Crowd__G2_Review__r.G2Crowd__G2_Product__r.Name;
        } else {
          favorite.Title = favorite.favorite.G2Crowd__G2_Asset__r.G2Crowd__Title__c;
          favorite.URL = favorite.favorite.G2Crowd__G2_Asset__r.G2Crowd__URL__c;
          favorite.Type = favorite.favorite.G2Crowd__G2_Asset__r.G2Crowd__Type__c;
          favorite.ImageUrl = $scope.image(favorite.Type);
          favorite.G2Crowd__ProductName__c = favorite.favorite.G2Crowd__G2_Asset__r.G2Crowd__G2_Product__r.Name;
        }
        $scope.favorites[public][folder.Name].favorites.push(favorite);
      });
    }

    $scope.favorites = { 'mine': {}, 'shared': {} }

    $scope.addToFolder = function (assetId, folderId, type) {
      $scope.setLoading('Apex');
      AssetRemotingFactory.AddToFolder(assetId, folderId, type).then(function (result) {
        $scope.notice = result;
        $scope.init();
        $scope.doneLoading('Apex');
      })
    }

    $scope.createAndAddFolder = function (folder, assetId, type) {
      $scope.setLoading('Apex');
      AssetRemotingFactory.CreateAndAddToFolder(folder.name, folder.description, assetId, type, folder.shared).then(function (result) {
        $scope.notice = result;
        $scope.reloadAllFolders();
      })
    }

    $scope.reloadAllFolders = function () {
      AssetRemotingFactory.ReloadFolders().then(function (results) {
        $scope.Folders = { 'mine': [], 'shared': [] };
        G2.$.each(results, function (i, folder) {
          $scope.processFolder(folder);
        })
        $scope.init();
        $scope.doneLoading('Apex');
      })
    }

    $scope.removeFolder = function (id) {
      $scope.setLoading('Apex');
      AssetRemotingFactory.RemoveFolder(id).then(function (result) {
        $scope.notice = result;
        $scope.reloadAllFolders();
      })
    }

    $scope.updateFolder = function (folder) {
      $scope.setLoading('Apex');
      AssetRemotingFactory.UpdateFolder(folder.Name, folder.G2Crowd__Description__c, folder.G2Crowd__Shared__c, folder.Id).then(function (result) {
        $scope.notice = result;
        $scope.reloadAllFolders();
      })
    }

    $scope.openEdit = function (folder, size) {
      var parentElem = angular.element(G2.$('.G2Crowd'));
      $uibModal.open({
        animation: $scope.animationsEnabled,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'G2EditFolder.html',
        controller: function ($uibModalInstance, folder) {
          var $ctrl = this;
          $ctrl.folder = folder
          $ctrl.ok = function (createType) {
            $scope.updateFolder(folder);
            $uibModalInstance.close();
          };

          $ctrl.cancel = function () {
            $uibModalInstance.dismiss();
          };

          $scope.openEditCtrl = $ctrl;
        },
        controllerAs: '$ctrl',
        size: size,
        appendTo: parentElem,
        resolve: {
          folder: function () {
            return folder;
          }
        }
      });
    };

    $scope.open = function (asset, type, size) {
      var parentElem = angular.element(G2.$('.G2Crowd'));
      $uibModal.open({
        animation: $scope.animationsEnabled,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'G2ModalForm.html',
        controller: function ($uibModalInstance, asset) {
          var $ctrl = this;
          type = type || 'Asset';
          $ctrl.asset = asset;
          $ctrl.fullAccess = $scope.fullAccess;
          $ctrl.Folders = [];
          var AssetID = asset.Id || asset.id;

          var ExistingFolders = $scope.FormattedFavorites['mine'][AssetID] !== undefined ? $scope.FormattedFavorites['mine'][AssetID].map(function (f) {
            return f.Name
          }) : [];
          var ExistingSharedFolders = $scope.FormattedFavorites['shared'][AssetID] !== undefined ? $scope.FormattedFavorites['shared'][AssetID].map(function (f) {
            return f.Name
          }) : [];

          G2.$.each($scope.Folders['mine'], function (i, folder) {
            folder.type = 'My Folders';
            if (ExistingFolders.indexOf(folder.Name) == -1) {
              $ctrl.Folders.push(folder);
            }
          });
          if ($ctrl.fullAccess) {
            G2.$.each($scope.Folders['shared'], function (i, folder) {
              folder.type = 'Shared Folders';
              if (ExistingSharedFolders.indexOf(folder.Name) == -1) {
                $ctrl.Folders.push(folder);
              }
            });
          }

          $ctrl.folderSize = $ctrl.Folders.length;
          $ctrl.ok = function (createType) {
            if (createType === 'CreateAndAdd') {
              $scope.createAndAddFolder($ctrl.folder, AssetID, type);
            } else if (createType === 'Add') {
              $scope.addToFolder(AssetID, $ctrl.FolderId, type);
            }
            $uibModalInstance.close();
          };

          $ctrl.cancel = function () {
            $uibModalInstance.dismiss();
          };
          $scope.openCtrl = $ctrl;
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

    //INITIALIZERS
    $scope.init = function () {
      $scope.setLoading('Init');
      $scope.FormattedFavorites = { 'mine': [], 'shared': [] };
      AssetRemotingFactory.ReloadFolders().then(function (results) {
        $scope.Folders = { 'mine': [], 'shared': [] };
        results = results || []
        G2.$.each(results, function (i, folder) {
          $scope.processFolder(folder);
        })
        $scope.$broadcast('loaded');
        $scope.doneLoading('Init');
      })
    }

    $scope.initFolder = function (folder) {
      $scope.setLoading('initFolder')
      AssetRemotingFactory.ReloadFolder(folder.Id).then(function (folder) {
        var public = 'mine';
        if (folder.G2Crowd__Shared__c == true) {
          public = 'shared';
        }
        $scope.processFormattedFavorites(folder, public);
        $scope.fetchFavorites(folder);
        $scope.doneLoading('initFolder')
      })
    }

    $scope.init();

    $scope.setFolders = function (number) {
      $scope.folders = number;
    }

    $scope.remove = function (id) {
      $scope.setLoading('remove');
      AssetRemotingFactory.RemoveFavorite(id).then(function (result) {
        $scope.notice = result;
        $scope.init();
        $scope.doneLoading('remove');
      })
    }

    $scope.removeFromFolder = function (id, folder) {
      $scope.setLoading('Apex');
      AssetRemotingFactory.RemoveFavorite(id).then(function (result) {
        $scope.notice = result;
        $scope.initFolder(folder);
        $scope.doneLoading('Apex');
      })
    };

    $scope.selectedForCopy = {};

    $scope.checkboxClicked = function (id, type) {
      if (Object.keys($scope.selectedForCopy).indexOf(id) > -1) {
        delete $scope.selectedForCopy[id];
      } else {
        $scope.selectedForCopy[id] = type;
      }
    }

    $scope.copyAll = function () {
      G2.$('.copy-content-to-here .Review').html('');
      G2.$('.copy-content-to-here .Content').html('');
      G2.$.each(Object.keys($scope.selectedForCopy), function (i, id) {
        var append = '<hr style="margin: 16px 0 0 0;"/>'
        var type = $scope.selectedForCopy[id];
        var html = G2.$('#' + id + ' .copy-content').html();
        if (type !== 'Review') {
          type = 'Content';
          append = '<div style="margin: 16px 0 0 0;"/>';
        }
        G2.$('.copy-content-to-here .' + type).append(html + append);
      })
      G2.$('.hiddenCopy').click();
      $scope.notice = 'Copied to Clipboard';
    }

    $scope.copyMultiReviews = function () {
      G2.$('.copy-content-to-here .Review').html('');
      G2.$('.copy-content-to-here .Content').html('');
      G2.$.each(Object.keys($scope.selectedReviews), function (i, id) {
        var append = '<hr style="margin: 16px 0 0 0;"/>'
        var type = 'Review';
        var html = G2.$('.review-' + id).html();
        G2.$('.copy-content-to-here .' + type).append(html + append);
      })
      G2.$('.hiddenCopy').click();
      $scope.notice = 'Copied to Clipboard';
      $scope.selectedReviews = {};
    }

    $scope.copyOne = function (id) {
      G2.$('.review-copy-here .Review').html('');
      var html = G2.$('.review-' + id).html();

      G2.$('.review-copy-here .Review').append(html);
      G2.$('.hiddenReviewCopy').click();
      $scope.notice = 'Copied to Clipboard';
    }

    $scope.expanded = [];
    $scope.expand = function (id) {
      $scope.expanded.push(id);
      G2.$('#review_' + id).show();
    }

    $scope.collapse = function (id) {
      $scope.expanded.splice($scope.expanded.indexOf(id), 1);
      G2.$('#review_' + id).hide();
    }

    $scope.getStarImg = function (number) {
      return G2.starMap[number];
    }

    $scope.toggleNav = function () {
      $scope.sidenavShow = !$scope.sidenavShow
    }

    $scope.encodeUrl = function (url, recordUrl) {
      var encodedURL = encodeURIComponent(recordUrl);
      return url + encodedURL
    }

    $scope.tab = 1;
    $scope.loadReviews = function () {
      $scope.switchTab(3);
      $scope.$broadcast('loadReviews');
    }

    $scope.switchTab = function (index) {
      $scope.tab = index;
      G2.$('.demo-tab').hide();
      G2.$('#tab-default-' + index).show();
    }

    $scope.setupAccount = function (result) {
      $scope.events = result;
      $scope.chartData = [];

      var productIds = $scope.RawProductList.map(function (a) {
        return a.G2Crowd__G2_Unique_Identifier__c
      });
      if ($scope.events.length > 0) {
        var dataGroup = {};
        G2.$.each($scope.events, function (i, event) {
          var tag = event.G2Crowd__Resource_Name__c;

          if (dataGroup[tag] === undefined) {
            dataGroup[tag] = 1;
          } else {
            dataGroup[tag] = dataGroup[tag] + 1;
          }
          if (tag == 'Comparisons') {
            logos = JSON.parse(event.G2Crowd__Logo_URLs__c);
            event.logo_urls = [];
            G2.$.each(logos, function (id, url) {

              if (productIds.indexOf(id) > -1) {
                return
              }
              event.logo_urls.push(url);
            })
          }
        });

        G2.$.each(dataGroup, function (i, group) {
          $scope.chartData.push({ name: i, data: group })
        })
        G2Crowd.EventPie.reload($scope.chartData);
        G2Crowd.EventPie.show();
      } else {
        $scope.noEvents = true;
        $scope.switchTab(2);
      }
    }

    if ($scope.RecordId !== "") {
      AssetRemotingFactory.GetEvents($scope.RecordId, $scope.Type).then(function (result) {
        $scope.setupAccount(result);
      })
    } else {
      $scope.switchTab(2);
    }

    $scope.image = function (type) {
      var imageList = G2.ImageMap[type]
      return imageList[Math.floor(Math.random() * imageList.length)];
    }

    $scope.selectedReviews = {};
    $scope.isSelected = function (id) {
      return $scope.selectedReviews[id] !== undefined
    }

    $scope.updateSelection = function (id, review) {
      if ($scope.isSelected(id)) {
        delete $scope.selectedReviews[id];
      } else {
        $scope.selectedReviews[id] = review;
      }
    }
  });
}

document.addEventListener('readyAssets', function () {
  G2.setupAssets(G2.Assets);
});

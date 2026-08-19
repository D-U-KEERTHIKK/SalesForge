'use strict';
var Spec = Spec || {};

Spec.Assets = function () {
  var controller, rootScope;
  var scope, ctrl, uibModal;

  var init = function (data) {
    data = data || {
        vars: {
          RecordId: "RecordId",
          fullAccess: true,
          isEmbedded: true
        },
        callouts: {
          GetLeadEvents: 'GetLeadEvents',
          GetAccountEvents: 'GetAccountEvents',
          CreateAndAddToFolder: 'CreateAndAddToFolder',
          GetFavorites: 'GetFavorites',
          UpdateFolder: 'UpdateFolder',
          ReloadFolders: 'ReloadFolders',
          ReloadFolder: 'ReloadFolder',
          AddToFolder: 'AddToFolder',
          RemoveFavorite: 'RemoveFavorite',
          RemoveFolder: 'RemoveFolder'
        }
      }

    G2.setupAssets(data);
    inject(function ($controller, $rootScope, $uibModal) {
      rootScope = $rootScope
      scope = $rootScope.$new();
      ctrl = $controller('G2CrowdLibrary', {
        '$scope': scope,
        '$uibModal': uibModal
      });
    })
  }

  beforeEach(module('G2Crowd'));
  describe('Setters', function () {
    it('sets the defaults', function () {
      init();
      expect(scope.Folders).toEqual({'mine': [], 'shared': []})
      expect(scope.folders).toEqual(1)
      expect(scope.tabIndex).toEqual(5)
      expect(scope.RecordId).toEqual('RecordId')
      expect(scope.pagesLoading).toEqual([])
      expect(scope.types).toEqual([''])
      expect(scope.fullAccess).toEqual(true)
      expect(scope.isEmbedded).toEqual(true)
      expect(scope.FormattedFavorites).toEqual({'mine': [], 'shared': []})
    })
  })

  describe('loading', function () {
    it('adds to pagesLoading', function () {
      init();
      scope.pagesLoading = ['test'];
      scope.setLoading('page')
      expect(scope.pagesLoading).toEqual(['test', 'page'])
    })
  })

  describe('doneLoading', function () {
    it('adds to pagesLoading', function () {
      init();
      scope.pagesLoading = ['test', 'page'];
      scope.doneLoading('page')
      expect(scope.pagesLoading).toEqual(['test'])
    })
  })

  describe('processFolder', function () {
    it('calls processFormattedFavorites', function () {
      init();
      var folder = {}
      scope.Folders = {'mine': [], 'shared': []}
      spyOn(scope, 'processFormattedFavorites')
      scope.tabIndex = 0
      scope.processFolder(folder)
      expect(scope.processFormattedFavorites).toHaveBeenCalledWith(folder, 'mine')
    })

    it('calls processFormattedFavorites with shared', function () {
      init();
      var folder = {G2Crowd__Shared__c: true}
      scope.Folders = {'mine': [], 'shared': []}
      spyOn(scope, 'processFormattedFavorites')
      scope.tabIndex = 0
      scope.processFolder(folder)
      expect(scope.processFormattedFavorites).toHaveBeenCalledWith(folder, 'shared')
    })

    it('sets folders shared', function () {
      init();
      var folder = {G2Crowd__Shared__c: true}
      scope.Folders = {'mine': [], 'shared': []}
      spyOn(scope, 'processFormattedFavorites')
      scope.tabIndex = 0

      scope.processFolder(folder)
      expect(scope.Folders).toEqual({'mine': [], 'shared': [folder]})
    })

    it('sets folders mine', function () {
      init();
      var folder = {}
      scope.Folders = {'mine': [], 'shared': []}
      spyOn(scope, 'processFormattedFavorites')
      scope.tabIndex = 0

      scope.processFolder(folder)
      expect(scope.Folders).toEqual({'mine': [folder], 'shared': []})
    })

    it('sets indexes', function () {
      init();
      var folder = {G2Crowd__Shared__c: true}
      scope.Folders = {'mine': [], 'shared': []}
      spyOn(scope, 'processFormattedFavorites')
      scope.tabIndex = 0

      scope.processFolder(folder)
      expect(scope.tabIndex).toEqual(1)
      expect(folder.index).toEqual(0)
    })
  })

  describe('processFolder', function () {
    it('does nothing if no favorites', function () {
      init();
      var folder = {}
      expect(scope.processFormattedFavorites(folder, 'mine')).toEqual(undefined)
    })

    describe('with folders', function () {
      var folders = function (favorites) {
        return {G2Crowd__G2_Favorites__r: favorites};
      }

      it('does nothing', function () {
        init();
        scope.processFormattedFavorites(folders([]), 'mine')
        expect(scope.FormattedFavorites).toEqual({'mine': [], 'shared': []})
      })

      it('processed mine', function () {
        init();
        var data = folders([
          {G2Crowd__G2_Asset__c: 'G2Crowd__G2_Asset__c1', Id: 'Id1'},
          {Id: 'Id2', G2Crowd__G2_Review__r: {G2Crowd__G2_Review_ID__c: 'G2Crowd__G2_Review_ID__c2'}}
        ])
        scope.processFormattedFavorites(data, 'mine')
        expect(scope.FormattedFavorites.mine.G2Crowd__G2_Asset__c1).toEqual([
          {
            G2Crowd__G2_Favorites__r: [
              {G2Crowd__G2_Asset__c: 'G2Crowd__G2_Asset__c1', Id: 'Id1'},
              {Id: 'Id2', G2Crowd__G2_Review__r: {G2Crowd__G2_Review_ID__c: 'G2Crowd__G2_Review_ID__c2'}}
            ], favoriteId: 'Id2',
          }
        ])

        expect(scope.FormattedFavorites.mine.G2Crowd__G2_Review_ID__c2).toEqual([{
          G2Crowd__G2_Favorites__r: [
            {G2Crowd__G2_Asset__c: 'G2Crowd__G2_Asset__c1', Id: 'Id1'},
            {Id: 'Id2', G2Crowd__G2_Review__r: {G2Crowd__G2_Review_ID__c: 'G2Crowd__G2_Review_ID__c2'}}
          ], favoriteId: 'Id2',
        }])
      })

      it('processed shared', function () {
        init();
        var data = folders([
          {G2Crowd__G2_Asset__c: 'G2Crowd__G2_Asset__c1', Id: 'Id1'},
          {Id: 'Id2', G2Crowd__G2_Review__r: {G2Crowd__G2_Review_ID__c: 'G2Crowd__G2_Review_ID__c2'}}
        ])
        scope.processFormattedFavorites(data, 'shared')
        expect(scope.FormattedFavorites.shared.G2Crowd__G2_Asset__c1).toEqual([
          {
            G2Crowd__G2_Favorites__r: [
              {G2Crowd__G2_Asset__c: 'G2Crowd__G2_Asset__c1', Id: 'Id1'},
              {Id: 'Id2', G2Crowd__G2_Review__r: {G2Crowd__G2_Review_ID__c: 'G2Crowd__G2_Review_ID__c2'}}
            ], favoriteId: 'Id2',
          }
        ])

        expect(scope.FormattedFavorites.shared.G2Crowd__G2_Review_ID__c2).toEqual([{
          G2Crowd__G2_Favorites__r: [
            {G2Crowd__G2_Asset__c: 'G2Crowd__G2_Asset__c1', Id: 'Id1'},
            {Id: 'Id2', G2Crowd__G2_Review__r: {G2Crowd__G2_Review_ID__c: 'G2Crowd__G2_Review_ID__c2'}}
          ], favoriteId: 'Id2',
        }])
      })
    })
  })

  describe('fetchFavorites', function () {
    it('calls visualforce', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }
      spyOn(Visualforce.remoting.Manager, 'invokeAction')
      scope.fetchFavorites({Id: 'test', Name: 'test'})

      expect(scope.expanded).toEqual([])
      expect(scope.selectedForCopy).toEqual([])
      expect(scope.selectedFolder).toEqual('test')
      expect(Visualforce.remoting.Manager.invokeAction).toHaveBeenCalled();
    })

    it('calls processFavorites', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');
      })
      spyOn(scope, 'processFavorites')
      scope.fetchFavorites({Id: 'test'})
      scope.$apply();
      expect(scope.processFavorites).toHaveBeenCalledWith('test result', {Id: 'test'})
    })
  })

  describe('processFavorites', function () {
    it('sets the favorite API up', function () {
      init();
      spyOn(scope, 'image').and.returnValue('test')
      var favs = [
        {
          favorite: {
            G2Crowd__G2_Review__c: 'G2Crowd__G2_Review__r:',
            G2Crowd__G2_Review__r: {
              G2Crowd__Title__c: 'G2Crowd__Title__c',
              G2Crowd__G2_URL__c: 'G2Crowd__G2_URL__c',
              G2Crowd__G2_Product__r: {Name: 'PName'}
            }
          }
        },
        {
          favorite: {
            G2Crowd__G2_Asset__r: {
              G2Crowd__Title__c: 'G2Crowd__Title__c',
              G2Crowd__URL__c: 'G2Crowd__URL__c',
              G2Crowd__Type__c: 'G2Crowd__Type__c',
              G2Crowd__G2_Product__r: {Name: 'PName'}
            }
          }
        }
      ]
      scope.processFavorites(favs, {G2Crowd__Shared__c: false, Name: 'FName'})

      expect(scope.favorites.mine.FName).toEqual({
        favorites: [
          {
            favorite: {
              G2Crowd__G2_Review__c: 'G2Crowd__G2_Review__r:',
              G2Crowd__G2_Review__r: {
                G2Crowd__Title__c: 'G2Crowd__Title__c',
                G2Crowd__G2_URL__c: 'G2Crowd__G2_URL__c',
                G2Crowd__G2_Product__r: {Name: 'PName'}
              }
            }, Title: 'G2Crowd__Title__c', URL: 'G2Crowd__G2_URL__c', Type: 'Review', G2Crowd__ProductName__c: 'PName'
          },
          {
            favorite: {
              G2Crowd__G2_Asset__r: {
                G2Crowd__Title__c: 'G2Crowd__Title__c',
                G2Crowd__URL__c: 'G2Crowd__URL__c',
                G2Crowd__Type__c: 'G2Crowd__Type__c',
                G2Crowd__G2_Product__r: {Name: 'PName'}
              }
            },
            Title: 'G2Crowd__Title__c',
            URL: 'G2Crowd__URL__c',
            Type: 'G2Crowd__Type__c',
            ImageUrl: 'test',
            G2Crowd__ProductName__c: 'PName'
          }
        ]
      })
    })

    it('for shared', function () {
      init();
      spyOn(scope, 'image').and.returnValue('test')
      var favs = [
        {
          favorite: {
            G2Crowd__G2_Review__c: 'G2Crowd__G2_Review__r:',
            G2Crowd__G2_Review__r: {
              G2Crowd__Title__c: 'G2Crowd__Title__c',
              G2Crowd__G2_URL__c: 'G2Crowd__G2_URL__c',
              G2Crowd__G2_Product__r: {Name: 'PName'}
            }
          }
        },
        {
          favorite: {
            G2Crowd__G2_Asset__r: {
              G2Crowd__Title__c: 'G2Crowd__Title__c',
              G2Crowd__URL__c: 'G2Crowd__URL__c',
              G2Crowd__Type__c: 'G2Crowd__Type__c',
              G2Crowd__G2_Product__r: {Name: 'PName'}
            }
          }
        }
      ]
      scope.processFavorites(favs, {G2Crowd__Shared__c: true, Name: 'FName'})

      expect(scope.favorites.shared.FName).toEqual({
        favorites: [
          {
            favorite: {
              G2Crowd__G2_Review__c: 'G2Crowd__G2_Review__r:',
              G2Crowd__G2_Review__r: {
                G2Crowd__Title__c: 'G2Crowd__Title__c',
                G2Crowd__G2_URL__c: 'G2Crowd__G2_URL__c',
                G2Crowd__G2_Product__r: {Name: 'PName'}
              }
            }, Title: 'G2Crowd__Title__c', URL: 'G2Crowd__G2_URL__c', Type: 'Review', G2Crowd__ProductName__c: 'PName'
          },
          {
            favorite: {
              G2Crowd__G2_Asset__r: {
                G2Crowd__Title__c: 'G2Crowd__Title__c',
                G2Crowd__URL__c: 'G2Crowd__URL__c',
                G2Crowd__Type__c: 'G2Crowd__Type__c',
                G2Crowd__G2_Product__r: {Name: 'PName'}
              }
            },
            Title: 'G2Crowd__Title__c',
            URL: 'G2Crowd__URL__c',
            Type: 'G2Crowd__Type__c',
            ImageUrl: 'test',
            G2Crowd__ProductName__c: 'PName'
          }
        ]
      })
    })
  })

  describe('addToFolder', function () {
    it('calles visualforce', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }
      spyOn(Visualforce.remoting.Manager, 'invokeAction')

      scope.addToFolder('123', '123', 'test')

      expect(Visualforce.remoting.Manager.invokeAction).toHaveBeenCalled();
    })

    it('sets notice', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }
      spyOn(scope, 'init')
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');
      })
      scope.addToFolder('123', '123', 'test')

      scope.$apply();

      expect(scope.notice).toEqual('test result');
    })

    it('calls init', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }
      spyOn(scope, 'init')
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');
      })
      scope.addToFolder('123', '123', 'test')

      scope.$apply();

      expect(scope.init).toHaveBeenCalled();
    })

    it('calls loadings', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }
      spyOn(scope, 'init')
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');
      })
      scope.addToFolder('123', '123', 'test')
      scope.$apply();

      expect(scope.setLoading).toHaveBeenCalledWith('Apex');
      expect(scope.doneLoading).toHaveBeenCalledWith('Apex');
    })
  })

  describe('createAndAddFolder', function () {
    it('calls CreateAndAddToFolder visualforce', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }
      spyOn(G2.Assets, 'CreateAndAddToFolder')

      scope.createAndAddFolder('123', '123', 'test')

      expect(G2.Assets.CreateAndAddToFolder).toHaveBeenCalled();
    })

    it('calls reloadAllFolders', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(scope, 'reloadAllFolders')
      spyOn(scope, 'setLoading')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');
      })

      scope.createAndAddFolder('123', '123', 'test')
      scope.$digest();

      expect(scope.reloadAllFolders).toHaveBeenCalled();
    })

    it('sets notice', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(scope, 'reloadAllFolders')
      spyOn(scope, 'setLoading')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');
      })

      scope.createAndAddFolder('123', '123', 'test')
      scope.$digest();

      expect(scope.notice).toEqual('test result');
    })
  })

  describe('reloadAllFolders', function () {
    it('calls ReloadFolders visualforce', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');

      })
      spyOn(G2.Assets, 'ReloadFolders')

      scope.reloadAllFolders('123', '123', 'test')

      expect(G2.Assets.ReloadFolders).toHaveBeenCalled();
    })

    it('calls init', function () {
      init();
      spyOn(scope, 'init')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'processFolder')
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(G2.Assets, 'ReloadFolders').and.callFake(function (cb) {
        cb([]);
      })

      scope.reloadAllFolders('123', '123', 'test')
      scope.$apply();

      expect(scope.init).toHaveBeenCalled();
    })

    it('calls loadings', function () {
      init();
      spyOn(scope, 'init')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'processFolder')
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(G2.Assets, 'ReloadFolders').and.callFake(function (cb) {
        cb([]);
      })

      scope.reloadAllFolders('123', '123', 'test')
      scope.$apply();

      expect(scope.doneLoading).toHaveBeenCalledWith('Apex');
    })
  })

  describe('removeFolder', function () {
    it('calls RemoveFolder visualforce', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');

      })
      spyOn(G2.Assets, 'RemoveFolder')

      scope.removeFolder('123')

      expect(G2.Assets.RemoveFolder).toHaveBeenCalled();
    })

    it('calls reloadAllFolders', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(scope, 'reloadAllFolders')
      spyOn(scope, 'setLoading')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');
      })

      scope.removeFolder('123')
      scope.$digest();

      expect(scope.reloadAllFolders).toHaveBeenCalled();
    })

    it('calls loadings', function () {
      init();
      spyOn(scope, 'setLoading')

      scope.removeFolder('123')
      scope.$apply();

      expect(scope.setLoading).toHaveBeenCalledWith('Apex');
    })
  })

  describe('updateFolder', function () {
    it('calls updateFolder visualforce', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');

      })
      spyOn(G2.Assets, 'UpdateFolder')

      scope.updateFolder('123')

      expect(G2.Assets.UpdateFolder).toHaveBeenCalled();
    })

    it('calls reloadAllFolders', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(scope, 'reloadAllFolders')
      spyOn(scope, 'setLoading')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');
      })

      scope.updateFolder('123', '123', 'test')
      scope.$digest();

      expect(scope.reloadAllFolders).toHaveBeenCalled();
    })

    it('calls loadings', function () {
      init();
      spyOn(scope, 'setLoading')

      scope.updateFolder('123')
      scope.$apply();

      expect(scope.setLoading).toHaveBeenCalledWith('Apex');
    })
  })

  describe('init', function () {
    it('calls ReloadFolders visualforce', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');

      })
      spyOn(G2.Assets, 'ReloadFolders')

      scope.init()

      expect(G2.Assets.ReloadFolders).toHaveBeenCalled();
      expect(scope.Folders).toEqual({'mine': [], 'shared': []})
    })

    it('calls $broadcast', function () {
      init();
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'processFolder')
      spyOn(scope, '$broadcast')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]([]);
      })
      scope.init()
      scope.$apply();

      expect(scope.$broadcast).toHaveBeenCalledWith('loaded');
    })

    it('calls loadings', function () {
      init();
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'processFolder')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]([]);
      })
      scope.init()
      scope.$apply();

      expect(scope.setLoading).toHaveBeenCalledWith('Init');
      expect(scope.doneLoading).toHaveBeenCalledWith('Init');
    })
  })

  describe('initFolder', function () {
    it('calls ReloadFolder visualforce', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]('test result');

      })
      spyOn(G2.Assets, 'ReloadFolder')

      scope.initFolder(123)

      expect(G2.Assets.ReloadFolder).toHaveBeenCalled();
      expect(scope.Folders).toEqual({'mine': [], 'shared': []})
    })

    it('calls processFormattedFavorites', function () {
      init();
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'processFormattedFavorites')
      spyOn(scope, 'fetchFavorites')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]({G2Crowd__Shared__c: true});
      })
      scope.initFolder(123)
      scope.$apply();

      expect(scope.processFormattedFavorites).toHaveBeenCalledWith({G2Crowd__Shared__c: true}, 'shared');
    })

    it('calls fetchFavorites', function () {
      init();
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'processFormattedFavorites')
      spyOn(scope, 'fetchFavorites')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]({G2Crowd__Shared__c: true});
      })
      scope.initFolder(123)
      scope.$apply();

      expect(scope.fetchFavorites).toHaveBeenCalledWith({G2Crowd__Shared__c: true});
    })

    it('calls loadings', function () {
      init();
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'processFormattedFavorites')
      spyOn(scope, 'fetchFavorites')
      spyOn(Visualforce.remoting.Manager, 'invokeAction').and.callFake(function () {
        arguments[arguments.length - 2]({});
      })
      scope.initFolder(123)
      scope.$apply();

      expect(scope.setLoading).toHaveBeenCalledWith('initFolder');
      expect(scope.doneLoading).toHaveBeenCalledWith('initFolder');
    })
  })

  describe('remove', function () {
    it('calls ReloadFolder visualforce', function () {
      init();
      spyOn(G2.Assets, 'RemoveFavorite')
      scope.remove(123)

      expect(G2.Assets.RemoveFavorite).toHaveBeenCalled();
    })

    it('calls init', function () {
      init();
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'init')
      spyOn(G2.Assets, 'RemoveFavorite').and.callFake(function () {
        arguments[arguments.length - 2]({});
      })
      scope.remove(123)
      scope.$apply();

      expect(scope.init).toHaveBeenCalled();
    })

    it('calls loadings', function () {
      init();
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'init')
      spyOn(G2.Assets, 'RemoveFavorite').and.callFake(function () {
        arguments[arguments.length - 2]({});
      })
      scope.remove(123)
      scope.$apply();

      expect(scope.setLoading).toHaveBeenCalledWith('remove');
      expect(scope.doneLoading).toHaveBeenCalledWith('remove');
    })
  })

  describe('removeFromFolder', function () {
    it('calls ReloadFolder visualforce', function () {
      init();
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
            }
          }
        }
      }

      spyOn(G2.Assets, 'RemoveFavorite')
      scope.removeFromFolder(123, {})

      expect(G2.Assets.RemoveFavorite).toHaveBeenCalled();
    })

    it('calls init', function () {
      init();
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'initFolder')
      spyOn(G2.Assets, 'RemoveFavorite').and.callFake(function () {
        arguments[arguments.length - 2]({G2Crowd__Shared__c: true});
      })
      scope.removeFromFolder(123, {})
      scope.$apply();

      expect(scope.initFolder).toHaveBeenCalledWith({});
    })

    it('calls loadings', function () {
      init();
      spyOn(scope, 'setLoading')
      spyOn(scope, 'doneLoading')
      spyOn(scope, 'initFolder')
      spyOn(G2.Assets, 'RemoveFavorite').and.callFake(function () {
        arguments[arguments.length - 2]({G2Crowd__Shared__c: true});
      })
      scope.removeFromFolder(123, {})
      scope.$apply();

      expect(scope.setLoading).toHaveBeenCalledWith('Apex');
      expect(scope.doneLoading).toHaveBeenCalledWith('Apex');
    })
  })

  describe('loadReviews', function () {
    it('calls $broadcast', function () {
      init();
      spyOn(scope, 'switchTab')
      spyOn(scope, '$broadcast')
      scope.loadReviews()

      expect(scope.$broadcast).toHaveBeenCalledWith('loadReviews');
    })

    it('calls loadReviews', function () {
      init();
      spyOn(scope, 'switchTab')
      spyOn(scope, '$broadcast')
      scope.loadReviews()

      expect(scope.switchTab).toHaveBeenCalledWith(3);
    })
  })

  describe('loadReviews', function () {
    it('calls $broadcast', function () {
      init();
      spyOn(scope, 'switchTab')
      spyOn(scope, '$broadcast')
      scope.loadReviews()

      expect(scope.$broadcast).toHaveBeenCalledWith('loadReviews');
    })

    it('calls loadReviews', function () {
      init();
      spyOn(scope, 'switchTab')
      spyOn(scope, '$broadcast')
      scope.loadReviews()

      expect(scope.switchTab).toHaveBeenCalledWith(3);
    })
  })

  describe('setupAccount', function () {
    it('with no events calls switchTab', function () {
      init();
      G2Crowd = {
        EventPie: {
          reload: function () {
          }, show: function () {
          }
        }
      }
      spyOn(scope, 'switchTab')
      scope.setupAccount([])

      expect(scope.events).toEqual([]);
      expect(scope.chartData).toEqual([]);
      expect(scope.noEvents).toEqual(true);
      expect(scope.switchTab).toHaveBeenCalledWith(2);
    })

    it('with events calls sets to graph', function () {
      init();
      G2Crowd = {
        EventPie: {
          reload: function () {
          }, show: function () {
          }
        }
      }
      spyOn(G2Crowd.EventPie, 'reload')
      spyOn(G2Crowd.EventPie, 'show')
      scope.setupAccount([
        {G2Crowd__Resource_Name__c: 'G2Crowd__Resource_Name__c1', G2Crowd__Logo_URLs__c: '[]'},
        {G2Crowd__Resource_Name__c: 'G2Crowd__Resource_Name__c1', G2Crowd__Logo_URLs__c: '[]'},
        {G2Crowd__Resource_Name__c: 'G2Crowd__Resource_Name__c2', G2Crowd__Logo_URLs__c: '[]'}
      ])

      expect(G2Crowd.EventPie.reload).toHaveBeenCalledWith([{
        name: 'G2Crowd__Resource_Name__c1',
        data: 2
      }, {name: 'G2Crowd__Resource_Name__c2', data: 1}])
      expect(G2Crowd.EventPie.show).toHaveBeenCalled()
      expect(scope.events).toEqual([
        {G2Crowd__Resource_Name__c: 'G2Crowd__Resource_Name__c1', G2Crowd__Logo_URLs__c: '[]'},
        {G2Crowd__Resource_Name__c: 'G2Crowd__Resource_Name__c1', G2Crowd__Logo_URLs__c: '[]'},
        {G2Crowd__Resource_Name__c: 'G2Crowd__Resource_Name__c2', G2Crowd__Logo_URLs__c: '[]'}
      ])
    })
  })

  describe('scope.openEdit', function () {
    beforeEach(inject(function (_$uibModal_) {
      uibModal = _$uibModal_;
    }));

    var modalCtlr;
    var setUp = function () {
      spyOn(uibModal, 'open').and.callFake(function (data) {
        modalCtlr = data.controller;
      })
      scope.openEdit('folder', 'size');
    }

    it('sets the right defauls', function () {
      init();
      scope.animationsEnabled = 'animationsEnabled'
      spyOn(uibModal, 'open').and.callFake(function (data) {
        expect(data.animation).toEqual('animationsEnabled');
        expect(data.ariaLabelledBy).toEqual('modal-title');
        expect(data.ariaDescribedBy).toEqual('modal-body');
        expect(data.templateUrl).toEqual('G2EditFolder.html');
        expect(data.controllerAs).toEqual('$ctrl');
      })
      scope.openEdit('folder', 'size');
      expect(uibModal.open).toHaveBeenCalled();
    })

    describe('modal ctrl', function () {
      it('Sets defaults', function () {
        init();
        setUp();
        spyOn(window, 'encodeURIComponent').and.callFake(function (a) {
          return a;
        })
        modalCtlr('$uibModalInstance', 'folder');
        expect(scope.openEditCtrl.folder).toEqual('folder')
      });

      describe('ok', function () {
        it('calls uibModalInstance.close', function () {
          init();
          setUp();
          spyOn(scope, 'updateFolder')
          var dummy = {
            close: function () {
            }
          }

          spyOn(dummy, 'close')
          modalCtlr(dummy, 'folder');
          scope.openEditCtrl.ok()

          expect(dummy.close).toHaveBeenCalled();
        });

        it('calls scope.updateFolder', function () {
          init();
          setUp();
          spyOn(scope, 'updateFolder')
          var dummy = {
            close: function () {
            }
          }

          spyOn(dummy, 'close')
          modalCtlr(dummy, 'folder');
          scope.openEditCtrl.ok()

          expect(scope.updateFolder).toHaveBeenCalledWith('folder');
        });
      });

      describe('cancel', function () {
        it('calls uibModalInstance.dismiss', function () {
          init();
          setUp();
          var dummy = {
            dismiss: function () {
            }
          }

          spyOn(dummy, 'dismiss')
          modalCtlr(dummy, 'folder');
          scope.openEditCtrl.cancel()

          expect(dummy.dismiss).toHaveBeenCalled();
        });
      });
    })
  });

  describe('scope.open', function () {
    beforeEach(inject(function (_$uibModal_) {
      uibModal = _$uibModal_;
    }));

    var modalCtlr;
    var setUp = function () {
      spyOn(uibModal, 'open').and.callFake(function (data) {
        modalCtlr = data.controller;
      })
      scope.open('asset', 'type', 'size');
    }

    it('sets the right defauls', function () {
      init();
      scope.animationsEnabled = 'animationsEnabled'
      spyOn(uibModal, 'open').and.callFake(function (data) {
        expect(data.animation).toEqual('animationsEnabled');
        expect(data.ariaLabelledBy).toEqual('modal-title');
        expect(data.ariaDescribedBy).toEqual('modal-body');
        expect(data.templateUrl).toEqual('G2EditFolder.html');
        expect(data.controllerAs).toEqual('$ctrl');
      })
      scope.openEdit('asset', 'size');
      expect(uibModal.open).toHaveBeenCalled();
    })

    describe('modal ctrl', function () {
      it('Sets defaults', function () {
        init();
        setUp();
        spyOn(window, 'encodeURIComponent').and.callFake(function (a) {
          return a;
        })
        modalCtlr('$uibModalInstance', 'asset');
        expect(scope.openCtrl.asset).toEqual('asset')
        expect(scope.openCtrl.fullAccess).toEqual(true)
        expect(scope.openCtrl.Folders).toEqual([])
      });

      it('Sets the folder list', function () {
        init();
        setUp();
        scope.Folders = {mine: [{Name: 'mine'}], shared: [{Name: 'Shared'}]}
        modalCtlr('$uibModalInstance', 'asset');

        expect(scope.openCtrl.Folders).toEqual([{Name: 'mine', type: 'My Folders'}, {
          Name: 'Shared',
          type: 'Shared Folders'
        }])
      })

      describe('ok', function () {
        it('calls uibModalInstance.close', function () {
          init();
          setUp();
          var dummy = {
            close: function () {
            }
          }

          spyOn(dummy, 'close')
          modalCtlr(dummy, 'asset');
          scope.openCtrl.ok()

          expect(dummy.close).toHaveBeenCalled();
        });

        it('with CreateAndAdd calls CreateAndAdd', function () {
          init();
          setUp();
          spyOn(scope, 'createAndAddFolder')
          var dummy = {
            close: function () {
            }
          }

          spyOn(dummy, 'close')
          modalCtlr(dummy, 'asset');
          scope.openCtrl.ok('CreateAndAdd')

          expect(scope.createAndAddFolder).toHaveBeenCalledWith('folder', undefined, 'type');
        });

        it('with Add calls addToFolder', function () {
          init();
          setUp();
          spyOn(scope, 'addToFolder')
          var dummy = {
            close: function () {
            }
          }

          spyOn(dummy, 'close')
          modalCtlr(dummy, 'folder');
          scope.openCtrl.ok('Add')

          expect(scope.addToFolder).toHaveBeenCalledWith(undefined, undefined, 'type');
        });
      });

      describe('cancel', function () {
        it('calls uibModalInstance.dismiss', function () {
          init();
          setUp();
          var dummy = {
            dismiss: function () {
            }
          }

          spyOn(dummy, 'dismiss')
          modalCtlr(dummy, 'asset');
          scope.openCtrl.cancel()

          expect(dummy.dismiss).toHaveBeenCalled();
        });
      });
    })
  });
}

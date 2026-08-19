'use strict';
var Spec = Spec || {};

Spec.AssetLibrary = function () {
  var controller, rootScope;
  var scope, ctrl, uibModal;

  var init = function (data) {
    data = data || {
        vars: {
          Assets: '[]',
          isClassic: true
        },
        callouts: {}
      }

    G2.setupAssetLibrary(data);
    inject(function ($controller, $rootScope, $uibModal) {
      rootScope = $rootScope
      scope = $rootScope.$new();
      ctrl = $controller('AssetLibrary', {
        '$scope': scope,
        '$uibModal': uibModal
      });
    })
  }

  beforeEach(module('G2Crowd'));

  describe('scope $on loaded', function () {
    it('calls scope.init', function () {
      init();
      spyOn(scope, 'init');
      scope.$broadcast('loaded');
      expect(scope.init).toHaveBeenCalled()
    })
  });

  describe('init', function () {
    it('sets defaults', function () {
      init();
      scope.init();
      expect(scope.Assets).toEqual([]);
    })

    describe('with favorites', function () {
      beforeEach(function () {
        var data = [
          {G2Crowd__G2_Product__r: {Name: 'Name'}, G2Crowd__Type__c: 'Type1', Id: 10},
          {G2Crowd__G2_Product__r: {Name: 'Name1'}, G2Crowd__Type__c: 'Type2', Id: 3},
          {G2Crowd__G2_Product__r: {Name: 'Name1'}, G2Crowd__Type__c: 'Type2', Id: 105}
        ]
        init({
          vars: {
            Assets: JSON.stringify(data),
            isClassic: true
          },
          callouts: {}
        });
        scope.$parent.FormattedFavorites = {}
        scope.$parent.types = []
        spyOn(scope, 'image').and.returnValue('test')
      })

      it('sets asset details and parent details', function () {
        scope.init();
        expect(scope.Assets).toEqual([
          {
            G2Crowd__G2_Product__r: {Name: 'Name'},
            G2Crowd__Type__c: 'Type1',
            G2Crowd__ProductName__c: 'Name',
            ImageUrl: 'test',
            Id: 10
          },
          {
            G2Crowd__G2_Product__r: {Name: 'Name1'},
            G2Crowd__Type__c: 'Type2',
            G2Crowd__ProductName__c: 'Name1',
            ImageUrl: 'test',
            Id: 3
          },
          {
            G2Crowd__G2_Product__r: {Name: 'Name1'},
            G2Crowd__Type__c: 'Type2',
            G2Crowd__ProductName__c: 'Name1',
            ImageUrl: 'test',
            Id: 105
          }
        ]);
        expect(scope.$parent.types).toEqual(['Type1', 'Type2']);
      })

      it('sets formatted favorites for mine', function () {
        scope.$parent.FormattedFavorites['mine'] = {10: ['test', 'foo']}

        scope.init();
        expect(scope.Assets).toEqual([
          {
            G2Crowd__G2_Product__r: {Name: 'Name'},
            G2Crowd__Type__c: 'Type1',
            G2Crowd__ProductName__c: 'Name',
            ImageUrl: 'test',
            Id: 10,
            folders: ['test', 'foo']
          },
          {
            G2Crowd__G2_Product__r: {Name: 'Name1'},
            G2Crowd__Type__c: 'Type2',
            G2Crowd__ProductName__c: 'Name1',
            ImageUrl: 'test',
            Id: 3
          },
          {
            G2Crowd__G2_Product__r: {Name: 'Name1'},
            G2Crowd__Type__c: 'Type2',
            G2Crowd__ProductName__c: 'Name1',
            ImageUrl: 'test',
            Id: 105
          }
        ]);
        expect(scope.$parent.types).toEqual(['Type1', 'Type2']);
      })

      it('sets formatted favorites for shared', function () {
        scope.$parent.FormattedFavorites['mine'] = {10: ['test', 'foo']}
        scope.$parent.FormattedFavorites['shared'] = {10: ['bar'], 105: ['bar']}

        scope.init();
        expect(scope.Assets).toEqual([
          {
            G2Crowd__G2_Product__r: {Name: 'Name'},
            G2Crowd__Type__c: 'Type1',
            G2Crowd__ProductName__c: 'Name',
            ImageUrl: 'test',
            Id: 10,
            folders: ['test', 'foo'],
            sharedFolders: ['bar']
          },
          {
            G2Crowd__G2_Product__r: {Name: 'Name1'},
            G2Crowd__Type__c: 'Type2',
            G2Crowd__ProductName__c: 'Name1',
            ImageUrl: 'test',
            Id: 3
          },
          {
            G2Crowd__G2_Product__r: {Name: 'Name1'},
            G2Crowd__Type__c: 'Type2',
            G2Crowd__ProductName__c: 'Name1',
            ImageUrl: 'test',
            Id: 105,
            sharedFolders: ['bar']
          }
        ]);
        expect(scope.$parent.types).toEqual(['Type1', 'Type2']);
      })
    })
  });

  describe('scope.share', function () {
    beforeEach(inject(function (_$uibModal_) {
      uibModal = _$uibModal_;
    }));

    var modalCtlr;
    var setUp = function () {
      spyOn(uibModal, 'open').and.callFake(function (data) {
        modalCtlr = data.controller;
      })
      scope.share('asset', 'size');
    }

    it('sets the right defauls', function () {
      init();
      scope.animationsEnabled = 'animationsEnabled'
      spyOn(uibModal, 'open').and.callFake(function (data) {
        expect(data.animation).toEqual('animationsEnabled');
        expect(data.ariaLabelledBy).toEqual('modal-title');
        expect(data.ariaDescribedBy).toEqual('modal-body');
        expect(data.templateUrl).toEqual('G2Share.html');
        expect(data.controllerAs).toEqual('$ctrl');
      })
      scope.share('asset', 'size');
      expect(uibModal.open).toHaveBeenCalled();
    })

    describe('modal ctrl', function () {
      it('Sets defaults', function () {
        init();
        setUp();
        spyOn(window, 'encodeURIComponent').and.callFake(function (a) {
          return a;
        })
        modalCtlr('$uibModalInstance', {G2Crowd__URL__c: 'G2Crowd__URL__c'});
        expect(scope.$ctrl.asset).toEqual({G2Crowd__URL__c: 'G2Crowd__URL__c'})
        expect(scope.$ctrl.encodedURL).toEqual('G2Crowd__URL__c')
        expect(scope.$ctrl.isClassic).toEqual(true)
      });

      describe('copy', function () {
        it('calls uibModalInstance.close', function () {
          init();
          setUp();
          var dummy = {
            close: function () {
            }
          }

          spyOn(dummy, 'close');
          modalCtlr(dummy, {G2Crowd__URL__c: 'G2Crowd__URL__c'});
          scope.$ctrl.copy();

          expect(dummy.close).toHaveBeenCalled();
        });
      });

      describe('redirect', function () {
        it('calls sforce.one.navigateToURL', function () {
          init();
          setUp();
          sforce = {
            one: {
              navigateToURL: function () {
              }
            }
          }
          spyOn(sforce.one, 'navigateToURL');

          modalCtlr('$uibModalInstance', {G2Crowd__URL__c: 'G2Crowd__URL__c'});
          scope.$ctrl.redirect('test');

          expect(sforce.one.navigateToURL).toHaveBeenCalledWith('test');
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
          modalCtlr(dummy, {G2Crowd__URL__c: 'G2Crowd__URL__c'});
          scope.$ctrl.cancel()

          expect(dummy.dismiss).toHaveBeenCalled();
        });
      });
    })
  });

  describe('favorite', function () {
    it('calls $parent.open', function () {
      init();
      scope.$parent.open = function () {
      }
      spyOn(scope.$parent, 'open');
      scope.favorite('asset')
      expect(scope.$parent.open).toHaveBeenCalledWith('asset')
    })
  });

  describe('focus', function () {
    it('calls jQuery', function () {
      init();
      var dummy = {
        hide: function () {
        }, show: function () {
        }
      }
      spyOn(G2, '$').and.returnValue(dummy);
      spyOn(dummy, 'hide')
      spyOn(dummy, 'show')

      scope.focus(10)

      expect(G2.$).toHaveBeenCalledWith('#10')
      expect(G2.$).toHaveBeenCalledWith(".showup")
      expect(dummy.show).toHaveBeenCalled()
      expect(dummy.hide).toHaveBeenCalled()
    })
  });

  describe('isNew', function () {
    it('returns false for more than 1 day', function () {
      init();
      expect(scope.isNew({CreatedDate: G2.moment().subtract(55, 'days').format('YYYY-MM-DD')})).toEqual(false)
    })
    it('returns undefined for no asset', function () {
      init();
      expect(scope.isNew()).toEqual(false)
    })
  });

  describe('isUpdated', function () {
    it('returns true for less than 7 days', function () {
      init();
      expect(scope.isUpdated({G2Crowd__G2_Updated_At__c: G2.moment().subtract(1, 'day').format('YYYY-MM-DD')})).toEqual(true)
    })
    it('returns false for more than 7 day', function () {
      init();
      expect(scope.isUpdated({G2Crowd__G2_Updated_At__c: G2.moment().subtract(55, 'days').format('YYYY-MM-DD')})).toEqual(false)
    })
    it('returns undefined for no asset', function () {
      init();
      expect(scope.isUpdated()).toEqual(false)
    })
  });

  describe('encodeUrl', function () {
    it('calls and returns encodeURIComponent', function () {
      init();
      spyOn(window, 'encodeURIComponent').and.callFake(function (a) {
        return a;
      })

      expect(scope.encodeUrl('test', 'result')).toEqual('testresult')
    })
  });
}

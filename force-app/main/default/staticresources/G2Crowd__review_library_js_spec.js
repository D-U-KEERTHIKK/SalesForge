'use strict';
var Spec = Spec || {};

Spec.ReviewLibrary = function () {
  var controller, rootScope;
  var scope, ctrl, uibModal;

  var init = function (data) {
    data = data || {
        vars: {pageType: 'pageType'},
        callouts: {}
      }

    G2.G2Remoting = {
      reviews: function (cb) {
        return cb({data: {attributes: {}}})
      },
      paginate: function (cb) {
        return cb({data: {attributes: {}}})
      }
    }

    G2.setupReviewLibrary(data);
    inject(function ($controller, $rootScope, $uibModal) {
      rootScope = $rootScope
      scope = $rootScope.$new();
      ctrl = $controller('G2ReviewLibrary', {
        '$scope': scope,
        '$uibModal': uibModal
      });
    })
  }

  beforeEach(module('G2Crowd'));

  describe('setter', function () {
    it('sets defaults', function () {
      init()
      expect(scope.pageType).toEqual('pageType')
      expect(scope.initialized).toEqual(false)
      expect(scope.mcm).toEqual({
        nps_score: [],
        company_segment: [],
        role: [],
        industry: [],
        category_ids: []
      })

      expect(scope.search_term).toEqual('')
      expect(scope.limit).toEqual([])
      expect(scope.onlySelected).toEqual(false)
    })
  })

  describe('scope $on productSelected', function () {
    it('calls scope.productSelected', function () {
      init()
      spyOn(scope, 'productSelected');
      scope.$broadcast('productSelected');
      expect(scope.productSelected).toHaveBeenCalled()
    })

    it('sets product', function () {
      init()
      scope.$parent.Product = 'Product'
      spyOn(scope, 'productSelected');
      scope.$broadcast('productSelected');
      expect(scope.Product).toEqual('Product')
    })
  });

  describe('scope $on ProductReset', function () {
    it('resets data', function () {
      init()
      scope.$broadcast('ProductReset');
      expect(scope.Product).toEqual({UUID: ''})
      expect(scope.initialized).toEqual(false)
      expect(scope.ReviewData).toEqual([])
      expect(scope.Meta).toEqual([])
      expect(scope.Links).toEqual([])
      expect(scope.Questions).toEqual([])
      expect(scope.mcm).toEqual({
        nps_score: [],
        company_segment: [],
        category_ids: [],
        role: [],
        industry: []
      })
      expect(scope.nps_score).toEqual([])
      expect(scope.company_segment).toEqual([])
      expect(scope.role).toEqual([])
      expect(scope.category_ids).toEqual([])
      expect(scope.industry).toEqual([])
    })
  });

  describe('scope $on singleProduct', function () {
    it('calls scope.defaultFromParent', function () {
      init()
      spyOn(scope, 'defaultFromParent');
      scope.$broadcast('singleProduct');
      expect(scope.defaultFromParent).toHaveBeenCalled()
    })
  });

  describe('defaultFromParent', function () {
    it('sets from parent', function () {
      init()
      scope.$parent.Product = 'Product'
      scope.$parent.renderProduct = true
      scope.defaultFromParent();
      expect(scope.Product).toEqual('Product')
      expect(scope.renderProduct).toEqual(true)
    })

    it('does not call if renderProduct = true', function () {
      init()
      scope.$parent.Product = 'Product'
      scope.$parent.renderProduct = true
      spyOn(scope, 'getFilteredData');
      scope.defaultFromParent();
      expect(scope.getFilteredData).not.toHaveBeenCalled();
    })

    it('calls if renderProduct = false and product is set', function () {
      init()
      scope.$parent.Product = 'Product'
      scope.$parent.renderProduct = false
      spyOn(scope, 'getFilteredData');
      scope.defaultFromParent();
      expect(scope.getFilteredData).toHaveBeenCalled();
    })
  });

  describe('mcm watches', function () {
    it('when nps_score changes calls triggerChange', function () {
      init()
      spyOn(scope, 'triggerChange')

      scope.nps_score = [{checked: true, id: 10}, {checked: false}]
      scope.$digest()

      expect(scope.triggerChange).toHaveBeenCalledWith('nps_score', [{checked: true, id: 10}])
    })
    it('when company_segment changes calls triggerChange', function () {
      init()
      spyOn(scope, 'triggerChange')

      scope.company_segment = [{checked: true, id: 10}, {checked: false}]
      scope.$digest()

      expect(scope.triggerChange).toHaveBeenCalledWith('company_segment', [{checked: true, id: 10}])
    })
    it('when role changes calls triggerChange', function () {
      init()
      spyOn(scope, 'triggerChange')

      scope.role = [{checked: true, id: 10}, {checked: false}]
      scope.$digest()

      expect(scope.triggerChange).toHaveBeenCalledWith('role', [{checked: true, id: 10}])
    })
    it('when industry changes calls triggerChange', function () {
      init()
      spyOn(scope, 'triggerChange')

      scope.industry = [{checked: true, id: 10}, {checked: false}]
      scope.$digest()

      expect(scope.triggerChange).toHaveBeenCalledWith('industry', [{checked: true, id: 10}])
    })
    it('when category_ids changes calls triggerChange', function () {
      init()
      spyOn(scope, 'triggerChange')

      scope.category_ids = [{checked: true, id: 10}, {checked: false}]
      scope.$digest()

      expect(scope.triggerChange).toHaveBeenCalledWith('category_ids', [{checked: true, id: 10}])
    })
  });

  describe('triggerChange', function () {
    it('sets mcm', function () {
      init()
      scope.mcm.test = []
      spyOn(scope, 'getFilteredData')
      scope.triggerChange('test', [{id: 10}, {id: 12}])
      expect(scope.mcm.test).toEqual([10, 12])
    })

    it('calls getFilteredData id length changes', function () {
      init()
      scope.mcm.test = []
      spyOn(scope, 'getFilteredData')
      scope.triggerChange('test', [{id: 10}, {id: 12}])
      expect(scope.getFilteredData).toHaveBeenCalled()
    })
  });

  describe('search', function () {
    it('calls getFilteredData', function () {
      init()
      spyOn(scope, 'getFilteredData')
      scope.search()
      expect(scope.getFilteredData).toHaveBeenCalled()
    })
  });

  describe('getFilteredData', function () {
    it('calls G2.G2Remoting.reviews', function () {
      init()
      scope.$parent.setLoading = function () {
      }
      spyOn(G2.G2Remoting, 'reviews')
      scope.getFilteredData()
      expect(G2.G2Remoting.reviews).toHaveBeenCalled()
    })

    it('calls parent loading', function () {
      init()
      scope.$parent.setLoading = function () {
      }
      spyOn(G2.G2Remoting, 'reviews')
      spyOn(scope.$parent, 'setLoading')
      scope.getFilteredData()
      expect(scope.$parent.setLoading).toHaveBeenCalledWith('Reviews')
    })

    it('calls processResults', function () {
      init()
      scope.$parent.setLoading = function () {
      }
      spyOn(scope, 'processResults')
      spyOn(G2.G2Remoting, 'reviews').and.callFake(function (cb) {
        return cb('test')
      })
      scope.getFilteredData()
      expect(scope.processResults).toHaveBeenCalledWith('test')
    })
  });

  describe('paginate', function () {
    it('calls G2.G2Remoting.reviews', function () {
      init()
      scope.$parent.setLoading = function () {
      }
      spyOn(G2.G2Remoting, 'paginate')
      scope.paginate('test')
      expect(G2.G2Remoting.paginate).toHaveBeenCalledWith(G2.jasmine.any(Function), 'test')
    })

    it('calls parent loading', function () {
      init()
      scope.$parent.setLoading = function () {
      }
      spyOn(G2.G2Remoting, 'paginate')
      spyOn(scope.$parent, 'setLoading')
      scope.paginate()
      expect(scope.$parent.setLoading).toHaveBeenCalledWith('Reviews')
    })

    it('calls processResults', function () {
      init()
      scope.$parent.setLoading = function () {
      }
      spyOn(scope, 'processResults')
      spyOn(G2.G2Remoting, 'paginate').and.callFake(function (cb) {
        return cb('test')
      })
      scope.paginate()
      expect(scope.processResults).toHaveBeenCalledWith('test')
    })
  });

  describe('processResults', function () {
    it('sets data', function () {
      init()
      scope.$parent.doneLoading = function () {
      }
      spyOn(scope, '$apply')
      spyOn(scope, 'parentLoaded')
      spyOn(scope.$parent, 'doneLoading')

      scope.processResults({data: [{attributes: {'comment-answers': {}}}], meta: {aggregates: {}}, links: {links: {}}})
      expect(scope.ReviewData).toEqual([{attributes: {'comment-answers': {}}}])
      expect(scope.Meta).toEqual({aggregates: {}})
      expect(scope.Links).toEqual({links: {}})
      expect(scope.pagination).toEqual({links: {}})
    })

    it('calls $parent.doneLoading', function () {
      init()
      scope.$parent.doneLoading = function () {
      }
      spyOn(scope, '$apply')
      spyOn(scope, 'parentLoaded')
      spyOn(scope.$parent, 'doneLoading')

      scope.processResults({data: [{attributes: {'comment-answers': {}}}], meta: {aggregates: {}}, links: {links: {}}})
      expect(scope.$parent.doneLoading).toHaveBeenCalledWith('Reviews')
    })

    it('calls $apply', function () {
      init()
      scope.$parent.doneLoading = function () {
      }
      spyOn(scope, '$apply')
      spyOn(scope, 'parentLoaded')
      spyOn(scope.$parent, 'doneLoading')

      scope.processResults({data: [{attributes: {'comment-answers': {}}}], meta: {aggregates: {}}, links: {links: {}}})
      expect(scope.$apply).toHaveBeenCalled()
    })

    it('calls parentLoaded', function () {
      init()
      scope.$parent.doneLoading = function () {
      }
      spyOn(scope, '$apply')
      spyOn(scope, 'parentLoaded')
      spyOn(scope.$parent, 'doneLoading')

      scope.processResults({data: [{attributes: {'comment-answers': {}}}], meta: {aggregates: {}}, links: {links: {}}})
      expect(scope.parentLoaded).toHaveBeenCalled()
    })

    it('sets Questions', function () {
      init()
      scope.$parent.doneLoading = function () {
      }
      spyOn(scope, '$apply')
      spyOn(scope, 'parentLoaded')
      spyOn(scope.$parent, 'doneLoading')

      scope.processResults({
        data: [{attributes: {'comment-answers': {'Test': 'test', 'Water': 'water'}}}],
        meta: {aggregates: {}},
        links: {links: {}}
      })
      expect(scope.Questions).toEqual(['Test', 'Water']);
    })

    it('sets filters', function () {
      init()
      scope.$parent.doneLoading = function () {
      }
      spyOn(scope, '$apply')
      spyOn(scope, 'parentLoaded')
      spyOn(scope.$parent, 'doneLoading')

      scope.processResults({
        data: [{attributes: {'comment-answers': {}}}],
        meta: {
          aggregates: [{collection: 'collection1', filter_name: 'test1'}, {
            collection: 'collection2',
            filter_name: 'test2'
          }]
        },
        links: {links: {}}
      })
      expect(scope.test1).toEqual('collection1');
      expect(scope.test2).toEqual('collection2');
    })
  });

  describe('parentLoaded', function () {
    it('sets mcm', function () {
      init()
      scope.mcm.test = []
      spyOn(scope, 'getFilteredData')
      scope.triggerChange('test', [{id: 10}, {id: 12}])
      expect(scope.mcm.test).toEqual([10, 12])
    })
    describe('with ReviewData', function () {
      describe('with favorites', function () {
        beforeEach(function () {
          var data = [
            {attributes: {'product-name': 'test'}, id: 10},
            {attributes: {'product-name': 'test2'}, id: 3},
            {attributes: {'product-name': 'test'}, id: 105},
          ]
          init();
          scope.ReviewData = data
          scope.$parent.FormattedFavorites = {}
          scope.$parent.types = ['Type1', 'Type2']
        })

        it('sets asset details and parent details', function () {
          scope.parentLoaded();
          expect(scope.ReviewData).toEqual([
            {attributes: {'product-name': 'test'}, id: 10, G2Crowd__ProductName__c: 'test'},
            {attributes: {'product-name': 'test2'}, id: 3, G2Crowd__ProductName__c: 'test2'},
            {attributes: {'product-name': 'test'}, id: 105, G2Crowd__ProductName__c: 'test'}
          ]);
          expect(scope.$parent.types).toEqual(['Type1', 'Type2', 'Review']);
        })

        it('sets formatted favorites for mine', function () {
          scope.$parent.FormattedFavorites['mine'] = {10: ['test', 'foo']}

          scope.parentLoaded();
          expect(scope.ReviewData).toEqual([
            {attributes: {'product-name': 'test'}, id: 10, G2Crowd__ProductName__c: 'test', folders: ['test', 'foo']},
            {attributes: {'product-name': 'test2'}, id: 3, G2Crowd__ProductName__c: 'test2'},
            {attributes: {'product-name': 'test'}, id: 105, G2Crowd__ProductName__c: 'test'}
          ]);
        })

        it('sets formatted favorites for shared', function () {
          scope.$parent.FormattedFavorites['mine'] = {10: ['test', 'foo']}
          scope.$parent.FormattedFavorites['shared'] = {10: ['bar'], 105: ['bar']}

          scope.parentLoaded();
          expect(scope.ReviewData).toEqual([
            {
              attributes: {'product-name': 'test'},
              id: 10,
              G2Crowd__ProductName__c: 'test',
              folders: ['test', 'foo'],
              sharedFolders: ['bar']
            },
            {attributes: {'product-name': 'test2'}, id: 3, G2Crowd__ProductName__c: 'test2'},
            {attributes: {'product-name': 'test'}, id: 105, G2Crowd__ProductName__c: 'test', sharedFolders: ['bar']}
          ]);
        })
      })
    })
  });

  describe('resetFilters', function () {
    it('resets data', function () {
      init()
      scope.initialized = false
      scope.resetFilters()

      expect(scope.searchText).toEqual('')
      expect(scope.search_term).toEqual('')
      expect(scope.mcm).toEqual({
        nps_score: [],
        company_segment: [],
        category_ids: [],
        role: [],
        industry: []
      })
      expect(scope.nps_score).toEqual([])
      expect(scope.company_segment).toEqual([])
      expect(scope.role).toEqual([])
      expect(scope.category_ids).toEqual([])
      expect(scope.industry).toEqual([])
    })

    it('calls getFilteredData', function () {
      init()
      scope.initialized = true
      spyOn(scope, 'getFilteredData')
      scope.resetFilters()
      expect(scope.getFilteredData).toHaveBeenCalled();
    })
  });

  describe('init', function () {
    it('calls getFilteredData if data set', function () {
      init()
      scope.Product = {UUID: 'test'}
      spyOn(scope, 'getFilteredData')

      scope.init();
      expect(scope.getFilteredData).toHaveBeenCalled();
    })

    it('sets initialized', function () {
      init()
      scope.Product = {UUID: 'test'}
      spyOn(scope, 'getFilteredData')

      scope.init();
      expect(scope.initialized).toEqual(true);
    })
  });

  describe('favorite', function () {
    it('calls $parent.open', function () {
      init()
      scope.$parent.open = function () {
      }
      spyOn(scope.$parent, 'open')

      scope.favorite('review');
      expect(scope.$parent.open).toHaveBeenCalledWith('review', 'Review');
    })
  });

  describe('productSelected', function () {
    it('sets initialized', function () {
      init()
      spyOn(scope, 'resetFilters')
      scope.$parent.setProduct = function () {
      }
      spyOn(scope.$parent, 'setProduct')

      scope.productSelected();
      expect(scope.initialized).toEqual(true);
    })

    it('calls $parent.setProduct', function () {
      init()
      spyOn(scope, 'resetFilters')
      scope.$parent.setProduct = function () {
      }
      spyOn(scope.$parent, 'setProduct')
      scope.Product = 'Product'

      scope.productSelected();
      expect(scope.$parent.setProduct).toHaveBeenCalledWith('Product');
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

  describe('showSelected', function () {
    it('calls reset if onlyselected = true', function () {
      init();
      spyOn(scope, 'resetFilters')
      scope.onlySelected = true
      scope.showSelected()
      expect(scope.onlySelected).toEqual(false)
      expect(scope.resetFilters).toHaveBeenCalled()
    })

    it('sets data when onlySelected = false', function () {
      init();
      scope.onlySelected = false
      scope.$parent.referencePage = {selectedReviews: 'selectedReviews'}
      scope.showSelected()
      expect(scope.onlySelected).toEqual(true)
      expect(scope.ReviewData).toEqual('selectedReviews')
      expect(scope.Meta).toEqual([])
      expect(scope.Links).toEqual([])
    })
  });

  describe('selectAll', function () {
    it('sets selectedReviews to all ids', function () {
      init();
      scope.ReviewData = [{id: 10}, {id: 13}]
      scope.referencePage = {selectedReviews: {}}
      scope.selectAll()

      expect(scope.referencePage.selectedReviews).toEqual({10: {id: 10}, 13: {id: 13}})
    })
  });
}

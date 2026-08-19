'use strict';
var Spec = Spec || {};

Spec.Reviews = function () {
  var controller, rootScope;
  var scope, ctrl, uibModal;

  var init = function (data) {
    data = data || {
        vars: {},
        callouts: {
          attributeReviewToAccount: 'attributeReviewToAccount',
          getReviews: 'getReviews'
        }
      }

    G2.RawProductList = {};

    G2.setupReviews(data);
    inject(function ($controller, $rootScope, $uibModal) {
      rootScope = $rootScope
      scope = $rootScope.$new();
      ctrl = $controller('G2CrowdReviewAttribution', {
        '$scope': scope,
        '$uibModal': uibModal
      });
    })
  }

  beforeEach(module('G2Crowd'));
  describe("Setters", function () {
    it('pagination should be {}', function () {
      init();
      expect(scope.pagination).toBeDefined();
      expect(scope.pagination).toEqual({});
    });

    it('selection should be {}', function () {
      init();
      expect(scope.selection).toBeDefined();
      expect(scope.selection).toEqual({});
    });

    it('loading should be true', function () {
      init();
      expect(scope.loading).toBeDefined();
      expect(scope.loading).toEqual(true);
    });

    it('page should be initialized', function () {
      init();
      expect(scope.page).toBeDefined();
      expect(scope.page).toEqual(1);
    });
  });

  describe('refresh', function () {
    it('calls G2.Reviews.getReviews', function () {
      init();
      spyOn(G2.Reviews, 'getReviews')
      scope.refresh();
      expect(G2.Reviews.getReviews).toHaveBeenCalledWith(G2.jasmine.any(Function), 1, '');
    })
    it('calls scope.processResults', function () {
      init();
      spyOn(Visualforce.remoting.Manager, "invokeAction").and.callFake(function () {
        arguments[arguments.length - 2]('results');
      });
      spyOn(scope, 'processResults')
      scope.refresh();
      scope.$apply();
      expect(scope.processResults).toHaveBeenCalledWith('results');
    })
  });

  describe('onSearch', function () {
    it('calls G2.Reviews.getReviews with company name', function () {
      init();
      spyOn(G2.Reviews, 'getReviews')
      scope.data = {companyName: 'test'}
      scope.onSearch();
      expect(G2.Reviews.getReviews).toHaveBeenCalledWith(G2.jasmine.any(Function), 1, 'test');
    })

    it('calls scope.processResults', function () {
      init();
      spyOn(Visualforce.remoting.Manager, "invokeAction").and.callFake(function () {
        arguments[arguments.length - 2]('results');
      });
      spyOn(scope, 'processResults')
      scope.data = {companyName: 'test'}
      scope.onSearch();
      scope.$apply();
      expect(scope.processResults).toHaveBeenCalledWith('results');
    })
  });

  describe('processResults', function () {
    it('sets Reviews', function () {
      init();
      scope.processResults('processResults');
      expect(scope.Reviews).toEqual('processResults')
    })
    describe('Links', function () {
      it('sets Links with previous if page > 1', function () {
        init();
        scope.page = 3;
        scope.processResults([1, 2]);
        expect(scope.Links).toEqual({last: false, first: 1, previous: 2})
      })
      it('sets Links with next if results > 25', function () {
        init();
        scope.processResults([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5]);
        expect(scope.Links).toEqual({last: false, first: 1, next: 2})
        expect(scope.Meta).toEqual({ page_count: 1, page_count: 2 })
      })
    })
    it('sets Meta', function () {
      init();
      scope.processResults('processResults');
      expect(scope.Meta).toEqual({page_count: 1})
    })
    it('sets loading false', function () {
      init();
      scope.loading = true
      scope.processResults('processResults');
      expect(scope.loading).toEqual(false)
    })
  });

  describe('paginate', function () {
    it('sets page and calls refresh', function () {
      init();
      spyOn(scope, 'refresh')
      scope.paginate(3);
      expect(scope.page).toEqual(3);
      expect(scope.refresh).toHaveBeenCalled();
    })
  });

  describe('mapAccount', function () {
    it('sets selection', function () {
      init();
      scope.mapAccount(3);
      expect(scope.selection.reviewId).toEqual(3);
    })
    it('clicks the button', function () {
      init();
      var dummy = {
        click: function () {
        }
      }
      spyOn(G2, '$').and.returnValue(dummy)
      spyOn(dummy, 'click')
      scope.mapAccount(3);
      expect(G2.$).toHaveBeenCalledWith('.acct-lookup-form .lookupIcon');
      expect(dummy.click).toHaveBeenCalled();
    })
  });
}

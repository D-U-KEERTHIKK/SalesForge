var G2 = G2 || {};
G2.ReviewLibrary = G2.ReviewLibrary || {};
G2.setupReviewLibrary = function (initializer) {
  G2.app.controller('G2ReviewLibrary', function ($scope, $sce, $uibModal, $controller) {
    $controller('BaseController', { $scope: $scope });
    $scope.pagination = {};
    $scope.pageType = initializer.vars.pageType;
    $scope.initialized = false;
    $scope.isIndustryAdded = false;
    $scope.mcm = {
      nps_score: [],
      company_segment: [],
      role: [],
      industry: [],
      category_ids: []
    };

    $scope.defaultFromParent = function () {
      $scope.Product = $scope.$parent.Product;
      $scope.renderProduct = $scope.$parent.renderProduct;
      if (!$scope.renderProduct && $scope.Product !== undefined) {
        $scope.getFilteredData();
      }
    }

    $scope.$on('singleProduct', function (e) {
      $scope.defaultFromParent();
    })

    $scope.search_term = '';

    //	UTILITIES
    $scope.triggerChange = function (key, nv) {
      var previousLength = $scope.mcm[key].length;
      $scope.mcm[key] = nv.map(function (item) {
        return item.id;
      });
      if ($scope.mcm[key].length !== previousLength) {
        $scope.getFilteredData();
      }
    }

    G2.$.each(Object.keys($scope.mcm), function (a, key) {
      $scope.$watch(key + '|filter:{checked:true}', function (nv) {
        if (nv !== undefined) {
          $scope.triggerChange(key, nv)
        }
      }, true);
    })
    // END UTILITIES

    //Review List Functions
    $scope.search = function () {
      $scope.getFilteredData();
    }

    $scope.getFilteredData = function () {
      $scope.$parent.setLoading('Reviews');
      G2.G2Remoting.reviews(function (response) {
        $scope.processResults(response)

      }, $scope)
    };

    $scope.paginate = function (link) {
      $scope.$parent.setLoading('Reviews');
      G2.G2Remoting.paginate(function (response) {
        $scope.processResults(response)
      }, link);
    }

    $scope.processResults = function (results) {
      $scope.ReviewData = results.data;
      $scope.Meta = results.meta;
      G2.$.each($scope.Meta.aggregates, function (a, aggregate) {
        G2.$.each(aggregate.collection, function (a, collection) {

          if ($scope.mcm[aggregate.filter_name] !== undefined && $scope.mcm[aggregate.filter_name].includes(collection.id))
            collection.checked = true;
        });

        if (aggregate.filter_name == 'industry' && !$scope.isIndustryAdded) {
          $scope[aggregate.filter_name] = $scope.sortByCount(aggregate.collection);

          $scope.isIndustryAdded = true;
        } else if (aggregate.filter_name !== 'industry') {
          $scope[aggregate.filter_name] = $scope.sortByCount(aggregate.collection);
        }
      });
      $scope.isIndustryAdded = false;
      $scope.Links = results.links;

      var questions = [];
      G2.$.each($scope.ReviewData, function (all, review) {
        questions = questions.concat(Object.keys(review.attributes['comment-answers']));
      });

      $scope.Questions = $scope.arrayUnique(questions);

      $scope.$parent.doneLoading('Reviews');
      $scope.pagination = results.links;
      $scope.parentLoaded();
      $scope.$apply();
    }

    $scope.sortByCount = function (collection) {
      return collection.sort((firstItem, secondItem) => secondItem.count - firstItem.count);
    }

    $scope.$on('loaded', function () {
      $scope.parentLoaded();
    })

    $scope.parentLoaded = function () {
      if ($scope.ReviewData !== undefined && $scope.ReviewData.length > 0 && $scope.$parent.FormattedFavorites !== undefined) {
        G2.$.each($scope.ReviewData, function (i, review) {

          if ($scope.$parent.types.indexOf('Review') === -1) {
            $scope.$parent.types.push('Review')
          }

          review.G2Crowd__ProductName__c = review.attributes['product-name'];
          if ($scope.$parent.FormattedFavorites.mine !== undefined && $scope.$parent.FormattedFavorites.mine[review.id] !== undefined) {
            review.folders = $scope.$parent.FormattedFavorites.mine[review.id];
          }

          if ($scope.$parent.FormattedFavorites.shared !== undefined && $scope.$parent.FormattedFavorites.shared[review.id] !== undefined) {
            review.sharedFolders = $scope.$parent.FormattedFavorites.shared[review.id];
          }
        });
      }
    }
    //END Review List Functions

    $scope.resetFilters = function () {
      $scope.searchText = '';
      $scope.search_term = '';
      $scope.mcm = {
        nps_score: [],
        company_segment: [],
        role: [],
        category_ids: [],
        industry: []
      };
      $scope.nps_score = [];
      $scope.company_segment = [];
      $scope.role = [];
      $scope.category_ids = [];
      $scope.industry = [];
      if ($scope.initialized) {
        $scope.getFilteredData();
      }
    }

    $scope.init = function () {
      $scope.initialized = true;
      if ($scope.Product.UUID !== '' && $scope.Product.UUID !== undefined) {
        $scope.getFilteredData();
      }
    }

    $scope.favorite = function (review) {
      $scope.$parent.open(review, 'Review');
    }

    $scope.productSelected = function () {
      $scope.initialized = true;
      $scope.resetFilters();
      if ($scope.$parent.setProduct) {
        $scope.$parent.setProduct($scope.Product);
      }
    }

    $scope.focus = function (id) {
      var $container = G2.$('#' + id);
      G2.$(".showup").hide();
      $container.show();
    }

    $scope.$on('productSelected', function (e) {
      $scope.Product = $scope.$parent.Product;
      $scope.productSelected();
    });

    $scope.$on('ProductReset', function (e) {
      $scope.Product = { UUID: '' };
      $scope.initialized = false;
      $scope.ReviewData = [];
      $scope.Meta = [];
      $scope.Links = [];
      $scope.Questions = [];

      $scope.mcm = {
        nps_score: [],
        company_segment: [],
        category_ids: [],
        role: [],
        industry: []
      };
      $scope.nps_score = [];
      $scope.company_segment = [];
      $scope.role = [];
      $scope.category_ids = [];
      $scope.industry = [];
    });

    $scope.limit = [];
    $scope.onlySelected = false;
    $scope.showSelected = function () {
      if ($scope.onlySelected) {
        $scope.onlySelected = false;
        $scope.resetFilters();
      } else {
        $scope.onlySelected = true;
        $scope.ReviewData = $scope.$parent.referencePage.selectedReviews;
        $scope.Meta = [];
        $scope.Links = [];
      }
    }
    $scope.selectAll = function () {
      G2.$.each($scope.ReviewData, function (i, review) {
        $scope.referencePage.selectedReviews[review.id] = review;
      })
    }
    $scope.defaultFromParent();
  });
}

document.addEventListener('readyReviewLibrary', function () {
  G2.setupReviewLibrary(G2.ReviewLibrary);
});

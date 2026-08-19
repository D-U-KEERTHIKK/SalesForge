var G2 = G2 || {};
G2.Reviews = G2.Reviews || {};
G2.setupReviews = function (initializer) {
  G2.app.factory('ReviewsRemotingFactory', function ($q, $rootScope) {
    var factory = {};
    factory.getReviews = function (page, companyName) {
      var deferred = $q.defer();
      G2.Reviews.getReviews(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, page, companyName || '');
      return deferred.promise;
    }

    factory.attributeReviewToAccount = function (reviewId, accountId) {
      var deferred = $q.defer();
      G2.Reviews.attributeReviewToAccount(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, reviewId, accountId);
      return deferred.promise;
    }
    return factory;
  });

  G2.Reviews.getReviews = function (callback, page, companyName) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.getReviews, page, companyName,
      callback,
      { escape: false }
    );
  }

  G2.Reviews.attributeReviewToAccount = function (callback, reviewId, accountId) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.attributeReviewToAccount, reviewId, accountId,
      callback,
      { escape: false }
    );
  }

  G2.app.controller('G2CrowdReviewAttribution', function ($scope, $uibModal, ReviewsRemotingFactory, $controller) {
    $controller('BaseController', { $scope: $scope });

    $scope.pagination = {};
    $scope.loading = true;
    $scope.page = 1;
    $scope.data = {};

    $scope.refresh = function () {
      ReviewsRemotingFactory.getReviews($scope.page).then(function (result) {
        $scope.processResults(result);
      });
    }

    $scope.onSearch = function () {
      ReviewsRemotingFactory.getReviews($scope.page, $scope.data.companyName).then(function (result) {
        $scope.processResults(result);
      });
    }

    $scope.processResults = function (result) {
      $scope.Reviews = result;
      $scope.Links = { last: false, first: 1 }
      $scope.Meta = { page_count: 1 }
      if ($scope.page > 1) {
        $scope.Links.previous = $scope.page - 1;
      }
      if (result.length === 25) {
        $scope.Links.next = $scope.page + 1;
        $scope.Meta = { page_count: $scope.Links.next }
      }
      $scope.loading = false;
    }

    $scope.paginate = function (page) {
      $scope.page = page;
      $scope.refresh();
    }

    $scope.refresh();

    $scope.getStarImg = function (number) {
      return G2.starMap[number];
    }

    $scope.selection = {};

    $scope.mapAccount = function (reviewId) {
      $scope.selection.reviewId = reviewId;
      G2.$('.acct-lookup-form .lookupIcon').click();
    }

    G2.$(document).ready(function () {
      G2.$('.acct-lookup-form .lookupInput input').on('change', function () {
        setTimeout(function () {
          ReviewsRemotingFactory.attributeReviewToAccount($scope.selection.reviewId, G2.$(".acct-lookup-form [id*='_lkid']").val()).then(function (result) {
            $scope.loading = true;
            $scope.refresh();
            $scope.notice = result;
          });
        }, 50)
      });
    });
  });
}

document.addEventListener('readyReviews', function () {
  G2.setupReviews(G2.Reviews);
});

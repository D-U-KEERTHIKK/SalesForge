var G2 = G2 || {};
G2.AccountReviews = G2.AccountReviews || {};
G2.setupAccountReviews = function (initializer) {
  G2.app.factory('ReviewRemotingFactory', function ($q, $rootScope) {
    var factory = {};
    factory.getReviews = function (accountID) {
      var deferred = $q.defer();
      G2.AccountReviews.getReviews(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, accountID);
      return deferred.promise;
    }
    return factory;
  })

  G2.AccountReviews.getReviews = function (callback, accountID) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.getReviews, accountID + '',
      callback,
      { escape: false }
    );
  }

  G2.app.controller('G2AccountReview', function ($scope, $uibModal, ReviewRemotingFactory, $controller) {
    $controller('BaseController', { $scope: $scope });
    //DEFAULTS

    $scope.answerAverage = function (score, count) {
      return (score / count) / 7 * 10;
    }
    $scope.Account = {};

    $scope.loadReviews = function () {
      $scope.$parent.setLoading('loadReviews');
      ReviewRemotingFactory.getReviews($scope.RecordId).then(function (result) {
        $scope.processReviews(result);
      })
    }

    $scope.processReviews = function (result) {
      $scope.Account.Reviews = result;
      $scope.Account.Answers = {};
      $scope.Account.NPS = { detractor: 0, promoter: 0 };

      G2.$.each($scope.Account.Reviews, function (i, review) {
        review.answers = { values: {}, comments: {} };
        G2.$.each(review.G2Crowd__G2_Review_Answers__r, function (a, answer) {
          if (answer.G2Crowd__Comment__c !== undefined) {
            review.answers.comments[answer.G2Crowd__Question__c] = answer.G2Crowd__Comment__c;
          } else if (answer.G2Crowd__Value__c !== undefined) {
            review.answers.values[answer.G2Crowd__Question__c] = answer.G2Crowd__Value__c;
            $scope.Account.Answers[answer.G2Crowd__Question_Type__c] = $scope.Account.Answers[answer.G2Crowd__Question_Type__c] || {}
            $scope.Account.Answers[answer.G2Crowd__Question_Type__c][answer.G2Crowd__Question__c] = $scope.Account.Answers[answer.G2Crowd__Question_Type__c][answer.G2Crowd__Question__c] || {}
            $scope.Account.Answers[answer.G2Crowd__Question_Type__c][answer.G2Crowd__Question__c].answers = ($scope.Account.Answers[answer.G2Crowd__Question_Type__c][answer.G2Crowd__Question__c].answers || 0) + answer.G2Crowd__Value__c;
            $scope.Account.Answers[answer.G2Crowd__Question_Type__c][answer.G2Crowd__Question__c].count = ($scope.Account.Answers[answer.G2Crowd__Question_Type__c][answer.G2Crowd__Question__c].count || 0) + 1;
          }
          if (answer.G2Crowd__Question_Type__c === 'slider_nps' && answer.G2Crowd__Value__c < 7) {
            $scope.Account.NPS.detractor++
          }
          if (answer.G2Crowd__Question_Type__c === 'slider_nps' && answer.G2Crowd__Value__c > 8) {
            $scope.Account.NPS.promoter++
          }
        });
      });

      $scope.Account.Scores = {};
      G2.$.each($scope.Account.Answers, function (type, data) {
        $scope.Account.Scores[type] = []
        G2.$.each(data, function (question, answers) {
          $scope.Account.Scores[type].push([question, $scope.answerAverage(answers.answers, answers.count), answers.count]);
        })
        $scope.Account.Scores[type].sort(function (a, b) {
          return b[1] - a[1];
        })
      })

      $scope.Account.NPS.score = ($scope.Account.NPS.promoter - $scope.Account.NPS.detractor) / ($scope.Account.Reviews.length) * 100
      $scope.$parent.doneLoading('loadReviews');
    }

    $scope.$on('loadReviews', function (e) {
      $scope.loadReviews();
    })

    $scope.ObjectKeys = function (obj) {
      if (obj !== undefined && obj !== null) {
        return Object.keys(obj);
      }
      return [];
    }

    $scope.calcRotation = function (score) {
      if (score > 0) {
        return 90 + (90 * (score / 100))
      }
      if (score < 0) {
        return (90 * (score / 100))
      }
      if (score === 0) {
        return 90
      }
    }
    $scope.display = { satisfaction: false, features: false, reviews: false };
    $scope.toggle = function (key, value) {
      $scope.display[key] = value;
    }
  });
}

document.addEventListener('readyAccountReviews', function () {
  G2.setupAccountReviews(G2.AccountReviews);
});

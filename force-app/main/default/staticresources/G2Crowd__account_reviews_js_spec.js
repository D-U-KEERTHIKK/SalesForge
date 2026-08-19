'use strict';
var Spec = Spec || {};

Spec.AccountReviews = function () {
  var controller, rootScope;
  var scope, ctrl, uibModal;

  var init = function (data) {
    data = data || {
        vars: {},
        callouts: {
          getReviews: 'getReviews'
        }
      }

    G2.setupAccountReviews(data);
    inject(function ($controller, $rootScope, $uibModal) {
      rootScope = $rootScope
      scope = $rootScope.$new();
      ctrl = $controller('G2AccountReview', {
        '$scope': scope,
        '$uibModal': uibModal
      });
    })
  }

  beforeEach(module('G2Crowd'));

  describe('Setters', function () {
    it('sets Account', function () {
      init();
      expect(scope.Account).toEqual({});
    })

    it('defaults display', function () {
      init();
      expect(scope.display).toEqual({satisfaction: false, features: false, reviews: false});
    })
  });

  describe('answerAverage', function () {
    it('(converts a base 7 to base 10) / 10', function () {
      init();

      expect(scope.answerAverage(0, 10)).toEqual(0);
      expect(scope.answerAverage(1, 10)).toEqual(0.14285714285714288);
      expect(scope.answerAverage(3, 10)).toEqual(0.4285714285714286);
      expect(scope.answerAverage(6, 10)).toEqual(0.8571428571428572);
      expect(scope.answerAverage(7, 10)).toEqual(0.9999999999999999);
    })
  });

  describe('loadReviews', function () {
    it('calls remoting', function () {
      init();
      spyOn(Visualforce.remoting.Manager, "invokeAction").and.callFake(function () {
        arguments[arguments.length - 2]('results');
      });
      spyOn(scope, 'processReviews');
      scope.$parent.setLoading = function () {
      };
      scope.loadReviews();
      scope.$digest();
      expect(scope.processReviews).toHaveBeenCalledWith('results')
    })

    it('calls parent setLoading', function () {
      init();
      spyOn(Visualforce.remoting.Manager, "invokeAction").and.callFake(function () {
      });
      scope.$parent.setLoading = function () {
      };
      spyOn(scope.$parent, 'setLoading')
      scope.loadReviews();
      scope.$digest();
      expect(scope.$parent.setLoading).toHaveBeenCalledWith('loadReviews')
    })
  });

  describe('processReviews', function () {
    beforeEach(function () {
      init();
      scope.$parent.doneLoading = function () {
      };
    })

    it('sets Account', function () {
      scope.processReviews([])
      expect(scope.Account).toEqual({
        Reviews: [],
        Answers: {},
        NPS: {detractor: 0, promoter: 0, score: 0 / 0},
        Scores: {}
      })
    })

    it('sets answers on the reviews', function () {
      var reviews = [
        {
          G2Crowd__G2_Review_Answers__r: [
            {G2Crowd__Question__c: 'question 1', G2Crowd__Value__c: 'value 1', G2Crowd__Question_Type__c: 'type1'},
            {G2Crowd__Question__c: 'question 2', G2Crowd__Value__c: 'value 2', G2Crowd__Question_Type__c: 'type1'},
            {G2Crowd__Question__c: 'question 3', G2Crowd__Value__c: 'value 3', G2Crowd__Question_Type__c: 'type2'}
          ]
        },
        {
          G2Crowd__G2_Review_Answers__r: [
            {G2Crowd__Question__c: 'question 1', G2Crowd__Value__c: 'value 11', G2Crowd__Question_Type__c: 'type1'},
            {G2Crowd__Question__c: 'question 2', G2Crowd__Value__c: 'value 22', G2Crowd__Question_Type__c: 'type1'},
            {G2Crowd__Question__c: 'question 3', G2Crowd__Value__c: 'value 33', G2Crowd__Question_Type__c: 'type2'}
          ]
        }
      ]
      scope.processReviews(reviews)

      expect(Object.keys(scope.Account.Answers)).toEqual(['type1', 'type2'])
      expect(scope.Account.Answers).toEqual({
        type1: {
          'question 1': {answers: '0value 1value 11', count: 2},
          'question 2': {answers: '0value 2value 22', count: 2}
        }, type2: {'question 3': {answers: '0value 3value 33', count: 2}}
      })
    })

    it('calls parent doneLoading', function () {
      spyOn(scope.$parent, 'doneLoading')
      scope.processReviews([]);
      expect(scope.$parent.doneLoading).toHaveBeenCalledWith('loadReviews')
    })

    it('sets the NPS values', function () {
      var reviews = [
        {
          G2Crowd__G2_Review_Answers__r: [
            {G2Crowd__Question__c: 'question 1', G2Crowd__Value__c: 10, G2Crowd__Question_Type__c: 'slider_nps'}
          ]
        },
        {
          G2Crowd__G2_Review_Answers__r: [
            {G2Crowd__Question__c: 'question 1', G2Crowd__Value__c: 1, G2Crowd__Question_Type__c: 'slider_nps'}
          ]
        },
        {
          G2Crowd__G2_Review_Answers__r: [
            {G2Crowd__Question__c: 'question 1', G2Crowd__Value__c: 5, G2Crowd__Question_Type__c: 'slider_nps'}
          ]
        },
        {
          G2Crowd__G2_Review_Answers__r: [
            {G2Crowd__Question__c: 'question 1', G2Crowd__Value__c: 6, G2Crowd__Question_Type__c: 'slider_nps'}
          ]
        },
        {
          G2Crowd__G2_Review_Answers__r: [
            {G2Crowd__Question__c: 'question 1', G2Crowd__Value__c: 9, G2Crowd__Question_Type__c: 'slider_nps'}
          ]
        }
      ]
      scope.processReviews(reviews)

      expect(scope.Account.NPS).toEqual({detractor: 3, promoter: 2, score: -20})
    })

    it('sets answers on the reviews', function () {
      var reviews = [
        {
          G2Crowd__G2_Review_Answers__r: [
            {G2Crowd__Question__c: 'question 1', G2Crowd__Value__c: 1, G2Crowd__Question_Type__c: 'type1'},
            {G2Crowd__Question__c: 'question 2', G2Crowd__Value__c: 2, G2Crowd__Question_Type__c: 'type1'},
            {G2Crowd__Question__c: 'question 3', G2Crowd__Value__c: 3, G2Crowd__Question_Type__c: 'type2'}
          ]
        },
        {
          G2Crowd__G2_Review_Answers__r: [
            {G2Crowd__Question__c: 'question 1', G2Crowd__Value__c: 45, G2Crowd__Question_Type__c: 'type1'},
            {G2Crowd__Question__c: 'question 2', G2Crowd__Value__c: 5, G2Crowd__Question_Type__c: 'type1'},
            {G2Crowd__Question__c: 'question 3', G2Crowd__Value__c: 6, G2Crowd__Question_Type__c: 'type2'}
          ]
        }
      ]
      scope.processReviews(reviews)

      expect(Object.keys(scope.Account.Scores)).toEqual(['type1', 'type2'])
      expect(scope.Account.Scores).toEqual({
        type1: [['question 1', 32.857142857142854, 2], ['question 2', 5, 2]],
        type2: [['question 3', 6.428571428571429, 2]]
      })
    })
  });

  describe('scope $on loadReviews', function () {
    it('calls scope.loadReviews', function () {
      init();
      spyOn(scope, 'loadReviews');
      scope.$broadcast('loadReviews');
      expect(scope.loadReviews).toHaveBeenCalled()
    })
  });

  describe('ObjectKeys', function () {
    it('retruns [] id not object', function () {
      init();
      expect(scope.ObjectKeys()).toEqual([])
    })

    it('retruns keys for object', function () {
      init();
      expect(scope.ObjectKeys({test: 1, foo: 2})).toEqual(['test', 'foo'])
    })
  });

  describe('calcRotation', function () {
    it('is greater than 0', function () {
      init();
      expect(scope.calcRotation(10)).toEqual(99)
    })
    it('is less than 0', function () {
      init();
      expect(scope.calcRotation(-10)).toEqual(-9)
    })
    it('is 0', function () {
      init();
      expect(scope.calcRotation(0)).toEqual(90)
    })
  });
}

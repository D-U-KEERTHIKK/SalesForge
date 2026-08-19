'use strict';
var Spec = Spec || {};

Spec.VisitingOrganizations = function () {
  var controller, rootScope;
  var scope, ctrl, uibModal;

  var init = function (data) {
    data = data || {
        vars: {
          HasAccess: false,
          ProductList: [{G2Crowd__G2_Unique_Identifier__c: 'test'}],
          APIToken: '13214'
        },
        callouts: {}
      }

    G2.RawProductList = {};

    G2.G2Remoting = {
      visitSummaries: function (cb) {
        return cb({data: {attributes: {}}})
      },
      paginate: function (cb) {
        return cb({data: {attributes: {}}})
      },
      assignVisitor: function (cb) {
        return cb({data: {}})
      },
      visitSummaryList: function (cb) {
        return cb({data: {attributes: {}}})
      }
    }

    G2.setupVisitingOrganizations(data);
    inject(function ($controller, $rootScope, $uibModal) {
      rootScope = $rootScope
      scope = $rootScope.$new();
      ctrl = $controller('G2CrowdOrganizations', {
        '$scope': scope,
        '$uibModal': uibModal
      });
    })
  }

  beforeEach(module('G2Crowd'));
  describe("Setters", function () {
    it('HasAccess should be false', function () {
      init();
      expect(scope.HasAccess).toBeDefined();
      expect(scope.HasAccess).toBe(false);
    });

    it('ProductList should be initilized', function () {
      init();
      expect(scope.ProductList).toBeDefined();
      expect(scope.ProductList).toEqual([{G2Crowd__G2_Unique_Identifier__c: 'test'}]);
    });

    it('Product should be initialized', function () {
      init();
      expect(scope.Product).toBeDefined();
      expect(scope.Product).toEqual({UUID: 'test'});
    });

    it('MappedOrgs should be {}', function () {
      init();
      expect(scope.MappedOrgs).toBeDefined();
      expect(scope.MappedOrgs).toEqual({});
    });

    it('selection should be initialized undefined', function () {
      init();
      expect(scope.selection).toBeDefined();
      expect(scope.selection.accountName).toEqual(undefined);
      expect(scope.selection.opportunityName).toEqual(undefined);
    });

    it('expanded should be []', function () {
      init();
      expect(scope.expanded).toBeDefined();
      expect(scope.expanded).toEqual([]);
    });

    it('listLoaded should be []', function () {
      init();
      expect(scope.listLoaded).toBeDefined();
      expect(scope.listLoaded).toEqual([]);
    });

    it('detailList should be {}', function () {
      init();
      expect(scope.detailList).toBeDefined();
      expect(scope.detailList).toEqual({});
    });

    it('dates should be {}', function () {
      init();
      expect(scope.dates).toBeDefined();
      expect(scope.dates).toEqual({});
    });

    it('table should be {}', function () {
      init();
      expect(scope.table).toBeDefined();
      expect(scope.table).toEqual({});
    });

    it('showMapped should be true', function () {
      init();
      expect(scope.showMapped).toBeDefined();
      expect(scope.showMapped).toEqual(true);
    });

    it('SortOptions should be initialized', function () {
      init();
      expect(scope.SortOptions).toBeDefined();
      expect(scope.SortOptions).toEqual([
        ['Most Recent', 'last_seen_at desc'],
        ['First Seen', 'first_seen_at asc'],
        ['Most Active', 'total_pageviews desc'],
        ['Most Alternatives Viewed', 'competitor_pageviews desc'],
        ['Most Compared', 'comparison_pageviews desc']
      ]);
    });
    describe('Multiple Product', function () {
      it('ProductList should be [{}, {}]', function () {
        var data = {};
        data.vars = {
          HasAccess: false,
          ProductList: [{}, {}],
          APIToken: '13214'
        }
        init(data);
        expect(scope.ProductList).toBeDefined();
        expect(scope.ProductList).toEqual([{}, {}]);
      });

      it('Product should be {}', function () {
        var data = {};
        data.vars = {
          HasAccess: false,
          ProductList: [{}, {}],
          APIToken: '13214'
        }
        init(data);
        expect(scope.Product).toBeDefined();
        expect(scope.Product).toEqual({});
      });
    })
  })

  describe('getOrganizations', function () {
    it('Sets loading true', function () {
      init();
      spyOn(scope, "processResults");
      scope.getOrganizations({});
      expect(scope.loading).toBeDefined();
      expect(scope.loading).toEqual(true);
    })
    it('Calls processResults', function () {
      init();
      spyOn(scope, "processResults");

      scope.getOrganizations({});
      expect(scope.processResults).toHaveBeenCalledWith({data: {attributes: {}}});
    })
    it('Calls G2.G2Remoting.visitSummaries', function () {
      init();
      spyOn(G2.G2Remoting, "visitSummaries");

      scope.getOrganizations({});
      expect(G2.G2Remoting.visitSummaries).toHaveBeenCalled();
    })
  });

  describe('productSelected', function () {
    it('Calls getOrganizations', function () {
      init();
      spyOn(scope, "getOrganizations");

      scope.productSelected();
      expect(scope.getOrganizations).toHaveBeenCalledWith({});
    })
  });

  describe('processCSV', function () {
	    it('sets the value from scope.Visits and clicks submit', function () {
	      init()
	      scope.Visits = [{ org_name: 'test', org_domain: 'test.com', org_id: 12 },
  						 { org_name: 'foo', org_domain: 'foo.com', org_id: 13 },
  						 { org_name: 'bar', org_domain: 'bar.com' }];
	      scope.MappedOrgs = {
	    	  			12: { G2Crowd__Account__c: '15', G2Crowd__Account__r: { Name: "test" } },
	    	  			13: { G2Crowd__Account__c: '15', G2Crowd__Account__r: undefined }
	      };
	      var dummy = {
            click: function(){},
            val: function(){}
          };

          spyOn(G2, '$').and.returnValue(dummy);
          spyOn(dummy, 'click')
          spyOn(dummy, 'val')
	      scope.processCSV();

          expect(G2.$).toHaveBeenCalledWith('[name="csvData"]');
          expect(G2.$).toHaveBeenCalledWith('.exportSubmit');
          expect(dummy.val).toHaveBeenCalledWith('Company Name,Website,City,State,Country,Employee Count,Annual Revenue,LinkedIn,ID,Account ID,Account Name,Total Pageviews,Profile Pageviews,Category Pageviews,Comparisons Viewed,Competitor Pageviews,First Visit,Last Visit\r\n"test","test.com","","","","","","","12","15","test","","","","","","","undefined"\r\n"foo","foo.com","","","","","","","13","15","","","","","","","","undefined"\r\n"bar","bar.com","","","","","","","","","","","","","","","","undefined"');
          expect(dummy.click).toHaveBeenCalled();
	    });
  });

  describe('processResults', function () {
    it('sets Visits', function () {
      init()
      scope.processResults({data: {attributes: {'visitor-list': ['test', 'foo', 'bar']}}});
      expect(scope.Visits).toEqual(['test', 'foo', 'bar']);
    });

    it('defaults Geo', function () {
      init()
      scope.processResults({data: {attributes: {}}});
      expect(scope.Geo).toEqual({Countries: {}});
    });

    it('defaults Countries', function () {
      init()
      scope.processResults({data: {attributes: {}}});
      expect(scope.Countries).toEqual([]);
    });

    it('populates Geo in Alphabetical order', function () {
      init()
      scope.processResults({
        data: {
          attributes: {
            geo: [
              {org_country: 'US', org_country_code: '1', org_state: 'Texas', org_state_code: 'TX'},
              {org_country: 'US', org_country_code: '1', org_state: 'California', org_state_code: 'CA'},
              {org_country: 'Canada', org_country_code: '2', org_state: 'Ontario', org_state_code: 'ON'},
              {org_country: 'UK', org_country_code: '3', org_state: 'London', org_state_code: 'LO'}
            ]
          }
        }
      });
      expect(scope.Countries).toEqual([{name: 'US', code: '1'}, {name: 'Canada', code: '2'}, {name: 'UK', code: '3'}]);

      expect(scope.Geo).toEqual({
        Countries: {
          'Canada': [{name: 'Ontario', code: 'ON', ticked: false}],
          'UK': [{name: 'London', code: 'LO', ticked: false}],
          'US': [{name: 'California', code: 'CA', ticked: false}, {name: 'Texas', code: 'TX', ticked: false}]
        }
      });
    });

    it('populates for ticked values', function(){
      init()
      scope.tickedRegionCodes = ['ON', 'CA'];
      scope.processResults({
        data: {
          attributes: {
            geo: [
              {org_country: 'US', org_country_code: '1', org_state: 'Texas', org_state_code: 'TX'},
              {org_country: 'US', org_country_code: '1', org_state: 'California', org_state_code: 'CA'},
              {org_country: 'Canada', org_country_code: '2', org_state: 'Ontario', org_state_code: 'ON'},
              {org_country: 'UK', org_country_code: '3', org_state: 'London', org_state_code: 'LO'}
            ]
          }
        }
      });
      expect(scope.Countries).toEqual([{name: 'US', code: '1'}, {name: 'Canada', code: '2'}, {name: 'UK', code: '3'}]);

      expect(scope.Geo).toEqual({
        Countries: {
          'Canada': [{name: 'Ontario', code: 'ON', ticked: true}],
          'UK': [{name: 'London', code: 'LO', ticked: false}],
          'US': [{name: 'California', code: 'CA', ticked: true}, {name: 'Texas', code: 'TX', ticked: false}]
        }
      });
    });

    it('populates visit ids', function () {
      init();
      scope.processResults({data: {attributes: {'visitor-list': [{org_id: 1}, {org_id: 33}, {org_id: 4}]}}});
      expect(scope.ids).toEqual([1, 33, 4]);
    })

    it('calls G2.VisitingOrganizations.GetMappedOrganizations', function () {
      init();
      spyOn(G2.VisitingOrganizations, "GetMappedOrganizations");

      scope.processResults({data: {attributes: {}}});
      expect(G2.VisitingOrganizations.GetMappedOrganizations).toHaveBeenCalled();
    })

    it('calls getMappedOrgs', function () {
      init();
      spyOn(scope, "getMappedOrgs");

      scope.processResults({data: {attributes: {}}});
      expect(scope.getMappedOrgs).toHaveBeenCalledWith();
    })

    it('sets loading false', function () {
      init();

      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
              arguments[arguments.length - 2]();
              scope.$apply();
            }
          }
        }
      }
      scope.processResults({data: {attributes: {}}});
      expect(scope.loading).toEqual(false);
    })
    it('calls apply', function () {
      init();
      spyOn(scope, "$apply");

      scope.processResults({data: {attributes: {}}});
      expect(scope.$apply).toHaveBeenCalled();
    })
  });

  describe('untickAll', function(){
    it('sets All unticked', function () {
      init();
      var data = [{ ticked: true}, {ticked: false}];
      scope.untickAll(data);
      expect(data).toEqual([{ ticked: false}, {ticked: false}]);
    })
  });

  describe('$watch search.Country', function () {
    it('if present sets regions', function () {
      init();
      scope.Geo = {
        Countries: {
          'US': { 'CA': { n: 'CA' }, 'AB': { n: 'AB' } },
          'UK': { 'LO': { n: 'LO' } }
        }
      };
      scope.search.Country = { name: 'US' };
      scope.$digest();
      expect(scope.InputRegions).toEqual({ 'CA': { n: 'CA' }, 'AB': { n: 'AB' } })
    })
  });

  describe('processSave', function () {
    var method = function () {
      scope.processSave({attributes: {}}, '123', '123', 'test');
      scope.$apply();
    }

    it('Calls G2.VisitingOrganizations.Assign', function () {
      init();
      spyOn(G2.VisitingOrganizations, "Assign");

      method();
      expect(G2.VisitingOrganizations.Assign).toHaveBeenCalled();
    })
    it('Sets the notice', function () {
      init();
      spyOn(scope, "getMappedOrgs");
      spyOn(Visualforce.remoting.Manager, "invokeAction").and.callFake(function () {
        arguments[arguments.length - 2]('Success');
      });

      method();
      expect(scope.getMappedOrgs).toHaveBeenCalled();
      expect(scope.notice).toEqual('Success');
    })
    it('calls getMappedOrgs', function () {
      init();
      spyOn(scope, "getMappedOrgs");
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
              arguments[arguments.length - 2]();
              scope.$apply();
            }
          }
        }
      }

      method();
      expect(scope.getMappedOrgs).toHaveBeenCalled();
      console.log('test completed');
    })
  });

  describe('getMappedOrgs', function () {
    var method = function () {
      scope.getMappedOrgs();
      scope.$apply();
    }
    it('Sets loading false', function () {
      init();
      spyOn(scope, "ProcessMappedOrganizations");
      scope.loading = true;
      Visualforce = {
        remoting: {
          Manager: {
            invokeAction: function () {
              arguments[arguments.length - 2]();
              scope.$apply();
            }
          }
        }
      }
      expect(scope.loading).toEqual(true);

      method();
      expect(scope.loading).toEqual(false);
    })
    it('calls ProcessMappedOrganizations', function () {
      init();
      spyOn(scope, "ProcessMappedOrganizations");
      spyOn(Visualforce.remoting.Manager, "invokeAction").and.callFake(function () {
        arguments[arguments.length - 2]('Process');
      });

      method();
      expect(scope.ProcessMappedOrganizations).toHaveBeenCalledWith('Process');
    })
  });

  describe('ProcessMappedOrganizations', function () {
    var method = function () {
      scope.ProcessMappedOrganizations([
        {G2Crowd__Remote_Organization_ID__c: 10},
        {G2Crowd__Remote_Organization_ID__c: 12},
      ]);
    }
    it('Sets orgLength', function () {
      init();
      method();
      expect(scope.orgLength).toEqual(2);
    })
    it('sets MappedOrgs', function () {
      init();
      method();
      expect(scope.MappedOrgs).toEqual({
        10: {G2Crowd__Remote_Organization_ID__c: 10},
        12: {G2Crowd__Remote_Organization_ID__c: 12}
      });
    })
  });

  describe('paginate', function () {
    var method = function () {
      scope.paginate('link');
    }
    it('defaults expanded', function () {
      init();
      method();
      expect(scope.expanded).toEqual([]);
    })
    it('sets loading true', function () {
      init();
      scope.loading = false;
      spyOn(G2.G2Remoting, "paginate");
      method();
      expect(scope.loading).toEqual(true);
      expect(G2.G2Remoting.paginate).toHaveBeenCalled();
    })
    it('calls to G2 Remoting', function () {
      init();
      spyOn(G2.G2Remoting, "paginate");
      method();
      expect(G2.G2Remoting.paginate).toHaveBeenCalledWith(G2.jasmine.any(Function), 'link');
    })
    it('calls processResults', function () {
      init();
      spyOn(G2.G2Remoting, "paginate").and.callFake(function (cb) {
        cb('callback')
      });
      spyOn(scope, "processResults")
      method();
      expect(scope.processResults).toHaveBeenCalledWith('callback');
    })
  });

  describe('assignVisitor', function () {
    var method = function () {
      scope.assignVisitor('org', 'org_id', 'accountId', 'opportunityId', 'visit');
    }
    it('sets loading true', function () {
      init();
      spyOn(G2.G2Remoting, "assignVisitor");
      scope.loading = false
      method();
      expect(scope.loading).toEqual(true);
    })
    it('calls G2.G2Remoting.assignVisitor with data', function () {
      init();
      spyOn(G2.G2Remoting, "assignVisitor").and.callFake(function (cb, data) {
        expect(data.get('organization')).toEqual('org');
        expect(data.get('account_id')).toEqual('accountId');
        expect(data.get('opportunity_id')).toEqual('opportunityId');
        expect(data.get('api_token')).toEqual('13214');
      });
      method();
      expect(G2.G2Remoting.assignVisitor).toHaveBeenCalled();
    });
    it('calls G2.G2Remoting.assignVisitor with data and ID if id present', function () {
      init();
      spyOn(G2.G2Remoting, "assignVisitor").and.callFake(function (cb, data) {
        expect(data.get('organization')).toEqual('org');
        expect(data.get('account_id')).toEqual('accountId');
        expect(data.get('opportunity_id')).toEqual('opportunityId');
        expect(data.get('api_token')).toEqual('13214');
        expect(data.get('id')).toEqual('subscribed_organization_id');
      });
      scope.assignVisitor('org', 'org_id', 'accountId', 'opportunityId', {subscribed_organization_id: 'subscribed_organization_id'});
      expect(G2.G2Remoting.assignVisitor).toHaveBeenCalled();
    });
    it('calls processSave with remoting data', function () {
      var visit = {};
      init();
      spyOn(G2.G2Remoting, "assignVisitor").and.callFake(function (cb) {
        cb({data: {id: 'id', data: 'data'}})
      });
      spyOn(scope, 'processSave');
      scope.loading = false
      scope.assignVisitor('org', 'org_id', 'accountId', 'opportunityId', visit);
      expect(scope.processSave).toHaveBeenCalledWith(G2.jasmine.any(Object), 'accountId', 'opportunityId', 'org');
      expect(visit.subscribed_organization_id).toEqual('id')
    });
  });

  describe('formatDate', function () {
    it('returns formatted as string', function () {
      init();
      expect(scope.formatDate('2018/01/01')).toEqual('Mon Jan 01 2018');
    })
  });

  describe('modal open', function () {
    beforeEach(inject(function (_$uibModal_) {
      uibModal = _$uibModal_;
    }));

    var modalCtlr;
    var setUp = function () {
      spyOn(uibModal, 'open').and.callFake(function (data) {
        modalCtlr = data.controller;
      })
      scope.open('visit', 'size');
    }

    it('sets the right defauls', function () {
      init();
      spyOn(uibModal, 'open').and.callFake(function (data) {
        expect(data.ariaLabelledBy).toEqual('modal-title');
        expect(data.ariaDescribedBy).toEqual('modal-body');
        expect(data.templateUrl).toEqual('G2AssignForm.html');
      })
      scope.open('visit', 'size');
    })

    describe('modal ctrl', function () {
      it('Sets defaults', function () {
        init();
        setUp();
        scope.selection = {accountName: 'accountName', opportunityName: 'opportunityName'};
        modalCtlr('$uibModalInstance', {org_name: 'org_name'});
        expect(scope.$ctrl.visit).toEqual({org_name: 'org_name'})
        expect(scope.$ctrl.accountName).toEqual('accountName')
        expect(scope.$ctrl.opportunityName).toEqual('opportunityName')
        expect(scope.selection.defaultAccountName).toEqual('org_name')
      });

      it('With altData', function () {
        init();
        setUp();
        scope.selection = {accountName: 'accountName', opportunityName: 'opportunityName'};
        scope.MappedOrgs = {
          'org_id': {
            G2Crowd__Account__r: {Name: 'G2Crowd__Account__r'},
            G2Crowd__Opportunity__r: {Name: 'G2Crowd__Opportunity__r'}
          }
        }
        modalCtlr('$uibModalInstance', {org_name: 'org_name', org_id: 'org_id'});
        expect(scope.$ctrl.accountName).toEqual('G2Crowd__Account__r')
        expect(scope.$ctrl.opportunityName).toEqual('G2Crowd__Opportunity__r')
        expect(scope.selection.defaultAccountName).toEqual('G2Crowd__Account__r')
      });

      describe('$watch selection.accountId', function () {
        it('updates if set', function () {
          init();
          setUp();
          scope.selection = {accountName: 'accountName', opportunityName: 'opportunityName'};
          scope.MappedOrgs = {
            'org_id': {
              G2Crowd__Account__r: {Name: 'G2Crowd__Account__r'},
              G2Crowd__Opportunity__r: {Name: 'G2Crowd__Opportunity__r'}
            }
          }
          modalCtlr('$uibModalInstance', {org_name: 'org_name', org_id: 'org_id'});
          expect(scope.$ctrl.accountName).toEqual('G2Crowd__Account__r')
          scope.selection.accountName = 'test'
          scope.selection.accountId = 'test'
          scope.$digest();
          expect(scope.$ctrl.accountName).toEqual('test')
        })
      });

      describe('$watch selection.opportunityId', function () {
        it('updates if set', function () {
          init();
          setUp();
          scope.selection = {accountName: 'accountName', opportunityName: 'opportunityName'};
          scope.MappedOrgs = {
            'org_id': {
              G2Crowd__Account__r: {Name: 'G2Crowd__Account__r'},
              G2Crowd__Opportunity__r: {Name: 'G2Crowd__Opportunity__r'}
            }
          }
          modalCtlr('$uibModalInstance', {org_name: 'org_name', org_id: 'org_id'});
          expect(scope.$ctrl.accountName).toEqual('G2Crowd__Account__r')
          scope.selection.opportunityName = 'test'
          scope.selection.opportunityId = 'test'
          scope.$digest();
          expect(scope.$ctrl.opportunityName).toEqual('test')
        })
      });

      describe('ctrl.lookup', function () {
        it('clicks the accountLookup button', function () {
          var dummy = {
            click: function () {
            }
          };
          init();
          setUp();
          modalCtlr('$uibModalInstance', {org_name: 'org_name', org_id: 'org_id'});
          spyOn(G2, '$').and.returnValue(dummy);
          spyOn(dummy, 'click')
          scope.$ctrl.lookup('test')
          expect(G2.$).toHaveBeenCalledWith('.test-lookup-form .lookupIcon')
          expect(dummy.click).toHaveBeenCalled()
        })
      });

      describe('ctrl.ok', function () {
        it('calls scope.assignVisitor', function () {
          init();
          setUp();
          scope.selection.accountId = 'accountId'
          scope.selection.accountName = 'accountName'
          scope.selection.opportunityId = 'opportunityId'
          scope.selection.opportunityName = 'opportunityName'
          modalCtlr({
            close: function () {
            }
          }, {org_name: 'org_name', org_id: 'org_id'});
          spyOn(scope, 'assignVisitor')
          scope.$ctrl.ok()
          expect(scope.assignVisitor).toHaveBeenCalledWith('org_name', 'org_id', 'accountId', 'opportunityId', {
            org_name: 'org_name',
            org_id: 'org_id'
          })
        })
        it('calls $uibModalInstance.close', function () {
          var uibModalInstance = {
            close: function () {
            }
          };
          init();
          setUp();
          modalCtlr(uibModalInstance, {org_name: 'org_name', org_id: 'org_id'});
          spyOn(uibModalInstance, 'close')
          spyOn(scope, 'assignVisitor')
          scope.$ctrl.ok()
          expect(uibModalInstance.close).toHaveBeenCalled()
        })
        it('sets $scope.selection', function () {
          var uibModalInstance = {
            close: function () {
            }
          };
          init();
          setUp();
          modalCtlr(uibModalInstance, {org_name: 'org_name', org_id: 'org_id'});
          spyOn(scope, 'assignVisitor')
          scope.$ctrl.ok()
          expect(scope.selection.accountName).toEqual(undefined)
          expect(scope.selection.opportunityName).toEqual(undefined)
        })
      });

      describe('ctrl.cancel', function () {
        it('calls $uibModalInstance.dismiss', function () {
          var uibModalInstance = {
            dismiss: function () {
            }
          };
          init();
          setUp();
          modalCtlr(uibModalInstance, {org_name: 'org_name', org_id: 'org_id'});
          spyOn(uibModalInstance, 'dismiss')
          spyOn(scope, 'assignVisitor')
          scope.$ctrl.cancel()
          expect(uibModalInstance.dismiss).toHaveBeenCalled()
        })
        it('sets $scope.selection', function () {
          var uibModalInstance = {
            dismiss: function () {
            }
          };
          init();
          setUp();
          modalCtlr(uibModalInstance, {org_name: 'org_name', org_id: 'org_id'});
          spyOn(scope, 'assignVisitor')
          scope.$ctrl.cancel()
          expect(scope.selection.accountName).toEqual(undefined)
          expect(scope.selection.opportunityName).toEqual(undefined)
        })
      });

      it('calls scope.watch', function () {
        init();
        setUp();
        spyOn(scope, '$watch');
        modalCtlr('$uibModalInstance', {org_name: 'org_name'});
        expect(scope.$watch).toHaveBeenCalledWith('selection.accountId', G2.jasmine.any(Function));
        expect(scope.$watch).toHaveBeenCalledWith('selection.opportunityId', G2.jasmine.any(Function));
      });
    })

    it('sets the right defauls', function () {
      init();
      spyOn(uibModal, 'open').and.callFake(function (data) {
        expect(data.ariaLabelledBy).toEqual('modal-title');
        expect(data.ariaDescribedBy).toEqual('modal-body');
        expect(data.templateUrl).toEqual('G2AssignForm.html');
        expect(data.controllerAs).toEqual('$ctrl');
        expect(data.scope).toEqual(scope);
        expect(data.size).toEqual('size');
      })
      scope.open('visit', 'size');
    })
  });

  describe('onError', function () {
    it('calls scope.setDatepicker', function () {
      init();
      spyOn(scope, 'resetDatepicker');

      G2.$('.G2Crowd').trigger('G2error');
      expect(scope.resetDatepicker).toHaveBeenCalled();
    })
  });

  describe('translation', function () {
    it('returns correctly', function () {
      init();
      expect(scope.translation('products.reviews', 'Your')).toEqual('Read Your Reviews')
      expect(scope.translation('products.pricing', 'Your')).toEqual('Viewed Your Pricing')
      expect(scope.translation('products.competitors', 'Your')).toEqual('Viewed Your Alternatives')
      expect(scope.translation('products.features', 'Your')).toEqual('Viewed Your Features')
      expect(scope.translation('products.details', 'Your')).toEqual('Viewed Your Details')
      expect(scope.translation('products.apps', 'Your')).toEqual('Viewed Your Mobile Apps')
      expect(scope.translation('products.discuss', 'Your')).toEqual('Viewed Your FAQs')
      expect(scope.translation('categories.show', 'Your')).toEqual('Viewed Your the Grid')
      expect(scope.translation('categories.features', 'Your')).toEqual('Viewed Your Features')
      expect(scope.translation('categories.reserach', 'Your')).toEqual('Viewed Your Research')
    })
  });

  describe('expand', function () {
    it('manipulates dom', function () {
      var dummy = {
        hide: function () {
        }, show: function () {
        }
      };
      init();
      scope.listLoaded = [10]
      spyOn(G2, '$').and.returnValue(dummy)
      spyOn(dummy, 'hide')
      spyOn(dummy, 'show')
      scope.expand(10, {})
      expect(G2.$).toHaveBeenCalledWith('.expand-10')
      expect(dummy.show).toHaveBeenCalled()
      expect(G2.$).toHaveBeenCalledWith('.collapse-10')
      expect(dummy.hide).toHaveBeenCalled()
      expect(G2.$).toHaveBeenCalledWith('#organization_10')
    })

    it('calls remoting', function () {
      init();
      spyOn(G2.G2Remoting, 'visitSummaryList')
      scope.dates.StartRaw = G2.moment('2018/01/01')
      scope.dates.EndRaw = G2.moment('2018/01/01')
      scope.expand(10, {})
      expect(G2.G2Remoting.visitSummaryList).toHaveBeenCalledWith(G2.jasmine.any(Function), 10, '2018-01-01', '2018-01-02')
    })
  });

  describe('processVisitSummaryList', function () {
    it('adds to listLoaded', function () {
      init();
      scope.processVisitSummaryList([{data: []}], [{data: []}], 10)
      expect(scope.listLoaded).toEqual([10])
    })
    it('sets results', function () {
      init();
      spyOn(scope, '$apply');
      scope.processVisitSummaryList(
        [
          {
            data: [
              {
                attributes: {
                  pageviews: {a: 1, b: 2},
                  'compared-products': {data: [{id: 10}, {id: 4}]},
                  'competitor-products': {data: [{id: 15}, {id: 5}]},
                  'category-names': ['a', 'b']
                }
              },
              {
                attributes: {
                  pageviews: {a: 1, c: 2},
                  'compared-products': {data: [{id: 12}, {id: 2}]},
                  'competitor-products': {data: [{id: 15}, {id: 2}]},
                  'category-names': ['c', 'b']
                }
              }
            ]
          }
        ],
        [{data: []}],
        10
      )
      expect(scope.detailList[10].count).toEqual(2);
      expect(scope.detailList[10].details).toEqual({a: 2, b: 2, c: 2});
      expect(scope.detailList[10].compares).toEqual([{id: 10}, {id: 4}, {id: 12}, {id: 2}]);
      expect(scope.detailList[10].competitors).toEqual([{id: 15}, {id: 5}, {id: 2}]);
      expect(scope.detailList[10].categories).toEqual(['a', 'c', 'b']);
      expect(scope.detailList[10].stream).toEqual({data: []});
      expect(scope.$apply).toHaveBeenCalled();
    });
  });

  describe('collapse', function () {
    it('manipulates dom', function () {
      var dummy = {
        hide: function () {
        }, show: function () {
        }
      };
      init();
      scope.expanded = [10]
      scope.listLoaded = [10]
      spyOn(G2, '$').and.returnValue(dummy)
      spyOn(dummy, 'hide')
      spyOn(dummy, 'show')
      scope.collapse(10);
      expect(G2.$).toHaveBeenCalledWith('.expand-10');
      expect(dummy.show).toHaveBeenCalled();
      expect(G2.$).toHaveBeenCalledWith('.collapse-10');
      expect(dummy.hide).toHaveBeenCalled();
      expect(G2.$).toHaveBeenCalledWith('#organization_10');
      expect(scope.expanded).toEqual([]);
    })

    it('calls remoting', function () {
      init();
      spyOn(G2.G2Remoting, 'visitSummaryList')
      scope.dates.StartRaw = G2.moment('2018/01/01')
      scope.dates.EndRaw = G2.moment('2018/01/01')
      scope.expand(10, {})
      expect(G2.G2Remoting.visitSummaryList).toHaveBeenCalledWith(G2.jasmine.any(Function), 10, '2018-01-01', '2018-01-02')
    })
  });

  describe('executeSearch', function () {
    it('includes country', function () {
      init();
      scope.search.Country = {code: 'country'};
      scope.search.StartDate = G2.moment('2018/01/01');
      scope.search.EndDate = G2.moment('2018/01/01');
      spyOn(scope, 'getOrganizations')
      scope.executeSearch()
      expect(scope.getOrganizations).toHaveBeenCalledWith({
        visit_report: {
          dimension_filter: {
            org_country_code_eq: 'country',
            first_seen_at_lteq: '2018-01-02',
            first_seen_at_gteq: '2018-01-01'
          }
        }
      });
    })
    it('includes Region', function () {
      init();
      scope.search.Country = {code: 'country'};
      scope.search.Region = [{code: 'Region'}];
      scope.search.StartDate = G2.moment('2018/01/01');
      scope.search.EndDate = G2.moment('2018/01/01');
      spyOn(scope, 'getOrganizations')
      scope.executeSearch()
      expect(scope.getOrganizations).toHaveBeenCalledWith({
        visit_report: {
          dimension_filter: {
            org_state_code_in: ['Region'],
            first_seen_at_lteq: '2018-01-02',
            first_seen_at_gteq: '2018-01-01'
          }
        }
      });
    })
    it('includes Organization', function () {
      init();
      scope.search.Organization = 'Organization';
      scope.search.StartDate = G2.moment('2018/01/01');
      scope.search.EndDate = G2.moment('2018/01/01');
      spyOn(scope, 'getOrganizations')
      scope.executeSearch()
      expect(scope.getOrganizations).toHaveBeenCalledWith({
        visit_report: {
          dimension_filter: {
            org_name_cont: 'Organization',
            first_seen_at_lteq: '2018-01-02',
            first_seen_at_gteq: '2018-01-01'
          }
        }
      });
    })
    it('includes CompanySize', function () {
      init();
      scope.search.CompanySize = 'CompanySize';
      scope.search.StartDate = G2.moment('2018/01/01');
      scope.search.EndDate = G2.moment('2018/01/01');
      spyOn(scope, 'getOrganizations')
      scope.executeSearch()
      expect(scope.getOrganizations).toHaveBeenCalledWith({
        visit_report: {
          dimension_filter: {
            org_employees_range_eq: 'CompanySize',
            first_seen_at_lteq: '2018-01-02',
            first_seen_at_gteq: '2018-01-01'
          }
        }
      });
    })
    it('includes SortBy', function () {
      init();
      scope.search.SortBy = ['', 'SortBy'];
      scope.search.StartDate = G2.moment('2018/01/01');
      scope.search.EndDate = G2.moment('2018/01/01');
      spyOn(scope, 'getOrganizations')
      scope.executeSearch()
      expect(scope.getOrganizations).toHaveBeenCalledWith({
        visit_report: {
          sort: 'SortBy',
          dimension_filter: {first_seen_at_lteq: '2018-01-02', first_seen_at_gteq: '2018-01-01'}
        }
      });
    })
    it('includes multiple', function () {
      init();
      scope.search.CompanySize = 'CompanySize';
      scope.search.StartDate = G2.moment('2018/01/01');
      scope.search.EndDate = G2.moment('2018/01/01');
      scope.search.SortBy = ['', 'SortBy'];
      spyOn(scope, 'getOrganizations')
      scope.executeSearch()
      expect(scope.getOrganizations).toHaveBeenCalledWith({
        visit_report: {
          sort: 'SortBy',
          dimension_filter: {
            first_seen_at_lteq: '2018-01-02',
            org_employees_range_eq: 'CompanySize',
            first_seen_at_gteq: '2018-01-01'
          }
        }
      });
    })
    it('includes multiple', function () {
      init();
      scope.loading = false;
      spyOn(scope, 'getOrganizations')
      scope.executeSearch()
      expect(scope.loading).toEqual(true);
    })
  });

  describe('clear', function () {
    it('resets all search data', function () {
      init();
      scope.search = 'search';
      scope.dates = 'dates';
      scope.loading = false;
      spyOn(scope, 'getOrganizations')
      scope.clear();
      expect(scope.search).toEqual({})
      expect(scope.dates).toEqual({})
      expect(scope.loading).toEqual(true)
    })

    it('calls setDatepicker', function () {
      init();
      spyOn(scope, 'resetDatepicker')
      spyOn(scope, 'getOrganizations')
      scope.clear();
      expect(scope.resetDatepicker).toHaveBeenCalled()
    })

    it('calls getOrganizations', function () {
      init();
      spyOn(scope, 'setDatepicker')
      spyOn(scope, 'getOrganizations')
      scope.clear();
      expect(scope.getOrganizations).toHaveBeenCalled()
    })
  });

  describe('setDatepicker', function () {
    it('defines the datepickers', function () {
      init();
      var dummy = {
        datepicker: function () {
        }
      }
      spyOn(G2, '$').and.returnValue(dummy);
      spyOn(dummy, 'datepicker');

      scope.setDatepicker();

      expect(G2.$).toHaveBeenCalledWith('#date');
      expect(G2.$).toHaveBeenCalledWith('#EndDate');
      expect(dummy.datepicker).toHaveBeenCalledWith({
        numYearsAfter: 0,
        numYearsBefore: 1,
        format: 'MM/DD/YYYY',
        initDate: G2.jasmine.any(Object),
        onSelect: G2.jasmine.any(Function),
        onChange: G2.jasmine.any(Function)
      });
      expect(dummy.datepicker).toHaveBeenCalledWith({
        numYearsAfter: 0,
        numYearsBefore: 1,
        format: 'MM/DD/YYYY',
        initDate: G2.jasmine.any(Object),
        onSelect: G2.jasmine.any(Function),
        onChange: G2.jasmine.any(Function)
      });
    });
  });

  describe('defaultOnReady', function () {
    it('calls setDatepicker', function () {
      init();
      spyOn(scope, 'setDatepicker');
      scope.defaultOnReady();
      expect(scope.setDatepicker).toHaveBeenCalled();
    });

    it('sets up change handlers', function () {
      var dummy = {
        on: function () {
        }
      }
      init();
      spyOn(G2, '$').and.returnValue(dummy);
      spyOn(scope, 'setDatepicker');
      spyOn(dummy, 'on');
      scope.defaultOnReady();
      expect(G2.$).toHaveBeenCalledWith('.acct-lookup-form .lookupInput input');
      expect(G2.$).toHaveBeenCalledWith('.oppty-lookup-form .lookupInput input');
      expect(dummy.on).toHaveBeenCalledWith('change', G2.jasmine.any(Function));
    });
  });

  describe('formatted', function () {
    it('formats as MMMM Do YYYY, h:mm a', function () {
      init();
      expect(scope.formatted('2018-01-01')).toEqual('January 1st 2018, 12:00 am');
    });
  });

  describe('type', function () {
    it('is category', function () {
      init();
      expect(scope.type('categories')).toEqual('Category Viewed');
    });
    it('is products.competitors', function () {
      init();
      expect(scope.type('products.competitors')).toEqual('Alternative Views');
    });
    it('is products', function () {
      init();
      expect(scope.type('products')).toEqual('Profile Views');
    });
    it('is comparison', function () {
      init();
      expect(scope.type('comparison')).toEqual('Comparisons');
    });
  });

  describe('visitTimeframe', function () {
    it('returns empty string if no count', function () {
      init();
      expect(scope.visitTimeframe(undefined, 't', 'e')).toEqual('');
    });

    describe('1 count', function () {
      it('by day', function () {
        init();
        expect(scope.visitTimeframe(1, G2.moment().subtract(1, 'day'), G2.moment())).toEqual('1 visit over 1 day');
      });

      it('by days', function () {
        init();
        expect(scope.visitTimeframe(1, G2.moment().subtract(5, 'days'), G2.moment())).toEqual('1 visit over 5 days');
      });

      it('by weeks', function () {
        init();
        expect(scope.visitTimeframe(1, G2.moment().subtract(21, 'days'), G2.moment())).toEqual('1 visit over 3 weeks');
      });

      it('by week', function () {
        init();
        expect(scope.visitTimeframe(1, G2.moment().subtract(7, 'days'), G2.moment())).toEqual('1 visit over 1 week');
      });

      it('by months', function () {
        init();
        expect(scope.visitTimeframe(1, G2.moment().subtract(65, 'days'), G2.moment())).toEqual('1 visit over 2 months');
      });
    })

    describe('> 1 count', function () {
      it('by day', function () {
        init();
        expect(scope.visitTimeframe(2, G2.moment().subtract(1, 'day'), G2.moment())).toEqual('2 visits over 1 day');
      });

      it('by days', function () {
        init();
        expect(scope.visitTimeframe(13, G2.moment().subtract(5, 'days'), G2.moment())).toEqual('13 visits over 5 days');
      });

      it('by weeks', function () {
        init();
        expect(scope.visitTimeframe(11, G2.moment().subtract(21, 'days'), G2.moment())).toEqual('11 visits over 3 weeks');
      });

      it('by week', function () {
        init();
        expect(scope.visitTimeframe(41, G2.moment().subtract(7, 'days'), G2.moment())).toEqual('41 visits over 1 week');
      });

      it('by months', function () {
        init();
        expect(scope.visitTimeframe(61, G2.moment().subtract(65, 'days'), G2.moment())).toEqual('61 visits over 2 months');
      });
    })
  });

  describe('plural', function () {
    it('single', function () {
      init();
      expect(scope.plural(1, 'taco')).toEqual('taco');
    });

    it('multiple', function () {
      init();
      expect(scope.plural(5, 'taco')).toEqual('tacos');
    });
  });
}

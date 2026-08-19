var G2 = G2 || {};
G2.VisitingOrganizations = G2.VisitingOrganizations || {};
G2.setupVisitingOrganizations = function (initializer) {
  G2.app.factory('VisitorsRemotingFactory', function ($q, $rootScope) {
    var factory = {};
    factory.Assign = function (id, org_id, accountId, opportunityId, leadIds, name) {
      var deferred = $q.defer();
      G2.VisitingOrganizations.Assign(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, id, org_id, accountId, opportunityId, leadIds, name);
      window.water = deferred.promise;
      return window.water;
    }
    factory.GetMappedOrganizations = function (names) {
      var deferred = $q.defer();
      G2.VisitingOrganizations.GetMappedOrganizations(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, names);
      return deferred.promise;
    }
    factory.GetMappedLeads = function (names) {
      var deferred = $q.defer();
      G2.VisitingOrganizations.GetMappedLeads(function (result) {
        $rootScope.$apply(function () {
          deferred.resolve(result);
        });
      }, names);
      return deferred.promise;
    }
    return factory;
  });

  G2.VisitingOrganizations.Assign = function (callback, id, org_id, accountId, opportunityId, leadIds, name) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.AssignVisitor, id, org_id, accountId, opportunityId, leadIds, name,
      callback, {
      escape: false
    }
    );
  }

  G2.VisitingOrganizations.GetMappedOrganizations = function (callback, names) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.GetMappedOrganizations, names,
      callback, {
      escape: false
    }
    );
  }

  G2.VisitingOrganizations.GetMappedLeads = function (callback, names) {
    Visualforce.remoting.Manager.invokeAction(
      initializer.callouts.GetMappedLeads, names,
      callback, {
      escape: false
    }
    );
  }

  G2.app.controller('G2CrowdOrganizations', function ($scope, $uibModal, VisitorsRemotingFactory, $controller) {
    $controller('BaseController', {
      $scope: $scope
    });

    $scope.ProductList = initializer.vars.ProductList;
    $scope.Product = {};
    $scope.MappedOrgs = {};
    $scope.selection = {
      accountName: undefined,
      opportunityName: undefined,
      leadName: undefined
    }
    $scope.HasAccess = initializer.vars.HasAccess;
    $scope.LeadMapping = initializer.vars.LeadMapping;
    $scope.expanded = [];
    $scope.listLoaded = [];
    $scope.detailList = {};
    $scope.showMapped = true;
    $scope.dates = {};
    $scope.table = {};
    $scope.tickedRegionCodes = [];
    $scope.Page = 1;
    $scope.SortOptions = [
      ['Most Recent', 'last_seen_at desc'],
      ['First Seen', 'first_seen_at asc'],
      ['Most Active', 'total_pageviews desc'],
      ['Most Alternatives Viewed', 'competitor_pageviews desc'],
      ['Most Compared', 'comparison_pageviews desc']
    ];

    $scope.initialize = function () {
      if ($scope.ProductList.length === 1) {
        $scope.Product.UUID = $scope.ProductList[0].G2Crowd__G2_Unique_Identifier__c;
        $scope.getOrganizations({});
      }
    }

    $scope.getOrganizations = function (data, callback) {
      $scope.loading = true;
      G2.G2Remoting.visitSummaries(function (response) {
        $scope.processResults(response);
        if (callback !== undefined) {
          callback();
        }
      }, data, $scope.Product.UUID);
    }

    $scope.productSelected = function () {
      $scope.getOrganizations({}, $scope.setDatepicker);
    }

    $scope.processCSV = function () {
      var csv = [];
      csv.push([
        'Company Name', 'Website', 'City', 'State', 'Country',
        'Employee Count', 'Annual Revenue', 'LinkedIn',
        'ID', 'Account ID', 'Account Name', 'Total Pageviews',
        'Profile Pageviews', 'Category Pageviews', 'Comparisons Viewed',
        'Competitor Pageviews', 'First Visit', 'Last Visit'].join(',')
      );

      G2.$.each($scope.Visits, function (a, visit) {
        var account = { Id: '', Name: '' };
        if ($scope.MappedOrgs[visit.org_id] !== undefined && $scope.MappedOrgs[visit.org_id].account !== undefined) {
          if ($scope.MappedOrgs[visit.org_id].account.G2Crowd__Account__c !== undefined) {
            account.Id = $scope.MappedOrgs[visit.org_id].account.G2Crowd__Account__c;
          }
          if ($scope.MappedOrgs[visit.org_id].account.G2Crowd__Account__r !== undefined) {
            account.Name = $scope.MappedOrgs[visit.org_id].account.G2Crowd__Account__r.Name
          }
        }

        var linkedin = '';
        if (visit.org_linkedin !== undefined && visit.org_linkedin !== null && visit.org_linkedin !== '') {
          linkedin = 'https://www.linkedin.com/' + visit.org_linkedin;
        }

        csv.push([
          '"' + visit.org_name, visit.org_domain, visit.org_city, visit.org_state, visit.org_country,
          visit.org_employees_range, visit.org_annual_revenue, linkedin,
          visit.org_id, account.Id, account.Name, visit.total_pageviews,
          visit.product_profile_pageviews, visit.category_pageviews, visit.comparison_pageviews,
          visit.competitor_pageviews, visit.first_seen_day, visit.last_seen_at + '"'].join('","')
        );
      })

      var csvFile = csv.join("\r\n");
      G2.$('[name="csvData"]').val(csvFile);
      G2.$('.exportSubmit').click();
    }

    $scope.processResults = function (response) {
      $scope.Visits = response.data.attributes['visitor-list'] || [];
      $scope.Geo = {
        Countries: {}
      };
      $scope.Countries = [];

      G2.$.each(response.data.attributes.geo || [], function (i, location) {
        if (location.org_country === null) {
          return '';
        }
        if ($scope.Geo.Countries[location.org_country] === undefined) {
          $scope.Geo.Countries[location.org_country] = []
          $scope.Countries.push({
            name: location.org_country,
            code: location.org_country_code
          })
        }
        $scope.Geo.Countries[location.org_country].push({
          name: location.org_state,
          code: location.org_state_code,
          ticked: $scope.tickedRegionCodes.indexOf(location.org_state_code) > -1
        })
        $scope.Geo.Countries[location.org_country] = $scope.Geo.Countries[location.org_country].sort(function (a, b) {
          return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
        });
      });

      $scope.ids = [];
      G2.$.each($scope.Visits, function (i, visit) {
        $scope.ids.push(visit.org_id);
      });
      $scope.MappedOrgs = {};
      $scope.getMappedOrgs();
      $scope.getMappedLeads();
      $scope.Meta = {};
      $scope.Links = {};
      $scope.$apply();
    }

    $scope.untickAll = function (codes) {
      if (codes !== undefined && codes.length > 0) {
        G2.$.each(codes, function (a, obj) {
          obj.ticked = false;
        })
      }
    };

    $scope.$watch('search.Country', function () {
      if ($scope.search.Country !== undefined && $scope.search.Country !== '' && $scope.search.Country.name !== undefined) {
        $scope.InputRegions = $scope.Geo.Countries[$scope.search.Country.name];
      }
      $scope.untickAll($scope.InputRegions);
      $scope.search.Region = [];
    });

    $scope.getMappedOrgs = function () {
      VisitorsRemotingFactory.GetMappedOrganizations($scope.ids).then(function (results) {
        $scope.ProcessMappedOrganizations(results);
        $scope.loading = false;
      });
    }

    $scope.getMappedLeads = function () {
      VisitorsRemotingFactory.GetMappedLeads($scope.ids).then(function (results) {
        $scope.ProcessMappedLeads(results);
        $scope.loading = false;
      });
    }

    $scope.processSave = function (data, accountId, opportunityId, leadIds, name) {
      VisitorsRemotingFactory.Assign(data.id, data.attributes['remote-organization-id'], accountId, opportunityId, leadIds, name).then(function (result) {
        $scope.MappedOrgs = {};
        $scope.getMappedOrgs();
        $scope.getMappedLeads();
        $scope.notice = result;
      });
    }

    $scope.ProcessMappedLeads = function (results) {
      $scope.MappedOrgs = $scope.MappedOrgs || {};
      results = results || [];
      G2.$.each(results, function (i, result) {
        if ($scope.MappedOrgs[result.G2Crowd__G2_Visiting_Organization__r.G2Crowd__Remote_Organization_ID__c] !== undefined) {
          var data = $scope.MappedOrgs[result.G2Crowd__G2_Visiting_Organization__r.G2Crowd__Remote_Organization_ID__c];
          if (data.leads !== undefined) {
            data.leads.push(result);
          } else {
            data.leads = [result]
          }
        } else {
          $scope.MappedOrgs[result.G2Crowd__G2_Visiting_Organization__r.G2Crowd__Remote_Organization_ID__c] = { leads: [result] }
        }
      });
      $scope.orgLength = Object.keys($scope.MappedOrgs).length
    }

    $scope.ProcessMappedOrganizations = function (results) {
      $scope.MappedOrgs = $scope.MappedOrgs || {};
      results = results || [];
      G2.$.each(results, function (i, result) {
        if ($scope.MappedOrgs[result.G2Crowd__Remote_Organization_ID__c] !== undefined) {
          $scope.MappedOrgs[result.G2Crowd__Remote_Organization_ID__c].account = result;
        } else {
          $scope.MappedOrgs[result.G2Crowd__Remote_Organization_ID__c] = { account: result }
        }
      });
      $scope.orgLength = Object.keys($scope.MappedOrgs).length
    }

    $scope.paginate = function (link) {
      $scope.expanded = [];
      $scope.Page = $scope.Page + 1;
      $scope.loading = true;
      G2.G2Remoting.paginate(function (response) {
        $scope.processResults(response)
      }, link)
    }

    $scope.assignVisitor = function (org, org_id, accountId, opportunityId, leadIds, visit) {
      $scope.loading = true;
      var data = new FormData();
      data.append('organization', org);
      data.append('account_id', accountId);
      data.append('opportunity_id', opportunityId);
      for (var i = 0; i < leadIds.length; i++) {
        data.append('lead_ids[]', leadIds[i]);
      }
      data.append('organization_id', org_id);
      data.append('api_token', initializer.vars.APIToken);
      if (visit.subscribed_organization_id !== undefined) {
        data.append('id', visit.subscribed_organization_id);
      }
      G2.G2Remoting.assignVisitor(function (results) {
        visit.subscribed_organization_id = results.data.id;
        $scope.processSave(results.data, accountId, opportunityId, leadIds, org);
      }, data);
    }

    $scope.formatDate = function (date) {
      var formattedDate = new Date(date);
      return formattedDate.toDateString();
    }

    $scope.open = function (visit, size) {
      var parentElem = angular.element(G2.$('.G2Crowd'));
      $uibModal.open({
        animation: $scope.animationsEnabled,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'G2AssignForm.html',
        controller: function ($uibModalInstance, visit) {
          $ctrl = this;
          $ctrl.visit = visit;
          $ctrl.organization = visit.org_name;
          $ctrl.accountName = $scope.selection.accountName;
          $ctrl.opportunityName = $scope.selection.opportunityName;
          $ctrl.leadName = $scope.selection.leadName;
          $ctrl.LeadMapping = $scope.LeadMapping;
          $ctrl.leads = [];
          $scope.selection.defaultAccountName = visit.org_name;

          if ($scope.MappedOrgs[visit.org_id] !== undefined) {
            altData = $scope.MappedOrgs[visit.org_id].account;
            leadData = $scope.MappedOrgs[visit.org_id].leads;
            if (altData !== undefined) {
              if (altData.G2Crowd__Account__r) {
                $ctrl.accountName = altData.G2Crowd__Account__r.Name;
                $scope.selection.defaultAccountName = altData.G2Crowd__Account__r.Name;
              }

              if (altData.G2Crowd__Opportunity__r) {
                $ctrl.opportunityName = altData.G2Crowd__Opportunity__r.Name;
              }
            }
            if (leadData !== undefined) {
              G2.$.each(leadData, function (i, lead) {
                lead.G2Crowd__Lead__r.Id = lead.G2Crowd__Lead__r.Id.slice(0, 15);
                $ctrl.leads.push(lead.G2Crowd__Lead__r);
              });
            }
          }

          $scope.$watch('selection.accountId', function () {
            if ($scope.selection.accountId !== '' && $scope.selection.accountId !== undefined && $scope.selection.accountId !== '000000000000000') {
              $ctrl.accountName = $scope.selection.accountName;
            }
          })

          $scope.$watch('selection.opportunityId', function () {
            if ($scope.selection.opportunityId !== '' && $scope.selection.opportunityId !== undefined && $scope.selection.opportunityId !== '000000000000000') {
              $ctrl.opportunityName = $scope.selection.opportunityName;
            }
          });

          $scope.$watch('selection.leadId', function () {
            if ($scope.selection.leadId !== '' && $scope.selection.leadId !== undefined && $scope.selection.leadId !== '000000000000000') {
              existingLeads = G2.$.grep($ctrl.leads, function (e) {
                return e.Id === $scope.selection.leadId;
              });
              if (existingLeads.length === 0) {
                $ctrl.leads.push({ Id: $scope.selection.leadId, Name: $scope.selection.leadName });
              }
            }
          });

          $ctrl.lookup = function (type) {
            G2.$('.' + type + '-lookup-form .lookupIcon').click();
          };

          $ctrl.remove = function (leadId) {
            $ctrl.leads = G2.$.grep($ctrl.leads, function (e) {
              return e.Id !== leadId;
            });
          };
          $ctrl.ok = function () {
            var accountId = '',
              opportunityId = '',
              leadIds = [];
            if ($ctrl.accountName !== undefined && $ctrl.accountName === $scope.selection.accountName) {
              accountId = $scope.selection.accountId;
            }

            if ($ctrl.opportunityName !== undefined && $ctrl.opportunityName === $scope.selection.opportunityName) {
              opportunityId = $scope.selection.opportunityId;
            }

            if ($ctrl.leads !== undefined && $ctrl.leads.length > 0) {
              leadIds = $ctrl.leads.map(function (lead, index) {
                return lead.Id;
              });
            }

            $scope.assignVisitor(visit.org_name, visit.org_id, accountId, opportunityId, leadIds, visit);

            $scope.selection = {
              accountName: undefined,
              opportunityName: undefined,
              leadName: undefined
            }
            $uibModalInstance.close();
          };

          $ctrl.cancel = function () {
            $scope.selection = {
              accountName: undefined,
              opportunityName: undefined,
              leadName: undefined
            }
            $uibModalInstance.dismiss();
          };
          $scope.$ctrl = $ctrl;
        },
        controllerAs: '$ctrl',
        scope: $scope,
        size: size,
        appendTo: parentElem,
        resolve: {
          visit: function () {
            return visit;
          }
        }
      });
    };

    G2.$('.G2Crowd').on('G2error', function () {
      $scope.resetDatepicker();
    });

    $scope.translation = function (key, name) {
      var text = '';
      switch (key) {
        case 'products.reviews':
          text = 'Read ' + name + ' Reviews';
          break;
        case 'products.pricing':
          text = 'Viewed ' + name + ' Pricing';
          break;
        case 'products.competitors':
          text = 'Viewed Your Alternatives';
          break;
        case 'products.features':
          text = 'Viewed ' + name + ' Features';
          break;
        case 'products.details':
          text = 'Viewed ' + name + ' Details';
          break;
        case 'products.apps':
          text = 'Viewed ' + name + ' Mobile Apps';
          break;
        case 'products.discuss':
          text = 'Viewed ' + name + ' FAQs';
          break;
        case "categories.show":
          text = 'Viewed ' + name + ' the Grid';
          break;
        case "categories.features":
          text = 'Viewed ' + name + ' Features';
          break;
        case "categories.reserach":
          text = 'Viewed ' + name + ' Research';
          break;
      }
      return text;
    }

    $scope.expand = function (id, visit) {
      G2.$('.expand-' + id).hide();
      G2.$('.collapse-' + id).show();
      $scope.expanded.push(id);
      G2.$('#organization_' + id).show();
      var endDate = G2.moment().add(1, 'day').format('YYYY-MM-DD'),
        date = G2.moment().subtract(7, 'day').format('YYYY-MM-DD');
      if ($scope.dates.StartRaw) {
        date = $scope.dates.StartRaw.format('YYYY-MM-DD')
      }
      if ($scope.dates.EndRaw) {
        endDate = $scope.dates.EndRaw.add(1, 'day').format('YYYY-MM-DD')
      }
      if ($scope.listLoaded.indexOf(id) === -1) {
        G2.$('#organization_loading_' + id).show();
        G2.G2Remoting.visitSummaryList(function (response, stream) {
          $scope.processVisitSummaryList(response, stream, id)
        }, id, date, endDate);
      }
    }

    $scope.processVisitSummaryList = function (response, stream, id) {
      response = response[0];
      stream = stream[0];
      $scope.listLoaded.push(id);

      var details = {};
      var compares = [];
      var competitors = [];
      var categories = [];
      G2.$.each(response.data, function (i, summary) {
        G2.$.each(summary.attributes.pageviews, function (key, value) {
          if (details[key] === undefined) {
            details[key] = 0;
          }
          details[key] = details[key] + value;
        });
        G2.$.each(summary.attributes['compared-products'].data, function (i, data) {
          if (compares.map(a => a.id).indexOf(data.id) === -1) {
            compares.push(data)
          }
        });
        G2.$.each(summary.attributes['competitor-products'].data, function (i, data) {
          if (competitors.map(a => a.id).indexOf(data.id) === -1) {
            competitors.push(data)
          }
        });
        categories = categories.concat(summary.attributes['category-names']);
      });
      categories = categories.filter(function (e, i, arr) {
        return arr.lastIndexOf(e) === i;
      });
      $scope.detailList[id] = {
        count: response.data.length,
        details: details,
        compares: compares,
        competitors: competitors,
        categories: categories,
        stream: stream
      };

      G2.$('#organization_loading_' + id).hide();

      $scope.$apply();
    }

    $scope.collapse = function (id) {
      G2.$('.expand-' + id).show();
      G2.$('.collapse-' + id).hide();
      $scope.expanded.splice($scope.expanded.indexOf(id), 1);
      G2.$('#organization_' + id).hide();
    }
    $scope.color = function (param) {
      if (param > 0) {
        return '0070d2';
      }
      return 'dddbda';
    }

    $scope.executeSearch = function (page) {
      $scope.Page = page || 1;
      $scope.expanded = [];
      var data = {
        visit_report: {
          dimension_filter: {}
        }
      }

      if ($scope.search.Region !== undefined && $scope.search.Region.length > 0) {
        data.visit_report.dimension_filter.org_state_code_in = [];
        G2.$.each($scope.search.Region, function (a, region) {
          data.visit_report.dimension_filter.org_state_code_in.push(region.code);
        });
        $scope.tickedRegionCodes = data.visit_report.dimension_filter.org_state_code_in;
      } else if ($scope.search.Country !== undefined && $scope.search.Country.code !== undefined) {
        data.visit_report.dimension_filter.org_country_code_eq = $scope.search.Country.code;
      }


      if ($scope.search.Organization !== undefined) {
        data.visit_report.dimension_filter.org_name_cont = $scope.search.Organization;
      }
      if ($scope.search.CompanySize !== undefined && $scope.search.CompanySize !== null) {
        data.visit_report.dimension_filter.org_employees_range_eq = $scope.search.CompanySize;
      }
      if ($scope.search.SortBy !== undefined) {
        data.visit_report.sort = $scope.search.SortBy[1];
      }
      if ($scope.search.StartDate !== undefined) {
        $scope.dates.StartRaw = $scope.search.StartDate.clone();
        $scope.dates.StartDate = $scope.dates.StartRaw.format("MM/DD/YYYY");
        data.visit_report.dimension_filter.first_seen_at_gteq = $scope.search.StartDate.format("YYYY-MM-DD");
      }
      if ($scope.search.EndDate !== undefined) {
        $scope.dates.EndRaw = $scope.search.EndDate.clone();
        $scope.dates.EndDate = $scope.dates.EndRaw.format("MM/DD/YYYY");
        data.visit_report.dimension_filter.first_seen_at_lteq = $scope.search.EndDate.add(1, 'day').format("YYYY-MM-DD");
      }
      if ($scope.Page !== undefined && $scope.Page > 1) {
        data.visit_report.page = page;
      }
      $scope.loading = true;
      $scope.getOrganizations(data);
    }

    $scope.clear = function () {
      if ($scope.search === {}) {
        return;
      }
      $scope.search = {};
      $scope.dates = {};
      $scope.tickedRegionCodes = [];
      $scope.loading = true;
      $scope.getOrganizations();
      $scope.resetDatepicker();
    }

    $scope.setShowMapped = function (val) {
      $scope.showMapped = val;
    }

    $scope.resetDatepicker = function () {
      G2.$('#date').datepicker('setDate', G2.moment().subtract(7, 'day'));
      G2.$('#EndDate').datepicker('setDate', G2.moment());
    }

    $scope.setDatepicker = function () {
      G2.$('#date').datepicker({
        numYearsAfter: 0,
        numYearsBefore: 1,
        format: 'MM/DD/YYYY',
        initDate: G2.moment().subtract(7, 'day'),
        onSelect: function (datepicker, selectedDate) {
          $scope.search.StartDate = selectedDate;
        },
        onChange: function (datepicker) {
          $scope.search.StartDate = datepicker.selectedFullDate;
        }
      });
      G2.$('#EndDate').datepicker({
        numYearsAfter: 0,
        numYearsBefore: 1,
        format: 'MM/DD/YYYY',
        initDate: G2.moment(),
        onSelect: function (datepicker, selectedDate) {
          $scope.search.EndDate = selectedDate;
        },
        onChange: function (datepicker) {
          $scope.search.EndDate = datepicker.selectedFullDate;
        }
      });
      $scope.search.StartDate = G2.moment().subtract(7, 'day');
      $scope.search.EndDate = G2.moment();
    }

    $scope.defaultOnReady = function () {
      $scope.setDatepicker();
      G2.$('.acct-lookup-form .lookupInput input').on('change', function () {
        setTimeout(function () {
          G2.$('.accountName').val(G2.$('.acct-lookup-form .lookupInput input').val()).trigger('change');
          G2.$('.accountId').val(G2.$(".acct-lookup-form [id*='_lkid']").val()).trigger('change');
        }, 50)
      });

      G2.$('.oppty-lookup-form .lookupInput input').on('change', function () {
        setTimeout(function () {
          G2.$('.opportunityName').val(G2.$('.oppty-lookup-form .lookupInput input').val()).trigger('change');
          G2.$('.opportunityId').val(G2.$(".oppty-lookup-form [id*='_lkid']").val()).trigger('change');
        }, 50)
      });

      G2.$('.lead-lookup-form .lookupInput input').on('change', function () {
        setTimeout(function () {
          G2.$('.leadName').val(G2.$('.lead-lookup-form .lookupInput input').val()).trigger('change');
          G2.$('.leadId').val(G2.$(".lead-lookup-form [id*='_lkid']").val()).trigger('change');
        }, 50)
      });
    }

    G2.$(document).ready(function () {
      $scope.defaultOnReady();
    });

    $scope.formatted = function (date) {
      return G2.moment(date).format('MMMM Do YYYY, h:mm a');
    }

    $scope.type = function (tag) {
      if (tag.indexOf('categories') === 0) {
        return 'Category Viewed';
      } else if (tag === 'products.competitors') {
        return 'Alternative Views';
      } else if (tag.indexOf('products') === 0) {
        return 'Profile Views';
      } else if (tag.indexOf('comparison') === 0) {
        return 'Comparisons';
      }
    }

    $scope.visitTimeframe = function (count, start, end) {
      if (count === undefined) {
        return '';
      }
      var durationString = '';
      if (count > 1) {
        durationString = durationString + count + ' visits over ';
      } else {
        durationString = durationString + count + ' visit over ';
      }

      var months = end.diff(start, 'months');

      if (months > 1) {
        return durationString + months + ' ' + $scope.plural(months, 'month');
      }
      var weeks = end.diff(start, 'weeks');

      if (weeks > 0) {
        return durationString + weeks + ' ' + $scope.plural(weeks, 'week');
      }
      var days = end.diff(start, 'days');

      return durationString + days + ' ' + $scope.plural(days, 'day');
    }

    $scope.plural = function (count, singular) {
      if (count > 1) {
        return singular + 's';
      }
      return singular;
    }

    $scope.toggle = function (id, value) {
      $scope.table[id] = value;
    }
    $scope.initialize();
  });
}

document.addEventListener('readyVisitingOrganizations', function () {
  G2.setupVisitingOrganizations(G2.VisitingOrganizations);
});

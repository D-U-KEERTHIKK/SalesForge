var G2 = G2 || {};

G2.stubRemoting = function () {
  var withCallback = function (callback, value) {
    var deferred = G2.$.Deferred();
    deferred.promise().then(callback);
    setTimeout(function () {
      deferred.resolve(value)
    }, 50);
  }

  G2.G2Remoting = {
    reviews: function (callback, $scope) {
      withCallback(callback, reviewData($scope.mcm));
    },
    paginate: function (callback, link) {
      withCallback(callback, reviewData({}));
    },
    leadPage: function (callback, id) {
      callback({});
    },
    referencePage: function (callback, isUpdate, data, ProductUUID,
                             referenceId) {
      withCallback(callback, referencePageData);
    },
    visitSummaries: function (callback, data, product_id) {
      if (data
        && data.visit_report
        && data.visit_report.dimension_filter
        && data.visit_report.dimension_filter.org_name_cont === 'No Auth') {
        G2.G2Remoting.onError({
          status: 401
        });
      } else if (data
        && data.visit_report
        && data.visit_report.dimension_filter
        && data.visit_report.dimension_filter.org_name_cont === 'Bad') {
        G2.G2Remoting.onError({
          status: 500
        });
      } else {
        var companies;
        if (data && data.visit_report
          && data.visit_report.dimension_filter) {
          companies = [];
          for (var property in data.visit_report.dimension_filter) {
            if (data.visit_report.dimension_filter
                .hasOwnProperty(property)) {
              companies
                .push(data.visit_report.dimension_filter[property]);
            }
          }
          if (data && data.visit_report && data.visit_report.sort) {
            companies.push(data.visit_report.sort);
          }
        }
        withCallback(callback, visitSummariesData(companies));
      }
    },
    visitSummaryList: function (callback, id, date, endDate) {
      var deferred = G2.$.Deferred();
      var deferred2 = G2.$.Deferred();
      G2.$.when(deferred.promise(), deferred2.promise()).then(callback);
      setTimeout(function () {
        deferred.resolve([visitSummaryListReportData]);
        deferred2.resolve([visitSummaryListStreamData]);
      }, 50);
    },
    assignVisitor: function (callback, data) {
      withCallback(
        callback,
        {
          "data": {
            "type": "subscribed-organizations",
            "id": "602",
            "attributes": {
              "organization": "TestOrg",
              "id": 602,
              "remote-organization-id": 0
            },
            "links": {
              "self": "/api/salesforce/v1/subscribed-organizations/602"
            }
          }
        });
    },
    getReference: function (callback, isUpdate, ProductUUID, id) {
      withCallback(callback, getReferenceData);
    },
    onError: function (data) {
      var message = 'An error occured, please try again later';
      if (data.status === 401) {
        message = 'You are not authorized to perform this action';
      }
      G2.$('.G2Crowd').trigger('G2error',
        [data.status, data.statusText, message]);
    }
  }

  var buildReview = function (id) {
    return {
      "type": "survey-responses",
      "id": id,
      "attributes": {
        "default-sort": 47.4471872395833,
        "is-public": true,
        "slug": "g2-crowd-marketing-solutions-review-" + id,
        "percent-complete": 0.9,
        "title": "G2Crowd is a great channel for lead generation and customer testimonial generation! ",
        "moderated-at": "2017-08-31T10:47:16.045-05:00",
        "url": "https://www.g2crowd.com/survey_responses/g2-crowd-marketing-solutions-review-"
        + id,
        "comment-answers": {
          "love": {
            "text": "What do you like best?",
            "value": "As " + id + " I really like this"
          },
          "hate": {
            "text": "What do you dislike?",
            "value": "As " + id + " I really hate this"
          },
          "benefits": {
            "text": "What business problems are you solving with the product?  What benefits have you realized?",
            "value": " As " + id + " I benefit"
          }
        },
        "secondary-answers": {
          "meets_requirements": {
            "text": "Meets Requirements",
            "value": 7.0
          },
          "ease_of_use": {
            "text": "Ease of Use",
            "value": 7.0
          },
          "quality_of_support": {
            "text": "Quality of Support",
            "value": 7.0
          }
        },
        "user-id": "0bffb401-7428-4361-8b0f-827f533308a1",
        "company": "" + id + " Company",
        "user-name": "" + id + " User",
        "product-name": "G2 Crowd Marketing Solutions",
        "user-image-url": "https://media.licdn.com/mpr/mprx/0_x0rFQvOED0bmSUXcrmeQwGrEWII-wsUFPmeF_TlwHdZPaELb9mkdkByEmuBPwEUbPmedwTPoksR1HYanvuzRmTO63sRtHYTb9uzX58IIoUaOGesRsj_ELqLVTf3CTY9nxflIGOYA9y5",
        "review-source": "Organic",
        "is-business-partner": true,
        "verified-current-user": true,
        "votes-up": 1,
        "votes-down": 0,
        "votes-total": 1,
        "star-rating": 5.0
      },
      "links": {
        "self": "/api/salesforce/v1/survey-responses/" + id
      }
    }
  }

  var visitSummaryListReportData = {
    "data": [
      {
        "type": "visit-summaries",
        "id": "23154384",
        "attributes": {
          "id": 23154384,
          "pageviews": {
            "categories.show": 1,
            "products.pricing": 1
          },
          "compare-ids": [],
          "category-ids": ["180"],
          "organization": "TestOrg",
          "comparison-pageviews": 0,
          "competitor-pageviews": 0,
          "product-profile-pageviews": 1,
          "category-pageviews": 1,
          "first-seen-at": "2018-01-22T14:31:44.289-06:00",
          "last-seen-at": "2018-01-22T16:16:04.825-06:00",
          "product-id": 1679,
          "product-name": "G2 Crowd Review Platform",
          "category-names": ["Technology Research"],
          "competitor-products": {
            "data": []
          },
          "compared-products": {
            "data": []
          }
        },
        "links": {
          "self": "/api/salesforce/v1/visit-summaries/23154384"
        }
      },
      {
        "type": "visit-summaries",
        "id": "22993840",
        "attributes": {
          "id": 22993840,
          "pageviews": {
            "products.competitors": 1
          },
          "compare-ids": [],
          "category-ids": [],
          "organization": "TestOrg",
          "comparison-pageviews": 0,
          "competitor-pageviews": 1,
          "product-profile-pageviews": 0,
          "category-pageviews": 0,
          "first-seen-at": "2018-01-19T14:27:54.970-06:00",
          "last-seen-at": "2018-01-19T14:27:54.970-06:00",
          "product-id": 25485,
          "product-name": "G2 Crowd Marketing Solutions",
          "category-names": [],
          "competitor-products": {
            "data": [{
              "type": "softwares",
              "id": "3b0f8475-f80b-4cf1-aace-67e1784f6ec8",
              "attributes": {
                "name": "SimilarTech",
                "short-name": "SimilarTech",
                "slug": "similartech",
                "image-url": "https://images.g2crowd.com/uploads/product/image/1489698027/similartech.png",
                "review-count": 0,
                "avg-rating": "0.0",
                "favicon": "https://images.g2crowd.com/uploads/product/hd_favicon/1487565796/similartech.svg",
                "public-detail-url": "https://www.g2crowd.com/products/similartech/reviews",
                "star-rating": 0.0
              },
              "links": {
                "self": "/api/salesforce/v1/softwares/3b0f8475-f80b-4cf1-aace-67e1784f6ec8"
              }
            }]
          },
          "compared-products": {
            "data": []
          }
        },
        "links": {
          "self": "/api/salesforce/v1/visit-summaries/22993840"
        }
      }, {
        "type": "visit-summaries",
        "id": "23130636",
        "attributes": {
          "id": 23130636,
          "pageviews": {
            "products.reviews": 14
          },
          "compare-ids": [],
          "category-ids": [],
          "organization": "TestOrg",
          "comparison-pageviews": 0,
          "competitor-pageviews": 0,
          "product-profile-pageviews": 14,
          "category-pageviews": 0,
          "first-seen-at": "2018-01-22T12:48:19.812-06:00",
          "last-seen-at": "2018-01-22T13:18:07.710-06:00",
          "product-id": 25485,
          "product-name": "G2 Crowd Marketing Solutions",
          "category-names": [],
          "competitor-products": {
            "data": []
          },
          "compared-products": {
            "data": []
          }
        },
        "links": {
          "self": "/api/salesforce/v1/visit-summaries/23130636"
        }
      }]
  }

  var visitSummaryListStreamData = {
    "data": [
      {
        "type": "remote-event-streams",
        "id": "42015262",
        "attributes": {
          "time": "2018-01-22T16:16:04.825-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd/pricing",
          "title": "G2 Crowd Review Platform Pricing | G2 Crowd",
          "tag": "products.pricing",
          "category-name": null,
          "product-name": "G2 Crowd Review Platform"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/42015262"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41998601",
        "attributes": {
          "time": "2018-01-22T14:31:44.289-06:00",
          "url": "https://www.g2crowd.com/categories/technology-research",
          "title": "Best Technology Research Services in 2018 | G2 Crowd",
          "tag": "categories.show",
          "category-name": "Technology Research",
          "product-name": "G2 Crowd Review Platform"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41998601"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41986205",
        "attributes": {
          "time": "2018-01-22T13:18:07.710-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?filters%5Bcomment_answer_values%5D=\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026order=g2_default\u0026page=2",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41986205"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41984443",
        "attributes": {
          "time": "2018-01-22T13:08:22.522-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?utf8=%E2%9C%93\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026filters%5Bcomment_answer_values%5D=\u0026order=g2_default",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41984443"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41984345",
        "attributes": {
          "time": "2018-01-22T13:07:56.285-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41984345"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41982015",
        "attributes": {
          "time": "2018-01-22T12:54:20.098-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?filters%5Bcomment_answer_values%5D=\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026order=most_recent",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41982015"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41981980",
        "attributes": {
          "time": "2018-01-22T12:54:07.088-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?filters%5Bcomment_answer_values%5D=\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026order=most_recent\u0026page=2",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41981980"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41981953",
        "attributes": {
          "time": "2018-01-22T12:53:56.933-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?filters%5Bcomment_answer_values%5D=\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026order=most_recent\u0026page=2",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41981953"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41981927",
        "attributes": {
          "time": "2018-01-22T12:53:47.815-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?filters%5Bcomment_answer_values%5D=\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026order=most_recent\u0026page=2",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41981927"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41981874",
        "attributes": {
          "time": "2018-01-22T12:53:31.148-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?filters%5Bcomment_answer_values%5D=\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026order=most_recent\u0026page=2",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41981874"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41981859",
        "attributes": {
          "time": "2018-01-22T12:53:25.775-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?utf8=%E2%9C%93\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026filters%5Bcomment_answer_values%5D=\u0026order=most_recent",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41981859"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41981430",
        "attributes": {
          "time": "2018-01-22T12:50:48.845-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?utf8=%E2%9C%93\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026filters%5Bcomment_answer_values%5D=\u0026order=most_recent",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41981430"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41981357",
        "attributes": {
          "time": "2018-01-22T12:50:23.507-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?utf8=%E2%9C%93\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026filters%5Bcomment_answer_values%5D=\u0026order=most_recent",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41981357"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41981061",
        "attributes": {
          "time": "2018-01-22T12:48:42.875-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?utf8=%E2%9C%93\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026filters%5Bcomment_answer_values%5D=\u0026order=most_recent",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41981061"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41981008",
        "attributes": {
          "time": "2018-01-22T12:48:26.079-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?utf8=%E2%9C%93\u0026filters%5Bcompany_segment%5D%5B%5D=181\u0026filters%5Bcomment_answer_values%5D=\u0026order=most_recent",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41981008"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41980980",
        "attributes": {
          "time": "2018-01-22T12:48:19.812-06:00",
          "url": "https://www.g2crowd.com/products/g2-crowd-marketing-solutions/reviews?filters%5Bcomment_answer_values%5D=\u0026order=most_recent\u0026page=5",
          "title": "G2 Crowd Marketing Solutions Reviews | G2 Crowd",
          "tag": "products.reviews",
          "category-name": null,
          "product-name": "G2 Crowd Marketing Solutions"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41980980"
        }
      },
      {
        "type": "remote-event-streams",
        "id": "41757684",
        "attributes": {
          "time": "2018-01-19T14:27:54.970-06:00",
          "url": "https://www.g2crowd.com/products/similartech/competitors/alternatives",
          "title": "SimilarTech Alternatives and Competitors | G2 Crowd",
          "tag": "products.competitors",
          "category-name": null,
          "product-name": "SimilarTech"
        },
        "links": {
          "self": "/api/salesforce/v1/remote-event-streams/41757684"
        }
      }]
  }

  var buildVisitor = function (name, id) {
    return {
      "comparison_pageviews": 0,
      "product_profile_pageviews": 14,
      "category_pageviews": 0,
      "first_seen_at": "2018-01-19T14:27:54.970-06:00",
      "last_seen_at": "2018-01-22T13:18:07.710-06:00",
      "total_pageviews": 15,
      "competitor_pageviews": 1,
      "org_name": name,
      "org_country": "United States",
      "org_state": "Texas",
      "org_id": id,
      "org_employees_range": "11-50",
      "org_domain": name + ".com",
      "org_linkedin": "company/" + name,
      "org_city": "Austin",
      "org_annual_revenue": null
    }
  }

  var visitSummariesData = function (companies) {
    companies = companies || ['TestOrg', 'MappedOrg', 'NotMappedOrg']
    var data = [];
    G2.$.each(companies, function (a, company) {
      data.push(buildVisitor(company, a));
    })

    return {
      "data": {
        "type": "open-structs",
        "attributes": {
          "geo": [{
            "total_pageviews": 50,
            "org_country_code": null,
            "org_state_code": null,
            "org_country": null,
            "org_state": null
          }, {
            "total_pageviews": 1,
            "org_country_code": "US",
            "org_state_code": "AK",
            "org_country": "United States",
            "org_state": "Alaska"
          }, {
            "total_pageviews": 1,
            "org_country_code": "US",
            "org_state_code": "AL",
            "org_country": "United States",
            "org_state": "Alabama"
          }, {
            "total_pageviews": 1,
            "org_country_code": "CH",
            "org_state_code": "ZH",
            "org_country": "Switzerland",
            "org_state": "Zurich"
          }, {
            "total_pageviews": 1,
            "org_country_code": "ES",
            "org_state_code": "CN",
            "org_country": "Spain",
            "org_state": "Canarias"
          }],
          "visitor-list": data
        },
        "links": {
          "self": "/api/salesforce/v1/open-structs/"
        }
      }
    }
  }

  var referencePageData = {
    "data": {
      "type": "product-reference-pages",
      "id": "148",
      "attributes": {
        "title": "G2 Crowd Reviews",
        "video-urls": [],
        "banner-image": "https://images.g2crowd.com/uploads/product_banner/image/885/1513873210.jpg",
        "product-uuid": "a7d324a4-06eb-4be2-ad8e-65938bce5fd5",
        "url": "https://www.g2crowd.com/references/g2-crowd-reviews",
        "survey-responses": [{
          data: buildReview('Review1')
        }, {
          data: buildReview('Review22')
        }, {
          data: buildReview('Review5')
        }],
        "downloads": [],
        "product-name": "G2 Crowd Marketing Solutions"
      },
      "links": {
        "self": "/api/salesforce/v1/product-reference-pages/148"
      }
    }
  }

  var getReferenceData = {
    "data": {
      "type": "product-reference-pages",
      "id": "152",
      "attributes": {
        "title": "Test",
        "video-urls": ["youtube.com/testone", "youtube.com/testtwo",
          "youtube.com/testthree"],
        "banner-image": "https://www.g2crowd.com/assets/banner-template-1500x400-5fb3ec443fa6c5301aa506f291eef6bde9ea565c5813ccb27bc3e9187b29bd85.jpg",
        "product-uuid": "0960f803-6b16-4f39-befb-1c30b7a35812",
        "url": "http://localhost:3000/references/test-5c7dacdd-63a2-42d6-87c4-1affb6188e48",
        "survey-responses": [{
          data: buildReview('ReviewForShared')
        }, {
          data: buildReview('ReviewForFolder')
        }, {
          data: buildReview('TEST')
        }],
        "downloads": [
          {
            "label": "Template 2",
            "url": "https://www.g2crowd.com/assets/banner-template-1500x400-5fb3ec443fa6c5301aa506f291eef6bde9ea565c5813ccb27bc3e9187b29bd85.jpg",
            "id": 76036
          },
          {
            "label": "Template 1",
            "url": "https://www.g2crowd.com/assets/banner-template-1500x400-5fb3ec443fa6c5301aa506f291eef6bde9ea565c5813ccb27bc3e9187b29bd85.jpg",
            "id": 76035
          }],
        "product-name": "G2 Crowd Review Platform"
      },
      "links": {
        "self": "/api/salesforce/v1/product-reference-pages/152"
      }
    }
  }

  var reviewData = function (mcm) {
    return {
      "data": [
        buildReview('ReviewForShared'),
        buildReview('ReviewForFolder'),
        buildReview('TEST'),
        buildReview('Not Included')
      ],
      "meta": {
        "aggregates": [{
          "filter_name": "nps_score",
          "collection": [{
            "id": 5,
            "text": "5 star",
            "count": 105,
            "checked": mcm.nps_score.indexOf(5) > -1,
            "changing": true
          }, {
            "id": 4,
            "text": "4 star",
            "count": 18,
            "checked": mcm.nps_score.indexOf(4) > -1
          }, {
            "id": 3,
            "text": "3 star",
            "count": 3,
            "checked": mcm.nps_score.indexOf(3) > -1
          }, {
            "id": 2,
            "text": "2 star",
            "count": 2,
            "checked": mcm.nps_score.indexOf(2) > -1
          }, {
            "id": 1,
            "text": "1 star",
            "count": 0,
            "checked": mcm.nps_score.indexOf(1) > -1
          }]
        }, {
          "filter_name": "company_segment",
          "collection": [{
            "id": 179,
            "text": "Small Business (50 or fewer emp.)",
            "count": 22,
            "checked": mcm.company_segment.indexOf(179) > -1
          }, {
            "id": 180,
            "text": "Mid-Market (51-1000 emp.)",
            "count": 53,
            "checked": mcm.company_segment.indexOf(180) > -1
          }, {
            "id": 181,
            "text": "Enterprise ( \u003e1000 emp.)",
            "count": 12,
            "checked": mcm.company_segment.indexOf(181) > -1
          }]
        }, {
          "filter_name": "role",
          "collection": [{
            "id": 1,
            "text": "User",
            "count": 27,
            "checked": mcm.role.indexOf(1) > -1
          }, {
            "id": 2,
            "text": "Administrator",
            "count": 42,
            "checked": mcm.role.indexOf(2) > -1
          }, {
            "id": 3,
            "text": "Executive Sponsor",
            "count": 10,
            "checked": mcm.role.indexOf(3) > -1
          }, {
            "id": 4,
            "text": "Internal Consultant",
            "count": 3,
            "checked": mcm.role.indexOf(4) > -1
          }, {
            "id": 48,
            "text": "Project Team Member",
            "count": 2,
            "checked": mcm.role.indexOf(48) > -1
          }, {
            "id": 49,
            "text": "Project Manager",
            "count": 1,
            "checked": mcm.role.indexOf(49) > -1
          }, {
            "id": 50,
            "text": "Executive Sponsor",
            "count": 2,
            "checked": mcm.role.indexOf(50) > -1
          }, {
            "id": 51,
            "text": "Partner",
            "count": 1,
            "checked": mcm.role.indexOf(51) > -1
          }]
        }, {
          "filter_name": "all_industry",
          "collection": [{
            "id": 274,
            "text": "Computer Software",
            "count": 44,
            "checked": mcm.all_industry.indexOf(274) > -1
          }, {
            "id": 317,
            "text": "Internet",
            "count": 14,
            "checked": mcm.all_industry.indexOf(317) > -1
          }, {
            "id": 313,
            "text": "Information Technology and Services",
            "count": 10,
            "checked": mcm.all_industry.indexOf(313) > -1
          }, {
            "id": 308,
            "text": "Human Resources",
            "count": 5,
            "checked": mcm.all_industry.indexOf(308) > -1
          }, {
            "id": 333,
            "text": "Marketing and Advertising",
            "count": 4,
            "checked": mcm.all_industry.indexOf(333) > -1
          }, {
            "id": "not(274,317,313,308,333)",
            "text": "Other",
            "count": 11,
            "checked": mcm.all_industry.indexOf('not(274,317,313,308,333)') > -1
          }]
        }, {
          "filter_name": "category_ids",
          "collection": [{
            "id": 496,
            "text": "Other Lead Generation",
            "count": 5,
            "checked": mcm.category_ids.indexOf(496) > -1
          }, {
            "id": 1037,
            "text": "Marketing Account Intelligence",
            "count": 5,
            "checked": mcm.category_ids.indexOf(1037) > -1
          }, {
            "id": 46,
            "text": "Sales Intelligence",
            "count": 3,
            "checked": mcm.category_ids.indexOf(46) > -1
          }, {
            "id": 617,
            "text": "Other Marketing",
            "count": 86,
            "checked": mcm.category_ids.indexOf(617) > -1
          }]
        }],
        "record_count": 88,
        "page_count": 9
      },
      "links": {
        "first": "https://www.g2crowd.com/api/salesforce/v1/survey_responses?page%5Bnumber%5D=1\u0026page%5Bsize%5D=10\u0026product_id=a7d324a4-06eb-4be2-ad8e-65938bce5fd5",
        "last": "https://www.g2crowd.com/api/salesforce/v1/survey_responses?page%5Bnumber%5D=9\u0026page%5Bsize%5D=10\u0026product_id=a7d324a4-06eb-4be2-ad8e-65938bce5fd5",
        "next": "https://www.g2crowd.com/api/salesforce/v1/survey_responses?page%5Bnumber%5D=2\u0026page%5Bsize%5D=10\u0026product_id=a7d324a4-06eb-4be2-ad8e-65938bce5fd5"
      }
    }
  }
}

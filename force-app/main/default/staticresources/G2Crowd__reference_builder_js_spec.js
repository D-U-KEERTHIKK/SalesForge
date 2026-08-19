'use strict';
var Spec = Spec || {};

Spec.ReferenceBuilder = function () {
  var controller, rootScope;
  var scope, ctrl, uibModal;

  var init = function (data) {
    data = data || {
        vars: {
          ReferencePages: '[]',
          ProductList: '{}',
          APIToken: '3124',
          isClassic: false,
          fullAccess: true
        }
      }

    G2.RawProductList = {};

    G2.setupReferenceBuilder(data);
    inject(function ($controller, $rootScope, $uibModal) {
      rootScope = $rootScope
      scope = $rootScope.$new();
      ctrl = $controller('ReferenceBuilder', {
        '$scope': scope
      });
    })
  }

  beforeEach(module('G2Crowd'));
  describe("Setters", function () {
    it('steps should be {}', function () {
      init();
      expect(scope.steps).toBeDefined();
      expect(scope.steps).toEqual({});
    });

    it('pagination should be {}', function () {
      init();
      expect(scope.pagination).toBeDefined();
      expect(scope.pagination).toEqual({});
    });

    it('initialized should be false', function () {
      init();
      expect(scope.initialized).toBeDefined();
      expect(scope.initialized).toEqual(false);
    });

    it('errors should be []', function () {
      init();
      expect(scope.errors).toBeDefined();
      expect(scope.errors).toEqual([]);
    });

    it('ProductList should be []', function () {
      init();
      expect(scope.ProductList).toBeDefined();
      expect(scope.ProductList).toEqual({});
    });

    it('data should be defaulted', function () {
      init();
      expect(scope.data).toBeDefined();
      expect(scope.data).toEqual({ReferenceList: []});
    });

    it('selected should be 0', function () {
      init();
      expect(scope.selected).toBeDefined();
      expect(scope.selected).toEqual(0);
    });

    it('onlySelected should be false', function () {
      init();
      expect(scope.onlySelected).toBeDefined();
      expect(scope.onlySelected).toEqual(false);
    });

    it('isEditing should be false', function () {
      init();
      expect(scope.isEditing).toBeDefined();
      expect(scope.isEditing).toEqual(false);
    });

    it('renderProduct should be true', function () {
      init();
      expect(scope.renderProduct).toBeDefined();
      expect(scope.renderProduct).toEqual(true);
    });

    it('referencePage should be initialized', function () {
      init();
      expect(scope.referencePage).toBeDefined();
      expect(scope.referencePage).toEqual({ videos: [], uploads: [], selectedReviews: {}});
    });

    it('search should be initialized', function () {
      init();
      expect(scope.search).toBeDefined();
      expect(scope.search).toEqual({ProductName: ''});
    });

    it('HasAccess should be true', function () {
      init();
      expect(scope.HasAccess).toBeDefined();
      expect(scope.HasAccess).toEqual(true);
    });

    it('isClassic should be false', function () {
      init();
      expect(scope.isClassic).toBeDefined();
      expect(scope.isClassic).toEqual(false);
    });

    describe('Alternative settings', function () {
      var init = function (data) {
        data = data || {
            vars: {
              ReferencePages: 'You are not permitted to use this feature.',
              ProductList: '{}',
              APIToken: '3124',
              isClassic: true,
              fullAccess: false
            }
          }

        G2.RawProductList = {};

        G2.setupReferenceBuilder(data);
        inject(function ($controller, $rootScope, $uibModal) {
          rootScope = $rootScope
          scope = $rootScope.$new();
          ctrl = $controller('ReferenceBuilder', {
            '$scope': scope
          });
        })
      }
      it('HasAccess should be false', function () {
        init();
        expect(scope.HasAccess).toBeDefined();
        expect(scope.HasAccess).toEqual(false);
      });

      it('data should be defaulted', function () {
        init();
        expect(scope.data).toBeDefined();
        expect(scope.data).toEqual({ReferenceList: []});
      });

      it('isClassic should be true', function () {
        init();
        expect(scope.isClassic).toBeDefined();
        expect(scope.isClassic).toEqual(true);
      });
    })
  });

  describe('With References', function () {
    var init = function (data) {
      data = data || {
          vars: {
            ReferencePages: '[{ "G2Crowd__G2_Product__r": { "Name": "Test" } }]',
            ProductList: '{}',
            APIToken: '3124',
            isClassic: false,
            fullAccess: true
          }
        }

      G2.RawProductList = {};

      G2.G2Remoting = {
        referencePage: function (cb) {
          return cb({data: {attributes: {}}})
        },
        getReference: function (cb) {
          return cb({data: {attributes: {}}})
        }
      }

      G2.setupReferenceBuilder(data);
      inject(function ($controller, $rootScope, $uibModal) {
        rootScope = $rootScope
        scope = $rootScope.$new();
        ctrl = $controller('ReferenceBuilder', {
          '$scope': scope
        });
      })
    }

    it('sets the references product names', function () {
      init();
      expect(scope.data.ReferenceList).toEqual([{G2Crowd__G2_Product__r: {Name: 'Test'}, ProductName: 'Test'}]);
    })

    describe("$watch 'referencePage.banner'", function () {
      it('sets the reader up', function () {
        init();
        var dummyFileReader = {
          readAsDataURL: function () {
          }, onload: function () {
          }
        }
        var dummy$ = {
          attr: function () {
          }
        }
        scope.referencePage.banner = {_file: 'testFile'}
        spyOn(window, "FileReader").and.returnValue(dummyFileReader)
        spyOn(G2, '$').and.returnValue(dummy$);
        spyOn(dummy$, 'attr')
        spyOn(dummyFileReader, 'readAsDataURL').and.callFake(function () {
          dummyFileReader.onload({target: {result: 'testResult'}});
        })
        spyOn(dummyFileReader, 'onload').and.callThrough();

        scope.$digest();

        expect(G2.$).toHaveBeenCalledWith('#banner_image');
        expect(dummy$.attr).toHaveBeenCalledWith('src', 'testResult');
      })
    })

    describe("addInput", function () {
      it('adds to the array', function () {
        init();
        var arr = [];
        scope.addInput(arr);
        expect(arr).toEqual([''])
      })
    })

    describe("removeInput", function () {
      it('removes from the array', function () {
        init();
        var arr = ['a', 'b', 'c'];
        scope.removeInput(arr, 1);
        expect(arr).toEqual(['a', 'c'])
      });

      it('sets destroy if id present', function () {
        init();
        var arr = ['a', {id: '12'}, 'c'];
        scope.removeInput(arr, 1);
        expect(arr).toEqual(['a', {id: '12', _destroy: true}, 'c'])
      })
    })

    describe("getNumber", function () {
      it('removes from the array', function () {
        init();

        expect(scope.getNumber(6)).toEqual(new Array(6))
      })
    })

    describe("hasReviews", function () {
      it('return true if reviews are selected', function () {
        init();
        scope.referencePage.selectedReviews = {a: 1, b: 2}
        expect(scope.hasReviews()).toEqual(true)
      })
      it('return false if no reviews are selected', function () {
        init();

        scope.referencePage.selectedReviews = {}
        expect(scope.hasReviews()).toEqual(false)
      })
    })

    describe("updateSelected", function () {
      it('sets scope.selected', function () {
        init();
        scope.selected = 10
        scope.updateSelected(6)
        expect(scope.selected).toEqual(6)
      })
    })

    describe("isSelected", function () {
      it('returns true if in selectedReviews', function () {
        init();
        scope.referencePage.selectedReviews = {6: '1'}

        expect(scope.isSelected(6)).toEqual(true)
      })

      it('returns false if not in selectedReviews', function () {
        init();
        scope.referencePage.selectedReviews = {6: '1'}

        expect(scope.isSelected(7)).toEqual(false)
      })
    })

    describe("updateSelection", function () {
      it('removes if already included', function () {
        init();
        scope.referencePage.selectedReviews = {6: '1', 7: '1'}
        scope.updateSelection(6, {name: 'test'})
        expect(scope.referencePage.selectedReviews).toEqual({7: '1'})
      })

      it('adds if not included', function () {
        init();
        scope.referencePage.selectedReviews = {7: '1'};
        scope.updateSelection(6, {name: 'test'});
        expect(scope.referencePage.selectedReviews).toEqual({7: '1', 6: {name: 'test'}})
      })
    })

    describe("update", function () {
      it('returns true if id is set', function () {
        init();
        scope.referencePage.id = 'test'
        expect(scope.update()).toEqual(true)
      })

      it('false if id is not set', function () {
        init();
        expect(scope.update()).toEqual(false)
      })
    })

    describe("paramData", function () {
      var defaults = function () {
        scope.referencePage = {
          type: 'type',
          videos: [],
          uploads: [],
          selectedReviews: [],
        }
        scope.Product = {UUID: 'Product_UUID'}
      }

      it('returns basic data', function () {
        init();
        defaults();

        var data = scope.paramData();
        expect(data.get('product_reference_page[title]')).toEqual('type')
        expect(data.get('product_id')).toEqual('Product_UUID')
        expect(data.get('api_token')).toEqual('3124')
      })

      it('includes banner image when set', function () {
        init();
        defaults();
        scope.referencePage.banner = {_file: 'test'}
        var data = scope.paramData();
        expect(data.get('product_reference_page[banner_image]')).toEqual('test')

      })

      it('includes videos when set', function () {
        init();
        defaults();
        scope.referencePage.videos = ['test', 'video', 'urls'];
        var data = scope.paramData();
        expect(data.getAll('product_reference_page[video_urls][]')).toEqual(['test', 'video', 'urls'])
      })

      it('includes downloads when set', function () {
        init();
        defaults();
        scope.referencePage.uploads = [{label: 'label1', file: {_file: 'file1'}}, {
          label: 'label2',
          id: 554,
          file: {_file: 'file2'}
        }];
        var data = scope.paramData();
        expect(data.get('product_reference_page[downloads_attributes][0][label]')).toEqual('label1')
        expect(data.get('product_reference_page[downloads_attributes][554][label]')).toEqual('label2')
        expect(data.get('product_reference_page[downloads_attributes][554][id]')).toEqual('554')
        expect(data.get('product_reference_page[downloads_attributes][0][file]')).toEqual('file1')
        expect(data.get('product_reference_page[downloads_attributes][554][file]')).toEqual('file2')
      })

      it('removes downloads when _destroy is set', function () {
        init();
        defaults();
        scope.referencePage.uploads = [{label: 'label1', file: {_file: 'file1'}}, {
          label: 'label2',
          id: 554,
          _destroy: true,
          file: {_file: 'file2'}
        }];
        var data = scope.paramData();
        expect(data.get('product_reference_page[downloads_attributes][0][label]')).toEqual('label1')
        expect(data.get('product_reference_page[downloads_attributes][554][label]')).toEqual('label2')
        expect(data.get('product_reference_page[downloads_attributes][554][id]')).toEqual('554')
        expect(data.get('product_reference_page[downloads_attributes][0][file]')).toEqual('file1')
        expect(data.get('product_reference_page[downloads_attributes][554][file]')).toEqual('file2')
        expect(data.get('product_reference_page[downloads_attributes][554][_destroy]')).toEqual('true')
      })

      it('includes selectedReviews when set', function () {
        init();
        defaults();
        scope.referencePage.selectedReviews = {554: {id: 5543}, 54: {id: 1234}}
        var data = scope.paramData();
        expect(data.get('product_reference_page[product_reference_page_survey_responses_attributes][554][survey_response_id]')).toEqual('5543')
        expect(data.get('product_reference_page[product_reference_page_survey_responses_attributes][54][survey_response_id]')).toEqual('1234')
      })
    })

    describe("loading", function () {
      it('sets loading true', function () {
        init();
        scope.isLoading = false
        scope.loading('test')
        expect(scope.isLoading).toEqual(true)
      })
    })

    describe("doneLoading", function () {
      it('sets loading false', function () {
        init();
        scope.isLoading = true
        scope.doneLoading('test')
        expect(scope.isLoading).toEqual(false)
      })
    })

    describe("save", function () {
      it('does not call G2.G2Remoting.referencePage if errors', function () {
        init();
        spyOn(G2.G2Remoting, 'referencePage')
        scope.errors = ['test']
        scope.save()
        expect(G2.G2Remoting.referencePage).not.toHaveBeenCalled();
      })

      describe('no errors', function () {
        beforeEach(function () {
          init();
          spyOn(scope, 'paramData')
          spyOn(scope, 'update')
          scope.errors = []
        });

        it('calls G2.G2Remoting.referencePage if no errors', function () {
          spyOn(G2.G2Remoting, 'referencePage')
          scope.save()
          expect(G2.G2Remoting.referencePage).toHaveBeenCalled();
        })

        it('sets isLoading true', function () {
          scope.isLoading = false
          spyOn(G2.G2Remoting, 'referencePage')
          scope.save()
          expect(scope.isLoading).toEqual(true)
        })

        it('calls scope.update if no errors', function () {
          spyOn(G2.G2Remoting, 'referencePage')
          scope.save()
          expect(scope.update).toHaveBeenCalled();
        })

        it('calls scope.paramData if no errors', function () {
          spyOn(G2.G2Remoting, 'referencePage')
          scope.save()
          expect(scope.paramData).toHaveBeenCalled();
        })

        it('calls processSave', function () {
          spyOn(G2.G2Remoting, 'referencePage').and.callFake(function (cb) {
            return cb({data: {attributes: {}}})
          })
          spyOn(scope, 'processSave')
          scope.save()
          expect(scope.processSave).toHaveBeenCalledWith({attributes: {}}, true);
        })

        it('sets notice', function () {
          spyOn(G2.G2Remoting, 'referencePage').and.callFake(function (cb) {
            return cb({data: {attributes: {}}})
          })
          spyOn(scope, 'processSave')
          scope.save()
          expect(scope.notice).toEqual('Successfully Saved!');
        })
      })
    })

    describe("processSave", function () {
      it('sets the referencePage', function () {
        init();
        scope.processSave({
          id: 'id',
          attributes: {
            'survey-responses': [],
            title: 'title',
            'video-urls': 'video-urls',
            'downloads': 'downloads',
            'banner-image': 'banner-image'
          }
        }, false)

        expect(scope.referencePage.id).toEqual('id')
        expect(scope.referencePage.type).toEqual('title')
        expect(scope.referencePage.videos).toEqual('video-urls')
        expect(scope.referencePage.uploads).toEqual('downloads')
        expect(scope.referencePage.banner_url).toEqual('banner-image')
      })

      it('sets the selectedReviews', function () {
        init();
        var data = [{data: {id: 10, attributes: {'comment-answers': {'test': 'test'}}}}, {
          data: {
            id: 12,
            attributes: {'comment-answers': {'test': 'test'}}
          }
        }]
        scope.processSave({
          id: 'id', attributes: {'survey-responses': data}
        }, false)

        expect(scope.referencePage.selectedReviews).toEqual({10: data[0].data, 12: data[1].data})
      })


      it('sets the questions', function () {
        init();
        var data = [{data: {id: 10, attributes: {'comment-answers': {'test': 'test'}}}}, {
          data: {
            id: 12,
            attributes: {'comment-answers': {'foo': 'test', 'test': 'test'}}
          }
        }]
        scope.processSave({
          id: 'id', attributes: {'survey-responses': data}
        }, false)

        expect(scope.referencePage.Questions).toEqual(['test', 'foo'])
      })


      it('adds to the reference list', function () {
        init();
        var data = [{data: {id: 10, attributes: {'comment-answers': {}}}}, {
          data: {
            id: 12,
            attributes: {'comment-answers': {}}
          }
        }];
        scope.ProductList = [{G2Crowd__G2_Unique_Identifier__c: 'test', Name: 'Name'}];
        scope.Product = {UUID: 'test'};

        scope.processSave({
          id: 'id', attributes: {'survey-responses': data}
        }, true)
        expect(scope.data.ReferenceList).toEqual([{
          G2Crowd__G2_Product__r: {Name: 'Test'},
          ProductName: 'Test'
        }, {ProductName: 'Name', G2Crowd__Title__c: undefined, G2Crowd__URL__c: undefined, G2Crowd__G2_ID__c: 'id'}]);
      })

      it('sets isLoading to false', function () {
        init();
        var data = [{data: {id: 10, attributes: {'comment-answers': {}}}}, {
          data: {
            id: 12,
            attributes: {'comment-answers': {}}
          }
        }];
        scope.isLoading = true;
        scope.processSave({
          id: 'id', attributes: {'survey-responses': data}
        }, false)
        expect(scope.isLoading).toEqual(false);
      })

      it('calls $apply', function () {
        init();
        var data = [{data: {id: 10, attributes: {'comment-answers': {}}}}, {
          data: {
            id: 12,
            attributes: {'comment-answers': {}}
          }
        }];
        spyOn(scope, '$apply');
        scope.processSave({
          id: 'id', attributes: {'survey-responses': data}
        }, false)
        expect(scope.$apply).toHaveBeenCalled();
      })
    })
  })

  describe("getReferencePage", function () {
    it('calls G2.G2Remoting.getReference', function () {
      init();
      spyOn(G2.G2Remoting, 'getReference');
      scope.referencePage.id = 10
      scope.Product = {UUID: 'Product_UUID'}
      spyOn(scope, 'update').and.returnValue('test');
      scope.getReferencePage()
      expect(G2.G2Remoting.getReference).toHaveBeenCalledWith(G2.jasmine.any(Function), 'test', 'Product_UUID', 10)
    })

    it('processes results', function () {
      init();
      spyOn(G2.G2Remoting, 'getReference').and.callFake(function (cb) {
        return cb({data: {attributes: {'product-uuid': 'product-uuid'}}})
      })
      scope.referencePage.id = 10
      scope.Product = {UUID: 'Product_UUID'}
      spyOn(scope, 'update').and.returnValue('test');
      spyOn(scope, '$broadcast');
      spyOn(scope, 'processSave');
      spyOn(scope, 'setSteps');

      scope.getReferencePage()

      expect(scope.Product.UUID).toEqual('product-uuid');
      expect(scope.processSave).toHaveBeenCalledWith({attributes: {'product-uuid': 'product-uuid'}})
      expect(scope.$broadcast).toHaveBeenCalledWith('productSelected')
      expect(scope.setSteps).toHaveBeenCalledWith(1)
    })
  })

  describe("productSelected", function () {
    it('calls $broadcast', function () {
      init();
      spyOn(scope, '$broadcast');
      scope.productSelected()
      expect(scope.$broadcast).toHaveBeenCalledWith('productSelected')
    })
  })

  describe("editReference", function () {
    it('calls hide and show', function () {
      init();
      var dummy = {
        hide: function () {
        }, show: function () {
        }
      }
      spyOn(G2, '$').and.returnValue(dummy);
      spyOn(dummy, 'hide')
      spyOn(dummy, 'show')
      spyOn(scope, 'getReferencePage')
      scope.editReference(10)
      expect(G2.$).toHaveBeenCalledWith('.list-page')
      expect(G2.$).toHaveBeenCalledWith('.list-page')
      expect(dummy.show).toHaveBeenCalled()
      expect(dummy.hide).toHaveBeenCalled()
    })

    it('sets basic', function () {
      init();
      spyOn(scope, 'getReferencePage')
      scope.isEditing = false
      scope.lists = 5
      scope.isLoading = false
      scope.editReference(10)

      expect(scope.referencePage).toEqual({videos: [], uploads: [], selectedReviews: {}, id: 10})
      expect(scope.isEditing).toEqual(true)
      expect(scope.lists).toEqual(1)
      expect(scope.isLoading).toEqual(true)
    })

    it('calls getReferencePage', function () {
      init();
      spyOn(scope, 'getReferencePage')
      scope.editReference(10)

      expect(scope.getReferencePage).toHaveBeenCalled();
    })
  })

  describe("showList", function () {
    it('calls hide and show', function () {
      init();
      var dummy = {
        hide: function () {
        }, show: function () {
        }
      }
      spyOn(G2, '$').and.returnValue(dummy);
      spyOn(dummy, 'hide')
      spyOn(dummy, 'show')
      scope.isEditing = true;
      scope.showList()
      expect(scope.isEditing).toEqual(false)
    })
  })

  describe("valueMissing", function () {
    it('is false', function () {
      init();
      expect(scope.valueMissing('test')).toEqual(false)
    })

    it('true if undefined', function () {
      init();
      expect(scope.valueMissing()).toEqual(true)
    })

    it('true if ""', function () {
      init();
      expect(scope.valueMissing('')).toEqual(true)
    })
  })

  describe("titleMissing", function () {
    it('is false if both present', function () {
      init();
      expect(scope.titleMissing({file: 'test', label: 'test'})).toEqual(false)
    })

    it('is false if all missing', function () {
      init();
      expect(scope.titleMissing({})).toEqual(false)
    })

    it('true if file present', function () {
      init();
      expect(scope.titleMissing({file: 'test'})).toEqual(true)
    })

    it('true if url present', function () {
      init();
      expect(scope.titleMissing({url: 'test'})).toEqual(true)
    })
  })

  describe("uploadMissing", function () {
    it('is false', function () {
      init();
      expect(scope.uploadMissing({file: 'test', label: 'test'})).toEqual(false)
    })

    it('is false with url', function () {
      init();
      expect(scope.uploadMissing({url: 'test', label: 'test'})).toEqual(false)
    })

    it('is false if nothing', function () {
      init();
      expect(scope.uploadMissing({})).toEqual(false)
    })

    it('true if file missing and url missing', function () {
      init();
      expect(scope.uploadMissing({label: 'test'})).toEqual(true)
    })
  })

  describe("startNew", function () {
    it('resets data', function () {
      init();
      spyOn(scope, 'setSteps')
      scope.startNew()
      expect(scope.referencePage).toEqual({ videos: [], uploads: [], selectedReviews: {}})
      expect(scope.errors).toEqual([]);
      expect(scope.selected).toEqual(0);
      expect(scope.isEditing).toEqual(false);
      expect(scope.setSteps).toHaveBeenCalledWith(1);
    })

    it('broadcasts for multiple', function () {
      init();
      scope.RawProductList = [1, 2]
      spyOn(scope, '$broadcast')
      scope.startNew()
      expect(scope.Product).toEqual({UUID: ''})
      expect(scope.$broadcast).toHaveBeenCalledWith('ProductReset');
    })

    it('broadcasts for single', function () {
      init();
      scope.RawProductList = [1]
      spyOn(scope, '$broadcast')
      scope.startNew()
      expect(scope.$broadcast).toHaveBeenCalledWith('singleProduct');
      expect(scope.$broadcast).toHaveBeenCalledWith('productSelected');
    })
  })

  describe("referenceSavable", function () {
    it('only if everything is selected', function () {
      init();

      expect(scope.referenceSavable()).toEqual(false);
      scope.Product.UUID = 'test'
      expect(scope.referenceSavable()).toEqual(false);
      scope.referencePage.type = 'test'
      expect(scope.referenceSavable()).toEqual(false);
      scope.referencePage.selectedReviews = [1, 2, 3]
      expect(scope.referenceSavable()).toEqual(true);
    })
    it('is false if errors present', function () {
      init();

      scope.Product.UUID = 'test'
      scope.referencePage.type = 'test'
      scope.referencePage.selectedReviews = [1, 2, 3]

      spyOn(G2, '$').and.returnValue([1, 2])
      expect(scope.referenceSavable()).toEqual(false);
    })
  })

  describe("showSelected", function () {
    it('propogates data', function () {
      init();
      scope.referencePage.selectedReviews = 'test'
      scope.showSelected();
      expect(scope.onlySelected).toEqual(true)
      expect(scope.ReviewData).toEqual('test')
      expect(scope.Meta).toEqual([])
      expect(scope.Links).toEqual([])
    })
  })
}

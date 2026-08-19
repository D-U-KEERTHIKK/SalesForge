var G2 = G2 || {};
G2.setupReferenceBuilder = function (initializer) {
  G2.app.directive('ngFileModel', ['$parse', function ($parse) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var model = $parse(attrs.ngFileModel);
        var isMultiple = attrs.multiple;
        var modelSetter = model.assign;
        element.bind('change', function () {
          var values = [];
          var error;
          angular.forEach(element[0].files, function (item) {
            var value = {
              name: item.name,
              size: item.size,
              url: URL.createObjectURL(item),
              _file: item,
            };
            if (item.size > 20000000) {
              value = {
                error: 'File exceed 20MB limit and was not attached'
              };
            }
            values.push(value);
          });
          scope.$apply(function () {
            if (isMultiple) {
              modelSetter(scope, values);
            } else {
              modelSetter(scope, values[0]);
            }
          });
        });
      }
    };
  }]);

  G2.app.controller('ReferenceBuilder', function ($scope, $sce, $uibModal, $controller) {
    $controller('BaseController', { $scope: $scope });

    $scope.pagination = {};
    $scope.initialized = false;
    $scope.referencePage = { videos: [], uploads: [], selectedReviews: {} };
    $scope.errors = [];
    $scope.selected = 0;
    $scope.isEditing = false;
    $scope.renderProduct = true;
    $scope.search = { ProductName: '' }
    $scope.data = {};
    $scope.ProductList = [];
    $scope.data.ReferenceList = [];
    $scope.steps = {};
    $scope.onlySelected = false;
    $scope.HasAccess = initializer.vars.fullAccess;

    var ProductList = initializer.vars.ProductList;
    if (ProductList !== '') {
      $scope.ProductList = G2.$.parseJSON(ProductList);
    }
    var ReferencePages = initializer.vars.ReferencePages;
    if (ReferencePages !== 'You are not permitted to use this feature.') {
      $scope.data.ReferenceList = G2.$.parseJSON(ReferencePages);
    }
    $scope.isClassic = initializer.vars.isClassic;

    G2.$.each($scope.data.ReferenceList, function (i, reference) {
      reference.ProductName = reference.G2Crowd__G2_Product__r.Name;
    });

    //	UTILITIES
    $scope.$watch('referencePage.banner', function () {
      if ($scope.referencePage.banner && $scope.referencePage.banner._file) {
        var reader = new FileReader();

        reader.onload = function (e) {
          G2.$('#banner_image').attr('src', e.target.result);
        }
        reader.readAsDataURL($scope.referencePage.banner._file);
      }
    })

    $scope.setLoading = function (page) {
      $scope.isLoading = true;
    };

    $scope.addInput = function (arr) {
      arr.push('');
    };

    $scope.removeInput = function (arr, index) {
      if (arr[index] && arr[index].id) {
        arr[index]._destroy = true;
      } else {
        arr.splice(index, 1);
      }
    };

    $scope.getNumber = function (num) {
      return new Array(num);
    }

    $scope.hasReviews = function () {
      return Object.keys($scope.referencePage.selectedReviews).length > 0
    }
    // END UTILITIES

    $scope.updateSelected = function (id) {
      $scope.selected = id;
    }

    $scope.isSelected = function (id) {
      return $scope.referencePage.selectedReviews[id] !== undefined
    }

    $scope.updateSelection = function (id, review) {
      if ($scope.isSelected(id)) {
        delete $scope.referencePage.selectedReviews[id];
      } else {
        $scope.referencePage.selectedReviews[id] = review;
      }
    }
    //END Review List Functions


    // Reference Page Operations
    $scope.update = function () {
      return $scope.referencePage.id !== undefined && $scope.referencePage.id !== '';
    }

    $scope.valueMissing = function (value) {
      return value === undefined || value === '';
    }

    $scope.titleMissing = function (upload) {
      return (!$scope.valueMissing(upload.file) || !$scope.valueMissing(upload.url)) && $scope.valueMissing(upload.label)
    }

    $scope.uploadMissing = function (upload) {
      return !$scope.valueMissing(upload.label) && $scope.valueMissing(upload.file) && $scope.valueMissing(upload.url)
    }

    $scope.paramData = function () {
      var data = new FormData();
      if ($scope.referencePage.type !== undefined && $scope.referencePage.type !== null) {
        data.append('product_reference_page[title]', $scope.referencePage.type.trim());
      }
      if ($scope.referencePage.banner !== undefined && $scope.referencePage.banner !== null) {
        data.append('product_reference_page[banner_image]', $scope.referencePage.banner._file);
      }
      G2.$.each($scope.referencePage.videos, function (all, item) {
        if (item === undefined || item === '') {
          return;
        }
        data.append('product_reference_page[video_urls][]', item);
      });
      G2.$.each($scope.referencePage.uploads, function (i, item) {
        $scope
        if ((item.label === undefined || item.label === '' || item.file === undefined || item.file._file === undefined) && item._destroy === undefined) {
          return;
        }
        var index = item.id || i;
        data.append('product_reference_page[downloads_attributes][' + index + '][label]', item.label.trim());
        if (item.id !== undefined) {
          data.append('product_reference_page[downloads_attributes][' + index + '][id]', item.id);
          if (item._destroy !== undefined) {
            data.append('product_reference_page[downloads_attributes][' + index + '][_destroy]', item._destroy);
          }
        }
        if (item.file !== undefined && item.file._file !== undefined) {
          data.append('product_reference_page[downloads_attributes][' + index + '][file]', item.file._file);
        }
      });
      G2.$.each($scope.referencePage.selectedReviews, function (i, item) {
        data.append('product_reference_page[product_reference_page_survey_responses_attributes][' + i + '][survey_response_id]', item.id);
      });
      data.append('product_id', $scope.Product.UUID);
      data.append('api_token', initializer.vars.APIToken);
      return data;
    }

    $scope.loading = function (type) {
      $scope.isLoading = true;
    }

    $scope.doneLoading = function (type) {
      $scope.isLoading = false;
    }

    $scope.save = function () {
      if ($scope.errors.length > 0) {
        return;
      }
      $scope.isLoading = true;
      var isNew = $scope.referencePage.id === undefined || $scope.referencePage.id === '';
      G2.G2Remoting.referencePage(function (results) {
        $scope.processSave(results.data, isNew);
        $scope.notice = 'Successfully Saved!';
      }, $scope.update(), $scope.paramData(), $scope.Product.UUID, $scope.referencePage.id);
    };

    $scope.processSave = function (results, newReference) {
      $scope.referencePage.id = results.id;
      $scope.referencePage.type = results.attributes['title'];
      $scope.referencePage.videos = results.attributes['video-urls'];
      $scope.referencePage.uploads = results.attributes['downloads'];
      $scope.referencePage.banner_url = results.attributes['banner-image'];
      G2.$.each(results.attributes['survey-responses'], function (i, review) {
        $scope.referencePage.selectedReviews[review.data.id] = review.data;
      });
      if (newReference == true) {
        var index = $scope.ProductList.findIndex(function (review) {
          return review.G2Crowd__G2_Unique_Identifier__c == $scope.Product.UUID
        })
        var pName = $scope.ProductList[index].Name;
        $scope.data.ReferenceList.push({
          ProductName: pName,
          G2Crowd__Title__c: results.attributes['title'],
          G2Crowd__URL__c: results.attributes['url'],
          G2Crowd__G2_ID__c: results.id
        });
      }

      questions = [];
      G2.$.each(results.attributes['survey-responses'], function (i, review) {
        questions = questions.concat(Object.keys(review.data.attributes['comment-answers']));
      });
      $scope.referencePage.Questions = $scope.arrayUnique(questions);
      $scope.isLoading = false;
      $scope.$apply();
    }

    $scope.getReferencePage = function () {
      G2.G2Remoting.getReference(function (results) {
        $scope.Product.UUID = results.data.attributes['product-uuid'];

        $scope.processSave(results.data);
        $scope.$broadcast('productSelected');
        $scope.setSteps(1);
      }, $scope.update(), $scope.Product.UUID, $scope.referencePage.id);
    }
    // END Reference Page Operations

    if ($scope.referencePage.id !== undefined && $scope.referencePage.id !== '') {
      $scope.getReferencePage();
      $scope.isLoading = true;
    }

    $scope.productSelected = function () {
      $scope.$broadcast('productSelected');
    }

    $scope.editReference = function (id) {
      G2.$('.list-page').hide();
      G2.$('.edit-page').show();
      $scope.referencePage = { videos: [], uploads: [], selectedReviews: {} };
      $scope.referencePage.id = id;
      $scope.getReferencePage();
      $scope.isEditing = true;
      $scope.lists = 1;
      $scope.isLoading = true;
    }

    $scope.showList = function () {
      $scope.isEditing = false;
      G2.$('.list-page').show();
      G2.$('.edit-page').hide();
    }

    $scope.startNew = function () {
      $scope.referencePage = { videos: [], uploads: [], selectedReviews: {} };
      $scope.errors = [];
      $scope.selected = 0;
      if ($scope.RawProductList.length > 1) {
        $scope.Product = { UUID: '' };
        $scope.$broadcast('ProductReset');
      } else {
        $scope.$broadcast('singleProduct');
        $scope.$broadcast('productSelected');
      }
      $scope.isEditing = false;
      G2.$('.list-page').hide();
      G2.$('.edit-page').show();
      $scope.setSteps(1);
    }

    $scope.$parent.setProduct = function (Product) {
      $scope.Product = Product;
    }
    $scope.referenceSavable = function () {
      var productSelected = $scope.Product.UUID !== undefined && $scope.Product.UUID !== '';
      var detailsDefined = $scope.referencePage.type !== undefined;
      var minReviewsSelected = Object.keys($scope.referencePage.selectedReviews).length >= 3;
      var noErrors = G2.$('.G2Crowd .errorNotice').length === 0;
      return productSelected && detailsDefined && minReviewsSelected && noErrors;
    }

    $scope.showSelected = function () {
      $scope.onlySelected = true;
      $scope.ReviewData = $scope.referencePage.selectedReviews;
      $scope.Meta = [];
      $scope.Links = [];
    }

    $scope.getStarImg = function (number) {
      return G2.starMap[number];
    }

    $scope.setSteps = function (number) {
      $scope.steps.selected = number;
    }
  });
}

document.addEventListener('readyReferenceBuilder', function () {
  G2.setupReferenceBuilder(G2.ReferenceBuilder)
});

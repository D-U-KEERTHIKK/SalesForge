angular.module('dcApp.services', []).service('remoting', function ($rootScope, $q) {
  this.getDependentOptions = function (objName, ctrlFieldName, depFieldName) {
    // Isolate the Describe info for the relevant fields
    var objDesc = sforce.connection.describeSObject(objName);
    var ctrlFieldDesc, depFieldDesc;
    var found = 0;
    for (var i = 0; i < objDesc.fields.length; i++) {
      var f = objDesc.fields[i];
      if (f.name == ctrlFieldName) {
        ctrlFieldDesc = f;
        found++;
      } else if (f.name == depFieldName) {
        depFieldDesc = f;
        found++;
      }
      if (found == 2) {
        break;
      }
    }

    // Set up return object
    var dependentOptions = {};

    var ctrlValues = ctrlFieldDesc.picklistValues;
    for (var i = 0; i < ctrlValues.length; i++) {
      dependentOptions[ctrlValues[i].value] = {};
    }

    var base64 = new sforce.Base64Binary('');
    function testBit(validFor, pos) {
      var byteToCheck = Math.floor(pos / 8);
      var bit = 7 - (pos % 8);
      return (Math.pow(2, bit) & validFor.charCodeAt(byteToCheck)) >> bit == 1;
    }

    // For each dependent value, check whether it is valid for each controlling value
    var depValues = depFieldDesc.picklistValues;
    for (var i = 0; i < depValues.length; i++) {
      var thisOption = depValues[i];
      var validForDec = base64.decode(thisOption.validFor);
      for (var ctrlValue = 0; ctrlValue < ctrlValues.length; ctrlValue++) {
        if (testBit(validForDec, ctrlValue)) {
          dependentOptions[ctrlValues[ctrlValue].value][thisOption.value] = thisOption;
        }
      }
    }
    return dependentOptions;
  };
  if (window.Visualforce && window.Visualforce.remoting) {
    Visualforce.remoting.timeout = 120000;
  }

  this.emptyService = function (endpoint) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(endpoint, function (result, event) {
      if (event.status) {
        deferred.resolve(result);
      } else if (event.type === 'exception') {
        deferred.reject(event.message);
      }
    });
    return deferred.promise;
  };

  this.emptyServiceEscape = function (endpoint) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      },
      { escape: false }
    );
    return deferred.promise;
  };

  this.singleService = function (endpoint, attr1) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(endpoint, attr1, function (result, event) {
      if (event.status) {
        deferred.resolve(result);
      } else if (event.type === 'exception') {
        deferred.reject(event.message);
      }
    });
    return deferred.promise;
  };

  this.singleServiceBuffer = function (endpoint, attr1) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      },
      { buffer: false }
    );
    return deferred.promise;
  };

  this.singleServiceEscape = function (endpoint, attr1) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      },
      { escape: false, buffer: false }
    );
    return deferred.promise;
  };

  this.doubleService = function (endpoint, attr1, attr2) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(endpoint, attr1, attr2, function (result, event) {
      if (event.status) {
        deferred.resolve(result);
      } else if (event.type === 'exception') {
        deferred.reject(event.message);
      }
    });
    return deferred.promise;
  };

  this.doubleServiceBuffer = function (endpoint, attr1, attr2) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      },
      { buffer: false }
    );
    return deferred.promise;
  };

  this.doubleServiceEscape = function (endpoint, attr1, attr2) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      },
      { escape: false }
    );
    return deferred.promise;
  };

  this.tripleService = function (endpoint, attr1, attr2, attr3) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(endpoint, attr1, attr2, attr3, function (result, event) {
      if (event.status) {
        deferred.resolve(result);
      } else if (event.type === 'exception') {
        deferred.reject(event.message);
      }
    });
    return deferred.promise;
  };

  this.tripleServiceEscape = function (endpoint, attr1, attr2, attr3) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      },
      { escape: false }
    );
    return deferred.promise;
  };

  this.tripleServiceBuffer = function (endpoint, attr1, attr2, attr3) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      },
      { buffer: false }
    );
    return deferred.promise;
  };

  this.quadService = function (endpoint, attr1, attr2, attr3, attr4) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(endpoint, attr1, attr2, attr3, attr4, function (result, event) {
      if (event.status) {
        deferred.resolve(result);
      } else if (event.type === 'exception') {
        deferred.reject(event.message);
      }
    });
    return deferred.promise;
  };

  this.quadServiceEscape = function (endpoint, attr1, attr2, attr3, attr4) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      attr4,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      },
      { escape: false }
    );
    return deferred.promise;
  };

  this.quintService = function (endpoint, attr1, attr2, attr3, attr4, attr5) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(endpoint, attr1, attr2, attr3, attr4, attr5, function (result, event) {
      if (event.status) {
        deferred.resolve(result);
      } else if (event.type === 'exception') {
        deferred.reject(event.message);
      }
    });
    return deferred.promise;
  };

  this.sixService = function (endpoint, attr1, attr2, attr3, attr4, attr5, attr6) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      attr4,
      attr5,
      attr6,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      }
    );
    return deferred.promise;
  };

  this.sixServiceLong = function (endpoint, attr1, attr2, attr3, attr4, attr5, attr6) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      attr4,
      attr5,
      attr6,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      },
      { timeout: 120000 }
    );
    return deferred.promise;
  };

  this.octService = function (endpoint, attr1, attr2, attr3, attr4, attr5, attr6, attr7, attr8) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      attr4,
      attr5,
      attr6,
      attr7,
      attr8,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      }
    );
    return deferred.promise;
  };

  this.nonService = function (endpoint, attr1, attr2, attr3, attr4, attr5, attr6, attr7, attr8, attr9) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      attr4,
      attr5,
      attr6,
      attr7,
      attr8,
      attr9,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      }
    );
    return deferred.promise;
  };

  this.decService = function (endpoint, attr1, attr2, attr3, attr4, attr5, attr6, attr7, attr8, attr9, attr10) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      attr4,
      attr5,
      attr6,
      attr7,
      attr8,
      attr9,
      attr10,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      }
    );
    return deferred.promise;
  };

  this.triDecService = function (
    endpoint,
    attr1,
    attr2,
    attr3,
    attr4,
    attr5,
    attr6,
    attr7,
    attr8,
    attr9,
    attr10,
    attr11,
    attr12,
    attr13
  ) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      attr4,
      attr5,
      attr6,
      attr7,
      attr8,
      attr9,
      attr10,
      attr11,
      attr12,
      attr13,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      }
    );
    return deferred.promise;
  };
  this.quatDecService = function (
    endpoint,
    attr1,
    attr2,
    attr3,
    attr4,
    attr5,
    attr6,
    attr7,
    attr8,
    attr9,
    attr10,
    attr11,
    attr12,
    attr13,
    attr14
  ) {
    var deferred = $q.defer();
    Visualforce.remoting.Manager.invokeAction(
      endpoint,
      attr1,
      attr2,
      attr3,
      attr4,
      attr5,
      attr6,
      attr7,
      attr8,
      attr9,
      attr10,
      attr11,
      attr12,
      attr13,
      attr14,
      function (result, event) {
        if (event.status) {
          deferred.resolve(result);
        } else if (event.type === 'exception') {
          deferred.reject(event.message);
        }
      }
    );
    return deferred.promise;
  };
});

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

function dcEndsWith(input, end) {
  if (empty(input)) {
    return false;
  }

  if (empty(end)) {
    return false;
  }
  return input.indexOf(end, input.length - end.length) !== -1;
}

function clearAllTimers() {
  for (var i = 1; i < 99999; i++) {
    window.clearInterval(i);
    window.clearTimeout(i);
    // window.mozCancelAnimationFrame(i); // Firefox
  }
}

function inputArrayToJson(input) {
  var output = {};
  for (var k in input) { 
    if (empty(input[k])) {
      output[k] = null;
    } else if (Array.isArray(input[k])) {
      output[k] = JSON.stringify(input[k]);
    } else {
      output[k] = input[k];
    }
  }
  return output;
}

function empty(mixed_var) {
  var undef, key, i, len;
  var emptyValues = [undef, null, '', undefined];

  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixed_var === emptyValues[i]) {
      return true;
    }
  }

  if (typeof mixed_var === 'object') {
    for (key in mixed_var) {
      // TODO: should we check for own properties only?
      // if (mixed_var.hasOwnProperty(key)) {
      return false;
      // }
    }
    return true;
  }

  return false;
}

function stringToBoolean(value) {
  var bool = String(value);
  var endValue = false;

  switch (bool.toLowerCase().trim()) {
    case 'true':
    case 'yes':
    case '1':
      endValue = true;
      break;
    default:
      endValue = false;
  }
  return endValue;
}

function showErrorSimple(response) {
  bootbox.alert({
    message: response,
    title: 'Error',
    container: 'div.bootstrap-sf1',
    callback: function () {}
  });

  // $('#myError').modal('show');
  // $('#myError .alert').html(response.message);
}

function getPrefixById(recordId) {
  if (empty(recordId)) {
    return null;
  }

  if (recordId.length == 15 || recordId.length == 18) {
    return recordId.substring(0, 3);
  }

  return null;
}

function showError(response) {
  bootbox.alert({
    message: response.message,
    title: 'Error',
    container: 'div.bootstrap-sf1',
    callback: function () {}
  });

  // $('#myError').modal('show');
  // $('#myError .alert').html(response.message);
}

function isConsole() {
  if (typeof sforce != 'undefined' && sforce.console != null && sforce.console.isInConsole()) {
    return true;
  } else {
    return false;
  }
}

function isSalesforce1() {
  if (typeof sforce != 'undefined' && sforce.one != null) {
    return true;
  } else {
    return false;
  }
}

function dcNav(location, uri, target, tabName, refresh) {
  if (empty(tabName)) {
    if (location.indexOf('dc3Merge') > -1) {
      tabName = 'Deduplicate Merge';
    } else if (location.indexOf('dc3Convert') > -1) {
      tabName = 'Deduplicate Convert';
    } else if (location.match('^[/]([a-zA-Z0-9]{18}|[a-zA-Z0-9]{15})$')) {
      tabName = undefined;
    } else {
      tabName = 'Plauti Deduplicate';
    }
  }
  if (empty(target)) target = 'NEW';
  if (empty(refresh)) refresh = false;

  if (location.indexOf('?') > -1) {
    var locationSplit = location.split('?');
    location = locationSplit[0];
    if (empty(uri)) {
      uri = locationSplit[1];
    } else {
      uri = uri + '&' + locationSplit[1];
    }
  }

  if (!empty(uri)) {
    location = location + '?' + uri;
  }

  console.log('New Location : ' + location);
  console.log('Target       : ' + target);
  console.log('Tab Name     : ' + tabName);

  if (isSalesforce1() && target != 'NEW') {
    console.log('Salesforce1  : true');
    sforce.one.navigateToURL(location, refresh);
  } else if (isConsole()) {
    console.log('Console      : true');
    var recordId;
    if (location.match('^[/]([a-zA-Z0-9]{18}|[a-zA-Z0-9]{15})$')) {
      recordId = location.substring(1);
      if (recordId.length == 18) {
        recordId = recordId.substring(0, recordId.length - 3);
      }
    }

    console.log('New RecordId : ' + recordId);

    if (target == 'NEW') {
      sforce.console.openPrimaryTab(undefined, location, true, tabName, function (b) {
        if (!b.success) {
          sforce.console.getPrimaryTabIds(function (response) {
            var primaryTabIds = response.ids;
            for (var i = 0; i < primaryTabIds.length; i++) {
              var id = primaryTabIds[i];
              sforce.console.getPageInfo(id, function (response) {
                var myVar = JSON.parse(response.pageInfo);
                var objectId = myVar.objectId;
                if (objectId === recordId || myVar.url.indexOf(location) != -1) {
                  sforce.console.refreshPrimaryTabById(id, true);
                }
              });
            }
          });
        }
      });
    } else {
      sforce.console.getEnclosingPrimaryTabId(function (a) {
        if (a.success) {
          sforce.console.openPrimaryTab(a.id, location, true, tabName, function (b) {
            if (!b.success) {
              sforce.console.closeTab(a.id, function (a) {});

              sforce.console.getPrimaryTabIds(function (response) {
                var primaryTabIds = response.ids;
                for (var i = 0; i < primaryTabIds.length; i++) {
                  var id = primaryTabIds[i];
                  sforce.console.getPageInfo(id, function (response) {
                    var myVar = JSON.parse(response.pageInfo);
                    var objectId = myVar.objectId;
                    if (objectId === recordId || myVar.url.indexOf(location) != -1) {
                      sforce.console.refreshPrimaryTabById(id, true);
                      //sforce.console.focusPrimaryTabById(id);
                    }
                  });
                }
              });
            }
          });
        } else {
          sforce.console.openPrimaryTab(null, location, true, tabName, function (b) {
            if (!b.success) {
              sforce.console.getPrimaryTabIds(function (response) {
                var primaryTabIds = response.ids;
                for (var i = 0; i < primaryTabIds.length; i++) {
                  var id = primaryTabIds[i];
                  sforce.console.getPageInfo(id, function (response) {
                    var myVar = JSON.parse(response.pageInfo);
                    var objectId = myVar.objectId;
                    if (objectId === recordId || myVar.url.indexOf(location) != -1) {
                      sforce.console.refreshPrimaryTabById(id, true);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  } else {
    if (location.indexOf('?') > -1) {
      location = location + '&close=1';
    } else {
      location = location + '?close=1';
    }

    if (target == 'NEW') {
      window.open(location, '_blank');
    } else if (target == 'EXIST') {
      window.open(location, '_top');
    } else {
      window.location.href = location;
    }
  }
}

function dcNavigateWithTelemetry(location, uri, eventName, eventProperties) {
  if(window.recordEvt && window.persistEvt) {
    window.recordEvt(eventName, eventProperties);  
    window.persistEvt();
  } 
  dcNav(location, uri, 'NEW');
}

function dcNavigateNew(location, uri, tabName, refresh) {
  dcNav(location, uri, 'NEW', tabName, refresh);
}

function dcNavigateTop(location, uri, tabName, refresh) {
  dcNav(location, uri, 'EXIST', tabName, refresh);
}

function dcNavigate(location, uri, tabName, refresh) {
  dcNav(location, uri, 'SELF', tabName, refresh);
}

function dcNavRecord(recordId, target, tabName, refresh) {
  dcNav('/' + window.encodeURIComponent(recordId), undefined, target, tabName, refresh);
}

function dcNavigateRecord(recordId, tabName) {
  dcNavRecord(recordId, 'SELF', tabName, false);
}

function dcNavigateRecordNew(recordId, tabName) {
  dcNavRecord(recordId, 'NEW', tabName, false);
}

function dcNavigateRecordTop(recordId, tabName) {
  dcNavRecord(recordId, 'EXIST', tabName, false);
}

function utf8_to_b64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
  return decodeURIComponent(escape(window.atob(str)));
}

function dc3Translate(label, alt) {
  //var dc3Translate = function(label, alt) {
  if (dc3Translation == undefined || dc3Translation[label] == undefined) {
    return alt;
  }
  return dc3Translation[label];
}

function dc3TemplateReplace(text, replacement) {
  if (typeof replacement == 'object') {
    Object.keys(replacement).forEach(function (key) {
      text = text.replace('{{' + key + '}}', replacement[key]);
    });
  }
  return text;
}

var fileContents;
var packetSize = 1000;
var namespace;

var fileName;
var numRows;

var fileContentArray;

function initUpload(isListAnalyzer, isTerritoryRouting) {
  // triggered by user selecting a file to upload

  // remove existing listeners
  document.getElementById("upload").parentNode.replaceChild(document.getElementById("upload").cloneNode(true), document.getElementById("upload"));
  
	document.getElementById('upload').addEventListener('change', function(){
		select(isListAnalyzer, isTerritoryRouting);
	});
	j$('#process').hide();
	// if (typeof LeanData == "undefined") namespace = '';
	// else namespace = 'LeanData.';
  namespace = ns.replace('__', '.');
}

function select(isListAnalyzer, isTerritoryRouting) {
	var files = document.getElementById('upload').files;
	fileName = files[0].name;
	var reader = new FileReader();
	for (var i=0; i<files.length; i++) {
		reader.readAsText(files[i]);
		j$('#fileName').text(files[i].name);
		reader.onload = function(e) {
			j$('#process').show();
			fileContents = reader.result;
			if(isListAnalyzer){
				var nextPg = document.getElementById('nextPgBtn');
				nextPg.style.visibility = 'inherit';
				fileContentArray = CSVToArray(fileContents);
				var rowCount = fileContentArray.length - 1;
				numRows = rowCount;
				if(numRows > 75000){
					j$('#tooManyRowsModal').modal('show');
				}
				j$('#leadCount').text(rowCount);
			}
			if(isTerritoryRouting){
				upload(operation);
				j$('#selectCSVModal').modal('hide');
				Magellan.Controllers.GUI.appWaitingScreen.show('Uploading File...');
				showLoadingOverlay();
			}
		}
	}
}

// triggered by user clicking 'Process'
function upload(operation, objectType){
	j$('#process').hide();
	j$('#message').text('Please wait. Uploading in progress...');

  fileContentArray = CSVToArray(fileContents);
	numRows = fileContentArray.length - 1;
	var ids = fileContents.split(/\r\n|\r|\n/g);
	var key = Math.random().toString(36).substring(3,8);
	if (j$("#hasHeader").is(":checked")) ids = ids.slice(1);
	if(operation != "territoryGeo")
		sendPacket(trimIds(ids), 0, operation, key, objectType);
	else {
		sendPacket(ids, 0, operation, key, objectType);
	}
}

// auto-triggered when all ids are successfully sent to backend
function process(operation, key, objectType) {
  Magellan.Controllers.GUI.appWaitingScreen.show('Upload in progress... ' + '('+ numRows + '/' + numRows + ')');
	var params = getParams();
	params.operation = operation;
	params.key = key;
	params.objectType = objectType;
	if(operation == 'territoryGeo'){
		params.fileName = fileName;
		params.confirmTerritorySegmentReplacement = confirmTerritorySegmentReplacement;
	} else {
		params.filename = j$('#fileName').text();
	}
	console.log(params);
	Visualforce.remoting.timeout = 120000;
  showLoadingOverlay();
	Visualforce.remoting.Manager.invokeAction(
		namespace + 'RemotingRouter.processCsv', params,
		function(result,event){
			if(uploadCompletedCallback !== undefined) uploadCompletedCallback(result, event);
			if (event.status) {
        Magellan.Controllers.GUI.appWaitingScreen.hide();
				if(operation == 'territoryGeo'){
					j$('#uploadFileModal').modal('show');
					if(result.startsWith('Errors Occurred')){
						var resultArray = result.split(', ');
						j$('#uploadFileText').text('Errors Occurred');
						var htmlString = '<table class="upload-file-errors"><tbody>'
							+ '<tr><td>Number of rows with PostalCode populated but missing Country: </td><td>' + resultArray[1]
							+ '</td></tr><tr><td>Number of rows with City or State populated but missing Country (or State/Country for US): </td><td>' + resultArray[2]
							+ '</td></tr><tr><td>Number of rows with missing data: </td><td>' + resultArray[3]
							+ '</td></tr><tr><td>Number of rows with invalid/inactive owners or invalid round robin names: </td><td>' + resultArray[4]
							+ '</td></tr><tr><td>Number of rows with duplicate data: </td><td>' + resultArray[5]
							+ (resultArray.length >= 7 ? ('</td></tr><tr><td style="width:500px">Duplicate Row Pairs: </td><td style="max-width:100px">' + resultArray[6]) : ('</td></tr>'))
              + (resultArray.length >= 8 ? ('</td></tr><tr><td style="width:500px">Invalid Owners: </td><td style="width: 500px; overflow-wrap: anywhere">' + resultArray[7]) : ('</td></tr>'))
              + (resultArray.length >= 9 ? ('</td></tr><tr><td>Number of Rows with Pools in other BU: </td><td>' + resultArray[8]) : ('</td></tr>'))
              + (resultArray.length == 10 ? ('</td></tr><tr><td style="width:500px">Pools not in Territory Business Unit: </td><td>' + resultArray[9]) : ('</td></tr>'))
							+ '</td></tr></tbody></table>';
						j$('#uploadFileMessage').html(htmlString);
            j$('#uploadFileModal').modal('show');

					} else {
						j$('#uploadFileText').text('Upload CSV Status');
						j$('#uploadFileMessage').text(result);
						if(result == 'Draft Territories successfully created.'){
							var draftSegmentName = params.segment + ' - Draft';
						} else if(result.includes('Invalid Column Header')){
							j$('#uploadFileText').text('CSV Upload Failed');
							j$('#uploadFileMessage').html('Your file failed to upload. Please ensure that it is in .CSV format and that it contains the required columns.');
						}
					}
					hideLoadingOverlay();
				} else {
					j$('#message').text(result);
				}
			} else {
				if (event.message=='Apex CPU time limit exceeded') {
					j$('#message').text('Apex CPU time limit exceeded! Your CSV file is too large. Please try to reduce the number of ids in your file.');
				} else {
					j$('#message').text(event.message + '! Please report this error to LeanData support.');
					j$('#uploadFileMessage').text(event.message + '! Please report this error to LeanData support.');
				}
				Visualforce.remoting.Manager.invokeAction(namespace + 'RemotingRouter.cleanPackets', operation + '_' + key, function(result, event) {});  
			}
			hideLoadingOverlay();
		},
    {escape:false});
}

// recursively send chunks of ids to receivePacket
function sendPacket(ids, count, operation, key, objectType) {
	var chunk; // chunk contains packetSize ids or less
	if (ids.length>=packetSize) {
		chunk = ids.slice(0, packetSize);
		ids = ids.slice(packetSize)
	} else {
		chunk = ids;
		ids = [];
	}
	// breaks 1000 ids into LTS of 100 ids each
	var nLTS = Math.ceil(chunk.length / 100);
	var LTSs = [];
	for (var i=0; i<nLTS; i++) {
		var LTS = chunk.slice(0, 100);
		chunk = chunk.slice(100);
		LTSs.push(LTS);
	}

	var packet = {
		key: operation + '_' + key + '_PACKET_' + count,
		ids: JSON.stringify(LTSs),
	};
	Visualforce.remoting.timeout = 120000;
	var validateIds = true;
	if(operation === "territoryGeo")
		validateIds = false;
	Visualforce.remoting.Manager.invokeAction(
		namespace + 'RemotingRouter.receivePacket', packet, validateIds,
		function(result, event) {
			if (result=='PACKET RECEIVED') {
        Magellan.Controllers.GUI.appWaitingScreen.hide();
        Magellan.Controllers.GUI.appWaitingScreen.show('Upload in progress... ' + '('+ count*1000 + '/' + numRows + ')');

				if (ids.length==0) process(operation, key, objectType); // last packet to process
				else sendPacket(ids, count+1, operation, key, objectType);
			}
			else {
        _LeanData.Notification.showConfirmationDialog({
          header: 'Error',
          message: event.message,
          confirmButtonText: 'OK',
          showRejectButton: false,
        });
				j$('#message').text(result);
				Visualforce.remoting.Manager.invokeAction(namespace + 'RemotingRouter.cleanPackets',operation + '_' + key, function(result, event) {});  
				return;
			}
		} 
	);
}

function trimIds(ids) {
	var trimmedIds = [];
	for (var i=0; i<ids.length; i++) {
		var id = ids[i].trim().replace(/['"]+/g, '');
		if (id.length>0) trimmedIds.push(id);
	}
	return trimmedIds;
}

//All methods below used for list analyzer
function uploadProcessLead(operation, pairList, sendNotification, headerArr, objectType){
	j$('#process').hide();
	j$('#message').text('Please wait. Uploading in progress...');
	var rows = fileContentArray.slice(1);
	var key = Math.random().toString(36).substring(3,8);
	sendProcessLeadPacket(rows, 0, operation, key, pairList, sendNotification, headerArr, objectType);
}

// recursively send chunks of ids to receiveListAnalyzerPacket
function sendProcessLeadPacket(rows, count, operation, key, pairList, sendNotification, headerArr, objectType) {
	var chunk; // chunk contains packetSize rows or less
	if (rows.length>=packetSize) {
		chunk = rows.slice(0, packetSize);
		rows = rows.slice(packetSize)
	} else {
		chunk = rows;
		rows = [];
	}

	for(var i=0; i<chunk.length; i++){
		var strChunk = chunk[i].join();
		chunk[i] = strChunk;
	}

	// breaks 5000 ids into LTS of 100 ids each
	var nLTS = Math.ceil(chunk.length / 100);
	var LTSs = [];
	for (var i=0; i<nLTS; i++) {
		var LTS = chunk.slice(0, 100);
		chunk = chunk.slice(100);
		LTSs.push(LTS);
	}

	var packet = {
		key: operation + '_' + key + '_PACKET_' + count,
		ids: JSON.stringify(LTSs),
	};
	Visualforce.remoting.timeout = 120000;
	console.log(packet);
	Visualforce.remoting.Manager.invokeAction(
		namespace + 'RemotingRouter.receivePacket', packet, false,
		function(result, event) {
			if (result=='PACKET RECEIVED') {
				if (rows.length==0) {
					j$('.loadingOverlay').parent().css('display', 'none');
					processUploadLead(operation, key, pairList, sendNotification, headerArr, objectType); // last packet to process
				}
				else sendProcessLeadPacket(rows, count+1, operation, key, pairList, sendNotification, headerArr, objectType);
			}
			else {
				j$('#message').text(result);
				Visualforce.remoting.Manager.invokeAction(namespace + 'RemotingRouter.cleanPackets',operation + '_' + key, function(result, event) {});  
				return;
			}
		} 
	);
}

// auto-triggered when all rows are successfully sent to backend
function processUploadLead(operation, key, pairList, sendNotification, headerArr, objectType) {
	var params = getParams();
	params.operation = operation;
	params.key = key;
	params.objectType = objectType;
	params.pairList = pairList;
	params.fileName = fileName;
	params.numRows = numRows;
	Visualforce.remoting.timeout = 120000;
	Visualforce.remoting.Manager.invokeAction(
		namespace + 'RemotingRouter.processCsvMultiCols', params, sendNotification, headerArr,
		function(result,event){
			if (event.status) {
				j$('#message').text(result);
			} else {
				if (event.message=='Apex CPU time limit exceeded') {
					j$('#message').text('Apex CPU time limit exceeded! Your CSV file is too large. Please try to reduce the number of ids in your file.');
				} else {
					j$('#message').text(event.message + '! Please report this error to LeanData support.');
				}
				Visualforce.remoting.Manager.invokeAction(namespace + 'RemotingRouter.cleanPackets', operation + '_' + key, function(result, event) {});  
			}
		}
	);
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function splitRowToColumns(contents){
	var deferred = j$.Deferred();
	Visualforce.remoting.timeout = 120000;
	Visualforce.remoting.Manager.invokeAction(
		namespace + 'ListAnalyzerController.splitRowToColumns', contents,
		function(result,event){
			if (event.status) {
				deferred.resolve(result);	
			}
		},
		{escape: false}
	);
	return deferred;
}

function uploadPotentialLeads(operation, objectType){
	j$('#process').hide();
	j$('#message').text('Please wait. Uploading in progress...');

	var fileContentRows = fileContentArray;
	numRows = fileContentRows.length;

	var headers;
	var promiseArr;
	headers = fileContentRows[0];
	var content = fileContentRows.slice(1);
    var contents = headers.toString();
	var headerArrPromise = splitRowToColumns(contents);
	return [headerArrPromise, content];
}


// This will parse a delimited string into an array of arrays.
// Method taken from https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
// Edited arrMatches[2] because we have a row to column handler later that takes care of double quotes.
function CSVToArray( strData ){
    strDelimiter = ",";
    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );
    // Create an array to hold our data. Give the array a default empty first row.
    var arrData = [[]];
    // Create an array to hold our individual pattern matching groups.
    var arrMatches = null;
    // Keep looping over the regular expression matches until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){
        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];
        // Check to see if the given delimiter has a length (is not the start of string) and if it matches
        // field delimiter. If it does not, then we know that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            (strMatchedDelimiter != strDelimiter)
            ){
            // Since we have reached a new row of data, add an empty row to our data array.
            arrData.push( [] );
        }
        if (arrMatches[ 2 ]){
            // We found a quoted value. When we capture this value, make sure to put double quotes before and after to be handled later.
            var strMatchedValue = '"' + arrMatches[ 2 ] + '"';
        } else {
            // We found a non-quoted value.
            var strMatchedValue = arrMatches[ 3 ];
        }
        // Now that we have our value string, let's add it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }
    // Return the parsed data.
    return( arrData );
}

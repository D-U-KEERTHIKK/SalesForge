    //variable for page
    var objId;
    var pageType;
    var leadStatusApiNameToLabel;
    var opportunityCountMap;
    var customConvertLink;
    var isStatusEditable;
    var hasEditableStatusField;
    var customConvertParameters;
    var currentObj;
    var parentObj;

    //variable for section
    var recList;
    var colList;
    var recType;
    var colTypesMap;
    var viewObj;

    var specialRecordTypeLinkValues = {
        //"Owner.Name" : "OwnerId",
        "Name" : "Id",
    }

    /*******************initialize page & section ********************/

    function initializePage (viewObject) {
      leadStatusApiNameToLabel = viewObject['leadStatusApiNameToLabel'];
      opportunityCountMap = viewObject['opportunityCountMap'];
      customConvertLink = viewObject['customConvertLink'];
      isStatusEditable = !viewObject['isLeadStatusEditingDisabled'];
      customConvertParameters = viewObject['customConvertParameters'];
      pageObj = viewObject['pageObject'];

      var dateFields = viewObject["dateFields"] || [];
      for (var i = 0; i < dateFields.length; i++)
        specialFormattingNeeded[dateFields[i]] = formatDateTime;  

      var currencyFields = viewObject["currencyFields"] || [];
      for (var i = 0; i < currencyFields.length; i++)
        specialFormattingNeeded[currencyFields[i]] = formatCurrency;              
    }
    
    function initializeSection (recordType, cols, colTypesMaps, recs, viewObject) {
      recType = recordType;
      colList = cols;
      colTypesMap = colTypesMaps;
      recList = recs;
      viewObj = viewObject;
    }



    
   /*****************special format fields*********************/

    Number.prototype.format = function(n, x) {          
        var re = '(\\d)(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';          
        return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$1,');          
    };          
            
    var formatCurrency = function (currency) {          
        if (!currency) return "";           
        var currencyString = '$' + currency.format(0);          
        return currencyString;          
    }      

    var formatEmailLink = function (email) {
        if (!email) return "";
        var emailString = '<a href="mailto:' + email + '">' + email + '</a>';
        return emailString;
    }

    var formatWebsiteLink = function (site) {
        if (!site) return "";
        var url;
        if (String(site).indexOf('http://') == -1)
          url = 'http://' + site;
        else
          url = site;
        var emailString = '<a target="_blank" class="customTarget" href=" ' + url + '">' + site + '</a>';
        return emailString;
    }

    var generateStatusDropdown = function (status, rec) {
        var statusSelect = `<select class="inline_editable ${rec['Id']}">`;
        //Loop through lead statuses. MasterLabel as the label and ApiName as the value
        for (var key in leadStatusApiNameToLabel) {
            const selectedStr = (status === key ? ' selected' : '');
            const APILabel = leadStatusApiNameToLabel[key];
            const current = `<option${selectedStr} value="${key}">${APILabel}</option>`;
            statusSelect += current;
        }
        statusSelect += `</select>`;
        return statusSelect;
    }

    var getOpportunityCount = function ( colVal, rec) {
        if( !opportunityCountMap ) return "";
        if( !opportunityCountMap[rec["Id"]] ) return 0;
        return opportunityCountMap[rec["Id"]];
    }

    var formatOwnerLink = function (owner, rec) {
        if (rec["Owner"] && rec["Owner"]["Name"]) {
            return '<a href="/' + rec["OwnerId"] + '" class="customTarget">' + rec["Owner"]["Name"] + '</a>';
        } else {
            return '<a href="/' + rec["OwnerId"] + '" class="customTarget" style="font-style: italic;">Insufficient Privileges</a>';
        }
    }

    var formatAccountLink = function(account, rec){
      if(rec["AccountId"])
        return '<a  href="/' + rec["AccountId"] + '" class="customTarget">' + rec["Account"]["Name"] + '</a>';
    }
    
    var convertAction = function (colVal, rec) {
        var convertActionString;

        var convertLink = customConvertLink;
        if(pageType == 'Lead' && recType == 'Account') {
          if(convertLink == undefined) {
            convertLink = "/lead/leadconvert.jsp?id=" + objId.substring(0,15)  + "&amp;accid=" + rec["Id"].substring(0,15) + "&amp;nooppti=1";
          }
          else {
            convertLink = convertLink.replace("[AccountID]", rec["Id"].substring(0,15));
            convertLink = convertLink.replace("[LeadID]", objId.substring(0,15));
          }

          convertLink += customConvertParametersString( pageObj );

          convertActionString = '<a target="_blank" data-leadid="' + objId.substring(0,15) + '" data-accountid="' + rec["Id"].substring(0,15) + '" class="customTarget action_link convert_link" href="' + convertLink +'">Convert</a>';
        }
        else if(pageType == 'Account' && recType == 'Lead') {
          if(convertLink == undefined) {
            convertLink = "/lead/leadconvert.jsp?id=" + rec["Id"].substring(0,15)  + "&amp;accid=" + objId.substring(0,15) + "&amp;nooppti=1";


          }
          else {
            convertLink = convertLink.replace("[AccountID]", objId.substring(0,15));
            convertLink = convertLink.replace("[LeadID]", rec["Id"].substring(0,15));
          }

          convertLink += customConvertParametersString( currentObj );

          // If header contains checkbox, then the all rows in this column should contain checkbox too
          // Checkbox existence check is rather loose here
          // Almost any string can be HTML string - could improve with some regex, but would be complicated but still loose
          if (colTypesMap["Actions"].indexOf("input") >= 0 && colTypesMap["Actions"].indexOf("checkbox") >= 0) {
            convertActionString = checkBox(true, rec) + '<a target="_blank" data-leadid="' + rec["Id"].substring(0,15) + '" data-accountid="' + objId.substring(0,15) + '" class="customTarget action_link convert_link" href="' + convertLink + '">Convert</a>';
          } else {
            convertActionString = '<a target="_blank" data-leadid="' + rec["Id"].substring(0,15) + '" data-accountid="' + objId.substring(0,15) + '" class="customTarget action_link convert_link" href="' + convertLink + '">Convert</a>';
          }
        }

        return convertActionString;
    }

    var customConvertParametersString = function( rec ){
      var paramString ='';
      //Add Custom Parameters
      if( customConvertParameters ){
        for (var key in customConvertParameters) {
          if (customConvertParameters.hasOwnProperty(key)) {
            var lookups = customConvertParameters[key].split(".");
            var colValue = rec;
            for (var i = 0; i < lookups.length; i++) {
                colValue = colValue[lookups[i]];
                if(!colValue) break;
            }

            paramString += '&' + key + '=' + colValue;
          }
        }
      }

      return paramString;
    }

    var mergeAction = function (colVal, rec) {
        var mergeLinkString = ('<a target="_blank" class="customTarget action_link merge_link" onclick="ga_event("Lead View Merge");" data-currentid="' + rec["Id"]);
        mergeLinkString += ('" data-otherid="'+ objId + '" href="/lead/leadmergewizard.jsp?goNext=+Next&cid=');
        mergeLinkString += (objId +'&cid=' + rec["Id"] + '">Merge</a>');
        return mergeLinkString;

    }

    var checkBox = function (checked, rec) {
        var checkBox = '<input class="leandata-checkbox" type="checkbox" data-id="' + rec.Id + '" checked=' + checked + '/>';
        return checkBox;
    }

    var actionColumn = function (colVal, rec) {
        if (pageType == recType)
          return mergeAction(colVal, rec);
        else if ((pageType == 'Lead' && recType == 'Account') || (pageType == 'Account' && recType == 'Lead'))
           return convertAction(colVal,rec);
        else if (pageType == 'reassignAccount')
            return checkBox(true,rec);
    }

    function formatType (colValue) {
        if(recType == 'Account')
            return colValue;
        return recType;
    }

    function formatRecordType (recordType, rec) {
        if(rec["RecordTypeId"])
          return rec["RecordType"]["Name"];
    }

    var specialFormattingNeeded = {               
        "Status" : generateStatusDropdown,
        "Actions" : actionColumn, 
        "Email" : formatEmailLink,
        "Website" : formatWebsiteLink,
        "OwnerId" : formatOwnerLink,
        "NumberOfOpportunities" :  getOpportunityCount,
        "AccountId" : formatAccountLink,
        "Type" : formatType,
        "RecordTypeId" : formatRecordType,
    }
    
/******************generate table **************************/

    function generateHeader(){ 
        var headerRow = '<tr class="headerRow">';
        var touchedCols = {};
        hasEditableStatusField = false;
        for (var i = 0; i < colList.length; i++) {
            var fieldName = colList[i];
            var colName = colTypesMap[fieldName];
            if (touchedCols[colName]) continue;
            touchedCols[colName] = true;
            if(colName == 'Status' && isStatusEditable)
              hasEditableStatusField = true;
            if(colName == 'Status' || colName.indexOf('Address')>-1)
              headerRow += '<th class="headerRow" style="width:200px;border-right:1px solid #fff;border-bottom:1px solid #fff;">';  
            else if(colName == 'Name')
              headerRow += '<th class="headerRow" style="width:175px;border-right:1px solid #fff;border-bottom:1px solid #fff;">';  
            else if(colName.length>25)
              headerRow += '<th class="headerRow" style="width:220px;border-right:1px solid #fff;border-bottom:1px solid #fff;">';
            else if (colName.length>20)
              headerRow += '<th class="headerRow" style="width:200px;border-right:1px solid #fff;border-bottom:1px solid #fff;">';
            else if(colName.length>15)
              headerRow += '<th class="headerRow" style="width:180px;border-right:1px solid #fff;border-bottom:1px solid #fff;">';
            else if(colName.length>10)
              headerRow +='<th class="headerRow" style="width:120px;border-right:1px solid #fff;border-bottom:1px solid #fff;">';
            else 
               headerRow += '<th class="headerRow" style="width:90px;border-right:1px solid #fff;border-bottom:1px solid #fff;">';
            headerRow += '<div style="text-overflow:ellipsis;overflow-x:hidden;">' + colName + '</div>';
            headerRow += '</th>';
        }
        return headerRow + '</tr>';
    }

    function generateSObjectRows(){ 
        var SObjectRows = [];
        for (var i = 0; i < recList.length; i++) {
            var obj = recList[i];
            //move tagged account to top of list
            if (recType == 'Account' && viewObj.taggedAccount && (obj.Id == viewObj.taggedAccount.Id)) {
              SObjectRows.unshift(generateSingleSObjectRow(obj));
              continue;
            }
            SObjectRows.push(generateSingleSObjectRow(obj));
        }
        return SObjectRows;
    }
    function generateSingleSObjectRow(obj){ 
        currentObj = obj;
        var pixel = hasEditableStatusField ? 1.5 : 3.5;
        var row = '<tr class="dataRow" onmouseover="if (window.hiOn){hiOn(this);}" onmouseout="if (window.hiOff){hiOff(this);}" onblur="if (window.hiOff){hiOff(this);}" onfocus="if (window.hiOn){hiOn(this);}">';
        for (var i = 0; i < colList.length; i++) {
            var colName = colList[i];
            //highlighting tagged account
            var taggedIconStyle = '';
            var taggedIcon = '';
            if (recType == 'Account' && colName == 'Name' && viewObj.taggedAccount && (obj.Id == viewObj.taggedAccount.Id)) {
              var ldTaggedTooltip = 
                'LeanData selected this Account as the optimal match for this Lead, ' + 
                'based on the fuzzy matching algorithm and your organization’s configured filters and tiebreakers.';
              var userTaggedTooltip = 
                'A user in your organization manually selected this Account as the optimal match for this Lead.';
              taggedIconStyle = 'display:flex;align-items:center;';
              taggedIcon = 
                '<span class="' + 
                ((viewObj.isManuallyTagged) ? 'user-tagged-account-icon' : 'ld-tagged-account-icon') + 
                '" title="' + 
                ((viewObj.isManuallyTagged) ? userTaggedTooltip : ldTaggedTooltip) +
                '" style="margin-right:5px;"></span>';
            }
            row += '<td class="dataCell" style="white-space:nowrap;padding:' + pixel + 'px;' + 
              taggedIconStyle + '">' + taggedIcon +
              '<div style="overflow:hidden;text-overflow: ellipsis;">';
            var colValue = getColumnValueFromRecord(obj, colName);
            row += (colValue == undefined ? "" : colValue);
            row += '</div></td>';
        }
        return row + '</tr>';
    }
    function getColumnValueFromRecord(rec, col) {
        var lookups = col.split(".");
        var colValue = rec;
        for (var i = 0; i < lookups.length; i++) {
            var current = lookups[i];
            if (!colValue && current != 'Address') break;
            colValue = colValue[current];
        }
        
        if (specialRecordTypeLinkValues[col]) {
            colValue = '<a target="_blank" class="customTarget" href="/' + rec[specialRecordTypeLinkValues[col]] + '">' + colValue + '</a>';
            return colValue;
        }

        if (specialFormattingNeeded[col]) {
            //check if lead status editing allowed,not disabled and has permission
            if(col!='Status' || isStatusEditable)
              colValue = specialFormattingNeeded[col](colValue, rec);
            return colValue;
        }
        return htmlDecode(colValue);      
    }

    function htmlDecode(input){
        var e = document.createElement('div');              
        e.innerHTML = (input==undefined?"":input);
        return e.childNodes.length === 0 ? "" : sanitizeHtml(e.childNodes[0].nodeValue);
    }
    
    function changeSingleLead (leadId, newStatus) {
      OnDemandView.updateLeadStatus(leadId, newStatus,function (result, event) {});
    }

    function changeLead () {
       var selectedLists = j$('.inline_editable').get();
        [].forEach.call(selectedLists, function(selectList){
          var toJ = j$(selectList);
          toJ.change(function(event){
              //event.preventDefault();
              var touchedSelectList = event.target;
              var leadId = touchedSelectList.className.split(" ")[1];
              var newStatus = touchedSelectList.options[touchedSelectList.selectedIndex].value;
              changeSingleLead(leadId, newStatus);
          })
        })
        
    }

    function jDecode(str) {
        return j$("<div/>").html(str).text();

    }

    function calculateHeights(totalHeight, type, info){
        var heights = {};
        var numDupes;
        var numAccountMatched;
        var numLeadMatched;
        var dupeHeightLead;
        var matchedHeight;
        var a2bHeight;
        var dupeHeightContact;
        var accountDupeHeight;
        var accountMatchedHeight;

        var totalSections = 0;
        var totalNoResultSections = 0;
        var minRow = 1;
        var sectionHeight = 0;
        
        var isDuplicatesOnLeadViewOn = info["isDuplicatesOnLeadViewOn"];
        var isMatchedAccountsViewOn = info["isMatchedAccountsViewOn"];
        var isRelatedLeadViewOn = info["isRelatedLeadViewOn"];
        var isDuplicatesOnContactViewOn= info["isDuplicatesOnContactViewOn"];
        var isDuplicatesViewOn = info["isDuplicatesViewOn"];
        var isMatchedLeadsViewOn = info["isMatchedLeadsViewOn"];

        if(type == "Lead"){
            numDupes = info["leadMatches"] + info["contactMatches"];
            numAccountMatched = info["accountMatches"];
            numLeadMatched = info["relatedLeadMatches"];
          
            if(isDuplicatesOnLeadViewOn){
              totalSections += 1;
              if( numDupes == 0 ) totalNoResultSections++;
            }
            if(isMatchedAccountsViewOn){
              totalSections += 1;                     
              if( numAccountMatched == 0 ) totalNoResultSections++;
            } 
            if(isRelatedLeadViewOn){
              totalSections += 1;              
              if( numLeadMatched == 0 ) totalNoResultSections++;
            }
        } else if(type == 'Account'){
            numAccountMatched = info["accountMatches"];
            numLeadMatched = info["leadMatches"];
              
            if(isDuplicatesViewOn) {
              totalSections += 1;
              if( numAccountMatched == 0 ) totalNoResultSections++;             
            }
            if(isMatchedLeadsViewOn){
              totalSections += 1;
              if( numLeadMatched == 0 ) totalNoResultSections++;
            }
        } else{
            numDupes = info["leadMatches"] + info["contactMatches"];
            if(isDuplicatesOnContactViewOn){
              totalSections += 1;
              if( numDupes == 0 ) totalNoResultSections++;
            }
        }
        if (totalSections - totalNoResultSections === 0) {
          if (type == "Lead") {
            sectionHeight = 460;
          } else {
            sectionHeight = 350;
          }
        } else {
          var availableHeight = (totalHeight - totalNoResultSections*140);
          sectionHeight = availableHeight / (totalSections - totalNoResultSections)
        }
        
        //hide section when is unselected by dashboard
        if(!isDuplicatesOnLeadViewOn){
          dupeHeightLead = 0;
        }  
        if(!isMatchedAccountsViewOn){
          matchedHeight = 0;
        }
        if(!isRelatedLeadViewOn){
          a2bHeight = 0;
        }
        if(!isDuplicatesOnContactViewOn){
          dupeHeightContact = 0;
        }
        if (!isDuplicatesViewOn){
          accountDupeHeight = 0;
        } 
        if (!isMatchedLeadsViewOn) {
          accountMatchedHeight = 0;
        }
        
        
        if(type == "Lead"){
            if(isDuplicatesOnLeadViewOn){
                if( numDupes == 0 )
                    dupeHeightLead = 135;
                else
                    dupeHeightLead = sectionHeight;
            }
            if(isMatchedAccountsViewOn){
                if( numAccountMatched == 0 )
                    matchedHeight = 135;
                else
                    matchedHeight = sectionHeight;
            }
            if(isRelatedLeadViewOn){
                if( numLeadMatched == 0 )
                    a2bHeight = 135;
                else
                    a2bHeight = sectionHeight;
            }
            
            heights['dupeHeightLead'] = dupeHeightLead;
            heights['matchedHeight'] = matchedHeight;
            heights['a2bHeight'] = a2bHeight;
        }    
        else if(type == "Account"){
            if( isDuplicatesViewOn ){
                if( numAccountMatched == 0 )
                    accountDupeHeight = 135;
                else
                    accountDupeHeight = sectionHeight;
            }
            if( isMatchedLeadsViewOn ){
                if( numLeadMatched == 0 )
                    accountMatchedHeight = 135;
                else
                    accountMatchedHeight = sectionHeight;
            }
            heights['accountDupeHeight'] = accountDupeHeight;
            heights['accountMatchedHeight'] = accountMatchedHeight;
        } 
        else if(type == "Contact"){
            if(isDuplicatesOnContactViewOn){
                if( numDupes == 0 )
                    heights['dupeHeightContact'] = 135;
                else
                    heights['dupeHeightContact'] = sectionHeight;
            }
        }
        else{
            heights['sectionHeight'] = sectionHeight;
        }
      return heights;
    }

    function initializeDataTable(tableSelector, tableIdentifier, options){
        if( options === undefined )
            options = {};
      // tableSelector is a jquery selector for the table we want to initialize.  This is a selector, but we only want this to 
      //     a single table, because there is logic specific to the columns
      // tableIdentifier: a string that defines the table "type".  this is used to generate the css class and local storage key
      // options: optional array with "pagination" (true/false) and "pageLength" (integer) options

      var columns = tableSelector.find('th').map(function() { return j$(this).text(); }).get();
      var sortOrderKey = 'order:'+tableIdentifier;
      var sortOrderData = JSON.parse(window.localStorage.getItem(sortOrderKey));
      var sortOrder = [[0, "asc"]]; // by default, sort first column ascending
      if(sortOrderData != null) {
        var sortColumn = sortOrderData['column'];
        sortColumnIndex = columns.indexOf(sortColumn);
        if(sortColumnIndex != -1)
          sortOrder = [[sortColumnIndex, sortOrderData['order']]];
      } else {
        // no sorting localstorage.  check old version
        var oldSortOrder = window.localStorage.getItem(tableIdentifier + 'Order');
        if(oldSortOrder != null) {
          var sortColumn = window.localStorage.getItem(tableIdentifier + 'Col');
          sortColumnIndex = columns.indexOf(sortColumn);
          if(sortColumnIndex != -1)
            sortOrder = [[sortColumnIndex, oldSortOrder[0][1]]];
          window.localStorage.removeItem(tableIdentifier + 'Order');
          window.localStorage.removeItem(tableIdentifier + 'Col');
        }
      }
      //write column width into local storage in colResize.resource line 881
      var colWidthKey = 'width:' + tableIdentifier;
      var colWidthData = JSON.parse(window.localStorage.getItem(colWidthKey));
      var columnDefs = [];
      if(colWidthData!=null){
            for(var key in colWidthData){
                if(columns.indexOf(key)>-1){
                    columnDefs.push({"width" : colWidthData[key], "targets" : columns.indexOf(key)});
                } 
            }
      }

      var columnOrderings = new Array();
      for(var i=0;i<columns.length;i++){
        columnOrderings.push(null);
      }
      firstRow = tableSelector.find('tbody tr').first();
      if(firstRow) {
        firstRow.find("td").each(function(index, element) {
            if(j$(element).find("select").length > 0) 
                columnOrderings[index] = { "orderDataType": "dom-select" }
            else if(j$(element).find(":checkbox").length > 0)
                columnOrderings[index] = { "orderDataType": "dom-checkbox" }
        });
      }

      j$.fn.dataTable.ext.order['dom-select'] = function  ( settings, col ) {
        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
            return j$('select', td).val();
        } );
      }

      j$.fn.dataTable.ext.order['dom-checkbox'] = function  ( settings, col )
      {
        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
          return j$('input', td).prop('checked') ? '1' : '0';
        } );
      }

      //because when loading datatable is loaded in a component this will fail until the page hard refreshes
      //j$.fn.dataTable.moment is not a function
      try{ 
        j$.fn.dataTable.moment( 'MM/DD/YYYY' );  
      } catch(err){
        console.log(err);
      }
      

      // paginate and show "Showing M of N entries" if we have more than 10 entries (by default)
      // pagination is on by default
      var pageLength = options["pageLength"] || 10;
      var bFilter = options["bFilter"] || false;
      var emptyTableText = options["emptyTableText"] || "No Data Available";
      var doPagination = (options["pagination"] != false) && (tableSelector.find('tbody tr').length > pageLength);
      var paginatedTable = tableSelector.dataTable({
        "bFilter" : bFilter,
        "pageLength" : pageLength,
        "bPaginate" : doPagination,
        "bInfo" : doPagination,
        "lengthChange": false,
        "order" : sortOrder,
        "columns" : columnOrderings,
        "stateSave": true,
        "columnDefs": columnDefs,
        "dom": "Zlfrtip", // 'lfrtip' is default Datatables initialization.  'Z' initializes ColResize
        "language": {
          "emptyTable": emptyTableText,
        },
        "colResize": {
           "handleWidth": 10, 
           "tableWidthFixed": false,
           resizeCallback: function(column) {
             var key = 'width:' +  tableIdentifier;
             var sortOrderData = JSON.parse(window.localStorage.getItem(key));
             if(sortOrderData==null)
               sortOrderData = {};
             sortOrderData[jDecode(column.sTitle)] = column.width;
             window.localStorage.setItem(key,JSON.stringify(sortOrderData));
          }
        },
        "stateSaveCallback": function(settings, data) {
            if(data.order.length>0) {
              var colName = columns[data.order[0][0]];
              window.localStorage.setItem(sortOrderKey, JSON.stringify({ 'column' : colName, 'order' : data.order[0][1]}));
            }
        }
      });

      return paginatedTable;
    }
            
    function getColumnIndex(cols, colName){
         for(var i =0;i<cols.length;i++){
             if(cols[i] == colName)
                return i;
         }
         return -1;
    }

        function getParameterByName(name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }

    var formatDateTime = function (timeInteger) {
      if (!timeInteger) return '';
      var dateObject = new Date(timeInteger);

      let date = formatDate(timeInteger);
      return date;

      // As far as this method is used, we are only displaying the Date in the page layout tables
      // If time is needed, use the code below as well

      // let time = formatTime(dateObject.getHours(),dateObject.getMinutes(),dateObject.getSeconds());
      // return `${date} ${time}`;
    }
    
    function formatDate(dateVal) {
      var dateObject = new Date( dateVal );
      if (dateObject == 'Invalid Date') return '';

      return `${dateObject.getFullYear()}-${pad2(dateObject.getMonth()+1)}-${pad2(dateObject.getDate())}`;
    }

    function formatUTCDate(dateVal) {
      const dateObject = new Date( dateVal );
      if (dateObject === 'Invalid Date') return '';
      return `${dateObject.getUTCFullYear()}-${pad2(dateObject.getUTCMonth()+1)}-${pad2(dateObject.getUTCDate())}`
    }

    var formatTime = function(hours, minutes, seconds) {
      var isPM = hours > 12;
      return `${isPM ? hours - 12 : hours}:${minutes}:${seconds} ${isPM ? 'PM' : 'AM'}`;
    }
    
        function formatURL(urlVal) {
            if (!urlVal) return "";
            var url;
            if ((String(urlVal).indexOf('http://') == -1) && (String(urlVal).indexOf('https://') == -1)) {
                url = 'http://' + urlVal;
            } else {
                url = urlVal;
            }
            var emailString = '<a target="_blank" class="customTarget" href=" ' + url + '">' + urlVal + '</a>';
            return emailString;
        }
    
        function pad2(number) {     
            return (number < 10 ? '0' : '') + number      
        }
    
        function getHTMLForValue(value, columnMap) {
            // columnMap should be a map with 'name', 'label', and 'type'
            if(value == null) return null;
            // follow any lookup relationships, stopping before we get to the
            // actual field we want
            var lookups = columnMap["name"].split(".");
            var colValue = value;
            for (var i = 0; i < lookups.length-1; i++) {
                colValue = colValue[lookups[i]];
                if(!colValue) return null;
            }
            var field = lookups[lookups.length-1];
            
            var ref;
            if(field.endsWith("Id")) {
                ref = field.substr(0, field.length-2);
            } else if(field.endsWith("__c")) {
                ref = field.replace(/__c$/,'__r');
            }
            
            if(columnMap["type"] == "REFERENCE") {
                // if it's a reference, we want to generate a link to the record, labeled with Name of the record
                if((ref != null) && (colValue[ref] != null) && (colValue[ref]["Name"] != null)) {
                  return '<a target="_blank" class="customTarget" href="/' + colValue[field] + '">' + colValue[ref]["Name"] + '</a>';
                }
                return null;
            }
            
            if (columnMap["type"] == "CUSTOM"){

                if (columnMap["label"] == "Campaign Member"){
                  field = nameSpace+"Campaign_Member_Id__c";
                  if (colValue[nameSpace+"Contact__r"] != null){ // campaign member is a contact
                      ref = nameSpace+"Contact__r";
                  } else if (colValue[nameSpace+"Lead__r"] != null){ // campaign member is a lead
                      ref = nameSpace+"Lead__r";          
                  } 
                }
              
              if((ref != null) && (colValue[ref] != null) && (colValue[ref]["Name"] != null)) {
                  return '<a target="_blank" class="customTarget" href="/' + colValue[field] + '">' + colValue[ref]["Name"] + '</a>';
              } else if (field == "eventType") { // add link to Marketing Touch, Event, or Task
                  return '<a target="_blank" class="customTarget" href="/' + colValue["link"] + '">' + colValue[field] + '</a>';
              } else if (field == "eventObjectType" && colValue[field]) { // add link to Object Type
                  return `<a target="_blank" class="customTarget" href="/${ colValue.eventObjectTypeId }">${ colValue[field] }</a>`;
              } else if (field == "eventTargetName") {
                  if (colValue.eventObjectType) { // add link to Name (CUSTOM type)
                    return `<a target="_blank" class="customTarget" href="/${ colValue.eventObjectTypeId }">${ colValue[field] }</a>`;
                  } else if (colValue[field]) {
                    return colValue[field];
                  }
              } else if (columnMap.label == "Object Type" && colValue[field]) {
                  var type;
                  if (colValue[field] == "Contact with Role"){
                      type = nameSpace+"Contact__c";
                  } else {
                      type = nameSpace+colValue[field]+"__c";
                  }
                  return `<a target="_blank" class="customTarget" href="/${ colValue[type] }">${ colValue[field] }</a>`;
              }
                
              return null;
            }

            colValue = colValue[field];
            if(colValue === undefined) {
                return null;
            } else if(columnMap["type"] == "DATETIME") {
                return formatDateTime(colValue);
            } else if(columnMap["type"] == "DATE") {
                return formatUTCDate(colValue);
            } else if(columnMap["type"] == "URL") {
                return formatURL(colValue);
            } else if(columnMap["type"] == "EMAIL") {
                return formatEmailLink(colValue);
            } else if(columnMap["type"] == "CURRENCY") {
                return formatCurrency(colValue);
            } else if(columnMap["type"] == "BOOLEAN") {
                if(colValue)
                    return '<img src="/img/checkbox_checked.gif" alt="Checked" width="21" height="16" class="checkImg" title="Checked">';
                else
                    return '<img src="/img/checkbox_unchecked.gif" alt="Not Checked" width="21" height="16" class="checkImg" title="Not Checked">';
            }
            
            return colValue;      
        }

        function generateTableAndHeader(tableParent, columnLabels, tableIdentifier, colHeaderToStyle) {
            // create elements <table> and a <tbody>
            var tbl = document.createElement("table");
            tbl.className = "list " + tableIdentifier;
            var thead = document.createElement("thead");
            var row = document.createElement("tr");
            row.className = 'headerRow';
    
            for (var i = 0;i< columnLabels.length;i++) {
                var headerCell = document.createElement("th");
                const label = columnLabels[i]["label"];
                if (colHeaderToStyle && colHeaderToStyle[label]) {
                  headerCell.style.cssText = colHeaderToStyle[label];
                }
                headerCell.appendChild(document.createTextNode(label));
                row.appendChild(headerCell);
            }
            thead.appendChild(row);
            tbl.appendChild(thead);
            tbl.setAttribute("border", "0");
            tbl.setAttribute("cellpadding", "0");
            tbl.setAttribute("cellspacing", "0");
            tbl.setAttribute("style", "table-layout : fixed");

            return tbl;
        }

        function generateTableRow() {
            row = document.createElement("tr");
            row.className = "dataRow";
            row.setAttribute("onmouseover", "if (window.hiOn){hiOn(this);}");
            row.setAttribute("onmouseout", "if (window.hiOff){hiOff(this);}");
            row.setAttribute("onblur", "if (window.hiOff){hiOff(this);}");
            row.setAttribute("onfocus", "if (window.hiOn){hiOn(this);}");
            return row;
        }

        function generateDataTablesCell(row, isEditable) {
            var cell = document.createElement("td");
            row.appendChild(cell);
            cell.className = "dataCell";
            cell.style.whiteSpace = "nowrap";
            cell.style.padding = isEditable ? "1.5px" : "3.5px";
            var div = document.createElement("div");
            cell.appendChild(div);
            div.style.overflow = "hidden";
            div.style.textOverflow = "ellipsis";
            return div;
        }

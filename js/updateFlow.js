// 説明   : flow の編集画面。
// 作成日 : 2015/05/08
// 作成者 : 江野高広
// 更新   : 2015/12/24 syslog 確認のJSON を取り込めるように。
// 更新   : 2016/01/28 enable password をログイン情報ファイルから外す。
// 更新   : 2018/01/05 enable password 一括変更機能。
// 更新   : 2018/03/16 個別パラメーターシートを非表示に。機能毎削除は当たりが広いので非表示に。

var objUpdateFlow = new updateFlow();

function updateFlow (){
 // 選択中のbox id
 this.selectedBoxId = "";
 
 this.idBoxDataArea = "box_data_area";
 
 // 選択中のbox の表示table のid
 this.idTable = function (boxId){
  return("table_" + boxId);
 };
 
 // 選択中のbox の更新時刻の表示領域のid
 this.idUpdateTime = function (boxId){
  return("span_update_time_" + boxId);
 };
 
 // 選択中のbox のタイトルの表示領域のid
 this.idInputTitle = function (boxId){
  return("input_title_" + boxId);
 };
 
 // 選択中のbox の説明の表示領域のid
 this.idTextAreaDescription = function(boxId){
  return("textarea_description_" + boxId);
 };
 
 // 選択中のwork の流れ図データの表示領域のid
 this.idPFlowChart = function(workId, type){
  return("p_flowchart_" + workId + "_" + type);
 };
 
 // 選択中のbox のログイン情報の表示領域のid
 this.idLoginInfo = function(boxId){
  return("p_login_info_" + boxId);
 };
 
 // 選択中のbox のenable password の表示領域のid
 this.idEnablePassword = function(boxId){
  return("input_enable_password_" + boxId);
 };
 
 // 選択中のbox のSyslog 設定の表示領域のid
 this.idSyslogValues = function(workId){
  return("p_syslog_data_" + workId);
 };
 
 // 選択中のbox のDiff 設定の表示領域のid
 this.idDiffValues = function(workId){
  return("p_diff_data_" + workId);
 };
 
 // 選択中のbox の任意ログ設定の表示領域のid
 this.idOptionalLogValues = function(workId){
  return("p_optional_log_" + workId);
 };
 
 
 // 選択中のwork のパラメーターシートの選択領域のid
 this.idInputParameterSheet = function (workId, value){
  if((value !== null) && (value !== undefined)){
   return("input_parametersheet_" + workId + "_" + value);
  }
  else{
   return("input_parametersheet_" + workId);
  }
 };
 
 // 選択中のwork のパラメーターシートの結合の選択領域のid
 this.idInputOkLog = function (workId, value){
  if((value !== null) && (value !== undefined)){
   return("input_ok_log_" + workId + "_" + value);
  }
  else{
   return("input_ok_log_" + workId);
  }
 };
 
 // 選択中のcase の条件表示欄のid
 this.idTdParameterConditions = function (caseId){
  return("parameter_conditions_area");
 };
 
 // 選択中のwork のflowchart data のファイル名。
 this.flowchartFileName = new Object();
 this.flowchartFileName["before"] = "";
 this.flowchartFileName["middle"] = "";
 this.flowchartFileName["after"]  = "";
 
 // 選択中のwork のflowchart data
 this.flowchartData = new Object();
 this.flowchartData["before"] = "";
 this.flowchartData["middle"] = "";
 this.flowchartData["after"]  = "";
 
 // 選択中のbox のログイン情報のファイル名。
 this.loginInfoFileName = "";
 
 // 選択中のbox のログイン情報。
 this.loginInfoData = "";
 
 // syslog の設定データ。
 this.syslogValuesFileName = "";
 this.syslogValuesData = "";
 
 // diff の設定データ。
 this.diffValuesFileName = "";
 this.diffValuesData = "";
 
 // 任意ログ設定のデータ。
 this.optionalLogValuesFileName = "";
 this.optionalLogData = "";
 
 
 //
 // 対象flow のid とpassword をsession storage に入れる。
 //
 this.setFlowIdAndPassword = function (){
  var flowId       = objControleStorageS.getFlowId();
  var flowPassword = objControleStorageS.getFlowPassword();
  
  if(flowId.length === 0){
   flowId = objControleStorageL.getFlowId();
   
   if(flowId.length > 0){
    objControleStorageS.setFlowId(flowId);
    objControleStorageL.removeFlowId();
   }
  }
  
  if(flowPassword.length === 0){
   flowPassword = objControleStorageL.getFlowPassword();
   
   if(flowPassword.length > 0){
    objControleStorageS.setFlowPassword(flowPassword);
    objControleStorageL.removeFlowPassword();
   }
  }
  
  objControleStorageS.setPageType('flow');
  objTelnetmanWorkFlow.getFlowData();
 };
 
 
 
 //
 // work box を新規作成する。
 //
 this.createNewWorkBox = function  (){
  var newWorkData = objTelnetmanWorkFlow.createNewWorkData();
  
  var boxX   = newWorkData["x"];
  var boxY   = newWorkData["y"];
  var title  = newWorkData["title"];
  var okLinkTarget = newWorkData["ok_link_target"];
  var ngLinkTarget = newWorkData["ng_link_target"];
  var throughLinkTarget = newWorkData["through_link_target"];
  var okLinkVertices = newWorkData["ok_link_vertices"];
  var ngLinkVertices = newWorkData["ng_link_vertices"];
  var throughLinkVertices = newWorkData["through_link_vertices"];
  
  var jsonOkLinkTarget = JSON.stringify(okLinkTarget);
  var jsonNgLinkTarget = JSON.stringify(ngLinkTarget);
  var jsonThroughLinkTarget = JSON.stringify(throughLinkTarget);
  var jsonOkLinkVertices = JSON.stringify(okLinkVertices);
  var jsonNgLinkVertices = JSON.stringify(ngLinkVertices);
  var jsonThroughLinkVertices = JSON.stringify(throughLinkVertices);
  
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/create_work.cgi",
    data : {
     "flow_id" : flowId,
     "x" : boxX,
     "y" : boxY,
     "title" : title,
     "json_ok_link_target" : jsonOkLinkTarget,
     "json_ng_link_target" : jsonNgLinkTarget,
     "json_through_link_target" : jsonThroughLinkTarget,
     "json_ok_link_vertices" : jsonOkLinkVertices,
     "json_ng_link_vertices" : jsonNgLinkVertices,
     "json_through_link_vertices" : jsonThroughLinkVertices
    },
    success : function (jsonResult) {
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId = hashResult["flow_id"];
        var workId = hashResult["work_id"];
        
        objTelnetmanWorkFlow.addNewWorkBox(workId);
        objUpdateFlow.getBoxData(workId);
       }
       else{
        objTelnetmanWorkFlow.addNewWorkBox();
        objUpdateFlow.selectedBoxId = "";
        
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // case box を新規作成する。
 //
 this.createNewCaseBox = function  (){
  var newCaseData = objTelnetmanWorkFlow.createNewCaseData();
  
  var boxX   = newCaseData["x"];
  var boxY   = newCaseData["y"];
  var title  = newCaseData["title"];
  var linkTargetList   = newCaseData["link_target_list"];
  var linkLabelList    = newCaseData["link_label_list"];
  var linkVerticesList = newCaseData["link_vertices_list"];
  
  var jsonLinkTargetList   = JSON.stringify(linkTargetList);
  var jsonLinkLabelList    = JSON.stringify(linkLabelList );
  var jsonLinkVerticesList = JSON.stringify(linkVerticesList);
  
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/create_case.cgi",
    data : {
     "flow_id" : flowId,
     "x" : boxX,
     "y" : boxY,
     "title" : title,
     "json_link_target_list" : jsonLinkTargetList,
     "json_link_label_list" : jsonLinkLabelList,
     "json_link_vertices_list" : jsonLinkVerticesList
    },
    success : function (jsonResult) {
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId = hashResult["flow_id"];
        var caseId = hashResult["case_id"];
        
        objTelnetmanWorkFlow.addNewCaseBox(caseId);
        objUpdateFlow.getBoxData(caseId);
       }
       else{
        objTelnetmanWorkFlow.addNewCaseBox();
        objUpdateFlow.selectedBoxId = "";
        
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // terminal box を新規作成する。
 //
 this.createNewTerminalBox = function  (){
  var newTerminalData = objTelnetmanWorkFlow.createNetTerminalData();
  
  var boxX  = newTerminalData["x"];
  var boxY  = newTerminalData["y"];
  var title = newTerminalData["title"];
  
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/create_terminal.cgi",
    data : {
     "flow_id" : flowId,
     "x" : boxX,
     "y" : boxY,
     "title" : title
    },
    success : function (jsonResult) {
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId     = hashResult["flow_id"];
        var terminalId = hashResult["terminal_id"];
        
        objTelnetmanWorkFlow.addNewTerminalBox(terminalId);
        objUpdateFlow.getBoxData(terminalId);
       }
       else{
        objTelnetmanWorkFlow.addNewTerminalBox();
        objUpdateFlow.selectedBoxId = "";
        
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // box data を取得、表示する。
 //
 this.getBoxData = function (boxId){
  if(boxId.match(/^work_/) || boxId.match(/^case_/) || boxId.match(/^start_/) || boxId.match(/^terminal_/)){
   if(boxId !== this.selectedBoxId){
    if(objParameterConditions.changes){
     this.updateCaseData(this.selectedBoxId, boxId);
    }
    else{
     if(this.selectedBoxId.length > 0){
      var elTable = document.getElementById(this.idTable(this.selectedBoxId));
      document.getElementById(this.idBoxDataArea).removeChild(elTable);
      
      objTelnetmanWorkFlow.returnStroke(this.selectedBoxId);
     }
     
     if(boxId.match(/^work_/)){
      this.getWorkData(boxId);
     }
     else if(boxId.match(/^case_/)){
      this.getCaseData(boxId);
     }
     else if(boxId.match(/^start_/)){
      this.getStartData(boxId) ;
     }
     else if(boxId.match(/^terminal_/)){
      this.getTerminalData(boxId) ;
     }
    }
   }
  }
 };
 
 
 
 //
 // box data table のbottom 座標を取得する。
 //
 this.getBoxDataTableBottom = function (boxId){
  var rect = document.getElementById(this.idTable(boxId)).getBoundingClientRect();
  var boxDataTableBottom = window.pageYOffset + rect.top + rect.height;
  return(boxDataTableBottom);
 };
 
 
 
 //
 // work data を取得、表示する。
 //
 this.getWorkData = function (workId){
  var flowId       = objControleStorageS.getFlowId();
  var flowPassword = objControleStorageS.getFlowPassword();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   this.selectedBoxId = workId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/get_work_data.cgi",
    data : {
     "flow_id" : flowId,
     "work_id" : workId
    },
    success : function (jsonResult) {
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId             = hashResult["flow_id"];
        var workId             = hashResult["work_id"];
        var title              = hashResult["title"];
        var description        = hashResult["description"];
        var useParameterSheet  = hashResult["use_parameter_sheet"];
        var bondParameterSheet = hashResult["bond_parameter_sheet"];
        var updateTime         = hashResult["update_time"];
        var flowchartBefore    = hashResult["flowchart_before"];
        var flowchartMiddle    = hashResult["flowchart_middle"];
        var flowchartAfter     = hashResult["flowchart_after"];
        var loginInfo          = hashResult["login_info"];
        var enablePassword     = hashResult["enable_password"];
        var syslogValues       = hashResult["syslog_values"];
        var diffValues         = hashResult["diff_values"];
        var optionalLogValues  = hashResult["optional_log_values"];
        
        var elTable = document.createElement("table");
        elTable.setAttribute("id", objUpdateFlow.idTable(workId));
        
        var elTr0 = document.createElement("tr");
        var elTd0 = document.createElement("td");
        elTd0.setAttribute("colspan", 2);
        elTd0.setAttribute("class", "center");
        var elButton0    = document.createElement("button");
        elButton0.setAttribute("class", "enable");
        elButton0.innerHTML = "更新";
        elButton0.onclick = new Function("objUpdateFlow.updateWorkData('" + workId + "')");
        var elButton1    = document.createElement("button");
        elButton1.setAttribute("class", "enable");
        elButton1.innerHTML = "削除";
        elButton1.onclick = new Function("objUpdateFlow.removeBox('" + workId + "')");
        elTd0.appendChild(elButton0);
        elTd0.appendChild(elButton1);
        elTr0.appendChild(elTd0);
        
        
        var elTr1    = document.createElement("tr");
        var elTd11   = document.createElement("td");
        var elTd12   = document.createElement("td");
        var elSpan11 = document.createElement("span");
        var elSpan12 = document.createElement("span");
        elSpan11.innerHTML = "更新時刻";
        elSpan12.innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        elSpan12.setAttribute("id", objUpdateFlow.idUpdateTime(workId));
        elTd11.appendChild(elSpan11);
        elTd12.appendChild(elSpan12);
        elTr1.appendChild(elTd11);
        elTr1.appendChild(elTd12);
        
        
        var elTr2     = document.createElement("tr");
        var elTd21    = document.createElement("td");
        var elTd22    = document.createElement("td");
        var elSpan21  = document.createElement("span");
        var elInput22 = document.createElement("input");
        elSpan21.innerHTML = "タイトル";
        elInput22.setAttribute("type", "text");
        elInput22.setAttribute("spellcheck", "false");
        elInput22.setAttribute("autocomplete", "off");
        //elInput22.setAttribute("size", 26);
        elInput22.style.width = "162px";
        elInput22.setAttribute("id", objUpdateFlow.idInputTitle(workId));
        elInput22.setAttribute("value", title);
        elTd21.appendChild(elSpan21);
        elTd22.appendChild(elInput22);
        elTr2.appendChild(elTd21);
        elTr2.appendChild(elTd22);
        
        
        var elTr3        = document.createElement("tr");
        var elTd31       = document.createElement("td");
        var elTd32       = document.createElement("td");
        var elSpan31     = document.createElement("span");
        var elTextarea32 = document.createElement("textarea");
        elSpan31.innerHTML = "説明";
        elTextarea32.setAttribute("id", objUpdateFlow.idTextAreaDescription(workId));
        //elTextarea32.setAttribute("cols", 26);
        //elTextarea32.setAttribute("rows", 6);
        elTextarea32.style.width = "162px";
        elTextarea32.style.height = "72px";
        elTextarea32.value = description;
        elTextarea32.setAttribute("spellcheck", "false");
        elTextarea32.setAttribute("autocomplete", "off");
        elTd31.appendChild(elSpan31);
        elTd32.appendChild(elTextarea32);
        elTr3.appendChild(elTd31);
        elTr3.appendChild(elTd32);
        
        
        var elTr4    = document.createElement("tr");
        var elTd41   = document.createElement("td");
        var elTd42   = document.createElement("td");
        var elSpan41 = document.createElement("span");
        var elDiv42  = document.createElement("div");
        elSpan41.innerHTML = "流れ図データ";
        elDiv42.setAttribute("class", "drop_area flowchart_data_div");
        elDiv42.ondragover = new Function("event", "objCommon.onDragOver(event);");
        elDiv42.ondrop     = new Function("event", "objUpdateFlow.onDropFlowchartData(event);");
        var elPBefore = document.createElement("p");
        var elPMiddle = document.createElement("p");
        var elPAfter  = document.createElement("p");
        elPBefore.setAttribute("id", objUpdateFlow.idPFlowChart(workId, "before"));
        elPMiddle.setAttribute("id", objUpdateFlow.idPFlowChart(workId, "middle"));
        elPAfter.setAttribute("id",  objUpdateFlow.idPFlowChart(workId, "after"));
        elDiv42.appendChild(elPBefore);
        elDiv42.appendChild(elPMiddle);
        elDiv42.appendChild(elPAfter);
        elTd41.appendChild(elSpan41);
        elTd42.appendChild(elDiv42);
        elTr4.appendChild(elTd41);
        elTr4.appendChild(elTd42);
        
        
        var elTr5    = document.createElement("tr");
        var elTd51   = document.createElement("td");
        var elTd52   = document.createElement("td");
        var elSpan51 = document.createElement("span");
        var elInput52 = document.createElement("input");
        var elInput53 = document.createElement("input");
        elSpan51.innerHTML = "パラメーターシート";
        elInput52.setAttribute("type", "radio");
        elInput52.setAttribute("id", objUpdateFlow.idInputParameterSheet(workId, 0));
        elInput52.setAttribute("name", objUpdateFlow.idInputParameterSheet(workId));
        elInput52.setAttribute("value", 0);
        elInput53.setAttribute("type", "radio");
        elInput53.setAttribute("id", objUpdateFlow.idInputParameterSheet(workId, 1));
        elInput53.setAttribute("name", objUpdateFlow.idInputParameterSheet(workId));
        elInput53.setAttribute("value", 1);
        if(useParameterSheet === 1){
         elInput53.checked = true;
        }
        else{
         elInput52.checked = true;
        }
        var elLabel52 = document.createElement("label");
        var elLabel53 = document.createElement("label");
        elLabel52.setAttribute("for", objUpdateFlow.idInputParameterSheet(workId, 0));
        elLabel53.setAttribute("for", objUpdateFlow.idInputParameterSheet(workId, 1));
        elLabel52.innerHTML = "デフォルト";
        elLabel53.innerHTML = "個別";
        elTd51.appendChild(elSpan51);
        elTd52.appendChild(elInput52);
        elTd52.appendChild(elLabel52);
        elTd52.appendChild(elInput53);
        elTd52.appendChild(elLabel53);
        elTr5.appendChild(elTd51);
        elTr5.appendChild(elTd52);
        elTr5.style.display = "none";
        
        
        var elTr6    = document.createElement("tr");
        var elTd61   = document.createElement("td");
        var elTd62   = document.createElement("td");
        var elSpan61 = document.createElement("span");
        var elDiv62  = document.createElement("div");
        elSpan61.innerHTML = "個別ログイン情報";
        elDiv62.setAttribute("class", "drop_area drag_and_drop_zone");
        elDiv62.ondragover = new Function("event", "objCommon.onDragOver(event);");
        elDiv62.ondrop     = new Function("event", "objUpdateFlow.onDropLoginInfoData(event)");
        var elPLoginInfo = document.createElement("p");
        elPLoginInfo.setAttribute("id", objUpdateFlow.idLoginInfo(workId));
        var elSpanPassword = document.createElement("span");
        elSpanPassword.innerHTML = "enable&nbsp;password&nbsp;:&nbsp;";
        var elInputPassword = document.createElement("input");
        elInputPassword.setAttribute("type", "password");
        elInputPassword.setAttribute("id", objUpdateFlow.idEnablePassword(workId));
        //elInputPassword.setAttribute("size", 8);
        elInputPassword.style.width = "50px";
        elInputPassword.setAttribute("value", enablePassword);
        elDiv62.appendChild(elPLoginInfo);
        elTd61.appendChild(elSpan61);
        elTd62.appendChild(elDiv62);
        elTd62.appendChild(elSpanPassword);
        elTd62.appendChild(elInputPassword);
        elTr6.appendChild(elTd61);
        elTr6.appendChild(elTd62);
        
        
        var elTr7    = document.createElement("tr");
        var elTd71   = document.createElement("td");
        var elTd72   = document.createElement("td");
        var elSpan71 = document.createElement("span");
        var elSpan72 = document.createElement("span");
        var elInput72 = document.createElement("input");
        var elInput73 = document.createElement("input");
        elSpan71.innerHTML = "追加パラメーターシートを";
        elSpan72.className = "additional_parametersheet";
        elInput72.setAttribute("type", "radio");
        elInput72.setAttribute("id", objUpdateFlow.idInputOkLog(workId, 0));
        elInput72.setAttribute("name", objUpdateFlow.idInputOkLog(workId));
        elInput72.setAttribute("value", 0);
        elInput73.setAttribute("type", "radio");
        elInput73.setAttribute("id", objUpdateFlow.idInputOkLog(workId, 1));
        elInput73.setAttribute("name", objUpdateFlow.idInputOkLog(workId));
        elInput73.setAttribute("value", 1);
        if(bondParameterSheet === 1){
         elInput73.checked = true;
        }
        else{
         elInput72.checked = true;
        }
        var elLabel72 = document.createElement("label");
        var elLabel73 = document.createElement("label");
        elLabel72.setAttribute("for", objUpdateFlow.idInputOkLog(workId, 0));
        elLabel73.setAttribute("for", objUpdateFlow.idInputOkLog(workId, 1));
        elLabel72.innerHTML = "破棄";
        elLabel73.innerHTML = "結合";
        elTd71.appendChild(elSpan71);
        elSpan72.appendChild(elInput72);
        elSpan72.appendChild(elLabel72);
        elSpan72.appendChild(elInput73);
        elSpan72.appendChild(elLabel73);
        elTd72.appendChild(elSpan72);
        elTr7.appendChild(elTd71);
        elTr7.appendChild(elTd72);
        
        
        var elTr10    = document.createElement("tr");
        var elTd101   = document.createElement("td");
        var elTd102   = document.createElement("td");
        var elSpan101 = document.createElement("span");
        var elDiv102  = document.createElement("div");
        elSpan101.innerHTML = "Syslog (terminal monitor)設定";
        elDiv102.setAttribute("class", "drop_area drag_and_drop_zone");
        elDiv102.ondragover = new Function("event", "objCommon.onDragOver(event);");
        elDiv102.ondrop     = new Function("event", "objUpdateFlow.onDropSyslogValuesData(event)");
        var elPSyslogValues = document.createElement("p");
        elPSyslogValues.setAttribute("id", objUpdateFlow.idSyslogValues(workId));
        elDiv102.appendChild(elPSyslogValues);
        elTd101.appendChild(elSpan101);
        elTd102.appendChild(elDiv102);
        elTr10.appendChild(elTd101);
        elTr10.appendChild(elTd102);
        
        
        var elTr8    = document.createElement("tr");
        var elTd81   = document.createElement("td");
        var elTd82   = document.createElement("td");
        var elSpan81 = document.createElement("span");
        var elDiv82  = document.createElement("div");
        elSpan81.innerHTML = "Diff 設定";
        elDiv82.setAttribute("class", "drop_area drag_and_drop_zone");
        elDiv82.ondragover = new Function("event", "objCommon.onDragOver(event);");
        elDiv82.ondrop     = new Function("event", "objUpdateFlow.onDropDiffValuesData(event)");
        var elPDiffValues = document.createElement("p");
        elPDiffValues.setAttribute("id", objUpdateFlow.idDiffValues(workId));
        elDiv82.appendChild(elPDiffValues);
        elTd81.appendChild(elSpan81);
        elTd82.appendChild(elDiv82);
        elTr8.appendChild(elTd81);
        elTr8.appendChild(elTd82);
        
        
        var elTr9    = document.createElement("tr");
        var elTd91   = document.createElement("td");
        var elTd92   = document.createElement("td");
        var elSpan91 = document.createElement("span");
        var elDiv92  = document.createElement("div");
        elSpan91.innerHTML = "任意ログ設定";
        elDiv92.setAttribute("class", "drop_area drag_and_drop_zone");
        elDiv92.ondragover = new Function("event", "objCommon.onDragOver(event);");
        elDiv92.ondrop     = new Function("event", "objUpdateFlow.onDropOptionalLogValuesData(event)");
        var elPOptionalLogValues = document.createElement("p");
        elPOptionalLogValues.setAttribute("id", objUpdateFlow.idOptionalLogValues(workId));
        elDiv92.appendChild(elPOptionalLogValues);
        elTd91.appendChild(elSpan91);
        elTd92.appendChild(elDiv92);
        elTr9.appendChild(elTd91);
        elTr9.appendChild(elTd92);
        
        
        elTable.appendChild(elTr1);
        elTable.appendChild(elTr2);
        elTable.appendChild(elTr3);
        elTable.appendChild(elTr4);
        elTable.appendChild(elTr5);
        elTable.appendChild(elTr6);
        elTable.appendChild(elTr7);
        elTable.appendChild(elTr10);
        elTable.appendChild(elTr8);
        elTable.appendChild(elTr9);
        elTable.appendChild(elTr0);
        
        document.getElementById(objUpdateFlow.idBoxDataArea).appendChild(elTable);
        
        objUpdateFlow.addFlowchartFileName(workId, "before", flowchartBefore);
        objUpdateFlow.addFlowchartFileName(workId, "middle", flowchartMiddle);
        objUpdateFlow.addFlowchartFileName(workId, "after", flowchartAfter);
        objUpdateFlow.addLoginInfoFileName(workId, loginInfo);
        objUpdateFlow.addSyslogValuesFileName(workId, syslogValues);
        objUpdateFlow.addDiffValuesFileName(workId, diffValues);
        objUpdateFlow.addOptionalLogValuesFileName(workId, optionalLogValues);
        
        objTelnetmanWorkFlow.changeStroke(workId);
        
        var boxDataTableBottom = objUpdateFlow.getBoxDataTableBottom(workId);
        objTelnetmanWorkFlow.optimizeWorkflowAreaHeight(boxDataTableBottom);
       }
       else{
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // case data を取得、表示する。
 //
 this.getCaseData = function (caseId){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   this.selectedBoxId = caseId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/get_case_data.cgi",
    data : {
     "flow_id" : flowId,
     "case_id" : caseId
    },
    success : function (jsonResult) {
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId              = hashResult["flow_id"];
        var caseId              = hashResult["case_id"];
        var title               = hashResult["title"];
        var description         = hashResult["description"];
        var linkTargetList      = hashResult["link_target_list"];
        var linkLabelList       = hashResult["link_label_list"];
        var linkVerticesList    = hashResult["link_vertices_list"];
        var parameterConditions = hashResult["parameter_conditions"];
        var updateTime          = hashResult["update_time"];

        var elTable = document.createElement("table");
        elTable.setAttribute("id", objUpdateFlow.idTable(caseId));
        
        var elTr0 = document.createElement("tr");
        var elTd0 = document.createElement("td");
        elTd0.setAttribute("colspan", 2);
        elTd0.setAttribute("class", "center");
        var elButton0    = document.createElement("button");
        elButton0.setAttribute("class", "enable");
        elButton0.innerHTML = "更新";
        elButton0.onclick = new Function("objUpdateFlow.updateCaseData('" + caseId + "')");
        var elButton1    = document.createElement("button");
        elButton1.setAttribute("class", "enable");
        elButton1.innerHTML = "削除";
        elButton1.onclick = new Function("objUpdateFlow.removeBox('" + caseId + "')");
        elTd0.appendChild(elButton0);
        elTd0.appendChild(elButton1);
        elTr0.appendChild(elTd0);
        
        
        var elTr1    = document.createElement("tr");
        var elTd11   = document.createElement("td");
        var elTd12   = document.createElement("td");
        var elSpan11 = document.createElement("span");
        var elSpan12 = document.createElement("span");
        elSpan11.innerHTML = "更新時刻";
        elSpan12.innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        elSpan12.setAttribute("id", objUpdateFlow.idUpdateTime(caseId));
        elTd11.appendChild(elSpan11);
        elTd12.appendChild(elSpan12);
        elTr1.appendChild(elTd11);
        elTr1.appendChild(elTd12);
        
        
        var elTr2     = document.createElement("tr");
        var elTd21    = document.createElement("td");
        var elTd22    = document.createElement("td");
        var elSpan21  = document.createElement("span");
        var elInput22 = document.createElement("input");
        elSpan21.innerHTML = "タイトル";
        elInput22.setAttribute("type", "text");
        elInput22.setAttribute("spellcheck", "false");
        elInput22.setAttribute("autocomplete", "off");
        //elInput22.setAttribute("size", 26);
        elInput22.style.width = "162px";
        elInput22.setAttribute("id", objUpdateFlow.idInputTitle(caseId));
        elInput22.setAttribute("value", title);
        elTd21.appendChild(elSpan21);
        elTd22.appendChild(elInput22);
        elTr2.appendChild(elTd21);
        elTr2.appendChild(elTd22);
        
        
        var elTr3        = document.createElement("tr");
        var elTd31       = document.createElement("td");
        var elTd32       = document.createElement("td");
        var elSpan31     = document.createElement("span");
        var elTextarea32 = document.createElement("textarea");
        elSpan31.innerHTML = "説明";
        elTextarea32.setAttribute("id", objUpdateFlow.idTextAreaDescription(caseId));
        //elTextarea32.setAttribute("cols", 26);
        //elTextarea32.setAttribute("rows", 6);
        elTextarea32.style.width = "162px";
        elTextarea32.style.height = "72px";
        elTextarea32.value = description;
        elTextarea32.setAttribute("spellcheck", "false");
        elTextarea32.setAttribute("autocomplete", "off");
        elTd31.appendChild(elSpan31);
        elTd32.appendChild(elTextarea32);
        elTr3.appendChild(elTd31);
        elTr3.appendChild(elTd32);
        
        
        var idParameterConditions = objUpdateFlow.idTdParameterConditions(caseId);
        var elTr4  = document.createElement("tr");
        var elTd41 = document.createElement("td");
        elTd41.setAttribute("colspan", 2);
        elTd41.setAttribute("id", idParameterConditions);
        elTr4.appendChild(elTd41);

        
        elTable.appendChild(elTr1);
        elTable.appendChild(elTr2);
        elTable.appendChild(elTr3);
        elTable.appendChild(elTr4);
        elTable.appendChild(elTr0);
        
        document.getElementById(objUpdateFlow.idBoxDataArea).appendChild(elTable);
        
        objParameterConditions.inputCaseId(caseId);
        objParameterConditions.iputIdParameterConditions(idParameterConditions);
        objParameterConditions.inputPparameterConditions(parameterConditions);
        objParameterConditions.inputLinkLabelList(linkLabelList);
        objParameterConditions.displayConditions();
        
        objTelnetmanWorkFlow.changeStroke(caseId);
       }
       else{
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // D&D されたflowchart データファイルの名前を入れる。 
 //
 this.addFlowchartFileName = function (workId, type, fileName){
  if(fileName.length > 0){
   var flowId = objControleStorageS.getFlowId();
   
   var elImg = document.createElement("img");
   elImg.setAttribute("src", "img/cross.png");
   elImg.setAttribute("width", 16);
   elImg.setAttribute("height", 16);
   elImg.onclick = new Function("objUpdateFlow.removeFlowchartDataName('" + workId + "','" + type + "')");
  
   var elSpan = document.createElement("span");
   elSpan.innerHTML = fileName;
   elSpan.setAttribute("class", "onclick_node");
   elSpan.onclick = new Function("objUpdateFlow.getUploadFile('" + flowId + "', '" + workId + "', '" + type + "')");
   
   this.removeFlowchartDataName(workId, type);
   
   var elP = document.getElementById(this.idPFlowChart(workId, type));
   elP.appendChild(elImg);  
   elP.appendChild(elSpan); 
  } 
  
  this.flowchartFileName[type] = fileName;    
 };
 
 
 
 //
 // 表示されているflowchart データファイルのファイル名を削除する。 
 //
 this.removeFlowchartDataName = function (workId, type){
  var elP = document.getElementById(this.idPFlowChart(workId, type));
  var chileElementList = elP.childNodes;
  
  for(var i = chileElementList.length - 1; i >= 0; i --){
   elP.removeChild(chileElementList[i]);
  }
  
  this.flowchartFileName[type] = "";
  this.flowchartData[type] = "";
 };
 
 
 //
 // ドロップされたflowchart データファイルを開く。
 //
 this.onDropFlowchartData = function (event) {
  var files = event.dataTransfer.files;
  
  for(var i = 0, j = files.length; i < j; i ++){
   var fileName = files[i].name;
   
   if((fileName.match(/^Telnetman2_flowchart_/)) && (fileName.match(/\.json$/))){
    // FileReaderオブジェクトの生成。
    var reader = new FileReader();
    reader.name = fileName;
    
    // ファイル読取が完了した際に呼ばれる処理を定義。
    reader.onload = function (event) {
     var workId = objUpdateFlow.selectedBoxId;
     var jsonFlowchart = event.target.result;
     var fileName      = event.target.name;
     
     if(fileName.match(/^Telnetman2_flowchart_before_/)){
      objUpdateFlow.addFlowchartFileName(workId, "before", fileName);
      objUpdateFlow.flowchartData["before"] = jsonFlowchart;
     }
     else if(fileName.match(/^Telnetman2_flowchart_after_/)){
      objUpdateFlow.addFlowchartFileName(workId, "after", fileName);
      objUpdateFlow.flowchartData["after"] = jsonFlowchart;
     }
     else{
      objUpdateFlow.addFlowchartFileName(workId, "middle", fileName);
      objUpdateFlow.flowchartData["middle"] = jsonFlowchart;
     }
    };
   
    // ファイルの内容を取得。
    reader.readAsText(files[i], 'utf8');
   }
   
   // ブラウザ上でファイルを展開する挙動を抑止。
   event.preventDefault();
  }
 };
 
 
 
 //
 // ドロップされたログイン情報のファイルを開く。
 //
 this.onDropLoginInfoData = function (event) {
  var files = event.dataTransfer.files;
  
  if((files[0].name.match(/^Telnetman2_loginInfo_/)) && (files[0].name.match(/\.json$/))){
   // FileReaderオブジェクトの生成。
   var reader = new FileReader();
   reader.name = files[0].name;
   
   // ファイル読取が完了した際に呼ばれる処理を定義。
   reader.onload = function (event) {
    var boxId = objUpdateFlow.selectedBoxId;
    var fileName      = event.target.name;
    var jsonLoginInfo = event.target.result;
    
    objUpdateFlow.addLoginInfoFileName(boxId, fileName);
    objUpdateFlow.loginInfoData = jsonLoginInfo;
   };
   
   // ファイルの内容を取得。
   reader.readAsText(files[0], 'utf8');
  }
  
  // ブラウザ上でファイルを展開する挙動を抑止。
  event.preventDefault();
 };
 
 
  
 //
 // D&D されたログイン情報のファイルの名前を入れる。 
 //
 this.addLoginInfoFileName = function (boxId, fileName){
  if(fileName.length > 0){
   var flowId = objControleStorageS.getFlowId();
   
   var elImg = document.createElement("img");
   elImg.setAttribute("src", "img/cross.png");
   elImg.setAttribute("width", 16);
   elImg.setAttribute("height", 16);
   elImg.onclick = new Function("objUpdateFlow.removeLoginInfoDataName('" + boxId + "')");
  
   var elSpan = document.createElement("span");
   elSpan.innerHTML = fileName;
   elSpan.setAttribute("class", "onclick_node");
   elSpan.onclick = new Function("objUpdateFlow.getUploadFile('" + flowId + "', '" + boxId + "', 'loginInfo')");
   
   this.removeLoginInfoDataName(boxId);
   
   var elP = document.getElementById(this.idLoginInfo(boxId));
   elP.appendChild(elImg);  
   elP.appendChild(elSpan); 
  } 
  
  this.loginInfoFileName = fileName;    
 };
 
 
 
 //
 // 表示されているログイン情報のファイルのファイル名を削除する。 
 //
 this.removeLoginInfoDataName = function (boxId){
  var elP = document.getElementById(this.idLoginInfo(boxId));
  var chileElementList = elP.childNodes;
  
  for(var i = chileElementList.length - 1; i >= 0; i --){
   elP.removeChild(chileElementList[i]);
  }
  
  this.loginInfoFileName = "";
  this.loginInfoData = "";
 };
 
 
 
 //
 // ドロップされたSyslog 設定のファイルを開く。
 //
 this.onDropSyslogValuesData = function (event) {
  var files = event.dataTransfer.files;
  
  if((files[0].name.match(/^Telnetman2_terminalMonitor_/)) && (files[0].name.match(/\.json$/))){
   // FileReaderオブジェクトの生成。
   var reader = new FileReader();
   reader.name = files[0].name;
   
   // ファイル読取が完了した際に呼ばれる処理を定義。
   reader.onload = function (event) {
    var workId = objUpdateFlow.selectedBoxId;
    var fileName         = event.target.name;
    var jsonSyslogValues = event.target.result;
    
    objUpdateFlow.addSyslogValuesFileName(workId, fileName);
    objUpdateFlow.syslogValuesData = jsonSyslogValues;
   };
   
   // ファイルの内容を取得。
   reader.readAsText(files[0], 'utf8');
  }
  
  // ブラウザ上でファイルを展開する挙動を抑止。
  event.preventDefault();
 };
 
 
  
 //
 // D&D されたSyslog 設定のファイルの名前を入れる。 
 //
 this.addSyslogValuesFileName = function (workId, fileName){
  if(fileName.length > 0){
   var flowId = objControleStorageS.getFlowId();
   
   var elImg = document.createElement("img");
   elImg.setAttribute("src", "img/cross.png");
   elImg.setAttribute("width", 16);
   elImg.setAttribute("height", 16);
   elImg.onclick = new Function("objUpdateFlow.removeSyslogValuesDataName('" + workId + "')");
  
   var elSpan = document.createElement("span");
   elSpan.innerHTML = fileName;
   elSpan.setAttribute("class", "onclick_node");
   elSpan.onclick = new Function("objUpdateFlow.getUploadFile('" + flowId + "', '" + workId + "', 'syslogValues')");
   
   this.removeSyslogValuesDataName(workId);
   
   var elP = document.getElementById(this.idSyslogValues(workId));
   elP.appendChild(elImg);  
   elP.appendChild(elSpan); 
  } 
  
  this.syslogValuesFileName = fileName;    
 };
 
 
 
 //
 // 表示されているSyslog 設定のデータとファイル名を削除する。 
 //
 this.removeSyslogValuesDataName = function (workId){
  var elP = document.getElementById(this.idSyslogValues(workId));
  var chileElementList = elP.childNodes;
  
  for(var i = chileElementList.length - 1; i >= 0; i --){
   elP.removeChild(chileElementList[i]);
  }
  
  this.syslogValuesFileName = "";
  this.syslogValuesData = "";
 };
 
 
 
 //
 // ドロップされたDiff 設定のファイルを開く。
 //
 this.onDropDiffValuesData = function (event) {
  var files = event.dataTransfer.files;
  
  if((files[0].name.match(/^Telnetman2_diffValues_/)) && (files[0].name.match(/\.json$/))){
   // FileReaderオブジェクトの生成。
   var reader = new FileReader();
   reader.name = files[0].name;
   
   // ファイル読取が完了した際に呼ばれる処理を定義。
   reader.onload = function (event) {
    var workId = objUpdateFlow.selectedBoxId;
    var fileName       = event.target.name;
    var jsonDiffValues = event.target.result;
    
    objUpdateFlow.addDiffValuesFileName(workId, fileName);
    objUpdateFlow.diffValuesData = jsonDiffValues;
   };
   
   // ファイルの内容を取得。
   reader.readAsText(files[0], 'utf8');
  }
  
  // ブラウザ上でファイルを展開する挙動を抑止。
  event.preventDefault();
 };
 
 
  
 //
 // D&D されたDiff 設定のファイルの名前を入れる。 
 //
 this.addDiffValuesFileName = function (workId, fileName){
  if(fileName.length > 0){
   var flowId = objControleStorageS.getFlowId();
   
   var elImg = document.createElement("img");
   elImg.setAttribute("src", "img/cross.png");
   elImg.setAttribute("width", 16);
   elImg.setAttribute("height", 16);
   elImg.onclick = new Function("objUpdateFlow.removeDiffValuesDataName('" + workId + "')");
  
   var elSpan = document.createElement("span");
   elSpan.innerHTML = fileName;
   elSpan.setAttribute("class", "onclick_node");
   elSpan.onclick = new Function("objUpdateFlow.getUploadFile('" + flowId + "', '" + workId + "', 'diffValues')");
   
   this.removeDiffValuesDataName(workId);
   
   var elP = document.getElementById(this.idDiffValues(workId));
   elP.appendChild(elImg);  
   elP.appendChild(elSpan); 
  } 
  
  this.diffValuesFileName = fileName;    
 };
 
 
 
 //
 // 表示されているDiff 設定のデータとファイル名を削除する。 
 //
 this.removeDiffValuesDataName = function (workId){
  var elP = document.getElementById(this.idDiffValues(workId));
  var chileElementList = elP.childNodes;
  
  for(var i = chileElementList.length - 1; i >= 0; i --){
   elP.removeChild(chileElementList[i]);
  }
  
  this.diffValuesFileName = "";
  this.diffValuesData = "";
 };
 
 
 
 //
 // ドロップされた任意ログ設定のファイルを開く。
 //
 this.onDropOptionalLogValuesData = function (event) {
  var files = event.dataTransfer.files;
  
  if((files[0].name.match(/^Telnetman2_optionalLog_/)) && (files[0].name.match(/\.json$/))){
   // FileReaderオブジェクトの生成。
   var reader = new FileReader();
   reader.name = files[0].name;
   
   // ファイル読取が完了した際に呼ばれる処理を定義。
   reader.onload = function (event) {
    var workId = objUpdateFlow.selectedBoxId;
    var fileName              = event.target.name;
    var jsonOptionalLogValues = event.target.result;
    
    objUpdateFlow.addOptionalLogValuesFileName(workId, fileName);
    objUpdateFlow.optionalLogData = jsonOptionalLogValues;
   };
   
   // ファイルの内容を取得。
   reader.readAsText(files[0], 'utf8');
  }
  
  // ブラウザ上でファイルを展開する挙動を抑止。
  event.preventDefault();
 };
 
 
  
 //
 // D&D された任意ログ設定のファイルの名前を入れる。 
 //
 this.addOptionalLogValuesFileName = function (workId, fileName){
  if(fileName.length > 0){
   var flowId = objControleStorageS.getFlowId();
   
   var elImg = document.createElement("img");
   elImg.setAttribute("src", "img/cross.png");
   elImg.setAttribute("width", 16);
   elImg.setAttribute("height", 16);
   elImg.onclick = new Function("objUpdateFlow.removeOptionalLogValuesDataName('" + workId + "')");
  
   var elSpan = document.createElement("span");
   elSpan.innerHTML = fileName;
   elSpan.setAttribute("class", "onclick_node");
   elSpan.onclick = new Function("objUpdateFlow.getUploadFile('" + flowId + "', '" + workId + "', 'optionalLog')");
   
   this.removeOptionalLogValuesDataName(workId);
   
   var elP = document.getElementById(this.idOptionalLogValues(workId));
   elP.appendChild(elImg);  
   elP.appendChild(elSpan); 
  } 
  
  this.optionalLogValuesFileName = fileName;    
 };
 
 
 
 //
 // 表示されている任意ログ設定のデータとファイル名を削除する。 
 //
 this.removeOptionalLogValuesDataName = function (workId){
  var elP = document.getElementById(this.idOptionalLogValues(workId));
  var chileElementList = elP.childNodes;
  
  for(var i = chileElementList.length - 1; i >= 0; i --){
   elP.removeChild(chileElementList[i]);
  }
  
  this.optionalLogValuesFileName = "";
  this.optionalLogData = "";
 };
 
 
 
 //
 // アップロードしたファイルをダウンロードする。
 //
 this.getUploadFile = function (flowId, boxId, type){
  window.location = "/cgi-bin/TelnetmanWF/get_upload_file.cgi?flow_id=" + flowId + "&box_id=" + boxId + "&type=" + type;
 };
 
 
 
 //
 // アップロードファイルも含め、flow の全データのZIP をダウンロードする。
 //
 this.getAllData = function (){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/make_all_data.cgi",
    data : {
     "flow_id" : flowId
    },
    success : function (jsonResult) {
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId = hashResult["flow_id"];
        window.location = "/cgi-bin/TelnetmanWF/get_all_data.cgi?flow_id=" + flowId;
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // terminal のタイトル、説明を取得、表示する。
 //
 this.getTerminalData = function (terminalId){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   this.selectedBoxId = terminalId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/get_terminal_data.cgi",
    data : {
     "flow_id" : flowId,
     "terminal_id" : terminalId
    },
    success : function (jsonResult) {
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId      = hashResult["flow_id"];
        var terminalId  = hashResult["terminal_id"];
        var title       = hashResult["title"];
        var description = hashResult["description"];
        var updateTime  = hashResult["update_time"];
        
        var elTable = document.createElement("table");
        elTable.setAttribute("id", objUpdateFlow.idTable(terminalId));
        
        
        var elTr0 = document.createElement("tr");
        var elTd0 = document.createElement("td");
        elTd0.setAttribute("colspan", 2);
        elTd0.setAttribute("class", "center");
        var elButton0    = document.createElement("button");
        elButton0.setAttribute("class", "enable");
        elButton0.innerHTML = "更新";
        elButton0.onclick = new Function("objUpdateFlow.updateTerminalData('" + terminalId + "')");
        var elButton1    = document.createElement("button");
        elButton1.setAttribute("class", "enable");
        elButton1.innerHTML = "削除";
        elButton1.onclick = new Function("objUpdateFlow.removeBox('" + terminalId + "')");
        elTd0.appendChild(elButton0);
        elTd0.appendChild(elButton1);
        elTr0.appendChild(elTd0);
        
        
        var elTr1    = document.createElement("tr");
        var elTd11   = document.createElement("td");
        var elTd12   = document.createElement("td");
        var elSpan11 = document.createElement("span");
        var elSpan12 = document.createElement("span");
        elSpan11.innerHTML = "更新時刻";
        elSpan12.innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        elSpan12.setAttribute("id", objUpdateFlow.idUpdateTime(terminalId));
        elTd11.appendChild(elSpan11);
        elTd12.appendChild(elSpan12);
        elTr1.appendChild(elTd11);
        elTr1.appendChild(elTd12);
        
        
        var elTr2     = document.createElement("tr");
        var elTd21    = document.createElement("td");
        var elTd22    = document.createElement("td");
        var elSpan21  = document.createElement("span");
        var elInput22 = document.createElement("input");
        elSpan21.innerHTML = "タイトル";
        elInput22.setAttribute("type", "text");
        //elInput22.setAttribute("size", 26);
        elInput22.style.width = "162px";
        elInput22.setAttribute("id", objUpdateFlow.idInputTitle(terminalId));
        elInput22.setAttribute("value", title);
        elInput22.setAttribute("spellcheck", "false");
        elInput22.setAttribute("autocomplete", "off");
        elTd21.appendChild(elSpan21);
        elTd22.appendChild(elInput22);
        elTr2.appendChild(elTd21);
        elTr2.appendChild(elTd22);
        
        
        var elTr3        = document.createElement("tr");
        var elTd31       = document.createElement("td");
        var elTd32       = document.createElement("td");
        var elSpan31     = document.createElement("span");
        var elTextarea32 = document.createElement("textarea");
        elSpan31.innerHTML = "説明";
        elTextarea32.setAttribute("id", objUpdateFlow.idTextAreaDescription(terminalId));
        //elTextarea32.setAttribute("cols", 26);
        //elTextarea32.setAttribute("rows", 6);
        elTextarea32.style.width = "162px";
        elTextarea32.style.height = "72px";
        elTextarea32.value = description;
        elTextarea32.setAttribute("spellcheck", "false");
        elTextarea32.setAttribute("autocomplete", "off");
        elTd31.appendChild(elSpan31);
        elTd32.appendChild(elTextarea32);
        elTr3.appendChild(elTd31);
        elTr3.appendChild(elTd32);
        
        
        elTable.appendChild(elTr1);
        elTable.appendChild(elTr2);
        elTable.appendChild(elTr3);
        elTable.appendChild(elTr0);
        
        document.getElementById(objUpdateFlow.idBoxDataArea).appendChild(elTable);
        
        objTelnetmanWorkFlow.changeStroke(terminalId);
        
        var boxDataTableBottom = objUpdateFlow.getBoxDataTableBottom(terminalId);
        objTelnetmanWorkFlow.optimizeWorkflowAreaHeight(boxDataTableBottom);
       }
       else{
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // flow のタイトル、説明、デフォルトのloginInfo  を取得、表示する。
 //
 this.getStartData = function (boxId){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   this.selectedBoxId = boxId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/get_start_data.cgi",
    data : {
     "flow_id" : flowId,
     "box_id" : boxId
    },
    success : function (jsonResult) {
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId      = hashResult["flow_id"];
        var boxId       = hashResult["box_id"];
        var title       = hashResult["title"];
        var description = hashResult["description"];
        var updateTime  = hashResult["update_time"];
        var loginInfo   = hashResult["login_info"];
        var enablePassword = hashResult["enable_password"];
        
        var elTable = document.createElement("table");
        elTable.setAttribute("id", objUpdateFlow.idTable(boxId));
        
        
        var elTr0 = document.createElement("tr");
        var elTd0 = document.createElement("td");
        elTd0.setAttribute("colspan", 2);
        elTd0.setAttribute("class", "center");
        var elButton0    = document.createElement("button");
        elButton0.setAttribute("class", "enable");
        elButton0.innerHTML = "更新";
        elButton0.onclick = new Function("objUpdateFlow.updateStartData('" + boxId + "')");
        elTd0.appendChild(elButton0);
        elTr0.appendChild(elTd0);
        
        
        var elTr1    = document.createElement("tr");
        var elTd11   = document.createElement("td");
        var elTd12   = document.createElement("td");
        var elSpan11 = document.createElement("span");
        var elSpan12 = document.createElement("span");
        elSpan11.innerHTML = "更新時刻";
        elSpan12.innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        elSpan12.setAttribute("id", objUpdateFlow.idUpdateTime(boxId));
        elTd11.appendChild(elSpan11);
        elTd12.appendChild(elSpan12);
        elTr1.appendChild(elTd11);
        elTr1.appendChild(elTd12);
        
        
        var elTr2     = document.createElement("tr");
        var elTd21    = document.createElement("td");
        var elTd22    = document.createElement("td");
        var elSpan21  = document.createElement("span");
        var elInput22 = document.createElement("input");
        elSpan21.innerHTML = "タイトル";
        elInput22.setAttribute("type", "text");
        //elInput22.setAttribute("size", 26);
        elInput22.style.width = "162.px";
        elInput22.setAttribute("id", objUpdateFlow.idInputTitle(boxId));
        elInput22.setAttribute("value", title);
        elInput22.setAttribute("spellcheck", "false");
        elInput22.setAttribute("autocomplete", "off");
        elTd21.appendChild(elSpan21);
        elTd22.appendChild(elInput22);
        elTr2.appendChild(elTd21);
        elTr2.appendChild(elTd22);
        
        
        var elTr3        = document.createElement("tr");
        var elTd31       = document.createElement("td");
        var elTd32       = document.createElement("td");
        var elSpan31     = document.createElement("span");
        var elTextarea32 = document.createElement("textarea");
        elSpan31.innerHTML = "説明";
        elTextarea32.setAttribute("id", objUpdateFlow.idTextAreaDescription(boxId));
        //elTextarea32.setAttribute("cols", 26);
        //elTextarea32.setAttribute("rows", 6);
        elTextarea32.style.width = "162px";
        elTextarea32.style.height = "72px";
        elTextarea32.value = description;
        elTextarea32.setAttribute("spellcheck", "false");
        elTextarea32.setAttribute("autocomplete", "off");
        elTd31.appendChild(elSpan31);
        elTd32.appendChild(elTextarea32);
        elTr3.appendChild(elTd31);
        elTr3.appendChild(elTd32);
        
        
        var elTr6    = document.createElement("tr");
        var elTd61   = document.createElement("td");
        var elTd62   = document.createElement("td");
        var elSpan61 = document.createElement("span");
        var elDiv62  = document.createElement("div");
        elSpan61.innerHTML = "デフォルトのログイン情報";
        elDiv62.setAttribute("class", "drop_area drag_and_drop_zone");
        elDiv62.ondragover = new Function("event", "objCommon.onDragOver(event);");
        elDiv62.ondrop     = new Function("event", "objUpdateFlow.onDropLoginInfoData(event)");
        var elPLoginInfo = document.createElement("p");
        elPLoginInfo.setAttribute("id", objUpdateFlow.idLoginInfo(boxId));
        var elSpanPassword = document.createElement("span");
        elSpanPassword.innerHTML = "enable&nbsp;password&nbsp;:&nbsp;";
        var elInputPassword = document.createElement("input");
        elInputPassword.setAttribute("type", "password");
        elInputPassword.setAttribute("id", objUpdateFlow.idEnablePassword(boxId));
        //elInputPassword.setAttribute("size", 8);
        elInputPassword.style.width = "50px";
        elInputPassword.setAttribute("value", enablePassword);
        elDiv62.appendChild(elPLoginInfo);
        elTd61.appendChild(elSpan61);
        elTd62.appendChild(elDiv62);
        elTd62.appendChild(elSpanPassword);
        elTd62.appendChild(elInputPassword);
        elTr6.appendChild(elTd61);
        elTr6.appendChild(elTd62);
        
        
        elTable.appendChild(elTr1);
        elTable.appendChild(elTr2);
        elTable.appendChild(elTr3);
        elTable.appendChild(elTr6);
        elTable.appendChild(elTr0);
        
        document.getElementById(objUpdateFlow.idBoxDataArea).appendChild(elTable);
        
        objUpdateFlow.addLoginInfoFileName(boxId, loginInfo);
        
        objTelnetmanWorkFlow.changeStroke(boxId);
        
        var boxDataTableBottom = objUpdateFlow.getBoxDataTableBottom(boxId);
        objTelnetmanWorkFlow.optimizeWorkflowAreaHeight(boxDataTableBottom);
       }
       else{
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // work data を更新する。
 //
 this.updateWorkData = function (workId){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   objCommon.lockScreen();
   var header = objCommon.makeHttpHeader();
   
   var jsonFlowData = this.makeFlowData();
   
   var workTitle       = document.getElementById(this.idInputTitle(workId)).value;
   var workDescription = document.getElementById(this.idTextAreaDescription(workId)).value;
   var enablePassword  = document.getElementById(this.idEnablePassword(workId)).value;
   var useParameterSheet  = 0;
   var bondParameterSheet = 0;
   
   if(document.getElementById(this.idInputParameterSheet(workId, 1)).checked === true){
    useParameterSheet = 1;
   }
   
   if(document.getElementById(this.idInputOkLog(workId, 1)).checked === true){
    bondParameterSheet = 1;
   }
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/update_work.cgi",
    data : {
     "flow_id" : flowId,
     "flow_data" : jsonFlowData,
     "work_id" : workId,
     "work_title"       : workTitle ,
     "work_description" : workDescription,
     "use_parameter_sheet" : useParameterSheet,
     "bond_parameter_sheet" : bondParameterSheet,
     "flowchart_before_file_name" : this.flowchartFileName["before"],
     "flowchart_middle_file_name" : this.flowchartFileName["middle"],
     "flowchart_after_file_name"  : this.flowchartFileName["after"],
     "flowchart_before_data" : this.flowchartData["before"],
     "flowchart_middle_data" : this.flowchartData["middle"],
     "flowchart_after_data"  : this.flowchartData["after"],
     "login_info_file_name" : this.loginInfoFileName,
     "login_info_data"      : this.loginInfoData,
     "enable_password"      : enablePassword,
     "syslog_value_file_name" : this.syslogValuesFileName,
     "syslog_value_data"      : this.syslogValuesData,
     "diff_values_file_name" : this.diffValuesFileName,
     "diff_values_data"      : this.diffValuesData,
     "optional_log_values_file_name" : this.optionalLogValuesFileName,
     "optional_log_values_data" : this.optionalLogData
    },
    success : function (jsonResult) {
     objCommon.unlockScreen();
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId = hashResult["flow_id"];
        var workId = hashResult["work_id"];
        var title  = hashResult["work_title"];
        var updateTime = hashResult["update_time"];
        
        objTelnetmanWorkFlow.updateTitle(workId, title);
        document.getElementById(objUpdateFlow.idUpdateTime(workId)).innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
       }
       else{
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
     objCommon.unlockScreen();
    }
   });
  }
 };
 
 
 
 //
 // case data を更新する。
 //
 this.updateCaseData = function (caseId, nextBoxId){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   objCommon.lockScreen();
   var header = objCommon.makeHttpHeader();
   
   var caseTitle       = document.getElementById(this.idInputTitle(caseId)).value;
   var caseDescription = document.getElementById(this.idTextAreaDescription(caseId)).value;
   
   var parameterConditions = objParameterConditions.getParameterConditions();
   var jsonParameterConditions = JSON.stringify(parameterConditions);
   
   var linkLabelList = objParameterConditions.getLinkLabelList();
   var jsonLinkLabelList = JSON.stringify(linkLabelList);
   
   objTelnetmanWorkFlow.optimizeCaseData(caseId);
   var jsonFlowData = this.makeFlowData();
   
   if((nextBoxId === null) || (nextBoxId === undefined)){
    nextBoxId = '';
   }
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/update_case.cgi",
    data : {
     "flow_id" : flowId,
     "flow_data" : jsonFlowData,
     "case_id" : caseId,
     "case_title"       : caseTitle ,
     "case_description" : caseDescription,
     "json_link_label_list" : jsonLinkLabelList,
     "json_parameter_conditions" : jsonParameterConditions,
     "next_box_id" : nextBoxId
    },
    success : function (jsonResult) {
     objParameterConditions.changes = false;
     objCommon.unlockScreen();
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId = hashResult["flow_id"];
        var caseId = hashResult["case_id"];
        var title  = hashResult["case_title"];
        var updateTime = hashResult["update_time"];
        var linklabelList = hashResult["link_label_list"];
        var nextBoxId = hashResult["next_box_id"];
        var parameterConditions = hashResult["parameter_conditions"];
        
        objTelnetmanWorkFlow.updateTitle(caseId, title, linklabelList);
        
        if((nextBoxId === null) || (nextBoxId === undefined) || (nextBoxId.length === 0)){
         document.getElementById(objUpdateFlow.idUpdateTime(caseId)).innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        
         objParameterConditions.inputPparameterConditions(parameterConditions);
         objParameterConditions.inputLinkLabelList(linklabelList);
         objParameterConditions.displayConditions();
        }
        else{
         objParameterConditions.initialize();
         objUpdateFlow.getBoxData(nextBoxId);
        }
       }
       else{
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       objParameterConditions.changes = false;
       alert("CGI Error");
      }
     }
    },
    error : function (){
     objParameterConditions.changes = false;
     alert("Server Error");
     objCommon.unlockScreen();
    }
   });
  }
 };
 
 
 
 
 //
 // box を削除する。
 //
 this.removeBox = function (boxId){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   if(confirm("本当に削除しますか?")){
    var header = objCommon.makeHttpHeader();
    
    objTelnetmanWorkFlow.removeBox(boxId);
    var jsonFlowData = this.makeFlowData();
    
    $.ajax({
     headers : {"TelnetmanWF" : header},
     type : "post",
     url  : "/cgi-bin/TelnetmanWF/inactivate_box.cgi",
     data : {
      "flow_id"   : flowId,
      "flow_data" : jsonFlowData,
      "box_id"    : boxId
     },
     success : function (jsonResult) {
      
      if((jsonResult !== null) && (jsonResult !== undefined)){
       var hashResult = null;
       
       try{
        hashResult = JSON.parse(jsonResult);
       }
       catch(error){
        
       }
       
       if(hashResult !== null){
        var result = hashResult["result"];
        
        if(result === 1){
         var flowId = hashResult["flow_id"];
         var boxId = hashResult["box_id"];
         var updateTime = hashResult["update_time"];
         
         objUpdateFlow.getBoxData(objTelnetmanWorkFlow.idStartCircle);
        }
        else{
         var reason = hashResult["reason"];
         alert(reason);
        }
       }
       else{
        alert("CGI Error");
       }
      }
     },
     error : function (){
      alert("Server Error");
     }
    });
   }
  }
 };
 
 
 
 //
 // flow のタイトル、説明、デフォルトのログイン情報を更新する。
 //
 this.updateStartData = function (boxId){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   objCommon.lockScreen();
   var header = objCommon.makeHttpHeader();
   
   var jsonFlowData = this.makeFlowData();
   
   var flowTitle       = document.getElementById(this.idInputTitle(boxId)).value;
   var flowDescription = document.getElementById(this.idTextAreaDescription(boxId)).value;
   var enablePassword  = document.getElementById(this.idEnablePassword(boxId)).value;
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/update_start.cgi",
    data : {
     "flow_id" : flowId,
     "flow_data" : jsonFlowData,
     "box_id" : boxId,
     "flow_title"       : flowTitle ,
     "flow_description" : flowDescription,
     "default_login_info_file_name" : this.loginInfoFileName,
     "default_login_info_data"      : this.loginInfoData,
     "enable_password"              : enablePassword
    },
    success : function (jsonResult) {
     objCommon.unlockScreen();
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId = hashResult["flow_id"];
        var boxId  = hashResult["box_id"];
        var updateTime = hashResult["update_time"];
        
        document.getElementById(objUpdateFlow.idUpdateTime(boxId)).innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
       }
       else{
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
     objCommon.unlockScreen();
    }
   });
  }
 };
 
 
 
 //
 // terminal のタイトル、説明を更新する。
 //
 this.updateTerminalData = function (terminalId){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   objCommon.lockScreen();
   var header = objCommon.makeHttpHeader();
   
   var jsonFlowData = this.makeFlowData();
   
   var terminalTitle       = document.getElementById(this.idInputTitle(terminalId)).value;
   var terminalDescription = document.getElementById(this.idTextAreaDescription(terminalId)).value;

   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/update_terminal.cgi",
    data : {
     "flow_id" : flowId,
     "flow_data" : jsonFlowData,
     "terminal_id"           : terminalId,
     "terminal_title"       : terminalTitle ,
     "terminal_description" : terminalDescription
    },
    success : function (jsonResult) {
     objCommon.unlockScreen();
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId     = hashResult["flow_id"];
        var terminalId = hashResult["terminal_id"];
        var terminalTitle = hashResult["terminal_title"];
        var updateTime = hashResult["update_time"];
        
        objTelnetmanWorkFlow.updateTitle(terminalId, terminalTitle );
        document.getElementById(objUpdateFlow.idUpdateTime(terminalId)).innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
       }
       else{
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
     objCommon.unlockScreen();
    }
   });
  }
 };
 
 
 
 //
 // flow の配置データのJSON を作る。
 //
 this.makeFlowData = function (){
  var dataList = objTelnetmanWorkFlow.getConfiguration();
  
  var jsonStartData        = dataList["json_start_data"];
  var jsonGoalData         = dataList["json_goal_data"];
  var jsonWorkDataList     = dataList["json_word_data_list"];
  var jsonCaseDataList     = dataList["json_case_data_list"];
  var jsonTerminalDataList = dataList["json_terminal_data_list"];
  var paperHeight          = dataList["paper_height"];
  var startData        = JSON.parse(jsonStartData);
  var goalData         = JSON.parse(jsonGoalData);
  var workDataList     = JSON.parse(jsonWorkDataList);
  var caseDataList     = JSON.parse(jsonCaseDataList);
  var terminalDataList = JSON.parse(jsonTerminalDataList);
  
  for(var workId in workDataList){
   delete(workDataList[workId]["title"]);
  }
  
  for(var caseId in caseDataList){
   delete(caseDataList[caseId]["title"]);
   delete(caseDataList[caseId]["link_label_list"]);
   
   for(var i = caseDataList[caseId]["link_target_list"].length - 1; i >= 0; i --){
    if(caseDataList[caseId]["link_target_list"][i] === null){
     caseDataList[caseId]["link_target_list"].splice(i, 1);
     caseDataList[caseId]["link_label_list"].splice(i, 1);
     caseDataList[caseId]["link_vertices_list"].splice(i, 1);
    }
   }
  }
  
  for(var terminalId in terminalDataList){
   delete(terminalDataList[terminalId]["title"]);
  }
  
  var flowData = new Object();
  flowData["start_data"]    = startData;
  flowData["goal_data"]     = goalData;
  flowData["paper_height"]  = paperHeight;
  flowData["work_list"]     = workDataList;
  flowData["case_list"]     = caseDataList;
  flowData["terminal_list"] = terminalDataList;
  
  var jsonFlowData = JSON.stringify(flowData);
  
  return(jsonFlowData);
 };
 
 
 // enable password 一括変更
 this.updateEnablePassword = function (){
  var flowId = objControleStorageS.getFlowId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   objCommon.lockScreen();
   var header = objCommon.makeHttpHeader();
   
   var enablePassword = document.getElementById("enable_password").value;
  
   if((enablePassword === null) || (enablePassword === undefined)){
    enablePassword = "";
   }
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/update_enable_password.cgi",
    data : {
     "flow_id" : flowId,
     "enable_password" : enablePassword
    },
    success : function (jsonResult) {
     objCommon.unlockScreen();
     
     if((jsonResult !== null) && (jsonResult !== undefined)){
      var hashResult = null;
      
      try{
       hashResult = JSON.parse(jsonResult);
      }
      catch(error){
       
      }
      
      if(hashResult !== null){
       var result = hashResult["result"];
       
       if(result === 1){
        var flowId = hashResult["flow_id"];
        var enablePassword = hashResult["enable_password"];
        var boxIdList = hashResult["box_id_list"];
        boxIdList.push(objTelnetmanWorkFlow.idStartCircle);
        
        for(var i = 0, j = boxIdList.length; i < j; i ++){
         var boxId = boxIdList[i];
         var id = objUpdateFlow.idEnablePassword(boxId);
         
         if(document.getElementById(id)){
          document.getElementById(id).value = enablePassword;
          break;
         }
        }
        
        document.getElementById("enable_password").value = "";
       }
       else{
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       alert("CGI Error");
      }
     }
    },
    error : function (){
     alert("Server Error");
     objCommon.unlockScreen();
    }
   });
  }
 };
  
 return(this);
}

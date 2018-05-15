// 説明   : task の実行画面。
// 作成日 : 2015/05/17
// 作成者 : 江野高広
// 更新 2015/12/01 : リハーサルモードを使えるように。

var objUpdateTask = new updateTask();

function updateTask (){
 // start, work. case を実行できる状態かどうか。
 this.exec = true;
 
 // ノードリスト
 // key : ノード
 // value : 1 : exec 対象
 //         0 : through 対象
 this.nodeList = new Object();
 
 // checkStatus() をsetInterval に入れた時のID
 this.intervalId = "";
 
 // 選択中のbox id
 this.selectedBoxId = "";
 
 // パラメーターシートを取り込む必要があるかどうか。
 this.useParameterSheet = false;
 
 this.idBoxDataArea = "box_data_area";
 
 this.idParameterSheetArea = "parameter_sheet_area";
 
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
 
 // 選択中のbox のログインID の表示領域のid
 this.idInputLoginUser = function (boxId){
  return("input_login_user_" + boxId);
 };
 
 // 入力済みのログインuser 一覧のid
 this.idDatalistLoginUser = function (workId){
  return("datalist_login_user_" + workId);
 };
 
 // 選択中のbox のログインPassword の表示領域のid
 this.idInputLoginPassword = function (boxId){
  return("input_login_password_" + boxId);
 };
 
 // 選択中のbox のログイン情報の表示領域のid
 this.idParameterSheet = function(boxId){
  return("p_login_info_" + boxId);
 };
 
 // 引き継がれたパラメーターシートの表示id
 this.idTakeOverParameterSheet = function(boxId){
  return("take_over_parameter_sheet_" + boxId);
 };
 
 // パラメーターシートの削除ボタンのid
 this.idDeleteParameterSheet = function(boxId) {
  return("delete_parameter_sheet_" + boxId);
 };
 
 // node list のul タグのid
 this.idNodeList = function (workId){
  return("node_list_" + workId);
 };
 
 // node list のcheckbox のid
 this.idNodeCheckBox = function (node){
  return("node_checkbox_" + node);
 };
 
 // node list の手動OK, NG 判定のradio button のid
 this.idRadioOkNg = function (node, okNg){
  var id = "node_radio_" + node;
  
  if((okNg !== null) && (okNg !== undefined) && (okNg.length > 0)){
   return(id + "_" + okNg);
  }
  else{
   return(id);
  }
 };
 
 // 選択中のbox の実行ボタンのid
 this.idButtonExec = function (boxId){
  return("button_exec_" + boxId);
 };
 
 // work のthrough ボタンのid
 this.idButtonThrough = function (workId){
  return("button_through_" + workId);
 };
 
 // 過去ログ表示エリアのid
 this.idLogList = function (workId) {
  return("log_list_" + workId);
 };
 
 // ドロップされたパラメーターシートのファイル名と内容。
 this.parameterSheetFileName = "";
 this.parameterSheetData = "";
 
 // loading message のid
 this.idLockScreenMessage = 'loading_message';
 
 
 //
 // loading message を変更する。
 //
 this.changeLoadingMessage = function (html){
  document.getElementById(this.idLockScreenMessage).innerHTML = html;
 };
 
 
 //
 // Telnetman のログイン情報を入れ込む。
 //
 this.telnetmanLoginInfo = function (){
  var telnetmanLoginUser     = objControleStorageL.getTelnetmanLoginUser();
  var telnetmanLoginPassword = objControleStorageL.getTelnetmanLoginPassword();
  
  document.getElementById("telnetman_login_user").value = telnetmanLoginUser;
  document.getElementById("telnetman_login_password").value = telnetmanLoginPassword;
 };
 
 
 //
 // 対象flow のid とtask id とpassword をsession storage に入れる。
 //
 this.setFlowIdAndTaskIdAndPassword = function (){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  var taskPassword = objControleStorageS.getTaskPassword();
  
  if(flowId.length === 0){
   flowId = objControleStorageL.getFlowId();
   
   if(flowId.length > 0){
    objControleStorageS.setFlowId(flowId);
    objControleStorageL.removeFlowId();
   }
  }
  
  if(taskId.length === 0){
   taskId = objControleStorageL.getTaskId();
   
   if(taskId.length > 0){
    objControleStorageS.setTaskId(taskId);
    objControleStorageL.removeTaskId();
   }
  }
  
  if(taskPassword.length === 0){
   taskPassword = objControleStorageL.getTaskPassword();
   
   if(taskPassword.length > 0){
    objControleStorageS.setTaskPassword(taskPassword);
    objControleStorageL.removeTaskPassword();
   }
  }
  
  objControleStorageS.setPageType('task');
  objTelnetmanWorkFlow.getFlowData();
 };
 
 
 
 
 //
 // box data を取得、表示する。
 //
 this.getBoxData = function (boxId){
  if(this.exec){
   if(boxId !== this.selectedBoxId){
    
    if(this.selectedBoxId.length > 0){
     var elTable = document.getElementById(this.idTable(this.selectedBoxId));
     document.getElementById(this.idBoxDataArea).removeChild(elTable);
     
     objTelnetmanWorkFlow.returnStroke(this.selectedBoxId);
     
     this.parameterSheetFileName = "";
     this.parameterSheetData = "";
    }
    
    if(boxId.match(/^work_/)){
     this.getWorkData(boxId);
    }
    else if(boxId.match(/^case_/)){
     this.getCaseData(boxId);
    }
    else if(boxId.match(/^start_/)){
     this.getTaskData(boxId);
    }
    else if(boxId.match(/^goal_/)){
     this.getGoalData(boxId);
    }
    else if(boxId.match(/^terminal_/)){
     this.getTerminalData(boxId);
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
 // スタートボタンを押せたり押せなくなるようにする。
 //
 this.changeStartButtonStatus = function (boxId){
  var elButton = document.getElementById(this.idButtonExec(boxId));
  
  if(this.exec && (this.parameterSheetFileName.length > 0)){
   elButton.className = "enable";
   elButton.onclick = new Function("objUpdateTask.startTask('" + boxId + "')");
  }
  else{
   elButton.className = "disable";
   elButton.onclick = null;
  }
 };
 
 
 
 //
 // case のexec ボタンを押せたり押せなくなるようにする。
 //
 this.changeCaseButtonStatus = function (caseId, existsParameterSheet){
  var elButton = document.getElementById(this.idButtonExec(caseId));
  
  if(this.exec && (existsParameterSheet === 1)){
   elButton.className = "enable";
   elButton.onclick = new Function("objUpdateTask.execCase('" + caseId + "')");
  }
  else{
   elButton.className = "disable";
   elButton.onclick = null;
  }
 };
 
 
 
 //
 // work のexec ボタンを押せたり押せなくなるようにする。
 //
 this.changeWorkButtonStatus = function (workId, existsParameterSheet, existsFlowchartData){
  var elExecButton = document.getElementById(this.idButtonExec(workId));
  var elThroughButton = document.getElementById(this.idButtonThrough(workId));
  
  if(this.exec && (existsParameterSheet === 1)){
   elExecButton.className = "enable";
   elThroughButton.className = "enable";
   elThroughButton.onclick = new Function("objUpdateTask.throughWork('" + workId + "')");
   
   if((existsFlowchartData !== null) && (existsFlowchartData !== undefined) && (existsFlowchartData === 1)){
    elExecButton.onclick = new Function("objUpdateTask.execWork('" + workId + "')");
   }
   else if((existsFlowchartData !== null) && (existsFlowchartData !== undefined) && (existsFlowchartData === 0)){
    elExecButton.onclick = new Function("objUpdateTask.manualExecWork('" + workId + "')");
   }
  }
  else{
   elExecButton.className = "disable";
   elExecButton.onclick = null;
   elThroughButton.className = "disable";
   elThroughButton.onclick = null;
  }
 };
 
 
 
 //
 // task のタイトルなどを取得する。
 //
 this.getTaskData = function (boxId){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   this.selectedBoxId = boxId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/get_task_data.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
     "box_id"  : boxId
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
        var taskId      = hashResult["task_id"];
        var boxId       = hashResult["box_id"];
        var title       = hashResult["title"];
        var description = hashResult["description"];
        var updateTime  = hashResult["update_time"];
        var status      = hashResult["status"];
        
        description = objCommon.convertHtml(description);
        
        if("login_user" in hashResult){
         var loginUser = hashResult["login_user"];
         objControleStorageS.setLoginUser(loginUser);
        }
        
        var elTable = document.createElement("table");
        elTable.setAttribute("id", objUpdateTask.idTable(boxId));
        
        var elTr0 = document.createElement("tr");
        var elTd0 = document.createElement("td");
        elTd0.setAttribute("colspan", 2);
        elTd0.setAttribute("class", "center");
        var elButton0 = document.createElement("button");
        elButton0.setAttribute("id", objUpdateTask.idButtonExec(boxId));
        elButton0.innerHTML = "start";
        elTd0.appendChild(elButton0);
        elTr0.appendChild(elTd0);
        
        
        var elTr1    = document.createElement("tr");
        var elTd11   = document.createElement("td");
        var elTd12   = document.createElement("td");
        var elSpan11 = document.createElement("span");
        var elSpan12 = document.createElement("span");
        elSpan11.innerHTML = "最終スタート時刻";
        if(status !== 0){
         elSpan12.innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        }
        else{
         elSpan12.innerHTML = "-"; 
        }
        elSpan12.setAttribute("id", objUpdateTask.idUpdateTime(boxId));
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
        elInput22.style.width = "150px";
        //elInput22.setAttribute("size", 26);
        elInput22.setAttribute("id", objUpdateTask.idInputTitle(boxId));
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
        elTextarea32.setAttribute("id", objUpdateTask.idTextAreaDescription(boxId));
        elTextarea32.style.width = "170px";
        elTextarea32.style.height = "100px";
        //elTextarea32.setAttribute("cols", 26);
        //elTextarea32.setAttribute("rows", 6);
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
        elSpan41.innerHTML = "パラメーターシート";
        elDiv42.setAttribute("class", "drop_area parameter_sheet_data_div");
        elDiv42.ondragover = new Function("event", "objCommon.onDragOver(event);");
        elDiv42.ondrop     = new Function("event", "objUpdateTask.onDropParameterSheetData(event)");
        var elPLoginInfo = document.createElement("p");
        elPLoginInfo.setAttribute("id", objUpdateTask.idParameterSheet(boxId));
        elDiv42.appendChild(elPLoginInfo);
        elTd41.appendChild(elSpan41);
        elTd42.appendChild(elDiv42);
        elTr4.appendChild(elTd41);
        elTr4.appendChild(elTd42);
        
        
        elTable.appendChild(elTr1);
        elTable.appendChild(elTr2);
        elTable.appendChild(elTr3);
        elTable.appendChild(elTr4);
        elTable.appendChild(elTr0);
        
        document.getElementById(objUpdateTask.idBoxDataArea).appendChild(elTable);
        objUpdateTask.changeStartButtonStatus(boxId);
        
        objTelnetmanWorkFlow.changeStroke(boxId);
        
        var boxDataTableBottom = objUpdateTask.getBoxDataTableBottom(boxId);
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
 // ドロップされたパラメーターシートを読み取る。
 //
 this.onDropParameterSheetData = function(event){
  var files = event.dataTransfer.files;
  
  if((files[0].name.match(/^Telnetman2_parameter_/)) && (files[0].name.match(/\.csv$/))){
   // FileReaderオブジェクトの生成。
   var reader = new FileReader();
   reader.name = files[0].name;
   
   // ファイル読取が完了した際に呼ばれる処理を定義。
   reader.onload = function (event) {
    var boxId = objUpdateTask.selectedBoxId;
    var fileName          = event.target.name;
    var csvParameterSheet = event.target.result;
    
    objUpdateTask.addParameterSheetName(boxId, fileName);
    
    var parameters = new Array();
    csvParameterSheet = csvParameterSheet.replace(/\r/g, "");
    var rows = csvParameterSheet.split("\n");
    
    for(var i = 0, j = rows.length; i < j; i ++){
     
     if((rows[i].length === 0) || rows[i].match(/^#/)){
      continue;
     }
     
     var cols = null;
     if(rows[i].match(/\t/)){
      cols = rows[i].split("\t");
     }
     else{
      cols = rows[i].split(",");
     }
     
     parameters[i] = new Array();
     
     while(cols.length > 0){
      var value = cols.shift();
      
      if((value === null) || (value === undefined)){
       value = "";
      }
      
      parameters[i].push(value);
     }
    }
    
    objUpdateTask.parameterSheetData = JSON.stringify(parameters);
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
 this.addParameterSheetName = function (boxId, fileName){
  if(fileName.length > 0){
   var elImg = document.createElement("img");
   elImg.setAttribute("src", "img/cross.png");
   elImg.setAttribute("width", 16);
   elImg.setAttribute("height", 16);
   elImg.onclick = new Function("objUpdateTask.removeParameterSheetName('" + boxId + "')");
  
   var elSpanBefore = document.createElement("span");
   elSpanBefore.innerHTML = fileName;
   
   this.removeParameterSheetName(boxId);
   
   var elP = document.getElementById(this.idParameterSheet(boxId));
   elP.appendChild(elImg);  
   elP.appendChild(elSpanBefore); 
  } 
  
  this.parameterSheetFileName = fileName;
  
  if(boxId.match(/^start_/)){
   this.changeStartButtonStatus(boxId);  
  } 
 };
 
 
 
 //
 // 表示されているパラメーターシートのファイルのファイル名を削除する。 
 //
 this.removeParameterSheetName = function (boxId){
  var elP = document.getElementById(this.idParameterSheet(boxId));
  var chileElementList = elP.childNodes;
  
  for(var i = chileElementList.length - 1; i >= 0; i --){
   elP.removeChild(chileElementList[i]);
  }
  
  this.parameterSheetFileName = "";
  this.parameterSheetData = "";
 };
 
 
 
 //
 // デフォルトのパラメーターシートを指定する。
 //
 this.startTask = function (boxId){
  this.exec = false;
  this.changeStartButtonStatus(boxId);
  
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   this.selectedBoxId = boxId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/start_task.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
     "box_id"  : boxId,
     "json_parameter_sheet" : this.parameterSheetData
    },
    success : function (jsonResult) {
     objUpdateTask.exec = true;
     
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
        var status     = hashResult["status"];
        var flowId     = hashResult["flow_id"];
        var taskId     = hashResult["task_id"];
        var boxId      = hashResult["box_id"];
        var updateTime = hashResult["update_time"];
        var targetList = hashResult["target_list"];
        
        objUpdateTask.removeParameterSheetName(boxId);
        document.getElementById(objUpdateTask.idUpdateTime(boxId)).innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        objUpdateTask.changeStartButtonStatus(objUpdateTask.selectedBoxId);
        
        objTelnetmanWorkFlow.highlightBox(boxId, targetList);
       }
       else{
        var reason = hashResult["reason"];
        objUpdateTask.changeStartButtonStatus(objUpdateTask.selectedBoxId);
        alert(reason);
       }
      }
      else{
       objUpdateTask.exec = true;
       objUpdateTask.changeStartButtonStatus(objUpdateTask.selectedBoxId);
       alert("CGI Error");
      }
     }
    },
    error : function (){
     objUpdateTask.exec = true;
     objUpdateTask.changeStartButtonStatus(objUpdateTask.selectedBoxId);
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // work data を取得、表示する。
 //
 this.getWorkData = function (workId){
  this.useParameterSheet = false;
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   this.selectedBoxId = workId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/view_work_data.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
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
        var flowId               = hashResult["flow_id"];
        var task_id              = hashResult["task_id"];
        var workId               = hashResult["work_id"];
        var status               = hashResult["status"];
        var updateTime           = hashResult["update_time"];      
        var title                = hashResult["title"];
        var description          = hashResult["description"];
        var existsParameterSheet = hashResult["exists_parameter_sheet"];
        var existsFlowchartData  = hashResult["exists_flowchart_data"];
        var isManualSplit = false;
        
        description = objCommon.convertHtml(description);
        
        var elTable = document.createElement("table");
        elTable.setAttribute("id", objUpdateTask.idTable(workId));
        
        var elTr0 = document.createElement("tr");
        var elTd0 = document.createElement("td");
        elTd0.setAttribute("colspan", 2);
        elTd0.setAttribute("class", "center");
        var elButton0    = document.createElement("button");
        elButton0.setAttribute("id", objUpdateTask.idButtonExec(workId));
        elButton0.innerHTML = "exec";
        var elButton1    = document.createElement("button");
        elButton1.setAttribute("id", objUpdateTask.idButtonThrough(workId));
        elButton1.innerHTML = "through";
        elTd0.appendChild(elButton0);
        elTd0.appendChild(elButton1);
        elTr0.appendChild(elTd0);
        
        
        var elTr1    = document.createElement("tr");
        var elTd11   = document.createElement("td");
        var elTd12   = document.createElement("td");
        var elSpan11 = document.createElement("span");
        var elSpan12 = document.createElement("span");
        elSpan11.innerHTML = "更新時刻";
        if(status !== 0){
         elSpan12.innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        }
        else{
         elSpan12.innerHTML = "-"; 
        }
        elSpan12.setAttribute("id", objUpdateTask.idUpdateTime(workId));
        elTd11.appendChild(elSpan11);
        elTd12.appendChild(elSpan12);
        elTr1.appendChild(elTd11);
        elTr1.appendChild(elTd12);
        
        
        var elTr2    = document.createElement("tr");
        var elTd21   = document.createElement("td");
        var elTd22   = document.createElement("td");
        var elSpan21 = document.createElement("span");
        var elSpan22 = document.createElement("span");
        elSpan21.innerHTML = "タイトル";
        elSpan22.innerHTML = title;
        elTd21.appendChild(elSpan21);
        elTd22.appendChild(elSpan22);
        elTr2.appendChild(elTd21);
        elTr2.appendChild(elTd22);
        
        
        var elTr3    = document.createElement("tr");
        var elTd31   = document.createElement("td");
        var elTd32   = document.createElement("td");
        var elSpan31 = document.createElement("span");
        var elSpan32 = document.createElement("span");
        elSpan31.innerHTML = "説明";
        elSpan32.innerHTML = description;
        elTd31.appendChild(elSpan31);
        elTd32.appendChild(elSpan32);
        elTr3.appendChild(elTd31);
        elTr3.appendChild(elTd32);
        
        
        elTable.appendChild(elTr1);
        elTable.appendChild(elTr2);
        elTable.appendChild(elTr3);
        
        
        if(existsParameterSheet === 1){
         var elTr8    = document.createElement("tr");
         var elTd81   = document.createElement("td");
         var elTd82   = document.createElement("td");
         var elSpan81 = document.createElement("span");
         var elSpan82 = document.createElement("span");
         var elImg82  = document.createElement("img");
         elSpan81.innerHTML = "パラメーターシート";
         elSpan82.innerHTML = "Parameter Sheet";
         elSpan82.setAttribute("class", "onclick_node parameter_sheet");
         elSpan82.setAttribute("id", objUpdateTask.idTakeOverParameterSheet(workId));
         elSpan82.onclick = new Function("objUpdateTask.getParameterSheet('" + flowId + "','" + taskId + "','" + workId + "', 0)");
         elImg82.setAttribute("src", "img/cross.png");
         elImg82.setAttribute("width", "16");
         elImg82.setAttribute("height", "16");
         elImg82.setAttribute("alt", "削除");
         elImg82.setAttribute("class", "onclick_node");
         elImg82.setAttribute("id", objUpdateTask.idDeleteParameterSheet(workId));
         elImg82.onclick = new Function("objUpdateTask.deleteParameterSheet('" + workId + "');");
         elTd81.appendChild(elSpan81);
         elTd82.appendChild(elSpan82);
         elTd82.appendChild(elImg82);
         elTr8.appendChild(elTd81);
         elTr8.appendChild(elTd82);
         
         var elTr9    = document.createElement("tr");
         var elTd91   = document.createElement("td");
         var elTd92   = document.createElement("td");
         var elSpan91 = document.createElement("span");
         var elUl92 = document.createElement("ul");
         elUl92.setAttribute("class", "node_list");
         elSpan91.innerHTML = "exec 対象";
         elUl92.setAttribute("id", objUpdateTask.idNodeList(workId));
         elTd91.appendChild(elSpan91);
         elTd92.appendChild(elUl92);
         elTr9.appendChild(elTd91);
         elTr9.appendChild(elTd92);
         
         elTable.appendChild(elTr8);
         elTable.appendChild(elTr9);
        }
        
        
        if(existsFlowchartData === 1){
         var useParameterSheet = hashResult["use_parameter_sheet"];
         var logTimeList       = hashResult["log_time_list"];
         var logTypeList       = hashResult["log_type_list"];
         
         var loginUser = "";
         if("login_user" in hashResult){
          loginUser = hashResult["login_user"];
         }
         var loginPassWord = objControleStorageS.getLoginPassword(loginUser);
         
         var elTr5     = document.createElement("tr");
         var elTd51    = document.createElement("td");
         var elTd52    = document.createElement("td");
         var elSpan51  = document.createElement("span");
         var elInput52 = document.createElement("input");
         elSpan51.innerHTML = "ログインID";
         elInput52.setAttribute("type", "text");
         elInput52.style.width = "130px";
         //elInput52.setAttribute("size", 20);
         elInput52.setAttribute("id", objUpdateTask.idInputLoginUser(workId));
         elInput52.setAttribute("value", loginUser);
         elInput52.setAttribute("list", objUpdateTask.idDatalistLoginUser(workId));
         elInput52.setAttribute("spellcheck", "false");
         elInput52.setAttribute("autocomplete", "off");
         elInput52.onblur = new Function("objUpdateTask.setLoginPassword('" + workId + "')");
         var elDatalist52 = document.createElement("datalist");
         elDatalist52.setAttribute("id", objUpdateTask.idDatalistLoginUser(workId));
         var loginUserList = objControleStorageS.getLoginUser();
         for(var k = 0, l = loginUserList.length; k < l; k ++){
          elOption52 = document.createElement("option");
          elOption52.value = loginUserList[k];
          elDatalist52.appendChild(elOption52);
         }
         elTd51.appendChild(elSpan51);
         elTd52.appendChild(elInput52);
         elTd52.appendChild(elDatalist52);
         elTr5.appendChild(elTd51);
         elTr5.appendChild(elTd52);
         
         
         var elTr6     = document.createElement("tr");
         var elTd61    = document.createElement("td");
         var elTd62    = document.createElement("td");
         var elSpan61  = document.createElement("span");
         var elInput62 = document.createElement("input");
         elSpan61.innerHTML = "ログインPassword";
         elInput62.setAttribute("type", "password");
         elInput62.style.width = "130px";
         //elInput62.setAttribute("size", 20);
         elInput62.setAttribute("id", objUpdateTask.idInputLoginPassword(workId));
         elInput62.setAttribute("value", loginPassWord);
         elTd61.appendChild(elSpan61);
         elTd62.appendChild(elInput62);
         elTr6.appendChild(elTd61);
         elTr6.appendChild(elTd62);
         
         
         var elTr7     = document.createElement("tr");
         var elTd71    = document.createElement("td");
         elTd71.setAttribute("colspan", 2);
         elTd71.setAttribute("id", objUpdateTask.idLogList(workId));
         for(var i = 0, j = logTimeList.length; i < j; i ++){
          var time = logTimeList[i];
          var timeString = time.toString();
          var elementList = objUpdateTask.makeLogList(flowId, taskId, workId, time, logTypeList[timeString]["ok"], logTypeList[timeString]["ng"], logTypeList[timeString]["error"], logTypeList[timeString]["diff"], logTypeList[timeString]["optional"], logTypeList[timeString]["individual_parameter_sheet"]);
          var elP  = elementList[0];
          var elUl = elementList[1];
          
          elTd71.appendChild(elP);
          elTd71.appendChild(elUl);
         }
         elTr7.appendChild(elTd71);
         
         
         if(useParameterSheet === 1){
          objUpdateTask.useParameterSheet = true;
          
          var elTr4    = document.createElement("tr");
          var elTd41   = document.createElement("td");
          var elTd42   = document.createElement("td");
          var elSpan41 = document.createElement("span");
          var elDiv42  = document.createElement("div");
          elSpan41.innerHTML = "個別パラメーターシート";
          elDiv42.setAttribute("class", "drop_area parameter_sheet_data_div");
          elDiv42.ondragover = new Function("event", "objCommon.onDragOver(event);");
          elDiv42.ondrop     = new Function("event", "objUpdateTask.onDropParameterSheetData(event)");
          var elPLoginInfo = document.createElement("p");
          elPLoginInfo.setAttribute("id", objUpdateTask.idParameterSheet(workId));
          elDiv42.appendChild(elPLoginInfo);
          elTd41.appendChild(elSpan41);
          elTd42.appendChild(elDiv42);
          elTr4.appendChild(elTd41);
          elTr4.appendChild(elTd42);
          
          elTable.appendChild(elTr4);
         }
         
         elTable.appendChild(elTr5);
         elTable.appendChild(elTr6);
         elTable.appendChild(elTr0);
         elTable.appendChild(elTr7);
        }
        else if(existsFlowchartData === 0){
         isManualSplit = true;
         elTable.appendChild(elTr0);
        }
         
        document.getElementById(objUpdateTask.idBoxDataArea).appendChild(elTable);
        objUpdateTask.changeWorkButtonStatus(workId, existsParameterSheet, existsFlowchartData);
         
        if(existsParameterSheet === 1){
         var nodeList = hashResult["node_list"];
         objUpdateTask.makeNodeList(workId, nodeList, true, isManualSplit);
        }
        
        if(!objUpdateTask.exec){
         objUpdateTask.disableCheckBox(true);
        }
        
        objTelnetmanWorkFlow.changeStroke(workId);
        
        var boxDataTableBottom = objUpdateTask.getBoxDataTableBottom(workId);
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
 // パスワードを自動入力する。
 //
 this.setLoginPassword = function (workId){
  var loginUser = document.getElementById(objUpdateTask.idInputLoginUser(workId)).value;
  var loginPassword = objControleStorageS.getLoginPassword(loginUser);
  document.getElementById(objUpdateTask.idInputLoginPassword(workId)).value = loginPassword;
 };
 
 
 
 //
 // terminal で表示するノードリストを作る。
 //
 this.makeParameterSheetNodeList = function (flowId, taskId, boxId, nodeList){
  var elUl = document.createElement("ul");
  elUl.setAttribute("class", "node_list");
  
  for(var k = 0, l = nodeList.length; k < l; k ++){
   node = nodeList[k];
   
   var elLi = document.createElement("li");
   var elImg = document.createElement("img");
   elImg.setAttribute("src", "img/file_extension_xls.png");
   elImg.setAttribute("width", "16");
   elImg.setAttribute("height", "16");
   elImg.setAttribute("alt", "parameter sheet");
   elImg.setAttribute("class", "onclick_node");
   elImg.onclick = new Function("objUpdateTask.getParameterSheet('" + flowId + "','" + taskId + "','" + boxId + "', 0, '" + node + "')");
   var elSpan = document.createElement("span");
   elSpan.innerHTML = node;
   
   elLi.appendChild(elImg);
   elLi.appendChild(elSpan);
   
   elUl.appendChild(elLi);
  }
  
  return(elUl);
 };
 
 
 
 //
 // ノードリストの表示内容を最新のものに差し替える。
 //
 this.makeNodeList = function (workId, nodeList, defaultChecked, isManualSplit){
  var elUlNodeList = document.getElementById(this.idNodeList(workId));
  var nodeLiList = elUlNodeList.childNodes;
  
  for(var node in this.nodeList){
   delete(this.nodeList[node]);
  }
  
  for(var i = nodeLiList.length - 1; i >= 0; i --){
   elUlNodeList.removeChild(nodeLiList[i]);
  }
  
  for(var k = 0, l = nodeList.length; k < l; k ++){
   node = nodeList[k];
   this.nodeList[node] = new Object();
   
   if(defaultChecked){
    this.nodeList[node]["exec"] = 1;
   }
   else{
    this.nodeList[node]["exec"] = 0;
   }
   
   var elLi = document.createElement("li");
   var idNode = this.idNodeCheckBox(node);
   var elCheckBox = document.createElement("input");
   elCheckBox.setAttribute("type", "checkbox");
   elCheckBox.setAttribute("id", idNode);
   elCheckBox.setAttribute("value", node);
   elCheckBox.checked = defaultChecked;
   elCheckBox.disabled = false;
   elCheckBox.onchange = new Function("objUpdateTask.changeNodeListStatus('" + node + "');");
   var elLabelNode = document.createElement("label");
   elLabelNode.setAttribute("for", idNode);
   elLabelNode.setAttribute("class", "checkbox1");
   elLabelNode.innerHTML = node;
   
   elLi.appendChild(elCheckBox);
   elLi.appendChild(elLabelNode);
   
   if(isManualSplit){
    var defaultDisabled = true;
    if(defaultChecked){
     defaultDisabled = false;
    }
    
    var elSpan = document.createElement("span");
    elSpan.setAttribute("class", "ok_ng_radio_button");
    
    var nameRadio = this.idRadioOkNg(node);
    
    this.nodeList[node]["ok"] = 0;
    var idRadioOk = this.idRadioOkNg(node, "ok");
    var elRadioButtonOk = document.createElement("input");
    elRadioButtonOk.setAttribute("type", "radio");
    elRadioButtonOk.setAttribute("name", nameRadio);
    elRadioButtonOk.setAttribute("id", idRadioOk);
    elRadioButtonOk.setAttribute("value", "1");
    elRadioButtonOk.checked = false;
    elRadioButtonOk.disabled = defaultDisabled;
    elRadioButtonOk.onchange = new Function("objUpdateTask.changeNodeListOkNg('" + node + "')");
    var elLabelOk = document.createElement("label");
    elLabelOk.setAttribute("for", idRadioOk);
    elLabelOk.innerHTML = "OK";
    
    this.nodeList[node]["ng"] = 0;
    var idRadioNg = this.idRadioOkNg(node, "ng");
    var elRadioButtonNg = document.createElement("input");
    elRadioButtonNg.setAttribute("type", "radio");
    elRadioButtonNg.setAttribute("name", nameRadio);
    elRadioButtonNg.setAttribute("id", idRadioNg);
    elRadioButtonNg.setAttribute("value", "0");
    elRadioButtonNg.checked = false;
    elRadioButtonNg.disabled = defaultDisabled;
    elRadioButtonNg.onchange = new Function("objUpdateTask.changeNodeListOkNg('" + node + "')");
    var elLabelNg = document.createElement("label");
    elLabelNg.setAttribute("for", idRadioNg);
    elLabelNg.innerHTML = "NG";
    
    elSpan.appendChild(elRadioButtonOk);
    elSpan.appendChild(elLabelOk);
    elSpan.appendChild(elRadioButtonNg);
    elSpan.appendChild(elLabelNg);
    
    elLi.appendChild(elSpan);
   }                              
   
   elUlNodeList.appendChild(elLi);
  }
 };
 
 
 
 //
 // ノードのチェック状態を確認してexec 対象、through 対象を変更する。
 //
 this.changeNodeListStatus = function (node){
  var idNode = this.idNodeCheckBox(node);
  var isExec = document.getElementById(idNode).checked;
  
  var idRadioOk = this.idRadioOkNg(node, "ok");
  var idRadioNg = this.idRadioOkNg(node, "ng");
  
  if(isExec){
   this.nodeList[node]["exec"] = 1;
   
   if("ok" in this.nodeList[node]){
    document.getElementById(idRadioOk).disabled = false;
   }
   
   if("ng" in this.nodeList[node]){
    document.getElementById(idRadioNg).disabled = false;
   }
  }
  else{
   this.nodeList[node]["exec"] = 0;
   
   if("ok" in this.nodeList[node]){
    this.nodeList[node]["ok"] = 0;
    document.getElementById(idRadioOk).checked = false;
    document.getElementById(idRadioOk).disabled = true;
   }
   
   if("ng" in this.nodeList[node]){
    this.nodeList[node]["ng"] = 0;
    document.getElementById(idRadioNg).checked = false;
    document.getElementById(idRadioNg).disabled = true;
   }
  }
 };
 
 
 
 //
 // ノードリストの手動OK, NG 判定結果を変更する。
 //
 this.changeNodeListOkNg = function (node){
  var idRadioOk = this.idRadioOkNg(node, "ok");
  var idRadioNg = this.idRadioOkNg(node, "ng");
  var isCheckedOk = document.getElementById(idRadioOk).checked;
  var isCheckedNg = document.getElementById(idRadioNg).checked;
  
  if(isCheckedOk){
   this.nodeList[node]["ok"] = 1;
  }
  else{
   this.nodeList[node]["ok"] = 0;
  }
  
  if(isCheckedNg){
   this.nodeList[node]["ng"] = 1;
  }
  else{
   this.nodeList[node]["ng"] = 0;
  }
 };
 
 
 
 //
 // ノードリストをexec 対象、through 対象に分ける。
 //
 this.checkNodeList = function (){
  var execNodeList    = new Array();
  var throughNodeList = new Array();
  
  for(var node in this.nodeList){
   if(this.nodeList[node]["exec"] === 1){
    execNodeList.push(node);
   }
   else if(this.nodeList[node]["exec"] === 0){
    throughNodeList.push(node);
   }
  }
  
  return([execNodeList, throughNodeList]);
 };
 
 
 
 //
 // ノードリストのcheckbox を押せないように、または、押せるようにする。
 //
 this.disableCheckBox = function (isDisable){
  for(var node in this.nodeList){
   var idNode = this.idNodeCheckBox(node);
   document.getElementById(idNode).disabled = isDisable;
   
   if("ok" in this.nodeList[node]){
    var idRadioOk = this.idRadioOkNg(node, "ok");
    document.getElementById(idRadioOk).disabled = isDisable;
   }
   
   if("ng" in this.nodeList[node]){
    var idRadioNg = this.idRadioOkNg(node, "ng");
    document.getElementById(idRadioNg).disabled = isDisable;
   }
  }
 };
 
 
 
 //
 // case data を取得、表示する。
 //
 this.getCaseData = function (caseId){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   this.selectedBoxId = caseId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/view_case_data.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
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
        var flowId               = hashResult["flow_id"];
        var task_id              = hashResult["task_id"];
        var caseId               = hashResult["case_id"];      
        var title                = hashResult["title"];
        var description          = hashResult["description"];
        var existsParameterSheet = hashResult["exists_parameter_sheet"];
        var status               = hashResult["status"];
        var updateTime           = hashResult["update_time"];
        
        description = objCommon.convertHtml(description);
        
        var elTable = document.createElement("table");
        elTable.setAttribute("id", objUpdateTask.idTable(caseId));
        
        var elTr0 = document.createElement("tr");
        var elTd0 = document.createElement("td");
        elTd0.setAttribute("colspan", 2);
        elTd0.setAttribute("class", "center");
        var elButton0    = document.createElement("button");
        elButton0.setAttribute("id", objUpdateTask.idButtonExec(caseId));
        elButton0.innerHTML = "exec";
        elTd0.appendChild(elButton0);
        elTr0.appendChild(elTd0);
        
        
        var elTr1    = document.createElement("tr");
        var elTd11   = document.createElement("td");
        var elTd12   = document.createElement("td");
        var elSpan11 = document.createElement("span");
        var elSpan12 = document.createElement("span");
        elSpan11.innerHTML = "更新時刻";
        if(status !== 0){
         elSpan12.innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        }
        else{
         elSpan12.innerHTML = "-"; 
        }
        elSpan12.setAttribute("id", objUpdateTask.idUpdateTime(caseId));
        elTd11.appendChild(elSpan11);
        elTd12.appendChild(elSpan12);
        elTr1.appendChild(elTd11);
        elTr1.appendChild(elTd12);
        
        
        var elTr2    = document.createElement("tr");
        var elTd21   = document.createElement("td");
        var elTd22   = document.createElement("td");
        var elSpan21 = document.createElement("span");
        var elSpan22 = document.createElement("span");
        elSpan21.innerHTML = "タイトル";
        elSpan22.innerHTML = title;
        elTd21.appendChild(elSpan21);
        elTd22.appendChild(elSpan22);
        elTr2.appendChild(elTd21);
        elTr2.appendChild(elTd22);
        
        
        var elTr3    = document.createElement("tr");
        var elTd31   = document.createElement("td");
        var elTd32   = document.createElement("td");
        var elSpan31 = document.createElement("span");
        var elSpan32 = document.createElement("span");
        elSpan31.innerHTML = "説明";
        elSpan32.innerHTML = description;
        elTd31.appendChild(elSpan31);
        elTd32.appendChild(elSpan32);
        elTr3.appendChild(elTd31);
        elTr3.appendChild(elTd32);
        
                 
        elTable.appendChild(elTr1);
        elTable.appendChild(elTr2);
        elTable.appendChild(elTr3);

        if(existsParameterSheet === 1){
         var elTr8    = document.createElement("tr");
         var elTd81   = document.createElement("td");
         var elTd82   = document.createElement("td");
         var elSpan81 = document.createElement("span");
         var elSpan82 = document.createElement("span");
         var elImg82 = document.createElement("img");
         elSpan81.innerHTML = "パラメーターシート";
         elSpan82.innerHTML = "Parameter Sheet";
         elSpan82.setAttribute("class", "onclick_node parameter_sheet");
         elSpan82.setAttribute("id", objUpdateTask.idTakeOverParameterSheet(caseId));
         elSpan82.onclick = new Function("objUpdateTask.getParameterSheet('" + flowId + "','" + taskId + "','" + caseId + "', 0)");
         elImg82.setAttribute("src", "img/cross.png");
         elImg82.setAttribute("width", "16");
         elImg82.setAttribute("height", "16");
         elImg82.setAttribute("alt", "削除");
         elImg82.setAttribute("id", objUpdateTask.idDeleteParameterSheet(caseId));
         elImg82.setAttribute("class", "onclick_node");
         elImg82.onclick = new Function("objUpdateTask.deleteParameterSheet('" + caseId + "');");
         elTd81.appendChild(elSpan81);
         elTd82.appendChild(elSpan82);
         elTd82.appendChild(elImg82);
         elTr8.appendChild(elTd81);
         elTr8.appendChild(elTd82);
         elTable.appendChild(elTr8);
        }

        elTable.appendChild(elTr0);

        document.getElementById(objUpdateTask.idBoxDataArea).appendChild(elTable);
        objUpdateTask.changeCaseButtonStatus(caseId, existsParameterSheet);
        
        objTelnetmanWorkFlow.changeStroke(caseId);
        
        var boxDataTableBottom = objUpdateTask.getBoxDataTableBottom(caseId);
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
 // terminal data を取得、表示する。
 //
 this.getTerminalData = function (terminalId){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   this.selectedBoxId = terminalId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/view_terminal_data.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
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
        var flowId               = hashResult["flow_id"];
        var taskId               = hashResult["task_id"];
        var terminalId           = hashResult["terminal_id"];      
        var title                = hashResult["title"];
        var description          = hashResult["description"];
        var existsParameterSheet = hashResult["exists_parameter_sheet"];
        var updateTime           = hashResult["update_time"];
        
        description = objCommon.convertHtml(description);
        
        var elTable = document.createElement("table");
        elTable.setAttribute("id", objUpdateTask.idTable(terminalId));
        
        
        var elTr1    = document.createElement("tr");
        var elTd11   = document.createElement("td");
        var elTd12   = document.createElement("td");
        var elSpan11 = document.createElement("span");
        var elSpan12 = document.createElement("span");
        elSpan11.innerHTML = "更新時刻";
        if(updateTime !== 0){
         elSpan12.innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        }
        else{
         elSpan12.innerHTML = "-"; 
        }
        elSpan12.setAttribute("id", objUpdateTask.idUpdateTime(terminalId));
        elTd11.appendChild(elSpan11);
        elTd12.appendChild(elSpan12);
        elTr1.appendChild(elTd11);
        elTr1.appendChild(elTd12);
        
        
        var elTr2    = document.createElement("tr");
        var elTd21   = document.createElement("td");
        var elTd22   = document.createElement("td");
        var elSpan21 = document.createElement("span");
        var elSpan22 = document.createElement("span");
        elSpan21.innerHTML = "タイトル";
        elSpan22.innerHTML = title;
        elTd21.appendChild(elSpan21);
        elTd22.appendChild(elSpan22);
        elTr2.appendChild(elTd21);
        elTr2.appendChild(elTd22);
        
        
        var elTr3    = document.createElement("tr");
        var elTd31   = document.createElement("td");
        var elTd32   = document.createElement("td");
        var elSpan31 = document.createElement("span");
        var elSpan32 = document.createElement("span");
        elSpan31.innerHTML = "説明";
        elSpan32.innerHTML = description;
        elTd31.appendChild(elSpan31);
        elTd32.appendChild(elSpan32);
        elTr3.appendChild(elTd31);
        elTr3.appendChild(elTd32);
                 
        
        elTable.appendChild(elTr1);
        elTable.appendChild(elTr2);
        elTable.appendChild(elTr3);
        
        
        if(existsParameterSheet === 1){
         var elTr8   = document.createElement("tr");
         var elTd81   = document.createElement("td");
         var elTd82   = document.createElement("td");
         var elSpan81 = document.createElement("span");
         var elSpan82 = document.createElement("span");
         elSpan81.innerHTML = "パラメーターシート";
         elSpan82.innerHTML = "Parameter Sheet";
         elSpan82.setAttribute("class", "onclick_node  parameter_sheet");
         elSpan82.setAttribute("id", objUpdateTask.idTakeOverParameterSheet(terminalId));
         elSpan82.onclick = new Function("objUpdateTask.getParameterSheet('" + flowId + "','" + taskId + "','" + terminalId + "', 0)");
         elTd81.appendChild(elSpan81);
         elTd82.appendChild(elSpan82);
         elTr8.appendChild(elTd81);
         elTr8.appendChild(elTd82);
         
         elTable.appendChild(elTr8);
         
         
         var nodeList = hashResult["node_list"];
         
         var elTr9    = document.createElement("tr");
         var elTd91   = document.createElement("td");
         var elTd92   = document.createElement("td");
         var elSpan91 = document.createElement("span");
         var elUl92 = objUpdateTask.makeParameterSheetNodeList(flowId, taskId, terminalId, nodeList);
         elSpan91.innerHTML = "ノード一覧";
         elTd91.appendChild(elSpan91);
         elTd92.appendChild(elUl92);
         elTr9.appendChild(elTd91);
         elTr9.appendChild(elTd92);
         
         elTable.appendChild(elTr9);
        }
    
        
        document.getElementById(objUpdateTask.idBoxDataArea).appendChild(elTable);
        
        objTelnetmanWorkFlow.changeStroke(terminalId);
        
        var boxDataTableBottom = objUpdateTask.getBoxDataTableBottom(terminalId);
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
 // 1回分の過去ログ一覧を作る。
 //
 this.makeLogList = function (flowId, taskId, workId, time, ok, ng, error, diff, optional, individualParameterSheet){
  var date = objCommon.unixtimeToDate(time, "YYYY/MM/DD hh:mm:ss");
  var timeString = time.toString();
  
  var elP = document.createElement("p");
  elP.innerHTML = date;
  
  var elUl = document.createElement("ul");
  
  var elLiParameterSheet = document.createElement("li");
  var elSpanParameterSheet = document.createElement("span");
  elSpanParameterSheet.innerHTML = "Parameter Sheet";
  elSpanParameterSheet.setAttribute("class", "onclick_node parameter_sheet");
  elSpanParameterSheet.onclick = new Function("objUpdateTask.getParameterSheet('" + flowId + "','" + taskId + "','" + workId + "', " + timeString + ")");
  elLiParameterSheet.appendChild(elSpanParameterSheet);
  elUl.appendChild(elLiParameterSheet);
  
  if(individualParameterSheet === 1){
   var elLiIndividualParameterSheet = document.createElement("li");
   var elSpanIndividualParameterSheet = document.createElement("span");
   elSpanIndividualParameterSheet.innerHTML = "個別パラメーターシート";
   elSpanIndividualParameterSheet.setAttribute("class", "onclick_node parameter_sheet");
   elSpanIndividualParameterSheet.onclick = new Function("objUpdateTask.getParameterSheet('" + flowId + "','" + taskId + "','" + workId + "', " + timeString + ",'',1)");
   elLiIndividualParameterSheet.appendChild(elSpanIndividualParameterSheet);
   elUl.appendChild(elLiIndividualParameterSheet);
  }
  
  if(ok === 1){
   var elLiOk = document.createElement("li");
   var elSpanOk = document.createElement("span");
   elSpanOk.innerHTML = "OK log";
   elSpanOk.setAttribute("class", "onclick_node ok_log");
   elSpanOk.onclick = new Function("objUpdateTask.getLog('" + flowId + "','" + taskId + "','" + workId + "','" + timeString + "','ok');");
   elLiOk.appendChild(elSpanOk);
   elUl.appendChild(elLiOk);
  }
  
  if(ng === 1){
   var elLiNg = document.createElement("li");
   var elSpanNg = document.createElement("span");
   elSpanNg.innerHTML = "NG log";
   elSpanNg.setAttribute("class", "onclick_node ng_log");
   elSpanNg.onclick = new Function("objUpdateTask.getLog('" + flowId + "','" + taskId + "','" + workId + "','" + timeString + "','ng');");
   elLiNg.appendChild(elSpanNg);
   elUl.appendChild(elLiNg);
  }
  
  if(error === 1){
   var elLiError = document.createElement("li");
   var elSpanError = document.createElement("span");
   elSpanError.innerHTML = "Error log";
   elSpanError.setAttribute("class", "onclick_node error_log");
   elSpanError.onclick = new Function("objUpdateTask.getLog('" + flowId + "','" + taskId + "','" + workId + "','" + timeString + "','error');");
   elLiError.appendChild(elSpanError);
   elUl.appendChild(elLiError);
  }
  
  if(diff === 1){
   var elLiDiff = document.createElement("li");
   var elSpanDiff = document.createElement("span");
   elSpanDiff.innerHTML = "Diff log";
   elSpanDiff.setAttribute("class", "onclick_node diff_log");
   elSpanDiff.onclick = new Function("objUpdateTask.getLog('" + flowId + "','" + taskId + "','" + workId + "','" + timeString + "','diff');");
   elLiDiff.appendChild(elSpanDiff);
   elUl.appendChild(elLiDiff);
  }
  
  if(optional === 1){
   var elLiOptionalLog = document.createElement("li");
   var elSpanOptionalLog = document.createElement("span");
   elSpanOptionalLog.innerHTML = "Optional log";
   elSpanOptionalLog.setAttribute("class", "onclick_node optional_log");
   elSpanOptionalLog.onclick = new Function("objUpdateTask.getLog('" + flowId + "','" + taskId + "','" + workId + "','" + timeString + "','optional');");
   elLiOptionalLog.appendChild(elSpanOptionalLog);
   elUl.appendChild(elLiOptionalLog);
  }

  return([elP, elUl]);
 };
 
 
 
 //
 // log をダウンロードする。
 //
 this.getLog = function (flowId, taskId, workId, timeString, type){
  window.location = "/cgi-bin/TelnetmanWF/get_log.cgi?flow_id=" + flowId + "&task_id=" + taskId + "&work_id=" + workId + "&time=" + timeString + "&type=" + type;
 };
 
 //
 // パラメーターシートをダウンロードする。
 //
 this.getParameterSheet = function (flowId, taskId, boxId, timeString, node, individual){
  if((node === null) || (node === undefined)){
   node = "";
  }
  
  if((individual === null) || (individual === undefined)){
   individual = "";
  }
  
  window.location = "/cgi-bin/TelnetmanWF/get_parameter_sheet.cgi?flow_id=" + flowId + "&task_id=" + taskId + "&box_id=" + boxId + "&time=" + timeString + "&node=" + node + "&individual=" + individual;
 };
 
 
 
 //
 // work を実行する。
 //
 this.execWork = function (workId){
  if(this.useParameterSheet && (this.parameterSheetData.length === 0)){
   alert("個別パラメーターシートを取り込んで下さい。");
  }
  else{
   var flowId       = objControleStorageS.getFlowId();
   var taskId       = objControleStorageS.getTaskId();
   
   if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
    objCommon.lockScreen("<div id='" + this.idLockScreenMessage + "'><img src='img/loading_1.gif' width='54' height='55' alt='loading'></div>");
    
    this.exec = false;
    this.changeWorkButtonStatus(workId, 1, 1);
    
    this.disableCheckBox(true);
    
    var checkedNodeList = this.checkNodeList();
    var execNodeList    = checkedNodeList[0];
    var throughNodeList = checkedNodeList[1];
    var jsonExecNodeList    = JSON.stringify(execNodeList);
    var jsonThroughNodeList = JSON.stringify(throughNodeList);
    
    var header = objCommon.makeHttpHeader();
    
    var user     = document.getElementById(this.idInputLoginUser(workId)).value;
    var password = document.getElementById(this.idInputLoginPassword(workId)).value;
    var telnetmanLoginUser     = objControleStorageL.getTelnetmanLoginUser();
    var telnetmanLoginPassword = objControleStorageL.getTelnetmanLoginPassword();
    
    objControleStorageS.setLoginUser(user);
    objControleStorageS.setLoginPassword(user, password);
    
    $.ajax({
     headers : {"TelnetmanWF" : header},
     type : "post",
     url  : "/cgi-bin/TelnetmanWF/exec_work.cgi",
     data : {
      "flow_id" : flowId,
      "task_id" : taskId,
      "work_id" : workId,
      "user" : user,
      "password" : password,
      "telnetman_login_user" : telnetmanLoginUser,
      "telnetman_login_password" : telnetmanLoginPassword,
      "json_parameter_sheet" : this.parameterSheetData,
      "json_exec_node_list" : jsonExecNodeList,
      "json_through_node_list" : jsonThroughNodeList
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
         var status = hashResult["status"];
         var flowId = hashResult["flow_id"];
         var taskId = hashResult["task_id"];
         var workId = hashResult["work_id"];
         var targetList = hashResult["target_list"];
         var updateTime = hashResult["update_time"];
         var useParameterSheet = hashResult["use_parameter_sheet"];
         
         if(status === 1){
          objUpdateTask.intervalId = setInterval("objUpdateTask.checkStatus('" + workId + "')", 5000);
          objUpdateTask.changeLoadingMessage("<span>しばらくお待ち下さい。</sapn><img src='img/loading_2.gif' width='16' heigth='16' alt='loading'><br><span>閉じてしまってもオペレーションは継続します。</span><br><span>開き直せばいつでも最新の状態で再開できます。</span>");
         }
         else if(status === 2){
          objCommon.unlockScreen();
          
          objUpdateTask.exec = true;
          
          // 過去ログの追加
          var lastLogTime  = hashResult["last_log_time"];
          var lastLogOk    = hashResult["last_log_ok"];
          var lastLogNg    = hashResult["last_log_ng"];
          var lastLogError = hashResult["last_log_error"];
          var lastLogDiff  = hashResult["last_log_diff"];
          var lastLogOptional = hashResult["last_log_optional"];
          var lastLodIndividualParameterSheet = hashResult["last_log_individual_parameter_sheet"];
          var elementList = objUpdateTask.makeLogList(flowId, taskId, workId, lastLogTime, lastLogOk, lastLogNg, lastLogError, lastLogDiff, lastLogOptional, lastLodIndividualParameterSheet);
          var elP  = elementList[0];
          var elUl = elementList[1];
          
          var elLogArea = document.getElementById(objUpdateTask.idLogList(workId));
          var logElementList = elLogArea.childNodes;
          if(logElementList.length > 0){
           var elLastLogElement = logElementList[0];
           elLogArea.insertBefore(elP, elLastLogElement);
           elLogArea.insertBefore(elUl, elLastLogElement);
          }
          else{
           elLogArea.appendChild(elP);
           elLogArea.appendChild(elUl);
          }
          
          // パラメーターシートのクリック可能状態、exec 対象の表示を更新する。
          var existsParameterSheet = hashResult["exists_parameter_sheet"];
          if(existsParameterSheet === 1){
           var nodeList = hashResult["node_list"];
           objUpdateTask.makeNodeList(workId, nodeList, false, false);
           targetList.push(workId);
          }
          else{
           objUpdateTask.makeNodeList(workId, [], false, false);
           objUpdateTask.disableParameterSheet(workId);
          }
          
          // 個別パラメーターシートの欄を空にする。
          if(useParameterSheet === 1){
           objUpdateTask.removeParameterSheetName(workId);
          }
          
          // exec ボタンをの状態を変更。
          objUpdateTask.changeWorkButtonStatus(workId, existsParameterSheet, 1);
          
          // box の色を変える。
          objTelnetmanWorkFlow.highlightBox(workId, targetList);
         }
         else if(status === 0){
          objUpdateTask.exec = true;
          objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 1);
          objUpdateTask.disableCheckBox(false);
          objCommon.unlockScreen();
         }
        }
        else{
         objUpdateTask.exec = true;
         objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 1);
         objUpdateTask.disableCheckBox(false);
         
         var reason = hashResult["reason"];
         alert(reason);
         
         objCommon.unlockScreen();
        }
       }
       else{
        objUpdateTask.exec = true;
        objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 1);
        objUpdateTask.disableCheckBox(false);
        
        alert("CGI Error");
        objCommon.unlockScreen();
       }
      }
     },
     error : function (){
      objUpdateTask.exec = true;
      objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 1);
      objUpdateTask.disableCheckBox(false);
      
      alert("Server Error");
      objCommon.unlockScreen();
     }
    });
   }
  }
 };
 
 
 
 //
 // work の進捗を確認する。
 //
 this.checkStatus = function (workId){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/check_status.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
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
        var status = hashResult["status"];
        var flowId = hashResult["flow_id"];
        var taskId = hashResult["task_id"];
        var workId = hashResult["work_id"];
        var targetList = hashResult["target_list"];
        var updateTime = hashResult["update_time"];
        var useParameterSheet = hashResult["use_parameter_sheet"];
        
        if(status === 2){
         objCommon.unlockScreen();
         
         clearInterval(objUpdateTask.intervalId);
         objUpdateTask.intervalId = "";
         
         objUpdateTask.exec = true;
         
         // 過去ログの追加
         var lastLogTime  = hashResult["last_log_time"];
         var lastLogOk    = hashResult["last_log_ok"];
         var lastLogNg    = hashResult["last_log_ng"];
         var lastLogError = hashResult["last_log_error"];
         var lastLogDiff  = hashResult["last_log_diff"];
         var lastLogOptional = hashResult["last_log_optional"];
         var elementList = objUpdateTask.makeLogList(flowId, taskId, workId, lastLogTime, lastLogOk, lastLogNg, lastLogError, lastLogDiff, lastLogOptional);
         var elP  = elementList[0];
         var elUl = elementList[1];
         
         var elLogArea = document.getElementById(objUpdateTask.idLogList(workId));
         var logElementList = elLogArea.childNodes;
         if(logElementList.length > 0){
          var elLastLogElement = logElementList[0];
          elLogArea.insertBefore(elP, elLastLogElement);
          elLogArea.insertBefore(elUl, elLastLogElement);
         }
         else{
          elLogArea.appendChild(elP);
          elLogArea.appendChild(elUl);
         }
         
         // パラメーターシートのクリック可能状態、exec 対象の表示を更新する。
         var existsParameterSheet = hashResult["exists_parameter_sheet"];
         if(existsParameterSheet === 1){
          var nodeList = hashResult["node_list"];
          objUpdateTask.makeNodeList(workId, nodeList, false, false);
          targetList.push(workId);
         }
         else{
          objUpdateTask.makeNodeList(workId, [], false, false);
          objUpdateTask.disableParameterSheet(workId);
         }
         
         // 個別パラメーターシートの欄を空にする。
         if(useParameterSheet === 1){
          objUpdateTask.removeParameterSheetName(workId);
         }
         
         // exec ボタンをの状態を変更。
         objUpdateTask.changeWorkButtonStatus(workId, existsParameterSheet, 1);
         
         // box の色を変える。
         objTelnetmanWorkFlow.highlightBox(workId, targetList);
        }
       }
      }
     }
    }
   });
  }
 };
 
 
 
 //
 // 手動でOK, NG 分岐を行う。
 //
 this.manualExecWork = function (workId){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   objCommon.lockScreen("<div id='" + this.idLockScreenMessage + "'><img src='img/loading_1.gif' width='54' height='55' alt='loading'></div>");
   
   this.exec = false;
   this.changeWorkButtonStatus(workId, 1, 0);
   
   this.disableCheckBox(true);
   
   var checkedNodeList = this.checkNodeList();
   var execNodeList    = checkedNodeList[0];
   var throughNodeList = checkedNodeList[1];
   
   var okNodeList = new Array();
   var ngNodeList = new Array();
   
   for(var i = 0, j = execNodeList.length; i < j; i ++){
    var node = execNodeList[i];
    
    if(this.nodeList[node]["ok"] === 1){
     okNodeList.push(node);
    }
    else if(this.nodeList[node]["ng"] === 1){
     ngNodeList.push(node);
    }
    else{
     throughNodeList.push(node);
    }
   }

   var jsonOkNodeList      = JSON.stringify(okNodeList);
   var jsonNgNodeList      = JSON.stringify(ngNodeList);
   var jsonThroughNodeList = JSON.stringify(throughNodeList);
   
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/manual_exec_work.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
     "work_id" : workId,
     "json_ok_node_list" : jsonOkNodeList,
     "json_ng_node_list" : jsonNgNodeList,
     "json_through_node_list" : jsonThroughNodeList
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
        var status = hashResult["status"];
        var flowId = hashResult["flow_id"];
        var taskId = hashResult["task_id"];
        var workId = hashResult["work_id"];
        var targetList = hashResult["target_list"];
        var updateTime = hashResult["update_time"];
        
        if(status === 2){
         objCommon.unlockScreen();
         
         objUpdateTask.exec = true;
         
         // パラメーターシートのクリック可能状態、exec 対象の表示を更新する。
         var existsParameterSheet = hashResult["exists_parameter_sheet"];
         if(existsParameterSheet === 1){
          var nodeList = hashResult["node_list"];
          objUpdateTask.makeNodeList(workId, nodeList, false, true);
          targetList.push(workId);
         }
         else{
          objUpdateTask.makeNodeList(workId, [], false, true);
          objUpdateTask.disableParameterSheet(workId);
         }
         
         // exec ボタンをの状態を変更。
         objUpdateTask.changeWorkButtonStatus(workId, existsParameterSheet, 0);
         
         // box の色を変える。
         objTelnetmanWorkFlow.highlightBox(workId, targetList);
        }
        else if(status === 0){
         objUpdateTask.exec = true;
         objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 0);
         objUpdateTask.disableCheckBox(false);
         objCommon.unlockScreen();
        }
       }
       else{
        objUpdateTask.exec = true;
        objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 0);
        objUpdateTask.disableCheckBox(false);
        
        var reason = hashResult["reason"];
        alert(reason);
        
        objCommon.unlockScreen();
       }
      }
      else{
       objUpdateTask.exec = true;
       objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 0);
       objUpdateTask.disableCheckBox(false);
       
       alert("CGI Error");
       objCommon.unlockScreen();
      }
     }
    },
    error : function (){
     objUpdateTask.exec = true;
     objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 0);
     objUpdateTask.disableCheckBox(false);
     
     alert("Server Error");
     objCommon.unlockScreen();
    }
   });
  }
 };
 
 
 
 //
 // case を実行する。
 //
 this.execCase = function (caseId){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   objCommon.lockScreen("<div id='" + this.idLockScreenMessage + "'><img src='img/loading_1.gif' width='54' height='55' alt='loading'></div>");
   
   this.exec = false;
   this.changeCaseButtonStatus(caseId, 1);
   
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/exec_case.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
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
        var status = hashResult["status"];
        var flowId = hashResult["flow_id"];
        var taskId = hashResult["task_id"];
        var caseId = hashResult["case_id"];
        var targetList = hashResult["target_list"];
        var updateTime = hashResult["update_time"];
        
        if(status === 2){
         objCommon.unlockScreen();
         
         objUpdateTask.exec = true;
         
         // パラメーターシートをクリック可能状態に。
         var existsParameterSheet = hashResult["exists_parameter_sheet"];
         if(existsParameterSheet === 1){
          targetList.push(caseId);
         }
         else{
          objUpdateTask.disableParameterSheet(caseId);
         }
         
         // exec ボタンをの状態を変更。
         objUpdateTask.changeCaseButtonStatus(caseId, existsParameterSheet);
         
         // box の色を変える。
         objTelnetmanWorkFlow.highlightBox(caseId, targetList);
        }
        else if(status === 0){
         objUpdateTask.exec = true;
         objUpdateTask.changeCaseButtonStatus(objUpdateTask.selectedBoxId, 1);
         objCommon.unlockScreen();
        }
       }
       else{
        objUpdateTask.exec = true;
        objUpdateTask.changeCaseButtonStatus(objUpdateTask.selectedBoxId, 1);
        
        var reason = hashResult["reason"];
        alert(reason);
        
        objCommon.unlockScreen();
       }
      }
      else{
       objUpdateTask.exec = true;
       objUpdateTask.changeCaseButtonStatus(objUpdateTask.selectedBoxId, 1);
       
       alert("CGI Error");
       objCommon.unlockScreen();
      }
     }
    },
    error : function (){
     objUpdateTask.exec = true;
     objUpdateTask.changeCaseButtonStatus(objUpdateTask.selectedBoxId, 1);
     
     alert("Server Error");
     objCommon.unlockScreen();
    }
   });
  }
 };
 
 
 
 //
 // 最後の状態を確認する。
 //
 this.checkLastStatus = function (){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/check_last_status.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId
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
        var status = hashResult["status"];
        var flowId = hashResult["flow_id"];
        var taskId = hashResult["task_id"];
        var boxId  = hashResult["box_id"];
        var updateTime = hashResult["update_time"];
        var targetList = hashResult["target_list"];
        
        if(status === 1){
         objUpdateTask.exec = false;
         
         if(boxId.match(/^work_/)){
          objUpdateTask.intervalId = setInterval("objUpdateTask.checkStatus('" + boxId + "')", 15000);
          objCommon.lockScreen("<div id='" + objUpdateTask.idLockScreenMessage + "'><span>しばらくお待ち下さい。</sapn><img src='img/loading_2.gif' width='16' heigth='16' alt='loading'><br><span>閉じてしまってもオペレーションは継続します。</span><br><span>開き直せばいつでも最新の状態で再開できます。</span></div>");
         }
        }
        else if(status === 2){
         objUpdateTask.exec = true;
         
         if(objUpdateTask.intervalId.length > 0){
          clearInterval(objUpdateTask.intervalId);
          objUpdateTask.intervalId = "";
         }
        }
        
        if(boxId.match(/^work_/)){
         objUpdateTask.getWorkData(boxId);
        }
        else if(boxId.match(/^case_/)){
         objUpdateTask.getCaseData(boxId);
        }
        else if(boxId.match(/^start_/)){
         objUpdateTask.getTaskData(boxId) ;
        }
        
        objTelnetmanWorkFlow.highlightBox(boxId, targetList);
       }
      }
     }
    }
   });
  }
 };
 
 
 
 //
 // work をthrough する。
 //
 this.throughWork = function (workId){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   this.exec = false;
   this.changeWorkButtonStatus(workId, 1);
   
   this.disableCheckBox(true);
   
   var checkedNodeList = this.checkNodeList();
   var execNodeList    = checkedNodeList[0];
   var throughNodeList = checkedNodeList[1];
   var jsonExecNodeList    = JSON.stringify(execNodeList);
   var jsonThroughNodeList = JSON.stringify(throughNodeList);
   
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/through_work.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
     "work_id" : workId,
     "json_exec_node_list" : jsonExecNodeList,
     "json_through_node_list" : jsonThroughNodeList
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
        var status = hashResult["status"];
        var flowId = hashResult["flow_id"];
        var taskId = hashResult["task_id"];
        var workId = hashResult["work_id"];
        var existsFlowchartData = hashResult["exists_flowchart_data"];
        var isManualSplit = false;
        
        if(existsFlowchartData === 0){
         isManualSplit = true;
        }
        
        if(status === 2){
         var targetList = hashResult["target_list"];
         objUpdateTask.exec = true;
         
         // パラメーターシートをクリック可能状態とexec 対象の表示を更新する。
         var existsParameterSheet = hashResult["exists_parameter_sheet"];
         if(existsParameterSheet === 1){
          var nodeList = hashResult["node_list"];
          objUpdateTask.makeNodeList(workId, nodeList, true, isManualSplit);
          targetList.push(workId);
         }
         else{
          objUpdateTask.makeNodeList(workId, [], false, isManualSplit);
          objUpdateTask.disableParameterSheet(workId);
         }
         
         // through ボタンを変える。
         objUpdateTask.changeWorkButtonStatus(workId, existsParameterSheet, existsFlowchartData);
         
         // box の色を変える。
         objTelnetmanWorkFlow.highlightBox(workId, targetList);
        }
        else if(status === 0){
         objUpdateTask.exec = true;
         objUpdateTask.changeWorkButtonStatus(workId, 1, existsFlowchartData);
         objUpdateTask.disableCheckBox(false);
        }
       }
       else{
        objUpdateTask.exec = true;
        objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 1);
        objUpdateTask.disableCheckBox(false);
        
        var reason = hashResult["reason"];
        alert(reason);
       }
      }
      else{
       objUpdateTask.exec = true;
       objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 1);
       objUpdateTask.disableCheckBox(false);
       
       alert("CGI Error");
      }
     }
    },
    error : function (){
     objUpdateTask.exec = true;
     objUpdateTask.changeWorkButtonStatus(objUpdateTask.selectedBoxId, 1, 1);
     objUpdateTask.disableCheckBox(false);
     
     alert("Server Error");
    }
   });
  }
 };
 
 
 
 //
 // goal にたどりついたパラメーターシートを表示する。
 //
 this.getGoalData = function (boxId){
  var flowId       = objControleStorageS.getFlowId();
  var taskId       = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
   this.selectedBoxId = boxId;
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/get_goal_data.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
     "box_id"  : boxId
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
        var status = hashResult["status"];
        var flowId = hashResult["flow_id"];
        var taskId = hashResult["task_id"];
        var boxId  = hashResult["box_id"];
        var updateTime = hashResult["update_time"];
        var existsParameterSheet = hashResult["exists_parameter_sheet"];
        
        var elTable = document.createElement("table");
        elTable.setAttribute("id", objUpdateTask.idTable(boxId));
        
        var elTr1    = document.createElement("tr");
        var elTd11   = document.createElement("td");
        var elTd12   = document.createElement("td");
        var elSpan11 = document.createElement("span");
        var elSpan12 = document.createElement("span");
        elSpan11.innerHTML = "更新時刻";
        if(updateTime !== 0){
         elSpan12.innerHTML = objCommon.unixtimeToDate(updateTime, "YYYY/MM/DD hh:mm:ss");
        }
        else{
         elSpan12.innerHTML = "-"; 
        }
        elSpan12.setAttribute("id", objUpdateTask.idUpdateTime(boxId));
        elTd11.appendChild(elSpan11);
        elTd12.appendChild(elSpan12);
        elTr1.appendChild(elTd11);
        elTr1.appendChild(elTd12);
        
        
        elTable.appendChild(elTr1);
        
        
        
        if(existsParameterSheet === 1){
         var elTr8   = document.createElement("tr");
         var elTd81   = document.createElement("td");
         var elTd82   = document.createElement("td");
         var elSpan81 = document.createElement("span");
         var elSpan82 = document.createElement("span");
         elSpan81.innerHTML = "パラメーターシート";
         elSpan82.innerHTML = "Parameter Sheet";
         elSpan82.setAttribute("class", "onclick_node  parameter_sheet");
         elSpan82.setAttribute("id", objUpdateTask.idTakeOverParameterSheet(boxId));
         elSpan82.onclick = new Function("objUpdateTask.getParameterSheet('" + flowId + "','" + taskId + "','" + boxId + "', 0)");
         elTd81.appendChild(elSpan81);
         elTd82.appendChild(elSpan82);
         elTr8.appendChild(elTd81);
         elTr8.appendChild(elTd82);
         
         elTable.appendChild(elTr8);
         
         
         var nodeList = hashResult["node_list"];
         
         var elTr9    = document.createElement("tr");
         var elTd91   = document.createElement("td");
         var elTd92   = document.createElement("td");
         var elSpan91 = document.createElement("span");
         var elUl92 = objUpdateTask.makeParameterSheetNodeList(flowId, taskId, boxId, nodeList);
         elSpan91.innerHTML = "ノード一覧";
         elTd91.appendChild(elSpan91);
         elTd92.appendChild(elUl92);
         elTr9.appendChild(elTd91);
         elTr9.appendChild(elTd92);
         
         elTable.appendChild(elTr9);
        }
        
        
        document.getElementById(objUpdateTask.idBoxDataArea).appendChild(elTable);
        
        objTelnetmanWorkFlow.changeStroke(boxId);
        
        var boxDataTableBottom = objUpdateTask.getBoxDataTableBottom(boxId);
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
 // パラメーターシートを削除する。
 //
 this.deleteParameterSheet = function (boxId){
  if(confirm("本当に削除しますか?")){
   var flowId       = objControleStorageS.getFlowId();
   var taskId       = objControleStorageS.getTaskId();
   
   if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0) && (taskId !== null) && (taskId !== undefined) && (taskId.length > 0)){
    this.selectedBoxId = boxId;
    var header = objCommon.makeHttpHeader();
    
    $.ajax({
     headers : {"TelnetmanWF" : header},
     type : "post",
     url  : "/cgi-bin/TelnetmanWF/delete_parameter_sheet.cgi",
     data : {
      "flow_id" : flowId,
      "task_id" : taskId,
      "box_id"  : boxId
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
         var deleted = hashResult["delete"];
         
         if(deleted === 1){
          var flowId = hashResult["flow_id"];
          var taskId = hashResult["task_id"];
          var boxId  = hashResult["box_id"];
          
          objUpdateTask.disableParameterSheet(boxId);
          
          // ノードリストの削除とボタンの変更。
          if(boxId.match(/^work_/)){
           var nodeList = new Array();
           objUpdateTask.makeNodeList(boxId, nodeList, false, false);
           objUpdateTask.changeWorkButtonStatus(boxId, 0, 0);
          }
          else if(boxId.match(/^case_/)){
           objUpdateTask.changeCaseButtonStatus(boxId, 0);
          }
          
          // ボックスの色を戻す。
          objTelnetmanWorkFlow.highlightBox(boxId);
         }
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
 // パラメーターシートのダウンロードと削除をできないようにする。
 //
 this.disableParameterSheet = function (boxId){
  // Parameter Sheet をクリックできないようにする。
  var elSpanParameterSheet = document.getElementById(this.idTakeOverParameterSheet(boxId));
  elSpanParameterSheet.className = "gray";
  elSpanParameterSheet.onclick = null;
  
  // 削除ボタンを押せないようにする。
  var elImgDeleteParameterSheet = document.getElementById(this.idDeleteParameterSheet(boxId));
  elImgDeleteParameterSheet.className = "not-allowed_node";
  elImgDeleteParameterSheet.onclick = null;
 };
 
 
 return(this);
}

// 説明   : トップ画面の作成
// 作成日 : 2015/05/06
// 作成者 : 江野高広
// 更新 2016/07/05 : flow 作成時にtask パスワードを設定する。
// 更新 2016/07/05 : flow の検索機能の追加。

var objFlowList = new flowList();

function flowList (){
 
 this.idNewFlowTitle = "new_flow_title";
 this.idNewFlowPassword = "new_flow_password";
 this.idNewTaskPassword = "new_task_password";
 this.idFlowListArea = "flow_list_area";
 this.idImportFlowPassword = "import_flow_password";
 this.idImportFlowAllDataButton = "import_flow_all_data_button";
 this.idUpdateFlowAllDataButton = "update_flow_all_data_button";
 this.idAbortFlowAllDataButton  = "abort_flow_all_data_button";
 this.idImportMessage = "import_message";
 this.idClosePanel = "close_panel_button";
 this.idPageNaviArea = "page_navi_area";
 this.idSearchWord = "search_word";
 
 this.page = 1;
 this.lastPage = 1;
 this.searchWord = "";
 
 //
 // 各flow のpassword 記入欄のid
 //
 this.idFlowPassword = function (flowId) {
  return("flow_password_" + flowId);
 };
 
 //
 // 各flow のtask list の表示、非表示のスイッチのid
 //
 this.idOpenClose = function (flowId, opneClose){
  return("task_list_" + flowId + "_" + opneClose);
 };
 
 //
 // 各flow の新規タスクのタイトル入力欄のid
 //
 this.idNewTaskTitle = function (flowId){
  return("new_task_title_" + flowId);
 };
 
 //
 // タスクの新規作成欄と既存タスク一覧の表示id
 //
 this.idTaskPanel = function (flowId){
  return("task_panel_" + flowId);
 };
 
 //
 // 既存タスク一覧のid 
 //
 this.idTaskList = function (flowId){
  return("task_list_" + flowId);
 };
 
 //
 // 既存タスクの表示、実行パスワード入力欄のid
 //
 this.idTaskPassword = function (flowId, taskId){
  return("task_password_" + flowId + "_" + taskId);
 };
 
 //
 // flow 概要パネルの表示id
 //
 this.idFlowPanel = function (flowId){
  return("flow_panel_" + flowId);
 };
 
 //
 // task 行のid
 //
 this.idTaskTr = function (flowId, taskId){
  return("task_tr_" + flowId + "_" + taskId);
 };
 
 
 // flow id が作成日時の逆順に入った配列。
 this.flowIdList = new Array();
 
 // flow id : flow title
 this.flowTitleList = new Object();
 
 // flow id : [task id が作成日時の逆順に入った配列]
 this.taskIdList = new Object();
 
 // task id : task title
 this.taskTitleList = new Object();
 
 
 //
 // flow の作成。
 //
 this.createFlow = function (){
  var title    = document.getElementById(this.idNewFlowTitle).value;
  var flowPassword = document.getElementById(this.idNewFlowPassword).value;
  var taskPassword = document.getElementById(this.idNewTaskPassword).value;
  
  if((title !== null) && (title !== undefined) && (title.length > 0) && (flowPassword !== null) && (flowPassword !== undefined) && (flowPassword.length > 0) && (taskPassword !== null) && (taskPassword !== undefined) && (taskPassword.length > 0)){
   $.ajax({
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/create_flow.cgi",
    data : {
     "title"         : title,
     "flow_password" : flowPassword,
     "task_password" : taskPassword
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
       var create = hashResult["create"];
       
       if(create === 1){
        document.getElementById(objFlowList.idNewFlowTitle).value    = "";
        document.getElementById(objFlowList.idNewFlowPassword).value = "";
        document.getElementById(objFlowList.idNewTaskPassword).value = "";
        
        var title = hashResult["title"];
        var flowId = hashResult["flow_id"];
        
        objFlowList.addFlowPanel(1, flowId, title);
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
  else if((title === null) || (title === undefined) || (title.length === 0)){
   alert("タイトルが未記入です。");
  }
  else if((password === null) || (password === undefined) || (password.length === 0)){
   alert("パスワードが未記入です。");
  }
 };
 
 
 
 //
 // タスクを作成する。
 //
 this.createTask = function (flowId){
  var title    = document.getElementById(this.idNewTaskTitle(flowId)).value;
  
  if((title !== null) && (title !== undefined) && (title.length > 0)){
   $.ajax({
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/create_task.cgi",
    data : {
     "flow_id"  : flowId,
     "title"    : title
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
       var create = hashResult["create"];
       
       if(create === 1){
        var title  = hashResult["title"];
        var flowId = hashResult["flow_id"];
        var taskId = hashResult["task_id"];
        
        document.getElementById(objFlowList.idNewTaskTitle(flowId)).value    = "";
        
        if(flowId in objFlowList.taskIdList){
         objFlowList.taskIdList[flowId] = new Array();
        }
        
        objFlowList.taskIdList[flowId].unshift(taskId);
        objFlowList.taskTitleList[taskId] = title;
        
        var elTr = objFlowList.makeTaskPanel(flowId, taskId);
        
        var elTable = document.getElementById(objFlowList.idTaskList(flowId));
        var trList = elTable.childNodes;
        
        if(trList.length >= 2){
         elTable.insertBefore(elTr, trList[1]);
        }
        else{
         elTable.appendChild(elTr);
        }
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
  else if((title === null) || (title === undefined) || (title.length === 0)){
   alert("タイトルが未記入です。");
  }
  else if((password === null) || (password === undefined) || (password.length === 0)){
   alert("パスワードが未記入です。");
  }
 };
 
 
 
 //
 // flow 概要パネルを1件分追加。
 //
 this.addFlowPanel = function (importType, flowId, flowTitle){
  if(importType === 1){
   this.flowIdList.unshift(flowId);
   this.flowTitleList[flowId] = flowTitle;
   this.taskIdList[flowId] = new Array();
   
   var elDiv = this.makeFlowPanel(flowId);
   
   var elFlowListArea = document.getElementById(this.idFlowListArea);
   if(objFlowList.flowIdList.length >= 2){
    var elLastFlowPanel = document.getElementById(this.idFlowPanel(this.flowIdList[1]));
    elFlowListArea.insertBefore(elDiv, elLastFlowPanel);
   }
   else{
    elFlowListArea.appendChild(elDiv);
   }
  }
  else if(importType === 2){
   this.flowTitleList[flowId] = flowTitle;
  }
 };
 
 
 
 //
 // flow 概要パネルを1件分作る。
 //
 this.makeFlowPanel = function (flowId){
  var flowTitle = this.flowTitleList[flowId];
  
  var elH2FlowTitle = document.createElement("h2");
  elH2FlowTitle.innerHTML = flowTitle;
  
  var elPFlowPassword = document.createElement("p");
  var elInputFlowPassword = document.createElement("input");
  elInputFlowPassword.setAttribute("type", "password");
  //elInputFlowPassword.setAttribute("size", "16");
  elInputFlowPassword.style.width = "100px";
  elInputFlowPassword.setAttribute("id", this.idFlowPassword(flowId));
  elInputFlowPassword.setAttribute("placeholder", "編集パスワード");
  var elButtonUpdateFlow = document.createElement("button");
  elButtonUpdateFlow.innerHTML = "編集";
  elButtonUpdateFlow.setAttribute("class", "enable");
  elButtonUpdateFlow.onclick = new Function("objFlowList.updateFlow('" + flowId + "')");
  var elButtonDeleteFlow = document.createElement("button");
  elButtonDeleteFlow.innerHTML = "削除";
  elButtonDeleteFlow.setAttribute("class", "enable");
  elButtonDeleteFlow.onclick = new Function("objFlowList.deleteFlow('" + flowId + "')");
  elPFlowPassword.appendChild(elInputFlowPassword);
  elPFlowPassword.appendChild(elButtonUpdateFlow);
  elPFlowPassword.appendChild(elButtonDeleteFlow);
  
  var elDivOpenClose = document.createElement("div");
  var elInputOpen = document.createElement("input");
  elInputOpen.setAttribute("type", "radio");
  elInputOpen.setAttribute("id", this.idOpenClose(flowId, "open"));
  elInputOpen.setAttribute("name", this.idOpenClose(flowId, "open_close"));
  elInputOpen.setAttribute("value", "1");
  elInputOpen.onchange = new Function("objFlowList.showTaskPanel('" + flowId + "')");
  var elLabelOpen = document.createElement("label");
  elLabelOpen.innerHTML = "&#9660;";
  elLabelOpen.setAttribute("for", this.idOpenClose(flowId, "open"));
  var elInputClose = document.createElement("input");
  elInputClose.setAttribute("type", "radio");
  elInputClose.setAttribute("id", this.idOpenClose(flowId, "close"));
  elInputClose.setAttribute("name", this.idOpenClose(flowId, "open_close"));
  elInputClose.setAttribute("value", "0");
  elInputClose.onchange = new Function("objFlowList.hideTaskPanel('" + flowId + "')");
  elInputClose.checked = true;
  var elLabelClose = document.createElement("label");
  elLabelClose.setAttribute("for", this.idOpenClose(flowId, "close"));
  elLabelClose.innerHTML = "&#9650;";
  elDivOpenClose.appendChild(elInputClose);
  elDivOpenClose.appendChild(elLabelClose);
  elDivOpenClose.appendChild(elInputOpen);
  elDivOpenClose.appendChild(elLabelOpen );
  
  var elHeader = document.createElement("header");
  elHeader.appendChild(elH2FlowTitle);
  elHeader.appendChild(elPFlowPassword);
  elHeader.appendChild(elDivOpenClose);
  
  var elTableNewTask = document.createElement("table");
  elTableNewTask.className = "create_task_table";
  var elTrNewTask1 = document.createElement("tr");
  var elThNewTask = document.createElement("th");
  elThNewTask.setAttribute("colspan", 3);
  elThNewTask.innerHTML = "新規タスク";
  elTrNewTask1.appendChild(elThNewTask);
  var elTrNewTask2 = document.createElement("tr");
  var elTdNewTaskTitle = document.createElement("td");
  var elSpanNewTaskTitle = document.createElement("span");
  elSpanNewTaskTitle.innerHTML = "タイトル";
  var elInputNewTaskTitle = document.createElement("input");
  elInputNewTaskTitle.setAttribute("type", "text");
  elInputNewTaskTitle.setAttribute("spellcheck", "false");
  elInputNewTaskTitle.setAttribute("autocomplete", "off");
  //elInputNewTaskTitle.setAttribute("size", 48);
  elInputNewTaskTitle.style.width = "250px";
  elInputNewTaskTitle.setAttribute("id", this.idNewTaskTitle(flowId));
  elInputNewTaskTitle.spellcheck = false;
  elTdNewTaskTitle.appendChild(elSpanNewTaskTitle);
  elTdNewTaskTitle.appendChild(elInputNewTaskTitle);
  var elTdNewTaskButton = document.createElement("td");
  var elButtonNewTask = document.createElement("button");
  elButtonNewTask.innerHTML = "作成";
  elButtonNewTask.setAttribute("class", "enable");
  elButtonNewTask.onclick = new Function("objFlowList.createTask('" + flowId + "');");
  elTdNewTaskButton.appendChild(elButtonNewTask);
  elTrNewTask2.appendChild(elTdNewTaskTitle);
  elTrNewTask2.appendChild(elTdNewTaskButton);
  elTableNewTask.appendChild(elTrNewTask1);
  elTableNewTask.appendChild(elTrNewTask2);
  
  var elTableTaskList = document.createElement("table");
  elTableTaskList.setAttribute("id", this.idTaskList(flowId));
  elTableTaskList.className = "task_list_table";
  var elTrTaskList1 = document.createElement("tr");
  var elThTaskList = document.createElement("th");
  elThTaskList.setAttribute("colspan", 3);
  elThTaskList.innerHTML = "既存タスク";
  elTrTaskList1.appendChild(elThTaskList);
  elTableTaskList.appendChild(elTrTaskList1);
  
  for(var i = 0, j = this.taskIdList[flowId].length; i < j; i ++){
   var taskId    = this.taskIdList[flowId][i];
   
   var elTrTaskList2 = this.makeTaskPanel(flowId, taskId);
   
   elTableTaskList.appendChild(elTrTaskList2);
  }
  
  var elArticle = document.createElement("article");
  elArticle.setAttribute("id", this.idTaskPanel(flowId));
  elArticle.appendChild(elTableNewTask);
  elArticle.appendChild(elTableTaskList);
  elArticle.style.display = "none";
  
  var elDiv = document.createElement("div");
  elDiv.setAttribute("class", "flow_panel_zone");
  elDiv.setAttribute("id", this.idFlowPanel(flowId));
  elDiv.appendChild(elHeader);
  elDiv.appendChild(elArticle);
  
  return(elDiv);
 };
 
 
 
 //
 // タスクパネルを表示する。
 //
 this.showTaskPanel = function (flowId){
  var id = this.idTaskPanel(flowId);
  
  $("#" + id).animate({height:"show"}, "slow");
 };
 
 
 
 //
 // タスクパネルを非表示にする。
 //
 this.hideTaskPanel = function (flowId){
  var id = this.idTaskPanel(flowId);
  
  $("#" + id).animate({height:"hide"}, "slow");
 };
 
 
 
 //
 // task の概要パネルを作る。
 //
 this.makeTaskPanel = function (flowId, taskId){
  var taskTitle = this.taskTitleList[taskId];
   
  var elTrTaskList2 = document.createElement("tr");
  elTrTaskList2.setAttribute("id", this.idTaskTr(flowId, taskId));
  var elTdTaskTitle = document.createElement("td");
  var elSpanTaskTitle = document.createElement("span");
  elSpanTaskTitle.innerHTML = taskTitle;
  elTdTaskTitle.appendChild(elSpanTaskTitle);
  var elTdTaskPassword = document.createElement("td");
  var elInputTaskPassword = document.createElement("input");
  elInputTaskPassword.setAttribute("type", "password");
  //elInputTaskPassword.setAttribute("size", 16);
  elInputTaskPassword.style.width = "100px";
  elInputTaskPassword.setAttribute("id", this.idTaskPassword(flowId, taskId));
  elInputTaskPassword.setAttribute("placeholder", "実行パスワード");
  elTdTaskPassword.appendChild(elInputTaskPassword);
  var elTdViewButton = document.createElement("td");
  var elTdDeleteButton = document.createElement("td");
  var elButtonView = document.createElement("button");
  var elButtonDelete = document.createElement("button");
  elButtonView.innerHTML = "実行";
  elButtonView.setAttribute("class", "enable");
  elButtonView.onclick = new Function("objFlowList.updateTask('" + flowId + "', '" + taskId + "');");
  elButtonDelete.innerHTML = "削除";
  elButtonDelete.setAttribute("class", "enable");
  elButtonDelete.onclick = new Function("objFlowList.deleteTask('" + flowId + "', '" + taskId + "');");
  elTdViewButton.appendChild(elButtonView);
  elTdDeleteButton.appendChild(elButtonDelete);
  elTrTaskList2.appendChild(elTdTaskTitle);
  elTrTaskList2.appendChild(elTdTaskPassword);
  elTrTaskList2.appendChild(elTdViewButton);
  elTrTaskList2.appendChild(elTdDeleteButton);
  
  return(elTrTaskList2);
 };
 
 
 
 //
 // flow 一覧を表示する。
 //
 this.printFlowList = function (){
  var elFlowListArea = document.getElementById(this.idFlowListArea);
  
  for(var i = 0, j = this.flowIdList.length; i < j; i ++){
   var flowId = this.flowIdList[i];
   
   var elDiv = this.makeFlowPanel(flowId);
   elFlowListArea.appendChild(elDiv);
  }
 };
 
 
 
 //
 // flow 一覧を削除する。
 //
 this.deleteFlowList = function (){
  var elFlowListArea = document.getElementById(this.idFlowListArea);
  
  while(this.flowIdList.length > 0){
   var flowId = this.flowIdList.shift();
   
   var elDiv = document.getElementById(this.idFlowPanel(flowId));
   elFlowListArea.removeChild(elDiv);
   
   delete(this.flowTitleList[flowId]);
   
   while(this.taskIdList[flowId].length > 0){
    var taskId = this.taskIdList[flowId].shift();
    
    delete(this.taskTitleList[taskId]);
   }
  }
 };
 
 
 
 //
 // flow を検索する。
 //
 this.searchFlowList = function (){
  var searchWord = document.getElementById(this.idSearchWord).value;
  
  if((searchWord === null) || (searchWord === undefined)){
   searchWord = "";
  }
  
  this.serchWord = searchWord;
  
  this.getFlowList();
 };
 
 
  
 //
 // flow 一覧を取得する。
 //
 this.getFlowList = function (page){
  if((page === null) || (page === undefined)){
   page = 1;
  }
  
  $.ajax({
   type : "post",
   url  : "/cgi-bin/TelnetmanWF/get_flow_list.cgi",
   data : {
    "page" : page,
    "search_word" : this.serchWord
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
      var flowIdList    = hashResult["flow_id_list"];
      var flowTitleList = hashResult["flow_title_list"];
      var taskIdList    = hashResult["task_id_list"];
      var taskTitleList = hashResult["task_title_list"];
      var page          = hashResult["page"];
      var lastPage      = hashResult["last_page"];
      
      objFlowList.deleteFlowList();
      
      objFlowList.page     = page;
      objFlowList.lastPage = lastPage;
      
      objFlowList.makePageNavi();
      
      for(var i = 0, j = flowIdList.length; i < j; i ++){
       var flowId = flowIdList[i];
       var flowTitle = flowTitleList[flowId];
       
       objFlowList.flowIdList.push(flowId);
       objFlowList.flowTitleList[flowId] = flowTitle;
       objFlowList.taskIdList[flowId] = new Array();
      }
      
      for(flowId in taskIdList){
       for(i = 0, j = taskIdList[flowId].length; i < j; i ++){
        var taskId = taskIdList[flowId][i];
        var taskTitle = taskTitleList[taskId];
        
        objFlowList.taskIdList[flowId].push(taskId);
        objFlowList.taskTitleList[taskId] = taskTitle;
       }
      }
      
      objFlowList.printFlowList();
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
 };
 
 
 
 // 
 // ページナビを作成する。
 //
 this.makePageNavi = function (){
  var elNavi = document.getElementById(this.idPageNaviArea);
  var pageLinkList = elNavi.childNodes;
  
  for(var k = pageLinkList.length - 1; k >= 0; k --){
   elNavi.removeChild(pageLinkList[k]);
  }
  
  if(this.lastPage > 1){
   for(var i = 1; i <= this.lastPage; i ++){
    var elSpan = document.createElement("span");
    elSpan.innerHTML = "[" + i + "]";
    
    if(i === this.page){
     elSpan.className = "page_number";
    }
    else{
     elSpan.className = "navi_link";
     elSpan.onclick = new Function("objFlowList.getFlowList(" + i + ")");
    }
    
    elNavi.appendChild(elSpan);
   }
  }
 };
 
 
 
 //
 // flow を削除する。
 //
 this.deleteFlow = function (flowId){
  var elInput = document.getElementById(this.idFlowPassword(flowId));
  var password = elInput.value;
  
  if((password !== null) && (password !== undefined) && (password.length > 0)){
   if(confirm("本当に削除しますか?")){
    elInput.value = "";
    var header = "flow " + password;
    
    $.ajax({
     headers : {"TelnetmanWF" : header},
     type : "post",
     url  : "/cgi-bin/TelnetmanWF/delete_flow.cgi",
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
         
         for(var i = objFlowList.flowIdList.length - 1; i >= 0; i --){
          if(objFlowList.flowIdList[i] === flowId){
           objFlowList.flowIdList.splice(i, 1);
           break;
          }
         }
         
         for(var j = objFlowList.taskIdList[flowId].length - 1; j >= 0; j --){
          var taskId = objFlowList.taskIdList[flowId][j];
          delete(objFlowList.taskTitleList[taskId]);
         }
         
         delete(objFlowList.flowTitleList[flowId]);
         delete(objFlowList.taskIdList[flowId]);
         
         var elFlowListArea = document.getElementById(objFlowList.idFlowListArea);
         var elDiv = document.getElementById(objFlowList.idFlowPanel(flowId));
         
         elFlowListArea.removeChild(elDiv);
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
   else{
    elInput.value = "";
   }
  }
  else{
   alert("パスワードを入力して下さい。");
  }
 };
 
 
 
 //
 // flow 編集画面に移行する。
 //
 this.updateFlow = function (flowId){
  var elInput = document.getElementById(this.idFlowPassword(flowId));
  var password = elInput.value;
  
  if((password !== null) && (password !== undefined) && (password.length > 0)){
   objControleStorageL.setFlowId(flowId);
   objControleStorageL.setFlowPassword(password);
   
   elInput.value = "";
   
   window.open().location.href = "flow.html";
  }
  else{
   alert("パスワードを入力して下さい。");
  }
 };
 
 
 
 //
 // task 実行画面に移行する。
 //
 this.updateTask = function (flowId, taskId){
  var elInput = document.getElementById(this.idTaskPassword(flowId, taskId));
  var password = elInput.value;
  
  if((password !== null) && (password !== undefined) && (password.length > 0)){
   objControleStorageL.setFlowId(flowId);
   objControleStorageL.setTaskId(taskId);
   objControleStorageL.setTaskPassword(password);
   
   elInput.value = "";
   
   window.open().location.href = "task.html";
  }
  else{
   alert("パスワードを入力して下さい。");
  }
 };
 
 
 
 //
 // task を削除する。
 //
 this.deleteTask = function (flowId, taskId){
  var elInput = document.getElementById(this.idTaskPassword(flowId, taskId));
  var password = elInput.value;
  
  if((password !== null) && (password !== undefined) && (password.length > 0)){
   if(confirm("本当に削除しますか?")){
    elInput.value = "";
    var header = "task " + password;
    
    $.ajax({
     headers : {"TelnetmanWF" : header},
     type : "post",
     url  : "/cgi-bin/TelnetmanWF/inactivate_task.cgi",
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
         var flowId = hashResult["flow_id"];
         var taskId = hashResult["task_id"];
         
         var elTable = document.getElementById(objFlowList.idTaskList(flowId));
         var elTr = document.getElementById(objFlowList.idTaskTr(flowId, taskId));
         
         elTable.removeChild(elTr);
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
  else{
   alert("パスワードを入力して下さい。");
  }
 };
 
 
 //
 // ドロップされた全データファイルを開く。
 //
 this.onDropAllData = function (event) {
  var files = event.dataTransfer.files;
  
  if((files[0].name.match(/^TelnetmanWF_/)) && (files[0].name.match(/\.zip$/))){
   // FileReaderオブジェクトの生成。
   var reader = new FileReader();
   reader.name = files[0].name;
   
   // ファイル読取が完了した際に呼ばれる処理を定義。
   reader.onload = function (event) {
    var fileName = event.target.name;
    var allData  = event.target.result;
    
    var base64Data = base64encode(allData);
    objFlowList.putFlowAllData(base64Data);
   };
   
   // ファイルの内容を取得。
   reader.readAsBinaryString(files[0]);
  }
  
  // ブラウザ上でファイルを展開する挙動を抑止。
  event.preventDefault();
 };
 
 
 
 //
 // ドロップされた全データファイルを置きに行く。
 //
 this.putFlowAllData = function (base64Data){
  if((base64Data !== null) && (base64Data !== undefined) && (base64Data.length > 0)){
   $.ajax({
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/put_flow_all_data.cgi",
    data : {
     "flow_all_data_base64" : base64Data
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
       var result    = hashResult["result"];
       var exists    = hashResult["exists"];
       var flowId    = hashResult["flow_id"];
       var tmpId     = hashResult["tmp_id"];
       var flowTitle = hashResult["flow_title"];
       
       if(result === 1){
        var html = "<div class='confirm_import_data'>" +
                   "<p class='import_flow_title'>" + flowTitle + "</p>" +
                   "<p class='import_action'><button class='enable' id='" + objFlowList.idImportFlowAllDataButton + "' onclick='objFlowList.importFlowAllData(1," + exists + ",\"" + flowId + "\",\"" + tmpId + "\");'>新規作成</button></p>";
        if(exists === 1){
         html   += "<p class='import_action'><button class='enable' id='" + objFlowList.idUpdateFlowAllDataButton + "' onclick='objFlowList.importFlowAllData(2," + exists + ",\"" + flowId + "\",\"" + tmpId + "\");'>上書保存</button><span>編集パスワード</span><input type='password' size='16' id='" + objFlowList.idImportFlowPassword + "' value=''></p>";
        }
        else{
         html   += "<p class='import_action'><button class='disable' id='" + objFlowList.idUpdateFlowAllDataButton + "'>上書保存</button><span>編集パスワード</span><input type='password' size='16' value='' disabled='disabled'></p>";
        }           
        html    += "<p class='import_action'><button class='enable' id='" + objFlowList.idAbortFlowAllDataButton + "' onclick='objFlowList.importFlowAllData(0," + exists + ",\"" + flowId + "\",\"" + tmpId + "\");'>キャンセル</button></p>" +
                   "<p class='import_message'><span id='" + objFlowList.idImportMessage + "'>データを取り込めます。</span><span id='" + objFlowList.idClosePanel + "'></span></p>" +
                   "</div>";
        
        objCommon.lockScreen(html);
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
 // ドロップされた全データファイルをデータベースに登録する。
 //
 this.importFlowAllData = function (importType, exists, flowId, tmpId){
  var password = "";
  if(importType === 2){
   password = document.getElementById(this.idImportFlowPassword).value;
  }
  
  if((importType === 0) || (importType === 1) || (password.length > 0)){
   $.ajax({
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/import_flow_all_data.cgi",
    data : {
     "import_type" : importType,
     "exists" : exists,
     "password" : password,
     "flow_id" : flowId,
     "tmp_id" : tmpId
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
       var result  = hashResult["result"];
       
       if(result === 1){
        var importType = hashResult["import_type"];
        var message    = hashResult["message"];
        var flowId     = hashResult["flow_id"];
        var title      = hashResult["flow_title"];
        
        document.getElementById(objFlowList.idImportMessage).innerHTML = message;
        var elButton1 = document.getElementById(objFlowList.idImportFlowAllDataButton);
        var elButton2 = document.getElementById(objFlowList.idUpdateFlowAllDataButton);
        var elButton0 = document.getElementById(objFlowList.idAbortFlowAllDataButton);
        elButton1.onclick = null;
        elButton2.onclick = null;
        elButton0.onclick = null;
        elButton1.className = "disable";
        elButton2.className = "disable";
        elButton0.className = "disable";
        
        var elImg = document.createElement("img");
        elImg.setAttribute("src", "img/thumb_up.png");
        elImg.setAttribute("width", "16");
        elImg.setAttribute("height", "16");
        elImg.setAttribute("alt", "閉じる");
        elImg.setAttribute("class", "onclick_node");
        elImg.onclick = new Function("objFlowList.addFlowPanel(" + importType + ",'" + flowId + "', '" + title + "'); objCommon.unlockScreen();");
        document.getElementById(objFlowList.idClosePanel).appendChild(elImg);
       }
       else{
        var reason = hashResult["reason"];
        document.getElementById(objFlowList.idImportMessage).innerHTML = reason;
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
 
 return(this);
}

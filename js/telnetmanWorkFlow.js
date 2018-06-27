// 説明   : joint.js の操作画面。
// 作成日 : 2015/05/08
// 作成者 : 江野高広
// 更新   : 2018/03/16 case を編集途中で削除しようとするとError になるバグを修正。

var objTelnetmanWorkFlow = new telnetmanWorkFlow();


function telnetmanWorkFlow (){
 this.paperWidth  = 900;
 this.paperHeight = 600;
 
 this.boxWidth = 200;
 this.boxHeight = 40;
 
 this.terminalBoxWidth = 100;
 
 this.idStartCircle = "start_circle";
 this.idGoalCircle  = "goal_circle";
 this.idWorkFlowArea = "workflow_area";
 this.idWorkFlowZone = "workflow_zone";
 this.idFlowTitleArea = "flow_title_area";
 this.idTaskTitleArea = "task_title_area";
 this.idNewTitle = "new_title";
 this.idNewFlowPassword = "new_flow_password";
 this.idNewTaskPassword = "new_task_password";
 
 this.graph = new joint.dia.Graph;
 this.paper = null;
 
 // start data
 //this.startData = {
 // x : 90, y : 20, start_link_target : {x:120, y:160}, start_link_vertices : []
 //};
 this.startData = new Object();
 
 // goal data
 // this.goalData = {x : 90, y : 520};
 this.goalData = new Object();
 
 
 // work data
 //this.workDataList = {
 // "work_1" : {x : 100, y : 180,  title : "設定"     , ok_link_target : {id:"work_5"}, ng_link_target : {id:"work_2"}, ok_link_vertices : [{x:300,y:60}, {x:400,y:60},{x:400,y:20}], ng_link_vertices : []},
 // "work_2" : {x : 300, y : 180,  title : "切り戻し" , ok_link_target : {x:350,y:295}, ng_link_target : {x:500,y:195}, ok_link_vertices : [], ng_link_vertices : []},
 // "work_5" : {x : 100, y : 280,  title : "事後確認" , ok_link_target : {x:150,y:395}, ng_link_target : {x:300,y:295}, ok_link_vertices : [], ng_link_vertices : []}
 //};
 this.workDataList = new Object();
 this.jsonTmpNewWorkData = "";
 
 // case data
 //this.caseDataList = {
 // "case_1" : {x : 100, y : 30, title : "ホスト名" , link_target_list : [{id:"work_1"},{x:200,y:200},{x:600,y:40},{x:800,y:80}], link_label_list : ["場合1","場合2","場合3","場合4"], link_vertices_list : [[],[],[],[]]}
 //};
 this.caseDataList = new Object();
 this.jsonTmpNewCaseData = "";
 
 
 // terminal data
 // this.terminalDataList = {x : 100, y : 30, title : "終了"};
 this.terminalDataList = new Object();
 this.jsonTmpNewTerminalData = "";
 
 
 // クリックされたlink のID とクローン
 this.pointerdownLinkId = "";
 this.cloneLink = null;
 
 
 // クリックされたbox のid
 this.selectedBoxId = "";
 
 
 //
 // スタート地点を作る。
 //
 this.makeStartCircle = function (x, y){
  var startCircle = new joint.shapes.basic.Circle({
   position : {x: x, y: y},
   size     : {width: 60, height: 60},
   attrs    : {circle: {fill: "#ffffff", "stroke-width": 1, stroke: "#303030"}, text: {text: "Start", fill: "#606060"}},
   id       : objTelnetmanWorkFlow.idStartCircle
  });
  
  return(startCircle);
 };
 
 
 
 //
 // ゴール地点を作る。
 //
 this.makeGoalCircle = function (x, y){
  var goalCircle = new joint.shapes.basic.Circle({
   position : {x: x, y: y},
   size     : {width: 60, height: 60},
   attrs    : {circle: {fill: "#ffffff", "stroke-width": 1, stroke: "#303030"}, text: {text: "Goal", fill: "#606060"}},
   id       : objTelnetmanWorkFlow.idGoalCircle
  });
  
  return(goalCircle);
 };
 
 
 
 //
 // work box を作る。
 //
 this.makeWorkBox = function (id, x, y, title){
  var box = new joint.shapes.basic.Rect({
   position : {x: x, y: y},
   size     : {width: this.boxWidth, height: this.boxHeight},
   attrs    : {rect: {fill: "#f0f0ff", "stroke-width": 2, stroke: "#909090"}, text: {text: title, fill: "#505050"}},
   id       : id
  });
 
  return(box);
 };
 
 
 
 //
 // case box を作る。
 //
 this.makeCaseBox = function (id, x, y, title){
  var box = new joint.shapes.basic.Rect({
   position : {x: x, y: y},
   size     : {width: this.boxWidth, height: this.boxHeight},
   attrs    : {rect: {fill: "#909090", "stroke-width": 2, stroke: "#c0c0c0", rx:100, ry:28}, text: {text: title, fill: "#f0f0f0"}},
   id       : id
  });
 
  return(box);
 };
 
 
 
 //
 // terminal box を作る。
 //
 this.makeTerminalBox = function (id, x, y, title){
  var box = new joint.shapes.basic.Rect({
   position : {x: x, y: y},
   size     : {width: this.terminalBoxWidth, height: this.boxHeight},
   attrs    : {rect: {fill: "#ffffff", "stroke-width": 1, stroke: "#303030", rx:9, ry:9}, text: {text: title, fill: "#606060"}},
   id       : id
  });
 
  return(box);
 };
 
 
 
 //
 // スタートのlink を作る。
 //
 this.makeStartLink = function  (target, vertices){
  
  var newTarget = this.copyTarget(target);
  var newVertices = this.copyVertices(vertices);
  
  var link = new joint.dia.Link({
   id : "link-start",
   source : {id: objTelnetmanWorkFlow.idStartCircle},
   target : newTarget
  });
 
  link.attr({
   ".connection"    : {stroke : "#606060", "stroke-width": 2},
   ".marker-target" : {fill : "#ffffff", d: "M 20 0 L 0 10 L 20 20 z"}
  });
  
  link.set("vertices",  newVertices);
  
  return(link);
 };
 
 
 
 //
 // OK, NG, Through link を作る。
 //
 this.makeOkNgLink = function (workId, type, target, vertices){
  
  var newTarget = this.copyTarget(target);
  var newVertices = this.copyVertices(vertices);
  
  var color = "";
  var labelText = "";
  if(type === "ok"){
   color = "#6060ff";
   labelText = "OK";
  }
  else if(type === "ng"){
   color = "#ff6060";
   labelText = "NG";
  }
  else if(type === "through"){
   color = "#c0c0c0";
   labelText = "Through";
  }
  
  var link = new joint.dia.Link({
   id : "link-" + workId + "-" + type,
   source : {id: workId},
   target : newTarget
  });
  
  link.attr({
   ".connection"    : {stroke : color, "stroke-width": 2},
   ".marker-target" : {fill : color, d: "M 20 0 L 0 10 L 20 20 z"}
  });
  
  link.label(0, {
   position : 0.5,
   attrs : {
    rect : {fill: "#ffffff"},
    text : {fill: color, text: labelText}
   }
  });
  
  link.set("vertices",  newVertices);

  return(link);
 };
 
 
 
 //
 // 場合分けのlink を作る。
 //
 this.caseLinkSerialNumberList = new Object();
 
 this.makeCaseLinkId = function (caseId, caseIndex){
  var stringCaseIndex = caseIndex.toString();
  
  if(!(caseId in this.caseLinkSerialNumberList)){
   this.caseLinkSerialNumberList[caseId] = 0;
  }
  
  var caseLinkSerialNumber = this.caseLinkSerialNumberList[caseId] + 1;
  var stringCcaseLinkSerialNumber = caseLinkSerialNumber.toString();
  this.caseLinkSerialNumberList[caseId] = caseLinkSerialNumber;
  
  var caseLinkId = "link-" + caseId + "-" + stringCcaseLinkSerialNumber + "-" + stringCaseIndex;

  return(caseLinkId);
 };
 
 this.makeCaseLink = function (caseId, caseIndex, target, labelText, vertices){
  var caseLinkId = this.makeCaseLinkId(caseId, caseIndex);
  var newTarget = this.copyTarget(target);
  var newVertices = this.copyVertices(vertices);
  
  var link = new joint.dia.Link({
   id : caseLinkId,
   source : {id: caseId},
   target : newTarget
  });
  
  link.attr({
   ".connection"    : {stroke : "#909090", "stroke-width": 2},
   ".marker-target" : {fill : "#909090", d: "M 20 0 L 0 10 L 20 20 z"}
  });
  
  link.label(0, {
   position : 0.5,
   attrs : {
    rect : {fill: "#ffffff"},
    text : {fill: "#909090", text: labelText}
   }
  });
  
  link.set("vertices",  newVertices);
  
  return(link);
 };
 
 
 
 //
 // 折れ線を再定義する。
 //
 this.copyVertices = function (vertices){
  var newVertices = new Array();
  
  for(var i = 0, j = vertices.length; i < j; i ++){
   newVertices[i] = new Object();
   for(var key in vertices[i]){
    var value = vertices[i][key];
    newVertices[i][key] = value; 
   }
  }
  
  return(newVertices);
 };
 
 
 
 //
 // link のtarget を再定義する。
 //
 this.copyTarget = function (target){
  var newTarget = new Object();
  
  for(var key in target){
   value = target[key];
   newTarget[key] = value;
  }
  
  return(newTarget);
 };
 
 
 
 //
 // スタート地点を加える。
 // 
 this.addStart = function (){
  var startX = this.startData["x"];
  var startY = this.startData["y"];
  var startCircle = this.makeStartCircle(startX, startY);
  
  this.graph.addCell(startCircle);
 };
 
 
 
 //
 // ゴール地点を加える。
 // 
 this.addGoal = function (){
  var goalX = this.goalData["x"];
  var goalY = this.goalData["y"];
  var goalCircle = this.makeGoalCircle(goalX, goalY);
  
  this.graph.addCell(goalCircle);
 };
 
 
 
 //
 // work box を1つ加える。
 //
 this.addWorkBox = function (id){
  var x     = this.workDataList[id]["x"];
  var y     = this.workDataList[id]["y"];
  var title = this.workDataList[id]["title"];
  
  var box = this.makeWorkBox(id, x, y, title);
   
  this.graph.addCell(box);
 };
 
 
 
 //
 // case box を1つ加える。
 //
 this.addCaseBox = function (id){
  var x     = this.caseDataList[id]["x"];
  var y     = this.caseDataList[id]["y"];
  var title = this.caseDataList[id]["title"];
  
  var box = this.makeCaseBox(id, x, y, title);
  
  this.graph.addCell(box);
 };
 
 
 
 //
 // terminal box を1つ加える。
 //
 this.addTerminalBox = function (id){
  var x     = this.terminalDataList[id]["x"];
  var y     = this.terminalDataList[id]["y"];
  var title = this.terminalDataList[id]["title"];
  
  var box = this.makeTerminalBox(id, x, y, title);
  
  this.graph.addCell(box);
 };
 
 
 
 //
 // スタートのlink を加える。
 //
 this.addStartLink = function(){
  var startLinkTarget   = this.startData["start_link_target"];
  var startLinkVertices = this.startData["start_link_vertices"];
  var startLink = this.makeStartLink(startLinkTarget, startLinkVertices);
  this.graph.addCell(startLink);
 };
 
 
 
 //
 // OK, NG link を加える。
 //
 this.addOkNgLink = function(id){
  var okLink = this.makeOkNgLink(id, "ok", this.workDataList[id]["ok_link_target"], this.workDataList[id]["ok_link_vertices"]);
  var ngLink = this.makeOkNgLink(id, "ng", this.workDataList[id]["ng_link_target"], this.workDataList[id]["ng_link_vertices"]);
  var throughLink = this.makeOkNgLink(id, "through", this.workDataList[id]["through_link_target"], this.workDataList[id]["through_link_vertices"]);
  
  this.graph.addCell(okLink);
  this.graph.addCell(ngLink);
  this.graph.addCell(throughLink);
 };
 
 
 
 //
 // 場合分けのlink を加える。
 //
 this.addCaseLink = function(id){
  for(var i = 0, j = this.caseDataList[id]["link_target_list"].length; i < j; i ++){
   if((this.caseDataList[id]["link_target_list"][i] !== null) && (this.caseDataList[id]["link_target_list"][i] !== undefined)){
    var caseIndex = i;
    var target    = this.caseDataList[id]["link_target_list"][i];
    var labelText = this.caseDataList[id]["link_label_list"][i];
    var vertices  = this.caseDataList[id]["link_vertices_list"][i];
    
    var link = this.makeCaseLink(id, caseIndex, target, labelText, vertices);
    
    this.graph.addCell(link);
   }
  }
 };
 
 
 
 //
 // flow data を取得する。
 //
 this.getFlowData = function(){
  var flowId = objControleStorageS.getFlowId();
  var taskId = objControleStorageS.getTaskId();
  
  if((flowId !== null) && (flowId !== undefined) && (flowId.length > 0)){
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/get_flow_data.cgi",
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
        // objTelnetmanWorkFlow.startData
        //x : 90, y : 20, start_link_target : {x:120, y:160}, start_link_vertices : [{},{},{}]
        var flowTitle         = hashResult["flow_title"];
        var flowDescription   = hashResult["flow_description"];
        var paperHeight       = hashResult["paper_height"];
        
        var taskTitle         = hashResult["task_title"];
        
        var startX            = hashResult["start_data"]["x"];
        var startY            = hashResult["start_data"]["y"];
        var startLinkTarget   = hashResult["start_data"]["start_link_target"];
        var startLinkVertices = hashResult["start_data"]["start_link_vertices"];
        
        document.getElementById(objTelnetmanWorkFlow.idFlowTitleArea).innerHTML = flowTitle;
        
        if(taskTitle.length > 0){
         document.getElementById(objTelnetmanWorkFlow.idTaskTitleArea).innerHTML = taskTitle;
        }
        
        objTelnetmanWorkFlow.paperHeight = paperHeight;
        
        objTelnetmanWorkFlow.startData["x"] = startX;
        objTelnetmanWorkFlow.startData["y"] = startY;
        
        objTelnetmanWorkFlow.startData["start_link_target"] = new Object();
        for(var key in startLinkTarget){
         var value = startLinkTarget[key];
         objTelnetmanWorkFlow.startData["start_link_target"][key] = value;
        }
        
        objTelnetmanWorkFlow.startData["start_link_vertices"] = new Array();
        for(var i = 0, j = startLinkVertices.length; i < j; i ++){
         objTelnetmanWorkFlow.startData["start_link_vertices"][i] = new Object();
         for(key in startLinkVertices[i]){
          value = startLinkVertices[i][key];
          objTelnetmanWorkFlow.startData["start_link_vertices"][i][key] = value;
         }
        }
        
        
        // objTelnetmanWorkFlow.goalData
        var goalX = hashResult["goal_data"]["x"];
        var goalY = hashResult["goal_data"]["y"];
        objTelnetmanWorkFlow.goalData["x"] = goalX;
        objTelnetmanWorkFlow.goalData["y"] = goalY;
        
        
        // workDataList
        // "work_1" : {x : 100, y : 180,  title : "設定"     , ok_link_target : {id:"work_5"}, ng_link_target : {id:"work_2"}, ok_link_vertices : [{x:300,y:60}, {x:400,y:60},{x:400,y:20}], ng_link_vertices : [{},{}]},
        for(var workId in hashResult["work_list"]){
         var workTitle = hashResult["work_list"][workId]["title"];
         var workX     = hashResult["work_list"][workId]["x"];
         var workY     = hashResult["work_list"][workId]["y"];
         var okLinkTarget      = hashResult["work_list"][workId]["ok_link_target"];
         var ngLinkTarget      = hashResult["work_list"][workId]["ng_link_target"];
         var throughLinkTarget = hashResult["work_list"][workId]["through_link_target"];
         var okLinkVertices      = hashResult["work_list"][workId]["ok_link_vertices"];
         var ngLinkVertices      = hashResult["work_list"][workId]["ng_link_vertices"];
         var throughLinkVertices = hashResult["work_list"][workId]["through_link_vertices"];
         
         objTelnetmanWorkFlow.workDataList[workId] = new Object();
         
         objTelnetmanWorkFlow.workDataList[workId]["x"] = workX;
         objTelnetmanWorkFlow.workDataList[workId]["y"] = workY;
         objTelnetmanWorkFlow.workDataList[workId]["title"] = workTitle;
         
         objTelnetmanWorkFlow.workDataList[workId]["ok_link_target"] = new Object();
         for(key in okLinkTarget){
          value = okLinkTarget[key];
          objTelnetmanWorkFlow.workDataList[workId]["ok_link_target"][key] = value;
         }
         
         objTelnetmanWorkFlow.workDataList[workId]["ng_link_target"] = new Object();
         for(key in ngLinkTarget){
          value = ngLinkTarget[key];
          objTelnetmanWorkFlow.workDataList[workId]["ng_link_target"][key] = value;
         }
         
         objTelnetmanWorkFlow.workDataList[workId]["through_link_target"] = new Object();
         for(key in throughLinkTarget){
          value = throughLinkTarget[key];
          objTelnetmanWorkFlow.workDataList[workId]["through_link_target"][key] = value;
         }
         
         objTelnetmanWorkFlow.workDataList[workId]["ok_link_vertices"] = new Array();
         for(i = 0, j = okLinkVertices.length; i < j; i ++){
          objTelnetmanWorkFlow.workDataList[workId]["ok_link_vertices"][i] = new Object();
          for(key in okLinkVertices[i]){
           value = okLinkVertices[i][key];
           objTelnetmanWorkFlow.workDataList[workId]["ok_link_vertices"][i][key] = value;
          }
         }
         
         objTelnetmanWorkFlow.workDataList[workId]["ng_link_vertices"] = new Array();
         for(i = 0, j = ngLinkVertices.length; i < j; i ++){
          objTelnetmanWorkFlow.workDataList[workId]["ng_link_vertices"][i] = new Object();
          for(key in ngLinkVertices[i]){
           value = ngLinkVertices[i][key];
           objTelnetmanWorkFlow.workDataList[workId]["ng_link_vertices"][i][key] = value;
          }
         }
         
         objTelnetmanWorkFlow.workDataList[workId]["through_link_vertices"] = new Array();
         for(i = 0, j = throughLinkVertices.length; i < j; i ++){
          objTelnetmanWorkFlow.workDataList[workId]["through_link_vertices"][i] = new Object();
          for(key in throughLinkVertices[i]){
           value = throughLinkVertices[i][key];
           objTelnetmanWorkFlow.workDataList[workId]["through_link_vertices"][i][key] = value;
          }
         }
        }
        
        
        // caseDataList
        // "case_1" : {x : 100, y : 30, title : "ホスト名" , link_target_list : [{id:"work_1"},{x:200,y:200},{x:600,y:40},{x:800,y:80}], link_label_list : ["場合1","場合2","場合3","場合4"], link_vertices_list : [[{x:100, y:100},{},{}],[],[],[]]}
        for(var caseId in hashResult["case_list"]){
         var caseTitle        = hashResult["case_list"][caseId]["title"];
         var caseX            = hashResult["case_list"][caseId]["x"];
         var caseY            = hashResult["case_list"][caseId]["y"];
         var linkTargetList   = hashResult["case_list"][caseId]["link_target_list"];
         var linkLabelList    = hashResult["case_list"][caseId]["link_label_list"];
         var linkVerticesList = hashResult["case_list"][caseId]["link_vertices_list"];
         
         objTelnetmanWorkFlow.caseDataList[caseId] = new Object();
         
         objTelnetmanWorkFlow.caseDataList[caseId]["x"] = caseX;
         objTelnetmanWorkFlow.caseDataList[caseId]["y"] = caseY;
         objTelnetmanWorkFlow.caseDataList[caseId]["title"] = caseTitle;
         
         objTelnetmanWorkFlow.caseDataList[caseId]["link_target_list"] = new Array();
         for(i = 0, j = linkTargetList.length; i < j; i ++){
          objTelnetmanWorkFlow.caseDataList[caseId]["link_target_list"][i] = new Object();
          for(key in linkTargetList[i]){
           value = linkTargetList[i][key];
           objTelnetmanWorkFlow.caseDataList[caseId]["link_target_list"][i][key] = value;
          }
         }
         
         objTelnetmanWorkFlow.caseDataList[caseId]["link_label_list"] = new Array();
         for(i = 0, j = linkLabelList.length; i < j; i ++){
          value = linkLabelList[i];
          objTelnetmanWorkFlow.caseDataList[caseId]["link_label_list"][i] = value;
         }
         
         objTelnetmanWorkFlow.caseDataList[caseId]["link_vertices_list"] = new Array();
         for(i = 0, j = linkVerticesList.length; i < j; i ++){
          objTelnetmanWorkFlow.caseDataList[caseId]["link_vertices_list"][i] = new Array();
          for(var k = 0, l = linkVerticesList[i].length; k < l; k ++){
           objTelnetmanWorkFlow.caseDataList[caseId]["link_vertices_list"][i][k] = new Object();
           for(key in linkVerticesList[i][k]){
            value = linkVerticesList[i][k][key];
            objTelnetmanWorkFlow.caseDataList[caseId]["link_vertices_list"][i][k][key] = value;
           }
          }
         }
        }
        
        
        // terminalDataList
        for(var terminalId in hashResult["terminal_list"]){
         var terminalTitle        = hashResult["terminal_list"][terminalId]["title"];
         var terminalX            = hashResult["terminal_list"][terminalId]["x"];
         var terminalY            = hashResult["terminal_list"][terminalId]["y"];
         
         objTelnetmanWorkFlow.terminalDataList[terminalId] = new Object();
         
         objTelnetmanWorkFlow.terminalDataList[terminalId]["x"] = terminalX;
         objTelnetmanWorkFlow.terminalDataList[terminalId]["y"] = terminalY;
         objTelnetmanWorkFlow.terminalDataList[terminalId]["title"] = terminalTitle;
        }
        
        objTelnetmanWorkFlow.makeWorkFlow();
        objTelnetmanWorkFlow.optimizeWorkflowAreaHeight();
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
 
 
 
 this.makeWorkFlow = function (){
  $(function(){
   objTelnetmanWorkFlow.paper = new joint.dia.Paper({
    el: document.getElementById(objTelnetmanWorkFlow.idWorkFlowZone),
    width: objTelnetmanWorkFlow.paperWidth,
    height: objTelnetmanWorkFlow.paperHeight,
    model: objTelnetmanWorkFlow.graph,
    gridSize: 1
   });
  
   objTelnetmanWorkFlow.paper.on(
    "cell:pointerdown",
    function(cellView, evt, x, y) {
     if(cellView.model.isLink()){
      var id       = cellView.model["attributes"]["id"];
      
      objTelnetmanWorkFlow.pointerdownLinkId = id;
      objTelnetmanWorkFlow.cloneLink = cellView.model.clone();     
     }
    }
   );
   
   objTelnetmanWorkFlow.paper.on(
    "cell:pointerup",
    function(cellView, evt, x, y) {
     if(cellView.model.isLink()){
      var id       = cellView.model["attributes"]["id"];
      var source   = cellView.model["attributes"]["source"];
      
      if("id" in source){
       var exists = objTelnetmanWorkFlow.existsLink(source["id"], id);
       
       if(!exists){
        objTelnetmanWorkFlow.cloneLink.id = objTelnetmanWorkFlow.pointerdownLinkId;
        objTelnetmanWorkFlow.cloneLink["attributes"]["id"] = objTelnetmanWorkFlow.pointerdownLinkId;
        objTelnetmanWorkFlow.graph.addCell(objTelnetmanWorkFlow.cloneLink);
       } 
      }
      else if (("x" in source) && ("y" in source)){
       cellView.model.remove();
       objTelnetmanWorkFlow.cloneLink.id = objTelnetmanWorkFlow.pointerdownLinkId;
       objTelnetmanWorkFlow.cloneLink["attributes"]["id"] = objTelnetmanWorkFlow.pointerdownLinkId;
       objTelnetmanWorkFlow.graph.addCell(objTelnetmanWorkFlow.cloneLink);
      }
     }
    }
   );
   
   objTelnetmanWorkFlow.paper.on(
    "cell:pointerdblclick",
    function(cellView, evt, x, y) {
     if(!cellView.model.isLink()){
      id = cellView.model["attributes"]["id"]; 
      objTelnetmanWorkFlow.selectedBoxId = id;
      
      var pageType = objControleStorageS.getPageType();
      
      if(pageType === 'flow'){
       objUpdateFlow.getBoxData(id);
      }
      else if(pageType === 'task'){
       objUpdateTask.getBoxData(id);
      }
     }
    }
   );
   
   objTelnetmanWorkFlow.addWorkFlowElements();
   
   var pageType = objControleStorageS.getPageType();
   if(pageType === 'task'){
    objUpdateTask.checkLastStatus();
   }
  });
 };
 
 
 this.addWorkFlowElements = function (){
  this.addStart();
  this.addGoal();
  
  for(var id in this.workDataList){
   this.addWorkBox(id);
  }
  
  for(id in this.caseDataList){
   this.addCaseBox(id);
  }
  
  for(id in this.terminalDataList){
   this.addTerminalBox(id);
  }
  
  this.addStartLink();
  
  for(id in this.workDataList){
   this.addOkNgLink(id);
  }
  
  for(id in this.caseDataList){
   this.addCaseLink(id);
  }
 };
 
 
 
 //
 // link が操作された後、削除されたかどうか確認する。
 //
 this.existsLink = function (sourceId, linkId){
  var exists = false;
 
  var box = this.graph.getCell(sourceId);
  var linkList = this.graph.getConnectedLinks(box);
  
  for(var k = 0, l = linkList.length; k < l; k ++){
   if(linkList[k]["attributes"]["id"] === linkId){
    exists = true;
    break;
   }
  }
  
  return(exists);
 };
 
 
 
 //
 // 新規work box の初期データを作る。
 //
 this.createNewWorkData = function (){
  var scrollY = document.getElementById(this.idWorkFlowArea).scrollTop;
  var boxX = this.paperWidth - this.boxWidth - 100;
  var boxY = 20 + scrollY;
  var okLinkX = boxX + this.boxWidth / 2;
  var okLinkY = boxY + this.boxHeight + 80; 
  var ngLinkX = boxX + this.boxWidth + 80;
  var ngLinkY = boxY + this.boxHeight / 2; 
  var throughLinkX = ngLinkX;
  var throughLinkY = okLinkY;
  
  var newWorkData = new Object();
  newWorkData["x"] = boxX;
  newWorkData["y"] = boxY;
  newWorkData["title"] = "新規";
  newWorkData["ok_link_target"] = new Object();
  newWorkData["ok_link_target"]["x"] = okLinkX;
  newWorkData["ok_link_target"]["y"] = okLinkY;
  newWorkData["ng_link_target"] = new Object();
  newWorkData["ng_link_target"]["x"] = ngLinkX;
  newWorkData["ng_link_target"]["y"] = ngLinkY;
  newWorkData["through_link_target"] = new Object();
  newWorkData["through_link_target"]["x"] = throughLinkX;
  newWorkData["through_link_target"]["y"] = throughLinkY;
  newWorkData["ok_link_vertices"] = new Array();
  newWorkData["ng_link_vertices"] = new Array();
  newWorkData["through_link_vertices"] = new Array();
  
  this.jsonTmpNewWorkData = JSON.stringify(newWorkData);
  
  return(newWorkData);
 };
 
 //
 // work box を新規作成する。
 //
 this.addNewWorkBox = function (workId){
  if((workId !== null) && (workId !== undefined) && (workId.length > 0)){
   var newWorkData = JSON.parse(this.jsonTmpNewWorkData);
   this.workDataList[workId] = newWorkData;
   
   this.addWorkBox(workId);
   this.addOkNgLink(workId);
  }
  else{
   this.jsonTmpNewWorkData = "";
  }
 };
 
 
 
 //
 // 新規case box の初期データを作る。
 //
 this.createNewCaseData = function (){
  var scrollY = document.getElementById(this.idWorkFlowArea).scrollTop;
  var boxX = this.paperWidth - this.boxWidth - 100;
  var boxY = 20 + scrollY;
  var case1LinkX = boxX + this.boxWidth / 2;
  var case1LinkY = boxY + this.boxHeight + 80;
  var case2LinkX = boxX + this.boxWidth + 80;
  var case2LinkY = boxY + this.boxHeight / 2;
  
  var newCaseData = new Object();
  newCaseData["x"] = boxX;
  newCaseData["y"] = boxY;
  newCaseData["title"] = "新規";
  newCaseData["link_target_list"] = new Array();
  newCaseData["link_target_list"][0] = new Object();
  newCaseData["link_target_list"][0]["x"] = case1LinkX;
  newCaseData["link_target_list"][0]["y"] = case1LinkY;
  newCaseData["link_target_list"][1] = new Object();
  newCaseData["link_target_list"][1]["x"] = case2LinkX;
  newCaseData["link_target_list"][1]["y"] = case2LinkY;
  newCaseData["link_label_list"] = new Array();
  newCaseData["link_label_list"][0] = "場合1";
  newCaseData["link_label_list"][1] = "場合2";
  newCaseData["link_vertices_list"] = new Array();
  newCaseData["link_vertices_list"][0] = new Array();
  newCaseData["link_vertices_list"][1] = new Array();
  
  this.jsonTmpNewCaseData = JSON.stringify(newCaseData);
  
  return(newCaseData);
 };
 
 //
 // case box を新規作成する。
 //
 this.addNewCaseBox = function (caseId){
  if((caseId !== null) && (caseId !== undefined) && (caseId.length > 0)){
   var newCaseData = JSON.parse(this.jsonTmpNewCaseData);
   this.caseDataList[caseId] = newCaseData;
   
   this.addCaseBox(caseId);
   this.addCaseLink(caseId);
  }
  else{
   this.jsonTmpNewCaseData = "";
  }
 };
 
 //
 // 対象box のlink のid 一覧を作る。
 //
 this.makeLinkIdList = function (boxId){
  var linkIdList = new Object();
  var box = this.graph.getCell(boxId);
  var linkList = this.graph.getConnectedLinks(box);
  
  for(var k = 0, l = linkList.length; k < l; k ++){
   if(("id" in linkList[k]["attributes"]["source"]) && (linkList[k]["attributes"]["source"]["id"] === boxId)){
    var linkId = linkList[k].id;
    linkIdList[linkId] = linkId;
   } 
  }
  
  return(linkIdList);
 };
 
 
 //
 // 新規case link を追加する。
 //
 this.addNewCaseLink = function (caseId, N){
  var displayNumber = N + 1;
  var stringDisplayNumber = displayNumber.toString();
  
  var box = this.graph.getCell(caseId);
  var boxX = box["attributes"]["position"]["x"];
  var boxY = box["attributes"]["position"]["y"];
  var linkX = boxX + this.boxWidth  + 80;
  var linkY = boxY + this.boxHeight + 80;
  
  var target = new Object();
  target["x"] = linkX;
  target["y"] = linkY;
  var label = "場合" + stringDisplayNumber;
  var vertices = new Array();
  
  this.caseDataList[caseId]["link_target_list"].push(target);
  this.caseDataList[caseId]["link_label_list"].push(label);
  this.caseDataList[caseId]["link_vertices_list"].push(vertices);
  
  var link = this.makeCaseLink(caseId, N, target, label, vertices);
  var linkId = link.id;
   
  this.graph.addCell(link);
 };
 
 //
 // case link を削除する。
 //
 this.deleteCaseLink = function (caseId, N){
  this.caseDataList[caseId]["link_target_list"][N] = null;
  this.caseDataList[caseId]["link_label_list"][N] = "";
  this.caseDataList[caseId]["link_vertices_list"][N] = null;
  
  var box = this.graph.getCell(caseId);
  var linkList = this.graph.getConnectedLinks(box);
  
  for(var k = 0, l = linkList.length; k < l; k ++){
   if(("id" in linkList[k]["attributes"]["source"]) && (linkList[k]["attributes"]["source"]["id"] === caseId)){
    var linkId = linkList[k].id;
    var linkIndex = this.getLinkIndex(linkId);
    
    if(linkIndex === N){
     var removeId = linkId + "-" + linkIndex.toString();
     linkList[k].remove();
     break;
    }
   }
  }
 };
 
 // 
 // null になっているcase link のデータを削除し、残っているcase link のID を書き換える。
 //
 this.optimizeCaseData = function (caseId){
  var effectiveLinkIndexList1 = new Array();
  for(var n = this.caseDataList[caseId]["link_target_list"].length - 1; n >= 0; n --){
   if(this.caseDataList[caseId]["link_target_list"][n] === null){
    this.caseDataList[caseId]["link_target_list"].splice(n, 1);
    this.caseDataList[caseId]["link_label_list"].splice(n, 1);
    this.caseDataList[caseId]["link_vertices_list"].splice(n, 1);
   }
   else{
    effectiveLinkIndexList1.unshift(n);
   }
  }
  
  var effectiveLinkIndexList2 = new Object();
  for(var a = 0, b = effectiveLinkIndexList1.length; a < b; a ++){
   var newIndex = a;
   var oldIndex = effectiveLinkIndexList1[a];
   var stringOldIndex = oldIndex.toString();
   effectiveLinkIndexList2[stringOldIndex] = newIndex;
  }
    
  var box = this.graph.getCell(caseId);
  var linkList = this.graph.getConnectedLinks(box);

  var renumberLinkList = new Array();
  for(var k = 0, l = linkList.length; k < l; k ++){
   if(("id" in linkList[k]["attributes"]["source"]) && (linkList[k]["attributes"]["source"]["id"] === caseId)){
    var linkId = linkList[k].id;
    var linkIndex = this.getLinkIndex(linkId);
    var stringLinkIndex = linkIndex.toString();
    newIndex = effectiveLinkIndexList2[stringLinkIndex];
    
    renumberLinkList[newIndex] = linkList[k];
   }
  }
  
  for(var caseIndex = 0, m = renumberLinkList.length; caseIndex < m; caseIndex ++){
   var currentLinkId = renumberLinkList[caseIndex].id;
   var currentCaseIndex = this.getLinkIndex(currentLinkId);
   
   if(currentCaseIndex !== caseIndex){
    var newLinkId = this.makeCaseLinkId(caseId, caseIndex);
    renumberLinkList[caseIndex].id = newLinkId;
    renumberLinkList[caseIndex]["attributes"]["id"] = newLinkId;
   }
  }
 };
 
 
 
 //
 // 新規terminal box の初期データを作る。
 //
 this.createNetTerminalData = function (){
  var scrollY = document.getElementById(this.idWorkFlowArea).scrollTop;
  var boxX = this.paperWidth - this.terminalBoxWidth - 100;
  var boxY = 20 + scrollY;
  
  var newTerminalData = new Object();
  newTerminalData["x"] = boxX;
  newTerminalData["y"] = boxY;
  newTerminalData["title"] = "終了";
  
  this.jsonTmpNewTerminalData = JSON.stringify(newTerminalData);
  
  return(newTerminalData);
 };
 
 //
 // terminal box を新規作成する。
 //
 this.addNewTerminalBox = function (terminalId){
  if((terminalId !== null) && (terminalId !== undefined) && (terminalId.length > 0)){
   var newTerminalData = JSON.parse(this.jsonTmpNewTerminalData);
   this.terminalDataList[terminalId] = newTerminalData;
   
   this.addTerminalBox(terminalId);
  }
  else{
   this.jsonTmpNewTerminalData = "";
  }
 };
 
 
 
 //
 // box を削除する。
 //
 this.removeBox = function (boxId){
  var box = this.graph.getCell(boxId);
  var linkList = this.graph.getConnectedLinks(box);
  var centerX = box["attributes"]["position"]["x"] + this.boxWidth / 2;
  var centerY = box["attributes"]["position"]["y"] + this.boxHeight / 2;
  
  if(boxId.match(/^terminal_/)){
   centerX = box["attributes"]["position"]["x"] + this.terminalBoxWidth / 2;
  }
  
  for(var k = 0, l = linkList.length; k < l; k ++){
   var target = linkList[k]["attributes"]["target"];
   
   if("id" in target){
    if(target["id"] === boxId){
     linkList[k].set("target", {x:centerX, y:centerY});
    }
   }
  }
  
  box.remove();
  
  if(boxId.match(/^work_/)){
   if(boxId in this.workDataList){
    delete(this.workDataList[boxId]);
   }
  }
  else if(boxId.match(/^case_/)){
   if(boxId in this.caseDataList){
    objParameterConditions.changes = false;
    delete(this.caseDataList[boxId]);
   }
  }
  else if(boxId.match(/^terminal_/)){
   if(boxId in this.terminalDataList){
    delete(this.terminalDataList[boxId]);
   }
  }
 };
 
 
 
 //
 // 縦を伸ばす。
 //
 this.extendPaper = function (height){
  if((height === null) || (height === undefined) || (typeof(height) !== "number")){
   height = this.paperHeight + 600;
  }
  
  var width  = this.paperWidth;
  var stringHeight = height.toString();
  
  document.getElementById(this.idWorkFlowZone).style.height = stringHeight + "px";
  this.paper.setDimensions(width, height);
  
  this.paperHeight = height;
 };
 
 
 
 //
 // 縦を調整する。
 //
 this.adjustPaper = function (){
  var height = this.checkMaxY() + this.boxHeight;
  
  if(height < this.paperHeight){
   var width  = this.paperWidth;
   
   var stringHeight = height.toString();
   
   document.getElementById(this.idWorkFlowZone).style.height = stringHeight + "px";
   this.paper.setDimensions(width, height);
   
   this.paperHeight = height;
  }
 };
 
 
 
 //
 // link id からlink index を取り出す。
 //
 this.getLinkIndex = function (linkId){
  var splitLintId = linkId.split("-");
  var stringLinkIndex = splitLintId.pop();
  var linkIndex = parseInt(stringLinkIndex, 10);
  
  return(linkIndex);
 };
 
 
 
 //
 // 全box の配置、全link のtarget, vertices, label を取得する。 
 //
 this.getConfiguration = function (){
  var boxList = this.graph.getElements();
  
  for(var i = 0, j = boxList.length; i < j; i ++){
   var boxId = boxList[i].id;
   var x     = boxList[i]["attributes"]["position"]["x"];
   var y     = boxList[i]["attributes"]["position"]["y"];
   var title = boxList[i]["attributes"]["attrs"]["text"]["text"];
   var linkList = this.graph.getConnectedLinks(boxList[i]);
   
   if(boxId.match(/^start_/)){
    this.startData["x"] = x;
    this.startData["y"] = y;
   }
   else if(boxId.match(/^goal_/)){
    this.goalData["x"] = x;
    this.goalData["y"] = y;
   }
   else if(boxId.match(/^work_/)){
    this.workDataList[boxId]["x"] = x;
    this.workDataList[boxId]["y"] = y;
    this.workDataList[boxId]["title"] = title;
   }
   else if(boxId.match(/^case_/)){
    this.caseDataList[boxId]["x"] = x;
    this.caseDataList[boxId]["y"] = y;
    this.caseDataList[boxId]["title"] = title;
   }
   else if(boxId.match(/^terminal_/)){
    this.terminalDataList[boxId]["x"] = x;
    this.terminalDataList[boxId]["y"] = y;
    this.terminalDataList[boxId]["title"] = title;
   }
   
   for(var k = 0, l = linkList.length; k < l; k ++){
    if(("id" in linkList[k]["attributes"]["source"]) && (linkList[k]["attributes"]["source"]["id"] === boxId)){
     var linkId   = linkList[k].id;
     var target   = linkList[k]["attributes"]["target"];
     var vertices = linkList[k]["attributes"]["vertices"];
     
     if(boxId.match(/^start_/)){
      for(var key in this.startData["start_link_target"]){
       delete(this.startData["start_link_target"][key]);
      }
      for(key in target){
       var value = target[key];
       this.startData["start_link_target"][key] = value;
      }
      
      var lengthVertices =  this.startData["start_link_vertices"].length;
      this.startData["start_link_vertices"].splice(0, lengthVertices);
      for(var a = 0, b = vertices.length; a < b; a ++){
       this.startData["start_link_vertices"][a] = new Object();
       for(key in vertices[a]){
        value = vertices[a][key];
        this.startData["start_link_vertices"][a][key] = value;
       }
      }
     }
     else if(boxId.match(/^work_/)){
      if(linkId.match(/-ok$/)){
       for(key in this.workDataList[boxId]["ok_link_target"]){
        delete(this.workDataList[boxId]["ok_link_target"][key]);
       }
       for(key in target){
        value = target[key];
        this.workDataList[boxId]["ok_link_target"][key] = value;
       }
       
       lengthVertices = this.workDataList[boxId]["ok_link_vertices"].length;
       this.workDataList[boxId]["ok_link_vertices"].splice(0, lengthVertices);
       for(a = 0, b = vertices.length; a < b; a ++){
        this.workDataList[boxId]["ok_link_vertices"][a] = new Object();
        for(key in vertices[a]){
         value = vertices[a][key];
         this.workDataList[boxId]["ok_link_vertices"][a][key] = value;
        }
       }
      }
      else if(linkId.match(/-ng$/)){
       for(key in this.workDataList[boxId]["ng_link_target"]){
        delete(this.workDataList[boxId]["ng_link_target"][key]);
       }
       for(key in target){
        value = target[key];
        this.workDataList[boxId]["ng_link_target"][key] = value;
       }
       
       lengthVertices = this.workDataList[boxId]["ng_link_vertices"].length;
       this.workDataList[boxId]["ng_link_vertices"].splice(0, lengthVertices);
       for(a = 0, b = vertices.length; a < b; a ++){
        this.workDataList[boxId]["ng_link_vertices"][a] = new Object();
        for(key in vertices[a]){
         value = vertices[a][key];
         this.workDataList[boxId]["ng_link_vertices"][a][key] = value;
        }
       }
      }
      else if(linkId.match(/-through$/)){
       for(key in this.workDataList[boxId]["through_link_target"]){
        delete(this.workDataList[boxId]["through_link_target"][key]);
       }
       for(key in target){
        value = target[key];
        this.workDataList[boxId]["through_link_target"][key] = value;
       }
       
       lengthVertices = this.workDataList[boxId]["through_link_vertices"].length;
       this.workDataList[boxId]["through_link_vertices"].splice(0, lengthVertices);
       for(a = 0, b = vertices.length; a < b; a ++){
        this.workDataList[boxId]["through_link_vertices"][a] = new Object();
        for(key in vertices[a]){
         value = vertices[a][key];
         this.workDataList[boxId]["through_link_vertices"][a][key] = value;
        }
       }
      }
     }
     else if(boxId.match(/^case_/)){
      var label = linkList[k]["attributes"]["labels"][0]["attrs"]["text"]["text"];
      var linkIndex = this.getLinkIndex(linkId);
      
      if((this.caseDataList[boxId]["link_target_list"][linkIndex] !== null) && (this.caseDataList[boxId]["link_target_list"][linkIndex] !== undefined)){
       for(key in this.caseDataList[boxId]["link_target_list"][linkIndex]){
        delete(this.caseDataList[boxId]["link_target_list"][linkIndex][key]);
       }
      }
      else{
       this.caseDataList[boxId]["link_target_list"][linkIndex] = new Object();
      }
      for(key in target){
       value = target[key];
       this.caseDataList[boxId]["link_target_list"][linkIndex][key] = value;
      }
      
      this.caseDataList[boxId]["link_label_list"][linkIndex] = label;
      
      if((this.caseDataList[boxId]["link_vertices_list"][linkIndex] !== null) && (this.caseDataList[boxId]["link_vertices_list"][linkIndex] !== undefined)){
       lengthVertices = this.caseDataList[boxId]["link_vertices_list"][linkIndex].length;
       this.caseDataList[boxId]["link_vertices_list"][linkIndex].splice(0, lengthVertices);
      }
      else{
       this.caseDataList[boxId]["link_vertices_list"][linkIndex] = new Array();
      }
      
      for(a = 0, b = vertices.length; a < b; a ++){
       this.caseDataList[boxId]["link_vertices_list"][linkIndex][a] = new Object();
       for(key in vertices[a]){
        value = vertices[a][key];
        this.caseDataList[boxId]["link_vertices_list"][linkIndex][a][key] = value;
       }
      }
     }
    }
   }
  }
  
  var jsonStartData        = JSON.stringify(this.startData);
  var jsonGoalData         = JSON.stringify(this.goalData);
  var jsonWorkDataList     = JSON.stringify(this.workDataList);
  var jsonCaseDataList     = JSON.stringify(this.caseDataList);
  var jsonTerminalDataList = JSON.stringify(this.terminalDataList);
  
  return({json_start_data:jsonStartData, json_goal_data:jsonGoalData, json_word_data_list:jsonWorkDataList, json_case_data_list:jsonCaseDataList, json_terminal_data_list:jsonTerminalDataList, paper_height:this.paperHeight});
 };
 
 
 
 //
 // 次の行き先の色を変える。
 //
 this.highlightBox = function (boxId, targetBoxIdList){
  var box = this.graph.getCell(boxId);

  if(boxId.match(/^work_/)){
   box.attr({rect: {fill: "#f0f0ff"}, text: {fill: "#505050"}});
  }
  else if(boxId.match(/^case_/)){
   box.attr({rect: {fill: "#909090"}, text: {fill: "#f0f0f0"}});
  }

  if((targetBoxIdList !== null) && (targetBoxIdList !== undefined)){ 
   for(var k = 0, l = targetBoxIdList.length; k < l; k ++){
    var taregtBoxId = targetBoxIdList[k];
    
    if(taregtBoxId.length > 0){
     var targetBox = this.graph.getCell(taregtBoxId);
     
     if(taregtBoxId.match(/^work_/)){
      targetBox.attr({rect: {fill: "#556B2F"}, text: {fill: "#fffae0"}});
     }
     else if(taregtBoxId.match(/^case_/)){
      targetBox.attr({rect: {fill: "#556B2F"}, text: {fill: "#fffae0"}});
     }
     else if(taregtBoxId.match(/^terminal_/)){
      targetBox.attr({rect: {fill: "#556B2F"}, text: {fill: "#fffae0"}});
     }
     else if(taregtBoxId.match(/^goal_/)){
      targetBox.attr({circle: {fill: "#556B2F"}, text: {fill: "#fffae0"}});
     }
    }
   }
  }
 };
 
 
 
 //
 // box のタイトルを変える。
 //
 this.updateTitle = function (boxId, title, linklabelList){
  var box = this.graph.getCell(boxId);
  box.attr({text: {text: title}});
  
  if((linklabelList !== null) && (linklabelList !== undefined)){
   var linkList = this.graph.getConnectedLinks(box);
   
   for(var k = 0, l = linkList.length; k < l; k ++){
    if(("id" in linkList[k]["attributes"]["source"]) && (linkList[k]["attributes"]["source"]["id"] === boxId)){
     var linkId = linkList[k].id;
     var linkIndex = this.getLinkIndex(linkId);
     var label = linklabelList[linkIndex];
    
     linkList[k].label(0, {attrs:{text: {text: label}}});
    }
   }
  }
 };
 
 
 
 //
 // 画面の縦幅に合わせて流れ図の表示領域の高さを決める。
 //
 this.optimizeWorkflowAreaHeight = function (tableBottom){
  if((tableBottom !== null) && (tableBottom !== undefined)){
   tableBottom += 20;
  }
  else{
   tableBottom = 0;
  }
  
  var headerHeight = 100;
  var headerBoder = 10;
  var headerMarginBottom = 10;
  var workFlowAreaPadding = 30;
  var browserHeight = objCommon.getBrowserHeight();
  
  var workFlowAreaHeight = 0;
  if(browserHeight >= tableBottom){
   workFlowAreaHeight = browserHeight - headerHeight - headerBoder - headerMarginBottom - workFlowAreaPadding * 2 - 10;
  }
  else{
   workFlowAreaHeight = tableBottom - headerHeight - headerBoder - headerMarginBottom - workFlowAreaPadding * 2 - 10;
  }
  
  if(workFlowAreaHeight < this.paperHeight){
   document.getElementById(this.idWorkFlowArea).style.height = workFlowAreaHeight + "px";
  }
  else{
   document.getElementById(this.idWorkFlowArea).style.height = (this.paperHeight + 4) + "px";
  }
 };
 
 
 
 //
 // box の枠線を戻す。
 //
 this.returnStroke = function (boxId){
  var box = this.graph.getCell(boxId);
  
  if((box !== null) && (box !== undefined)){
   if(boxId.match(/^work_/)){
    box.attr({rect: {"stroke-width": 2, stroke: "#909090"}});
   }
   else if(boxId.match(/^case_/)){
    box.attr({rect: {"stroke-width": 2, stroke: "#c0c0c0"}});
   }
   else if(boxId.match(/^terminal_/)){
    box.attr({rect: {"stroke-width": 1, stroke: "#303030"}});
   }
   else if(boxId.match(/^goal_/) || boxId.match(/^start_/)){
    box.attr({circle: {"stroke-width": 1, stroke: "#303030"}});
   }
  }
 };
 
 //
 // box の枠線を変える。
 //
 this.changeStroke = function (boxId){
  var box = this.graph.getCell(boxId);
  
  if((box !== null) && (box !== undefined)){
   if(boxId.match(/^work_/)){
    box.attr({rect: {"stroke-width": 10, stroke: "#c0f090"}});
   }
   else if(boxId.match(/^case_/)){
    box.attr({rect: {"stroke-width": 10, stroke: "#c0f090"}});
   }
   else if(boxId.match(/^terminal_/)){
    box.attr({rect: {"stroke-width": 10, stroke: "#c0f090"}});
   }
   else if(boxId.match(/^goal_/) || boxId.match(/^start_/)){
    box.attr({circle: {"stroke-width": 10, stroke: "#c0f090"}});
   }
  }
 };
 
 
 
 //
 // 全要素の最大のy の値を求める。
 //
 this.checkMaxY = function (){
  var maxY = 0;
  
  var boxList = this.graph.getElements();
  
  for(var i = 0, j = boxList.length; i < j; i ++){
   var boxId = boxList[i].id;
   var y = boxList[i]["attributes"]["position"]["y"];
   
   if(y > maxY){
    maxY = y;
   }
   
   var linkList = this.graph.getConnectedLinks(boxList[i]);
   
   for(var k = 0, l = linkList.length; k < l; k ++){
    if(("id" in linkList[k]["attributes"]["source"]) && (linkList[k]["attributes"]["source"]["id"] === boxId)){
     var target   = linkList[k]["attributes"]["target"];
     var vertices = linkList[k]["attributes"]["vertices"];
     
     if(("y" in target) && (target["y"] > maxY)){
      maxY = target["y"];
     }

     for(var a = 0, b = vertices.length; a < b; a ++){
      if(vertices[a]["y"] > maxY){
       maxY = vertices[a]["y"];
      }
     }
    }
   }
  }
  
  return(maxY);
 };
 
 
 
 //
 // タイトルを更新する。
 //
 this.updateTitlePassword = function (titlePassword){
  var title = "";
  var flowPassword = "";
  var taskPassword = "";
  
  if(titlePassword === "title"){
   title = document.getElementById(this.idNewTitle).value;
  }
  else if(titlePassword === "flow_password"){
   flowPassword = document.getElementById(this.idNewFlowPassword).value;
  }
  else if(titlePassword === "task_password"){
   taskPassword = document.getElementById(this.idNewTaskPassword).value;
  }
  
  if(((title !== null) && (title !== undefined) && (title.length > 0)) || ((flowPassword !== null) && (flowPassword !== undefined) && (flowPassword.length > 0)) || ((taskPassword !== null) && (taskPassword !== undefined) && (taskPassword.length > 0))){
   objCommon.lockScreen();
   
   var pageType = objControleStorageS.getPageType();
   var flowId   = objControleStorageS.getFlowId();
   var taskId   = objControleStorageS.getTaskId();
   
   var header = objCommon.makeHttpHeader();
   
   $.ajax({
    headers : {"TelnetmanWF" : header},
    type : "post",
    url  : "/cgi-bin/TelnetmanWF/update_title_password.cgi",
    data : {
     "flow_id" : flowId,
     "task_id" : taskId,
     "page_type" : pageType,
     "title" : title,
     "flow_password" : flowPassword,
     "task_password" : taskPassword
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
        var pageType = hashResult["page_type"];
        var title    = hashResult["title"];
        var flowPassword = hashResult["flow_password"];
        var taskPassword = hashResult["task_password"];
        
        if(title.length > 0){
         document.getElementById(objTelnetmanWorkFlow.idNewTitle).value    = "";
         
         if(pageType === "flow"){
          document.getElementById(objTelnetmanWorkFlow.idFlowTitleArea).innerHTML = title;
         }
         else if(pageType === "task"){
          document.getElementById(objTelnetmanWorkFlow.idTaskTitleArea).innerHTML = title;
         }
        }
        else if(flowPassword.length > 0){
         document.getElementById(objTelnetmanWorkFlow.idNewFlowPassword).value = "";
         objControleStorageS.setFlowPassword(flowPassword);
        }
        else if(taskPassword.length > 0){
         document.getElementById(objTelnetmanWorkFlow.idNewTaskPassword).value = "";
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
     objCommon.unlockScreen();
    }
   });
  }
 };
 
 
 return(this);
}

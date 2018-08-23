// 説明   : パラメーターシートでの条件分岐の条件作成画面。
// 作成日 : 2015/06/15
// 作成者 : 江野高広

var objParameterConditions = new parameterConditions();

function parameterConditions (){
 this.caseId = "";
 this.idParameterConditions = "";
 this.linkLabelList = new Array();
 this.parameterConditions = new Array();
 this.effectiveConditionFlagList = new Array();
 this.changes = false;
 
 //
 // 入力データの初期化
 //
 this.initialize = function (){
  this.changes = false;
  this.caseId = "";
  this.idParameterConditions = "";
  
  for(var i = this.linkLabelList.length - 1; i >= 0; i --){
   this.linkLabelList.splice(i, 1);
  }
  
  for(i = this.parameterConditions.length - 1; i >= 0; i --){
   for(var j = this.parameterConditions[i].length - 1; j >= 0; j --){
    for(var k = this.parameterConditions[i][j].length - 1; k >= 0; k --){
     this.parameterConditions[i][j].splice(k, 1);
    }
    this.parameterConditions[i].splice(j, 1);
   }
   this.parameterConditions.splice(i, 1);
  }
  
  for(var l = this.effectiveConditionFlagList.length - 1; l >= 0; l --){
   this.effectiveConditionFlagList.splice(l, 1);
  }
 };
 
 
 
 //
 // データ入力
 //
 this.inputCaseId = function (caseId){
  this.caseId = caseId;
 };
 
 this.iputIdParameterConditions = function (idParameterConditions){
  this.idParameterConditions = idParameterConditions;
 };
 
 this.inputLinkLabelList = function (linkLabelList){
  for(var i = this.linkLabelList.length - 1; i >= 0; i --){
   this.linkLabelList.splice(i, 1);
  }
  
  for(var k = 0, l = linkLabelList.length; k < l; k ++){
   var label = linkLabelList[k];
   this.linkLabelList[k] = label;
  }
 };
 
 this.inputPparameterConditions = function (parameterConditions){
  this.changes = false;
  
  for(var i = this.parameterConditions.length - 1; i >= 0; i --){
   for(var j = this.parameterConditions[i].length - 1; j >= 0; j --){
    for(var k = this.parameterConditions[i][j].length - 1; k >= 0; k --){
     this.parameterConditions[i][j].splice(k, 1);
    }
    this.parameterConditions[i].splice(j, 1);
   }
   this.parameterConditions.splice(i, 1);
  }
  
  for(var l = this.effectiveConditionFlagList.length - 1; l >= 0; l --){
   this.effectiveConditionFlagList.splice(l, 1);
  }
  
  for(var a = 0, b = parameterConditions.length; a < b; a ++){
   this.parameterConditions[a] = new Array();
   for(var c = 0, d = parameterConditions[a].length; c < d; c ++){
    this.parameterConditions[a][c] = new Array();
    for(var e = 0, f = parameterConditions[a][c].length; e < f; e ++){
     value = parameterConditions[a][c][e];
     this.parameterConditions[a][c][e] = value;
    }
   }
   
   this.effectiveConditionFlagList[a] = true;
  }
 };
 
 
 this.idConditionArea = function (N){
  return("conditions_" + N + "_area");
 };
 
 this.idConditionLabel = function (N){
  return("conditions_" + N + "_label");
 };
 
 this.idCreateNewConditionLineButton = function (N){
  return("conditions_" + N + "_new_line");
 };
 
 this.idConditionLine = function (N, x) {
  return("conditions_" + N + "_line_" + x);
 };
 
 this.idCreateNewConditionFieldButton = function (N, x) {
  return("conditions_" + N + "_new_field_" + x);
 };
 
 this.idCondition = function (N, x, y) {
  return("conditions_" + N + "_" + x + "_" + y);
 };
 
 this.idImgAddNewConditions = function (){
  return("add_new_conditions");
 };
 
 // 条件入力欄を作り表示する。
 this.displayConditions = function (){
  var elParameterConditions = document.getElementById(this.idParameterConditions);
  
  var conditionDivList = elParameterConditions.childNodes;
  for(var i = conditionDivList.length - 1; i >= 0; i --){
   elParameterConditions.removeChild(conditionDivList[i]);
  }
  
  for(var N = 0, M = this.parameterConditions.length; N < M; N ++){
   var elDiv = this.makeConditionZone(N);
   elParameterConditions.appendChild(elDiv);
   this.createConditionArea(N);
   
   $("#" + this.idConditionArea(N)).animate({height:"show"}, "slow");
  }
  
  var elImgAdd = document.createElement("img");
  elImgAdd.setAttribute("src", "img/add.png");
  elImgAdd.setAttribute("width", "16");
  elImgAdd.setAttribute("height", "16");
  elImgAdd.setAttribute("alt", "append conditions");
  elImgAdd.setAttribute("class", "onclick_node");
  elImgAdd.setAttribute("id", this.idImgAddNewConditions);
  elImgAdd.onclick = new Function("objParameterConditions.add();");
  
  var elImgTelnetmanParameter = document.createElement("img");
  elImgTelnetmanParameter.setAttribute("src", "img/spellcheck.png");
  elImgTelnetmanParameter.setAttribute("width", "16");
  elImgTelnetmanParameter.setAttribute("height", "16");
  elImgTelnetmanParameter.setAttribute("alt", "Telnetman parameter help");
  elImgTelnetmanParameter.setAttribute("class", "onclick_node");
  elImgTelnetmanParameter.onclick = new Function("objParameterConditions.telnetmanParameterHelp();");
  
  elParameterConditions.appendChild(elImgAdd);
  elParameterConditions.appendChild(elImgTelnetmanParameter);
 };
 
 // 条件入力欄1つを作る。
 this.makeConditionZone = function (N){
  var displayNumber = N + 1;
  var stringDisplayNumber = displayNumber.toString();
  
  var elDiv = document.createElement("div");
  elDiv.setAttribute("id", this.idConditionArea(N));
  elDiv.setAttribute("class", "condition_zone");
  
  var elSpan = document.createElement("span");
  elSpan.innerHTML = "分岐条件" + stringDisplayNumber + "&nbsp;:&nbsp;";
  
  var elInput = document.createElement("input");
  elInput.setAttribute("type", "text");
  elInput.style.width = "96px";
  //elInput.setAttribute("size", "16");
  elInput.setAttribute("spellcheck", "false");
  elInput.setAttribute("autocomplete", "off");
  elInput.setAttribute("id", this.idConditionLabel(N));
  elInput.value = this.linkLabelList[N];
  elInput.onblur = new Function("objParameterConditions.readLabel(" + N + ")");
  
  var elImgDelete = document.createElement("img");
  elImgDelete.setAttribute("src", "img/cancel.png");
  elImgDelete.setAttribute("width", "16");
  elImgDelete.setAttribute("height", "16");
  elImgDelete.setAttribute("alt", "delete conditions");
  elImgDelete.setAttribute("class", "onclick_node");
  elImgDelete.onclick = new Function("objParameterConditions.deleteConditions(" + N + ")");
  
  var elH2 = document.createElement("h2");
  elH2.appendChild(elSpan);
  elH2.appendChild(elInput);
  elH2.appendChild(elImgDelete);
  
  elDiv.appendChild(elH2);
  
  return(elDiv);
 };
 
 
 // 条件分岐N の入力欄を作る。
 this.createConditionArea = function (N) {
  if(!document.getElementById(this.idCreateNewConditionLineButton(N))){
   var elImgDown = document.createElement("img");
   elImgDown.setAttribute("src", "img/arrow_down.png");
   elImgDown.setAttribute("width", "16");
   elImgDown.setAttribute("height", "16");
   elImgDown.setAttribute("alt", "append condition");
   elImgDown.setAttribute("class", "onclick_node");
   elImgDown.setAttribute("id", this.idCreateNewConditionLineButton(N));
   elImgDown.onclick = new Function("objParameterConditions.createNewConditionLine(" + N + ");");
   
   var elConditionArea = document.getElementById(this.idConditionArea(N));
   elConditionArea.appendChild(elImgDown);
  }
  
  for(var i = 0, j = this.parameterConditions[N].length; i < j; i ++){
   this.appendConditionLine(N, i);
   
   for(var k = 0, l = this.parameterConditions[N][i].length; k < l; k ++){
    var condition = this.parameterConditions[N][i][k];
    
    this.appendConditionField(N, i, k);
    document.getElementById(this.idCondition(N, i, k)).value = condition;
   }
  }
 };
 
 
 // 条件欄1つを加える。
 this.appendConditionField = function (N, x, y) {
  var elInput = document.createElement("input");
  elInput.setAttribute("type", "text");
  elInput.style.width = "120px";
  //elInput.setAttribute("size", "20");
  elInput.setAttribute("spellcheck", "false");
  elInput.setAttribute("autocomplete", "off");
  elInput.setAttribute("id", this.idCondition(N, x, y));
  elInput.setAttribute("value", "");
  elInput.onblur = new Function("objParameterConditions.readConditon(" + N + "," + x + "," + y + ")");
  
  var elConditionLine = document.getElementById(this.idConditionLine(N, x));
  var elImgRight = document.getElementById(this.idCreateNewConditionFieldButton(N, x));
  
  elConditionLine.insertBefore(elInput, elImgRight);
  
  // 横幅の調整
  var width = this.parameterConditions[N][x].length * 134 + 32;
  elConditionLine.style.width = width + "px";
 };
 
 
 // 条件入力欄を1行加える。
 this.appendConditionLine = function (N, x) {
  var elP = document.createElement("p");
  elP.setAttribute("id", this.idConditionLine(N, x));
  
  var elImgRight = document.createElement("img");
  elImgRight.setAttribute("src", "img/arrow_right.png");
  elImgRight.setAttribute("width", "16");
  elImgRight.setAttribute("height", "16");
  elImgRight.setAttribute("alt", "append condition");
  elImgRight.setAttribute("class", "onclick_node");
  elImgRight.setAttribute("id", this.idCreateNewConditionFieldButton(N, x));
  elImgRight.onclick = new Function("objParameterConditions.createNewConditionField(" + N + "," + x + ")");
  
  elP.appendChild(elImgRight);
  
  var elConditionArea = document.getElementById(this.idConditionArea(N));
  var elConditionNewLineButton = document.getElementById(this.idCreateNewConditionLineButton(N));
  
  elConditionArea.insertBefore(elP, elConditionNewLineButton);
 };
 
 
 // 条件分岐N の1要素に空のデータを入れる。
 this.pushEmptyCondition = function (N, x) {
  this.parameterConditions[N][x].push("");
 };
 
 
 // 空のデータを入れる。
 this.pushEmptyLine = function (N, x) {
  this.parameterConditions[N][x] = new Array();
 };
 
 
 // 新しい条件行を追加する。
 this.createNewConditionLine = function (N) {
  x = this.parameterConditions[N].length;
  
  this.pushEmptyLine(N, x);
  this.pushEmptyCondition(N, x);
  this.appendConditionLine(N, x);
  this.appendConditionField(N, x, 0);
 };
 
 
 // 新しい入力欄を作る。
 this.createNewConditionField = function (N, x) {
  var y = this.parameterConditions[N][x].length;
  
  this.pushEmptyCondition(N, x);
  this.appendConditionField(N, x, y);
 };
 
 // 入力された条件を読み取る。
 this.readConditon = function (N, x, y) {
  var condition = document.getElementById(this.idCondition(N, x, y)).value;
  
  if((condition !== null) && (condition !== undefined)){
   this.parameterConditions[N][x][y] = condition;
  }
  else {
   this.parameterConditions[N][x][y] = "";
  }
 };
 
 // 入力されたラベルを読み取る。
 this.readLabel = function (N){
  var label = document.getElementById(this.idConditionLabel(N)).value;
  this.linkLabelList[N] = label;
 };
 
 
 
 //
 // 分岐条件を追加する。
 //
 this.add = function (){
  var newConditions = new Array();
  newConditions[0] = new Array();
  newConditions[0][0] = "";
  
  this.parameterConditions.push(newConditions);
  this.effectiveConditionFlagList.push(true);
  
  var N = this.parameterConditions.length - 1;
  objTelnetmanWorkFlow.addNewCaseLink(this.caseId, N);
  
  var displayNumber = N + 1;
  var stringDisplayNumber = displayNumber.toString();
  this.linkLabelList.push("場合" + stringDisplayNumber);
  
  
  var elDiv = this.makeConditionZone(N);
  
  var elParameterConditions = document.getElementById(this.idParameterConditions);
  var elImgAdd = document.getElementById(this.idImgAddNewConditions);
  
  elParameterConditions.insertBefore(elDiv, elImgAdd);
  this.createConditionArea(N);
  $("#" + this.idConditionArea(N)).animate({height:"show"}, "slow");
  
  this.changes = true;
 };
 
 
 
 //
 // 条件分岐を削除する。
 //
 this.deleteConditions = function (N){
  this.effectiveConditionFlagList[N] = false;
  objTelnetmanWorkFlow.deleteCaseLink(this.caseId, N);
  
  $("#" + this.idConditionArea(N)).animate({height:"hide"}, "slow");
  
  this.changes = true;
 };
 
 
 
 //
 // 分岐条件を取得する。
 //
 this.getParameterConditions = function (){
  var parameterConditions = new Array();
  for(var n = 0, m = this.parameterConditions.length; n < m; n ++){
   if(this.effectiveConditionFlagList[n]){
    var parameterConditionsN = new Array();
    
    for(var i = 0, j = this.parameterConditions[n].length; i < j; i ++){
     var parameterConditionsNI = new Array();
     
     for(var k = 0, l = this.parameterConditions[n][i].length; k < l; k ++){
      var value = this.parameterConditions[n][i][k];
      value = value.replace(/^\s+/, "");
      value = value.replace(/\s$/, "");
      
      if(value.length > 0){
       parameterConditionsNI.push(value);
      }
     }
     
     if(parameterConditionsNI.length > 0){
      parameterConditionsN.push(parameterConditionsNI);
     }
    }
    
    if(parameterConditionsN.length > 0){
     parameterConditions.push(parameterConditionsN);
    }
    else{
     this.deleteConditions(n);
    }
   }
  }
  
  return(parameterConditions);
 };
 
 
 
 //
 // label list を取得する。
 // 注意 : 直前にthis.getParameterConditions(); が実行されていること。
 //
 this.getLinkLabelList = function (){
  var linkLabelList = new Array();
  
  for(var n = 0, m = this.linkLabelList.length; n < m; n ++){
   var label = this.linkLabelList[n];
   
   if(this.effectiveConditionFlagList[n]){
    linkLabelList.push(label);
   }
  }
  
  return(linkLabelList);
 };
 
 
  
 // case で使えるTelnetman 変数一覧を表示する。
 this.telnetmanParameterHelp = function (){
  var html = "<table class='telnetman_item_viewer'>" +
             "<tr><th colspan='2'><div><span>使用可能Telentman&nbsp;変数</span><img src='img/cancel.png' width='16' height='16' alt='閉じる' onclick='objCommon.unlockScreen();'></div></th></tr>" +
             "<tr>" +
             "<td class='left'>" + this.telnetmanParameterAHtml("変数名") + "</td>" +
             "<td class='left'><span class='telnetman_item_viewer_span2'>パラメーターシート</span><span class='desc_black'>A行</span><span class='telnetman_item_viewer_span2'>の値</span></td>" +
             "</tr>" +
             "<tr>" +
             "<td class='left'>" + this.telnetmanParameterBHtml("B列値", "変数名") + "</td>" +
             "<td class='left'><span class='telnetman_item_viewer_span2'>パラメーターシート</span><span class='desc_black'>B行</span><span class='telnetman_item_viewer_span2'>の値</span></td>" +
             "</tr>" +
             "<tr>" +
             "<td class='left'>" + this.telnetmanParameterHtml("$", "node") + "</td>" +
             "<td class='left'><span class='telnetman_item_viewer_span2'>対象ノード(パラメーターシートのA列)</span></td>" +
             "</tr>" +
             "<td class='left'><span class='desc_black'>_BLANK_</span></td>" +
             "<td class='left'><span class='telnetman_item_viewer_span2'>空文字</span></td>" +
             "</tr>" +
             "<tr>" +
             "<td class='left'><span class='desc_black'>_DUMMY_</span></td>" +
             "<td class='left'><span class='desc_black'>_BLANK_</span><span class='telnetman_item_viewer_span2'>&nbsp;と同じ。</span></td>" +
             "</tr>" +
             "<tr>" +
             "<td class='left'><span class='desc_black'>_LF_</span></td>" +
             "<td class='left'><span class='telnetman_item_viewer_span2'>改行</span></td>" +
             "</tr>" +
             "</table>";
  
  objCommon.lockScreen(html);
 };
 
  // {$1}, {$2}, {$3}, ..., {$*}, {#1}, {#2}, {#3}, ..., {#*}, {$node}, {$B}, ... などのHTML を作成する。
 this.telnetmanParameterHtml = function (bruePart, blackPart){
  if(bruePart === "$"){
   bruePart = "\$";
  }
  
  return("<span class='desc_green'>{</span><span class='desc_blue'>" + bruePart + "</span><span class='desc_black'>" + blackPart + "</span><span class='desc_green'>}</span>");
 };
 
 // {変数名} のHTML を作成する。
 this.telnetmanParameterAHtml = function (parameterName){
  return("<span class='desc_green'>{</span><span class='desc_grey'>" + parameterName + "</span><span class='desc_green'>}</span>");
 };
 
 // {B列値:変数名} のHTML を作成する。
 this.telnetmanParameterBHtml = function (B, parameterName){
  return("<span class='desc_green'>{</span><span class='desc_grey'>" + B + "</span><span class='desc_black'>:</span><span class='desc_grey'>" + parameterName + "</span><span class='desc_green'>}</span>");
 };
 
 
 return(this);
}

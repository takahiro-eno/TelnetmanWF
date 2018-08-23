// 説明   : local storage, session storage に値を入れたり、出したりする。
// 作成日 : 2015/05/08
// 作成者 : 江野高広
// 更新   : 2018/06/28 work, case のタイトル一覧、boxId 一覧の追加。

var storageL = localStorage;
var objControleStorageL = new controleStorageL();

var storageS = sessionStorage;
var objControleStorageS = new controleStorageS();



function controleStorageL () {
 // key の共通接頭語。
 this.prefix = "TelnetmanWF_";
 
 
 // 選択中のflow id
 this.keyFlowId = function (){
  return(this.prefix + "flowId");
 };
 
 this.getFlowId = function (){
  var flowId = storageL.getItem(this.keyFlowId());
  
  if(flowId === null){
   flowId = "";
  }
  
  return(flowId);
 };
 
 this.setFlowId = function (flowId){
  storageL.setItem(this.keyFlowId(), flowId);
 };
 
 this.removeFlowId = function (){
  storageL.removeItem(this.keyFlowId());
 };
 
 
 
 // 選択中のflow password
 this.keyFlowPassword = function (){
  return(this.prefix + "flowPassword");
 };
 
 this.getFlowPassword = function (){
  var flowPassword = storageL.getItem(this.keyFlowPassword());
  
  if(flowPassword === null){
   flowPassword = "";
  }
  
  return(flowPassword);
 };
 
 this.setFlowPassword = function (flowPassword){
  storageL.setItem(this.keyFlowPassword(), flowPassword);
 };
 
 this.removeFlowPassword = function (){
  storageL.removeItem(this.keyFlowPassword());
 };
 
 
 
  // 選択中のtask id
 this.keyTaskId = function (){
  return(this.prefix + "taskId");
 };
 
 this.getTaskId = function (){
  var taskId = storageL.getItem(this.keyTaskId());
  
  if(taskId === null){
   taskId = "";
  }
  
  return(taskId);
 };
 
 this.setTaskId = function (taskId){
  storageL.setItem(this.keyTaskId(), taskId);
 };
 
 this.removeTaskId = function (){
  storageL.removeItem(this.keyTaskId());
 };
 
 
 
 // 選択中のtask password
 this.keyTaskPassword = function (){
  return(this.prefix + "taskPassword");
 };
 
 this.getTaskPassword = function (){
  var taskPassword = storageL.getItem(this.keyTaskPassword());
  
  if(taskPassword === null){
   taskPassword = "";
  }
  
  return(taskPassword);
 };
 
 this.setTaskPassword = function (taskPassword){
  storageL.setItem(this.keyTaskPassword(), taskPassword);
 };
 
 this.removeTaskPassword = function (){
  storageL.removeItem(this.keyTaskPassword());
 };
 
 
 // Telnetman のログインID
 this.keyTelnetmanLoginUser = function (){
  return(this.prefix + "telnetman_login_user");
 };
 
 this.getTelnetmanLoginUser = function (){
  var telnetmanLoginUser = storageL.getItem(this.keyTelnetmanLoginUser());
  
  if(telnetmanLoginUser === null){
   telnetmanLoginUser = "";
  }
  
  return(telnetmanLoginUser);
 };
 
 this.setTelnetmanLoginUser = function (telnetmanLoginUser){
  storageL.setItem(this.keyTelnetmanLoginUser(), telnetmanLoginUser);
 };
 
 this.removeTelnetmanLoginUser = function (){
  storageL.removeItem(this.keyTelnetmanLoginUser());
 };
 
 
 // Telnetman のログインPassword
 this.keyTelnetmanLoginPassword = function (){
  return(this.prefix + "telnetman_login_password");
 };
 
 this.getTelnetmanLoginPassword = function (){
  var telnetmanLoginPassword = storageL.getItem(this.keyTelnetmanLoginPassword());
  
  if(telnetmanLoginPassword === null){
   telnetmanLoginPassword = "";
  }
  
  return(telnetmanLoginPassword);
 };
 
 this.setTelnetmanLoginPassword = function (telnetmanLoginPassword){
  storageL.setItem(this.keyTelnetmanLoginPassword(), telnetmanLoginPassword);
 };
 
 this.removeTelnetmanLoginPassword = function (){
  storageL.removeItem(this.keyTelnetmanLoginPassword());
 };
 
 
 return(this);
}




function controleStorageS () {
 // key の共通接頭語。
 this.prefix = "TelnetmanWF_";
 
 
 // 選択中のflow id
 this.keyFlowId = function (){
  return(this.prefix + "flowId");
 };
 
 this.getFlowId = function (){
  var flowId = storageS.getItem(this.keyFlowId());
  
  if(flowId === null){
   flowId = "";
  }
  
  return(flowId);
 };
 
 this.setFlowId = function (flowId){
  storageS.setItem(this.keyFlowId(), flowId);
 };
 
 this.removeFlowId = function (){
  storageS.removeItem(this.keyFlowId());
 };
 
 
 
 // 選択中のflow password
 this.keyFlowPassword = function (){
  return(this.prefix + "flowPassword");
 };
 
 this.getFlowPassword = function (){
  var flowPassword = storageS.getItem(this.keyFlowPassword());
  
  if(flowPassword === null){
   flowPassword = "";
  }
  
  return(flowPassword);
 };
 
 this.setFlowPassword = function (flowPassword){
  storageS.setItem(this.keyFlowPassword(), flowPassword);
 };
 
 this.removeFlowPassword = function (){
  storageS.removeItem(this.keyFlowPassword());
 };
 
 
 
 // 選択中のtask id
 this.keyTaskId = function (){
  return(this.prefix + "taskId");
 };
 
 this.getTaskId = function (){
  var taskId = storageS.getItem(this.keyTaskId());
  
  if(taskId === null){
   taskId = "";
  }
  
  return(taskId);
 };
 
 this.setTaskId = function (taskId){
  storageS.setItem(this.keyTaskId(), taskId);
 };
 
 this.removeTaskId = function (){
  storageS.removeItem(this.keyTaskId());
 };
 
 
 
 // 選択中のtask password
 this.keyTaskPassword = function (){
  return(this.prefix + "taskPassword");
 };
 
 this.getTaskPassword = function (){
  var taskPassword = storageS.getItem(this.keyTaskPassword());
  
  if(taskPassword === null){
   taskPassword = "";
  }
  
  return(taskPassword);
 };
 
 this.setTaskPassword = function (taskPassword){
  storageS.setItem(this.keyTaskPassword(), taskPassword);
 };
 
 this.removeTaskPassword = function (){
  storageS.removeItem(this.keyTaskPassword());
 };
 
 
 
 // 現在開いているページがflow 編集画面かtask 実行画面か。
 this.keyPageType = function (){
  return(this.prefix + "pageType");
 };
 
 this.getPageType = function (){
  var pageType = storageS.getItem(this.keyPageType());
  
  if(pageType === null){
   pageType = "";
  }
  
  return(pageType);
 };
 
 this.setPageType = function(pageType){
  storageS.setItem(this.keyPageType(), pageType);
 };
 
 this.removePageType = function (){
  storageS.removeItem(this.keyPageType());
 };
 
 
 // ログインパスワード
 this.keyLoginPassword = function (){
  return(this.prefix + "loginPassword");
 };
 
 this.getLoginPassword = function (loginUser){
  var jsonPasswordList = storageS.getItem(this.keyLoginPassword());
  
  if(jsonPasswordList === null){
   return("");
  }
  
  var passwordList = JSON.parse(jsonPasswordList);
  
  if(loginUser in passwordList){
   return(passwordList[loginUser]);
  }
  else{
   return("");
  }
 };
 
 this.setLoginPassword = function (loginUser, loginPassword){
  if((loginPassword !== null) && (loginPassword !== undefined) && (loginPassword.length > 0)){
   var jsonPasswordList = storageS.getItem(this.keyLoginPassword());
   var passwordList = null;
   
   if(jsonPasswordList === null){
    passwordList = new Object();
   }
   else{
    passwordList = JSON.parse(jsonPasswordList);
   }
   
   passwordList[loginUser] = loginPassword;
   jsonPasswordList = JSON.stringify(passwordList);
   
   storageS.setItem(this.keyLoginPassword(), jsonPasswordList);
  }
 };
 
 this.removeLoginPassword = function (){
  storageS.removeItem(this.keyLoginPassword());
 };
 
 
 // 入力されたログインユーザー一覧
 this.keyLoginUser = function (){
  return(this.prefix + "loginUser");
 };
 
 this.getLoginUser = function (){
  var jsonLoginUserList = storageS.getItem(this.keyLoginUser());
  var loginUserList = null;
  
  if(jsonLoginUserList !== null){
   loginUserList = JSON.parse(jsonLoginUserList);
  }
  else{
   loginUserList = new Array();
  }
  
  return(loginUserList);
 };
 
 this.setLoginUser = function (loginUser){
  var jsonLoginUserList = storageS.getItem(this.keyLoginUser());
  var loginUserList = null;
  
  if(jsonLoginUserList !== null){
   loginUserList = JSON.parse(jsonLoginUserList);
  }
  else{
   loginUserList = new Array();
  }
  
  var isUnique = true;
  for(var i = 0, j = loginUserList.length; i < j; i ++){
   if(loginUser === loginUserList[i]){
    isUnique = false;
    break;
   }
  }
  
  if(isUnique){
   loginUserList.push(loginUser);
  }
  
  jsonLoginUserList = JSON.stringify(loginUserList);
  storageS.setItem(this.keyLoginUser(), jsonLoginUserList); 
 };
 
 this.removeLoginUser = function (){
  storageS.removeItem(this.keyLoginUser());
 };
 
 
 // work, case のタイトル一覧
 this.keyBoxTitle = function (boxId){
  return(this.prefix + "boxTitle_" + boxId);
 };
 
 this.getBoxTitle = function (boxId){
  var boxTitle = storageS.getItem(this.keyBoxTitle(boxId));
  
  if(boxTitle === null){
   boxTitle = "";
  }
  
  return(boxTitle);
 };
 
 this.setBoxTitle = function (boxId, boxTitle){
  storageS.setItem(this.keyBoxTitle(boxId), boxTitle);
 };
 
 this.removeBoxTitle = function(boxId){
  storageS.removeItem(this.keyBoxTitle(boxId));
 };
 
 
 // boxId 一覧
 this.keyBoxIdList = function(boxType){
  return(this.prefix + boxType + "IdList");
 };
 
 this.getBoxIdList = function(boxType){
  var jsonBoxIdList = storageS.getItem(this.keyBoxIdList(boxType));
  var boxIdList = null;
  
  if(jsonBoxIdList !== null){
   boxIdList = JSON.parse(jsonBoxIdList);
  }
  else{
   boxIdList = new Array();
  }
  
  return(boxIdList);
 };
 
 this.setBoxIdList = function(boxType, boxIdList){
  boxIdList.sort(function(a, b){
   var splitIdA = a.split("_");
   var splitIdB = b.split("_");
   
   var aIndex = parseInt(splitIdA[1], 10);
   var bIndex = parseInt(splitIdB[1], 10);
   
   if(aIndex < bIndex){
    return(-1);
   }
   else if(aIndex > bIndex){
    return(1);
   }
   else{
    return(0);
   }
  });
  
  var jsonBoxIdList = JSON.stringify(boxIdList);
  
  storageS.setItem(this.keyBoxIdList(boxType), jsonBoxIdList);
 };
 
 this.pushBoxIdList = function(boxType, boxId){
  var boxIdList = this.getBoxIdList(boxType);
  boxIdList.push(boxId);
  
  var jsonBoxIdList = JSON.stringify(boxIdList);
  storageS.setItem(this.keyBoxIdList(boxType), jsonBoxIdList);
 };
 
 this.spliceBoxIdList = function(boxType, boxId){
  var boxIdList = this.getBoxIdList(boxType);
  
  for(var i = boxIdList.length - 1; i >= 0; i --){
   if(boxIdList[i] === boxId){
    boxIdList.splice(i, 1);
    break;
   }
  }
  
  var jsonBoxIdList = JSON.stringify(boxIdList);
  storageS.setItem(this.keyBoxIdList(boxType), jsonBoxIdList);
 };
 
  
 return(this);
}

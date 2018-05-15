// 説明   : local storage, session storage に値を入れたり、出したりする。
// 作成日 : 2015/05/08
// 作成者 : 江野高広

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
 
 return(this);
}

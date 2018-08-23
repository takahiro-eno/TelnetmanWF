// 説明   : 共通の関数。
// 作成日 : 2015/05/12
// 作成者 : 江野高広


var objCommon = new common();

function common (){
 this.idLockScreen = "lockScreen";
 
 this.makeHttpHeader = function (){
  var pageType = objControleStorageS.getPageType();
  var password = "";
  
  if(pageType === "flow"){
   password = objControleStorageS.getFlowPassword(); 
  }
  else if(pageType === "task"){
   password = objControleStorageS.getTaskPassword();
  }
  
  return(pageType + " " + password);
 };
 
 // ブラウザ上でファイルを展開する挙動を抑止
 this.onDragOver = function (event) {
  event.preventDefault();
 };
 
 // unixtime (秒)を日付に変える。
 this.unixtimeToDate = function (unixtime, format){
  if((unixtime === null) || (unixtime === undefined) || (unixtime.length === 0) || (typeof(unixtime) !== "number")){
   unixtime = this.getUnixtime();
  }
  
  if((format === null) || (format === undefined) || (format.length === 0)){
   format = "YYYY/MM/DD hh:mm:ss";
  }
  
  var date = new Date();
  date.setTime(unixtime * 1000);
  
  var YYYY = date.getFullYear();
  var MM   = date.getMonth() + 1;
  var DD   = date.getDate();
  var hh   = date.getHours();
  var mm   = date.getMinutes();
  var ss   = date.getSeconds();
  
  // 左側を「0」で埋める。
  MM = ("0" + MM).slice(-2);
  DD = ("0" + DD).slice(-2);
  hh = ("0" + hh).slice(-2);
  mm = ("0" + mm).slice(-2);
  ss = ("0" + ss).slice(-2);
  
  format = format.replace(/YYYY/g, YYYY);
  format = format.replace(/MM/g, MM);
  format = format.replace(/DD/g, DD);
  format = format.replace(/hh/g, hh);
  format = format.replace(/mm/g, mm);
  format = format.replace(/ss/g, ss);
  
  return(format);
 };
 
 // unixtime (秒)を求める。
 this.getUnixtime = function () {
  return(parseInt((new Date)/1000, 10));
 };
 
 
 this.lockScreen = function (html, tabOkIdPref, functionName) {
  if(!document.getElementById(this.idLockScreen)){
   if((html === null) || (html === undefined)){
    html = "";
   }
   
   var elementsInput = document.getElementsByTagName("INPUT");
   var elementsSelect = document.getElementsByTagName("SELECT");
   var elementsTextarea = document.getElementsByTagName("TEXTAREA");
   var elementsButton = document.getElementsByTagName("BUTTON");
   
   for(var i = 0, j = elementsInput.length; i < j; i ++){
    elementsInput[i].blur();
   }
   
   for(i = 0, j = elementsSelect.length; i < j; i ++){
    elementsSelect[i].blur();
   }
   
   for(i = 0, j = elementsTextarea.length; i < j; i ++){
    elementsTextarea[i].blur();
   }
   
   for(i = 0, j = elementsButton.length; i < j; i ++){
    elementsButton[i].blur();
   }
   
   if((tabOkIdPref !== null) && (tabOkIdPref !== undefined) && (tabOkIdPref.length > 0)){
    document.onkeyup =
    function (tabOkIdPref) {
     if(event.keyCode === 9){
      var focusElement = document.activeElement;
      
      if(focusElement !== null){
       var focusElementId = focusElement.id;
       var tegTabOkIdPref = new RegExp("^" + tabOkIdPref);
       
       if((focusElementId === undefined) || (focusElementId.length === 0) || !focusElementId.match(tegTabOkIdPref)){
        focusElement.blur();
       }
      }
     }
     else if(event.keyCode === 13){
      if((functionName !== null) && (functionName !== undefined) && (functionName.length > 0)){
       eval(functionName + ";");
      }
     }
    };
   }
   else{
    document.onkeydown =
    function (){
     if(event.keyCode === 9){
      return false;
     }
    };
   }
   
   $("body").append("<div id='" + this.idLockScreen + "' style='z-index:200;position:fixed;left:0;top:0;width:100%;height:100%;color:#000000;background-color:rgba(0,0,0,0.2);'>" + html + "</div>");
  }
 };
 
 this.unlockScreen = function () {
  if(document.getElementById(this.idLockScreen)){
   document.onkeyup   = null;
   document.onkeydown = null;
   $("#" + this.idLockScreen).remove();
  }
 };
 
 
 // 画面の高さを求める。
 this.getBrowserHeight = function () {
  if(window.innerHeight){
   return(window.innerHeight);
  }
  else if(document.documentElement && (document.documentElement.clientHeight !== 0)){
   return(document.documentElement.clientHeight);
  }
  else if(document.body) {
   return(document.body.clientHeight);
  }
  else{
   return(0);
  }
 };
 
 
 // 画面の幅を求める。
 this.getBrowserWidth = function () {
  if(window.innerWidth){
   return(window.innerWidth);
  }
  else if(document.documentElement && (document.documentElement.clientWidth !== 0)){
   return(document.documentElement.clientWidth);
  }
  else if(document.body){
   return(document.body.clientWidth);
  }
  else{
   return(0);
  }
 };
 
 
 // 文をHTML にする。
 this.convertHtml = function (string){
  string = string.replace(/(https{0,1}:\/\/[\w\.~\/\?&\+=:@%;#\$%,\-]*)/g, "<a href='$1' target='_blank'>[url]</a>");
  string = string.replace(/\n/g, "<br>");
  
  return(string);
 };
 
 // HTML Escape
 this.escapeHtml = function (string) {
  if(typeof(string) === "number"){
   return(string);
  }
  else if((string === null) || (string === undefined) || (string.length === 0)){
   return("");
  }
  
  string = string.replace(/&/g, "&amp;");
  string = string.replace(/"/g, "&quot;");
  string = string.replace(/'/g, "&#39;");
  string = string.replace(/</g, "&lt;");
  string = string.replace(/>/g, "&gt;");
  string = string.replace(/ /g, "&nbsp;");
  string = string.replace(/\\/g, "&yen;");
  
  return(string);
 };
 
 return(this);
}

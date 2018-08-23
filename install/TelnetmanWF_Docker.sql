create database if not exists TelnetmanWF;
use TelnetmanWF;

create table if not exists T_Flow(
 vcFlowId varchar(64) not null primary key,
 vcFlowTitle varchar(128),
 vcFlowDescription varchar(1024),
 vcFlowPassword varchar(64),
 vcTaskPassword varchar(64),
 iWorkNumber int unsigned,
 iCaseNumber int unsigned,
 iTerminalNumber int unsigned,
 iX int unsigned,
 iY int unsigned,
 vcStartLinkTarget varchar(32),
 txStartLinkVertices text,
 iGoalX int unsigned,
 iGoalY int unsigned,
 vcAutoExecBoxId varchar(64),
 iPaperHieght int unsigned,
 vcLoginInfo varchar(256),
 vcUser varchar(32),
 vcPassword varchar(64),
 vcEnablePassword varchar(64),
 iCreateTime int unsigned,
 iUpdateTime int unsigned
);

create table if not exists T_Task(
 vcFlowId varchar(64) not null,
 vcTaskId varchar(64),
 vcTaskTitle varchar(128),
 iActive tinyint unsigned,
 iSerialNumber int unsigned,
 iCreateTime int unsigned,
 iUpdateTime int unsigned
);

set @x := (select count(*) from information_schema.statistics where table_name = 'T_Task' and index_name = 'IDX_Task' and table_schema = database());
set @sql := if( @x > 0, 'select ''Index exists.''', 'alter table T_Task add index IDX_Task (vcFlowId);');
PREPARE stmt FROM @sql;
EXECUTE stmt;


create table if not exists T_Queue (
 vcFlowId varchar(64),
 vcTaskId varchar(64),
 vcWorkId varchar(64),
 iQueueIndex int unsigned
);

create table if not exists T_StartList (
 vcFlowId varchar(64) not null,
 vcTaskId varchar(64),
 vcTelnetmanUser varchar(64),
 vcTelnetmanPassword varchar(64),
 iCreateTime int unsigned,
 iUpdateTime int unsigned
);

set @x := (select count(*) from information_schema.statistics where table_name = 'T_StartList' and index_name = 'IDX_StartList' and table_schema = database());
set @sql := if( @x > 0, 'select ''Index exists.''', 'alter table T_StartList add index IDX_StartList (vcFlowId);');
PREPARE stmt FROM @sql;
EXECUTE stmt;


create table if not exists T_WorkList (
 vcFlowId varchar(64) not null,
 vcTaskId varchar(64) not null,
 vcWorkId varchar(64),
 iStatus tinyint,
 vcErrorMessage varchar(1024),
 vcLoginId varchar(128),
 vcSessionId varchar(128),
 iCreateTime int unsigned,
 iUpdateTime int unsigned
);

set @x := (select count(*) from information_schema.statistics where table_name = 'T_WorkList' and index_name = 'IDX_WorkList' and table_schema = database());
set @sql := if( @x > 0, 'select ''Index exists.''', 'alter table T_WorkList add index IDX_WorkList (vcFlowId,vcTaskId);');
PREPARE stmt FROM @sql;
EXECUTE stmt;


create table if not exists T_CaseList (
 vcFlowId varchar(64) not null,
 vcTaskId varchar(64) not null,
 vcCaseId varchar(64),
 iStatus tinyint,
 vcErrorMessage varchar(1024),
 iCreateTime int unsigned,
 iUpdateTime int unsigned
);

set @x := (select count(*) from information_schema.statistics where table_name = 'T_CaseList' and index_name = 'IDX_CaseList' and table_schema = database());
set @sql := if( @x > 0, 'select ''Index exists.''', 'alter table T_CaseList add index IDX_CaseList (vcFlowId,vcTaskId);');
PREPARE stmt FROM @sql;
EXECUTE stmt;


create table if not exists T_Work(
 vcFlowId varchar(64) not null,
 vcWorkId varchar(64),
 vcWorkTitle varchar(128),
 vcWorkDescription varchar(1024),
 iActive int unsigned,
 iX int unsigned,
 iY int unsigned,
 vcAutoExecBoxId varchar(64),
 iExecOnlyOne tinyint unsigned,
 vcOkLinkTarget varchar(32),
 vcNgLinkTarget varchar(32),
 vcThroughTarget varchar(32),
 txOkLinkVertices text,
 txNgLinkVertices text,
 txThroughVertices text,
 iBondParameterSheet tinyint unsigned,
 vcUser varchar(32),
 vcPassword varchar(64),
 vcEnablePassword varchar(64),
 iCreateTime int unsigned,
 iUpdateTime int unsigned
);

set @x := (select count(*) from information_schema.statistics where table_name = 'T_Work' and index_name = 'IDX_Work' and table_schema = database());
set @sql := if( @x > 0, 'select ''Index exists.''', 'alter table T_Work add index IDX_Work (vcFlowId);');
PREPARE stmt FROM @sql;
EXECUTE stmt;


create table if not exists T_Case(
 vcFlowId varchar(64) not null,
 vcCaseId varchar(64),
 vcCaseTitle varchar(128),
 vcCaseDescription varchar(1024),
 iActive int unsigned,
 iX int unsigned,
 iY int unsigned,
 vcAutoExecBoxId varchar(64),
 txLinkTargetList text,
 txLinkLabelList text,
 txLinkVerticesList text,
 txParameterConditions text,
 iCreateTime int unsigned,
 iUpdateTime int unsigned
);

set @x := (select count(*) from information_schema.statistics where table_name = 'T_Case' and index_name = 'IDX_Case' and table_schema = database());
set @sql := if( @x > 0, 'select ''Index exists.''', 'alter table T_Case add index IDX_Case (vcFlowId);');
PREPARE stmt FROM @sql;
EXECUTE stmt;


create table if not exists T_Terminal(
 vcFlowId varchar(64) not null,
 vcTerminalId varchar(64),
 vcTerminalTitle varchar(128),
 vcTerminalDescription varchar(1024),
 iActive int unsigned,
 iX int unsigned,
 iY int unsigned,
 vcAutoExecBoxId varchar(64),
 iCreateTime int unsigned,
 iUpdateTime int unsigned
);

set @x := (select count(*) from information_schema.statistics where table_name = 'T_Terminal' and index_name = 'IDX_Terminal' and table_schema = database());
set @sql := if( @x > 0, 'select ''Index exists.''', 'alter table T_Terminal add index IDX_Terminal (vcFlowId);');
PREPARE stmt FROM @sql;
EXECUTE stmt;


create table if not exists T_File(
 vcFlowId varchar(64) not null,
 vcWorkId varchar(64),
 vcFlowchartBefore varchar(256),
 vcFlowchartMiddle varchar(256),
 vcFlowchartAfter varchar(256),
 vcLoginInfo varchar(256),
 vcSyslogValues varchar(256),
 vcDiffValues varchar(256),
 vcOptionalLogValues varchar(256),
 iCreateTime int unsigned,
 iUpdateTime int unsigned
);

set @x := (select count(*) from information_schema.statistics where table_name = 'T_File' and index_name = 'IDX_File' and table_schema = database());
set @sql := if( @x > 0, 'select ''Index exists.''', 'alter table T_File add index IDX_File (vcFlowId);');
PREPARE stmt FROM @sql;
EXECUTE stmt;

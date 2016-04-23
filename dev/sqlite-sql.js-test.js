#!/usr/bin/env node

/* 
* @Author: Hans Jürgen Gessinger
* @Date:   2016-02-09 19:42:51
* @Last Modified by:   hg02055
* @Last Modified time: 2016-03-16 18:25:17
* File-name: sqlite-sql.js-test
*/

var S1 = "SELECT"
       + "  IDENTITY_KEY"       
       + ", IDENTITY_NAME"      
       + ", IDENTITY_TYPE_KEY"  
       + ", DESCRIPTION"        
       + ", SALT"               
       + ", ENABLED"            
       + ", PWD"                
       + ", START_DATE"         
       + ", END_DATE"           
       + ", LAST_MODIFIED"      
       + ", OPERATOR_MODIFIED"  
       + ", EMAIL"              
       + ", PWD_MUST_BE_CHANGED"
       + ", LOGIN_ENABLED"      
       + ", EXTERNAL_ID"        
       + ", EXTERNAL_KEY"       
       + " FROM T_IDENTITY"
       + " WHERE UPPER(IDENTITY_NAME)=?"
       + "   AND ENABLED='1'"
       + "   AND END_DATE>CURRENT_TIMESTAMP"
       // + "   AND END_DATE>?"
       // + " FOR UPDATE"
       ;

'use strict';
var T = require ( "gepard" ) ;
var L = require ( "gepard" ).LogFile ;
var fs = require('fs');
var SQL = require('sql.js');
var filebuffer = fs.readFileSync ( 'sidds.db' ) ;
var db = new SQL.Database(filebuffer);
// var stmt = db.prepare ( "SELECT * FROM T_IDENTITY where upper(identity_name)=?", ['MILLER'] ) ;
// var stmt = db.prepare ( S1, ['MILLER'] ) ;
var stmt = db.prepare ( "SELECT * FROM T_IDENTITY" ) ;
while ( stmt.step() )
{
  var row = stmt.getAsObject();
console.log ( row ) ;
}
// var res = stmt.getAsObject(['MILLER']) ;
// console.log ( res ) ;
// var res = db.exec ( "SELECT * FROM T_IDENTITY where upper(identity_name)=?", ["MILLER"] ) ;
// console.log ( res ) ;
// db.close();
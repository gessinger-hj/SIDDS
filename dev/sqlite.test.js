/* 
* @Author: Hans Jürgen Gessinger
* @Date:   2016-02-09 19:42:51
* @Last Modified by:   HG02055
* @Last Modified time: 2016-02-09 20:12:10
* File-name: sqlite.test
*/

'use strict';

var sqlite3 = require('sql.js') ;
var db = new sqlite3.Database('sidds.db');

var fs = require('fs');
var SQL = require('sql.js');
var filebuffer = fs.readFileSync ( 'sidds.db' ) ;

// Load the db
var db = new SQL.Database(filebuffer);

var res = db.exec ( "SELECT * FROM T_IDENTITY" ) ;

console.log ( res[0] ) ;
db.close();
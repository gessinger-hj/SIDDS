var mysql = require ( 'mysql' ) ;
var gepard = require ( 'gepard' ) ;
var tango = require ( 'tango' ) ;
var Database = require ( '../src/Database' ) ;
var wait = require ( "wait.for" ) ;

var Log = gepard.LogFile ;
var Xml = tango.Xml.Xml ;
var XmlTree = tango.Xml.XmlTree ;

"use strict" ;

var dburl = gepard.getProperty ( "dburl", "mysql://root:@localhost/sidds" ) ;
var db = new Database ( dburl ) ;
console.log ( ""+db ) ;
var sql = "insert into t_identity_type ( identity_type_name ) values (?)" ;	
db.getConnection ( function ( err, connection )
{
	db.insert ( sql, ['Administrators'], function ( err, result )
	{
console.log ( result ) ;
		if ( err )
		{
			Log.error ( "" + err + " in \n" + sql ) ;
			db.close() ;
			return ;
	 	}
	}) ;
	
// 	db.select ( sql, ['Administrators'], function ( err, result )
// 	{
// console.log ( result ) ;
// 		if ( err )
// 		{
// 			Log.error ( "" + err + " in \n" + sql ) ;
// 			db.close() ;
// 			return ;
// 	 	}
// 	 	var newSerialId = -1 ;
// 	 	if ( db._MYSQL )
// 	 	{
// 	 	  newSerialId = result.insertId ;
// console.log ( "newSerialId=" + newSerialId ) ;
// db.commit() ;
// db.disconnect() ;
// 	 	}

// 		if ( db._POSTGRES )
// 		{
// 			db.select ( "SELECT LASTVAL()", function ( err, rows )
// 			{
// newSerialId = rows[0].lastval ;
// console.log ( "newSerialId=" + newSerialId ) ;
// console.log ( err ) ;
// db.commit() ;
// db.disconnect() ;
// 			});
// 		}
// 		if ( db._SQLITE )
// 		{
// 			db.select ( "SELECT last_insert_rowid()", function ( err, rows )
// 			{
// newSerialId = rows[0]["last_insert_rowid()"] ;
// console.log ( "newSerialId=" + newSerialId ) ;
// console.log ( err ) ;
// db.commit() ;
// db.disconnect() ;
// 			});
// 		}
// 	});
});

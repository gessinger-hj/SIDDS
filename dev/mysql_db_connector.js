var mysql = require ( 'mysql' ) ;
var gepard = require ( 'gepard' ) ;
var tango = require ( 'tango' ) ;
var Database = require ( '../src/Database' ) ;
var wait = require ( "wait.for" ) ;

var Log = gepard.LogFile ;
var Xml = tango.Xml.Xml ;
var XmlTree = tango.Xml.XmlTree ;

"use strict" ;

var client = new gepard.Client() ;
var dburl = gepard.getProperty ( "dburl", "mysql://root:@localhost/sidds" ) ;
var db = new Database ( dburl ) ;
client.on ( "DB:REQUEST", function(e)
{
  Log.log ( e.toString() ) ;
	// var connection =  mysql.createConnection ( dburl ) ;
  // connection.connect();
	wait.launchFiber ( function()
	{
		db.getConnection() ;
	// connection.query( "use cdcol" );
	// var str = "select * from cds where titel='Glee'";	
		var str = "select * from t_identity";	
		var tree = new XmlTree() ;
		var tab = tree.add ( "cds" ) ;
		db.connection.query ( str, function ( err, rows )
		{
			if ( err )
			{
				Log.error ( "" + err + " in \n" + str ) ;
	      e.control.status = { code:1, name:"error", reason:"" + err } ;
				connection.end() ;
		 	}
		 	else
		 	{
		    var n = rows.length ;
				for ( var i = 0 ; i < n ; i++ )
				{
		      var xr = tab.add ( "row" ) ;
	  	    var r = rows[i] ;
		      for ( k in r )
		      {
		        var v = r[k] ;
		        if ( v === null ) continue ;
		        xr.add ( k, v ) ;
		      }
		    }
				db.close() ;
			}
			// console.log ( e ) ;
			e.body.RESULT = tree.toString() ;
			// console.log ( tree.toString() ) ;
	    e.control.status = { code:0 } ;
			client.sendResult ( e ) ;
		} ) ;
	});
});
client.on('end', function()
{
  console.log('socket disconnected');
});

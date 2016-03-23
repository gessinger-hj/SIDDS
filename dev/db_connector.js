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
	db.getConnection ( function ( err, connection )
	{
		var str = "select * from t_identity";	
		var tree = new XmlTree() ;
		var tab = tree.add ( "cds" ) ;

		this.select ( str, function ( err, rows )
		{
			if ( err )
			{
				Log.error ( "" + err + " in \n" + str ) ;
	      e.control.status = { code:1, name:"error", reason:"" + err } ;
				this.close() ;
		 	}
		 	else
		 	{
		  //   var n = rows.length ;
				// for ( var i = 0 ; i < n ; i++ )
				// {
		  //     var xr = tab.add ( "row" ) ;
	  	//     var r = rows[i] ;
		  //     for ( k in r )
		  //     {
		  //       var v = r[k] ;
		  //       if ( v === null ) continue ;
		  //       xr.add ( k, v ) ;
		  //     }
		  //   }
				this.close() ;
			}
			// e.body.RESULT = tree.toString() ;
			e.body.RESULT = rows ;
	    e.control.status = { code:0 } ;
			client.sendResult ( e ) ;
		} ) ;
	});
});
client.on ( 'end', function()
{
  // console.log('socket disconnected');
});

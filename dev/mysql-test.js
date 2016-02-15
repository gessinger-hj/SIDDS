// var mysql =  require('mysql2');
var mysql =  require('mysql');
var T = require ( "gepard" ) ;
  var dburl = T.getProperty ( "dburl", "mysql://root:@localhost/sidds" ) ;

  var connection =  mysql.createConnection ( dburl ) ;
  connection.connect();
  connection.query( "use sidds" );
var sql = "select IDENTITY_NAME from t_identity where IDENTITY_NAME=?";	

function loadDataFromDatabase()
{
connection.query( sql, function(err, rows, fields ){
    // console.log ( fields ) ;
  	if(err)	{
  		throw err;
  	}
    else
    {
// console.log ( rows ) ;
  		for ( var i = 0 ; i < rows.length ; i++ )
  		{
      // console.log( rows[i].IDENTITY_NAME );
  		// T.log( rows[i] );
  		}
  	}
  	connection.end() ;
  });
}
var wait = require ( "wait.for" ) ;
function useLoadedData ( d )
{
  console.log ( d ) ;
}

var data ;
function process()
{
  if ( !data )
  {
    data = wait.forMethod ( connection, "query", sql, [ 'miller' ] ) ;
    console.log ( data ) ;
    data = wait.forMethod ( connection, "query", sql, [ 'admin' ] ) ;
    console.log ( "data[0].IDENTITY_NAME=" + data[0].IDENTITY_NAME ) ;
  }
  connection.end() ;
}
wait.launchFiber(process);
// var mysql =  require('mysql2');
var mysql =  require('mysql');
var T = require ( "gepard" ) ;
  var dburl = T.getProperty ( "dburl", "mysql://root:@localhost/sidds" ) ;

  var connection =  mysql.createConnection ( dburl ) ;
  connection.connect();
  connection.query( "use sidds" );
var sql = "select IDENTITY_NAME, IDENTITY_KEY from t_identity where IDENTITY_NAME=?";	

function loadDataFromDatabase()
{
connection.query( sql, [ 'miller' ], function(err, rows, fields ){
    // console.log ( fields ) ;
  	if(err)	{
  		throw err;
  	}
    else
    {
console.log ( rows[0] ) ;
  		for ( var i = 0 ; i < rows.length ; i++ )
  		{
      // console.log( rows[i].IDENTITY_NAME );
  		// T.log( rows[i] );
  		}
  	}
  	connection.end() ;
  });
}
loadDataFromDatabase() ;
return ;
var wait = require ( "wait.for" ) ;

console.log ( connection ) ;
connection.q = function(_sql, params, stdCallback){ 
             this.query(_sql,params, function(err,rows,columns){ 
                                 return stdCallback(err,{rows:rows,columns:columns}); 
                         });
 }
function process()
{

  try {
    var result = wait.forMethod(connection, "q", sql, [ 'miller' ] ); 
    console.log(result.rows);
    console.log(result.columns);
  } 
  catch(err) {
     console.log(err);
  }
  connection.end() ;
  // var data = wait.forMethod ( connection, "query", sql, [ 'miller' ] ) ;
  // console.log ( data ) ;
  // data = wait.forMethod ( connection, "query", sql, [ 'admin' ] ) ;
  // console.log ( "data[0].IDENTITY_NAME=" + data[0].IDENTITY_NAME ) ;
  // console.log ( "data[0].IDENTITY_KEY=" + data[0].IDENTITY_KEY ) ;
  // connection.end() ;
}
wait.launchFiber(process);
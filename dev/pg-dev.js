/*
* @Author: hg02055
* @Date:   2016-03-18 14:21:24
* @Last Modified by:   hg02055
* @Last Modified time: 2016-03-18 19:11:26
*/

'use strict';

var gepard = require ( "gepard" ) ;
var wait = require ( "wait.for" ) ;

var pg = require('pg');
var url = "postgres://sidds:luap1997@localhost/sidds";

// function done (err) {
//           if(err) {
//             pool.destroy(client);
//           } else {
//             pool.release(client);
//           }
//         }

var execute = function()
{
	var sql = 'SELECT * from t_identity where upper(IDENTITY_NAME)=$1' ;
	var hostVars = [ "Miller".toUpperCase() ] ;
  pg.conn = function ( url, stdCallback )
  { 
    this.connect ( url, function ( err, client, done )
    { 
      return stdCallback ( err, { err:err, connection:client } ) ; 
    });
  };
	var response = wait.forMethod ( pg, "conn", url ) ;
	var connection = response.connection ;
	if ( response.err )
	{
		console.log ( response.err ) ;
		pg.pools.destroy ( connection ) ;
		return ;
	}
  connection.q = function ( _sql, params, stdCallback )
  {
  	if ( typeof params === 'function' )
  	{
  		stdCallback = params ;
	    this.query ( _sql, function ( err, result )
	    {
	      return stdCallback ( err, { err:err, result:result } ) ; 
	    });
  	}
  	else
  	{
	    this.query ( _sql, params, function ( err, result )
	    { 
	      return stdCallback ( err, { err:err, result:result } ) ; 
	    });
  	}
  };
	response = wait.forMethod ( connection, "q", sql, hostVars ) ;
	if ( response.err )
	{
		console.log ( err ) ;
		pg.pools.destroy ( connection ) ;
		return ;
	}
 console.log(response.result.rows);//.rows[0]);
var pool = pg.pools.getOrCreate() ;
pool.release ( connection ) ;
pool.destroyAllNow() ;
// console.log ( "" + pool ) ;
	// pg.pools.release ( connection ) ;
}

wait.launchFiber ( execute ) ;


// pg.connect(url, function(errX, client, done) {
//   if(errX) {
//     return console.error('error fetching client from pool', err);
//   }
// console.log ( "" + done ) ;
// console.log ( client ) ;
//   client.query('SELECT * from t_identity', function(err, result) {
//     //call `done()` to release the client back to the pool
//     done(false);

//     if(errX) {
//       return console.error('error running query', err);
//     }
//     console.log(result.rows[0]);
//     //output: 1
//   });
// });

#!/usr/bin/env node

var T = require ( "gepard" ) ;
var L = require ( "gepard" ).LogFile ;

var Database = function Database ( url )
{
  this._SQLITE = false ;
  var U = url.toUpperCase() ;
  if ( U.indexOf ( "SQLITE:" ) >= 0 )
  {
    this._SQLITE = true ;
    this._SYSDATE = "CURRENT_TIMESTAMP" ;
    this._UNIQUE = "DISTINCT" ;
    this._SQL = require('sql.js');
    this._url = url ;
    this._file = this._url.substring ( this._url.indexOf ( ':' ) + 1 ) ;
  }
};
Database.prototype.isSQLITE = function()
{
  return this._SQLITE ;
};
Database.prototype.init = function()
{
  if ( this._SQLITE )
  {
    var fs = require('fs');
    var filebuffer = fs.readFileSync ( this._file ) ;
    this._db = new this._SQL.Database(filebuffer);
  }
};
Database.prototype.select = function ( str )
{
  if ( this._SQLITE )
  {
    var res = this._db.exec ( str ) ;
    return res ;
  }
};
Database.prototype.selectAsJSON = function ( str )
{
  var stmt = this._db.prepare ( str ) ;
  var result = stmt.getAsObject ( {':x1' : 'AA'} );
  return result ;
  // var r = this.select ( str ) ;
  // var columns = r[0].columns ;
  // var values = r[0].values ;
  // var resultList = [] ;
  // for ( var i = 0 ; i < values.length ; i++)
  // {
  //   var row = {} ;
  //   resultList.push ( row ) ;
  //   var v = values[i] ;
  //   for ( var j = 0 ; j < v.length ; j++)
  //   {
  //     if ( v[j] === null )
  //     {
  //       continue ;
  //     }
  //     row[columns[j]] = v[j] ;
  //   }
  // }
  // return resultList ;
};
var db = new Database ( "sqlite:" + "sidds.db" ) ;
db.init() ;
// var res = db.select ( "SELECT * FROM T_IDENTITY" ) ;
// https://www.npmjs.com/package/sql.js
// console.log ( res[0].columns ) ;
// console.log ( res[0].values ) ;
// var res2 = db.selectAsJSON ( "SELECT * FROM T_IDENTITY" ) ; // where identity_name='miller'" ) ;
// console.log ( res2 ) ;
// var stmt = db._db.prepare ( "SELECT * FROM T_IDENTITY where identity_name=?1" ) ;
// var result = stmt.getAsObject({'?1' : 'miller'});
// var result = stmt.getAsObject({});
// console.log ( result ) ;
var stmt = db._db.prepare ( "SELECT * FROM T_IDENTITY where identity_name=?1" ) ;
stmt.bind ( {'?1':'miller'}) ;
while ( stmt.step() )
{ 
  // var row = stmt.getAsObject();
  var row = stmt.get();
console.log ( row ) ;
}
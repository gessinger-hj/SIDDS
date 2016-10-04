#!/usr/bin/env node

"use strict"

var gepard    = require ( "gepard" ) ;
var wait      = require ( "wait.for" ) ;
var DbRequest = require ( "./DbRequest" ) ;
var DbResult  = require ( "./DbResult" ) ;

var Database = function ( url )
{
  this.url = url ;
  if ( this.url.toUpperCase().indexOf ( "MYSQL" ) >= 0 )
  {
    this._MYSQL = true ;
  }
  else
  if ( this.url.toUpperCase().indexOf ( "SQLITE" ) >= 0 )
  {
    this._SQLITE = true ;
    var pos = this.url.indexOf ( "://" ) ;
    if ( pos > 0 )
    {
      this.file = this.url.substring ( pos + 3 ) ;
    }
    else
    {
      pos = this.url.indexOf ( ":" ) ;
      this.file = this.url.substring ( pos + 1 ) ;
    }
  }
  else
  if ( this.url.toUpperCase().indexOf ( "POSTGRES" ) >= 0 )
  {
    this._POSTGRES = true ;
  }
  else
  {
    throw new Error ( "Not a valid url: " + this.url ) ;
  }
};
Database.prototype.toString = function()
{
  return "(Database)[url=" + this.url + "]" ;
};
Database.prototype.getConnection = function ( callback )
{
  if ( this.connection )
  {
    if ( typeof callback === 'function' )
    {
      callback.call ( this, null, this.connection ) ;
    }
    return this.connection ;
  }
  if ( typeof callback === 'function' )
  {
    this._getConnectionAsync ( callback ) ;
    return ;
  }
  return this._getConnection ( callback ) ;
};
Database.prototype._getConnectionAsync = function ( callback )
{
  var thiz = this ;
  if ( this._MYSQL )
  {
// SET autocommit = 1 / 0
    var mysql =  require('mysql');
    if ( ! this.pool )
    {
      this.pool = mysql.createPool ( this.url )
    }
    this.pool.getConnection ( function ( err, connection )
    {
      thiz.connection = connection ;
      if ( err )
      {
        callback.call ( thiz, err, connection ) ;
        return ;
      }
      thiz.connection.connect();
      thiz.connection.q = function ( _sql, params, stdCallback )
      { 
        this.query ( _sql, params, function ( err, rows, columns )
        { 
          return stdCallback ( err, { rows:rows, columns:columns } ) ; 
        });
      };
      callback.call ( thiz, err, thiz.connection ) ;
    });
  }
  else
  if ( this._SQLITE )
  {
    this._SYSDATE = "CURRENT_TIMESTAMP" ;
    this._UNIQUE = "DISTINCT" ;
    var sql = require('sql.js');
    var fs = require('fs');
    var fileExists = false ;
    try
    {
      fs.statSync ( this.file ) ;
      fileExists = true ;
    }
    catch ( exc )
    {
      console.log ( exc ) ;
    }
    if ( fileExists )
    {
      var filebuffer = fs.readFileSync ( this.file ) ;
      this.connection = new sql.Database ( filebuffer ) ;
    }
    else
    {
      this.connection = new sql.Database() ;
    }
    callback.call ( this, null, this.connection ) ;
  }
  else
  if ( this._POSTGRES )
  {
    this.pg = require('pg');
    this.pg.connect ( this.url, function ( err, client, done )
    { 
      thiz.connection = client ;
      if ( err )
      {
        var pool = thiz.pg.pools.getOrCreate()
        pool.destroy ( thiz.connection ) ;
        thiz.connection = null ;
        callback.call ( thiz, err, thiz.connection ) ;
        return ;
      }
      thiz.connection.q = function ( _sql, params, stdCallback )
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
      callback.call ( thiz, err, thiz.connection ) ;
    });
  }
};
Database.prototype._getConnection = function()
{
  if ( this._MYSQL )
  {
    var mysql =  require('mysql');
    if ( ! this.pool )
    {
      this.pool = mysql.createPool ( this.url )
      this.pool.conn = function ( stdCallback )
      { 
        this.getConnection ( function ( err, connection )
        { 
          return stdCallback ( err, { err:err, connection:connection } ) ; 
        });
      };
    }
    var response = wait.forMethod ( this.pool, "conn" ) ;
    this.connection = response.connection ;
    if ( response.err )
    {
      this.connection.destroy() ;
      this.connection = null ;
      this.pool.end ( function(err)
      {
        console.log ( err ) ;
      });
      this.pool = null ;
      throw new Error ( response.err ) ;
      return ;
    }
    this.connection.connect();
    this.connection.q = function ( _sql, params, stdCallback )
    { 
      this.query ( _sql, params, function ( err, rows, columns )
      { 
        return stdCallback ( err, { rows:rows, columns:columns } ) ; 
      });
    };
  }
  else
  if ( this._SQLITE )
  {
    this._SYSDATE = "CURRENT_TIMESTAMP" ;
    this._UNIQUE = "DISTINCT" ;
    var sql = require('sql.js');
    var fs = require('fs');
    var fileExists = false ;
    try
    {
      fs.statSync ( this.file ) ;
      fileExists = true ;
    }
    catch ( exc )
    {
      console.log ( exc ) ;
    }
    if ( fileExists )
    {
      var filebuffer = fs.readFileSync ( this.file ) ;
      this.connection = new sql.Database ( filebuffer ) ;
    }
    else
    {
      this.connection = new sql.Database() ;
    }
  }
  else
  if ( this._POSTGRES )
  {
    this.pg = require('pg');
    this.pg.conn = function ( url, stdCallback )
    { 
      this.connect ( url, function ( err, client, done )
      { 
        return stdCallback ( err, { err:err, connection:client } ) ; 
      });
    };
    var response = wait.forMethod ( this.pg, "conn", this.url ) ;
    this.connection = response.connection ;
    if ( response.err )
    {
      var pool = this.pg.pools.getOrCreate()
      pool.destroy ( this.connection ) ;
      throw new Error ( response.err ) ;
      return ;
    }
    this.connection.q = function ( _sql, params, stdCallback )
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
  }
  return this.connection ;
};
Database.prototype.rollback = function()
{
};
Database.prototype.commit = function()
{
  if ( this._SQLITE )
  {
    if ( this.connection )
    {
      var fs = require ( 'fs' ) ;
      var data = this.connection.export() ;
      var buffer = new Buffer ( data ) ;
      fs.writeFileSync( this.file, buffer ) ;
      this.hasChanged = false ;
    }
    return ;
  }
  if ( this._MYSQL )
  {
    if ( this.connection )
    {
      this.connection.commit() ;
    }
    return ;
  }
  if ( this._POSTGRES )
  {
    if ( this.connection )
    {
      this.connection.query ( 'COMMIT', function commit_function (err,client)
      {
        if ( err )
        {
          console.log ( err ) ;
        }
      }) ;
    }
  }
};
Database.prototype.close = function()
{
  if ( this._SQLITE )
  {
  }
  if ( this._MYSQL )
  {
    if ( this.connection )
    {
      delete this.connection["q"] ;
      this.connection.release() ;
    }
  }
  if ( this._POSTGRES )
  {
    delete this.connection["q"] ;
    var pool = this.pg.pools.getOrCreate() ;
    pool.release ( this.connection ) ;
  }
  this.connection = null ;
};
Database.prototype.disconnect = function()
{
  if ( this._SQLITE )
  {
    if ( this.connection && this.hasChanged )
    {
      var fs = require ( 'fs' ) ;
      var data = db.export() ;
      var buffer = new Buffer ( data ) ;
      fs.writeFileSync( this.file, buffer ) ;
    }
    if ( this.connection ) this.connection.close() ;
  }
  if ( this._MYSQL )
  {
    if ( this.connection )
    {

      this.connection.destroy() ;
      this.connection = null ;
      this.pool.end ( function(err)
      {
        if ( err )
        {
          console.log ( err ) ;
        }
      });
      this.pool = null ;
    }
  }
  if ( this._POSTGRES )
  {
    var pool = this.pg.pools.getOrCreate() ;
    if ( this.connection )
    {
      delete this.connection["q"] ;
      pool.release ( this.connection ) ;
    }
    pool.destroyAllNow() ;
  }
  this.connection = null ;
};
Database.prototype.update = function ( sql, hostVars, callback )
{
  this.hasChanged = true ;
  return this.select ( sql, hostVars, callback ) ;
};
Database.prototype.select = function ( sql, hostVars, callback )
{
  if ( ! this.connection && typeof callback === 'function' )
  {
    this.getConnection ( ( err, connection ) => {
      this._query ( sql, hostVars, callback ) ;
    }) ;
    return ;
  }
  return this._query ( sql, hostVars, callback ) ;
};
Database.prototype._query = function ( sql, hostVars, callback )
{
  var result ;
  var thiz = this ;
  if ( typeof hostVars === 'function' )
  {
    callback = hostVars ;
    hostVars = null ;
  }
  if ( this._SQLITE )
  {
    if ( Array.isArray ( hostVars ) )
    {
      var stmt = this.connection.prepare ( sql, hostVars ) ;
      result = [] ;
      while ( stmt.step() )
      {
        result.push ( stmt.getAsObject() ) ;
      }
    }
    else
    {
      var stmt = this.connection.prepare ( sql ) ;
      result = [] ;
      while ( stmt.step() )
      {
        result.push ( stmt.getAsObject() ) ;
      }
    }
    if ( typeof callback === 'function' )
    {
      callback.call ( this, null, result ) ;
      return ;
    }
    return result
  }
  else
  if ( this._MYSQL )
  {
  // result.insertId, TODO for mySQL
    if ( callback )
    {
      if ( hostVars )
      {
        this.connection.query ( sql, hostVars, function ( err, rows )
        {
          callback.call ( thiz, err, rows ) ;
        }) ;
      }
      else
      {
        this.connection.query ( sql, function ( err, rows )
        {
          callback.call ( thiz, err, rows ) ;
        }) ;
      }
      return ;
    }
    result = wait.forMethod ( this.connection, "q", sql, hostVars ); 
    if ( result.err )
    {
      console.log ( result.err ) ;
      return ;
    }
    return result.rows ;
  }
  else
  if ( this._POSTGRES )
  {
    var sql1 = sql ;
    for ( var i = 1 ; i < 100 ; i++ )
    {
      if ( sql1.indexOf ( '?' ) < 0 ) break ;
      sql1 = sql1.replace ( /\?/g, "$" + i ) ;
    }
    if ( callback )
    {
      if ( hostVars )
      {
        this.connection.query ( sql1, hostVars, function ( err, result )
        {
          callback.call ( thiz, err, result.rows ) ;
        }) ;
      }
      else
      {
        this.connection.query ( sql1, function ( err, result )
        {
          callback.call ( thiz, err, result.rows ) ;
        }) ;
      }
      return ;
    }
    var response = wait.forMethod ( this.connection, "q", sql1, hostVars ) ;
    if ( response.err )
    {
      console.log ( err ) ;
      this.close() ;
      return ;
    }
    return response.result.rows ; //.rows[0]);
  }
};
Database.prototype.insert = function ( sql, hostVars, callback )
{
  var result ;
  var thiz = this ;
  var orig_callback = callback ;
  if ( typeof hostVars === 'function' )
  {
    orig_callback = hostVars ;
  }
  var insertId = -1 ; 
  if ( typeof orig_callback === 'function' )
  {
    var this_callback = function ( err, rows )
    {
      if ( err )
      {
        orig_callback.call ( thiz, err, { insertId:insertId } ) ;
        return ;
      }
      if ( thiz._MYSQL )
      {
        if ( rows.insertId )
        {
          insertId = rows.insertId ;
        }
        orig_callback.call ( thiz, err, { insertId:insertId } ) ;
      }
      else
      if ( thiz._POSTGRES )
      {
        this.select ( "SELECT LASTVAL()", function ( err, rows )
        {
          if ( rows.length )
          {
            insertId = rows[0].lastval ;
          }
          orig_callback.call ( thiz, err, { insertId:insertId } ) ;
        });
      }
      if ( thiz._SQLITE )
      {
        thiz.select ( "SELECT last_insert_rowid()", function ( err, rows )
        {
          if ( rows.length )
          {
            insertId = rows[0]["last_insert_rowid()"] ;
          }
          orig_callback.call ( thiz, err, { insertId:insertId } ) ;
        });
      }
    };
    this.select ( sql, hostVars, this_callback ) ;
    return ;
  }
  var rows = this.select ( sql, hostVars, callback ) ;
  if ( thiz._MYSQL )
  {
    if ( rows.insertId )
    {
      insertId = rows.insertId ;
    }
  }
  else
  if ( thiz._POSTGRES )
  {
    rows = this.select ( "SELECT LASTVAL()" ) ;
    if ( rows.length )
    {
      insertId = rows[0].lastval ;
    }
  }
  if ( thiz._SQLITE )
  {
    rows = thiz.select ( "SELECT last_insert_rowid()" ) ;
    if ( rows.length )
    {
      insertId = rows[0]["last_insert_rowid()"] ;
    }
  }
  return { insertId:insertId } ;
};
Database.prototype.getColumnsForTable = function ( tableName, callback )
{
  if ( this.table2Columns )
  {
    callback ( null, this.table2Columns ) ;
  }
  if ( this._MYSQL )
  {
    this.table2Columns = {} ;
    if ( typeof callback === 'function' )
    {
      this.getConnection ( ( err, connection ) => {
        if ( err )
        {
          callback ( err, null ) ;
          return ;
        }
        this.select ( "SHOW COLUMNS FROM " + tableName, ( err, result ) => {
          if ( err )
          {
            callback ( err, null ) ;
            return ;
          }
          for ( var i = 0 ; i < result.length ; i++ )
          {
            var r = result[i] ;
            if ( r.Key === "PRI" )
            {
              r.isPrimaryKey = true ;
            }
            this.table2Columns[r.Field] = r ;
          }
          callback ( null, this.table2Columns ) ;
        });
      }) ;
    }
    else
    {
      this.getConnection() ;
      var result = this.select ( "SHOW COLUMNS FROM " + tableName ) ;
      for ( var i = 0 ; i < result.length ; i++ )
      {
        var r = result[i] ;
        if ( r.Key === "PRI" )
        {
          r.isPrimaryKey = true ;
        }
        this.table2Columns[r.Field] = r ;
      }
      return this.table2Columns ;
    }
  }
  else
  {
    throw new Error ( "not implemented." ) ;
  }
};
Database.prototype.setConfig = function ( config )
{
  this.config = config ;
};
Database.prototype.executeRequest = function ( request, callback )
{
  if ( !request.operationList.length )
  {
    throw new Error ( "Missing operations in request" ) ;
  }
  if ( request.operationList.length > 1 )
  {
    let result = null ;
    wait.launchFiber ( () => {
      for ( let i = 0 ; i < request.operationList.length ; i++ )
      {
        let operation = request.operationList[i] ;

        var response = wait.forMethod ( this, "executeOperation", operation ) ;
        if ( ! result )
        {
          result = new DbResult() ;
        }
        if ( response.err )
        {
          result.error = response.err ;
          callback ( result ) ;
          return ;
        }
        result.add ( operation.table, response.res ) ;
      }
      callback ( result ) ;
    });
    return ;
  }
  else
  {
    let operation = request.operationList[0] ;
    this.executeOperation ( operation, ( err, result ) => {
      callback ( new DbResult ( result.err, operation.table, result.res ) ) ;
    });
  }
};
Database.prototype.executeOperation = function ( operation, callback )
{
  if ( operation.name === 'select' )
  {
    if ( ! operation.table )
    {
      callback ( null, { err:new Error ( "Missing table for operation=" + operation.name ) } ) ;
      return ;
    }
    if ( ! Array.isArray ( operation.columns ) )
    {
      // callback ( null, { err:new Error ( "Missing columns[] for operation=" + operation.name + " for table=" + operation.table ) } )  ;
      // return ;
      operation.columns = [ '*' ] ;
    }
    let definedOperation = this.config.operations[operation.table] ;
    if ( ! definedOperation )
    {
      callback ( null, { err:new Error ( "No defined-operation for " + operation.name + " for table=" + operation.table ) } ) ;
      return ;
    }
    let select_table = operation.table ;
    if ( definedOperation.select_table )
    {
      select_table = definedOperation.select_table ;
    }
    let first = true ;
    let sql = "select " ;
    for ( let i = 0 ; i < operation.columns.length ; i++ )
    {
      if ( first ) first = false ;
      else sql += "\n, " ;
      sql += operation.columns[i] ;
    }
    sql += " from " + select_table ;
    if ( operation.where )
    {
      sql += " where " + operation.where ;
    }
    this.select ( sql, operation.hostVars, ( err, res ) => {
      if ( err )
      {
        console.log ( err ) ;
      }
      callback ( null, { err:err, res:res } ) ;
    });
  }
  else
  if ( operation.name === 'update' )
  {
    if ( ! operation.table )
    {
      callback ( null, { err:new Error ( "Missing table for operation=" + operation.name ) } ) ;
      return ;
    }
    let definedOperation = this.config.operations[operation.table] ;
    if ( ! definedOperation )
    {
      callback ( null, { err:new Error ( "No defined-operation for " + operation.name + " for table=" + operation.table ) } ) ;
      return ;
    }
    this.getColumnsForTable ( operation.table, ( err, columns ) => {
      if ( err )
      {
        callback ( null, { err: err } ) ;
        return ;
      }
      let sql = "update " + operation.table + " set " ;
      let foundPrimaryKeyName = null ;
      let foundPrimaryKeyValue = null ;
      let hostVars = [] ;
      let first = true ;
      for ( let key in operation.row )
      {
        let c = columns[key] ;
        if ( ! c )
        {
          console.log ( "No column:'" + key + "'" ) ;
          continue ;
        }
        if ( c.isPrimaryKey )
        {
          foundPrimaryKeyName = key ;
          foundPrimaryKeyValue = operation.row[key] ;
          continue ;
        }
        if ( definedOperation.immutableColumns[key] )
        {
          continue ;
        }
        if ( first ) first = false ;
        else sql += "\n, " ;
        sql += key + "=?" ;
        hostVars.push ( operation.row[key] ) ;
      }
      let where = "" ;
      if ( foundPrimaryKeyName )
      {
        hostVars.push ( foundPrimaryKeyValue ) ;
        where = "\nwhere " + foundPrimaryKeyName + "=?" ;
      }
      if ( operation.where )
      {
        if ( ! where ) where = "\nwhere " ;
        else           where += ", " ;
        where += " " + operation.where ;
      }
      if ( operation.hostVars )
      {
        for ( let i = 0 ; i < operation.hostVars.length ; i++ )
        {
          hostVars.push ( operation.hostVars[i] ) ;
        }
      }
      sql += where ;
      db.update ( sql, hostVars, ( err, rows ) => {
        if ( err )
        {
          console.log ( err ) ;
        }
        callback ( null, { err:err, res:rows } ) ;
      } ) ;
    });
  }
  else
  {
    callback ( nukk, { err:new Error ( "Invalid operation=" + operation.name ) } ) ;
  }
};
module.exports = Database ;
if ( require.main === module )
{
  var url = gepard.getProperty ( "dburl", "mysql://root:luap1997@localhost/inventum" ) ;
  // var url = gepard.getProperty ( "dburl", "sqlite://../test/sidds.db" ) ;
  var db = new Database ( url ) ;
  console.log ( "db=" + db ) ;

  let conf = {
    operations: {
      "t_inventory": {
        "immutableColumns":
        { "operator_modified":true
        , "created_at":true
        , "last_modified":true
        , "inventory_key":true
        }
      , "select_table": "v_inventory"
      // , "update_table": "t_inventory"
      // , "delete_table": "t_inventory"
      }
    }
  } ;
  db.setConfig ( conf ) ;

  // var request =
  // {
  //   attributes:null
  // , operationList:
  //   [
  //     {
  //       name: "select"
  //     , table: "t_inventory"
  //     , columns: [ "*" ]
  //     , where: "inventory_key=?"
  //     , hostVars: [ 1 ]
  //     }
  //   ]
  // };
  // let operation2 =
  // {
  //   name: "select"
  // , table: "t_inventory"
  // , columns: [ "*" ]
  // , where: "inventory_key=2"
  // };
  // let r = new DbRequest ( request ) ;
  // r.operationList.push ( operation2 )
  // db.executeRequest ( r, ( dbResult ) => {
  //   gepard.log ( dbResult ) ;
  //   db.commit() ;
  //   db.disconnect() ;
  // });

  var row =
  {
    inventory_key: 4
  , inventory_name: 'Microsoft 17. Updated'
  , description: 'DDDxhaFUhXS /view__usp=sharing 35 bit'
  , miscellaneous: 'first updated'
  , status: 'active'
  , created_at: "Sat Apr 16 2016 16:13:09 GMT+0200 (CEST)"
  , last_modified: "Fri Apr 22 2016 12:29:46 GMT+0200 (CEST)"
  , operator_modified: null
  , person_last_name: 'Gessinger'
  };
  var request =
  {
    attributes:null
  , operationList:
    [
      {
        name: "update"
      , table: "t_inventory"
      , row: row
      }
    , {
        name: "select"
      , table: "t_inventory"
      , columns: [ "*" ]
      , where: "inventory_key=4"
      }
    ]
  };
  let r = new DbRequest ( request ) ;
  let r2 = new DbRequest() ;
  // r2.addOperation(
  // {
  //   name: "update"
  // , table: "t_inventory"
  // , row: row
  // });
  r2.addUpdate ( "t_inventory", row ) ;
  r2.addSelect ( "t_inventory", "inventory_key=4" );
  db.executeRequest ( r2, ( result ) => {
    gepard.log ( result ) ;
    db.commit() ;
    db.disconnect() ;
  });
}
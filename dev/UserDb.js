var gepard = require ( "gepard" ) ;
var wait = require ( "wait.for" ) ;

var S1 = 'SELECT'
       + '  identity_key'      
       + ', identity_name'     
       + ', identity_type_key' 
       + ', description'       
       + ', salt'              
       + ', enabled'           
       + ', pwd'               
       + ', start_date'        
       + ', end_date'          
       + ', last_modified'     
       + ', operator_modified' 
       + ', email'             
       + ', pwd_must_be_changed'
       + ', login_enabled'     
       + ', external_id'       
       + ', external_key'      
       + ' FROM t_identity'
       + ' WHERE UPPER(identity_name)=?'
       + '   AND enabled=\'1\''
       + '   AND end_date>current_timestamp'
       // + '   AND END_DATE>?'
       // + ' FOR UPDATE'
       ;

var S_FROM_I_TO_I = 'SELECT '
                  + '  parent_identity_key'
                  + ', identity_type_key'
                  + ', identity_type_name'
                  + ', parent_identity_name'
                  + '  FROM v_identity_to_identity'
                  + '  WHERE identity_key=?'
                  + '    AND enabled=\'1\''
                  + '    AND end_date>current_timestamp'
                  ;
var S_RIGHTS = 'SELECT '
             + '    right_name' 
             + '  , right_value'
             + '  , right_key'  
             + '  , identity_key'
             + '  , identity_name'
             + '  , right_context'
             + '  FROM v_identity_to_right'
             + '  WHERE identity_key=?'
             ;

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
Database.prototype.getConnection = function()
{
  if ( this.connection )
  {
    return this.connection ;
  }
  if ( this._MYSQL )
  {
    var mysql =  require('mysql');
    this.connection =  mysql.createConnection ( this.url ) ;
    this.connection.connect();
    this.connection.q = function ( _sql, params, stdCallback )
    { 
      this.query ( _sql, params, function(err,rows,columns)
      { 
        return stdCallback(err,{rows:rows,columns:columns}); 
      });
    };
  }
  else
  if ( this._SQLITE )
  {
    this._SYSDATE = "CURRENT_TIMESTAMP" ;
    this._UNIQUE = "DISTINCT" ;
    var sql = require('sql.js');
    var file = this.url.substring ( this.url.indexOf ( ':' ) + 1 ) ;
    var fs = require('fs');
    var fileExists = false ;
    try
    {
      fs.statSync ( file ) ;
      fileExists = true ;
      // var data = db.export(); TODO: write data
      // var buffer = new Buffer(data);
      // fs.writeFileSync("filename.sqlite", buffer);
    }
    catch ( exc )
    {
      console.log ( exc ) ;
    }
    if ( fileExists )
    {
      var filebuffer = fs.readFileSync ( file ) ;
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
Database.prototype.close = function()
{
  if ( this._MYSQL ) { if ( this.connection ) this.connection.end() ; }
  if ( this._SQLITE ) { if ( this.connection ) this.connection.close() ; }
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
  if ( this._MYSQL ) { if ( this.connection ) this.connection.end() ; }
  if ( this._SQLITE ) { if ( this.connection ) this.connection.close() ; }
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
Database.prototype.select = function ( sql, hostVars )
{
  var result ;
  if ( this._MYSQL )
  {
  // result.insertId, TODO for mySQL
    result = wait.forMethod( this.connection, "q", sql, hostVars ); 
    return result.rows ;
  }
  else
  if ( this._SQLITE )
  {
    var stmt = this.connection.prepare ( sql, hostVars ) ;
    result = [] ;
    while ( stmt.step() )
    {
      result.push ( stmt.getAsObject() ) ;
    }
    return result
  }
  else
  if ( this._POSTGRES )
  {
    var sql1 = sql.replace ( /\?/g, "$1" ) ;
    var response = wait.forMethod ( this.connection, "q", sql1, hostVars ) ;
    if ( response.err )
    {
      console.log ( err ) ;
      delete connection["q"] ;
      var pool = this.pg.getOrCreate() ;
      pool.destroy ( connection ) ;
      return ;
    }
    return response.result.rows ; //.rows[0]);
  }
};

UserDB = function ( url )
{
  this.db = new Database ( url ) ;
};
UserDB.prototype.toString = function()
{
  return "(UserDB)" ;
};
UserDB.prototype.verifyUser = function ( userIn, callback )
{
  this.db.getConnection() ;
  try
  {
    var userList = this.db.select ( S1, [ userIn.name.toUpperCase() ] ) ;
    var user = userList[0] ;
    var roleNameList = [] ;
    var roleKeyList  = [] 
    var identityKeyList  = [] ;
    var foundIdentityKeys = {} ;
    var parentIdentityTypeList = [] ;
    var dentityToRoleContext  = [] ;
    this.collectParents ( userIn
                        , user.identity_key
                        , identityKeyList
                        , foundIdentityKeys
                        , parentIdentityTypeList
                        ) ;
// console.log ( "user.identity_key=" + user.identity_key ) ;
// console.log ( "identityKeyList" ) ;
// console.log ( identityKeyList ) ;
// console.log ( "foundIdentityKeys" ) ;
// console.log ( foundIdentityKeys ) ;
// console.log ( "parentIdentityTypeList" ) ;
// console.log ( parentIdentityTypeList ) ;
// console.log ( "userIn" ) ;
// console.log ( "userIn 1 ---------------------" ) ;
// console.log ( userIn ) ;
    this.collectRights ( userIn, identityKeyList ) ;
// console.log ( "userIn 2 ---------------------" ) ;
// console.log ( userIn ) ;
    callback ( null, userIn ) ;
  }
  catch ( err )
  {
    callback ( err, null ) ;
    this.db.close() ;
  }
};
UserDB.prototype.collectParents = function ( userIn
                                           , identity_key
                                           , identityKeyList
                                           , foundIdentityKeys
                                           , parentIdentityTypeList
                                           )
{
  var localIdentityKeyList = [] ;
  try
  {
    var rows = this.db.select ( S_FROM_I_TO_I, [ identity_key ] ) ;
    for ( var i = 0 ; i < rows.length ; i++ )
    {
      var row = rows[i] ;
      if ( foundIdentityKeys[ "" + row.parent_identity_key ] ) continue ;
      foundIdentityKeys[""+row.parent_identity_key] = true ;
      parentIdentityTypeList.push ( [ row.identity_type_name, row.parent_identity_name ] ) ;
      if ( row.parent_identity_name )
      {
        if ( ! userIn.groups ) userIn.groups = {} ;
        userIn.groups[row.parent_identity_name] = row.parent_identity_key ;
      }
      identityKeyList.push ( row.parent_identity_key ) ;
      localIdentityKeyList.push ( row.parent_identity_key ) ;
    }
    for ( var i = 0 ; i < localIdentityKeyList.length ; i++ )
    {
      this.collectParents ( userIn, localIdentityKeyList[i], identityKeyList, foundIdentityKeys, parentIdentityTypeList ) ;
    }
  }
  catch ( exc )
  {
    console.log ( exc ) ;
  }
  finally
  {
    localIdentityKeyList.length = 0 ;
  }
};
UserDB.prototype.collectRights = function (  userIn
                                          ,  identityKeyList
                                          )
{
  if ( ! userIn.context ) userIn.context = "*" ;
  try
  {
    for ( var j = 0 ; j < identityKeyList.length ; j++ )
    {
      var rows = this.db.select ( S_RIGHTS, [ identityKeyList[j] ] ) ;
      for ( var i = 0 ; i < rows.length ; i++ )
      {
        var row = rows[i] ;
        if ( ! row.right_context ) row.right_context = "*" ;
        if (  userIn.context === row.right_context
           || row.right_context === "*"
           )
        {
        }
        else
        {
          continue ;
        }
        if ( ! userIn.rights ) userIn.rights = {} ;
        userIn.rights[row.right_name] = row.right_value ;
      }
    }
  }
  catch ( exc )
  {
    console.log ( exc ) ;
  }
};

var verifyForLogin = true ;

var userIn = {} ;
userIn["name"] = "Miller" ;
userIn["context"] = "WEB" ;

// var url = gepard.getProperty ( "url", "mysql://root:@localhost/sidds" ) ;
var url = gepard.getProperty ( "url", "sqlite:sidds.db" ) ;
var udb = new UserDB ( url ) ;
console.log ( "udb=" + udb.db ) ;
wait.launchFiber ( udb.verifyUser.bind ( udb ), userIn, function ( err, user )
{
  if ( err )
  {
    console.log ( err ) ;
    return ;
  }
  console.log ( user ) ;
  // if ( verifyForLogin )
  // {
  //   if ( ! user.LOGIN_ENABLED )
  //   {
  //     throw new Error ( "Invalid user." ) ;
  //   }
  // }
  udb.db.disconnect() ;
} ) ;

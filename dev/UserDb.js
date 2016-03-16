var gepard = require ( "gepard" ) ;
var wait = require ( "wait.for" ) ;

var S1 = "SELECT"
       + "  IDENTITY_KEY"       
       + ", IDENTITY_NAME"      
       + ", IDENTITY_TYPE_KEY"  
       + ", DESCRIPTION"        
       + ", SALT"               
       + ", ENABLED"            
       + ", PWD"                
       + ", START_DATE"         
       + ", END_DATE"           
       + ", LAST_MODIFIED"      
       + ", OPERATOR_MODIFIED"  
       + ", EMAIL"              
       + ", PWD_MUST_BE_CHANGED"
       + ", LOGIN_ENABLED"      
       + ", EXTERNAL_ID"        
       + ", EXTERNAL_KEY"       
       + " FROM T_IDENTITY"
       + " WHERE UPPER(IDENTITY_NAME)=?"
       + "   AND ENABLED='1'"
       + "   AND END_DATE>CURRENT_TIMESTAMP"
       // + "   AND END_DATE>?"
       // + " FOR UPDATE"
       ;

var S_FROM_I_TO_I = "SELECT "
                  + "  PARENT_IDENTITY_KEY"
                  + ", IDENTITY_TYPE_KEY"
                  + ", IDENTITY_TYPE_NAME"
                  + ", PARENT_IDENTITY_NAME"
                  + "  FROM V_IDENTITY_TO_IDENTITY"
                  + "  WHERE IDENTITY_KEY=?"
                  + "    AND ENABLED='1'"
                  + "    AND END_DATE>CURRENT_TIMESTAMP"
                  ;
var S_RIGHTS = "SELECT "
             + "    RIGHT_NAME"   
             + "  , RIGHT_VALUE"  
             + "  , RIGHT_KEY"    
             + "  , IDENTITY_KEY"     
             + "  , IDENTITY_NAME"    
             + "  , RIGHT_CONTEXT"
             + "  FROM V_IDENTITY_TO_RIGHT"
             + "  WHERE IDENTITY_KEY=?"
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
    try
    {
      fs.statSync ( file ) ;
      var filebuffer = fs.readFileSync ( file ) ;
      this.connection = new sql.Database ( filebuffer ) ;
      // var data = db.export(); TODO: write data
      // var buffer = new Buffer(data);
      // fs.writeFileSync("filename.sqlite", buffer);
    }
    catch ( exc )
    {
      console.log ( exc ) ;
    }
  }
  return this.connection ;
};
Database.prototype.close = function()
{
  if ( this._MYSQL ) this.connection.end() ;
  if ( this._SQLITE ) this.connection.close() ;
  this.connection = null ;
};
Database.prototype.select = function ( sql, hostVars )
{
  if ( this._MYSQL )
  {
  // result.insertId, TODO for mySQL
    var result = wait.forMethod( this.connection, "q", sql, hostVars ); 
    return result.rows ;
  }
  else
  if ( this._SQLITE )
  {
    var stmt = this.connection.prepare ( sql, hostVars ) ;
    var result = [] ;
    while ( stmt.step() )
    {
      result.push ( stmt.getAsObject() ) ;
    }
    return result
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
                        , user.IDENTITY_KEY
                        , identityKeyList
                        , foundIdentityKeys
                        , parentIdentityTypeList
                        ) ;
// console.log ( "user.IDENTITY_KEY=" + user.IDENTITY_KEY ) ;
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
  }
  finally
  {
    this.db.close() ;
  }
};
UserDB.prototype.collectParents = function ( userIn
                                           , IDENTITY_KEY
                                           , identityKeyList
                                           , foundIdentityKeys
                                           , parentIdentityTypeList
                                           )
{
  var localIdentityKeyList = [] ;
  try
  {
    var rows = this.db.select ( S_FROM_I_TO_I, [ IDENTITY_KEY ] ) ;
    for ( var i = 0 ; i < rows.length ; i++ )
    {
      var row = rows[i] ;
      if ( foundIdentityKeys[ "" + row.PARENT_IDENTITY_KEY ] ) continue ;
      foundIdentityKeys[""+row.PARENT_IDENTITY_KEY] = true ;
      parentIdentityTypeList.push ( [ row.IDENTITY_TYPE_NAME, row.PARENT_IDENTITY_NAME ] ) ;
      if ( row.PARENT_IDENTITY_NAME )
      {
        if ( ! userIn.groups ) userIn.groups = {} ;
        userIn.groups[row.PARENT_IDENTITY_NAME] = row.PARENT_IDENTITY_KEY ;
      }
      identityKeyList.push ( row.PARENT_IDENTITY_KEY ) ;
      localIdentityKeyList.push ( row.PARENT_IDENTITY_KEY ) ;
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
        if ( ! row.RIGHT_CONTEXT ) RIGHT_CONTEXT = "*" ;
        if (  userIn.context === row.RIGHT_CONTEXT
           || row.RIGHT_CONTEXT === "*"
           )
        {
        }
        else
        {
          continue ;
        }
        if ( ! userIn.rights ) userIn.rights = {} ;
        userIn.rights[row.RIGHT_NAME] = row.RIGHT_VALUE ;
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
  console.log ( user ) ;
  // if ( verifyForLogin )
  // {
  //   if ( ! user.LOGIN_ENABLED )
  //   {
  //     throw new Error ( "Invalid user." ) ;
  //   }
  // }
} ) ;

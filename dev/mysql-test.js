// var mysql =  require('mysql2');
var gepard = require ( "gepard" ) ;

  // connection.query( "use sidds" );

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


UserDB = function ( dburl )
{
  this.dburl = gepard.getProperty ( "dburl", "mysql://root:@localhost/sidds" ) ;
  if ( this.dburl.indexOf ( "mysql" ) >= 0 )
  {
    this._MYSQL = true ;
  }
};
UserDB.prototype.toString = function()
{
  return "(UserDB)" ;
};
UserDB.prototype.getConnection = function()
{
  if ( this.connection )
  {
    return this.connection ;
  }
  if ( this._MYSQL )
  {
    var mysql =  require('mysql');
    this.connection =  mysql.createConnection ( this.dburl ) ;
    this.connection.connect();
    this.connection.q = function ( _sql, params, stdCallback )
    { 
      this.query ( _sql, params, function(err,rows,columns)
      { 
        return stdCallback(err,{rows:rows,columns:columns}); 
      });
    };
  }
  return this.connection ;
};
UserDB.prototype.selectIdentity = function ( userIn )
{
  this.getConnection() ;
  try
  {
    var userList = this.select ( S1, [ userIn.name ] ) ;
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
console.log ( "user.IDENTITY_KEY=" + user.IDENTITY_KEY ) ;
console.log ( "identityKeyList" ) ;
console.log ( identityKeyList ) ;
console.log ( "foundIdentityKeys" ) ;
console.log ( foundIdentityKeys ) ;
console.log ( "parentIdentityTypeList" ) ;
console.log ( parentIdentityTypeList ) ;
console.log ( "userIn" ) ;
console.log ( "userIn 1 ---------------------" ) ;
console.log ( userIn ) ;
this.collectRights ( userIn, identityKeyList ) ;
console.log ( "userIn 2 ---------------------" ) ;
console.log ( userIn ) ;

  }
  catch ( err )
  {
    console.log(err);
  }
  finally
  {
    this.connection.end() ;
  }
};
UserDB.prototype.collectParents = function ( userIn
                                           , IDENTITY_KEY
                                           , identityKeyList
                                           , foundIdentityKeys
                                           , parentIdentityTypeList
                                           )
{
  var st = "" ;
  var localIdentityKeyList = [] ;
  try
  {
    var rows = this.select ( S_FROM_I_TO_I, [ IDENTITY_KEY ] ) ;
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
      var rows = this.select ( S_RIGHTS, [ identityKeyList[j] ] ) ;
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
UserDB.prototype.select = function ( sql, hostVars )
{
  if ( this._MYSQL )
  {
    var result = wait.forMethod( this.connection, "q", sql, hostVars ); 
    return result.rows ;
  }
};

var userIn = {} ;
userIn["name"] = "Miller" ;
userIn["context"] = "WEB" ;

var dburl = gepard.getProperty ( "dburl", "mysql://root:@localhost/sidds" ) ;
var udb = new UserDB() ;
wait.launchFiber ( udb.selectIdentity.bind ( udb ), userIn ) ;

// function process(p)
// {
// console.log ( "p=" + p ) ;
//   connection.end() ;
  // var data = wait.forMethod ( connection, "query", S_IDENTITY_FOR_PERSON, [ 'miller' ] ) ;
  // console.log ( data ) ;
  // data = wait.forMethod ( connection, "query", S_IDENTITY_FOR_PERSON, [ 'admin' ] ) ;
  // console.log ( "data[0].IDENTITY_NAME=" + data[0].IDENTITY_NAME ) ;
  // console.log ( "data[0].IDENTITY_KEY=" + data[0].IDENTITY_KEY ) ;
  // connection.end() ;
// }
// wait.launchFiber(process,"xx");
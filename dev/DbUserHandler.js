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
Database.prototype.createStatement = function ( sql, params )
{
  if ( this._SQLITE )
  {
    var stmt = this._db.prepare ( sql, params ) ;
    return stmt ;
  }
};


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

var db = new Database ( "sqlite:" + "sidds.db" ) ;
db.init() ;

var collectParents = function ( userIn
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
    st = db.createStatement ( S_FROM_I_TO_I, [ IDENTITY_KEY ] ) ;
    while ( st.step() )
    {
      var row = st.getAsObject();
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
      collectParents ( userIn, localIdentityKeyList[i], identityKeyList, foundIdentityKeys, parentIdentityTypeList ) ;
    }
    // st.reset() ;
    // st.freemem() ;
  }
  catch ( exc )
  {
    console.log ( exc ) ;
  }
  finally
  {
    st.reset() ;
    // st.freemem() ;
    localIdentityKeyList.length = 0 ;
  }
}
var collectRights = function (  userIn
                           ,  identityKeyList
                           )
{
  var st = "" ;
  if ( ! userIn.context ) userIn.context = "*" ;
  try
  {
    var index = 0 ;
    st = db.createStatement ( S_RIGHTS ) ;
    for ( var i = 0 ; i < identityKeyList.length ; i++ )
    {
      st.reset() ;
      st.bind ( [ identityKeyList[i] ] ) ;
      while ( st.step() )
      {
        var row = st.getAsObject();
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
      index++ ;
    }
    st.reset() ;
  }
  catch ( exc )
  {
    console.log ( exc ) ;
  }
  finally
  {
    st.reset() ;
  }
}

var verifyForLogin = true ;
var usePwd = true ;
var userIn = {} ;
userIn["name"] = "Miller" ;
userIn["context"] = "WEB" ;

var stmt = db.createStatement ( S1, [userIn.name.toUpperCase()] ) ;
var user ;
while ( stmt.step() )
{ 
  user = stmt.getAsObject();
  // var user = stmt.get();
console.log ( user ) ;
}
stmt.reset() ;
// stmt.freemem() ;
if ( verifyForLogin )
{
  if ( ! user.LOGIN_ENABLED )
  {
    throw new Error ( "Invalid user." ) ;
  }
}
// if ( usePwd )
// {
//   if ( !row.SALT )
//   {
//     var U_PWD = "UPDATE T_IDENTITY SET PWD=?, SALT=?, PWD_MUST_BE_CHANGED=0 WHERE IDENTITY_KEY=?" ;
//     int salt = getRandom() ;
//     String md5Password = md5Encode ( "" + salt + PWD ) ;
//     pStmt = getPreparedStatement ( U_PWD ) ;
//     pStmt.setString ( 1, md5Password ) ;
//     pStmt.setInt    ( 2, salt ) ;
//     pStmt.setInt    ( 3, IDENTITY_KEY ) ;
//     int n = pStmt.executeUpdate() ;
//     commit() ;
    // }
    // else
    // {
    //   int iSALT = Integer.parseInt ( SALT ) ;
    //   String md5Password = md5Encode ( "" + iSALT + pwd ) ;
    //   if ( ! PWD.equals ( md5Password ) )
    //   {
    //     msg.addDisplayableText ( "InvalidLoginParameter"
    //                            , "The login parameter are invalid."
    //                            ) ;
    //     throw new QCTsAccessDenied ( "Invalid user / password." ) ;
    //   }
    // }
//   }
// }
var roleNameList = [] ;
var roleKeyList  = [] 
var identityKeyList  = [] ;
var foundIdentityKeys = {} ;
var parentIdentityTypeList = [] ;
var dentityToRoleContext  = [] ;

collectParents ( userIn
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
collectRights ( userIn, identityKeyList ) ;
console.log ( "userIn 2 ---------------------" ) ;
console.log ( userIn ) ;

#!/usr/bin/env node

"use strict"

var gepard = require ( "gepard" ) ;
var wait = require ( "wait.for" ) ;
var Database = require ( "./Database" ) ;

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

var UserDB = function ( url )
{
  this.db = new Database ( url ) ;
};
UserDB.prototype.toString = function()
{
  return "(UserDB)" ;
};
UserDB.prototype._verifyUser = function ( userIn, callback )
{
  this.db.getConnection() ;
  try
  {
    var userList = this.db.select ( S1, [ userIn.id.toUpperCase() ] ) ;
    if ( ! userList.length )
    {
      try
      {
        callback.call ( this, "Invalid credentials", null ) ;
      }
      catch ( exc )
      {
        console.log ( exc ) ;
      }
      return ;
    }
    var user     = userList[0] ;
    userIn.key   = user.identity_key ;
    userIn.id    = user.identity_name ;
    if ( userIn["_pwd"] )
    {
      if ( ! user.salt )
      {
        if ( user.pwd !== userIn._pwd )
        {
          try
          {
            callback.call ( this, "Invalid credentials", null ) ;
          }
          catch ( exc )
          {
            console.log ( exc ) ;
          }
          return ;
        }
        var crypto = require ( "crypto" ) ;
        var buf = crypto.randomBytes ( 4 ) ;
        var salt = buf.readInt32LE() ;
        var md5pwd = crypto.createHash('md5').update( user.pwd ).digest("hex") ;
        this.db.update ( "update t_identity set salt=?, pwd=? where identity_key=?", [ salt, md5pwd, user.identity_key ] ) ;
      }
      else
      {
        var crypto = require ( "crypto" ) ;
        var md5pwd = crypto.createHash('md5').update( userIn._pwd ).digest("hex") ;
        if ( user.pwd !== md5pwd )
        {
          try
          {
            callback.call ( this, "Invalid credentials", null ) ;
          }
          catch ( exc )
          {
            console.log ( exc ) ;
          }
          return ;
        }
      }
    }
    userIn._pwd = "" ;
    var identityKeyList        = [] ;
    var foundIdentityKeys      = {} ;
    var parentIdentityTypeList = [] ;
    var identityKeyToGroup     = {} ;
    this.collectParents ( userIn
                        , user.identity_key
                        , identityKeyList
                        , foundIdentityKeys
                        , parentIdentityTypeList
                        , identityKeyToGroup
                        ) ;
    this.collectRights ( userIn, identityKeyList, identityKeyToGroup ) ;
    if ( typeof callback === 'function' )
    {
      callback ( null, userIn ) ;
    }
    return userIn ;
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
                                           , identityKeyToGroup
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
        if ( ! userIn.groups ) userIn.groups = { keys:{}, rights:{} } ;
        if ( ! userIn.groups.keys ) userIn.groups.keys = {} ;
        if ( ! userIn.groups.rights ) userIn.groups.rights = {} ;
        userIn.groups.keys[row.parent_identity_name]     = row.parent_identity_key ;
        identityKeyToGroup["" + row.parent_identity_key] = row.parent_identity_name ;
      }
      identityKeyList.push ( row.parent_identity_key ) ;
      localIdentityKeyList.push ( row.parent_identity_key ) ;
    }
    for ( var i = 0 ; i < localIdentityKeyList.length ; i++ )
    {
      this.collectParents ( userIn
                          , localIdentityKeyList[i]
                          , identityKeyList, foundIdentityKeys
                          , parentIdentityTypeList
                          ) ;
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
UserDB.prototype.collectRights = function ( userIn
                                          , identityKeyList
                                          , identityKeyToGroup
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
        if ( ! userIn.rights[row.right_name] )
        {
          userIn.rights[row.right_name] = row.right_value ;
        }
        else
        {
          let v = userIn.rights[row.right_name] ;
          if ( v.indexOf ( row.right_value ) < 0 )
          {
            userIn.rights[row.right_name] = v + "," + row.right_value ;
          }
        }
        var groupName   = identityKeyToGroup[""+identityKeyList[j]] ;
        var groupRights = userIn.groups.rights[groupName] ;
        if ( ! groupRights )
        {
          groupRights                     = {} ;
          userIn.groups.rights[groupName] = groupRights ;
        }
        groupRights[row.right_name] = row.right_value ;
      }
    }
  }
  catch ( exc )
  {
    console.log ( exc ) ;
  }
};
/**
 * Verify the given user
 *
 * @param      {<type>}    userIn    The user in
 * @param      {Function}  callback  The callback
 */
UserDB.prototype.verifyUser = function ( userIn, callback )
{
  var thiz = this ;
  wait.launchFiber ( this._verifyUser.bind ( this ), userIn, function ( err, user )
  {
    thiz.db.commit() ;
    thiz.db.disconnect() ;
    callback ( err, user ) ;
    if ( err )
    {
      return ;
    }
  } ) ;
};
module.exports = UserDB ;

if ( require.main === module )
{
  var verifyForLogin = true ;

  var userIn = {} ;
  userIn["id"] = gepard.getProperty ( "user.id", "admin" ) ;
  userIn["context"] = "WEB" ;
  userIn["_pwd"] = gepard.getProperty ( "user.pwd", "654321" ) ;

  var url = gepard.getProperty ( "sidds.url" ) ;
  var udb = new UserDB ( url ) ;
  console.log ( "udb=" + udb.db ) ;
  wait.launchFiber ( udb._verifyUser.bind ( udb ), userIn, function ( err, user )
  {
    if ( err )
    {
      gepard.log ( err ) ;
      return ;
    }
    gepard.log ( user ) ;
    // if ( verifyForLogin )
    // {
    //   if ( ! user.LOGIN_ENABLED )
    //   {
    //     throw new Error ( "Invalid user." ) ;
    //   }
    // }
    udb.db.commit() ;
    udb.db.disconnect() ;
  } ) ;
}
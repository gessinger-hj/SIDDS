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
    this.collectRights ( userIn, identityKeyList ) ;
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
UserDB.prototype.collectRights = function ( userIn
                                          , identityKeyList
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
userIn["pwd"] = "123456" ;

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

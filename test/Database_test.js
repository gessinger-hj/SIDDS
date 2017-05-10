#!/usr/bin/env node

"use strict"

var gepard    = require ( "gepard" ) ;
var sidds     = require ( "sidds" ) ;

var url = gepard.getProperty ( "inventum.url" ) ;
// var url = gepard.getProperty ( "dburl", "sqlite://../test/sidds.db" ) ;
var db = new sidds.Database ( url ) ;
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
// let r = new sidds.DbRequest ( request ) ;

// let r2 = new sidds.DbRequest() ;
// r2.addUpdate ( "t_inventory", row ) ;
// r2.addSelect ( "t_inventory", "inventory_key=4" );
// db.executeRequest ( r2, ( result ) => {
//   gepard.log ( result ) ;
//   db.commit() ;
//   db.disconnect() ;
// });

var row2 =
{
  inventory_name: 'Microsoft 17. New Insert'
, description: 'xxxxxxxxxxxxxxxxxxxxxx'
, miscellaneous: 'yyyyyyyyyyyyyyyyyyyyyyyyyy'
};

let r3 = new sidds.DbRequest() ;
r3.addInsert ( "t_inventory", row2 ) ;
console.log ( r3 ) ;
db.executeRequest ( r3, ( result ) => {
  gepard.log ( result ) ;
  db.commit() ;
  db.disconnect() ;
});

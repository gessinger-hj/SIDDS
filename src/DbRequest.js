/*
* @Author: Hans Jürgen Gessinger
* @Date:   2016-04-26 15:34:30
* @Last Modified by:   Hans Jürgen Gessinger
* @Last Modified time: 2016-04-26 17:23:49
*/

'use strict';
let DbRequest = function ( requestObject )
{
  this.action    = requestObject.action ;
  this.operation = requestObject.operation ;
  this.table     = requestObject.table ;
  this.row       = requestObject.row ;
  this.columns   = requestObject.columns ;
  this.where     = requestObject.where ;
  this.hostVars  = requestObject.hostVars ;
};
module.exports = DbRequest ;


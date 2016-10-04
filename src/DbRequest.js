/*
* @Author: Hans Jürgen Gessinger
* @Date:   2016-04-26 15:34:30
* @Last Modified by:   Hans Jürgen Gessinger
* @Last Modified time: 2016-07-15 17:12:55
*/

'use strict';
let DbRequest = function ( jsonRequest )
{
	if ( ! jsonRequest )
	{
		this.attributes = {} ;
		this.operationList = [] ;
	}
	else
	{
		this.attributes = jsonRequest.attributes ? jsonRequest.attributes : {} ;
		this.operationList = jsonRequest.operationList ? jsonRequest.operationList : [] ;
	}
};
DbRequest.prototype.addOperation = function ( json )
{
	this.operationList.push ( json ) ;
};
DbRequest.prototype.addSelect = function ( table, where, columns )
{
	if ( ! Array.isArray ( columns ) ) columns = [] ;
	if ( ! columns.length ) columns.push ( '*' ) ;

	this.operationList.push (
	{ name: 'select'
	, table:table
	, columns: columns
	, where:where
	}) ;
};
DbRequest.prototype.addUpdate = function ( table, row, where )
{
	this.operationList.push (
	{ name: 'update'
	, table:table
	, row: row
	, where:where
	}) ;
};
DbRequest.prototype.addInsert = function ( table, row )
{
	this.operationList.push (
	{ name: 'insert'
	, table:table
	, row: row
	}) ;
};
module.exports = DbRequest ;


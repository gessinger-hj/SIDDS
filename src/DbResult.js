/*
* @Author: Hans Jürgen Gessinger
* @Date:   2016-04-26 16:38:22
* @Last Modified by:   Hans Jürgen Gessinger
* @Last Modified time: 2016-07-06 15:15:10
*/

'use strict';
let DbResult = function ( error, tag, res )
{
	this.error  = error ;
	this.resultList = [] ;
	this.add ( tag, res ) ;
};
DbResult.prototype.add = function ( tag, res )
{
	if ( ! res ) return ;
	if ( ! tag )
	{
		throw new Error ( "Missing tag" ) ;
	}
	let item = { name:tag, rows: res } ;
	this.resultList.push ( item ) ;
};
DbResult.prototype.getResultList = function()
{
	return this.resultList ;
};
module.exports = DbResult ;

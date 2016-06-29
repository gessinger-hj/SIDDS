/*
* @Author: Hans Jürgen Gessinger
* @Date:   2016-04-26 16:38:22
* @Last Modified by:   Hans Jürgen Gessinger
* @Last Modified time: 2016-06-28 19:40:00
*/

'use strict';
let DbResult = function ( error, tag, res )
{
	this.error  = error ;
	this.list = [] ;
	if ( res )
	{
		this.add ( tag, res ) ;
	}
};
DbResult.prototype.add = function ( tag, res )
{
	if ( ! res ) return ;
	if ( ! tag )
	{
		throw new Error ( "Missing tag" ) ;
	}
	let item = {} ;
	item[tag] = res ;
	this.list.push ( item ) ;
}
module.exports = DbResult ;

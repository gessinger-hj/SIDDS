/*
* @Author: Hans Jürgen Gessinger
* @Date:   2016-04-26 16:38:22
* @Last Modified by:   Hans Jürgen Gessinger
* @Last Modified time: 2016-04-26 17:23:39
*/

'use strict';
let DbResult = function ( error, result )
{
	this.error  = error ;
	this.result = result ;
};

module.exports = DbResult ;

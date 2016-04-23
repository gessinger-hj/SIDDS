var Path = require ( "path" ) ;
var fs = require ( "fs" ) ;

var d = Path.join ( __dirname, "/src/" ) ;
var sidds = {} ;

function collectFiles ( target, packageName, dir )
{
	if ( packageName )
	{
		target[packageName] = {} ;
		target = target[packageName] ;
	}
	var a = fs.readdirSync ( dir ) ;
	for ( var i = 0 ; i < a.length ; i++ )
	{
		var fname = Path.join ( dir, a[i] ) ;
		if ( fs.statSync ( fname ).isDirectory() )
		{
			if ( a[i] !== "node_modules" )
			{
				collectFiles ( target, a[i], fname ) ;
				continue ;
			}
		}
		var proxyFunction = function ( fullName )
		{
			return function getterFunction () { return require ( fullName ) ; }
		};
		if ( a[i].indexOf ( ".js" ) !== a[i].length - 3 ) continue ;
		if ( fs.statSync ( fname ).isDirectory() ) continue ;

		var cn = a[i].substring ( 0, a[i].length - 3 ) ;
		var fn = proxyFunction ( fname ) ;
		target.__defineGetter__( cn, fn ) ;
	}
	a.length = 0 ;
}
collectFiles ( sidds, "", d ) ;
module.exports = sidds ;

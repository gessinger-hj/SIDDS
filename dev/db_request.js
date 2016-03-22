var gepard = require ( "gepard" ) ;

var client = gepard.getClient() ;

var ne = new gepard.Event ( "DB:REQUEST" ) ;
client.request ( ne
       , { result: function(e)
           {
console.log ( " ----------result: function()----------------" ) ;
            if ( e.isBad() )
            {
              var t = e.getStatusReason() ;
              console.log ( t ) ;
            }
            else
            {
console.log ( e.body.RESULT.toString() ) ;
            }
             this.end() ;
           }
         , error: function(e)
           {
console.log ( " ----------error: function()----------------" ) ;
             gepard.LogFile.log ( e ) ;
             this.end() ;
           }
         , write: function()
           {
              // this.end() ;
           }
         }
       ) ;
client.on('end', function()
{
  console.log('socket disconnected');
});

#!/usr/bin/env node

var sqlite = require ( "node-sqlite-purejs" ) ;
sqlite.open ( 'sidds.db', {}, function(err, db)
{
  if (err) 
    console.log('Error: ' + err);
  if (!err)
  {
    db.exec("SELECT * FROM T_IDENTITY", function(err, result)
    {
      if (err) 
        console.log('Error: ' + err);
      else
        console.log(result);
    })
  }
});


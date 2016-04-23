function* foo(x) {
    yield x + 1;

    var y = yield null;
    return x + y;
}

function* foo(x) {
    while(true) {
        x = x * 2;
        yield x;
    }
}
var g = foo(2);
var s ;
s=g.next(); // -> 4
console.log ( s ) ;
s=g.next(); // -> 8
console.log ( s ) ;
s=g.next(); // -> 16
console.log ( s ) ;
var Scope = require('./../lib/scope').Scope;

var Root = new Scope(null);
Root.add('a', 1000);
Root.add('b', 2000);
var child = new Scope(Root);

console.log(child.lookup('a'));
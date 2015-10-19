var Node = require('./node').Node;

var Scope = function Scope(root) {
    this.root = (root === undefined)? null: root;
    this.table = {};
};

Scope.prototype.add = function (id, value) {
    this.table[id] = value;
};

Scope.prototype.exist = function (id) {
    return this.lookup(id) !== undefined;
};

Scope.prototype.lookup = function (id) {
    var local = this.table[id];
    if (local === undefined) {
        if (this.root === null) {
            return local;
        } else {
            return this.root.lookup(id);
        }
    } else {
        return local;
    }
};

var root = new Scope();
root.add('print', new Node.lambdaNode('$1', new Node.nativeFunction(function(scope) {
    //console.log(scope);
    console.log(scope.lookup('$1').getValue(scope));
})));


exports.Scope = Scope;
exports.Root  = root;


if (typeof define === 'undefined') {
    var define = function (ns, deps, func) {
        func(exports);
    }
}

if (typeof require === 'undefined') {
    var require = ll.require;
}


define('./scope', ['./node'], function (exports) {
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
        console.log(scope.lookup('$1').getValue(scope));
    })));

    root.add('length', new Node.lambdaNode('$1', new Node.nativeFunction(function(scope) {
        return scope.lookup('$1').getValue(scope).length;
    })));

    root.add('reverse', new Node.lambdaNode('$1', new Node.nativeFunction(function(scope) {
        return scope.lookup('$1').getValue(scope).concat().reverse();
    })));

    root.add('not', new Node.lambdaNode('$1', new Node.nativeFunction(function(scope) {
        return ! scope.lookup('$1').getValue(scope);
    })));


    root.add('map', new Node.lambdaNode('$1', new Node.lambdaNode('$2', new Node.nativeFunction(function(scope) {
        var func = scope.lookup('$1').getValue(scope);
        return scope.lookup('$2')
            .getValue(scope)
            .map(function(el) {
                return func(new Node.numberNode(el));
            });
    }))));

    exports.Scope = Scope;
    exports.Root  = root;
}); 

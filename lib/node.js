if (typeof define === 'undefined') {
    var define = function (ns, deps, func) {
        func(exports);
    }
}

if (typeof require === 'undefined') {
    var require = ll.require;
}



define('./node', [],function (exports) {
    var NODE = {
        'Function': 1,
        'Object': 2,
        'Expression': 3
    };

    function Node(type) {
        this.type = type;
    }

    function nativeFunction (func) {
        this.func = func;
    }

    nativeFunction.prototype.getValue = function (scope) {
        return this.func(scope);
    };

    function callNode (callee, arg, source) {
        this.callee = callee;
        this.arg = arg;
        this.source = source;
    }

    callNode.prototype.getValue = function (scope) {
        //var arg = scope.lookup(this.arg);
        //if (this.arg.constructor === lambdaNode) {
        //    return expre(this.arg);
        //} else {
        var arg = this.arg.getValue(scope);
        var expre = this.callee.getValue(scope);
        return expre(packNode(arg));
        //}
    };

    function objectNode (id) {
        this.id = id;
    }

    objectNode.prototype.getValue = function (scope) {
        var various = scope.lookup(this.id);
        if (various === undefined) {
            throw "Cannot to find: " + this.id;
        }
        return various.getValue(scope);
    };

    function numberNode (value) {
        this.value = value;
    }

    numberNode.prototype.getValue = function (scope) {
        return this.value;
    };

    function expressionNode (operator, source) {
        this.operator  = operator;
        this.left      = null;
        this.right     = null;
        this.source    = source;
    }

    expressionNode.prototype.getValue = function (scope) {
        var left = this.left.getValue(scope);
        var right;
        if (this.operator === '*') {
            right = this.right.getValue(scope);
            return left * right;
        } else if (this.operator === '/') {
            right = this.right.getValue(scope);
            if (right === 0) {
                throw "divided by zero";
            }
            return left / right;
        } else if (this.operator === '+') {
            right = this.right.getValue(scope);
            return left + right;
        } else if (this.operator === '-') {
            right = this.right.getValue(scope);
            return left - right;
        } else if (this.operator === '==') {
            right = this.right.getValue(scope);
            return left === right;
        } else if (this.operator === '!=') {
            right = this.right.getValue(scope);
            return left !== right;
        } else if (this.operator === '>') {
            right = this.right.getValue(scope);
            return left > right;
        } else if (this.operator === '<') {
            right = this.right.getValue(scope);
            return left < right;
        } else if (this.operator === '>=') {
            right = this.right.getValue(scope);
            return left >= right;
        } else if (this.operator === '<=') {
            right = this.right.getValue(scope);
            return left <= right;
        } else if (this.operator === '||') {
            if (left === true) {
                return true;
            } else {
                return this.right.getValue(scope);
            }
        } else if (this.operator === '&&') {
            if (left === false) {
                return false;
            } else {
                return this.right.getValue(scope);
            }
        } else if (this.operator === '++') {
            right = this.right.getValue(scope);
            var newInstance = left.concat(right);
            return newInstance;
        } else if (this.operator === ':') {
            right = this.right.getValue(scope);
            if (left.constructor === Array) {
                return left.concat(right);
            } else {
                return [].concat(left, right);
            }

        } else if (this.operator === '!!') {
            right = this.right.getValue(scope);
            return left[right];
        } else {
            throw "cannot find a property.";
        }
    };

    function lambdaNode (id, expre, source) {
        this.id = id;
        this.expre = expre;
        this.source = source;
    }

    lambdaNode.prototype.getValue = function (scope) {
        var subScope = new scope.constructor(scope);
        var id = this.id;
        var expre = this.expre;
        return function (p) {
            subScope.add(id, p);
            return expre.getValue(subScope);
        };
    };

    function booleanNode (bool, source) {
        this.bool = bool;
        this.source = source;
    }

    booleanNode.prototype.getValue = function (scope) {
        return this.bool;
    };

    function literalNode (literal, source) {
        this.literal = literal;
    }

    literalNode.prototype.getValue = function (scope) {
        return this.literal;
    };

    function defineNode (id, expre, body, source) {
        this.id = id;
        this.expre = expre;
        this.body = body;
        this.source = source;
    }

    defineNode.prototype.getValue = function (scope) {
        if (scope.table[this.id] === undefined) {
            scope.add(this.id, this.expre);
        } else {
            var tmp = scope.table[this.id];

            while (tmp.constructor === lambdaNode) {
                tmp = tmp.expre;
            }
            if (tmp.constructor === patternNode) {
                if (scope.table[this.id] === undefined) {
                    scope.add(this.id, this.expre);
                } else {
                    while (tmp.next !== null) {
                        tmp = tmp.next;
                    }
                    tmp.next = this.expre.expre;
                }
            }
        }


        if (this.body !== null) {
            return this.body.getValue(scope);
        } else {
            return null;
        }
    };

    function ifConditionNode (cond, expre1, expre2, source) {
        this.cond = cond;
        this.expre1 = expre1;
        this.expre2 = expre2;
        this.souce = source;
    }

    ifConditionNode.prototype.getValue = function (scope) {
        if (this.cond.getValue(scope) === false) {
            return this.expre2.getValue(scope);
        } else {
            return this.expre1.getValue(scope);
        }
    };

    function packNode (value) {
        if (value.constructor === Number) {
            return new numberNode(value);
        } else if (value.constructor === String) {
            return new literalNode(value);
        } else if (value.constructor === Boolean) {
            return new booleanNode(value);
        } else {
            return new numberNode(value);
        }
    }

    function consNode (expre1, expre2, source) {
        this.expre1 = expre1;
        this.expre2 = expre2;
        this.source = source;
    }

    consNode.prototype.getValue = function (scope) {
        if (this.expre2 === null) {
            return this.expre1.getValue(scope);
        } else {
            this.expre1.getValue(scope);
            return this.expre2.getValue(scope);
        }
    };

    function listNode (elements, source) {
        this.ele = elements;
        this.source = source;
    }

    listNode.prototype.getValue = function (scope) {
        return this.ele;
    };

    function patternNode (ids, patterns, expre, source) {
        this.ids = ids;
        this.patterns = patterns;
        this.next = null;
        this.expre = expre;
        this.source = source;
    }

    patternNode.prototype.getValue = function (scope) {
        var ids = this.ids;
        var inPattern = this.patterns.every(function(pattern, index) {
            return pattern.expect(scope.lookup(ids[index]).getValue(scope));
        });
        if (inPattern) {
            return this.expre.getValue(scope);
        } else {
            if (this.next === null) {
                return null;
            } else {
                return this.next.getValue(scope);
            }
        }
    };

    function Exception (message) {
        this.message = message;
    }

    function SourceCode (source, segment, index) {
        this.source = source;
        this.segment = segment;
        this.index  = index;
    }

    SourceCode.prototype.getCodeSegment = function () {
        for (var i = 0, length = this.segment.length; i < length; ++ i) {
            if (this.segment[i] >= this.index) {
                return this.source.slice(this.segment[i - 1], this.segment[i]);
            }
        }
    };

    exports.NODE           = NODE;
    exports.Node           = {};

    exports.Node.callNode        = callNode;
    exports.Node.objectNode      = objectNode;
    exports.Node.numberNode      = numberNode;
    exports.Node.booleanNode     = booleanNode;
    exports.Node.literalNode     = literalNode;
    exports.Node.defineNode      = defineNode;
    exports.Node.lambdaNode      = lambdaNode;
    exports.Node.expressionNode  = expressionNode;
    exports.Node.nativeFunction  = nativeFunction;
    exports.Node.ifConditionNode = ifConditionNode;
    exports.Node.consNode        = consNode;
    exports.Node.listNode        = listNode;
    exports.Node.patternNode     = patternNode;

    exports.Node.Exception       = Exception;
    exports.Node.SourceCode      = SourceCode;
});

//var Scope = require('./scope').Scope;

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

function callNode (callee, arg) {
    this.callee = callee;
    this.arg = arg;
}

callNode.prototype.getValue = function (scope) {
    var expre = this.callee.getValue(scope);
    return expre(this.arg);
};

function objectNode (id) {
    this.id = id;
}

objectNode.prototype.getValue = function (scope) {
    return scope.lookup(this.id).getValue(scope);
};

function numberNode (value) {
    this.value = value;
}

numberNode.prototype.getValue = function (scope) {
    return this.value;
};

function expressionNode (operator) {
    this.operator  = operator;
    this.left      = null;
    this.right     = null;
}

expressionNode.prototype.getValue = function (scope) {
    var left = this.left.getValue(scope);
    var right = this.right.getValue(scope);
    if (this.operator === '*') {
        return left * right;
    } else if (this.operator === '/') {
        if (right === 0) {
            throw "divided by zero";
        }
        return left / right;
    } else if (this.operator === '+') {
        return left + right;
    } else if (this.operator === '-') {
        return left - right;
    } else if (this.operator === '==') {
        return left === right;
    } else if (this.operator === '!=') {
        return left !== right;
    } else if (this.operator === '>') {
        return left > right;
    } else if (this.operator === '<') {
        return left < right;
    } else if (this.operator === '>=') {
        return left >= right;
    } else if (this.operator === '<=') {
        return left <= right;
    }
};

function lambdaNode (id, expre) {
    this.id = id;
    this.expre = expre;
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

function booleanNode (bool) {
    this.bool = bool;
}

booleanNode.prototype.getValue = function (scope) {
    return this.bool;
};

function literalNode (literal) {
    this.literal = literal;
}

literalNode.prototype.getValue = function (scope) {
    return this.literal;
};

function defineNode (id, expre, body) {
    this.id = id;
    this.expre = expre;
    this.body = body;
}

defineNode.prototype.getValue = function (scope) {
    scope.add(this.id, this.expre);
    if (this.body !== null) {
        return this.body.getValue(scope);
    } else {
        return null;
    }
};

function ifConditionNode (cond, expre1, expre2) {
    this.cond = cond;
    this.expre1 = expre1;
    this.expre2 = expre2;
}

ifConditionNode.prototype.getValue = function (scope) {
    if (this.cond.getValue(scope) === false) {
        return this.expre2.getValue(scope);
    } else {
        return this.expre1.getValue(scope);
    }
};

function consNode (expre1, expre2) {

}

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

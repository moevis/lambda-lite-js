/*! PROJECT_NAME - v0.1.0 - 2015-10-24
* http://icymorn.github.io/lambda-lite-js/
* Copyright (c) 2015 ICYMORN; Licensed MIT */
var ll = {
    'exports': {},
    'require': function(module) {
        return ll.exports[module];
    }
};

/**
 * Author: Icymorn
 * Github: https://github.com/icymorn/
 * the first module to be loaded.
 * load the other module by dependencies order.
 */
var define = (function(){
    var namespaces = {},
        pending = {},
        uid = 0;

    /**
     * load module
     * @param {string} ns name of the module.
     * @param {Array} dependsOn modules' name array than depends on.
     * @param {Function} func module content.
     * @returns {boolean} true if a module is successfully loaded.
     * @private
     * @example
     * _load('lexer',['core'], func);
     *
     */
    function _load(ns, dependsOn, func){
        if (namespaces[ns] !== undefined && namespaces[ns].load === true) {
            return true;
        }
        var loadNow = true;
        for (var i = 0, len = dependsOn.length; i < len; i++) {
            if (namespaces[dependsOn[i]] === undefined) {
                loadNow = false;
            } else {
                if (namespaces[dependsOn[i]].load === false) {
                    if (!_load(dependsOn[i], namespaces[dependsOn[i]].depends, namespaces[dependsOn[i]].func)) {
                        loadNow = false;
                    }
                }
            }
        }
        if (loadNow) {
            var n;
            ll.exports[ns] = {};
            func(ll.exports[ns]);
            namespaces[ns].load = true;
            delete pending[ns];
            for (n in pending) {
                _load(n, namespaces[n].depends, namespaces[n].func);
            }
            return true;
        } else {
            pending[ns] = true;
            return false;
        }
    }

    /**
     * generate unique id;
     * @returns {number}
     */
    function guid() {
        return uid++;
    }

    /**
     * @example
     * morn.define(itself_name, ['dependencies'], function(){}); //
     * morn.define(['dependencies'], function(){});  // anonymous function and has dependencies
     * morn.define(itself_name, function(){}); // no dependencies
     * morn.define(function(){});  // no dependencies and anonymous
     */
    return function() {
        if (arguments.length === 1) {
            arguments[0](morn);
        } else if (arguments.length === 2){
            var ns;
            if (typeof arguments[0] === 'string') {
                ns = arguments[0];
                namespaces[ns] = {
                    load: false,
                    depends: [],
                    func: arguments[1]
                };
                _load(ns, [], arguments[1]);
            } else {
                ns = guid();
                namespaces[ns] = {
                    load: false,
                    depends: arguments[0],
                    func: arguments[1]
                };
                _load(ns, arguments[0], arguments[1]);
            }
        } else if (arguments.length === 3){
            var ns = arguments[0];
            namespaces[ns] = {
                load: false,
                depends: arguments[1],
                func: arguments[2]
            };
            _load(ns, arguments[1], arguments[2]);
        }

    };
}());
if (typeof define === 'undefined') {
    var define = function (ns, deps, func) {
        func(exports);
    }
}

if (typeof require === 'undefined') {
    var require = ll.require;
}

define('./lex', ['./util', './token', './node'], function (exports) {

    var Util  = require('./util').Util;
    var Token = require('./token').Token;
    var Node  = require('./node').Node;

    var TOKEN = {
        EOF: 1,
        Identifier: 2,
        Keyword: 3,
        Numberic: 4,
        Punctuator: 5,
        Literal: 6,
        NullLiteral: 7,
        BooleanLiteral: 8,
        CommentLiteral: 9,
        White: 10,
        Unknown: 11
    };

    var binaryPrecedence = {
        '||'         : 10,
        '&&'         : 20,
        '|'          : 30,
        '^'          : 40,
        '&'          : 50,
        '=='         : 60,
        '!='         : 60,
        '==='        : 60,
        '!=='        : 60,
        '<'          : 70,
        '>'          : 70,
        '<='         : 70,
        '>='         : 70,
        '<<'         : 80,
        '>>'         : 80,
        '+'          : 90,
        '-'          : 90,
        '*'          : 110,
        '/'          : 110,
        '%'          : 110
    };

    var source;
    var length;
    var state = [];
    var index;
    var currToken = null;
    var lookahead = null;

    function getPrecedence (ch) {
        var prece = binaryPrecedence[ch];
        if (prece === undefined) {
            return -1;
        } else {
            return prece;
        }
    }

    function skipWhite () {
        while (index < length && Util.isWhite(source.charAt(index))) {
            index ++;
        }
    }

    function scanWhite () {
        var start = index ++;
        while (index < length) {
            if (! Util.isWhite(source.charAt(index))) {
                break;
            }
            index ++;
        }
        return source.slice(start, index);
    }

    function scanSingleLineComment () {
        var start = index ++;
        while (index < length) {
            if (source.charAt(index) === '\n') {
                index ++;
                break;
            }
            index ++;
        }
        return source.slice(start, index);
    }

    function scanMuiltiLineComment () {
        var start = index ++;
        while (index < length) {
            if (source.charAt(index) === '*') {
                index ++;
                if (index < length && source.charAt(index) === '/') {
                    index ++;
                    break;
                }
            }
            index ++;
        }
        return source.slice(start, index);
    }

    function scanLiteral () {
        var start = index;
        var ch = source.charAt(index++);
        var endSymbol = ch;
        while (index < length) {
            ch = source.charAt(index++);
            if (ch === endSymbol) {
                break;
            }
        }
        // when no matching quote found
        if (ch !== endSymbol) {
            throw "no matching for: " + endSymbol;
        }
        return source.slice(start + 1, index - 1);
    }

    function scanIdentifier () {
        var start = index++;
        var ch;
        while (index < length) {
            ch = source.charAt(index);
            if (Util.isIdentifierBody(ch)) {
                index ++;
            } else {
                break;
            }
        }
        return source.slice(start, index);
    }

    function scanNumberic () {
        var start = index++;
        var ch;
        var dot = false;
        while (index < length) {
            ch = source.charAt(index);
            if (Util.isDigit(ch)) {
                index ++;
            } else {
                if (dot === false && ch === '.') {
                    dot = true;
                    index ++;
                } else {
                    break;
                }
            }
        }
        return source.slice(start, index);
    }



    function scanPunctuator () {
        var fstCh = source.charAt(index);
        var start = index++;
        var ch;
        if (Util.isSinglePunctuator(fstCh)) {
            return fstCh;
        }
        if (fstCh === '+') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '+' || ch === '=') {
                    index ++;
                }
            }
        } else if (fstCh === '-') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '-' || ch === '>' || ch === '=') {
                    index ++;
                }
            }
        } else if (fstCh === '*') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '=') {
                    index ++;
                }
            }
        } else if (fstCh === '/') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '=' || ch === '*' || ch === '/') {
                    index ++;
                }
            }
        } else if (fstCh === '=') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '=') {
                    index ++;
                    if (index < length) {
                        ch = source.charAt(index);
                        if (ch === '=') {
                            index ++;
                        }
                    }
                }
            }
        } else if (fstCh === '>') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '=') {
                    index ++;
                } else if (ch === '>') {
                    index ++;
                    if (index < length) {
                        ch = source.charAt(index);
                        if (ch === '=') {
                            index ++;
                        }
                    }
                }
            }
        } else if (fstCh === '<') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '=') {
                    index ++;
                } else if (ch === '<') {
                    index ++;
                    if (index < length) {
                        ch = source.charAt(index);
                        if (ch === '=') {
                            index ++;
                        }
                    }
                }
            }
        } else if (fstCh === '!') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '=') {
                    index ++;
                    if (index < length) {
                        ch = source.charAt(index);
                        if (ch === '=') {
                            index ++;
                        }
                    }
                }
            }
        } else if (fstCh === '&') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '&') {
                    index ++;
                }
            }
        } else if (fstCh === '|') {
            if (index < length) {
                ch = source.charAt(index);
                if (ch === '|') {
                    index ++;
                }
            }
        }
        return source.slice(start, index);
    }

    function nextToken() {
        var token;
        currToken = lookahead;
        while (index < length) {
            var ch = source.charAt(index);
            if (Util.isWhite(ch)) {
                token = new Token(TOKEN.White, scanWhite());
            } else if (Util.isDigit(ch)) {
                token = new Token(TOKEN.Numberic, scanNumberic());
            } else if (Util.isIdentifierStart(ch)) {
                var value = scanIdentifier();
                if (Util.isKeyword(value)) {
                    token = new Token(TOKEN.Keyword, value);
                } else if (Util.isBooleanLiteral(value)) {
                    token = new Token(TOKEN.BooleanLiteral, value);
                } else if (Util.isNullLiteral(value)) {
                    token = new Token(TOKEN.NullLiteral, value);
                } else {
                    token = new Token(TOKEN.Identifier, value);
                }
            } else if (Util.isPunctuator(ch)) {
                var value = scanPunctuator();
                if (value === '//') {
                    token = new Token(TOKEN.CommentLiteral, value + scanSingleLineComment());
                } else if (value === '/*') {
                    token = new Token(TOKEN.CommentLiteral, value + scanMuiltiLineComment());
                } else {
                    token = new Token(TOKEN.Punctuator, value);
                }
            } else if (Util.isLiteralStart(ch)) {
                token = new Token(TOKEN.Literal, scanLiteral());
            }
            if (token.type !== TOKEN.EOF && token.type !== TOKEN.White) {

                lookahead = token;
                return token;
            }

        }

        if (currToken !== null && currToken.type !== TOKEN.EOF) {
            currToken = lookahead;
        }
        lookahead = new Token(TOKEN.EOF, null);
        return lookahead;
    }

    function match(value) {
        return lookahead.value === value;
    }

    function consumePunctuator (value) {
        if (currToken.value === value && currToken.type === TOKEN.Punctuator) {
            nextToken();
        } else {
            throw "expect for: " + value;
        }
    }

    function consumeKeyword (value) {
        if (currToken.value === value && currToken.type === TOKEN.Keyword) {
            nextToken();
        } else {
            throw "expect for: " + value;
        }
    }

    function expectKeyword (value) {
        if (lookahead.value === value && lookahead.type === TOKEN.Keyword) {
            nextToken();
            nextToken();
        } else {
            throw "expect for: " + value;
        }
    }

    function expectPunctuator(value) {
        if (lookahead.value === value && lookahead.type === TOKEN.Punctuator) {
            nextToken();
            nextToken();
        } else {
            throw "expect for:" + value;
        }
    }

    function genParenNode () {
        nextToken();
        var v = genCallNode();
        if (v === null) {
            return null;
        } else {
            if (currToken.value !== ')') {
                throw "expect for : )";
            }
            nextToken();
            return v;
        }
    }

    function genExpressionNode () {
        var left = genPrimaryNode();
        if (left === null) {
            return null;
        } else {

            return genTree(0, left);
        }
    }

    function genCallNode () {
        var obj = genExpressionNode();
        while (true) {
            if (currToken.type === TOKEN.Numberic || currToken.type === TOKEN.Identifier || currToken.type === TOKEN.Literal || currToken.type === TOKEN.BooleanLiteral) {
                obj = new Node.callNode(obj, genExpressionNode());
            } else if (currToken.type === TOKEN.Punctuator) {
                if (currToken.value === '(') {
                    obj = new Node.callNode(obj, genParenNode());
                } else if (currToken.value === '$') {
                    nextToken();
                    obj = new Node.callNode(obj, genCallNode());
                } else if (currToken.value === '.') {
                    nextToken();
                    var f = obj;
                    var g = genCallNode();
                    obj = new Node.lambdaNode('$1', new Node.callNode(f, new Node.callNode(g, new Node.objectNode('$1'))));
                } else if (currToken.value === ',') {
                    nextToken();
                    obj = new Node.consNode(obj, genExpressionNode());
                } else {
                    return obj;
                }
            } else {
                return obj;
            }
        }
    }

    function genTree (exprece, left) {
        // patch for calling function
        if (currToken.type === TOKEN.Punctuator & currToken.value === ';') {
            return left;
        }

        while (true) {
            var prece = getPrecedence(currToken.value);
            if (prece < exprece) {
                return left;
            } else {

                var currOp = currToken.value;
                nextToken();
                var right = genPrimaryNode();
                if (right === null) {
                    return null;
                }
                var nextPrece = getPrecedence(currToken.value);
                if (prece < nextPrece) {
                    right = genTree(prece + 1, right);
                    if (right === null) {
                        return null;
                    }
                }
                var node = new Node.expressionNode(currOp);
                node.left = left;
                node.right = right;
                left = node;
            }
        }
    }

    function genNumbericNode () {
        var node = new Node.numberNode(Number(currToken.value));
        nextToken();
        return node;
    }

    function genBooleanNode () {
        var node = new Node.booleanNode(currToken.value === 'true');
        nextToken();
        return node;
    }

    function genLiteralNode () {
        var node = new Node.literalNode(currToken.value);
        nextToken();
        return node;
    }

    function genLambdaNode () {
        nextToken();
        var id = currToken.value;
        expectPunctuator('->');
        var expre = genTopLevelNode();
        return new Node.lambdaNode(id, expre);
    }

    function genIdentifierNode () {
        var node = new Node.objectNode(currToken.value);
        nextToken();
        return node;
    }

    function genIfConditionNode () {
        nextToken();
        var cond = genTopLevelNode();
        consumeKeyword('then');
        var expre1 = genTopLevelNode();
        consumeKeyword('else');
        var expre2 = genTopLevelNode();
        var node = new Node.ifConditionNode(cond, expre1, expre2);
        return node;
    }

    function genDefineNode () {
        nextToken();
        var id = currToken.value;
        var node;
        var expre;
        if (match('=')) {
            expectPunctuator('=');
            expre = genTopLevelNode();
        } else {
            nextToken();
            var params = [];
            while (! match('=')) {
                expre = genIdentifierNode();
                params.push(expre);
            }
            // at least read one params
            expre = genIdentifierNode();
            params.push(expre);

            consumePunctuator('=');
            expre = genTopLevelNode();
            while (params.length > 0) {
                expre = new Node.lambdaNode(params.pop().id, expre);
            }
        }
        var value = expre;
        if (match('->')) {
            nextToken();
            var body = genTopLevelNode();
            node = new Node.defineNode(id, value, body);
        } else {
            nextToken();
            node = new Node.defineNode(id, value, null);
        }
        return node;
    }


    function genTopLevelNode () {
        if (currToken.type === TOKEN.Punctuator && currToken.value === '\\') {
            return genLambdaNode();
        } else if (currToken.type === TOKEN.Keyword && currToken.value === 'let') {
            return genDefineNode();
        } else if (currToken.type === TOKEN.Punctuator && currToken.value === ';') {
            return null;
        } else if (currToken.type === TOKEN.EOF) {
            return null;
        } else {
            return genCallNode();
        }
    }

    function genPrimaryNode () {
        if (currToken !== null) {
            if (currToken.type === TOKEN.Identifier) {
                return genIdentifierNode();
            } else if (currToken.type === TOKEN.Numberic) {
                return genNumbericNode();
            } else if (currToken.type === TOKEN.Literal) {
                return genLiteralNode();
            } else if (currToken.type === TOKEN.BooleanLiteral) {
                return genBooleanNode();
            } else if (currToken.type === TOKEN.Punctuator) {
                if (currToken.value === '(') {
                    return genParenNode();
                } else if (currToken.value === '"' || currToken.value === '\'') {
                    return genLiteralNode();
                }
            } else if (currToken.type === TOKEN.Keyword && currToken.value === 'if') {
                return genIfConditionNode();
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    exports.parse = function (code) {
        source = code;
        length = source.length;
        index  = 0;
        lookahead = null;
    };

    exports.genTree = function () {
        var ast = [];
        nextToken();
        nextToken();

        if (!currToken) {
            return ast;
        }
        var tick = 0;
        var max_tick = 1000;

        while (currToken.type !== TOKEN.EOF && tick++ < max_tick) {
            var node = genTopLevelNode();
            while (currToken.type === TOKEN.Punctuator && currToken.value === ';' ) {
                nextToken();
            }
            if (node) {
                ast.push(node);
            } else {
                break;
            }
        }
        return ast;
    }

});


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

    function callNode (callee, arg) {
        this.callee = callee;
        this.arg = arg;
    }

    callNode.prototype.getValue = function (scope) {
        var expre = this.callee.getValue(scope);
        var arg = this.arg.getValue(scope);
        return expre(packNode(arg));
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
        } else if (this.operator === '||') {
            return left || right;
        } else if (this.operator === '&&') {
            return left && right;
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

    function consNode (expre1, expre2) {
        this.expre1 = expre1;
        this.expre2 = expre2;
    }

    consNode.prototype.getValue = function (scope) {
        if (this.expre2 === null) {
            return this.expre1.getValue(scope);
        } else {
            this.expre1.getValue(scope);
            return this.expre2.getValue(scope);
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

});

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


    exports.Scope = Scope;
    exports.Root  = root;
});
if (typeof define === 'undefined') {
    var define = function (ns, deps, func) {
        func(exports);
    }
}

if (typeof require === 'undefined') {
    var require = ll.require;
}


define('./token', [], function (exports) {
    function Token(type, value) {
        this.type = type;
        this.value = value;
    }
    exports.Token = Token;
});
if (typeof define === 'undefined') {
    define = function (ns, deps, func) {
        func(exports);
    }
}

if (typeof require === 'undefined') {
    require = ll.require;
}


define('./util', [], function (exports) {
    var Util = {};

    var hexDigit = '0123456789abcdefABCDEF';

    var keywords = ['if', 'then', 'else', 'let'];

    var punctuatorStart = '+-*/!=|&^~%';
    var singlePunctuator = '[]{}(),:\\;$.';

    Util.isDigit = function (ch) {
        return '0' <= ch && '9' >= ch;
    };

    Util.isHexDigit  = function (ch) {
        return hexDigit.indexOf(ch) > -1;
    };

    Util.isOctalDigit = function (ch) {
        return '0' <= ch && '7' >= 'ch';
    };

    Util.isWhite = function (ch) {
        return ch === ' ' || ch === '\t' || ch === '\n';
    };

    Util.isAlpha = function (ch) {
        return 'a' <= ch && 'z' >= ch || 'A' <= ch && 'Z' >= ch;
    };

    Util.isPunctuator = function (ch) {
        return punctuatorStart.indexOf(ch) > -1 || singlePunctuator.indexOf(ch) > -1;
    };

    Util.isSinglePunctuator = function (ch) {
        return singlePunctuator.indexOf(ch) > -1;
    };

    Util.isLiteralStart = function (ch) {
        return ch === '\'' || ch === '"';
    };

    Util.isBooleanLiteral = function (value) {
        return value === 'true' || value === 'false';
    };

    Util.isNullLiteral = function (value) {
        return value === 'null';
    }

    Util.isPunctuatorStart = function (ch) {
        return punctuatorStart.index(ch) > -1;
    };

    Util.isIdentifierStart = function (ch) {
        return this.isAlpha(ch) || '_' === ch;
    };

    Util.isIdentifierBody = function (ch) {
        return this.isIdentifierStart(ch) || this.isDigit(ch);
    };

    Util.isKeyword = function (id) {
        return keywords.indexOf(id) > -1;
    };

    exports.Util = Util;
});
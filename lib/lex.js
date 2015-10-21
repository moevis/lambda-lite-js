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
            if (currToken.type === TOKEN.Numberic || currToken.type === TOKEN.Identifier || currToken.type === TOKEN.Literal) {
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
                } else {
                    return obj;
                }
            } else {
                return obj;
            }
        }
    }

    function genTree (exprece, left) {
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
            while (true) {
                expre = genIdentifierNode();
                params.push(expre);
                if (match('=')) {
                    expre = genIdentifierNode();
                    params.push(expre);
                    break;
                }
            }
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
            if (node) {
                ast.push(node);
            } else {
                break;
            }
        }
        return ast;
    }

});


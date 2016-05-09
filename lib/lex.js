if (typeof define === 'undefined') {
    var define = function (ns, deps, func) {
        func(exports);
    }
}

if (typeof require === 'undefined') {
    var require = ll.require;
}

define('./lex', ['./util', './token', './node', './pattern'], function (exports) {

    var Util     = require('./util').Util;
    var Token    = require('./token').Token;
    var Node     = require('./node').Node;
    var Pattern  = require('./pattern').Pattern;

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
        List: 10,
        White: 11,
        Unknown: 12
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
        '%'          : 110,
        '++'         : 110,
        '!!'         : 110,
        ':'          : 110
    };

    var source;
    var segment;
    var length;
    var index;
    var currToken = null;
    var lookahead = null;
    var currentIndex = 0;

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
                } else if (ch === '!'){
                    index ++;
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
        currentIndex = index;
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
        var v = genTopLevelNode();
        //var v = genCallNode();
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

    function genList() {
        //consumePunctuator('[');
        nextToken();
        var elements = [];
        while (currToken.type !== TOKEN.EOF) {
            if (currToken.type === TOKEN.Numberic){
                elements.push(Number(currToken.value));
            } else if (currToken.type === TOKEN.Literal || currToken.type === TOKEN.BooleanLiteral) {
                elements.push(currToken.value);
            }
            if (match(']')) {
                expectPunctuator(']');
                break;
            } else {
                expectPunctuator(',');
            }
        }
        return new Node.listNode(elements, new Node.SourceCode(source, segment, currentIndex));
    }

    function genCallNode () {
        var obj = genExpressionNode();
        while (true) {
            if (currToken.type === TOKEN.Numberic || currToken.type === TOKEN.Identifier || currToken.type === TOKEN.Literal || currToken.type === TOKEN.BooleanLiteral) {
                obj = new Node.callNode(obj, genExpressionNode(), new Node.SourceCode(source, segment, currentIndex));
            } else if (currToken.type === TOKEN.Punctuator) {
                if (currToken.value === '(') {
                    obj = new Node.callNode(obj, genParenNode(), new Node.SourceCode(source, segment, currentIndex));
                } else if (currToken.value === '$') {
                    nextToken();
                    obj = new Node.callNode(obj, genCallNode(), new Node.SourceCode(source, segment, currentIndex));
                } else if (currToken.value === '.') {
                    nextToken();
                    var f = obj;
                    var g = genCallNode();
                    obj = new Node.lambdaNode(
                        '$1',
                        new Node.callNode(
                            f,
                            new Node.callNode(
                                g,
                                new Node.objectNode(
                                    '$1',
                                    new Node.SourceCode(source, segment, currentIndex)
                                ),
                                new Node.SourceCode(source, segment, currentIndex)
                            )
                        ), new Node.SourceCode(source, segment, currentIndex));
                } else if (currToken.value === ',') {
                    nextToken();
                    obj = new Node.consNode(obj, genExpressionNode(), new Node.SourceCode(source, segment, currentIndex));
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
                var node = new Node.expressionNode(currOp, new Node.SourceCode(source, segment, currentIndex));
                node.left = left;
                node.right = right;
                left = node;
            }
        }
    }

    function genNumbericNode () {
        var node = new Node.numberNode(Number(currToken.value), new Node.SourceCode(source, segment, currentIndex));
        nextToken();
        return node;
    }

    function genBooleanNode () {
        var node = new Node.booleanNode(currToken.value === 'true', new Node.SourceCode(source, segment, currentIndex));
        nextToken();
        return node;
    }

    function genLiteralNode () {
        var node = new Node.literalNode(currToken.value, new Node.SourceCode(source, segment, currentIndex));
        nextToken();
        return node;
    }

    function genLambdaNode () {
        nextToken();
        var id = currToken.value;
        expectPunctuator('->');
        var expre = genTopLevelNode();
        return new Node.lambdaNode(id, expre, new Node.SourceCode(source, segment, currentIndex));
    }

    function genIdentifierNode () {
        var node = new Node.objectNode(currToken.value, new Node.SourceCode(source, segment, currentIndex));
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
        return new Node.ifConditionNode(cond, expre1, expre2, new Node.SourceCode(source, segment, currentIndex));
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
            if (match('@')) {
                expre = genPatternNode();
                //node.id = id;
                //return node;
            } else {
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
                    expre = new Node.lambdaNode(params.pop().id, expre, new Node.SourceCode(source, segment, currentIndex));
                }
            }

        }
        var value = expre;
        if (currToken.type == TOKEN.Punctuator && currToken.value == '->') {
            nextToken();
            var body = genTopLevelNode();
            node = new Node.defineNode(id, value, body, new Node.SourceCode(source, segment, currentIndex));
        } else {
            //nextToken();
            node = new Node.defineNode(id, value, null, new Node.SourceCode(source, segment, currentIndex));
        }
        return node;

    }

    function genPatternNode () {
        var params = [];
        var patterns = [];
        while (currToken.type !== TOKEN.Punctuator && currToken.value !== '=') {
            var id = genIdentifierNode().id;
            var pattern;
            consumePunctuator('@');
            if (currToken.type === TOKEN.Keyword) {
                if (currToken.value === 'Boolean') {
                    pattern = new Pattern.unit(Boolean);
                } else if (currToken.value === 'Number') {
                    pattern = new Pattern.unit(Number);
                } else if (currToken.value === 'String') {
                    pattern = new Pattern.unit(String);
                }
            } else if (currToken.type === TOKEN.Numberic) {
                pattern = new Pattern.unit(Number(currToken.value));
            } else if (currToken.type === TOKEN.BooleanLiteral) {
                pattern = new Pattern.unit(currToken.value === 'true');
            } else if (currToken.type === TOKEN.Literal) {
                pattern = new Pattern.unit(currToken.value);
            } else if (currToken.type === TOKEN.Punctuator && currToken.value === '*') {
                pattern = new Pattern.any();
            }
            params.push(id);
            patterns.push(pattern);
            nextToken();
        }
        consumePunctuator('=');

        var expre = genTopLevelNode();
        expre = new Node.patternNode(params.concat(), patterns, expre, new Node.SourceCode(source, segment, currentIndex));

        while (params.length > 0) {
            expre = new Node.lambdaNode(params.pop(), expre, new Node.SourceCode(source, segment, currentIndex));
        }

        return expre;
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
                } else if (currToken.value === '[') {
                    return genList();
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
        var tmp = code.split('\n');
        segment = [0];
        var base = 0;
        for (var i = 0, len = tmp.length; i < len; ++i ) {
            base += tmp[i].length + 1;
            segment.push(base);
        }
        length = source.length;
        currentIndex = 0;
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


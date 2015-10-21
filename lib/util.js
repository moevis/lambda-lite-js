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
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
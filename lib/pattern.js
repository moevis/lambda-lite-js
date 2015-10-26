if (typeof define === 'undefined') {
    var define = function (ns, deps, func) {
        func(exports);
    }
}

if (typeof require === 'undefined') {
    var require = ll.require;
}

define('./pattern', [], function (exports) {
    var Pattern = {};

    Pattern.unit = function unit(id) {
        var type;
        var value;
        if (id === null) {
            this.type = null;
            this.value = null;
        } else if (typeof id === 'function') {
            this.type = id;
            this.value = null;
        } else {
            this.type = id.constructor;
            this.type = id;
        }
    };

    Pattern.any = function any() {
    };

    Pattern.any.prototype.expect = function (arg) {
        return true;
    };

    Pattern.unit.prototype.expect = function (arg) {
        if (arg === null) {
            return this.value === null;
        } else {
            if (this.value === null) {
                return arg.constructor === this.type;
            } else {
                return this.value === arg && this.type === arg.constructor;
            }
        }
    };

    exports.Pattern = Pattern;
});
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
        } else if (id === undefined) {
            return new Pattern.any();
        } else {
            this.type = id.constructor;
            this.value = id;
        }
        if (id instanceof Array) {
            var array = [];
            id.forEach(function (ele) {
                array.push(new unit(ele));
            });
            this.array = array;
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
                if (this.array !== undefined) {
                    if (this.array.length === 0 && arg.length === 0) {
                        return true;
                    } else {
                        if (this.array.length > arg.length) {
                            return false;
                        } else {
                            for (var i = 0, length = this.array.length; i < length; i ++) {
                                if (this.array[i].expect(arg[i]) === false) {
                                    return false;
                                }
                            }
                            return true;
                        }
                    }
                } else {
                    return this.value === arg && this.type === arg.constructor;
                }
            }
        }
    };

    Pattern.PatternMatching = function PatternMatching(options) {
        var opts = [];
        options.forEach(function (rule) {
            var args = [];
            for (var i = 0, length = rule.length - 1; i < length; i ++) {
                args.push(new Pattern.unit(rule[i]));
            }
            args.push(rule[rule.length - 1]);
            //if (args.length > 1) {
            opts.push(args);
            //}
        });
        //console.log(opts);
        return function () {
            var result;
            var args = arguments;
            opts.some(function (rule) {
                var flag = true;
                for (var i = 0, length = rule.length - 1; i < length; i ++) {
                    //rule.log(opt[i]);
                    if (rule[i].expect(args[i]) === false) {
                        flag = false;
                    }
                }
                if (flag === true) {
                    var func = rule[length];
                    result = func.apply(null, args);
                }
                return flag;
            });
            return result;
        }
    };

    exports.Pattern = Pattern;
});
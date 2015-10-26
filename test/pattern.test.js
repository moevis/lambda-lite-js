var pattern = require('../lib/pattern.js').Pattern;

var PatternMatching = function (options) {
    var opts = [];
    options.forEach(function (rule) {
        var args = [];
        for (var i = 0, length = rule.length - 1; i < length; i ++) {
            args.push(new pattern.unit(rule[i]));
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
        opts.forEach(function (rule) {
            var flag = true;
            for (var i = 0, length = rule.length - 1; i < length; i ++) {
                //rule.log(opt[i]);
                if (!rule[i].expect(args[i])) {
                    flag = false;
                }
            }
            if (flag) {
                var func = rule[length];
                result = func.apply(null, args);
            }
        });
        return result;
    }
};

var test = PatternMatching([
    [Number, function (n) {
        console.log(n);
        return 'number';
    }],
    [String, function (s) {
        console.log(s);
        return 'string';
    }]
]);


console.log(test(1));
console.log(test('1'));
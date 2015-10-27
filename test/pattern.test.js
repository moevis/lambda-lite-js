var Pattern = require('../lib/pattern.js').Pattern;

var PatternMatching = Pattern.PatternMatching;

var test = PatternMatching([
    [Number, function (n) {
        return 'number';
    }],
    [String, function (s) {
        return 'string';
    }],
    ['$', function (S) {
        return '$';
    }],
    [[[1]], function (x) {
        return 'any';
    }]
]);


//console.log(test(1));
console.log(test([[]]));
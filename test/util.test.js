util = require('../lib/util.js').Util;

log = console.log;

log('0 is digit', util.isDigit('0'));
log('9 is digit', util.isDigit('9'));
log('a is digit', util.isDigit('a'));

log('a is hex digit', util.isHexDigit('a'));
log('z is hex digit', util.isHexDigit('z'));

log('a is Alpha', util.isAlpha('a'));
log('1 is Alpha', util.isAlpha('1'));

log('1 is indentity start', util.isIdentifierStart('1'));
log('a is indentity start', util.isIdentifierStart('a'));

log('1 is indentity body', util.isIdentifierBody('1'));

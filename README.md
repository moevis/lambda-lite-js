# Lambda-Lite-js
a tiny FUNCITONAL LANGUAGE implemented by javascript.

## Support

* Lambda function (sugar for multi-parameters)
* currying, lazy evaluation, recursive in anonymous function (z combinator)
* Basic pattern matching
* Point-free style: compose function together with `.`
* Basic type system: bool, number, list, function and string.

## Tutorial

### Lambda function

Using backsplash and arrow to declear an anyoumous function. Lambda function only accept one parameter, but you can use some magic method to break this limit.

```haskell
\n -> n + 1;
\n -> n * n;
\n -> n + n * n;
```

Creating function which accepts two parameters.

```haskell
(\n -> \m -> m + n) 1 2 --- output: 3
```

Now, declear a function with single-param or multi-params can be write as below:

```haskell
let add x y = x + y
let result = add 1 2
```

### Pattern matching

Pattern matching is not completed now. Currently support one parameter matching.

Sample code is belows, it outputs 4;

```haskell
let func a@1 = a + 1;
let func a@2 = a + 2;
print (func 2);
```

### Various declaration

The keyword `let` leads an assignment.

```haskell
let x = 5;
let y = \n -> n + 1;
```

### Binary condition

The binary condition is in form of `if ... then ... else ...`.

```haskell
print (if true then 1 else 0)
```

### Native function

now some native functions are accessiable. As well as the basic calculation operators: `+-*/`.

```haskell
print "hello";
print (length [1,2,3,4]);
print (reverse [1,2,3,4]);
print (not true);
```

### Recursive calling

Recursive programming is an elegant programming style.

```haskell

let fact = \n ->
    if n == 1 then 1
    else n * (fact n - 1);
print (fact 5);
```

Lambda function can recursive by using z-combinator instead of calling itself.

```haskell
let z = \f->(\x -> f (\y -> x x y)) (\x -> f (\y -> x x y));
let makeFact = \g -> \n -> if n < 2
    then 1
    else n * (g n - 1);
let fact = z makeFact;
print (fact 5);
```

### Point-free programming

Use `.` and `$` to pretifier your code, less `brackets` now !!!

Beblow is a sample for calculating (10 + 10) ^ 2

```haskell
let double = \n -> n + n;
let square = \n -> n * n;
print $ double $ square 10;
let func = double . square;
print $ func 10;
```

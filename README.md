# Lambda-Lite-js
a tiny FUNCITONAL LANGUAGE implemented by javascript.

## Support

* lambda function
* various declaration
* function calling

## Tutorial

### lambda function

Using back splash and arrow to declear an anyoumous function. Lambda function only accept one parameter, but you can use some magic method to break this limit.

```haskell
\n -> n + 1;
\n -> n * n;
\n -> n + n * n;
```

Creating function which accepts two parameters.

```haskell
(\n -> \m -> m + n) 1 2 --- output: 3
```
### various declaration

The keyword `let` leads an assignment.

```haskell
let x = 5;
let y = \n -> n + 1;
```

### native function

now some native functions are accessiable. As well as the basic calculation operators: `+-*/`.

```haskell
print "hello";
```

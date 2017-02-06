# disallow `else` blocks with no effect (no-useless-else)

(fixable) The `--fix` option on the [command line](../user-guide/command-line-interface#fix) automatically fixes problems reported by this rule.

If an `if` block contains a control flow statement such as `return`, the `else` block becomes unnecessary. Its contents can be placed outside of the block.

```js
function foo() {
    if (x) {
        return y;
    } else {
        return z;
    }
}
```

## Rule Details

This rule is aimed at highlighting an unnecessary block of code following an `if` containing a control flow statement. As such, it will warn when it encounters an `else` following a chain of `if`s, all of them containing a `return`, `throw`, `break`, or `continue` statement.

Examples of **incorrect** code for this rule:

```js
/*eslint no-useless-else: "error"*/

function foo() {
    if (x) {
        return y;
    } else {
        return z;
    }
}

function foo() {
    if (x) {
        return y;
    } else if (z) {
        return w;
    } else {
        return t;
    }
}

function foo() {
    if (x) {
        return y;
    } else {
        var t = "foo";
    }

    return t;
}

// Two warnings for nested occurrences
function foo() {
    if (x) {
        if (y) {
            return y;
        } else {
            return x;
        }
    } else {
        return z;
    }
}

function foo() {
    if (x) {
        throw new Error();
    } else {
        return z;
    }
}

for (let foo = 1; foo < 10; foo++) {
    if (foo % 3) {
        continue;
    } else {
        console.log('Fizz');
    }
}
```

Examples of **correct** code for this rule:

```js
/*eslint no-useless-else: "error"*/

function foo() {
    if (x) {
        return y;
    }

    return z;
}

function foo() {
    if (x) {
        return y;
    } else if (z) {
        var t = "foo";
    } else {
        return w;
    }
}

function foo() {
    if (x) {
        if (z) {
            return y;
        }
    } else {
        return z;
    }
}

function foo() {
    if (x) {
        throw new Error();
    }
    return z;
}

for (let foo = 1; foo < 10; foo++) {
    if (foo % 3) {
        continue;
    }
    console.log('Fizz');
}
```

/**
 * @fileoverview disallow `else` blocks with no effect
 * @author Teddy Katz
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-useless-else");
const RuleTester = require("../../../lib/testers/rule-tester");

const ERROR = { message: "Using 'else' is unnecessary here.", type: "Keyword" };

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({ parserOptions: { ecmaFeatures: { globalReturn: true } } });

ruleTester.run("no-useless-else", rule, {
    valid: [
        "function foo() { if (true) { if (false) { return x; } } else { return y; } }",
        "function foo() { if (true) { return x; } return y; }",
        "function foo() { if (true) { for (;foo;) { return x; } } else { return y; } }",
        "function foo() { if (true) notAReturn(); else return y; }",
        "function foo() { if (x) { notAReturn(); } else if (y) { return true; } else { notAReturn(); } }",
        "if (0) { if (0) {} else {} } else {}"
    ],
    invalid: [
        {
            code: "function foo1() { if (true) { return x; } else { return y; } }",
            output: "function foo1() { if (true) { return x; }  return y;  }",
            errors: [ERROR]
        },
        {
            code: "function foo2() { if (true) { var x = bar; return x; } else { var y = baz; return y; } }",
            output: "function foo2() { if (true) { var x = bar; return x; }  var y = baz; return y;  }",
            errors: [ERROR]
        },
        {
            code: "function foo3() { if (true) return x; else return y; }",
            output: "function foo3() { if (true) return x; return y; }",
            errors: [ERROR]
        },
        {
            code: "function foo4() { if (true) { if (false) return x; else return y; } else { return z; } }",
            output: "function foo4() { if (true) { if (false) return x; return y; }  return z;  }",
            errors: [ERROR, ERROR]
        },
        {
            code: "function foo5() { if (true) { if (false) { if (true) return x; else { w = y; } } else { w = x; } } else { return z; } }",
            output: "function foo5() { if (true) { if (false) { if (true) return x;  w = y;  } else { w = x; } } else { return z; } }",
            errors: [ERROR]
        },
        {
            code: "function foo6() { if (true) { if (false) { if (true) return x; else return y; } } else { return z; } }",
            output: "function foo6() { if (true) { if (false) { if (true) return x; return y; } } else { return z; } }",
            errors: [ERROR]
        },
        {
            code: "function foo7() { if (true) { if (false) { if (true) return x; else return y; } return w; } else { return z; } }",
            output: "function foo7() { if (true) { if (false) { if (true) return x; return y; } return w; }  return z;  }",
            errors: [
                ERROR,
                ERROR
            ]
        },
        {
            code: "function foo8() { if (true) { if (false) { if (true) return x; else return y; } else { w = x; } } else { return z; } }",
            output: "function foo8() { if (true) { if (false) { if (true) return x; return y; }  w = x;  } else { return z; } }",
            errors: [
                ERROR,
                ERROR
            ]
        },
        {
            code: "function foo9() {if (x) { return true; } else if (y) { return true; } else { notAReturn(); } }",
            output: "function foo9() {if (x) { return true; } else if (y) { return true; }  notAReturn();  }",
            errors: [ERROR, ERROR]
        },
        {
            code: "function foo10() { if (foo) return bar; else (foo).bar(); }",
            output: "function foo10() { if (foo) return bar; (foo).bar(); }",
            errors: [ERROR]
        },
        {
            code: "function foo11() { if (foo) return bar \nelse { [1, 2, 3].map(foo) } }",
            output: "function foo11() { if (foo) return bar \nelse { [1, 2, 3].map(foo) } }",
            errors: [ERROR]
        },
        {
            code: "function foo12() { if (foo) return bar \nelse { baz() } \n[1, 2, 3].map(foo) }",
            output: "function foo12() { if (foo) return bar \nelse { baz() } \n[1, 2, 3].map(foo) }",
            errors: [ERROR]
        },
        {
            code: "function foo13() { if (foo) return bar; \nelse { [1, 2, 3].map(foo) } }",
            output: "function foo13() { if (foo) return bar; \n [1, 2, 3].map(foo)  }",
            errors: [ERROR]
        },
        {
            code: "function foo14() { if (foo) return bar \nelse { baz(); } \n[1, 2, 3].map(foo) }",
            output: "function foo14() { if (foo) return bar \n baz();  \n[1, 2, 3].map(foo) }",
            errors: [ERROR]
        },
        {
            code: "function foo15() { if (foo) return bar; else { baz() } qaz() }",
            output: "function foo15() { if (foo) return bar; else { baz() } qaz() }",
            errors: [ERROR]
        },
        {
            code: "function foo16() { if (foo) return bar \nelse { baz() } qaz() }",
            output: "function foo16() { if (foo) return bar \nelse { baz() } qaz() }",
            errors: [ERROR]
        },
        {
            code: "function foo17() { if (foo) return bar \nelse { baz() } \nqaz() }",
            output: "function foo17() { if (foo) return bar \n baz()  \nqaz() }",
            errors: [ERROR]
        },
        {
            code: "function foo18() { if (foo) return function() {} \nelse [1, 2, 3].map(bar) }",
            output: "function foo18() { if (foo) return function() {} \nelse [1, 2, 3].map(bar) }",
            errors: [ERROR]
        },
        {
            code: "while (true) { if (foo) continue; else bar() }",
            output: "while (true) { if (foo) continue; bar() }",
            errors: [ERROR]
        },
        {
            code: "while (true) { if (foo) break; else bar() }",
            output: "while (true) { if (foo) break; bar() }",
            errors: [ERROR]
        },
        {
            code: `
                function foo() {
                    while (true) {
                        if (bar) break;
                        else if (baz) continue;
                        else if (qux) throw new Baseball();
                        else if (boop) return 5;
                        else beep();
                    }
                }
            `,
            output: `
                function foo() {
                    while (true) {
                        if (bar) break;
                        else if (baz) continue;
                        else if (qux) throw new Baseball();
                        else if (boop) return 5;
                        beep();
                    }
                }
            `,
            errors: [ERROR, ERROR, ERROR, ERROR]
        },
        {
            code: "function foop() { if (x) { return x; } else if (y) { return false; } }",
            output: "function foop() { if (x) { return x; } if (y) { return false; } }",
            errors: [ERROR]
        },
        {
            code: "if (x) { return true; } else if (y) notAReturn(); else notAReturn();",
            output: "if (x) { return true; } if (y) notAReturn(); else notAReturn();",
            errors: [ERROR]
        },
        {
            code: "if (xp) return true; else if (y) notAReturn(); else notAReturn();",
            output: "if (xp) return true; if (y) notAReturn(); else notAReturn();",
            errors: [ERROR]
        },
        {
            code: "if (foo) { for(;;) return; } else bar();",
            output: "if (foo) { for(;;) return; } bar();",
            errors: [ERROR]
        }
    ]
});

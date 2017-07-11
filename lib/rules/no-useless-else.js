/**
 * @fileoverview disallow `else` blocks with no effect
 * @author Teddy Katz
 */
"use strict";

module.exports = {
    meta: {
        docs: {
            description: "disallow `else` blocks with no effect",
            category: "Best Practices",
            recommended: false
        },
        fixable: "code",  // or "code" or "whitespace"
        schema: []
    },

    create(context) {

        //--------------------------------------------------------------------------
        // Helpers
        //--------------------------------------------------------------------------

        /**
         * Display the context report if rule is violated
         *
         * @param {Node} node The IfStatement.alternate node
         * @returns {void}
         */
        function displayReport(node) {
            const sourceCode = context.getSourceCode();
            const startToken = sourceCode.getFirstToken(node);
            const elseToken = sourceCode.getTokenBefore(startToken);

            context.report({
                node: elseToken,
                message: "Using 'else' is unnecessary here.",
                fix: fixer => {
                    const source = sourceCode.getText(node);
                    const lastIfToken = sourceCode.getTokenBefore(elseToken);
                    let fixedSource, firstTokenOfElseBlock;

                    if (startToken.type === "Punctuator" && startToken.value === "{") {
                        firstTokenOfElseBlock = sourceCode.getTokenAfter(startToken);
                    } else {
                        firstTokenOfElseBlock = startToken;
                    }

                    // If the if block does not have curly braces and does not end in a semicolon
                    // and the else block starts with (, [, /, +, ` or -, then it is not
                    // safe to remove the else keyword, because ASI will not add a semicolon
                    // after the if block
                    const ifBlockMaybeUnsafe = node.parent.consequent.type !== "BlockStatement" && lastIfToken.value !== ";";
                    const elseBlockUnsafe = /^[([/+`-]/.test(firstTokenOfElseBlock.value);

                    if (ifBlockMaybeUnsafe && elseBlockUnsafe) {
                        return null;
                    }

                    const endToken = sourceCode.getLastToken(node);
                    const lastTokenOfElseBlock = sourceCode.getTokenBefore(endToken);

                    if (lastTokenOfElseBlock.value !== ";") {
                        const nextToken = sourceCode.getTokenAfter(endToken);

                        const nextTokenUnsafe = nextToken && /^[([/+`-]/.test(nextToken.value);
                        const nextTokenOnSameLine = nextToken && nextToken.loc.start.line === lastTokenOfElseBlock.loc.start.line;

                        // If the else block contents does not end in a semicolon,
                        // and the else block starts with (, [, /, +, ` or -, then it is not
                        // safe to remove the else block, because ASI will not add a semicolon
                        // after the remaining else block contents
                        if (nextTokenUnsafe || (nextTokenOnSameLine && nextToken.value !== "}")) {
                            return null;
                        }
                    }

                    if (startToken.type === "Punctuator" && startToken.value === "{") {
                        fixedSource = source.slice(1, -1);
                    } else {
                        fixedSource = source;
                    }
                    return fixer.replaceTextRange([elseToken.start, node.end], fixedSource);
                }
            });
        }

        //--------------------------------------------------------------------------
        // Public API
        //--------------------------------------------------------------------------

        const consequentsWithSegments = new Set();
        const codePathStack = [];

        return {
            onCodePathStart(codePath) {
                codePathStack.unshift(codePath);
            },
            onCodePathEnd() {
                codePathStack.shift();
            },
            onCodePathSegmentStart(segment, node) {
                if (node.parent && node.parent.type === "IfStatement" && node === node.parent.consequent && node.parent.alternate) {
                    consequentsWithSegments.add(node);
                }
            },
            onCodePathSegmentEnd(segment, node) {
                if (node.parent && node.parent.type === "IfStatement" && node === node.parent.consequent && node.parent.alternate) {
                    consequentsWithSegments.delete(node);
                }
            },
            "Program:exit"() {
                for (const node of consequentsWithSegments) {
                    displayReport(node.parent.alternate);
                }
            }
        };
    }
};

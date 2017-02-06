/**
 * @fileoverview disallow `else` blocks with no effect
 * @author Teddy Katz
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const CONTROL_FLOW_TYPES = new Set(["ReturnStatement", "ThrowStatement", "BreakStatement", "ContinueStatement"]);

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

        /**
         * Check to see if the node is a control flow statement
         *
         * @param {Node} node The node being evaluated
         * @returns {boolean} True if node is a `return`, `throw`, `break`, or `continue` statement.
         */
        function checkForControlJump(node) {
            return CONTROL_FLOW_TYPES.has(node.type);
        }

        /**
         * Naive control-flow jump checking, does not iterate through the whole
         * BlockStatement because we make the assumption that the control flow statement
         * will be the last node in the body of the BlockStatement.
         *
         * @param {Node} node The consequent/alternate node
         * @returns {boolean} True if it has a return/throw/break/continue
         */
        function naiveHasControlJump(node) {
            if (node.type === "BlockStatement") {
                const body = node.body,
                    lastChildNode = body[body.length - 1];

                return lastChildNode && checkForControlJump(lastChildNode);
            }
            return checkForControlJump(node);
        }

        /**
         * Check to see if the node is valid for evaluation,
         * meaning it has an else and not an else-if
         *
         * @param {Node} node The node being evaluated
         * @returns {boolean} True if the node is valid
         */
        function hasElse(node) {
            return node.alternate && node.consequent && node.alternate.type !== "IfStatement";
        }

        /**
         * If the consequent is an IfStatement, check to see if it has an else
         * and both its consequent and alternate path have a control flow jump, meaning this is
         * a nested case of rule violation.  If-Else not considered currently.
         *
         * @param {Node} node The consequent node
         * @returns {boolean} True if this is a nested rule violation
         */
        function checkForIf(node) {
            return node.type === "IfStatement" && hasElse(node) &&
                naiveHasControlJump(node.alternate) && naiveHasControlJump(node.consequent);
        }

        /**
         * Check the consequent/body node to make sure it is not
         * a ReturnStatement or an IfStatement that has a control flow statement on both
         * code paths.
         *
         * @param {Node} node The consequent or body node
         * @param {Node} alternate The alternate node
         * @returns {boolean} `true` if it is a Return/If node that always has a control flow jump.
         */
        function checkForControlJumpOrIf(node) {
            return checkForControlJump(node) || checkForIf(node);
        }


        /**
         * Check whether a node has a control path jump in every codepath.
         * @param {Node} node The node to be checked
         * @returns {boolean} `true` if it returns on every codepath.
         */
        function alwaysHasControlFlow(node) {
            if (node.type === "BlockStatement") {

                // If we have a BlockStatement, check each consequent body node.
                return node.body.some(checkForControlJumpOrIf);
            }

            /*
             * If not a block statement, make sure the consequent isn't a
             * control flow statement or an IfStatement with control flow jumps on both paths.
             */
            return checkForControlJumpOrIf(node);
        }

        //--------------------------------------------------------------------------
        // Public API
        //--------------------------------------------------------------------------

        return {
            "IfStatement:exit"(node) {
                const parent = context.getAncestors().pop();
                let consequents,
                    alternate;

                // Only "top-level" if statements are checked, meaning the first `if`
                // in a `if-else-if-...` chain.
                if (parent.type === "IfStatement" && parent.alternate === node) {
                    return;
                }

                for (consequents = []; node.type === "IfStatement"; node = node.alternate) {
                    if (!node.alternate) {
                        return;
                    }
                    consequents.push(node.consequent);
                    alternate = node.alternate;
                }

                if (consequents.every(alwaysHasControlFlow)) {
                    displayReport(alternate);
                }
            }
        };
    }
};

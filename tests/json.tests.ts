import * as assert from "assert";
import * as qub from "qub";

import * as json from "../sources/json";

function parseQubLexes(text: string, startIndex: number = 0): qub.Iterable<qub.Lex> {
    return new qub.Lexer(text, startIndex).toArrayList();
}

suite("json", () => {
    function parseJsonTokens(text: string, startIndex: number = 0, issues: qub.List<qub.Issue>): qub.Iterable<json.Token> {
        return new json.Tokenizer(text, startIndex, issues).toArrayList();
    }

    function parseJsonToken(text: string, startIndex: number, expectedTokenType: json.TokenType, issues: qub.List<qub.Issue>): json.Token {
        const tokenizer = new json.Tokenizer(text, startIndex, issues);
        assert.deepStrictEqual(tokenizer.next(), true, "Wrong next() result");
        assert.deepStrictEqual(tokenizer.getCurrent().getType(), expectedTokenType, "Wrong type");
        return tokenizer.getCurrent();
    }

    /**
     * Parse a QuotedString json.Token from the provided text.
     */
    function parseQuotedString(text: string, startIndex: number = 0, issues?: qub.List<qub.Issue>): json.Token {
        return parseJsonToken(text, startIndex, json.TokenType.QuotedString, issues);
    }

    /**
     * Parse a Number json.Token from the provided text.
     */
    function parseNumber(text: string, startIndex: number = 0, issues?: qub.List<qub.Issue>): json.Token {
        return parseJsonToken(text, startIndex, json.TokenType.Number, issues);
    }

    /**
     * Parse a Whitespace json.Token from the provided text.
     */
    function parseWhitespace(text: string, startIndex: number = 0, issues?: qub.List<qub.Issue>): json.Token {
        return parseJsonToken(text, startIndex, json.TokenType.Whitespace, issues);
    }

    /**
     * Parse a NewLine json.Token from the provided text.
     */
    function parseNewLine(text: string, startIndex: number = 0, issues?: qub.List<qub.Issue>): json.Token {
        return parseJsonToken(text, startIndex, json.TokenType.NewLine, issues);
    }

    /**
     * Parse a JSON Property segment from the provided text.
     */
    function parseProperty(text: string, startIndex: number = 0, issues?: qub.List<qub.Issue>): json.Property {
        const tokenizer = new json.Tokenizer(text, startIndex, issues);
        assert.deepStrictEqual(tokenizer.next(), true);
        assert.deepStrictEqual(tokenizer.getCurrent().getType(), json.TokenType.QuotedString);
        return json.parseProperty(tokenizer);
    }

    /**
     * Parse a LineComment json.Token from the provided text.
     */
    function parseLineComment(text: string, startIndex: number = 0, issues?: qub.List<qub.Issue>): json.Token {
        return parseJsonToken(text, startIndex, json.TokenType.LineComment, issues);
    }

    /**
     * Parse a BlockComment json.Tegment from the provided text.
     */
    function parseBlockComment(text: string, startIndex: number = 0, issues?: qub.List<qub.Issue>): json.Token {
        return parseJsonToken(text, startIndex, json.TokenType.BlockComment, issues);
    }

    /**
     * Parse a JSON Object segment from the provided text.
     */
    function parseObject(text: string, startIndex: number = 0, issues?: qub.List<qub.Issue>): json.ObjectSegment {
        const tokenizer = new json.Tokenizer(text, startIndex, issues);
        tokenizer.next();
        assert.deepStrictEqual(tokenizer.hasCurrent(), true);
        assert.deepStrictEqual(tokenizer.getCurrent(), json.LeftCurlyBracket(startIndex));
        return json.parseObject(tokenizer, issues);
    }

    /**
     * Parse a JSON Array segment from the provided text.
     */
    function parseArray(text: string, startIndex: number = 0, issues?: qub.List<qub.Issue>): json.ArraySegment {
        const tokenizer = new json.Tokenizer(text, startIndex, issues);
        assert(tokenizer.next());
        assert(tokenizer.getCurrent() instanceof json.Token);
        const currentToken: json.Token = tokenizer.getCurrent() as json.Token;
        assert.deepStrictEqual(currentToken.getType(), json.TokenType.LeftSquareBracket);
        return json.parseArray(tokenizer, issues);
    }

    test("Token", () => {
        const token = new json.Token(new qub.ArrayList([qub.Letters("abc", 10)]), 10, json.TokenType.Unrecognized);
        assert.deepStrictEqual(token.toString(), "abc");
        assert.deepStrictEqual(token.format(), "abc");
        assert.deepStrictEqual(token.getType(), json.TokenType.Unrecognized);
        assert.deepStrictEqual(token.startIndex, 10);
        assert.deepStrictEqual(token.getLength(), 3);
        assert.deepStrictEqual(token.afterEndIndex, 13);
        assert.deepStrictEqual(token.span, new qub.Span(10, 3));
    });

    test("LeftCurlyBracket()", () => {
        assert.deepStrictEqual(json.LeftCurlyBracket(0), new json.Token(new qub.ArrayList([qub.LeftCurlyBracket(0)]), 0, json.TokenType.LeftCurlyBracket));
    });

    test("RightCurlyBracket()", () => {
        assert.deepStrictEqual(json.RightCurlyBracket(1), new json.Token(new qub.ArrayList([qub.RightCurlyBracket(1)]), 1, json.TokenType.RightCurlyBracket));
    });

    test("LeftSquareBracket()", () => {
        assert.deepStrictEqual(json.LeftSquareBracket(2), new json.Token(new qub.ArrayList([qub.LeftSquareBracket(2)]), 2, json.TokenType.LeftSquareBracket));
    });

    test("RightSquareBracket()", () => {
        assert.deepStrictEqual(json.RightSquareBracket(3), new json.Token(new qub.ArrayList([qub.RightSquareBracket(3)]), 3, json.TokenType.RightSquareBracket));
    });

    test("Colon", () => {
        assert.deepStrictEqual(json.Colon(4), new json.Token(new qub.ArrayList([qub.Colon(4)]), 4, json.TokenType.Colon));
    });

    test("Comma()", () => {
        assert.deepStrictEqual(json.Comma(5), new json.Token(new qub.ArrayList([qub.Comma(5)]), 5, json.TokenType.Comma));
    });

    test("True()", () => {
        assert.deepStrictEqual(json.True(6), new json.Token(new qub.ArrayList([qub.Letters("true", 6)]), 6, json.TokenType.True));
    });

    test("False()", () => {
        assert.deepStrictEqual(json.False(7), new json.Token(new qub.ArrayList([qub.Letters("false", 7)]), 7, json.TokenType.False));
    });

    test("Null()", () => {
        assert.deepStrictEqual(json.Null(8), new json.Token(new qub.ArrayList([qub.Letters("null", 8)]), 8, json.TokenType.Null));
    });

    suite("QuotedString()", () => {
        function quotedStringTest(text: string, startIndex: number): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const quotedString = json.QuotedString(parseQubLexes(text, startIndex), startIndex);
                assert.deepStrictEqual(quotedString.toString(), text ? text : "");
                assert.deepStrictEqual(quotedString.format(), text ? text : "");
                assert.deepStrictEqual(quotedString.startIndex, startIndex);
                assert.deepStrictEqual(quotedString.getLength(), qub.getLength(text));
                assert.deepStrictEqual(quotedString.afterEndIndex, startIndex + qub.getLength(text));
                assert.deepStrictEqual(quotedString.span, new qub.Span(startIndex, qub.getLength(text)));
            });
        }

        quotedStringTest(null, 0);
        quotedStringTest(undefined, 7);
        quotedStringTest("", 9);

        quotedStringTest(`"`, 5);
        quotedStringTest(`""`, 15);

        quotedStringTest(`'`, 5);
    });

    suite("Number()", () => {
        function numberTest(text: string, startIndex: number): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const number = json.Number(parseQubLexes(text, startIndex), startIndex);
                assert.deepStrictEqual(number.toString(), text ? text : "");
                assert.deepStrictEqual(number.format(), text ? text : "");
                assert.deepStrictEqual(number.startIndex, startIndex);
                assert.deepStrictEqual(number.getLength(), qub.getLength(text));
                assert.deepStrictEqual(number.afterEndIndex, startIndex + qub.getLength(text));
                assert.deepStrictEqual(number.span, new qub.Span(startIndex, qub.getLength(text)));
            });
        }

        numberTest(null, 0);
        numberTest(undefined, 7);
        numberTest("", 9);

        numberTest(`-`, 5);
        numberTest(`-3`, 15);

        numberTest(`.`, 5);

        numberTest("0", 1);
    });

    test("Unrecognized()", () => {
        assert.deepStrictEqual(json.Unrecognized(qub.Unrecognized("<", 12), 12), new json.Token(new qub.ArrayList([qub.Unrecognized("<", 12)]), 12, json.TokenType.Unrecognized));
    });

    suite("Whitespace", () => {
        function whitespaceTest(text: string, startIndex: number): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const number = json.Whitespace(parseQubLexes(text, startIndex), startIndex);
                assert.deepStrictEqual(number.toString(), text ? text : "");
                assert.deepStrictEqual(number.format(), text ? text : "");
                assert.deepStrictEqual(number.startIndex, startIndex);
                assert.deepStrictEqual(number.getLength(), qub.getLength(text));
                assert.deepStrictEqual(number.afterEndIndex, startIndex + qub.getLength(text));
                assert.deepStrictEqual(number.span, new qub.Span(startIndex, qub.getLength(text)));
            });
        }

        whitespaceTest(null, 0);
        whitespaceTest(undefined, 7);
        whitespaceTest("", 9);

        whitespaceTest(` `, 5);
        whitespaceTest(`\t`, 15);
        whitespaceTest(`\r`, 15);

        whitespaceTest(`   `, 5);

        whitespaceTest(" \t\r\t ", 1);
    });

    suite("LineComment", () => {
        function lineCommentTest(text: string, startIndex: number): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const lineComment: json.Token = json.LineComment(parseQubLexes(text, startIndex), startIndex);
                assert.deepStrictEqual(lineComment.toString(), text ? text : "");
                assert.deepStrictEqual(lineComment.format(), text ? text : "");
                assert.deepStrictEqual(lineComment.startIndex, startIndex);
                assert.deepStrictEqual(lineComment.getLength(), qub.getLength(text));
                assert.deepStrictEqual(lineComment.afterEndIndex, startIndex + qub.getLength(text));
                assert.deepStrictEqual(lineComment.span, new qub.Span(startIndex, qub.getLength(text)));
            });
        }

        lineCommentTest(null, 0);
        lineCommentTest(undefined, 7);
        lineCommentTest("", 9);

        lineCommentTest(`//`, 5);
        lineCommentTest(`// hello`, 15);
        lineCommentTest(`// // // //`, 15);
    });

    suite("BlockComment()", () => {
        function blockCommentTest(text: string, startIndex: number): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const blockComment: json.Token = json.BlockComment(parseQubLexes(text, startIndex), startIndex);
                assert.deepStrictEqual(blockComment.toString(), text ? text : "");
                assert.deepStrictEqual(blockComment.format(), text ? text : "");
                assert.deepStrictEqual(blockComment.startIndex, startIndex);
                assert.deepStrictEqual(blockComment.getLength(), qub.getLength(text));
                assert.deepStrictEqual(blockComment.afterEndIndex, startIndex + qub.getLength(text));
                assert.deepStrictEqual(blockComment.span, new qub.Span(startIndex, qub.getLength(text)));
            });
        }

        blockCommentTest(null, 0);
        blockCommentTest(undefined, 7);
        blockCommentTest("", 9);

        blockCommentTest(`/*`, 5);
        blockCommentTest(`/* hello`, 15);
        blockCommentTest(`/* hello\n`, 15);
        blockCommentTest(`/* hello\n*`, 15);
        blockCommentTest(`/* hello\n* */`, 15);
    });

    suite("Tokenizer", () => {
        suite("constructor", () => {
            function constructorNoStartIndexTest(text: string): void {
                test(`with ${qub.escapeAndQuote(text)} and no start index`, () => {
                    const tokenizer = new json.Tokenizer(null);
                    assert.deepStrictEqual(tokenizer.hasStarted(), false);
                    assert.deepStrictEqual(tokenizer.hasCurrent(), false);
                    assert.deepStrictEqual(tokenizer.getCurrent(), undefined);
                });
            }

            constructorNoStartIndexTest(null);
            constructorNoStartIndexTest(undefined);
            constructorNoStartIndexTest("");
            constructorNoStartIndexTest("355");
            constructorNoStartIndexTest("{}");

            test(`with "hello" and a start index`, () => {
                const tokenizer = new json.Tokenizer("hello", 3);
                assert.deepStrictEqual(tokenizer.hasStarted(), false);
                assert.deepStrictEqual(tokenizer.hasCurrent(), false);
                assert.deepStrictEqual(tokenizer.getCurrent(), undefined);
            });
        });

        suite("next()", () => {
            function nextTest(text: string, expectedSegments: json.Segment | json.Segment[] = [], expectedIssues: qub.Issue[] = []): void {
                if (expectedSegments instanceof json.Segment) {
                    expectedSegments = [expectedSegments];
                }

                test(`with ${qub.escapeAndQuote(text)}`, () => {
                    const issues = new qub.ArrayList<qub.Issue>();
                    const tokenizer = new json.Tokenizer(text, 0, issues);

                    if (expectedSegments) {
                        for (const expectedSegment of expectedSegments as json.Segment[]) {
                            assert.deepStrictEqual(tokenizer.next(), true, "With an expected token, expected next() to return true.");
                            assert.deepStrictEqual(tokenizer.hasStarted(), true, "With an expected token, expected started to be true.");
                            assert.deepStrictEqual(tokenizer.hasCurrent(), true);
                            assert.deepStrictEqual(tokenizer.getCurrent(), expectedSegment);
                        }
                    }

                    for (let i = 0; i < 2; ++i) {
                        assert.deepStrictEqual(tokenizer.next(), false, "With no remaining expected tokens, expected next() to return false.");
                        assert.deepStrictEqual(tokenizer.hasStarted(), true, "With no remaining expected tokens, expected started to be true.");
                        assert.deepStrictEqual(tokenizer.hasCurrent(), false);
                        assert.deepStrictEqual(tokenizer.getCurrent(), undefined);
                    }

                    assert.deepStrictEqual(issues.toArray(), expectedIssues);
                });
            }

            nextTest(null);
            nextTest(undefined);
            nextTest("");

            nextTest("{", json.LeftCurlyBracket(0));
            nextTest("}", json.RightCurlyBracket(0));
            nextTest("[", json.LeftSquareBracket(0));
            nextTest("]", json.RightSquareBracket(0));
            nextTest(":", json.Colon(0));
            nextTest(",", json.Comma(0));

            nextTest("true", json.True(0));
            nextTest("TRUE", json.Unrecognized(qub.Letters("TRUE", 0), 0));

            nextTest("false", json.False(0));
            nextTest("FALSE", json.Unrecognized(qub.Letters("FALSE", 0), 0));

            nextTest("null", json.Null(0));
            nextTest("NULL", json.Unrecognized(qub.Letters("NULL", 0), 0));


            function nextQuotedStringTest(text: string, expectedIssues: qub.Issue[] = []): void {
                nextTest(text, json.QuotedString(parseQubLexes(text, 0), 0), expectedIssues);
            }

            nextQuotedStringTest(`"`, [qub.Error("Missing end quote (\").", new qub.Span(0, 1))]);
            nextQuotedStringTest(`"test`, [qub.Error("Missing end quote (\").", new qub.Span(0, 5))]);
            nextQuotedStringTest(`"test'`, [qub.Error("Missing end quote (\").", new qub.Span(0, 6))]);
            nextQuotedStringTest(`""`);
            nextQuotedStringTest(`"a"`);
            nextQuotedStringTest(`"a's"`);
            nextQuotedStringTest(`"\\"Hey there!\\""`);

            nextQuotedStringTest(`'`, [qub.Error("Missing end quote (').", new qub.Span(0, 1))]);
            nextQuotedStringTest(`'abc`, [qub.Error("Missing end quote (').", new qub.Span(0, 4))]);
            nextQuotedStringTest(`''`);
            nextQuotedStringTest(`'a'`);
            nextQuotedStringTest(`'\\''`);


            function nextNumberTest(text: string, expectedIssues: qub.Issue[] = []): void {
                nextTest(text, json.Number(parseQubLexes(text, 0), 0), expectedIssues);
            }

            nextNumberTest("0");
            nextNumberTest("1");
            nextNumberTest("2.", [
                qub.Error("Missing fractional number digits.", new qub.Span(1, 1))
            ]);
            nextNumberTest("2.e", [
                qub.Error("Expected fractional number digits.", new qub.Span(2, 1)),
                qub.Error("Missing exponent number digits.", new qub.Span(2, 1)),
            ]);
            nextNumberTest("2.E", [
                qub.Error("Expected fractional number digits.", new qub.Span(2, 1)),
                qub.Error("'E' should be 'e'.", new qub.Span(2, 1)),
                qub.Error("Missing exponent number digits.", new qub.Span(2, 1)),
            ]);
            nextNumberTest(".3", [
                qub.Error("Expected whole number digits.", new qub.Span(0, 1))
            ]);
            nextNumberTest("4.5");
            nextNumberTest("5e", [
                qub.Error("Missing exponent number digits.", new qub.Span(1, 1))
            ]);
            nextNumberTest("5E", [
                qub.Error("'E' should be 'e'.", new qub.Span(1, 1)),
                qub.Error("Missing exponent number digits.", new qub.Span(1, 1))
            ]);
            nextTest("5E[", [
                parseNumber("5E", 0),
                json.LeftSquareBracket(2)
            ],
                [
                    qub.Error("'E' should be 'e'.", new qub.Span(1, 1)),
                    qub.Error("Expected exponent number digits.", new qub.Span(2, 1))
                ]);
            nextNumberTest("5e3");
            nextNumberTest("5E3", [
                qub.Error("'E' should be 'e'.", new qub.Span(1, 1))
            ]);
            nextNumberTest("6e+", [
                qub.Error("Missing exponent number digits.", new qub.Span(2, 1))
            ]);
            nextNumberTest("7e+30");
            nextNumberTest("7e-", [
                qub.Error("Missing exponent number digits.", new qub.Span(2, 1))
            ]);
            nextNumberTest("7e-15");
            nextNumberTest("8.9e", [
                qub.Error("Missing exponent number digits.", new qub.Span(3, 1))
            ]);
            nextNumberTest("8.9e3");
            nextNumberTest("8.9e3");
            nextNumberTest("10.11e+", [
                qub.Error("Missing exponent number digits.", new qub.Span(6, 1))
            ]);
            nextNumberTest("10.11e+7");
            nextNumberTest("12.13e-", [
                qub.Error("Missing exponent number digits.", new qub.Span(6, 1))
            ]);
            nextNumberTest("10.11e-7");
            nextNumberTest("-", [
                qub.Error("Missing whole number digits.", new qub.Span(0, 1))
            ]);
            nextTest("-a",
                [
                    parseNumber("-", 0),
                    json.Unrecognized(qub.Letters("a", 1), 1)
                ],
                [
                    qub.Error("Expected whole number digits.", new qub.Span(1, 1))
                ]);
            nextNumberTest("-0");
            nextNumberTest("-5");
            nextNumberTest("-6.", [
                qub.Error("Missing fractional number digits.", new qub.Span(2, 1))
            ]);
            nextNumberTest("-.7", [
                qub.Error("Expected whole number digits.", new qub.Span(1, 1))
            ]);
            nextNumberTest("-8e", [
                qub.Error("Missing exponent number digits.", new qub.Span(2, 1))
            ]);
            nextNumberTest("-8e20");
            nextNumberTest("-9e+", [
                qub.Error("Missing exponent number digits.", new qub.Span(3, 1))
            ]);
            nextNumberTest("-10e+11");
            nextNumberTest("-12e-", [
                qub.Error("Missing exponent number digits.", new qub.Span(4, 1))
            ]);
            nextNumberTest("-13e-14");

            nextTest(" ", parseWhitespace(" ", 0));
            nextTest("  ", parseWhitespace("  ", 0));
            nextTest("\t", parseWhitespace("\t", 0));
            nextTest("\r", parseWhitespace("\r", 0));

            function nextNewLineTest(text: string): void {
                nextTest(text, parseNewLine(text));
            }

            nextNewLineTest("\n");
            nextNewLineTest("\r\n");

            nextTest(" \t\r\n", [parseWhitespace(" \t", 0), parseNewLine("\r\n", 2)]);

            nextTest("/", [json.Unrecognized(qub.ForwardSlash(0), 0)],
                [
                    qub.Error(`Missing line comment's second forward slash ("/").`, new qub.Span(0, 1))
                ]);
            nextTest("/ ", [json.Unrecognized(qub.ForwardSlash(0), 0), parseWhitespace(" ", 1)],
                [
                    qub.Error(`Expected line comment's second forward slash ("/").`, new qub.Span(1, 1))
                ]);
            nextTest("/true", [json.Unrecognized(qub.ForwardSlash(0), 0), json.True(1)],
                [
                    qub.Error(`Expected line comment's second forward slash ("/").`, new qub.Span(1, 4))
                ]);
            nextTest("//", [json.LineComment(parseQubLexes("//", 0), 0)]);
            nextTest("// hello!", [json.LineComment(parseQubLexes("// hello!", 0), 0)]);
            nextTest("// hel\nlo!", [json.LineComment(parseQubLexes("// hel", 0), 0), parseNewLine("\n", 6), json.Unrecognized(qub.Letters("lo", 7), 7), json.Unrecognized(qub.ExclamationPoint(9), 9)]);

            nextTest("/*", [json.BlockComment(parseQubLexes("/*", 0), 0)]);
            nextTest("/* ", [json.BlockComment(parseQubLexes("/* ", 0), 0)]);
            nextTest("/* hello", [json.BlockComment(parseQubLexes("/* hello", 0), 0)]);
            nextTest("/* hello *", [json.BlockComment(parseQubLexes("/* hello *", 0), 0)]);
            nextTest("/**\n * test\n */", [json.BlockComment(parseQubLexes("/**\n * test\n */", 0), 0)]);

            nextTest("<>", [
                json.Unrecognized(qub.LeftAngleBracket(0), 0),
                json.Unrecognized(qub.RightAngleBracket(1), 1)
            ]);
        });
    });

    suite("Property", () => {
        test("with null", () => {
            assert.throws(() => { new json.Property(null); });
        });

        test("with undefined", () => {
            assert.throws(() => { new json.Property(undefined); });
        });

        test("with empty", () => {
            assert.throws(() => { new json.Property([]); });
        });

        function propertyTest(propertySegments: json.Segment[], formattedText: string = qub.getCombinedText(propertySegments)): void {
            test(`with ${qub.escapeAndQuote(qub.getCombinedText(propertySegments))}`, () => {
                const expectedStartIndex: number = propertySegments[0].startIndex;
                const expectedLength: number = qub.getCombinedLength(propertySegments);

                const property = new json.Property(propertySegments);
                assert.deepStrictEqual(property.toString(), qub.getCombinedText(propertySegments));
                assert.deepStrictEqual(property.format(), formattedText);
                assert.deepStrictEqual(property.startIndex, expectedStartIndex);
                assert.deepStrictEqual(property.getLength(), expectedLength);
                assert.deepStrictEqual(property.afterEndIndex, expectedStartIndex + expectedLength);
                assert.deepStrictEqual(property.span, new qub.Span(expectedStartIndex, expectedLength));
            });
        }

        propertyTest([parseQuotedString(`"name"`, 7)]);
        propertyTest([parseQuotedString(`"name"`, 3), json.Colon(9)]);
        propertyTest([parseQuotedString(`"name"`, 3), parseWhitespace(" ", 9), json.Colon(10)], `"name":`);
        propertyTest([parseQuotedString(`"a"`, 10), parseWhitespace(" ", 13), json.Colon(14), parseWhitespace(" ", 15), parseQuotedString(`"B"`, 16)], `"a": "B"`);
    });

    suite("ObjectSegment", () => {
        test("with null", () => {
            assert.throws(() => { new json.ObjectSegment(null); });
        });

        test("with undefined", () => {
            assert.throws(() => { new json.ObjectSegment(undefined); });
        });

        test("with empty", () => {
            assert.throws(() => { new json.ObjectSegment(new qub.ArrayList<json.Segment>()); });
        });

        function objectTest(objectSegments: json.Segment[], expectedFormattedString: string): void {
            const expectedText: string = qub.getCombinedText(objectSegments);
            const expectedStartIndex: number = objectSegments[0].startIndex;
            const expectedLength: number = qub.getCombinedLength(objectSegments);
            test(`with ${qub.escapeAndQuote(expectedText)}`, () => {
                const property = new json.ObjectSegment(new qub.ArrayList<json.Segment>(objectSegments));
                assert.deepStrictEqual(property.toString(), expectedText);
                assert.deepStrictEqual(property.format(), expectedFormattedString);
                assert.deepStrictEqual(property.startIndex, expectedStartIndex);
                assert.deepStrictEqual(property.getLength(), expectedLength, "Wrong length");
                assert.deepStrictEqual(property.afterEndIndex, expectedStartIndex + expectedLength, "Wrong after end index");
                assert.deepStrictEqual(property.span, new qub.Span(expectedStartIndex, expectedLength), "Wrong span");
            });
        }

        objectTest([json.LeftCurlyBracket(7)], "{");
        objectTest([json.LeftCurlyBracket(7), json.RightCurlyBracket(8)], "{}");
        objectTest([json.LeftCurlyBracket(10), parseWhitespace(" ", 11), json.RightCurlyBracket(12)], `{}`);
        objectTest([json.LeftCurlyBracket(15), parseWhitespace(" ", 16), parseProperty(`"a": "b"`, 17), parseWhitespace(" ", 25), json.RightCurlyBracket(26)], `{"a": "b"}`);
        objectTest([json.LeftCurlyBracket(15), parseWhitespace(" ", 16), parseProperty(`"a" :  "b"`, 17), parseWhitespace(" ", 27), json.RightCurlyBracket(28)], `{"a": "b"}`);
        objectTest([json.LeftCurlyBracket(15), parseNewLine("\n", 16), parseProperty(`"a": "b"`, 17), parseNewLine("\n", 25), json.RightCurlyBracket(26)], `{\n  "a": "b"\n}`);

        objectTest([json.LeftCurlyBracket(15), json.True(16), json.RightCurlyBracket(20)], `{true}`);
        objectTest([json.LeftCurlyBracket(15), parseWhitespace(" ", 16), json.True(17), json.RightCurlyBracket(21)], `{true}`);
        objectTest([json.LeftCurlyBracket(15), parseNewLine("\n", 16), json.True(17), json.RightCurlyBracket(21)], `{\n  true}`);
        objectTest([json.LeftCurlyBracket(15), parseNewLine("\n", 16), json.True(17), parseNewLine("\r\n", 21), json.RightCurlyBracket(23)], `{\n  true\r\n}`);

        objectTest([json.LeftCurlyBracket(15), parseNumber("50", 16), json.RightCurlyBracket(18)], `{50}`);
        objectTest([json.LeftCurlyBracket(15), parseWhitespace(" ", 16), parseNumber("1234", 17), json.RightCurlyBracket(21)], `{1234}`);
        objectTest([json.LeftCurlyBracket(15), parseNewLine("\n", 16), parseNumber("78", 17), json.RightCurlyBracket(19)], `{\n  78}`);
        objectTest([json.LeftCurlyBracket(15), parseNewLine("\n", 16), parseNumber("0", 17), parseNewLine("\r\n", 18), json.RightCurlyBracket(20)], `{\n  0\r\n}`);

        objectTest([json.LeftCurlyBracket(0), parseNumber("0", 1), json.Comma(2), parseNumber("1", 3), json.RightCurlyBracket(4)], `{0, 1}`);
        objectTest([json.LeftCurlyBracket(0), parseNumber("0", 1), parseWhitespace("   ", 2), parseNumber("1", 5), json.RightCurlyBracket(6)], `{0 1}`);
        objectTest([json.LeftCurlyBracket(0), parseQuotedString(`"0"`, 1), json.Null(4), json.RightCurlyBracket(8)], `{"0" null}`);
        objectTest([json.LeftCurlyBracket(0), parseQuotedString(`"0"`, 1), parseWhitespace("   ", 4), json.Null(7), json.RightCurlyBracket(11)], `{"0" null}`);
        objectTest([json.LeftCurlyBracket(0), parseQuotedString(`"0"`, 1), parseNumber("1", 4), json.RightCurlyBracket(5)], `{"0" 1}`);
        objectTest([json.LeftCurlyBracket(0), parseQuotedString(`"0"`, 1), parseWhitespace("   ", 4), parseNumber("1", 7), json.RightCurlyBracket(8)], `{"0" 1}`);
    });

    suite("ArraySegment", () => {
        test("with null", () => {
            assert.throws(() => { new json.ObjectSegment(null); });
        });

        test("with undefined", () => {
            assert.throws(() => { new json.ArraySegment(undefined); });
        });

        test("with empty", () => {
            assert.throws(() => { new json.ArraySegment(new qub.ArrayList<json.Segment>()); });
        });

        function arrayTest(arraySegments: json.Segment[], expectedFormattedString: string): void {
            const expectedText: string = qub.getCombinedText(arraySegments);
            const expectedStartIndex: number = arraySegments[0].startIndex;
            const expectedLength: number = qub.getCombinedLength(arraySegments);
            test(`with ${qub.escapeAndQuote(expectedText)}`, () => {
                const property = new json.ArraySegment(new qub.ArrayList<json.Segment>(arraySegments));
                assert.deepStrictEqual(property.toString(), expectedText);
                assert.deepStrictEqual(property.format(), expectedFormattedString);
                assert.deepStrictEqual(property.startIndex, expectedStartIndex);
                assert.deepStrictEqual(property.getLength(), expectedLength, "Wrong length");
                assert.deepStrictEqual(property.afterEndIndex, expectedStartIndex + expectedLength, "Wrong after end index");
                assert.deepStrictEqual(property.span, new qub.Span(expectedStartIndex, expectedLength), "Wrong span");
            });
        }

        arrayTest([json.LeftSquareBracket(7)], "[");
        arrayTest([json.LeftSquareBracket(7), json.RightSquareBracket(8)], "[]");
        arrayTest([json.LeftSquareBracket(10), parseWhitespace(" ", 11), json.RightSquareBracket(12)], `[]`);
        arrayTest([json.LeftSquareBracket(15), parseWhitespace(" ", 16), parseProperty(`"a": "b"`, 17), parseWhitespace(" ", 25), json.RightSquareBracket(26)], `["a": "b"]`);
        arrayTest([json.LeftSquareBracket(15), parseWhitespace(" ", 16), parseProperty(`"a" :  "b"`, 17), parseWhitespace(" ", 27), json.RightSquareBracket(28)], `["a": "b"]`);
        arrayTest([json.LeftSquareBracket(15), parseNewLine("\n", 16), parseProperty(`"a": "b"`, 17), parseNewLine("\n", 25), json.RightSquareBracket(26)], `[\n  "a": "b"\n]`);

        arrayTest([json.LeftSquareBracket(15), json.True(16), json.RightSquareBracket(20)], `[true]`);
        arrayTest([json.LeftSquareBracket(15), parseWhitespace(" ", 16), json.True(17), json.RightSquareBracket(21)], `[true]`);
        arrayTest([json.LeftSquareBracket(15), parseNewLine("\n", 16), json.True(17), json.RightSquareBracket(21)], `[\n  true]`);
        arrayTest([json.LeftSquareBracket(15), parseNewLine("\n", 16), json.True(17), parseNewLine("\r\n", 21), json.RightSquareBracket(23)], `[\n  true\r\n]`);

        arrayTest([json.LeftSquareBracket(15), parseNumber("50", 16), json.RightSquareBracket(18)], `[50]`);
        arrayTest([json.LeftSquareBracket(15), parseWhitespace(" ", 16), parseNumber("1234", 17), json.RightSquareBracket(21)], `[1234]`);
        arrayTest([json.LeftSquareBracket(15), parseNewLine("\n", 16), parseNumber("78", 17), json.RightSquareBracket(19)], `[\n  78]`);
        arrayTest([json.LeftSquareBracket(15), parseNewLine("\n", 16), parseNumber("0", 17), parseNewLine("\r\n", 18), json.RightSquareBracket(20)], `[\n  0\r\n]`);

        arrayTest([json.LeftSquareBracket(0), json.Null(1), parseNumber("1", 5), json.RightSquareBracket(6)], `[null 1]`);
        arrayTest([json.LeftSquareBracket(0), json.Null(1), parseWhitespace(" ", 5), json.True(6), json.RightSquareBracket(10)], `[null true]`);
        arrayTest([json.LeftSquareBracket(0), parseQuotedString(`"a"`, 1), parseWhitespace(" ", 4), parseQuotedString(`"b"`, 5), json.RightSquareBracket(8)], `["a" "b"]`);
    });

    suite("Document", () => {
        function documentTest(documentSegments: json.Segment[], formattedText: string = qub.getCombinedText(documentSegments)): void {
            const expectedText: string = qub.getCombinedText(documentSegments);
            test(`with ${qub.escapeAndQuote(expectedText)}`, () => {
                const segments: qub.Iterable<json.Segment> =
                    documentSegments === undefined ? undefined :
                        documentSegments === null ? null :
                            new qub.ArrayList<json.Segment>(documentSegments);

                const document = new json.Document(segments);
                assert.deepStrictEqual(document.toString(), expectedText);
                assert.deepStrictEqual(document.format(), formattedText);
                assert.deepStrictEqual(document.getLength(), qub.getCombinedLength(documentSegments));
                assert.deepStrictEqual(document.getRoot(), documentSegments ? documentSegments[0] : undefined);
            });
        }

        documentTest(null);
        documentTest(undefined);
        documentTest([]);
        documentTest([parseQuotedString(`"hello"`)]);
        documentTest([parseNumber(`1927`)]);
        documentTest([parseObject("{", 7)]);
        documentTest([parseObject(`{}`, 3)]);
        documentTest([parseObject(`{ }`, 10)], `{}`);
        documentTest([parseObject(`{ "a": "b" }`, 15)], `{"a": "b"}`);
        documentTest([parseObject(`{ "a" : "b" }`, 16, )], `{"a": "b"}`);
        documentTest([parseArray(`[`, 7)]);
        documentTest([parseArray(`[]`, 3)]);
        documentTest([parseArray(`[ ]`, 10)], `[]`);
        documentTest([parseArray(`["a", "b"]`, 15)]);
    });

    suite("skipWhitespace()", () => {
        test("before tokenizer starts", () => {
            const tokenizer = new json.Tokenizer("300");
            const values: json.Segment[] = [];
            json.skipWhitespace(tokenizer, values);
            assert.deepStrictEqual(tokenizer.hasStarted(), false);
            assert.deepStrictEqual(values, []);
        });

        test("when tokenizer is currently pointing at a non-whitespace segment", () => {
            const tokenizer = new json.Tokenizer("300");
            tokenizer.next();
            assert.deepStrictEqual(tokenizer.hasStarted(), true);
            assert.deepStrictEqual(tokenizer.hasCurrent(), true);
            assert.deepStrictEqual(tokenizer.getCurrent(), parseNumber("300", 0));

            const values: json.Segment[] = [];
            json.skipWhitespace(tokenizer, values);

            assert.deepStrictEqual(tokenizer.hasStarted(), true);
            assert.deepStrictEqual(tokenizer.hasCurrent(), true);
            assert.deepStrictEqual(tokenizer.getCurrent(), parseNumber("300", 0));
            assert.deepStrictEqual(values, []);
        });

        test("when tokenizer is currently pointing at a whitespace segment", () => {
            const tokenizer = new json.Tokenizer("    ");
            tokenizer.next();
            assert.deepStrictEqual(tokenizer.hasStarted(), true);
            assert.deepStrictEqual(tokenizer.hasCurrent(), true);
            assert.deepStrictEqual(tokenizer.getCurrent(), parseWhitespace("    ", 0));

            const values: json.Segment[] = [];
            json.skipWhitespace(tokenizer, values);

            assert.deepStrictEqual(tokenizer.hasStarted(), true);
            assert.deepStrictEqual(tokenizer.hasCurrent(), false);
            assert.deepStrictEqual(tokenizer.getCurrent(), undefined);
            assert.deepStrictEqual(values, [parseWhitespace("    ", 0)]);
        });
    });

    suite("parseProperty()", () => {
        function parsePropertyTest(text: string, expectedPropertySegments: json.Segment[], expectedIssues: qub.Issue[] = []): void {
            const expectedProperty = new json.Property(expectedPropertySegments);

            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const issues = new qub.ArrayList<qub.Issue>();
                const tokenizer = new json.Tokenizer(text, 0, issues);
                tokenizer.next();

                const property: json.Property = json.parseProperty(tokenizer, issues);
                assert.deepStrictEqual(property, expectedProperty);
                assert.deepStrictEqual(issues.toArray(), expectedIssues);
            });
        }

        parsePropertyTest(`"a"`, [parseQuotedString(`"a"`)], [qub.Error(`Missing colon (":").`, new qub.Span(0, 3))]);
        parsePropertyTest(`"a"  `, [parseQuotedString(`"a"`), parseWhitespace("  ", 3)], [qub.Error(`Missing colon (":").`, new qub.Span(0, 3))]);
        parsePropertyTest(`"a"1`, [parseQuotedString(`"a"`)], [qub.Error(`Expected colon (":").`, new qub.Span(3, 1))]);
        parsePropertyTest(`"a":`, [parseQuotedString(`"a"`), json.Colon(3)], [qub.Error(`Missing property value.`, new qub.Span(3, 1))]);
        parsePropertyTest(`"a":"A"`, [parseQuotedString(`"a"`), json.Colon(3), parseQuotedString(`"A"`, 4)]);
        parsePropertyTest(`"a" : "A"`, [parseQuotedString(`"a"`), parseWhitespace(" ", 3), json.Colon(4), parseWhitespace(" ", 5), parseQuotedString(`"A"`, 6)]);
        parsePropertyTest(`"a":false`, [parseQuotedString(`"a"`), json.Colon(3), json.False(4)]);
        parsePropertyTest(`"a":true`, [parseQuotedString(`"a"`), json.Colon(3), json.True(4)]);
        parsePropertyTest(`"a":null`, [parseQuotedString(`"a"`), json.Colon(3), json.Null(4)]);
        parsePropertyTest(`"a":-30.7`, [parseQuotedString(`"a"`), json.Colon(3), parseNumber("-30.7", 4)]);
        parsePropertyTest(`"a":{`, [parseQuotedString(`"a"`), json.Colon(3), parseObject("{", 4)], [qub.Error(`Missing closing right curly bracket ("}").`, new qub.Span(4, 1))]);
        parsePropertyTest(`"a":{}`, [parseQuotedString(`"a"`), json.Colon(3), parseObject("{}", 4)]);
        parsePropertyTest(`"a":[`, [parseQuotedString(`"a"`), json.Colon(3), parseArray("[", 4)], [qub.Error(`Missing closing right square bracket ("]").`, new qub.Span(4, 1))]);
        parsePropertyTest(`"a":[]`, [parseQuotedString(`"a"`), json.Colon(3), parseArray("[]", 4)]);
        parsePropertyTest(`"a":.`, [parseQuotedString(`"a"`), json.Colon(3), parseNumber(".", 4)],
            [
                qub.Error(`Expected whole number digits.`, new qub.Span(4, 1)),
                qub.Error(`Missing fractional number digits.`, new qub.Span(4, 1))
            ]);
        parsePropertyTest(`"a":<`, [parseQuotedString(`"a"`), json.Colon(3)],
            [
                qub.Error(`Expected property value.`, new qub.Span(4, 1))
            ]);
    });

    suite("parseObject()", () => {
        function parseObjectTest(text: string, expectedObjectSegments: json.Segment[], expectedProperties: json.Property[] = [], expectedIssues: qub.Issue[] = []): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const issues = new qub.ArrayList<qub.Issue>();
                const tokenizer = new json.Tokenizer(text, 0, issues);
                tokenizer.next();

                const object: json.ObjectSegment = json.parseObject(tokenizer, issues);
                assert.deepStrictEqual(object, new json.ObjectSegment(new qub.ArrayList<json.Segment>(expectedObjectSegments)));
                assert.deepStrictEqual(object.getProperties().toArray(), expectedProperties);
                assert.deepStrictEqual(issues.toArray(), expectedIssues);
            });
        }

        parseObjectTest(`{`, [json.LeftCurlyBracket(0)], [], [qub.Error(`Missing closing right curly bracket ("}").`, new qub.Span(0, 1))]);
        parseObjectTest(`{}`, [json.LeftCurlyBracket(0), json.RightCurlyBracket(1)]);
        parseObjectTest(`{  }`, [json.LeftCurlyBracket(0), parseWhitespace("  ", 1), json.RightCurlyBracket(3)]);
        parseObjectTest(`{"age"`, [json.LeftCurlyBracket(0), parseProperty(`"age"`, 1)],
            [parseProperty(`"age"`, 1)],
            [
                qub.Error(`Missing colon (":").`, new qub.Span(1, 5)),
                qub.Error(`Missing closing right curly bracket ("}").`, new qub.Span(0, 1))
            ]);
        parseObjectTest(`{"age"  `, [json.LeftCurlyBracket(0), parseProperty(`"age"  `, 1)],
            [parseProperty(`"age"  `, 1)],
            [
                qub.Error(`Missing colon (":").`, new qub.Span(1, 5)),
                qub.Error(`Missing closing right curly bracket ("}").`, new qub.Span(0, 1))
            ]);
        parseObjectTest(`{"age":`, [json.LeftCurlyBracket(0), parseProperty(`"age":`, 1)],
            [parseProperty(`"age":`, 1)],
            [
                qub.Error(`Missing property value.`, new qub.Span(6, 1)),
                qub.Error(`Missing closing right curly bracket ("}").`, new qub.Span(0, 1))
            ]);
        parseObjectTest(`{"age":20}`, [json.LeftCurlyBracket(0), parseProperty(`"age":20`, 1), json.RightCurlyBracket(9)], [parseProperty(`"age":20`, 1)])
        parseObjectTest(`{"age":20,}`, [json.LeftCurlyBracket(0), parseProperty(`"age":20`, 1), json.Comma(9), json.RightCurlyBracket(10)],
            [parseProperty(`"age":20`, 1)],
            [
                qub.Error(`Expected property name.`, new qub.Span(10, 1))
            ]);
        parseObjectTest(`{"age":20 "name":"Dan"}`, [json.LeftCurlyBracket(0), parseProperty(`"age":20`, 1), parseWhitespace(" ", 9), parseProperty(`"name":"Dan"`, 10), json.RightCurlyBracket(22)],
            [parseProperty(`"age":20`, 1), parseProperty(`"name":"Dan"`, 10)],
            [
                qub.Error(`Expected comma (",") or closing right curly bracket ("}").`, new qub.Span(10, 6))
            ]);
        parseObjectTest(`{,,,,}`, [json.LeftCurlyBracket(0), json.Comma(1), json.Comma(2), json.Comma(3), json.Comma(4), json.RightCurlyBracket(5)],
            [],
            [
                qub.Error(`Expected property name or closing right curly bracket ("}").`, new qub.Span(1, 1)),
                qub.Error(`Expected property name.`, new qub.Span(2, 1)),
                qub.Error(`Expected property name.`, new qub.Span(3, 1)),
                qub.Error(`Expected property name.`, new qub.Span(4, 1)),
                qub.Error(`Expected property name.`, new qub.Span(5, 1))
            ]);
        parseObjectTest(`{(}`, [json.LeftCurlyBracket(0), json.Unrecognized(qub.LeftParenthesis(1), 1), json.RightCurlyBracket(2)],
            [],
            [
                qub.Error(`Expected property name or closing right curly bracket ("}").`, new qub.Span(1, 1))
            ]);
        parseObjectTest(`{"a":0(}`, [json.LeftCurlyBracket(0), parseProperty(`"a":0`, 1), json.Unrecognized(qub.LeftParenthesis(6), 6), json.RightCurlyBracket(7)],
            [parseProperty(`"a":0`, 1)],
            [
                qub.Error(`Expected comma (",") or closing right curly bracket ("}").`, new qub.Span(6, 1))
            ]);
        parseObjectTest(`{"a":0,(}`, [json.LeftCurlyBracket(0), parseProperty(`"a":0`, 1), json.Comma(6), json.Unrecognized(qub.LeftParenthesis(7), 7), json.RightCurlyBracket(8)],
            [parseProperty(`"a":0`, 1)],
            [
                qub.Error(`Expected property name.`, new qub.Span(7, 1))
            ]);
        parseObjectTest(`{\n"a":0,\n"b":1\n}`,
            [
                json.LeftCurlyBracket(0),
                parseNewLine("\n", 1),
                parseProperty(`"a":0`, 2),
                json.Comma(7),
                parseNewLine("\n", 8),
                parseProperty(`"b":1`, 9),
                parseNewLine("\n", 14),
                json.RightCurlyBracket(15)
            ],
            [parseProperty(`"a":0`, 2), parseProperty(`"b":1`, 9)]);

        parseObjectTest(`{50}`,
            [
                json.LeftCurlyBracket(0),
                parseNumber("50", 1),
                json.RightCurlyBracket(3)
            ],
            [],
            [
                qub.Error(`Expected property name or closing right curly bracket (\"}\").`, new qub.Span(1, 2))
            ]);

        parseObjectTest(`{"a":"B" 50}`,
            [
                json.LeftCurlyBracket(0),
                parseProperty(`"a":"B"`, 1),
                parseWhitespace(" ", 8),
                parseNumber("50", 9),
                json.RightCurlyBracket(11)
            ],
            [parseProperty(`"a":"B"`, 1)],
            [
                qub.Error(`Expected comma (",") or closing right curly bracket (\"}\").`, new qub.Span(9, 2))
            ]);

        parseObjectTest(`{"a":"B", 50}`,
            [
                json.LeftCurlyBracket(0),
                parseProperty(`"a":"B"`, 1),
                json.Comma(8),
                parseWhitespace(" ", 9),
                parseNumber("50", 10),
                json.RightCurlyBracket(12)
            ],
            [parseProperty(`"a":"B"`, 1)],
            [
                qub.Error(`Expected property name.`, new qub.Span(10, 2))
            ]);

        parseObjectTest(`{\n  "a":"B"// Line Comment\n}`,
            [
                json.LeftCurlyBracket(0),
                parseNewLine("\n", 1),
                parseWhitespace("  ", 2),
                parseProperty(`"a":"B"`, 4),
                parseLineComment("// Line Comment", 11),
                parseNewLine("\n", 26),
                json.RightCurlyBracket(27)
            ],
            [parseProperty(`"a":"B"`, 4)]);
        parseObjectTest(`{\n  "a":"B",// Line Comment\n}`,
            [
                json.LeftCurlyBracket(0),
                parseNewLine("\n", 1),
                parseWhitespace("  ", 2),
                parseProperty(`"a":"B"`, 4),
                json.Comma(11),
                parseLineComment("// Line Comment", 12),
                parseNewLine("\n", 27),
                json.RightCurlyBracket(28)
            ],
            [parseProperty(`"a":"B"`, 4)],
            [
                qub.Error(`Expected property name.`, new qub.Span(28, 1))
            ]);

        parseObjectTest(`{\n  "a":"B",/* Block Comment\n}`,
            [
                json.LeftCurlyBracket(0),
                parseNewLine("\n", 1),
                parseWhitespace("  ", 2),
                parseProperty(`"a":"B"`, 4),
                json.Comma(11),
                parseBlockComment("/* Block Comment\n}", 12)
            ],
            [parseProperty(`"a":"B"`, 4)],
            [
                qub.Error(`Missing closing right curly bracket ("}").`, new qub.Span(0, 1))
            ]);

        parseObjectTest(`{\n  "a":"B"/* Block Comment*/\n}`,
            [
                json.LeftCurlyBracket(0),
                parseNewLine("\n", 1),
                parseWhitespace("  ", 2),
                parseProperty(`"a":"B"`, 4),
                parseBlockComment("/* Block Comment*/", 11),
                parseNewLine("\n", 29),
                json.RightCurlyBracket(30)
            ],
            [parseProperty(`"a":"B"`, 4)]);
    });

    suite("parseArray()", () => {
        function parseArrayTest(text: string, expectedArraySegments: json.Segment[], expectedElements: json.Segment[] = [], expectedIssues: qub.Issue[] = []): void {
            const expectedArray = new json.ArraySegment(new qub.ArrayList<json.Segment>(expectedArraySegments));

            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const issues = new qub.ArrayList<qub.Issue>();
                const tokenizer = new json.Tokenizer(text, 0, issues);
                tokenizer.next();

                const array: json.ArraySegment = json.parseArray(tokenizer, issues);
                assert.deepStrictEqual(array, expectedArray);
                assert.deepStrictEqual(array.getElements().toArray(), expectedElements);
                assert.deepStrictEqual(array.getElements().toArray(), expectedElements); // Test it twice since getElements() is cached.
                assert.deepStrictEqual(issues.toArray(), expectedIssues);
            });
        }

        parseArrayTest(`[`, [json.LeftSquareBracket(0)], [], [qub.Error(`Missing closing right square bracket ("]").`, new qub.Span(0, 1))]);
        parseArrayTest(`[ `, [json.LeftSquareBracket(0), parseWhitespace(" ", 1)], [], [qub.Error(`Missing closing right square bracket ("]").`, new qub.Span(0, 1))]);
        parseArrayTest(`[]`, [json.LeftSquareBracket(0), json.RightSquareBracket(1)]);
        parseArrayTest(`[ ]`, [json.LeftSquareBracket(0), parseWhitespace(" ", 1), json.RightSquareBracket(2)]);
        parseArrayTest(`["a"]`, [json.LeftSquareBracket(0), parseQuotedString(`"a"`, 1), json.RightSquareBracket(4)], [parseQuotedString(`"a"`, 1)]);
        parseArrayTest(`[null]`, [json.LeftSquareBracket(0), json.Null(1), json.RightSquareBracket(5)], [json.Null(1)]);
        parseArrayTest(`[true]`, [json.LeftSquareBracket(0), json.True(1), json.RightSquareBracket(5)], [json.True(1)]);
        parseArrayTest(`[false]`, [json.LeftSquareBracket(0), json.False(1), json.RightSquareBracket(6)], [json.False(1)]);
        parseArrayTest(`[12345]`, [json.LeftSquareBracket(0), parseNumber("12345", 1), json.RightSquareBracket(6)], [parseNumber("12345", 1)]);
        parseArrayTest(`[{`, [json.LeftSquareBracket(0), parseObject("{", 1)],
            [parseObject("{", 1)],
            [
                qub.Error(`Missing closing right curly bracket ("}").`, new qub.Span(1, 1)),
                qub.Error(`Missing closing right square bracket ("]").`, new qub.Span(0, 1))
            ]);
        parseArrayTest(`[[`, [json.LeftSquareBracket(0), parseArray("[", 1)],
            [parseArray("[", 1)],
            [
                qub.Error(`Missing closing right square bracket ("]").`, new qub.Span(1, 1)),
                qub.Error(`Missing closing right square bracket ("]").`, new qub.Span(0, 1))
            ]);
        parseArrayTest(`["a" "b"]`, [json.LeftSquareBracket(0), parseQuotedString(`"a"`, 1), parseWhitespace(" ", 4), parseQuotedString(`"b"`, 5), json.RightSquareBracket(8)],
            [parseQuotedString(`"a"`, 1), parseQuotedString(`"b"`, 5)],
            [
                qub.Error(`Expected comma (",") or closing right square bracket ("]").`, new qub.Span(5, 3))
            ]);
        parseArrayTest(`["a"5]`, [json.LeftSquareBracket(0), parseQuotedString(`"a"`, 1), parseNumber("5", 4), json.RightSquareBracket(5)],
            [parseQuotedString(`"a"`, 1), parseNumber("5", 4)],
            [
                qub.Error(`Expected comma (",") or closing right square bracket ("]").`, new qub.Span(4, 1))
            ]);
        parseArrayTest(`["a"true]`, [json.LeftSquareBracket(0), parseQuotedString(`"a"`, 1), json.True(4), json.RightSquareBracket(8)],
            [parseQuotedString(`"a"`, 1), json.True(4)],
            [
                qub.Error(`Expected comma (",") or closing right square bracket ("]").`, new qub.Span(4, 4))
            ]);
        parseArrayTest(`["a"{}]`, [json.LeftSquareBracket(0), parseQuotedString(`"a"`, 1), parseObject("{}", 4), json.RightSquareBracket(6)],
            [parseQuotedString(`"a"`, 1), parseObject("{}", 4)],
            [
                qub.Error(`Expected comma (",") or closing right square bracket ("]").`, new qub.Span(4, 1))
            ]);
        parseArrayTest(`["a"[]]`, [json.LeftSquareBracket(0), parseQuotedString(`"a"`, 1), parseArray("[]", 4), json.RightSquareBracket(6)],
            [parseQuotedString(`"a"`, 1), parseArray("[]", 4)],
            [
                qub.Error(`Expected comma (",") or closing right square bracket ("]").`, new qub.Span(4, 1))
            ]);
        parseArrayTest(`[,]`, [json.LeftSquareBracket(0), json.Comma(1), json.RightSquareBracket(2)],
            [undefined, undefined],
            [
                qub.Error(`Expected array element or closing right square bracket ("]").`, new qub.Span(1, 1)),
                qub.Error(`Expected array element.`, new qub.Span(2, 1))
            ]);
        parseArrayTest(`[2,]`, [json.LeftSquareBracket(0), parseNumber("2", 1), json.Comma(2), json.RightSquareBracket(3)],
            [parseNumber("2", 1), undefined],
            [
                qub.Error(`Expected array element.`, new qub.Span(3, 1))
            ]);
        parseArrayTest(`[2,,]`, [json.LeftSquareBracket(0), parseNumber("2", 1), json.Comma(2), json.Comma(3), json.RightSquareBracket(4)],
            [parseNumber("2", 1), undefined, undefined],
            [
                qub.Error(`Expected array element.`, new qub.Span(3, 1)),
                qub.Error(`Expected array element.`, new qub.Span(4, 1))
            ]);
        parseArrayTest(`[true,]`, [json.LeftSquareBracket(0), json.True(1), json.Comma(5), json.RightSquareBracket(6)],
            [json.True(1), undefined],
            [
                qub.Error(`Expected array element.`, new qub.Span(6, 1))
            ]);
        parseArrayTest(`[false,,]`, [json.LeftSquareBracket(0), json.False(1), json.Comma(6), json.Comma(7), json.RightSquareBracket(8)],
            [json.False(1), undefined, undefined],
            [
                qub.Error(`Expected array element.`, new qub.Span(7, 1)),
                qub.Error(`Expected array element.`, new qub.Span(8, 1))
            ]);
        parseArrayTest(`[)]`, [json.LeftSquareBracket(0), json.Unrecognized(qub.RightParenthesis(1), 1), json.RightSquareBracket(2)],
            [],
            [
                qub.Error(`Expected array element or closing right square bracket ("]").`, new qub.Span(1, 1))
            ]);
        parseArrayTest(`[null)]`, [json.LeftSquareBracket(0), json.Null(1), json.Unrecognized(qub.RightParenthesis(5), 5), json.RightSquareBracket(6)],
            [json.Null(1)],
            [
                qub.Error(`Expected comma (",") or closing right square bracket ("]").`, new qub.Span(5, 1))
            ]);
        parseArrayTest(`[null,)]`, [json.LeftSquareBracket(0), json.Null(1), json.Comma(5), json.Unrecognized(qub.RightParenthesis(6), 6), json.RightSquareBracket(7)],
            [json.Null(1), undefined],
            [
                qub.Error(`Expected array element.`, new qub.Span(6, 1))
            ]);
        parseArrayTest(`[9)]`, [json.LeftSquareBracket(0), parseNumber("9", 1), json.Unrecognized(qub.RightParenthesis(2), 2), json.RightSquareBracket(3)],
            [parseNumber("9", 1)],
            [
                qub.Error(`Expected comma (",") or closing right square bracket ("]").`, new qub.Span(2, 1))
            ]);
        parseArrayTest(`[9,)]`, [json.LeftSquareBracket(0), parseNumber("9", 1), json.Comma(2), json.Unrecognized(qub.RightParenthesis(3), 3), json.RightSquareBracket(4)],
            [parseNumber("9", 1), undefined],
            [
                qub.Error(`Expected array element.`, new qub.Span(3, 1))
            ]);
        parseArrayTest(`[\n0,\n1\n]`,
            [
                json.LeftSquareBracket(0),
                parseNewLine("\n", 1),
                parseNumber("0", 2),
                json.Comma(3),
                parseNewLine("\n", 4),
                parseNumber("1", 5),
                parseNewLine("\n", 6),
                json.RightSquareBracket(7)
            ],
            [parseNumber("0", 2), parseNumber("1", 5)]);
        parseArrayTest(`[\n  //Test comment\n]`,
            [
                json.LeftSquareBracket(0),
                parseNewLine("\n", 1),
                parseWhitespace("  ", 2),
                parseLineComment("//Test comment", 4),
                parseNewLine("\n", 18),
                json.RightSquareBracket(19)
            ]);
        parseArrayTest(`[0, 1/*BlockComment*/, 2]`,
            [
                json.LeftSquareBracket(0),
                parseNumber("0", 1),
                json.Comma(2),
                parseWhitespace(" ", 3),
                parseNumber("1", 4),
                parseBlockComment("/*BlockComment*/", 5),
                json.Comma(21),
                parseWhitespace(" ", 22),
                parseNumber("2", 23),
                json.RightSquareBracket(24)
            ],
            [parseNumber("0", 1), parseNumber("1", 4), parseNumber("2", 23)]);
    });

    suite("parseSegment()", () => {
        function parseSegmentTest(text: string, expectedSegment: json.Segment, expectedIssues: qub.Issue[] = []): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const issues = new qub.ArrayList<qub.Issue>();
                const tokenizer = new json.Tokenizer(text, 0, issues);
                tokenizer.next();

                const segment: json.Segment = json.parseSegment(tokenizer, issues);
                assert.deepStrictEqual(segment, expectedSegment);
                assert.deepStrictEqual(issues.toArray(), expectedIssues);
            });
        }

        parseSegmentTest(`"`, parseQuotedString(`"`), [qub.Error(`Missing end quote (").`, new qub.Span(0, 1))]);
        parseSegmentTest(`""`, parseQuotedString(`""`));

        parseSegmentTest(`'`, parseQuotedString(`'`), [qub.Error(`Missing end quote (').`, new qub.Span(0, 1))]);
        parseSegmentTest(`''`, parseQuotedString(`''`));

        parseSegmentTest("true", json.True(0));

        parseSegmentTest(`[`, parseArray("["), [qub.Error(`Missing closing right square bracket ("]").`, new qub.Span(0, 1))]);
        parseSegmentTest(`[] `, parseArray("[]"));

        parseSegmentTest(`{`, parseObject("{"), [qub.Error(`Missing closing right curly bracket ("}").`, new qub.Span(0, 1))]);
        parseSegmentTest(`{} `, parseObject("{}"));

        parseSegmentTest(` `, parseWhitespace(" ", 0));

        parseSegmentTest(`// hello`, parseLineComment(`// hello`));

        parseSegmentTest(`/* */`, parseBlockComment(`/* */`));
    });

    suite("parse()", () => {
        function parseTest(text: string, expectedDocumentSegments: json.Segment[], expectedIssues: qub.Issue[] = []): void {
            test(`with ${qub.escapeAndQuote(text)}`, () => {
                const expectedSegments: qub.Iterable<json.Segment> =
                    expectedDocumentSegments === undefined ? undefined :
                        expectedDocumentSegments === null ? null :
                            new qub.ArrayList<json.Segment>(expectedDocumentSegments);
                const expectedDocument = new json.Document(expectedSegments);

                const issues = new qub.ArrayList<qub.Issue>();
                const document: json.Document = json.parse(text, issues);
                assert.deepStrictEqual(document, expectedDocument);
                assert.deepStrictEqual(document.toString(), text ? text : "");
                assert.deepStrictEqual(issues.toArray(), expectedIssues);
            });
        }

        parseTest(null, []);
        parseTest(undefined, []);
        parseTest("", []);

        parseTest("null", [json.Null(0)]);
        parseTest("true", [json.True(0)]);
        parseTest("false", [json.False(0)]);

        parseTest("31", [parseNumber("31", 0)]);

        parseTest("{", [parseObject("{")], [qub.Error(`Missing closing right curly bracket ("}").`, new qub.Span(0, 1))]);
        parseTest("{}", [parseObject("{}")]);
        parseTest("{}{}", [parseObject("{}"), parseObject("{}", 2)], [qub.Error(`Expected end of file.`, new qub.Span(2, 2))]);
        parseTest("{}\n", [parseObject("{}"), parseNewLine("\n", 2)]);

        parseTest("[", [parseArray("[")], [qub.Error(`Missing closing right square bracket ("]").`, new qub.Span(0, 1))]);
        parseTest("[]", [parseArray("[]")]);

        parseTest("null ", [json.Null(0), parseWhitespace(" ", 4)]);
        parseTest("null 1", [json.Null(0), parseWhitespace(" ", 4), parseNumber("1", 5)], [qub.Error(`Expected end of file.`, new qub.Span(5, 1))]);
        parseTest("null false", [json.Null(0), parseWhitespace(" ", 4), json.False(5)], [qub.Error(`Expected end of file.`, new qub.Span(5, 5))]);

        parseTest(`""`, [parseQuotedString(`""`)]);
        parseTest(`"" `, [parseQuotedString(`""`), parseWhitespace(" ", 2)]);
        parseTest(`"" ""`, [parseQuotedString(`""`), parseWhitespace(" ", 2), parseQuotedString(`""`, 3)], [qub.Error(`Expected end of file.`, new qub.Span(3, 2))]);

        parseTest(`// hello again`, [parseLineComment(`// hello again`)]);

        parseTest(`/* */`, [parseBlockComment(`/* */`)]);
    });
});
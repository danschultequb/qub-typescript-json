import * as qub from "qub";

export const enum TokenType {
    LeftCurlyBracket,
    RightCurlyBracket,
    LeftSquareBracket,
    RightSquareBracket,
    Colon,
    Comma,
    True,
    False,
    Null,
    NewLine,
    QuotedString,
    Number,
    Whitespace,
    LineComment,
    BlockComment,
    Unrecognized
}

/**
 * An single structural portion of a JSON common.
 */
export abstract class Segment {
    constructor(private _startIndex: number) {
    }

    /**
     * Get the character index where this Segment starts in its source text.
     */
    public get startIndex(): number {
        return this._startIndex;
    }

    /**
     * Get the character index directly after this Segment in its source text. 
     */
    public get afterEndIndex(): number {
        return this._startIndex + this.getLength();
    }

    /**
     * Get the span that this Segment occupies in its source text.
     */
    public get span(): qub.Span {
        return new qub.Span(this._startIndex, this.getLength());
    }

    /**
     * Get the original string that this Segment was parsed from.
     */
    public abstract toString(): string;

    /**
     * Get the character length of the original string that this Segment was parsed from.
     */
    public abstract getLength(): number;

    /**
     * Get a formatted string representation of this JSON Segment.
     */
    public abstract format(): string;
}

/**
 * The smallest Segment in a JSON common. A single JSON Token maps to a single basic Token.
 */
export class Token extends Segment {
    constructor(private _basicTokens: qub.Iterable<qub.Lex>, startIndex: number, private _type: TokenType) {
        super(startIndex);
    }

    /**
     * Get the type of this JSON Token.
     */
    public getType(): TokenType {
        return this._type;
    }

    /**
     * Get the original string that this Segment was parsed from.
     */
    public toString(): string {
        return qub.getCombinedText(this._basicTokens);
    }

    /**
     * Get the character length of the original string that this Segment was parsed from.
     */
    public getLength(): number {
        return qub.getCombinedLength(this._basicTokens);
    }

    /**
     * Get a formatted string representation of this JSON Segment.
     */
    public format(): string {
        return this.toString();
    }
}

export function LeftCurlyBracket(startIndex: number): Token {
    return new Token(new qub.ArrayList([qub.LeftCurlyBracket(startIndex)]), startIndex, TokenType.LeftCurlyBracket);
}

export function RightCurlyBracket(startIndex: number): Token {
    return new Token(new qub.ArrayList([qub.RightCurlyBracket(startIndex)]), startIndex, TokenType.RightCurlyBracket);
}

export function LeftSquareBracket(startIndex: number): Token {
    return new Token(new qub.ArrayList([qub.LeftSquareBracket(startIndex)]), startIndex, TokenType.LeftSquareBracket);
}

export function RightSquareBracket(startIndex: number): Token {
    return new Token(new qub.ArrayList([qub.RightSquareBracket(startIndex)]), startIndex, TokenType.RightSquareBracket);
}

export function Colon(startIndex: number): Token {
    return new Token(new qub.ArrayList([qub.Colon(startIndex)]), startIndex, TokenType.Colon);
}

export function Comma(startIndex: number): Token {
    return new Token(new qub.ArrayList([qub.Comma(startIndex)]), startIndex, TokenType.Comma);
}

export function True(startIndex: number): Token {
    return new Token(new qub.ArrayList([qub.Letters("true", startIndex)]), startIndex, TokenType.True);
}

export function False(startIndex: number): Token {
    return new Token(new qub.ArrayList([qub.Letters("false", startIndex)]), startIndex, TokenType.False);
}

export function Null(startIndex: number): Token {
    return new Token(new qub.ArrayList([qub.Letters("null", startIndex)]), startIndex, TokenType.Null);
}

export function NewLine(basicToken: qub.Lex, startIndex: number): Token {
    return new Token(new qub.ArrayList([basicToken]), startIndex, TokenType.NewLine);
}

export function QuotedString(basicTokens: qub.Iterable<qub.Lex>, startIndex: number): Token {
    return new Token(basicTokens, startIndex, TokenType.QuotedString);
}

export function Number(basicTokens: qub.Iterable<qub.Lex>, startIndex: number): Token {
    return new Token(basicTokens, startIndex, TokenType.Number);
}

export function Whitespace(basicTokens: qub.Iterable<qub.Lex>, startIndex: number): Token {
    return new Token(basicTokens, startIndex, TokenType.Whitespace);
}

export function LineComment(basicTokens: qub.Iterable<qub.Lex>, startIndex: number): Token {
    return new Token(basicTokens, startIndex, TokenType.LineComment);
}

export function BlockComment(basicTokens: qub.Iterable<qub.Lex>, startIndex: number): Token {
    return new Token(basicTokens, startIndex, TokenType.BlockComment);
}

export function Unrecognized(basicToken: qub.Lex, startIndex: number): Token {
    return new Token(new qub.ArrayList([basicToken]), startIndex, TokenType.Unrecognized);
}

/**
 * Add the provided issue to the list of issues. If the list of issues is not defined, then nothing with happen.
 * @param issues The list to add the issue to.
 * @param toAdd The issue to add.
 */
function addIssue(issues: qub.List<qub.Issue>, toAdd: qub.Issue) {
    if (issues) {
        issues.add(toAdd);
    }
}

/**
 * A JSON Tokenizer that converts an input text into a sequence of JSON Segments. Everything that
 * the tokenizer returns will be composed of basic Tokens (Colons, QuotedStrings, Whitespace). Any
 * JSON structure that contains other JSON segments (Objects and Arrays) will be returned from
 * the JSON parse() methods.
 */
export class Tokenizer extends qub.IteratorBase<Token> {
    private _tokenizer: qub.Lexer;
    private _currentBasicTokenStartIndex: number;

    private _currentToken: Token;
    private _currentTokenStartIndex: number;

    constructor(text: string, startIndex: number = 0, private _issues?: qub.List<qub.Issue>) {
        super();

        this._tokenizer = new qub.Lexer(text, startIndex);
        this._currentTokenStartIndex = startIndex;
    }

    /**
     * Get whether or not this JSON Tokenizer has started tokenizing its input text.
     */
    public hasStarted(): boolean {
        return this._tokenizer.hasStarted();
    }

    /**
     * Get whether this Tokenizer has a current segment or not.
     */
    public hasCurrent(): boolean {
        return this._currentToken ? true : false;
    }

    /**
     * Get the current Token that this Tokenizer is pointing at. If this Tokenizer isn't pointing at
     * a current Token, then undefined will be returned.
     */
    public getCurrent(): Token {
        return this._currentToken;
    }

    private get currentBasicToken(): qub.Lex {
        return this._tokenizer.getCurrent();
    }

    private nextBasicToken(): boolean {
        if (!this.hasStarted()) {
            this._currentBasicTokenStartIndex = 0;
        }
        else {
            this._currentBasicTokenStartIndex += this.currentBasicToken.getLength();
        }
        return this._tokenizer.next();
    }

    private addIssue(issue: qub.Issue): void {
        addIssue(this._issues, issue);
    }

    public next(): boolean {
        if (!this.hasStarted()) {
            this.nextBasicToken();
        }
        else if (this._currentToken) {
            this._currentTokenStartIndex += this._currentToken.getLength();
        }

        if (this.currentBasicToken) {
            switch (this.currentBasicToken.getType()) {
                case qub.LexType.LeftCurlyBracket:
                    this._currentToken = LeftCurlyBracket(this._currentTokenStartIndex);
                    this.nextBasicToken();
                    break;

                case qub.LexType.RightCurlyBracket:
                    this._currentToken = RightCurlyBracket(this._currentTokenStartIndex);
                    this.nextBasicToken();
                    break;

                case qub.LexType.LeftSquareBracket:
                    this._currentToken = LeftSquareBracket(this._currentTokenStartIndex);
                    this.nextBasicToken();
                    break;

                case qub.LexType.RightSquareBracket:
                    this._currentToken = RightSquareBracket(this._currentTokenStartIndex);
                    this.nextBasicToken();
                    break;

                case qub.LexType.Colon:
                    this._currentToken = Colon(this._currentTokenStartIndex);
                    this.nextBasicToken();
                    break;

                case qub.LexType.Comma:
                    this._currentToken = Comma(this._currentTokenStartIndex);
                    this.nextBasicToken();
                    break;

                case qub.LexType.Letters:
                    switch (this.currentBasicToken.toString()) {
                        case "true":
                            this._currentToken = True(this._currentTokenStartIndex);
                            break;

                        case "false":
                            this._currentToken = False(this._currentTokenStartIndex);
                            break;

                        case "null":
                            this._currentToken = Null(this._currentTokenStartIndex);
                            break;

                        default:
                            this._currentToken = Unrecognized(this.currentBasicToken, this._currentTokenStartIndex);
                            break;
                    }
                    this.nextBasicToken();
                    break;

                case qub.LexType.SingleQuote:
                case qub.LexType.DoubleQuote:
                    const startQuote: qub.Lex = this.currentBasicToken;
                    const quotedStringBasicTokens = new qub.ArrayList([startQuote]);
                    this.nextBasicToken();

                    let endQuote: qub.Lex = null;
                    let escaped: boolean = false;

                    while (!endQuote && this.currentBasicToken) {
                        quotedStringBasicTokens.add(this.currentBasicToken);
                        if (escaped) {
                            escaped = false;
                        }
                        else {
                            if (this.currentBasicToken.getType() === qub.LexType.Backslash) {
                                escaped = true;
                            }
                            else if (this.currentBasicToken.getType() === startQuote.getType()) {
                                endQuote = this.currentBasicToken;
                            }
                        }
                        this.nextBasicToken();
                    }

                    if (!endQuote) {
                        this.addIssue(qub.Error(`Missing end quote (${startQuote.toString()}).`, new qub.Span(this._currentTokenStartIndex, qub.getCombinedLength(quotedStringBasicTokens))));
                    }

                    this._currentToken = QuotedString(quotedStringBasicTokens, this._currentTokenStartIndex);
                    break;

                case qub.LexType.Space:
                case qub.LexType.Tab:
                case qub.LexType.CarriageReturn:
                    let whitespaceBasicTokens = new qub.ArrayList([this.currentBasicToken]);
                    while (this.nextBasicToken() &&
                        (this.currentBasicToken.getType() === qub.LexType.Space ||
                            this.currentBasicToken.getType() === qub.LexType.Tab ||
                            this.currentBasicToken.getType() === qub.LexType.CarriageReturn)) {
                        whitespaceBasicTokens.add(this.currentBasicToken);
                    }
                    this._currentToken = Whitespace(whitespaceBasicTokens, this._currentTokenStartIndex);
                    break;

                case qub.LexType.NewLine:
                    this._currentToken = NewLine(this.currentBasicToken, this._currentTokenStartIndex);
                    this.nextBasicToken();
                    break;

                case qub.LexType.Dash:
                case qub.LexType.Digits:
                case qub.LexType.Period:
                    const numberTokenStartIndex: number = this._currentTokenStartIndex;
                    const numberBasicTokens = new qub.ArrayList<qub.Lex>();

                    if (this.currentBasicToken.getType() === qub.LexType.Dash) {
                        // Negative sign
                        numberBasicTokens.add(this.currentBasicToken);
                        this.nextBasicToken();
                    }

                    if (!this.currentBasicToken) {
                        this.addIssue(qub.Error("Missing whole number digits.", new qub.Span(numberTokenStartIndex, 1)));
                    }
                    else if (this.currentBasicToken.getType() !== qub.LexType.Digits) {
                        this.addIssue(qub.Error("Expected whole number digits.", new qub.Span(this._currentBasicTokenStartIndex, this.currentBasicToken.getLength())));
                    }
                    else {
                        // Whole number digits
                        numberBasicTokens.add(this.currentBasicToken);
                        this.nextBasicToken();
                    }

                    if (this.currentBasicToken && this.currentBasicToken.getType() === qub.LexType.Period) {
                        // Decimal point
                        const decimalPointStartIndex: number = this._currentBasicTokenStartIndex;
                        numberBasicTokens.add(this.currentBasicToken);
                        this.nextBasicToken();

                        if (!this.currentBasicToken) {
                            this.addIssue(qub.Error("Missing fractional number digits.", new qub.Span(decimalPointStartIndex, 1)));
                        }
                        else if (this.currentBasicToken.getType() !== qub.LexType.Digits) {
                            this.addIssue(qub.Error("Expected fractional number digits.", new qub.Span(this._currentBasicTokenStartIndex, this.currentBasicToken.getLength())));
                        }
                        else {
                            // Fractional number digits
                            numberBasicTokens.add(this.currentBasicToken);
                            this.nextBasicToken();
                        }
                    }

                    if (this.currentBasicToken) {
                        if (this.currentBasicToken.getType() === qub.LexType.Letters && this.currentBasicToken.toString().toLowerCase() === "e") {
                            // e
                            const eStartIndex: number = this._currentBasicTokenStartIndex;
                            numberBasicTokens.add(this.currentBasicToken);
                            if (this.currentBasicToken.toString() === "E") {
                                this.addIssue(qub.Error("'E' should be 'e'.", new qub.Span(eStartIndex, 1)));
                            }
                            this.nextBasicToken();

                            if (!this.currentBasicToken) {
                                this.addIssue(qub.Error("Missing exponent number digits.", new qub.Span(eStartIndex, 1)));
                            }
                            else {
                                const exponentNumberSignOrDigitsStartIndex: number = this._currentBasicTokenStartIndex;

                                if (this.currentBasicToken.getType() === qub.LexType.Dash || this.currentBasicToken.getType() === qub.LexType.Plus) {
                                    // Exponent number sign
                                    numberBasicTokens.add(this.currentBasicToken);
                                    this.nextBasicToken();
                                }

                                if (!this.currentBasicToken) {
                                    this.addIssue(qub.Error("Missing exponent number digits.", new qub.Span(exponentNumberSignOrDigitsStartIndex, 1)));
                                }
                                else if (this.currentBasicToken.getType() !== qub.LexType.Digits) {
                                    this.addIssue(qub.Error("Expected exponent number digits.", new qub.Span(this._currentBasicTokenStartIndex, this.currentBasicToken.getLength())));
                                }
                                else {
                                    // Exponent number digits
                                    numberBasicTokens.add(this.currentBasicToken);
                                    this.nextBasicToken();
                                }
                            }
                        }
                    }

                    this._currentToken = Number(numberBasicTokens, this._currentTokenStartIndex);
                    break;

                case qub.LexType.ForwardSlash:
                    const forwardSlash: qub.Lex = this.currentBasicToken;
                    if (this.nextBasicToken()) {
                        switch (this.currentBasicToken.getType()) {
                            case qub.LexType.ForwardSlash:
                                const lineCommentBasicTokens = new qub.ArrayList<qub.Lex>([forwardSlash, this.currentBasicToken]);
                                while (this.nextBasicToken() && this.currentBasicToken.getType() !== qub.LexType.NewLine) {
                                    lineCommentBasicTokens.add(this.currentBasicToken);
                                }
                                this._currentToken = LineComment(lineCommentBasicTokens, this._currentTokenStartIndex);
                                break;

                            case qub.LexType.Asterisk:
                                const blockCommentBasicTokens = new qub.ArrayList<qub.Lex>([forwardSlash, this.currentBasicToken]);
                                this.nextBasicToken();

                                while (this.currentBasicToken) {
                                    blockCommentBasicTokens.add(this.currentBasicToken);
                                    if (this.currentBasicToken.getType() === qub.LexType.Asterisk) {
                                        if (this.nextBasicToken()) {
                                            blockCommentBasicTokens.add(this.currentBasicToken);
                                            if (this.currentBasicToken.getType() === qub.LexType.ForwardSlash) {
                                                this.nextBasicToken();
                                                break;
                                            }
                                            else {
                                                this.nextBasicToken();
                                            }
                                        }
                                    }
                                    else {
                                        this.nextBasicToken();
                                    }
                                }

                                this._currentToken = BlockComment(blockCommentBasicTokens, this._currentTokenStartIndex);
                                break;

                            default:
                                this.addIssue(qub.Error(`Expected line comment's second forward slash ("/").`, new qub.Span(this._currentBasicTokenStartIndex, this.currentBasicToken.getLength())));
                                this._currentToken = Unrecognized(qub.ForwardSlash(this._currentTokenStartIndex), this._currentTokenStartIndex);
                                break;
                        }
                    }
                    else {
                        this.addIssue(qub.Error(`Missing line comment's second forward slash ("/").`, new qub.Span(this._currentTokenStartIndex, 1)));
                        this._currentToken = Unrecognized(qub.ForwardSlash(this._currentTokenStartIndex), this._currentTokenStartIndex);
                    }
                    break;

                default:
                    this._currentToken = Unrecognized(this.currentBasicToken, this._currentTokenStartIndex);
                    this.nextBasicToken();
                    break;
            }
        }
        else {
            this._currentToken = undefined;
        }

        return qub.isDefined(this._currentToken);
    }
}

/**
 * A parsed property within a JSON object. This includes the name, colon, value, and any whitespace
 * between those segments.
 */
export class Property extends Segment {
    constructor(private _segments: Segment[]) {
        super(_segments[0].startIndex);
    }

    public toString(): string {
        return qub.getCombinedText(this._segments);
    }

    public getLength(): number {
        return qub.getContiguousLength(this._segments);
    }

    public format(): string {
        let result: string = "";

        for (let i: number = 0; i < this._segments.length; ++i) {
            const segment: Segment = this._segments[i];
            if (!(segment instanceof Token) || segment.getType() !== TokenType.Whitespace) {
                result += segment.format();
                if (segment instanceof Token && segment.getType() === TokenType.Colon && i < this._segments.length - 1) {
                    result += " ";
                }
            }
        }

        return result;
    }
}

/**
 * A parsed JSON object.
 */
export class ObjectSegment extends Segment {
    constructor(private _segments: qub.Iterable<Segment>) {
        super(_segments.first().startIndex);
    }

    /**
     * Get the properties within this JSON object.
     */
    public getProperties(): qub.Iterable<Property> {
        return this._segments
            .where((segment: Segment) => segment instanceof Property)
            .map((segment: Segment) => segment as Property);
    }

    public toString(): string {
        return qub.getCombinedText(this._segments);
    }

    public getLength(): number {
        return qub.getContiguousLength(this._segments);
    }

    public format(): string {
        let result: string = "";

        let previousSegment: Segment;
        for (const segment of this._segments) {
            if (segment instanceof Token) {
                switch (segment.getType()) {
                    case TokenType.NewLine:
                    case TokenType.LeftCurlyBracket:
                    case TokenType.RightCurlyBracket:
                    case TokenType.Comma:
                        result += segment.toString();
                        previousSegment = segment;
                        break;

                    case TokenType.Whitespace:
                        break;

                    default:
                        if (previousSegment instanceof Token && previousSegment.getType() === TokenType.NewLine) {
                            result += "  ";
                        }
                        else if (!(previousSegment instanceof Token) || previousSegment.getType() !== TokenType.LeftCurlyBracket) {
                            result += " ";
                        }

                        result += segment.toString();
                        previousSegment = segment;
                        break;
                }
            }
            else {
                if (previousSegment instanceof Token && previousSegment.getType() === TokenType.NewLine) {
                    result += "  ";
                }

                result += segment.format();
                previousSegment = segment;
            }
        }

        return result;
    }
}

/**
 * A parsed JSON array.
 */
export class ArraySegment extends Segment {
    private _elements: qub.Indexable<Segment>;
    constructor(private _segments: qub.Iterable<Segment>) {
        super(_segments.first().startIndex);
    }

    /**
     * Get the element Segments of this ArraySegment.
     */
    public getElements(): qub.Indexable<Segment> {
        if (!this._elements) {
            const elements = new qub.ArrayList<Segment>();

            let expectingComma: boolean = false;
            for (const segment of this._segments) {
                if (segment instanceof ObjectSegment || segment instanceof ArraySegment) {
                    elements.add(segment);
                    expectingComma = true;
                }
                else {
                    const token: Token = segment as Token;
                    switch (token.getType()) {
                        case TokenType.False:
                        case TokenType.Null:
                        case TokenType.Number:
                        case TokenType.QuotedString:
                        case TokenType.True:
                            elements.add(token);
                            expectingComma = true;
                            break;

                        case TokenType.Comma:
                            if (!expectingComma) {
                                elements.add(undefined);
                            }
                            else {
                                expectingComma = false;
                            }
                            break;
                    }
                }
            }
            if (elements.any() && !expectingComma) {
                elements.add(undefined);
            }

            this._elements = elements;
        }
        return this._elements;
    }

    /**
     * Get the string representation of this JSON array.
     */
    public toString(): string {
        return qub.getCombinedText(this._segments);
    }

    /**
     * Get how many characters make up this JSON array.
     */
    public getLength(): number {
        return qub.getContiguousLength(this._segments);
    }

    /**
     * Get the formatted (pretty-printed) string representation of this JSON array.
     */
    public format(): string {
        let result: string = "";

        let previousSegment: Segment;
        for (const segment of this._segments) {
            if (segment instanceof Token) {
                switch (segment.getType()) {
                    case TokenType.NewLine:
                    case TokenType.LeftSquareBracket:
                    case TokenType.RightSquareBracket:
                    case TokenType.Comma:
                        result += segment.toString();
                        previousSegment = segment;
                        break;

                    case TokenType.Whitespace:
                        break;

                    default:
                        if (previousSegment instanceof Token && previousSegment.getType() === TokenType.NewLine) {
                            result += "  ";
                        }
                        else if (!(previousSegment instanceof Token) || previousSegment.getType() !== TokenType.LeftSquareBracket) {
                            result += " ";
                        }

                        result += segment.toString();
                        previousSegment = segment;
                        break;
                }
            }
            else {
                if (previousSegment instanceof Token && previousSegment.getType() === TokenType.NewLine) {
                    result += "  ";
                }

                result += segment.format();
                previousSegment = segment;
            }
        }

        return result;
    }
}

/**
 * A parsed JSON document.
 */
export class Document {
    constructor(private _segments: qub.Iterable<Segment>) {
    }

    /**
     * Get the root Segment of this JSON document.
     */
    public getRoot(): Segment {
        return !this._segments ? undefined : this._segments.first((segment: Segment) =>
            segment instanceof ObjectSegment ||
            segment instanceof ArraySegment ||
            (segment instanceof Token &&
                segment.getType() !== TokenType.NewLine &&
                segment.getType() !== TokenType.Whitespace));
    }

    /**
     * Get the formatted (or pretty-printed) JSON document's contents.
     */
    public format(): string {
        let result: string = "";

        if (this._segments) {
            for (const segment of this._segments) {
                result += segment.format();
            }
        }

        return result;
    }

    /**
     * Get the string representation of this JSON document.
     */
    public toString(): string {
        return qub.getCombinedText(this._segments);
    }

    /**
     * Get the number of characters in this JSON document.
     */
    public getLength(): number {
        return qub.getContiguousLength(this._segments);
    }
}

export function skipWhitespace(tokenizer: Tokenizer, values: Segment[]): void {
    while (tokenizer.hasCurrent() && tokenizer.getCurrent().getType() === TokenType.Whitespace) {
        values.push(tokenizer.getCurrent());
        tokenizer.next();
    }
}

/**
 * Parse a JSON Property from the provided Tokenizer. The Tokenizer's current segment must be a
 * QuotedString segment.
 */
export function parseProperty(tokenizer: Tokenizer, issues?: qub.List<qub.Issue>): Property {
    const propertyName: Token = tokenizer.getCurrent();
    const propertyValues: Segment[] = [propertyName];
    tokenizer.next();

    skipWhitespace(tokenizer, propertyValues);

    if (!tokenizer.hasCurrent()) {
        addIssue(issues, qub.Error(`Missing colon (":").`, propertyName.span));
    }
    else {
        const colon: Token = tokenizer.getCurrent();
        if (colon.getType() !== TokenType.Colon) {
            addIssue(issues, qub.Error(`Expected colon (":").`, colon.span));
        }
        else {
            propertyValues.push(colon);
            tokenizer.next();

            skipWhitespace(tokenizer, propertyValues);

            if (!tokenizer.hasCurrent()) {
                addIssue(issues, qub.Error(`Missing property value.`, colon.span));
            }
            else {
                const propertyValueFirstToken: Token = tokenizer.getCurrent();
                switch (propertyValueFirstToken.getType()) {
                    case TokenType.False:
                    case TokenType.True:
                    case TokenType.Null:
                    case TokenType.QuotedString:
                    case TokenType.Number:
                        propertyValues.push(propertyValueFirstToken);
                        tokenizer.next();
                        break;

                    case TokenType.LeftCurlyBracket:
                        propertyValues.push(parseObject(tokenizer, issues));
                        break;

                    case TokenType.LeftSquareBracket:
                        propertyValues.push(parseArray(tokenizer, issues));
                        break;

                    default:
                        addIssue(issues, qub.Error(`Expected property value.`, propertyValueFirstToken.span));
                        break;
                }
            }
        }
    }

    return new Property(propertyValues);
}

/**
 * Parse a JSON ObjectSegment from the provided Tokenizer. The Tokenizer's current segment must be a
 * LeftCurlyBracket token.
 */
export function parseObject(tokenizer: Tokenizer, issues: qub.List<qub.Issue>): ObjectSegment {
    const leftCurlyBracket: Token = tokenizer.getCurrent();
    const objectSegments = new qub.ArrayList<Segment>([leftCurlyBracket]);
    tokenizer.next();

    let rightCurlyBracket: Token;
    let hasProperty: boolean = false;
    let propertyNameAllowed: boolean = true;
    let commaAllowed: boolean = false;
    let rightCurlyBracketAllowed: boolean = true;
    while (!rightCurlyBracket && tokenizer.hasCurrent()) {
        const currentToken: Token = tokenizer.getCurrent();

        switch (currentToken.getType()) {
            case TokenType.QuotedString:
                if (!propertyNameAllowed) {
                    addIssue(issues, qub.Error(`Expected comma (",") or closing right curly bracket ("}").`, currentToken.span));
                }

                objectSegments.add(parseProperty(tokenizer, issues));

                propertyNameAllowed = false;
                commaAllowed = true;
                rightCurlyBracketAllowed = true;
                break;

            case TokenType.RightCurlyBracket:
                objectSegments.add(currentToken);
                rightCurlyBracket = currentToken;
                if (!rightCurlyBracketAllowed) {
                    addIssue(issues, qub.Error(`Expected property name.`, currentToken.span));
                }
                tokenizer.next();
                break;

            case TokenType.NewLine:
            case TokenType.Whitespace:
            case TokenType.LineComment:
            case TokenType.BlockComment:
                objectSegments.add(currentToken);
                tokenizer.next();
                break;

            case TokenType.Comma:
                objectSegments.add(currentToken);
                if (!commaAllowed) {
                    if (!rightCurlyBracketAllowed) {
                        addIssue(issues, qub.Error(`Expected property name.`, currentToken.span));
                    }
                    else {
                        addIssue(issues, qub.Error(`Expected property name or closing right curly bracket ("}").`, currentToken.span));
                    }
                }
                propertyNameAllowed = true;
                commaAllowed = false;
                rightCurlyBracketAllowed = false;
                tokenizer.next();
                break;

            default:
                objectSegments.add(currentToken);
                if (propertyNameAllowed) {
                    if (rightCurlyBracketAllowed) {
                        addIssue(issues, qub.Error(`Expected property name or closing right curly bracket ("}").`, currentToken.span));
                    }
                    else {
                        addIssue(issues, qub.Error(`Expected property name.`, currentToken.span));

                        // If I get an unexpected segment after a comma, then allow a right
                        // curly bracket for the next segment.
                        rightCurlyBracketAllowed = true;
                    }
                }
                else {
                    addIssue(issues, qub.Error(`Expected comma (",") or closing right curly bracket ("}").`, currentToken.span));
                }
                tokenizer.next();
                break;
        }
    }

    if (!rightCurlyBracket) {
        addIssue(issues, qub.Error(`Missing closing right curly bracket ("}").`, leftCurlyBracket.span));
    }

    return new ObjectSegment(objectSegments);
}

export function parseArray(tokenizer: Tokenizer, issues: qub.List<qub.Issue>): ArraySegment {
    const leftSquareBracket: Token = tokenizer.getCurrent();
    const arraySegments = new qub.ArrayList<Segment>([leftSquareBracket]);
    tokenizer.next();

    let rightSquareBracket: Token = null;
    let rightSquareBracketAllowed: boolean = true;
    let arrayElementAllowed: boolean = true;
    let commaAllowed: boolean = false;
    while (!rightSquareBracket && tokenizer.hasCurrent()) {
        const currentToken: Token = tokenizer.getCurrent();
        switch (currentToken.getType()) {
            case TokenType.Null:
            case TokenType.True:
            case TokenType.False:
            case TokenType.QuotedString:
            case TokenType.Number:
                if (!arrayElementAllowed) {
                    addIssue(issues, qub.Error(`Expected comma (",") or closing right square bracket ("]").`, currentToken.span));
                }

                arraySegments.add(currentToken);
                tokenizer.next();

                arrayElementAllowed = false;
                commaAllowed = true;
                rightSquareBracketAllowed = true;
                break;

            case TokenType.LeftCurlyBracket:
                if (!arrayElementAllowed) {
                    addIssue(issues, qub.Error(`Expected comma (",") or closing right square bracket ("]").`, currentToken.span));
                }

                arraySegments.add(parseObject(tokenizer, issues));

                arrayElementAllowed = false;
                commaAllowed = true;
                rightSquareBracketAllowed = true;
                break;

            case TokenType.LeftSquareBracket:
                if (!arrayElementAllowed) {
                    addIssue(issues, qub.Error(`Expected comma (",") or closing right square bracket ("]").`, currentToken.span));
                }

                arraySegments.add(parseArray(tokenizer, issues));

                arrayElementAllowed = false;
                commaAllowed = true;
                rightSquareBracketAllowed = true;
                break;

            case TokenType.Comma:
                if (!commaAllowed) {
                    if (rightSquareBracketAllowed) {
                        addIssue(issues, qub.Error(`Expected array element or closing right square bracket ("]").`, currentToken.span));
                    }
                    else {
                        addIssue(issues, qub.Error(`Expected array element.`, currentToken.span));
                    }
                }

                arraySegments.add(currentToken);
                tokenizer.next();

                arrayElementAllowed = true;
                commaAllowed = false;
                rightSquareBracketAllowed = false;
                break;

            case TokenType.RightSquareBracket:
                if (!rightSquareBracketAllowed) {
                    addIssue(issues, qub.Error(`Expected array element.`, currentToken.span));
                }

                rightSquareBracket = currentToken;
                arraySegments.add(rightSquareBracket);
                tokenizer.next();
                break;

            case TokenType.NewLine:
            case TokenType.Whitespace:
            case TokenType.LineComment:
            case TokenType.BlockComment:
                arraySegments.add(currentToken);
                tokenizer.next();
                break;

            default:
                if (arrayElementAllowed) {
                    if (rightSquareBracketAllowed) {
                        addIssue(issues, qub.Error(`Expected array element or closing right square bracket ("]").`, currentToken.span));
                    }
                    else {
                        addIssue(issues, qub.Error(`Expected array element.`, currentToken.span));
                    }
                }
                else {
                    addIssue(issues, qub.Error(`Expected comma (",") or closing right square bracket ("]").`, currentToken.span));
                }

                arraySegments.add(currentToken);
                tokenizer.next();

                arrayElementAllowed = false;
                commaAllowed = true;
                rightSquareBracketAllowed = true;
                break;
        }
    }

    if (!rightSquareBracket) {
        addIssue(issues, qub.Error(`Missing closing right square bracket ("]").`, leftSquareBracket.span));
    }

    return new ArraySegment(arraySegments);
}

export function parseSegment(tokenizer: Tokenizer, issues: qub.List<qub.Issue>): Segment {
    let result: Segment;

    switch (tokenizer.getCurrent().getType()) {
        case TokenType.LeftCurlyBracket:
            result = parseObject(tokenizer, issues);
            break;

        case TokenType.LeftSquareBracket:
            result = parseArray(tokenizer, issues);
            break;

        default:
            result = tokenizer.getCurrent();
            tokenizer.next();
            break;
    }

    return result;
}

/**
 * Parse the provided document text into a parsed JSON Document.
 * @param text The document text to parse.
 * @param issues The list where issues will be added if any are found while parsing.
 */
export function parse(text: string, issues: qub.List<qub.Issue>): Document {
    const documentSegments = new qub.ArrayList<Segment>();

    const tokenizer = new Tokenizer(text, 0, issues);
    tokenizer.next();

    let foundRootSegment: boolean = false;
    while (tokenizer.hasCurrent()) {
        const segment: Segment = parseSegment(tokenizer, issues);
        documentSegments.add(segment);

        if (segment instanceof ObjectSegment ||
            segment instanceof ArraySegment) {
            if (!foundRootSegment) {
                foundRootSegment = true;
            }
            else {
                addIssue(issues, qub.Error(`Expected end of file.`, segment.span));
            }
        }
        else {
            const token: Token = segment as Token;
            switch (token.getType()) {
                case TokenType.NewLine:
                case TokenType.Whitespace:
                    break;

                default:
                    if (!foundRootSegment) {
                        foundRootSegment = true;
                    }
                    else {
                        addIssue(issues, qub.Error(`Expected end of file.`, segment.span));
                    }
                    break;
            }
        }
    }

    return new Document(documentSegments);
}
function iterator(text) {
  let pos = 0,
    length = text.length;

  this.peek = function(num) {
    num = num || 0;

    if (pos + num >= length) {
      return null;
    }

    return text.charAt(pos + num);
  };

  this.next = function(inc) {
    inc = inc || 1;
    if (pos >= length) {
      return null;
    }
    return text.charAt((pos += inc) - inc);
  };

  this.pos = function() {
    return pos;
  };
}

const rWhitespace = /\s/;

function isWhitespace(chr) {
  return rWhitespace.test(chr);
}

function consumeWhiteSpace(iter) {
  const start = iter.pos();
  while (isWhitespace(iter.peek())) {
    iter.next();
  }

  return { type: 'whitespace', start: start, end: iter.pos() };
}

function startsComment(chr) {
  return chr === '!' || chr === '#';
}

function isEOL(chr) {
  return chr == null || chr === '\n' || chr === '\r';
}

function consumeComment(iter) {
  const start = iter.pos();
  while (!isEOL(iter.peek())) {
    iter.next();
  }
  return { type: 'comment', start: start, end: iter.pos() };
}

function startsKeyVal(chr) {
  return !isWhitespace(chr) && !startsComment(chr);
}

function startsSeparator(chr) {
  return chr === '=' || chr === ':' || isWhitespace(chr);
}

function startsEscapedVal(chr) {
  return chr === '\\';
}

function consumeEscapedVal(iter) {
  const start = iter.pos();
  iter.next(); // move past "\"
  let curChar = iter.next();
  if (curChar === 'u') {
    iter.next(4); // Read in the 4 hex values
  }

  return { type: 'escaped-value', start: start, end: iter.pos() };
}

function consumeKey(iter) {
  const start = iter.pos(),
    children = [];

  let curChar;

  while ((curChar = iter.peek()) !== null) {
    if (startsSeparator(curChar)) {
      break;
    }

    if (startsEscapedVal(curChar)) {
      children.push(consumeEscapedVal(iter));
      continue;
    }
    iter.next();
  }

  return { type: 'key', start: start, end: iter.pos(), children: children };
}

function consumeKeyValSeparator(iter) {
  const start = iter.pos();

  let seenHardSep = false,
    curChar;

  while ((curChar = iter.peek()) !== null) {
    if (isEOL(curChar)) {
      break;
    }

    if (isWhitespace(curChar)) {
      iter.next();
      continue;
    }

    if (seenHardSep) {
      break;
    }

    seenHardSep = curChar === ':' || curChar === '=';

    if (seenHardSep) {
      iter.next();
      continue;
    }

    break; // curChar is a non-separtor char
  }

  return { type: 'key-value-separator', start: start, end: iter.pos() };
}
function startsLineBreak(iter) {
  return iter.peek() === '\\' && isEOL(iter.peek(1));
}

function consumeLineBreak(iter) {
  const start = iter.pos();
  iter.next(); // consume \

  if (iter.peek() === '\r') {
    iter.next();
  }

  iter.next(); // consume \n

  let curChar;

  while ((curChar = iter.peek()) !== null) {
    if (isEOL(curChar)) {
      break;
    }
    if (!isWhitespace(curChar)) {
      break;
    }
    iter.next();
  }

  return { type: 'line-break', start: start, end: iter.pos() };
}

function consumeVal(iter) {
  const start = iter.pos(),
    children = [];

  let curChar;

  while ((curChar = iter.peek()) !== null) {
    if (startsLineBreak(iter)) {
      children.push(consumeLineBreak(iter));
      continue;
    }

    if (startsEscapedVal(curChar)) {
      children.push(consumeEscapedVal(iter));
      continue;
    }

    if (isEOL(curChar)) {
      break;
    }

    iter.next();
  }

  return { type: 'value', start: start, end: iter.pos(), children: children };
}

function consumeKeyVal(iter) {
  return {
    type: 'key-value',
    start: iter.pos(),
    children: [consumeKey(iter), consumeKeyValSeparator(iter), consumeVal(iter)],
    end: iter.pos()
  };
}

const renderChild = {
  'escaped-value': function(child, text) {
    const type = text.charAt(child.start + 1);
    if (type === 't') {
      return '\t';
    }
    if (type === 'r') {
      return '\r';
    }
    if (type === 'n') {
      return '\n';
    }
    if (type === 'f') {
      return '\f';
    }
    if (type !== 'u') {
      return type;
    }
    return String.fromCharCode(parseInt(text.substr(child.start + 2, 4), 16));
  },
  'line-break': function(child, text) {
    return '';
  }
};

function rangeToBuffer(range, text) {
  let start = range.start,
    buffer = [];

  for (let i = 0; i < range.children.length; i++) {
    const child = range.children[i];
    buffer.push(text.substring(start, child.start));
    buffer.push(renderChild[child.type](child, text));
    start = child.end;
  }

  buffer.push(text.substring(start, range.end));

  return buffer;
}

function rangesToObject(ranges, text) {
  const obj = Object.create(null); // Creates to a true hash map

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];

    if (range.type !== 'key-value') {
      continue;
    }

    const key = rangeToBuffer(range.children[0], text).join('');
    const val = rangeToBuffer(range.children[2], text).join('');

    obj[key] = val;
  }

  return obj;
}

function stringToRanges(text) {
  const iter = new iterator(text),
    ranges = [];

  let curChar;

  while ((curChar = iter.peek()) !== null) {
    if (isWhitespace(curChar)) {
      ranges.push(consumeWhiteSpace(iter));
      continue;
    }

    if (startsComment(curChar)) {
      ranges.push(consumeComment(iter));
      continue;
    }

    if (startsKeyVal(curChar)) {
      ranges.push(consumeKeyVal(iter));
      continue;
    }

    throw Error("Something crazy happened. text: '" + text + "'; curChar: '" + curChar + "'");
  }
  return ranges;
}

export function parse(text) {
  text = text.toString();

  const ranges = stringToRanges(text);

  return rangesToObject(ranges, text);
}

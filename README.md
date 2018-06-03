# BrowserStorage
With this small library, you can store any values in the browser, ***not just strings***. It uses `localStorage`/`sessionStorage` by default and cookies as fallback. It automatically converts **numbers, booleans, JSON objects, dates** and the values **null** and **undefined** into string representations and converts them back when they're queried:

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [Custom types](#custom-types)
- [Events](#events)
- [Compression](#compression)

## Installation

Include the script somewhere in your html file:

```html
<script type="text/javascript" src="browserStorage.js"></script>
```

## Usage

```javascript
// myValues is the localStorage entry/cookie under which everything is stored.
// if the 2nd parameter is true, sessionStorage or a session cookie is used instead
var storage = BrowserStorage("myValues", false); // don't use 'new'

storage.set("hello", "world")
       .set("time", new Date())
       .set("myNumber", 18)
       .set("optional", null)

storage.get("hello")                 // "world"
storage.get("time")                  // [Date object]
storage.get("myNumber")              // 18
storage.getOrDefault("optional", 5)  // null
storage.getOrDefault("unknown", 5)   // 5
```

More functions:

```javascript
storage.getOrElse("unset", function(key) {
  console.log(key + " does not exist!");
})                           // Returns a value; if it doesn't exist, calls a function

storage.forEach(function(key, value) {
  //do something
})                           // Iterates over all entries; chainable

storage.remove("no value")   // Removes 1 entry; chainable
storage.clear()              // Removes everything; chainable

storage.length()             // Returns the number of entries
storage.isEmpty()            // Returns whether or not the storage is empty
```

## Custom types

Sometimes you might want to store other data types than the predefined ones, and JSON doesn't suffice. Here's a simple example:

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        toString() {
            return this.x + "," + this.y;
        }
        static fromString(s) {
            s = s.split(",");
            return new Point(+s[0], +s[1]);
        }
    }

To be able to store `Point`s in the storage, you have to tell BrowserStorage how to (de)serialize them:

    storage.addType(50, Point, p => p.toString(), Point.fromString);

This method requires the following parameters:

1. A unique ID >= 50
2. The constructor of the type. The constructor's name must be unique
3. A serializer function that returns a string
4. A deserializer function that returns the original value when given a string

## Events

BrowserStorage triggers an event when the storage is modified **in a different browser tab**. This only works in browsers that support `localStorage`/`sessionStorage`.

To add or remove an event listener, use `addListener(callback)` or `removeListener(callback)`:

```javascript
storage.addListener(function(e) {
   // update view, etc.
});
```

If `localStorage`/`sessionStorage` is supported by the browser, these events are triggered _immediately_. Otherwise, they are triggered up to 500 milliseconds late, because BrowserStorage has to check every half second if there was a modification.


## Compression

<table><tr><td>

**Warning**: Sometimes LZMA-compressed data stored in Firefox gets corrupted after a restart. This is due to a bug described here: https://github.com/pieroxy/lz-string/issues/59. I don't know if this is still an issue in the latest Firefox version, still you should disable compression in Firefox or use a weaker compression method with readable output.

</td></tr></table>

Since `localStorage` and `sessionStorage` are limited to 5 MB, it can be necessary to **compress** the stored data. With BrowserStorage, it's very easy -- just include `browserStorageCompression.js` and `lz-string by pieroxy.min.js` in your html:

```html
<script type="text/javascript" src="browserStorageCompression.js"></script>
<script type="text/javascript" src="lz-string by pieroxy.min.js"></script>
```

To use the compression algorithm:

```javascript
// the last two arguments are the functions that compress/decompress a string
var storage = BrowserStorage("myValues", false, LZString.compress, LZString.decompress);
```

The file `lz-string by pieroxy.min.js` is a copy from pieroxy's <a href="https://github.com/pieroxy/lz-string">GitHub page</a>.

You can use another compression library instead, but some features are only supported incombination with LZString.

# BrowserStorage
With this small library, you can store any values in the browser, ***not just strings***. It uses `localStorage`/`sessionStorage` by default and cookies as fallback. It automatically converts **numbers, booleans, JSON objects, dates** and the values **null** and **undefined** into string representations and converts them back when they're queried:

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

## TODO

* Find out why decompressed strings sometimes contain mistakes
* Make use LZString's `compressToEncodedURIComponent()` function

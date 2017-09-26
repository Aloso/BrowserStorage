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
       .set("no value", null)

storage.get("hello")         // "world"
storage.get("time")          // [Date object]
storage.get("myNumber")      // 18
storage.get("no value")      // null
storage.get("unset")         // null
```

When `null` is returned, we don't know if the value is missing or is actually `null`. However, we can check:

```javascript
storage.contains("no value") // true
storage.contains("unset")    // false
```

Usually a better way to do this is to use `getOrDefault`:

```javascript
storage.getOrDefault("no value", "foo") // null
storage.getOrDefault("unset", "foo")    // "foo"
```

Here are some more useful functions:

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

Note: You can use multiple _BrowserStorage_ instances on one website, if you name them differently. Clearing one storage does not affect the others.

## Events

When the storage was modified in a different tab, browsers that support `localStorage` and `sessionStorage` trigger a `storage` event. BrowserStorage instances listen to the events and check if their storage is affected. If it is, they execute all registered event listeners.

To add or remove an event listener, use the functions `addListener(callback)` and `removeListener(callback)`:

```javascript
storage.addListener(function(e) {
   // update view, etc.
   console.log("Storage modified! New value: " + storage.getOrDefault("foo", "bar"));
});
```

## Compression

Since `localStorage` and `sessionStorage` are limited to 5 MB, it can be necessary to **compress** the stored data. To do that, include `browserStorageCompression.min.js` and `lz-string by pieroxy.min.js` in your html:

```html
<script type="text/javascript" src="browserStorageCompression.min.js"></script>
<script type="text/javascript" src="lz-string by pieroxy.min.js"></script>
```

To use the compression algorithm:

```javascript
// the last two arguments are the functions that compress/decompress a string
var storage = BrowserStorage("myValues", false, LZString.compress, LZString.decompress);
```

Note: In cookie mode, compression is disabled: Cookies are encoded with `encodeURIComponent()`, and this would cancel out the compression.

The file `lz-string by pieroxy.min.js` is a copy from pieroxy's <a href="https://github.com/pieroxy/lz-string">GitHub page</a>.

If you want, you can use another compression library instead, if it compiles strings into strings.

## Cookies, Caching and Concurrency

BrowserStorage caches all changes internally, which makes accessing values a lot faster. The problem here is that the cache might not be up to date if **cookies** are used and the storage is accessed from **multiple tabs**.

Here is a list of all BrowserStorage functions that use cached values by default:

  * `get(key)`
  * `getOrDefault(key, defaultVal)`
  * `getOrElse(key, callback)`
  * `forEach(callback)`
  * `contains()`
  * `isEmpty()`
  * `length()`

Each of these functions has an additional, optional argument `disableCache`. Setting it to `true` makes sure that the cache is updated and the returned value is up to date:

```javascript
var len = storage.length(true);
var str = storage.get("foo");   // Here, disableCache is not necessary
                                // because the cache has already been updated
```

Another possibility is to update the cache periodically:

```javascript
setInterval(function() {
    storage.contains("", true); // update the cache every 2 seconds
}, 1000);
```

**Data loss** due to concurrent modifications is not possible: The functions `set(key,value)`, `remove(key)` and `clear()` always update the cache before modifying the storage.

### Advice

Don't update the cache too often where performance is critical, especially if compression is enabled! From my experience, it is not important that the storage is up to date in most cases.

Apart from that, all modern browser support `localStorage` and `sessionStorage`, so BrowserStorage is _always_ up to date thanks to `storage` events.

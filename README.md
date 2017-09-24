# BrowserStorage
Store values of any type in a client that supports localStorage/sessionStorage or cookies

This library makes it possible to store values in the browser. It uses `localStorage`/`sessionStorage` by default and cookies as fallback. It automatically converts **numbers, booleans, JSON objects, dates** and the values **null** and **undefined** into string representations and converts them back when they're queried:

```javascript
// myValues is the localStorage entry/cookie under which everything is stored.
// if the 2nd parameter is true, sessionStorage or a session cookie is used instead
var storage = new BrowserStorage("myValues", false);

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

A better way to do this is to use `getOrDefault`:

```javascript
storage.getOrDefault("no value", "foo") // null
storage.getOrDefault("unset", "foo")    // "foo"
```

Here are some more useful functions:

```javascript
storage.forEach(function(key, value) {
  //do something
})                           // Iterates over all entries; chainable

storage.remove("no value")   // Removes 1 entry; chainable
storage.clear()              // Removes everything; chainable

storage.length()             // Returns the number of entries
storage.isEmpty()            // Returns whether or not the storage is empty
```

Note: You can use multiple `BrowserStorage` instances on one website, if you name them differently. Clearing one storage does not affect the others.


// noinspection JSUnusedGlobalSymbols
/**
 * @param {string} label
 * @param {boolean} deleteWhenBrowserCloses
 * @return {{
 *      get: function(string, boolean=false),
 *      getOrDefault: function(string, *, boolean=false),
 *      getOrElse: function(string, function(string), boolean=false),
 *      forEach: function(function(string, *, boolean=false)),
 *      contains: function(boolean=false),
 *      set: function(string, *),
 *      remove: function(string),
 *      clear: function(),
 *      isEmpty: function(boolean=false),
 *      length: function(boolean=false),
 *      addListener: function(function(Event)),
 *      removeListener: function(function(Event))
 * }}
 */
function BrowserStorage(label, deleteWhenBrowserCloses) {
    var datatypes = {};
    var datatypeMap = {};
    var datatypeArr = [];
    var datatypesPool = 32;
    
    var values = {};
    var valueString = "";
    var valueNumber = 0;
    
    var percent = /%/g;
    var percentP = /%p/g;
    
    function isEmpty(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop)) {
                valueNumber = 0;
                return false;
            }
        }
        return true;
    }
    
    function stringToObj(str) {
        if (str === "") return {};
        var strings = str.split("%a");
        valueNumber = strings.length;
        var res = {};
        var tuple;
        for (var i = 0; i < strings.length; i++) {
            tuple = strings[i].split("%b");
            res[tuple[0].replace(percentP, "%")] = (tuple[1] || "").replace(percentP, "%");
        }
        return res;
    }
    function objToString(obj) {
        var res = [];
        var n = 0;
        for (var k in obj) if (obj.hasOwnProperty(k)) {
            n++;
            res.push(k.replace(percent, "%p") + "%b" + obj[k].replace(percent, "%p"));
        }
        valueNumber = n;
        return res.join("%a");
    }
    
    /**
     * @param {function} type
     * @param {function} serializer
     * @param {function} deserializer
     * @param {String} [id]
     */
    function addDataType(type, serializer, deserializer, id) {
        if (typeof type !== 'function' || typeof serializer !== 'function' || typeof deserializer !== 'function') {
            var badType = typeof type !== 'function' ? typeof type :
                    typeof serializer !== 'function' ? typeof serializer : typeof deserializer;
            throw new Error("TypeError: expected type function, found " + badType);
        }
        var c = id == null ? String.fromCharCode(++datatypesPool) : id;
        datatypes[c] = [serializer, deserializer];
        // noinspection JSUnresolvedVariable
        datatypeMap[type.name] = c;
        datatypeArr.push(type);
    }
    
    /**
     * @param {*} type
     * @param {function} serializer
     * @param {function} deserializer
     */
    function addPrimitiveDataType(type, serializer, deserializer) {
        var c = String.fromCharCode(++datatypesPool);
        datatypes[c] = [serializer, deserializer];
        // noinspection JSUnresolvedVariable
        datatypeMap["" + type] = c;
        datatypeArr.push("" + type);
    }
    
    addPrimitiveDataType("undefined",
            function serialize() {return "undefined";},
            function deserialize() {return undefined;});
    addPrimitiveDataType("null",
            function serialize() {return "null";},
            function deserialize() {return null;});
    addDataType(String,
            function serialize(string) {return string;},
            function deserialize(string) {return string;});
    addDataType(Number,
            function serialize(num) {return "" + num;},
            function deserialize(string) {return +string;});
    addDataType(Boolean,
            function serialize(b) {return "" + b;},
            function deserialize(string) {return string === "true";});
    addDataType(Object,
            function serialize(obj) {return JSON.stringify(obj);},
            function deserialize(string) {return JSON.parse(string);});
    addDataType(Date,
            function serialize(date) {return +date;},
            function deserialize(string) {return new Date(+string);});
    
    /**
     * @param {*} obj
     * @return {string}
     */
    function serializeData(obj) {
        var c;
        if (datatypeMap[obj]) {
            c = datatypeMap["" + obj];
            return c + datatypes[c][0](obj);
        } else if (obj.constructor && obj.constructor.name && datatypeMap[obj.constructor.name]) {
            c = datatypeMap[obj.constructor.name];
            return c + datatypes[c][0](obj);
        } else {
            // because of class inheritance, the first attempt might not be successful
            for (var i = 0; i < datatypeArr.length; i++) {
                if (typeof datatypeArr[i] === "function" && obj instanceof datatypeArr[i]) {
                    var fn = datatypeArr[i];
                    c = datatypeMap[fn.name];
                    return c + datatypes[c][0](obj);
                }
            }
            throw new Error("Missing serializer for object " + obj + " (type " + (typeof obj) + ")");
        }
    }
    
    /**
     * @param {string} string
     * @return {*}
     */
    function deserializeData(string) {
        if (string[0]) {
            var c = string[0];
            var s = string.substring(1);
            if (datatypes[c]) {
                return datatypes[c][1](s);
            } else {
                throw new Error("Missing deserializer for string \"" + string + "\"");
            }
        } else {
            return "";
        }
    }
    
    function cbAddEventListener(obj, evt, fnc) {
        if (obj.addEventListener) {
            // W3C model
            obj.addEventListener(evt, fnc, false);
            return true;
        } else if (obj.attachEvent) {
            // Microsoft model
            return obj.attachEvent('on' + evt, fnc);
        } else {
            // Browser don't support W3C or MSFT model, go on with traditional
            evt = 'on'+evt;
            if (typeof obj[evt] === 'function') {
                // Object already has a function on traditional
                // Let's wrap it with our own function inside another function
                fnc = (function(f1, f2){
                    return function() {
                        f1.apply(this, arguments);
                        f2.apply(this, arguments);
                    }
                })(obj[evt], fnc);
            }
            obj[evt] = fnc;
            return true;
        }
    }
    
    var changeListeners = [];
    
    /**
     * @type {Storage|{
         *      getItem: function(string),
         *      setItem: function(string, string),
         *      removeItem: function(string),
         *      clear: function(string)
         * }}
     */
    var storageObject;
    
    if (window.localStorage && !deleteWhenBrowserCloses) {
        storageObject = window.localStorage;
        
        cbAddEventListener(window, "storage", function (e) {
            if (e.key === label) {
                valueString = storageObject.getItem(label) || "";
                values = stringToObj(valueString);
                for (var i = 0; i < changeListeners.length; i++) changeListeners[i](e);
            }
        });
    } else if (window.sessionStorage && deleteWhenBrowserCloses) {
        storageObject = window.sessionStorage;
    
        cbAddEventListener(window, "storage", function (e) {
            if (e.key === label) {
                valueString = storageObject.getItem(label) || "";
                values = stringToObj(valueString);
                for (var i = 0; i < changeListeners.length; i++) changeListeners[i](e);
            }
        });
    } else {
        var expires = deleteWhenBrowserCloses ? "" : ";expires=" + new Date(+new Date() + 30758400000);
        
        storageObject = {
            getItem: function (key) {
                if (document.cookie.length > 0) {
                    var c_start = document.cookie.indexOf(key + "=");
                    if (c_start !== -1) {
                        c_start = c_start + key.length + 1;
                        var c_end = document.cookie.indexOf(";", c_start);
                        if (c_end === -1) {
                            c_end = document.cookie.length;
                        }
                        return decodeURIComponent(document.cookie.substring(c_start, c_end));
                    }
                }
                return "";
            },
            setItem: function (key, value) {
                document.cookie =  key + "=" + encodeURIComponent(value) + expires + "; path=/";
            },
            removeItem: function (key) {
                document.cookie = key + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            },
            clear: function () {
                var cookies = document.cookie.split(";");
                
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    var eqPos = cookie.indexOf("=");
                    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
                }
            }
        };
    
        setInterval(function () {
            var newStr = storageObject.getItem(label) || "";
            if (newStr !== valueString) {
                valueString = newStr;
                values = stringToObj(valueString);
                for (var i = 0; i < changeListeners.length; i++) changeListeners[i]();
            }
        }, 500);
    }
    
    var val = storageObject.getItem(label);
    if (val !== null) {
        valueString = val;
        values = stringToObj(valueString);
    }
    
    var res = {
        get: function (key, disableCache) {
            if (disableCache) {
                valueString = storageObject.getItem(label) || "";
                values = stringToObj(valueString);
            }
            if (key in values) {
                return deserializeData(values[key]);
            } else {
                return null;
            }
        },
        getOrDefault: function (key, defaultVal, disableCache) {
            if (disableCache) {
                valueString = storageObject.getItem(label) || "";
                values = stringToObj(valueString);
            }
            if (key in values) {
                return deserializeData(values[key]);
            } else {
                return defaultVal;
            }
        },
        getOrElse: function (key, callback, disableCache) {
            if (disableCache) {
                valueString = storageObject.getItem(label) || "";
                values = stringToObj(valueString);
            }
            if (key in values) {
                return deserializeData(values[key]);
            } else {
                return callback(key);
            }
        },
        
        forEach: function (callback, disableCache) {
            if (disableCache) {
                valueString = storageObject.getItem(label) || "";
                values = stringToObj(valueString);
            }
            for (var k in values) if (values.hasOwnProperty(k)) {
                callback(k, deserializeData(values[k]));
            }
            return res;
        },
        contains: function (key, disableCache) {
            if (disableCache) {
                valueString = storageObject.getItem(label) || "";
                values = stringToObj(valueString);
            }
            return key in values;
        },
        
        set: function (key, value) {
            valueString = storageObject.getItem(label) || "";
            values = stringToObj(valueString);
            
            var newValue = serializeData(value);
            if (key in values) {
                values[key] = newValue;
                valueString = objToString(values);
            } else if (valueString === "") {
                values = {};
                values[key] = newValue;
                valueString = objToString(values);
            } else {
                var tempObj = {};
                tempObj[key] = newValue;
                var oldLen = valueNumber;
                valueString += "%a" + objToString(tempObj);
                valueNumber = oldLen + 1;
                values[key] = newValue;
            }
            storageObject.setItem(label, valueString);
            return res;
        },
        remove: function (key) {
            valueString = storageObject.getItem(label) || "";
            values = stringToObj(valueString);
            
            if (key in values) {
                delete values[key];
                valueString = objToString(values);
                if (isEmpty(values)) {
                    storageObject.removeItem(label);
                } else {
                    storageObject.setItem(label, valueString);
                }
            }
            return res;
        },
        clear: function () {
            storageObject.removeItem(label);
            values = {};
            valueString = "";
            return res;
        },
        
        isEmpty: function (disableCache) {
            if (disableCache) {
                valueString = storageObject.getItem(label) || "";
                values = stringToObj(valueString);
            }
            return isEmpty(values);
        },
        length: function (disableCache) {
            if (disableCache) {
                valueString = storageObject.getItem(label) || "";
                values = stringToObj(valueString);
            }
            return valueNumber;
        },
        
        addListener: function (callback) {
            changeListeners.push(callback);
            return res;
        },
        removeListener: function (callback) {
            for (var i = 0; i < changeListeners.length; i++) {
                if (changeListeners[i] === callback) {
                    changeListeners.splice(i, 1);
                }
            }
            return res;
        },

        addType: function (identifier, type, serialize, deserialize) {
            if (isNaN(identifier) || identifier < 50) {
                throw new Error("Identifier must be a number >= 50");
            }
            if (datatypes[identifier]) {
                throw new Error("This ID is already in use");
            }
            addDataType(type, serialize, deserialize, String.fromCharCode(identifier));
        }
    };
    return res;
}
/**
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */
/*jslint nomen: true, evil: true, bitwise: true, emptyblock: true, unparam: true */
/*global window, XMLHttpRequest, require, console, DOMParser,
  process, __dirname, setTimeout, Packages, print,
  readFile, quit, Buffer, ArrayBuffer, Uint8Array,
  navigator, VBArray, alert, now, clearTimeout */
/**
 * Three implementations of a runtime for browser, node.js and rhino.
 */

/**
 * Abstraction of the runtime environment.
 * @class
 * @interface
 */
function Runtime() {"use strict"; }

/**
 * @param {!string} name
 * @return {*}
 */
Runtime.prototype.getVariable = function (name) { "use strict"; };

/**
 * @param {*} anything
 * @return {!string}
 */
Runtime.prototype.toJson = function (anything) { "use strict"; };

/**
 * @param {!string} jsonstr
 * @return {*}
 */
Runtime.prototype.fromJson = function (jsonstr) { "use strict"; };

/**
 * @param {!string} string
 * @param {!string} encoding
 * @return {!Uint8Array}
 */
Runtime.prototype.byteArrayFromString = function (string, encoding) {"use strict"; };
/**
 * @param {!Uint8Array} bytearray
 * @param {!string} encoding
 * @return {!string}
 */
Runtime.prototype.byteArrayToString = function (bytearray, encoding) {"use strict"; };
/**
 * Read part of a binary file.
 * @param {!string} path
 * @param {!number} offset
 * @param {!number} length
 * @param {!function(?string,?Uint8Array):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.read = function (path, offset, length, callback) {"use strict"; };
/**
 * Read the contents of a file. Returns the result via a callback. If the
 * encoding is 'binary', the result is returned as a Uint8Array,
 * otherwise, it is returned as a string.
 * @param {!string} path
 * @param {!string} encoding text encoding or 'binary'
 * @param {!function(?string,?(string|Uint8Array)):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.readFile = function (path, encoding, callback) {"use strict"; };
/**
 * Read a file completely, throw an exception if there is a problem.
 * @param {!string} path
 * @param {!string} encoding text encoding or 'binary'
 * @return {!string|!Uint8Array}
 */
Runtime.prototype.readFileSync = function (path, encoding) {"use strict"; };
/**
 * @param {!string} path
 * @param {!function(?string,?Document):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.loadXML = function (path, callback) {"use strict"; };
/**
 * @param {!string} path
 * @param {!Uint8Array} data
 * @param {!function(?string):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.writeFile = function (path, data, callback) {"use strict"; };
/**
 * @param {!string} path
 * @param {!function(boolean):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.isFile = function (path, callback) {"use strict"; };
/**
 * @param {!string} path
 * @param {!function(number):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.getFileSize = function (path, callback) {"use strict"; };
/**
 * @param {!string} path
 * @param {!function(?string):undefined} callback
 * @return {undefined}
 */
Runtime.prototype.deleteFile = function (path, callback) {"use strict"; };
/**
 * @param {!string} msgOrCategory
 * @param {!string=} msg
 * @return {undefined}
 */
Runtime.prototype.log = function (msgOrCategory, msg) {"use strict"; };
/**
 * @param {!function():undefined} callback
 * @param {!number} milliseconds
 * @return {!number}
 */
Runtime.prototype.setTimeout = function (callback, milliseconds) {"use strict"; };
/**
 * @param {!number} timeoutID
 * @return {undefined}
 */
Runtime.prototype.clearTimeout = function (timeoutID) {"use strict"; };
/**
 * @return {!Array.<string>}
 */
Runtime.prototype.libraryPaths = function () {"use strict"; };
/**
 * @return {string}
 */
Runtime.prototype.type = function () {"use strict"; };
/**
 * @return {?DOMImplementation}
 */
Runtime.prototype.getDOMImplementation = function () {"use strict"; };
/**
 * @param {!string} xml
 * @return {?Document}
 */
Runtime.prototype.parseXML = function (xml) {"use strict"; };
/**
 * @return {?Window}
 */
Runtime.prototype.getWindow = function () {"use strict"; };

/**
 * @param {!boolean} condition
 * @param {!string} message
 * @param {!function():undefined=} callback
 * @return {undefined}
 */
Runtime.prototype.assert = function (condition, message, callback) { "use strict"; };
/*jslint emptyblock: false, unparam: false */

/** @define {boolean} */
var IS_COMPILED_CODE = false;

/**
 * @this {Runtime}
 * @param {!Uint8Array} bytearray
 * @param {!string} encoding
 * @return {!string}
 */
Runtime.byteArrayToString = function (bytearray, encoding) {
    "use strict";
    /**
     * @param {!Uint8Array} bytearray
     * @return {!string}
     */
    function byteArrayToString(bytearray) {
        var s = "", i, l = bytearray.length;
        for (i = 0; i < l; i += 1) {
            s += String.fromCharCode(bytearray[i] & 0xff);
        }
        return s;
    }
    /**
     * @param {!Uint8Array} bytearray
     * @return {!string}
     */
    function utf8ByteArrayToString(bytearray) {
        var s = "", i, l = bytearray.length,
            chars = [],
            c0, c1, c2, c3, codepoint;

        for (i = 0; i < l; i += 1) {
            c0 = /**@type{!number}*/(bytearray[i]);
            if (c0 < 0x80) {
                chars.push(c0);
            } else {
                i += 1;
                c1 = /**@type{!number}*/(bytearray[i]);
                if (c0 >= 0xc2 && c0 < 0xe0) {
                    chars.push(((c0 & 0x1f) << 6) | (c1 & 0x3f));
                } else {
                    i += 1;
                    c2 = /**@type{!number}*/(bytearray[i]);
                    if (c0 >= 0xe0 && c0 < 0xf0) {
                        chars.push(((c0 & 0x0f) << 12) | ((c1 & 0x3f) << 6) | (c2 & 0x3f));
                    } else {
                        i += 1;
                        c3 = /**@type{!number}*/(bytearray[i]);
                        if (c0 >= 0xf0 && c0 < 0xf5) {
                            codepoint = ((c0 & 0x07) << 18) | ((c1 & 0x3f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f);
                            codepoint -= 0x10000;
                            chars.push((codepoint >> 10) + 0xd800, (codepoint & 0x3ff) + 0xdc00);
                        }
                    }
                }
            }
            if (chars.length === 1000) {
                s += String.fromCharCode.apply(null, chars);
                chars.length = 0;
            }
        }
        return s + String.fromCharCode.apply(null, chars);
    }
    var result;
    if (encoding === "utf8") {
        result = utf8ByteArrayToString(bytearray);
    } else {
        if (encoding !== "binary") {
            this.log("Unsupported encoding: " + encoding);
        }
        result = byteArrayToString(bytearray);
    }
    return result;
};

/**
 * @param {!string} name
 * @return {*}
 */
Runtime.getVariable = function (name) {
    "use strict";
    try {
    return eval(name);
    } catch (e) {
        return undefined;
    }
};

/**
 * @param {*} anything
 * @return {!string}
 */
Runtime.toJson = function (anything) {
    "use strict";
    return JSON.stringify(anything);
};

/**
 * @param {!string} jsonstr
 * @return {*}
 */
Runtime.fromJson = function (jsonstr) {
    "use strict";
    return JSON.parse(jsonstr);
};

/**
 * @param {!Function} f
 * @return {?string}
 */
Runtime.getFunctionName = function getFunctionName(f) {
    "use strict";
    var m;
    if (f.name === undefined) {
        m = new RegExp("function\\s+(\\w+)").exec(f);
        return m && m[1];
    }
    return f.name;
};
/**
 * @class
 * @constructor
 * @augments Runtime
 * @implements {Runtime}
 * @param {Element} logoutput
 */
function BrowserRuntime(logoutput) {
    "use strict";
    var self = this,
        /**@type{!Object.<!string|!Uint8Array>}*/
        cache = {};

    /**
     * @param {!string} string
     * @return {!Uint8Array}
     */
    function utf8ByteArrayFromString(string) {
        var l = string.length, bytearray, i, n, j = 0;
        // first determine the length in bytes
        for (i = 0; i < l; i += 1) {
            n = string.charCodeAt(i);
            j += 1 + (n > 0x80) + (n > 0x800);
        }
        // allocate a buffer and convert to a utf8 array
        bytearray = new Uint8Array(new ArrayBuffer(j));
        j = 0;
        for (i = 0; i < l; i += 1) {
            n = string.charCodeAt(i);
            if (n < 0x80) {
                bytearray[j] = n;
                j += 1;
            } else if (n < 0x800) {
                bytearray[j] = 0xc0 | (n >>>  6);
                bytearray[j + 1] = 0x80 | (n & 0x3f);
                j += 2;
            } else {
                bytearray[j] = 0xe0 | ((n >>> 12) & 0x0f);
                bytearray[j + 1] = 0x80 | ((n >>>  6) & 0x3f);
                bytearray[j + 2] = 0x80 |  (n         & 0x3f);
                j += 3;
            }
        }
        return bytearray;
    }
    /**
     * @param {!string} string
     * @return {!Uint8Array}
     */
    function byteArrayFromString(string) {
        // ignore encoding for now
        var l = string.length,
            a = new Uint8Array(new ArrayBuffer(l)),
            i;
        for (i = 0; i < l; i += 1) {
            a[i] = string.charCodeAt(i) & 0xff;
        }
        return a;
    }
    /**
     * @param {!string} string
     * @param {!string} encoding
     * @return {!Uint8Array}
     */
    this.byteArrayFromString = function (string, encoding) {
        var result;
        if (encoding === "utf8") {
            result = utf8ByteArrayFromString(string);
        } else {
            if (encoding !== "binary") {
                self.log("unknown encoding: " + encoding);
            }
            result = byteArrayFromString(string);
        }
        return result;
    };
    this.byteArrayToString = Runtime.byteArrayToString;

    /**
    * @param {!string} name
    * @return {*}
    */
    this.getVariable = Runtime.getVariable;


    /**
    * @param {!string} jsonstr
    * @return {*}
    */
    this.fromJson = Runtime.fromJson;
    /**
    * @param {*} anything
    * @return {!string}
    */
    this.toJson = Runtime.toJson;

    /**
     * @param {!string} msgOrCategory
     * @param {string=} msg
     * @return {undefined}
     */
    function log(msgOrCategory, msg) {
        var node, doc, category;
        if (msg !== undefined) {
            category = msgOrCategory;
        } else {
            msg = msgOrCategory;
        }
        if (logoutput) {
            doc = logoutput.ownerDocument;
            if (category) {
                node = doc.createElement("span");
                node.className = category;
                node.appendChild(doc.createTextNode(category));
                logoutput.appendChild(node);
                logoutput.appendChild(doc.createTextNode(" "));
            }
            node = doc.createElement("span");
            if (msg.length > 0 && msg[0] === "<") {
                node.innerHTML = msg;
            } else {
                node.appendChild(doc.createTextNode(msg));
            }
            logoutput.appendChild(node);
            logoutput.appendChild(doc.createElement("br"));
        } else if (console) {
            console.log(msg);
        }
        if (category === "alert") {
            alert(msg);
        }
    }

    /**
    * @param {!boolean} condition
    * @param {!string} message
    * @param {!function():undefined=} callback
    * @return {undefined}
    */
    function assert(condition, message, callback) {
        if (!condition) {
            log("alert", "ASSERTION FAILED:\n" + message);
            if (callback) {
                callback();
            }
			throw message; // interrupt execution and provide a backtrace
        }
    }
    /**
     * @param {!string} path
     * @param {!string} encoding
     * @param {!XMLHttpRequest} xhr
     * @return {!{err:?string,data:(?string|?Uint8Array)}}
     */
    function handleXHRResult(path, encoding, xhr) {
        var data, r;
        if (xhr.status === 0 && !xhr.responseText) {
            // for local files there is no difference between missing
            // and empty files, so empty files are considered as errors
            r = {err: "File " + path + " is empty.", data: null};
        } else if (xhr.status === 200 || xhr.status === 0) {
            // report file
            if (xhr.response && typeof xhr.response !== "string") {
               // w3c complaint way http://www.w3.org/TR/XMLHttpRequest2/#the-response-attribute
               if (encoding === "binary") {
                   data = /**@type{!ArrayBuffer}*/(xhr.response);
                   data = new Uint8Array(data);
               } else {
                   data = String(xhr.response);
               }
            } else if (encoding === "binary") {
               // fallback for some really weird browsers
               data = self.byteArrayFromString(xhr.responseText, "binary");
            } else {
               data = xhr.responseText;
            }
            cache[path] = data;
            r = {err: null, data: data};
        } else {
            // report error
            r = {err: xhr.responseText || xhr.statusText, data: null};
        }
        return r;
    }
    /**
     * @param {!string} path
     * @param {!string} encoding
     * @param {!boolean} async
     * @return {!XMLHttpRequest}
     */
    function createXHR(path, encoding, async) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', path, async);
        if (xhr.overrideMimeType) {
            if (encoding !== "binary") {
                xhr.overrideMimeType("text/plain; charset=" + encoding);
            } else {
                xhr.overrideMimeType("text/plain; charset=x-user-defined");
            }
        }
        return xhr;
    }
    /**
     * Read the contents of a file. Returns the result via a callback. If the
     * encoding is 'binary', the result is returned as a Uint8Array,
     * otherwise, it is returned as a string.
     * @param {!string} path
     * @param {!string} encoding text encoding or 'binary'
     * @param {!function(?string,?(string|Uint8Array)):undefined} callback
     * @return {undefined}
     */
    function readFile(path, encoding, callback) {
        if (cache.hasOwnProperty(path)) {
            callback(null, cache[path]);
            return;
        }
        var xhr = createXHR(path, encoding, true);
        function handleResult() {
            var r;
            if (xhr.readyState === 4) {
                r = handleXHRResult(path, encoding, xhr);
                callback(r.err, r.data);
            }
        }
        xhr.onreadystatechange = handleResult;
        try {
            xhr.send(null);
        } catch (/**@type{!Error}*/e) {
            callback(e.message, null);
        }
    }
    /**
     * @param {!string} path
     * @param {!number} offset
     * @param {!number} length
     * @param {!function(?string,?Uint8Array):undefined} callback
     * @return {undefined}
     */
    function read(path, offset, length, callback) {
        readFile(path, "binary", function (err, result) {
            var r = null;
            if (result) {
                if (typeof result === "string") {
                    throw "This should not happen.";
                }
                r = /**@type{!Uint8Array}*/(result.subarray(offset,
                                                            offset + length));
            }
            callback(err, r);
        });
    }
    /**
     * @param {!string} path
     * @param {!string} encoding text encoding or 'binary'
     * @return {!string|!Uint8Array}
     */
    function readFileSync(path, encoding) {
        var xhr = createXHR(path, encoding, false),
            r;
        try {
            xhr.send(null);
            r = handleXHRResult(path, encoding, xhr);
            if (r.err) {
                throw r.err;
            }
            if (r.data === null) {
                throw "No data read from " + path + ".";
            }
        } catch (/**@type{!Error}*/e) {
            throw e;
        }
        return r.data;
    }
    /**
     * @param {!string} path
     * @param {!Uint8Array} data
     * @param {!function(?string):undefined} callback
     * @return {undefined}
     */
    function writeFile(path, data, callback) {
        cache[path] = data;
        var xhr = new XMLHttpRequest(),
            /**@type{!string|!ArrayBuffer}*/
            d;
        function handleResult() {
            if (xhr.readyState === 4) {
                if (xhr.status === 0 && !xhr.responseText) {
                    // for local files there is no difference between missing
                    // and empty files, so empty files are considered as errors
                    callback("File " + path + " is empty.");
                } else if ((xhr.status >= 200 && xhr.status < 300) ||
                           xhr.status === 0) {
                    // report success
                    callback(null);
                } else {
                    // report error
                    callback("Status " + String(xhr.status) + ": " +
                            xhr.responseText || xhr.statusText);
                }
            }
        }
        xhr.open('PUT', path, true);
        xhr.onreadystatechange = handleResult;
        // ArrayBufferView will have an ArrayBuffer property, in WebKit, XHR
        // can send() an ArrayBuffer, In Firefox, one must use sendAsBinary with
        // a string
        if (data.buffer && !xhr.sendAsBinary) {
            d = data.buffer; // webkit supports sending an ArrayBuffer
        } else {
            // encode into a string, this works in FireFox >= 3
            d = self.byteArrayToString(data, "binary");
        }
        try {
            if (xhr.sendAsBinary) {
                xhr.sendAsBinary(d);
            } else {
                xhr.send(d);
            }
        } catch (/**@type{!Error}*/e) {
            self.log("HUH? " + e + " " + data);
            callback(e.message);
        }
    }
    /**
     * @param {!string} path
     * @param {!function(?string):undefined} callback
     * @return {undefined}
     */
    function deleteFile(path, callback) {
        delete cache[path];
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', path, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status < 200 && xhr.status >= 300) {
                    callback(xhr.responseText);
                } else {
                    callback(null);
                }
            }
        };
        xhr.send(null);
    }
    /**
     * @param {!string} path
     * @param {!function(?string,?Document):undefined} callback
     * @return {undefined}
     */
    function loadXML(path, callback) {
        var xhr = new XMLHttpRequest();
        function handleResult() {
            if (xhr.readyState === 4) {
                if (xhr.status === 0 && !xhr.responseText) {
                    callback("File " + path + " is empty.", null);
                } else if (xhr.status === 200 || xhr.status === 0) {
                    // report file
                    callback(null, xhr.responseXML);
                } else {
                    // report error
                    callback(xhr.responseText, null);
                }
            }
        }
        xhr.open("GET", path, true);
        if (xhr.overrideMimeType) {
            xhr.overrideMimeType("text/xml");
        }
        xhr.onreadystatechange = handleResult;
        try {
            xhr.send(null);
        } catch (/**@type{!Error}*/e) {
            callback(e.message, null);
        }
    }
    /**
     * @param {!string} path
     * @param {!function(boolean):undefined} callback
     * @return {undefined}
     */
    function isFile(path, callback) {
        self.getFileSize(path, function (size) {
            callback(size !== -1);
        });
    }
    /**
     * @param {!string} path
     * @param {!function(number):undefined} callback
     * @return {undefined}
     */
    function getFileSize(path, callback) {
        if (cache.hasOwnProperty(path) && typeof cache[path] !== "string") {
            callback(cache[path].length);
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", path, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }
            var cl = xhr.getResponseHeader("Content-Length");
            if (cl) {
                callback(parseInt(cl, 10));
            } else {
                // Due to CORS implementation bugs, some browsers will not allow access to certain headers
                // even if the server says it's ok. This specific bug was observed in Cocoa's WebView on OSX10.8.
                // However, even though the browser won't pull the content-length header (coz it's a security risk!)
                // the content can still be fetched.
                // This data will be cached, so we'll still only ever have to fetch it once
                readFile(path, "binary", function(err, data) {
                    if (!err) {
                        callback(data.length);
                    } else {
                        callback(-1);
                    }
                });
            }
        };
        xhr.send(null);
    }
    this.readFile = readFile;
    this.read = read;
    this.readFileSync = readFileSync;
    this.writeFile = writeFile;
    this.deleteFile = deleteFile;
    this.loadXML = loadXML;
    this.isFile = isFile;
    this.getFileSize = getFileSize;
    this.log = log;
    this.assert = assert;
    /**
     * @param {!function():undefined} f
     * @param {!number} msec
     * @return {!number}
     */
    this.setTimeout = function (f, msec) {
        return setTimeout(function () {
            f();
        }, msec);
    };
    /**
     * @param {!number} timeoutID
     * @return {undefined}
     */
    this.clearTimeout = function (timeoutID) {
        clearTimeout(timeoutID);
    };
    /**
     * @return {!Array.<!string>}
     */
    this.libraryPaths = function () {
        return ["lib"]; // TODO: find a good solution
                                       // probably let html app specify it
    };
/*jslint emptyblock: true */
    this.setCurrentDirectory = function () {
    };
/*jslint emptyblock: false */
    this.type = function () {
        return "BrowserRuntime";
    };
    this.getDOMImplementation = function () {
        return window.document.implementation;
    };
    /**
     * @param {!string} xml
     * @return {?Document}
     */
    this.parseXML = function (xml) {
        var parser = new DOMParser();
        return parser.parseFromString(xml, "text/xml");
    };
    /**
     * @param {!number} exitCode
     */
    this.exit = function (exitCode) {
        log("Calling exit with code " + String(exitCode) +
                ", but exit() is not implemented.");
    };
    /**
     * @return {!Window}
     */
    this.getWindow = function () {
        return window;
    };
}

/**
 * @constructor
 * @implements {Runtime}
 */
function NodeJSRuntime() {
    "use strict";
    var self = this,
        fs = require('fs'),
        pathmod = require('path'),
        /**@type{!string}*/
        currentDirectory = "",
        /**@type{!DOMParser}*/
        parser,
        domImplementation;

    /**
     * @param {!Buffer} buffer
     * @return {!Uint8Array}
     */
    function bufferToUint8Array(buffer) {
        var l = buffer.length, i,
            a = new Uint8Array(new ArrayBuffer(l));
        for (i = 0; i < l; i += 1) {
            a[i] = buffer[i];
        }
        return a;
    }
    /**
     * @param {!string} string
     * @param {!string} encoding
     * @return {!Uint8Array}
     */
    this.byteArrayFromString = function (string, encoding) {
        var buf = new Buffer(string, encoding), i, l = buf.length,
            a = new Uint8Array(new ArrayBuffer(l));
        for (i = 0; i < l; i += 1) {
            a[i] = buf[i];
        }
        return a;
    };

    this.byteArrayToString = Runtime.byteArrayToString;

    /**
    * @param {!string} name
    * @return {*}
    */
    this.getVariable = Runtime.getVariable;

    /**
    * @param {!string} jsonstr
    * @return {*}
    */
    this.fromJson = Runtime.fromJson;
    /**
    * @param {*} anything
    * @return {!string}
    */
    this.toJson = Runtime.toJson;

    /**
     * @param {!string} path
     * @param {!function(boolean):undefined} callback
     * @return {undefined}
     */
    function isFile(path, callback) {
        path = pathmod.resolve(currentDirectory, path);
        fs.stat(path, function (err, stats) {
            callback(!err && stats.isFile());
        });
    }
    /**
     * Read the contents of a file. Returns the result via a callback. If the
     * encoding is 'binary', the result is returned as a Uint8Array,
     * otherwise, it is returned as a string.
     * @param {!string} path
     * @param {!string} encoding text encoding or 'binary'
     * @param {!function(?string,?(string|Uint8Array)):undefined} callback
     * @return {undefined}
     */
    function readFile(path, encoding, callback) {
        /**
         * @param {?string} err
         * @param {?Buffer|?string} data
         * @return {undefined}
         */
        function convert(err, data) {
            if (err) {
                return callback(err, null);
            }
            if (!data) {
                return callback("No data for " + path + ".", null);
            }
            var d;
            if (typeof data === "string") {
                d = /**@type{!string}*/(data);
                return callback(err, d);
            }
            d = /**@type{!Buffer}*/(data);
            callback(err, bufferToUint8Array(d));
        }
        path = pathmod.resolve(currentDirectory, path);
        if (encoding !== "binary") {
            fs.readFile(path, encoding, convert);
        } else {
            fs.readFile(path, null, convert);
        }
    }
    this.readFile = readFile;
    /**
     * @param {!string} path
     * @param {!function(?string,?Document):undefined} callback
     * @return {undefined}
     */
    function loadXML(path, callback) {
        readFile(path, "utf-8", function (err, data) {
            if (err) {
                return callback(err, null);
            }
            if (!data) {
                return callback("No data for " + path + ".", null);
            }
            var d = /**@type{!string}*/(data);
            callback(null, self.parseXML(d));
        });
    }
    this.loadXML = loadXML;
    /**
     * @param {!string} path
     * @param {!Uint8Array} data
     * @param {!function(?string):undefined} callback
     * @return {undefined}
     */
    this.writeFile = function (path, data, callback) {
        var l = data.length, i,
            buf = new Buffer(data.length);
        for (i = 0; i < l; i += 1) {
            buf[i] = data[i];
        }
        path = pathmod.resolve(currentDirectory, path);
        fs.writeFile(path, buf, "binary", function (err) {
            callback(err || null);
        });
    };
    /**
     * @param {!string} path
     * @param {!function(?string):undefined} callback
     * @return {undefined}
     */
    this.deleteFile = function (path, callback) {
        path = pathmod.resolve(currentDirectory, path);
        fs.unlink(path, callback);
    };
    /**
     * @param {!string} path
     * @param {!number} offset
     * @param {!number} length
     * @param {!function(?string,?Uint8Array):undefined} callback
     * @return {undefined}
     */
    this.read = function (path, offset, length, callback) {
        path = pathmod.resolve(currentDirectory, path);
        fs.open(path, "r+", 666, function (err, fd) {
            if (err) {
                callback(err, null);
                return;
            }
            var buffer = new Buffer(length);
            fs.read(fd, buffer, 0, length, offset, function (err) {
                fs.close(fd);
                callback(err, bufferToUint8Array(buffer));
            });
        });
    };
    /**
     * @param {!string} path
     * @param {!string} encoding text encoding or 'binary'
     * @return {!string|!Uint8Array}
     */
    this.readFileSync = function (path, encoding) {
        var enc = (encoding === "binary") ? null : encoding,
            r = fs.readFileSync(path, enc), s;
        if (r === null) {
            throw "File " + path + " could not be read.";
        }
        if (encoding === "binary") {
            s = /**@type{!Buffer}*/(r);
            s = bufferToUint8Array(s);
        } else {
            s = /**@type{!string}*/(r);
        }
        return s;
    };
    this.isFile = isFile;
    /**
     * @param {!string} path
     * @param {!function(number):undefined} callback
     * @return {undefined}
     */
    this.getFileSize = function (path, callback) {
        path = pathmod.resolve(currentDirectory, path);
        fs.stat(path, function (err, stats) {
            if (err) {
                callback(-1);
            } else {
                callback(stats.size);
            }
        });
    };
    /**
     * @param {!string} msgOrCategory
     * @param {string=} msg
     * @return {undefined}
     */
    function log(msgOrCategory, msg) {
        var category;
        if (msg !== undefined) {
            category = msgOrCategory;
        } else {
            msg = msgOrCategory;
        }
        if (category === "alert") {
            process.stderr.write("\n!!!!! ALERT !!!!!" + '\n');
        }
        process.stderr.write(msg + '\n');
        if (category === "alert") {
            process.stderr.write("!!!!! ALERT !!!!!" + '\n');
        }
    }
    this.log = log;
    /**
    * @param {!boolean} condition
    * @param {!string} message
    * @param {!function():undefined=} callback
    * @return {undefined}
    */
    function assert(condition, message, callback) {
        if (!condition) {
            process.stderr.write("ASSERTION FAILED: " + message);
            if (callback) {
                callback();
            }
        }
    }
    this.assert = assert;
    /**
     * @param {!function():undefined} f
     * @param {!number} msec
     * @return {!number}
     */
    this.setTimeout = function (f, msec) {
        return setTimeout(function () {
            f();
        }, msec);
    };
    /**
     * @param {!number} timeoutID
     * @return {undefined}
     */
    this.clearTimeout = function (timeoutID) {
        clearTimeout(timeoutID);
    };
    /**
     * @return {!Array.<!string>}
     */
    this.libraryPaths = function () {
        return [__dirname];
    };
    /**
     * @param {!string} dir
     */
    this.setCurrentDirectory = function (dir) {
        currentDirectory = dir;
    };
    this.currentDirectory = function () {
        return currentDirectory;
    };
    this.type = function () {
        return "NodeJSRuntime";
    };
    this.getDOMImplementation = function () {
        return domImplementation;
    };
    /**
     * @param {!string} xml
     * @return {?Document}
     */
    this.parseXML = function (xml) {
        return parser.parseFromString(xml, "text/xml");
    };
    this.exit = process.exit;
    this.getWindow = function () {
        return null;
    };
    function init() {
        var /**@type{function(new:DOMParser)}*/
            DOMParser = require('xmldom').DOMParser;
        parser = new DOMParser();
        domImplementation = self.parseXML("<a/>").implementation;
    }
    init();
}

/**
 * @constructor
 * @implements {Runtime}
 */
function RhinoRuntime() {
    "use strict";
    var self = this,
        dom = Packages.javax.xml.parsers.DocumentBuilderFactory.newInstance(),
        builder,
        entityresolver,
        currentDirectory = "";
    dom.setValidating(false);
    dom.setNamespaceAware(true);
    dom.setExpandEntityReferences(false);
    dom.setSchema(null);
/*jslint unparam: true */
    entityresolver = Packages.org.xml.sax.EntityResolver({
        /**
         * @param {!string} publicId
         * @param {!string} systemId
         * @return {!Packages.org.xml.sax.InputSource}
         */
        resolveEntity: function (publicId, systemId) {
            var file;
            /**
             * @param {!string} path
             * @return {!Packages.org.xml.sax.InputSource}
             */
            function open(path) {
                var reader = new Packages.java.io.FileReader(path),
                    source = new Packages.org.xml.sax.InputSource(reader);
                return source;
            }
            file = systemId;
            //file = /[^\/]*$/.exec(systemId); // what should this do?
            return open(file);
        }
    });
/*jslint unparam: false */
    //dom.setEntityResolver(entityresolver);
    builder = dom.newDocumentBuilder();
    builder.setEntityResolver(entityresolver);

/*jslint unparam: true*/
    this.byteArrayFromString = function (string, encoding) {
        // ignore encoding for now
        var a = [], i, l = string.length;
        for (i = 0; i < l; i += 1) {
            a[i] = string.charCodeAt(i) & 0xff;
        }
        return a;
    };
/*jslint unparam: false*/
    this.byteArrayToString = Runtime.byteArrayToString;

    /**
    * @param {!string} name
    * @return {*}
    */
    this.getVariable = Runtime.getVariable;

    /**
    * @param {!string} jsonstr
    * @return {*}
    */
    this.fromJson = Runtime.fromJson;
    /**
    * @param {*} anything
    * @return {!string}
    */
    this.toJson = Runtime.toJson;

    function loadXML(path, callback) {
        var file = new Packages.java.io.File(path),
            xmlDocument;
        try {
            xmlDocument = builder.parse(file);
        } catch (err) {
            print(err);
            callback(err);
            return;
        }
        callback(null, xmlDocument);
    }
    function runtimeReadFile(path, encoding, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var file = new Packages.java.io.File(path),
            data,
            // read binary, seems hacky but works
            rhinoencoding = (encoding === "binary") ? "latin1" : encoding;
        if (!file.isFile()) {
            callback(path + " is not a file.");
        } else {
            data = readFile(path, rhinoencoding);
            if (encoding === "binary") {
                data = self.byteArrayFromString(data, "binary");
            }
            callback(null, data);
        }
    }
    /**
     * @param {!string} path
     * @param {!string} encoding
     * @return {?string}
     */
    function runtimeReadFileSync(path, encoding) {
        var file = new Packages.java.io.File(path);
        if (!file.isFile()) {
            return null;
        }
        if (encoding === "binary") {
            encoding = "latin1"; // read binary, seems hacky but works
        }
        return readFile(path, encoding);
    }
    function isFile(path, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var file = new Packages.java.io.File(path);
        callback(file.isFile());
    }
    this.loadXML = loadXML;
    this.readFile = runtimeReadFile;
    this.writeFile = function (path, data, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var out = new Packages.java.io.FileOutputStream(path),
            i,
            l = data.length;
        for (i = 0; i < l; i += 1) {
            out.write(data[i]);
        }
        out.close();
        callback(null);
    };
    this.deleteFile = function (path, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var file = new Packages.java.io.File(path);
        if (file['delete']()) {
            callback(null);
        } else {
            callback("Could not delete " + path);
        }
    };
    this.read = function (path, offset, length, callback) {
        // TODO: adapt to read only a part instead of the whole file
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var data = runtimeReadFileSync(path, "binary");
        if (data) {
            callback(null, this.byteArrayFromString(
                data.substring(offset, offset + length),
                "binary"
            ));
        } else {
            callback("Cannot read " + path);
        }
    };
    /**
     * @param {!string} path
     * @param {!string} encoding text encoding or 'binary'
     * @return {!string}
     */
    this.readFileSync = function (path, encoding) {
        if (!encoding) {
            return "";
        }
        var s = readFile(path, encoding);
        if (s === null) {
            throw "File could not be read.";
        }
        return s;
    };
    this.isFile = isFile;
    this.getFileSize = function (path, callback) {
        if (currentDirectory) {
            path = currentDirectory + "/" + path;
        }
        var file = new Packages.java.io.File(path);
        callback(file.length());
    };

    /**
     * @param {!string} msgOrCategory
     * @param {string=} msg
     * @return {undefined}
     */
    function log (msgOrCategory, msg) {
        var category;
        if (msg !== undefined) {
            category = msgOrCategory;
        } else {
            msg = msgOrCategory;
        }
        if (category === "alert") {
            print("\n!!!!! ALERT !!!!!");
        }
        print(msg);
        if (category === "alert") {
            print("!!!!! ALERT !!!!!");
        }
    }
    this.log = log;

    /**
    * @param {!boolean} condition
    * @param {!string} message
    * @param {!function():undefined=} callback
    * @return {undefined}
    */
    function assert(condition, message, callback) {
        if (!condition) {
            log("alert", "ASSERTION FAILED: "+message);
            if (callback) {
                callback();
            }
        }
    }
    this.assert = assert;
    /**
     * @param {!function():undefined} f
     * @return {!number}
     */
    this.setTimeout = function (f) {
        f();
        return 0;
    };
/*jslint emptyblock: true */
    /**
     * @return {undefined}
     */
    this.clearTimeout = function() {
    };
/*jslint emptyblock: false */
    /**
     * @return {!Array.<!string>}
     */
    this.libraryPaths = function () {
        return ["lib"];
    };
    /**
     * @param {!string} dir
     */
    this.setCurrentDirectory = function (dir) {
        currentDirectory = dir;
    };
    this.currentDirectory = function () {
        return currentDirectory;
    };
    this.type = function () {
        return "RhinoRuntime";
    };
    this.getDOMImplementation = function () {
        return builder.getDOMImplementation();
    };
    this.parseXML = function (xml) {
        return builder.parse(xml);
    };
    this.exit = quit;
    this.getWindow = function () {
        return null;
    };
}

/**
 * @const
 * @type {Runtime}
 */
var runtime = (function () {
    "use strict";
    var result;
    if (String(typeof window) !== "undefined") {
        result = new BrowserRuntime(window.document.getElementById("logoutput"));
    } else if (String(typeof require) !== "undefined") {
        result = new NodeJSRuntime();
    } else {
        result = new RhinoRuntime();
    }
    return result;
}());
/*jslint sloppy: true*/
(function () {
    var cache = {},
        dircontents = {};
    function getOrDefinePackage(packageNameComponents) {
        var topname = packageNameComponents[0],
            i,
            pkg;
        // ensure top level package exists
        pkg = eval("if (typeof " + topname + " === 'undefined') {" +
                "eval('" + topname + " = {};');}" + topname);
        for (i = 1; i < packageNameComponents.length - 1; i += 1) {
            if (!pkg.hasOwnProperty(packageNameComponents[i])) {
                pkg = pkg[packageNameComponents[i]] = {};
            } else {
                pkg = pkg[packageNameComponents[i]];
            }
        }
        return pkg[packageNameComponents[packageNameComponents.length - 1]];
    }
    /**
     * @param {string} classpath
     * @returns {undefined}
     */
    runtime.loadClass = function (classpath) {
        if (IS_COMPILED_CODE) {
            return;
        }
        if (cache.hasOwnProperty(classpath)) {
            return;
        }
        var names = classpath.split("."),
            impl;
        impl = getOrDefinePackage(names);
        if (impl) {
            cache[classpath] = true;
            return;
        }
        function getPathFromManifests(classpath) {
            var path = classpath.replace(/\./g, "/") + ".js",
                dirs = runtime.libraryPaths(),
                i,
                dir,
                code,
                codestr;
            if (runtime.currentDirectory) {
                dirs.push(runtime.currentDirectory());
            }
            for (i = 0; i < dirs.length; i += 1) {
                dir = dirs[i];
                if (!dircontents.hasOwnProperty(dir)) {
                    try {
                        code = runtime.readFileSync(dirs[i] + "/manifest.js",
                                "utf8");
                        if (code && code.length) {
                            codestr = /**@type{!string}*/(code);
                            dircontents[dir] = eval(codestr);
                        } else {
                            dircontents[dir] = null;
                        }
                    } catch (e1) {
                        dircontents[dir] = null;
                        runtime.log("Cannot load manifest for " + dir +
                            ".");
                    }
                }
                code = null;
                dir = dircontents[dir];
                if (dir && dir.indexOf && dir.indexOf(path) !== -1) {
                    return dirs[i] + "/" + path;
                }
            }
            return null;
        }
        function load(classpath) {
            var code, path;
            path = getPathFromManifests(classpath);
            if (!path) {
                throw classpath + " is not listed in any manifest.js.";
            }
            try {
                code = runtime.readFileSync(path, "utf8");
            } catch (e2) {
                runtime.log("Error loading " + classpath + " " + e2);
                throw e2;
            }
            if (code === undefined) {
                throw "Cannot load class " + classpath;
            }
            // add label to dynamic script for easier debugging
            code += "\n//# sourceURL=" + path;
            code += "\n//@ sourceURL=" + path; // Chrome
            // evaluate loaded code
            try {
                code = eval(classpath + " = eval(code);");
            } catch (e4) {
                runtime.log("Error loading " + classpath + " " + e4);
                throw e4;
            }
            return code;
        }
        // check if the class in context already
        impl = load(classpath);
        if (!impl || Runtime.getFunctionName(impl) !==
                names[names.length - 1]) {
            runtime.log("Loaded code is not for " + names[names.length - 1]);
            throw "Loaded code is not for " + names[names.length - 1];
        }
        cache[classpath] = true;
    };
}());

(function () {
    /*jslint emptyblock: true*/
    var translator = function () {};
    /*jslint emptyblock: false*/

    /**
     * Translator function. Takes the original string
     * and returns the translation if it exists, else
     * returns the original.
     * @param {!string} original
     * @return {!string}
     */
    function tr(original) {
        var result = translator(original);
        if (!result || (String(typeof result) !== "string")) {
            return original;
        }
        return result;
    }

    /**
     * Gets the custom translator function
     * @return {!function(!string):!string}
     */
    runtime.getTranslator = function() {
        return translator;
    };
    /**
     * Set an external translator function
     * @param {!function(!string):!string} translatorFunction
     * @return {undefined}
     */
    runtime.setTranslator = function(translatorFunction) {
        translator = translatorFunction;
    };
    runtime.tr = tr;
}());
(function (args) {
    if (args) {
        args = Array.prototype.slice.call(/**@type{{length:number}}*/(args));
    } else {
        args = [];
    }

/*jslint unvar: true, defined: true*/
    function run(argv) {
        if (!argv.length) {
            return;
        }
        var script = argv[0];
        runtime.readFile(script, "utf8", function (err, code) {
            var path = "",
                codestring = /**@type{string}*/(code);
            if (script.indexOf("/") !== -1) {
                path = script.substring(0, script.indexOf("/"));
            }
            runtime.setCurrentDirectory(path);
            function inner_run() {
                var script, path, args, argv, result; // hide variables
                // execute script and make arguments available via argv
                result = eval(codestring);
                if (result) {
                    runtime.exit(result);
                }
                return;
            }
            if (err) {
                runtime.log(err);
                runtime.exit(1);
            } else if (codestring === null) {
                runtime.log("No code found for " + script);
                runtime.exit(1);
            } else {
                // run the script with arguments bound to arguments parameter
                inner_run.apply(null, argv);
            }
        });
    }
/*jslint unvar: false, defined: false*/
    // if rhino or node.js, run the scripts provided as arguments
    if (runtime.type() === "NodeJSRuntime") {
        run(process.argv.slice(2));
    } else if (runtime.type() === "RhinoRuntime") {
        run(args);
    } else {
        run(args.slice(1));
    }
}(String(typeof arguments) !== "undefined" && arguments));

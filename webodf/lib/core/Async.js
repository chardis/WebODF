/**
 * Copyright (C) 2012 KO GmbH <jos.van.den.oever@kogmbh.com>
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

/*global core*/

(function() {
    "use strict";

    /**
     * @return {!{forEach:!function(!Array.<*>,!function(*, !function(!string):undefined):undefined,!function(?string)):undefined, destroyAll:function(!Array.<!function(!function(!Error=))>,!function(!Error=)):undefined}}
     */
    function createASyncSingleton() {
        /**
         * @param {!Array.<*>} items
         * @param {!function(*, !function(!string):undefined):undefined} f
         * @param {!function(?string)} callback
         * @return {undefined}
         */
        function forEach(items, f, callback) {
            var i, l = items.length,
                /**@type{!number}*/
                itemsDone = 0;
            /**
             * @param {?string} err
             * @return {undefined}
             */
            function end(err) {
                if (itemsDone !== l) {
                    if (err) {
                        itemsDone = l;
                        callback(err);
                    } else {
                        itemsDone += 1;
                        if (itemsDone === l) {
                            callback(null);
                        }
                    }
                }
            }
            for (i = 0; i < l; i += 1) {
                f(items[i], end);
            }
        }

        /**
         * @param {!Array.<!function(!function(!Error=))>} items
         * @param {!function(!Error=)} callback
         * @return {undefined}
         */
        function destroyAll(items, callback) {
            /**
             * @param {!number} itemIndex
             * @param {!Error|undefined} err
             * @return {undefined}
             */
            function destroy(itemIndex, err) {
                if (err) {
                    callback(err);
                } else {
                    if (itemIndex < items.length) {
                        items[itemIndex](function (err) { destroy(itemIndex + 1, err); });
                    } else {
                        callback();
                    }
                }
            }
            destroy(0, undefined);
        }

        return {
            forEach: forEach,
            destroyAll: destroyAll
        };
    }

    /**
     * Wrapper for Async functions
     * @const
     * @type {!{forEach:!function(!Array.<*>,!function(*, !function(!string):undefined):undefined,!function(?string)):undefined, destroyAll:function(!Array.<!function(!function(!Error=))>,!function(!Error=)):undefined}}
     */
    core.Async = createASyncSingleton();
}());

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
 * @source: http://gitorious.org/odfkit/webodf/
 */
/*global runtime, core*/
/**
 * An iterator that iterators through positions in a DOM tree.
 * @constructor
 * @param {!Node} root
 * @param {!number=} whatToShow
 * @param {!NodeFilter=} filter
 * @param {!boolean=} expandEntityReferences
 */
core.PositionIterator = function PositionIterator(root, whatToShow, filter,
        expandEntityReferences) {
    "use strict";
    whatToShow = whatToShow || 0xFFFFFFFF;
    var self = this,
        walker = root.ownerDocument.createTreeWalker(root, whatToShow, filter,
            expandEntityReferences),
        currentPos = 0;
    if (walker.firstChild() === null) {
        currentPos = 1;
    }
    /**
     * @return {!boolean}
     */
    this.nextPosition = function () {
        if (walker.currentNode === root) {
            return false;
        }
        if (currentPos === 0 && walker.currentNode.nodeType === 1) {
            // step inside an element
            if (walker.firstChild() === null) {
                currentPos = 1;
            }
        } else if (walker.currentNode.nodeType === 3
                && currentPos + 1 < walker.currentNode.length) {
            // advance inside a text node
            currentPos += 1;
        } else {
            if (walker.nextSibling() !== null) {
                currentPos = 0;
            } else {
                walker.parentNode();
                currentPos = 1;
            }
        }
        return true;
    };
    function setAtEnd() {
        var type = walker.currentNode.nodeType;
        if (type === 3) {
            currentPos = walker.currentNode.length - 1;
        } else {
            currentPos = (type === 1) ? 1 : 0;
        }
    }
    /**
     * @return {!boolean}
     */
    this.previousPosition = function () {
        var moved = true;
        if (currentPos === 0) {
            if (walker.previousSibling() === null) {
                walker.parentNode();
                if (walker.currentNode === root) {
                    walker.firstChild();
                    return false;
                }
                currentPos = 0;
            } else {
                setAtEnd();
            }
        } else if (walker.currentNode.nodeType === 3) {
            currentPos -= 1;
        } else if (walker.lastChild() !== null) {
            setAtEnd();
        } else if (walker.currentNode === root) {
            moved = false;
        } else {
            currentPos = 0;
        }
        return moved;
    };
    /**
     * @return {!Node}
     */
    this.container = function () {
        var n = walker.currentNode,
            t = n.nodeType;
        if (currentPos === 0 && t !== 3) {
            return /**@type{!Node}*/n.parentNode;
        }
        return n;
    };
    /**
     * @return {!number}
     */
    this.offset = function () {
        if (walker.currentNode.nodeType === 3) {
            return currentPos;
        }
        var c = 0,
            n = walker.currentNode;
        if (currentPos === 1) {
            n = n.lastChild;
        } else {
            n = n.previousSibling;
        }
        while (n) {
            c += 1;
            n = n.previousSibling;
        }
        return c;
    };
    /**
     * @param {!Node} container
     * @param {!number} offset
     * @return {!boolean}
     */
    this.setPosition = function (container, offset) {
        if (container.nodeType === 3) {
            walker.currentNode = container;
            currentPos = offset;
            return true;
        }
        var n = container.firstChild;
        while (offset && n) {
            n = n.nextSibling;
        }
        if (n === null) {
            walker.currentNode = container;
            currentPos = 1;
        } else {
            walker.currentNode = n;
            currentPos = 0;
        }
        // jiggle the position to make sure it is at an allowed offset
        if (self.nextPosition()) {
            self.previousPosition();
        }
        if (self.previousPosition()) {
            self.nextPosition();
        }
        return true;
    };
    /**
     * @return {undefined}
     */
    this.moveToEnd = function () {
        walker.currentNode = root;
        currentPos = 1;
    };
};

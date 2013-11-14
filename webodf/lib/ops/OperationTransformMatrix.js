/**
 * @license
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, ops */

/**
 * @constructor
 */
ops.OperationTransformMatrix = function OperationTransformMatrix() {
    "use strict";

    /**
     * Does an OT on the two passed opspecs, where they are not modified at all,
     * and so simply returns them in the result arrays.
     * @param {!Object} opSpecA
     * @param {!Object} opSpecB
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function passUnchanged(opSpecA, opSpecB) {
        return {
            opSpecsA:  [opSpecA],
            opSpecsB:  [opSpecB]
        };
    }

    /**
     * Returns a list with all attributes in setProperties that refer to styleName
     * @param {?Object|undefined} setProperties
     * @param {!string} styleName
     * @return {!Array.<!string>}
     */
    function getStyleReferencingAttributes(setProperties, styleName) {
        var attributes = [];
        if (setProperties) {
            ['style:parent-style-name','style:next-style-name'].forEach(function(attributeName) {
                if (setProperties[attributeName] === styleName) {
                    attributes.push(attributeName);
                }
            });
        }
        return attributes;
    }
    /**
     * @param {?Object|undefined} setProperties
     * @param {!string} deletedStyleName
     * @return {undefined}
     */
    function dropStyleReferencingAttributes(setProperties, deletedStyleName) {
        if (setProperties) {
            ['style:parent-style-name','style:next-style-name'].forEach(function(attributeName) {
                if (setProperties[attributeName] === deletedStyleName) {
                    delete setProperties[attributeName];
                }
            });
        }
    }

    /**
     * @param {!Object} addStyleSpec
     * @param {!Object} removeStyleSpec
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformAddStyleRemoveStyle(addStyleSpec, removeStyleSpec) {
        var setAttributes,
            helperOpspec,
            addStyleSpecResult = [addStyleSpec],
            removeStyleSpecResult = [removeStyleSpec];

        if (addStyleSpec.styleFamily === removeStyleSpec.styleFamily) {
            // deleted style brought into use by addstyle op?
            setAttributes = getStyleReferencingAttributes(addStyleSpec.setProperties, removeStyleSpec.styleName);
            if (setAttributes.length > 0) {
                // just create a updateparagraph style op preceding to us which removes any set style from the paragraph
                helperOpspec = {
                    optype: "UpdateParagraphStyle",
                    memberid: removeStyleSpec.memberid,
                    timestamp: removeStyleSpec.timestamp,
                    styleName: addStyleSpec.styleName,
                    removedProperties: { attributes: setAttributes.join(',') }
                };
                removeStyleSpecResult.unshift(helperOpspec);
            }
            // in the addstyle op drop any attributes referencing the style deleted
            dropStyleReferencingAttributes(addStyleSpec.setProperties, removeStyleSpec.styleName);
        }

        return {
            opSpecsA:  addStyleSpecResult,
            opSpecsB:  removeStyleSpecResult
        };
    }

    /**
     * @param {!Object} insertTextSpecA
     * @param {!Object} insertTextSpecB
     * @param {!boolean} hasAPriority
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformInsertTextInsertText(insertTextSpecA, insertTextSpecB, hasAPriority) {
        if (insertTextSpecA.position < insertTextSpecB.position) {
            insertTextSpecB.position += insertTextSpecA.text.length;
        } else if (insertTextSpecA.position > insertTextSpecB.position) {
            insertTextSpecA.position += insertTextSpecB.text.length;
        } else {
            if (hasAPriority) {
                insertTextSpecB.position += insertTextSpecA.text.length;
            } else {
                insertTextSpecA.position += insertTextSpecB.text.length;
            }
            // TODO: cursors get out of sync, so for now have OT fail
            return null;
        }

        return {
            opSpecsA:  [insertTextSpecA],
            opSpecsB:  [insertTextSpecB]
        };
    }

    /**
     * @param {!Object} insertTextSpec
     * @param {!Object} moveCursorSpec
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformInsertTextMoveCursor(insertTextSpec, moveCursorSpec) {
        // adapt movecursor spec to inserted positions
        if (insertTextSpec.position < moveCursorSpec.position) {
            moveCursorSpec.position += insertTextSpec.text.length;
        } else if (insertTextSpec.position <= moveCursorSpec.position + moveCursorSpec.length) {
            moveCursorSpec.length += insertTextSpec.text.length;
        }

        return {
            opSpecsA:  [insertTextSpec],
            opSpecsB:  [moveCursorSpec]
        };
    }

    /**
     * @param {!Object} insertTextSpec
     * @param {!Object} removeTextSpec
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformInsertTextRemoveText(insertTextSpec, removeTextSpec) {
        var helperOpspec,
            removeTextSpecEnd = removeTextSpec.position + removeTextSpec.length,
            insertTextSpecResult = [insertTextSpec],
            removeTextSpecResult = [removeTextSpec];

        // update insertTextSpec
        // removed before/up to insertion point?
        if (removeTextSpecEnd <= insertTextSpec.position) {
            insertTextSpec.position -= removeTextSpec.length;
        // removed at/behind insertion point
        } else if (insertTextSpec.position <= removeTextSpec.position) {
            removeTextSpec.position += insertTextSpec.text.length;
        // insertion in middle of removed range
        } else {
            // we have to split the removal into two ops, before and after the insertion point
            removeTextSpec.length = insertTextSpec.position - removeTextSpec.position;
            helperOpspec = {
                optype: "RemoveText",
                memberid: removeTextSpec.memberid,
                timestamp: removeTextSpec.timestamp,
                position: insertTextSpec.position + insertTextSpec.text.length,
                length: removeTextSpecEnd - insertTextSpec.position
            };
            removeTextSpecResult.unshift(helperOpspec); // helperOp first, so its position is not affected by the real op
            // drop insertion point to begin of removed range
            // original insertTextSpec.position is used for removeTextSpec changes, so only change now
            insertTextSpec.position = removeTextSpec.position;
        }

        return {
            opSpecsA:  insertTextSpecResult,
            opSpecsB:  removeTextSpecResult
        };
    }

    /**
     * @param {!Object} insertTextSpec
     * @param {!Object} splitParagraphSpec
     * @param {!boolean} hasAPriority
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformInsertTextSplitParagraph(insertTextSpec, splitParagraphSpec, hasAPriority) {
        if (insertTextSpec.position < splitParagraphSpec.position) {
            splitParagraphSpec.position += insertTextSpec.text.length;
        } else if (insertTextSpec.position > splitParagraphSpec.position) {
            insertTextSpec.position += 1;
        } else {
            if (hasAPriority) {
                splitParagraphSpec.position += insertTextSpec.text.length;
            } else {
                insertTextSpec.position += 1;
            }
            // TODO: cursors get out of sync, so for now have OT fail
            return null;
        }

        return {
            opSpecsA:  [insertTextSpec],
            opSpecsB:  [splitParagraphSpec]
        };
    }

    /**
     * @param {?Object} properties
     * @param {?Object} removedProperties
     * @param {?Object} shadowingProperties
     * @param {?Object} shadowingRemovedProperties
     * @return {undefined}
     */
    function dropShadowedAttributes(properties, removedProperties, shadowingProperties, shadowingRemovedProperties) {
        var value, i, name,
            removedPropertyNames,
            shadowingRemovedPropertyNames =
                shadowingRemovedProperties && shadowingRemovedProperties.attributes ?
                    shadowingRemovedProperties.attributes.split(',') : [];

        // iterate over all properties and see which get overwritten or deleted
        // by the shadowing, so they have to be dropped
        if (properties && (shadowingProperties || shadowingRemovedPropertyNames.length > 0)) {
            Object.keys(properties).forEach(function(key) {
                value = properties[key];
                if ((shadowingProperties && shadowingProperties[key] !== undefined) ||
                    (shadowingRemovedPropertyNames && shadowingRemovedPropertyNames.indexOf(key) !== -1)) {
                    // TODO: support more than one level
                    if (typeof value !== "object") {
                        // drop
                        delete properties[key];
                    }
                }
            });
        }

        // iterate over all shadowing removed properties and drop any duplicates from
        // the removed property names
        if (removedProperties && removedProperties.attributes && (shadowingProperties || shadowingRemovedPropertyNames.length > 0)) {
            removedPropertyNames = removedProperties.attributes.split(',');
            for (i = 0; i < removedPropertyNames.length; i += 1) {
                name = removedPropertyNames[i];
                if ((shadowingProperties && shadowingProperties[name] !== undefined) ||
                    (shadowingRemovedPropertyNames && shadowingRemovedPropertyNames.indexOf(name) !== -1)) {
                    // drop
                    removedPropertyNames.splice(i, 1);
                    i -= 1;
                }
            }
            // set back
            if (removedPropertyNames.length > 0) {
                removedProperties.attributes = removedPropertyNames.join(',');
            } else {
                delete removedProperties.attributes;
            }
        }
    }

    /**
     * Estimates if there are any properties set in the given properties object.
     * @param {!Object} properties
     * @return {!boolean}
     */
    function hasProperties(properties) {
        var key;

        for (key in properties) {
            if (properties.hasOwnProperty(key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Estimates if there are any properties set in the given properties object.
     * @param {!Object} properties
     * @return {!boolean}
     */
    function hasRemovedProperties(properties) {
        var key;

        for (key in properties) {
            if (properties.hasOwnProperty(key)) {
                // handle empty 'attribute' as not existing
                if (key !== 'attributes' || properties.attributes.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @param {!Object} targetOpspec
     * @param {!Object} shadowingOpspec
     * @param {!string} propertiesName
     * @return {undefined}
     */
    function dropShadowedProperties(targetOpspec, shadowingOpspec, propertiesName) {
        var sp = targetOpspec.setProperties ? targetOpspec.setProperties[propertiesName] : null,
            rp = targetOpspec.removedProperties ? targetOpspec.removedProperties[propertiesName] : null;

        dropShadowedAttributes(sp,
                               rp,
                               shadowingOpspec.setProperties ? shadowingOpspec.setProperties[propertiesName] : null,
                               shadowingOpspec.removedProperties ? shadowingOpspec.removedProperties[propertiesName] : null);

        // remove empty setProperties
        if (sp && !hasProperties(sp)) {
            delete targetOpspec.setProperties[propertiesName];
        }
        // remove empty removedProperties
        if (rp && !hasRemovedProperties(rp)) {
            delete targetOpspec.removedProperties[propertiesName];
        }
    }

    /**
     * @param {!Object} updateParagraphStyleSpecA
     * @param {!Object} updateParagraphStyleSpecB
     * @param {!boolean} hasAPriority
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformUpdateParagraphStyleUpdateParagraphStyle(updateParagraphStyleSpecA, updateParagraphStyleSpecB, hasAPriority) {
        var majorSpec, minorSpec,
            updateParagraphStyleSpecAResult = [updateParagraphStyleSpecA],
            updateParagraphStyleSpecBResult = [updateParagraphStyleSpecB];

        // same style updated by other op?
        if (updateParagraphStyleSpecA.styleName === updateParagraphStyleSpecB.styleName) {
            majorSpec = hasAPriority ? updateParagraphStyleSpecA : updateParagraphStyleSpecB;
            minorSpec = hasAPriority ? updateParagraphStyleSpecB : updateParagraphStyleSpecA;

            // any properties which are set by other update op need to be dropped
            dropShadowedProperties(minorSpec, majorSpec, 'style:paragraph-properties');
            dropShadowedProperties(minorSpec, majorSpec, 'style:text-properties');
            dropShadowedAttributes(minorSpec.setProperties || null,
                                minorSpec.removedProperties || null,
                                majorSpec.setProperties || null,
                                majorSpec.removedProperties || null);

            // check if there are any changes left and this op has not become a noop
            if (!(minorSpec.setProperties && hasProperties(minorSpec.setProperties)) &&
                !(minorSpec.removedProperties && hasRemovedProperties(minorSpec.removedProperties))) {
                // set minor spec to noop 
                if (hasAPriority) {
                    updateParagraphStyleSpecBResult = [];
                } else {
                    updateParagraphStyleSpecAResult = [];
                }
            }
        }

        return {
            opSpecsA:  updateParagraphStyleSpecAResult,
            opSpecsB:  updateParagraphStyleSpecBResult
        };
    }

    /**
     * @param {!Object} splitParagraphSpecA
     * @param {!Object} splitParagraphSpecB
     * @param {!boolean} hasAPriority
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformSplitParagraphSplitParagraph(splitParagraphSpecA, splitParagraphSpecB, hasAPriority) {
        if (splitParagraphSpecA.position < splitParagraphSpecB.position) {
            splitParagraphSpecB.position += 1;
        } else if (splitParagraphSpecA.position > splitParagraphSpecB.position) {
            splitParagraphSpecA.position += 1;
        } else if (splitParagraphSpecA.position === splitParagraphSpecB.position) {
            if (hasAPriority) {
                splitParagraphSpecB.position += 1;
            } else {
                splitParagraphSpecA.position += 1;
            }
            // TODO: cursors get out of sync, so for now have OT fail
            return null;
        }

        return {
            opSpecsA:  [splitParagraphSpecA],
            opSpecsB:  [splitParagraphSpecB]
        };
    }

    /**
     * @param {!Object} moveCursorSpec
     * @param {!Object} removeCursorSpec
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformMoveCursorRemoveCursor(moveCursorSpec, removeCursorSpec) {
        var isSameCursorRemoved = (moveCursorSpec.memberid === removeCursorSpec.memberid);

        return {
            opSpecsA:  isSameCursorRemoved ? [] : [moveCursorSpec],
            opSpecsB:  [removeCursorSpec]
        };
    }

    /**
     * @param {!Object} moveCursorSpec
     * @param {!Object} removeTextSpec
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformMoveCursorRemoveText(moveCursorSpec, removeTextSpec) {
        var moveCursorSpecEnd = moveCursorSpec.position + moveCursorSpec.length,
            removeTextSpecEnd = removeTextSpec.position + removeTextSpec.length;

        // transform moveCursorSpec
        // removed positions by object up to move cursor position?
        if (removeTextSpecEnd <= moveCursorSpec.position) {
            // adapt by removed position
            moveCursorSpec.position -= removeTextSpec.length;
        // overlapping?
        } else if (removeTextSpec.position < moveCursorSpecEnd) {
            // still to select range starting at cursor position?
            if (moveCursorSpec.position < removeTextSpec.position) {
                // still to select range ending at selection?
                if (removeTextSpecEnd < moveCursorSpecEnd) {
                    moveCursorSpec.length -= removeTextSpec.length;
                } else {
                    moveCursorSpec.length = removeTextSpec.position - moveCursorSpec.position;
                }
            // remove overlapping section
            } else {
                // fall at start of removed section
                moveCursorSpec.position = removeTextSpec.position;
                // still to select range at selection end?
                if (removeTextSpecEnd < moveCursorSpecEnd) {
                    moveCursorSpec.length = moveCursorSpecEnd - removeTextSpecEnd;
                } else {
                    // completely overlapped by other, so selection gets void
                    moveCursorSpec.length = 0;
                }
            }
        }

        return {
            opSpecsA:  [moveCursorSpec],
            opSpecsB:  [removeTextSpec]
        };
    }

    /**
     * @param {!Object} moveCursorSpec
     * @param {!Object} splitParagraphSpec
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformMoveCursorSplitParagraph(moveCursorSpec, splitParagraphSpec) {
        // transform moveCursorSpec
        if (splitParagraphSpec.position < moveCursorSpec.position) {
            moveCursorSpec.position += 1;
        } else if (splitParagraphSpec.position <= moveCursorSpec.position + moveCursorSpec.length) {
            moveCursorSpec.length += 1;
        }

        return {
            opSpecsA:  [moveCursorSpec],
            opSpecsB:  [splitParagraphSpec]
        };
    }

    /**
     * @param {!Object} removeCursorSpecA
     * @param {!Object} removeCursorSpecB
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformRemoveCursorRemoveCursor(removeCursorSpecA, removeCursorSpecB) {
        var isSameMemberid = (removeCursorSpecA.memberid === removeCursorSpecB.memberid);

        // if both are removing the same cursor, their transformed counter-ops become noops
        return {
            opSpecsA:  isSameMemberid ? [] : [removeCursorSpecA],
            opSpecsB:  isSameMemberid ? [] : [removeCursorSpecB]
        };
    }

    /**
     * @param {!Object} removeStyleSpecA
     * @param {!Object} removeStyleSpecB
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformRemoveStyleRemoveStyle(removeStyleSpecA, removeStyleSpecB) {
        var isSameStyle = (removeStyleSpecA.styleName === removeStyleSpecB.styleName && removeStyleSpecA.styleFamily === removeStyleSpecB.styleFamily);

        // if both are removing the same style, their transformed counter-ops become noops
        return {
            opSpecsA:  isSameStyle ? [] : [removeStyleSpecA],
            opSpecsB:  isSameStyle ? [] : [removeStyleSpecB]
        };
    }

    /**
     * @param {!Object} removeStyleSpec
     * @param {!Object} setParagraphStyleSpec
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformRemoveStyleSetParagraphStyle(removeStyleSpec, setParagraphStyleSpec) {
        var helperOpspec,
            removeStyleSpecResult = [removeStyleSpec],
            setParagraphStyleSpecResult = [setParagraphStyleSpec];

        if (removeStyleSpec.styleFamily === "paragraph" && removeStyleSpec.styleName === setParagraphStyleSpec.styleName) {
            // transform removeStyleSpec
            // just create a setstyle op preceding to us which removes any set style from the paragraph
            helperOpspec = {
                optype: "SetParagraphStyle",
                memberid: removeStyleSpec.memberid,
                timestamp: removeStyleSpec.timestamp,
                position: setParagraphStyleSpec.position,
                styleName: ""
            };
            removeStyleSpecResult.unshift(helperOpspec);

            // transform setParagraphStyleSpec
            // instead of setting now remove any existing style from the paragraph
            setParagraphStyleSpec.styleName = "";
        }

        return {
            opSpecsA:  removeStyleSpecResult,
            opSpecsB:  setParagraphStyleSpecResult
        };
    }

    /**
     * @param {!Object} removeStyleSpec
     * @param {!Object} updateParagraphStyleSpec
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformRemoveStyleUpdateParagraphStyle(removeStyleSpec, updateParagraphStyleSpec) {
        var setAttributes, helperOpspec,
            removeStyleSpecResult = [removeStyleSpec],
            updateParagraphStyleSpecResult = [updateParagraphStyleSpec];

        if (removeStyleSpec.styleFamily === "paragraph") {
            // transform removeStyleSpec
            // style brought into use by other op?
            setAttributes = getStyleReferencingAttributes(updateParagraphStyleSpec.setProperties, removeStyleSpec.styleName);
            if (setAttributes.length > 0) {
                // just create a updateparagraph style op preceding to us which removes any set style from the paragraph
                helperOpspec = {
                    optype: "UpdateParagraphStyle",
                    memberid: removeStyleSpec.memberid,
                    timestamp: removeStyleSpec.timestamp,
                    styleName: updateParagraphStyleSpec.styleName,
                    removedProperties: { attributes: setAttributes.join(',') }
                };
                removeStyleSpecResult.unshift(helperOpspec);
            }

            // transform updateParagraphStyleSpec
            // target style to update deleted by removeStyle?
            if (removeStyleSpec.styleName === updateParagraphStyleSpec.styleName) {
                // don't touch the dead
                updateParagraphStyleSpecResult = [];
            } else {
                // otherwise drop any attributes referencing the style deleted
                dropStyleReferencingAttributes(updateParagraphStyleSpec.setProperties, removeStyleSpec.styleName);
            }
        }

        return {
            opSpecsA:  removeStyleSpecResult,
            opSpecsB:  updateParagraphStyleSpecResult
        };
    }

    /**
     * @param {!Object} removeTextSpecA
     * @param {!Object} removeTextSpecB
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformRemoveTextRemoveText(removeTextSpecA, removeTextSpecB) {
        var removeTextSpecAEnd = removeTextSpecA.position + removeTextSpecA.length,
            removeTextSpecBEnd = removeTextSpecB.position + removeTextSpecB.length,
            removeTextSpecAResult = [removeTextSpecA],
            removeTextSpecBResult = [removeTextSpecB];

        // B removed positions by object up to As start position?
        if (removeTextSpecBEnd <= removeTextSpecA.position) {
            // adapt A by removed position
            removeTextSpecA.position -= removeTextSpecB.length;
        // A removed positions by object up to Bs start position?
        } else if (removeTextSpecAEnd <= removeTextSpecB.position) {
            // adapt B by removed position
            removeTextSpecB.position -= removeTextSpecA.length;
        // overlapping?
        // (removeTextSpecBEnd <= removeTextSpecA.position above catches non-overlapping from this condition)
        } else if (removeTextSpecB.position < removeTextSpecAEnd) {
            // A removes in front of B?
            if (removeTextSpecA.position < removeTextSpecB.position) {
                // A still to remove range at its end?
                if (removeTextSpecBEnd < removeTextSpecAEnd) {
                    removeTextSpecA.length = removeTextSpecA.length - removeTextSpecB.length;
                } else {
                    removeTextSpecA.length = removeTextSpecB.position - removeTextSpecA.position;
                }
                // B still to remove range at its end?
                if (removeTextSpecAEnd < removeTextSpecBEnd) {
                    removeTextSpecB.position = removeTextSpecA.position;
                    removeTextSpecB.length = removeTextSpecBEnd - removeTextSpecAEnd;
                } else {
                    // B completely overlapped by other, so it becomes a noop
                    removeTextSpecBResult = [];
                }
            // B removes in front of or starting at same like A
            } else {
                // B still to remove range at its end?
                if (removeTextSpecAEnd < removeTextSpecBEnd) {
                    removeTextSpecB.length = removeTextSpecB.length - removeTextSpecA.length;
                } else {
                    // B still to remove range at its start?
                    if (removeTextSpecB.position < removeTextSpecA.position) {
                        removeTextSpecB.length = removeTextSpecA.position - removeTextSpecB.position;
                    } else {
                        // B completely overlapped by other, so it becomes a noop
                        removeTextSpecBResult = [];
                    }
                }
                // A still to remove range at its end?
                if (removeTextSpecBEnd < removeTextSpecAEnd) {
                    removeTextSpecA.position = removeTextSpecB.position;
                    removeTextSpecA.length = removeTextSpecAEnd - removeTextSpecBEnd;
                } else {
                    // A completely overlapped by other, so it becomes a noop
                    removeTextSpecAResult = [];
                }
            }
        }
        return {
            opSpecsA:  removeTextSpecAResult,
            opSpecsB:  removeTextSpecBResult
        };
    }

    /**
     * @param {!Object} removeTextSpec
     * @param {!Object} splitParagraphSpec
     * @return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
     */
    function transformRemoveTextSplitParagraph(removeTextSpec, splitParagraphSpec) {
        var removeTextSpecEnd = removeTextSpec.position + removeTextSpec.length,
            helperOpspec,
            removeTextSpecResult = [removeTextSpec],
            splitParagraphSpecResult = [splitParagraphSpec];

        // adapt removeTextSpec
        if (splitParagraphSpec.position <= removeTextSpec.position) {
            removeTextSpec.position += 1;
        } else if (splitParagraphSpec.position < removeTextSpecEnd) {
            // we have to split the removal into two ops, before and after the insertion
            removeTextSpec.length = splitParagraphSpec.position - removeTextSpec.position;
            helperOpspec = {
                optype: "RemoveText",
                memberid: removeTextSpec.memberid,
                timestamp: removeTextSpec.timestamp,
                position: splitParagraphSpec.position + 1,
                length: removeTextSpecEnd - splitParagraphSpec.position
            };
            removeTextSpecResult.unshift(helperOpspec); // helperOp first, so its position is not affected by the real op
        }
        // adapt splitParagraphSpec
        if (removeTextSpec.position + removeTextSpec.length <= splitParagraphSpec.position) {
            splitParagraphSpec.position -= removeTextSpec.length;
        } else if (removeTextSpec.position < splitParagraphSpec.position) {
            splitParagraphSpec.position = removeTextSpec.position;
        }

        return {
            opSpecsA:  removeTextSpecResult,
            opSpecsB:  splitParagraphSpecResult
        };
    }


    var /**
         * This is the lower-left half of the sparse NxN matrix with all the
         * transformation methods on the possible pairs of ops. As the matrix
         * is symmetric, only that half is used. So the user of this matrix has
         * to ensure the proper order of opspecs on lookup and on calling the
         * picked transformation method.
         *
         * Each transformation method takes the two opspecs (and optionally
         * a flag if the first has a higher priority, in case of tie breaking
         * having to be done). The method returns a record with the two
         * resulting arrays of ops, with key names "opSpecsA" and "opSpecsB".
         * Those arrays could have more than the initial respective opspec
         * inside, in case some additional helper opspecs are needed, or be
         * empty if the opspec turned into a no-op in the transformation.
         * If a transformation is not doable, the method returns "null".
         *
         * Here the CC signature of each transformation method:
         * param {!Object} opspecA
         * param {!Object} opspecB
         * (param {!boolean} hasAPriorityOverB)  can be left out
         * return {?{opSpecsA:!Array.<!Object>, opSpecsB:!Array.<!Object>}}
         *
         * Empty cells in this matrix mean there is no such transformation
         * possible, and should be handled as if the method returns "null".
         *
         * @type {!Object.<!string,!Object.<!string,!Function>>}
         */
        transformations =
    {
        "AddCursor": {
            "AddCursor":            passUnchanged,
            "AddStyle":             passUnchanged,
            "InsertText":           passUnchanged,
            "MoveCursor":           passUnchanged,
            "RemoveCursor":         passUnchanged,
            "RemoveStyle":          passUnchanged,
            "RemoveText":           passUnchanged,
            "SetParagraphStyle":    passUnchanged,
            "SplitParagraph":       passUnchanged,
            "UpdateParagraphStyle": passUnchanged
        },
        "AddStyle": {
            "AddStyle":             passUnchanged,
            "InsertText":           passUnchanged,
            "MoveCursor":           passUnchanged,
            "RemoveCursor":         passUnchanged,
            "RemoveStyle":          transformAddStyleRemoveStyle,
            "RemoveText":           passUnchanged,
            "SetParagraphStyle":    passUnchanged,
            "SplitParagraph":       passUnchanged,
            "UpdateParagraphStyle": passUnchanged
        },
        "InsertText": {
            "InsertText":           transformInsertTextInsertText,
            "MoveCursor":           transformInsertTextMoveCursor,
            "RemoveCursor":         passUnchanged,
            "RemoveStyle":          passUnchanged,
            "RemoveText":           transformInsertTextRemoveText,
            // TODO:"SetParagraphStyle":    transformInsertTextSetParagraphStyle,
            "SplitParagraph":       transformInsertTextSplitParagraph,
            "UpdateParagraphStyle": passUnchanged
        },
        "MoveCursor": {
            "MoveCursor":           passUnchanged,
            "RemoveCursor":         transformMoveCursorRemoveCursor,
            "RemoveStyle":          passUnchanged,
            "RemoveText":           transformMoveCursorRemoveText,
            "SetParagraphStyle":    passUnchanged,
            "SplitParagraph":       transformMoveCursorSplitParagraph,
            "UpdateParagraphStyle": passUnchanged
        },
        "RemoveCursor": {
            "RemoveCursor":         transformRemoveCursorRemoveCursor,
            "RemoveStyle":          passUnchanged,
            "RemoveText":           passUnchanged,
            "SetParagraphStyle":    passUnchanged,
            "SplitParagraph":       passUnchanged,
            "UpdateParagraphStyle": passUnchanged
        },
        "RemoveStyle": {
            "RemoveStyle":          transformRemoveStyleRemoveStyle,
            "RemoveText":           passUnchanged,
            "SetParagraphStyle":    transformRemoveStyleSetParagraphStyle,
            "SplitParagraph":       passUnchanged,
            "UpdateParagraphStyle": transformRemoveStyleUpdateParagraphStyle
        },
        "RemoveText": {
            "RemoveText":           transformRemoveTextRemoveText,
            // TODO:"SetParagraphStyle":    transformRemoveTextSetParagraphStyle,
            "SplitParagraph":       transformRemoveTextSplitParagraph,
            "UpdateParagraphStyle": passUnchanged
        },
        "SetParagraphStyle": {
            // TODO:"SetParagraphStyle":    transformSetParagraphStyleSetParagraphStyle,
            // TODO:"SetParagraphStyle":    transformSetParagraphStyleSplitParagraph,
            "UpdateParagraphStyle": passUnchanged
        },
        "SplitParagraph": {
            "SplitParagraph":       transformSplitParagraphSplitParagraph,
            "UpdateParagraphStyle": passUnchanged
        },
        "UpdateParagraphStyle": {
            "UpdateParagraphStyle": transformUpdateParagraphStyleUpdateParagraphStyle
        }
    };

    this.passUnchanged = passUnchanged;

    /**
     * @param {!Object.<!string,!Object.<!string,!Function>>}  moreTransformations
     * @return {undefined}
     */
    this.extendTransformations = function (moreTransformations) {
        Object.keys(moreTransformations).forEach(function (optypeA) {
            var moreTransformationsOptypeAMap = moreTransformations[optypeA],
                optypeAMap,
                isExtendingOptypeAMap = transformations.hasOwnProperty(optypeA);

            runtime.log((isExtendingOptypeAMap ? "Extending" : "Adding") + " map for optypeA: " + optypeA);
            if (! isExtendingOptypeAMap) {
                transformations[optypeA] = {};
            }
            optypeAMap = transformations[optypeA];

            Object.keys(moreTransformationsOptypeAMap).forEach(function (optypeB) {
                var isOverwritingOptypeBEntry = optypeAMap.hasOwnProperty(optypeB);
                runtime.assert(optypeA <= optypeB, "Wrong order:" + optypeA + ", " + optypeB);
                runtime.log("  " + (isOverwritingOptypeBEntry ? "Overwriting" : "Adding") + " entry for optypeB: " + optypeB);
                optypeAMap[optypeB] = moreTransformationsOptypeAMap[optypeB];
            });
        });
    };

    /**
     * TODO: priority could be read from op spec, here be an attribute from-server
     * @param {!Object} opSpecA op with lower priority in case of tie breaking
     * @param {!Object} opSpecB op with higher priority in case of tie breaking
     * @return {?{opSpecsA:!Array.<!Object>,
     *            opSpecsB:!Array.<!Object>}}
     */
    this.transformOpspecVsOpspec = function(opSpecA, opSpecB) {
        var isOptypeAAlphaNumericSmaller = (opSpecA.optype <= opSpecB.optype),
            helper, transformationFunctionMap, transformationFunction, result;

runtime.log("Crosstransforming:");
runtime.log(runtime.toJson(opSpecA));
runtime.log(runtime.toJson(opSpecB));

        // switch order if needed, to match the mirrored part of the matrix
        if (!isOptypeAAlphaNumericSmaller) {
            helper = opSpecA;
            opSpecA = opSpecB;
            opSpecB = helper;
        }
        // look up transformation method
        transformationFunctionMap = transformations[opSpecA.optype];
        transformationFunction = transformationFunctionMap && transformationFunctionMap[opSpecB.optype];

        // transform
        if (transformationFunction) {
            result = transformationFunction(opSpecA, opSpecB, !isOptypeAAlphaNumericSmaller);
            if (!isOptypeAAlphaNumericSmaller && result !== null) {
                // switch result back
                result = {
                    opSpecsA:  result.opSpecsB,
                    opSpecsB:  result.opSpecsA
                };
            }
        } else {
            result = null;
        }
runtime.log("result:");
if (result) {
runtime.log(runtime.toJson(result.opSpecsA));
runtime.log(runtime.toJson(result.opSpecsB));
} else {
runtime.log("null");
}
        return result;
    };
};
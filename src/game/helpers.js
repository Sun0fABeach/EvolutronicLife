/**
 * General helper functions.
 * @module helpers
 */

/**
 * Singleton object containing helper functions.
 * @class helpers
 */
const helpers = function() {
    /**
     * Generate a random integer in a specified range.
     * @method random_in_range
     * @param {Number} min Minimum value of the range (inclusive)
     * @param {Number} max Maximum value of the range (exclusive)
     * @return {Number} Random whole number in specified range, or NaN if
     *                  min >= max.
     */
    function random_in_range(min, max) {
        if(min >= max)
            return NaN;
        return Math.floor(Math.random() * (max - min) + min);
    }

    /**
     * Select a random alement of an array.
     * @method array_choice
     * @param {Array} arr Array to select a random element from
     * @return {any} A random element of the array, or undefined if it is empty.
     */
    function array_choice(arr) {
        return arr[random_in_range(0, arr.length)];
    }

    /**
     * Return whether a chance in percent succeeded.
     * @method chance_in_percent
     * @param {Number} percent Success chance in percent
     * @return {Boolean} True if chance succeeded, false otherwise.
     */
    function chance_in_percent(percent) {
        return Math.random() < percent/100;
    }

    /**
     * Remove an element from an array.
     * @method remove_from_array
     * @param {Array} arr Array to remove element from
     * @param {Any} element Element to remove
     * @return {Any} Removed element or *null* if element not found in array
     */
    function remove_from_array(arr, element) {
        const idx = arr.indexOf(element);
        return idx >= 0 ? arr.splice(idx, 1)[0] : null;
    }

    /**
     * Pad string from the left to desired width with non-breaking spaces.
     * @method pad_left
     * @param {String} s String to pad
     * @param {Number} width Desired minimum width of string
     * @return {String} Left-padded string
     */
    function pad_left(s, width) {
        while(s.length < width)
            s = "&nbsp;" + s;
        return s;
    }

    return {
        random_in_range,
        array_choice,
        chance_in_percent,
        remove_from_array,
        pad_left
    };
}();

export default helpers;

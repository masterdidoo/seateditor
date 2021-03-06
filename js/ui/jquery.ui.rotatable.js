/*!
 * jQuery Element Rotation Plugin
 *
 * Requires jQueryUI 
 *
 * Copyright (c) 2010 Pavel Markovnin
 * Dual licensed under the MIT and GPL licenses.
 *
 * http://vremenno.net
 */

(function ($) {
    $.fn.rotatable = function (options) {

        // Default Values
        var defaults = {
                angle: 0,
                rotatorClass: 'ui-rotatable-handle',
                centerClass: 'ui-rotatable-center'
            }, opts = $.extend(defaults, options),
            _this = this,
            _rotator, _center, center_coords, angle;

        // Initialization
        this.intialize = function () {
            this.createHandler();

            this.rotate(opts.angle);
        };

        // Create Rotation Handler
        this.createHandler = function () {
            _rotator = $('<div class="' + opts.rotatorClass + '"></div>');
            _center = $('<div class="' + opts.centerClass + '"></div>');
            _this.append(_rotator);
            _this.append(_center);

            this.bindRotation();
        };

        // Bind Rotation to Handler
        this.bindRotation = function () {

            _rotator.draggable({
                handle: _rotator,
                helper: 'clone',
                revert: false,
                addClasses: false,
                start: function (e) {
                    center_coords = {
                        x: _center.offset().left,
                        y: _center.offset().top
                    };
                },
                drag: function (e) {
                    var mouse_coords = {
                        x: e.pageX,
                        y: e.pageY
                    };

                    angle = _this.radToDeg(_this.getAngle(mouse_coords, center_coords)) - 90;
                    if ($.browser.msie) {
                        angle = -angle;
                    }

                    return _this.rotate(angle);
                },
                stop: function() {
                   if (opts.stop != null) {
                       opts.stop(angle);
                   }
                }
            });
        };

        // Get Angle
        this.getAngle = function (ms, ctr) {
            var x = ms.x - ctr.x,
                y = -ms.y + ctr.y,
                hyp = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
                angle = Math.acos(x / hyp);

            if (y < 0) {
                angle = 2 * Math.PI - angle;
            }

            return $.browser.msie ? angle : (Math.PI - angle);
        };

        // Convert from Radians to Degrees
        this.radToDeg = function (r) {
            return Math.round(r * (180 / Math.PI));
        };

        // Rotate Element to the Given Degree
        this.rotate = function (m) {
            var rotate = "rotate(" + m + "deg)";

            _this.css({
//                '-moz-transform': rotate,
//                '-o-transform': rotate,
//                '-webkit-transform': rotate,
//                '-ms-transform': rotate,
                'transform': rotate
            });

        };

        return this.intialize();
    }
})(jQuery);
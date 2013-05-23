var App = App || {};

(function ($) {

    function Sector(s, a) {
        this.size = 10;
        this.area = a;
        this.scale = a.scale;
        this.start = a.start;
        this.top = 0;
        this.left = 0;
        this._start = {X: 0, Y: 0};
        this.isTitleVisible = true;
        this.init(a.place);
        this.set(s);
    }

    Sector.prototype = {
        init: function (place) {
            var self = this;
            this.jq = $('<div class="ae-sector"></div>')
                .appendTo(place);
            this._rotator = $('<div class="ae-sector-rotatable">').appendTo(this.jq);
            this._dragHandler = $('<div class="ea-sector-drag-handler">').appendTo(this._rotator);
            this._body = $('<div class="ea-sector-body">').appendTo(this._dragHandler);
            this._title = $('<div class="ea-sector-title">').appendTo(this._dragHandler);
        },
        setScale: function (scale) {
            this.scale = scale;
            this.render();
        },
        setVisibleTitle: function (visible) {
            this.isTitleVisible = visible;
            if (visible) {
                this._title.show();
            } else {
                this._title.hide();
            }
        },
        dbClick: function (callback) {
            this._dragHandler.on('dblclick', callback);
        },
        _createTitle: function (width) {
            var n = this.name;
            var title = $('<span class="label label-info">').text(n);
            var test = $('<div style="visibility: hidden; position: absolute">').appendTo($('body'));
            test.html(title);

            while (n.length > 0) {
                var titleWidth = test.width();
                if (titleWidth < width) {
                    test.remove();
                    this._title.css({ left: (width - titleWidth) / 2 })
                    this._title.html(title);
                    return;
                }
                n = n.substr(0, n.length - 1);
                title.text(n + '...');
            }
            this._title.empty();
            test.remove();
        },
        setStart: function () {
            if (this.start.X != this._start.Y || this.start.Y != this._start.Y) {
                var dX = this.start.X - this._start.X,
                    dY = this.start.Y - this._start.Y;
                this.top += dY * this.scale;
                this.left += dX * this.scale;
                this._start.X = this.start.X;
                this._start.Y = this.start.Y;
                this.polygon.moveTo(this.left, this.top);
            }
        },
        render: function () {
            var size = (this.size * this.scale);
            this.jq.css({
                top: (this.top * this.scale),
                left: (this.left * this.scale)
            });
            var body = this._body.empty();
            this._rotator.css({
                top: -this._height * size / 2,
                left: -this._width * size / 2,
                width: this._width * size,
                height: this._height * size,
                transform: "rotate(" + this.rotate + "deg)"
            });
            this._dragHandler.attr('title', this.name);
            this._createTitle(this._width * size);
            this.places.forEach(function (e) {
                var left = e.col * size;
                if (e.shift > 0) {
                    left += size / 2;
                } else if (e.shift < 0) {
                    left -= size / 2;
                }
                $('<div>').attr('class', 'z' + e.zone).css({
                    top: e.row * size,
                    left: left,
                    height: size - 1,
                    width: size - 1
                }).appendTo(body);
            });
        },
        set: function (data) {
            if (data == null) {
                this.top = 0;
                this.left = 0;
                this.rotate = 0;
                return;
            }
            if (data.top != null) this.top = data.top;
            if (data.left != null) this.left = data.left;
            if (data.rotate != null) this.rotate = data.rotate;
            this.name = data.name;
            this.placeRows = data.placeRows;
            //TODO вынести в код сохранения сектора
            var placePos = {max: 0, min: 1000000};
            var rowPos = {max: 0, min: 1000000};
            data.placeRows.forEach(function (r) {
                var pos = parseInt(r.pos);
                if (pos > rowPos.max) {
                    rowPos.max = pos;
                }
                if (pos < rowPos.min) {
                    rowPos.min = pos;
                }
                if (r.places instanceof Array) {
                    r.places.forEach(function (p) {
                        var pos = parseInt(p.pos);
                        if (pos > placePos.max) {
                            placePos.max = pos;
                        }
                        if (pos < placePos.min) {
                            placePos.min = pos;
                        }
                    });
                }
            });
            this._width = placePos.max - placePos.min + 1;
            this._height = rowPos.max - rowPos.min + 1;
            this.places = [];
            this.polygon = new Polygon(this._width * this.size / 2, this._height * this.size / 2);
            var self = this;
            data.placeRows.forEach(function (r) {
                var row = parseInt(r.pos) - rowPos.min;
                if (r.places instanceof Array) {
                    r.places.forEach(function (p) {
                        p.col = parseInt(p.pos) - placePos.min;
                        p.shift = r.shift;
                        p.row = row;
                        self.places.push(p);
                        self.polygon.addPlace(p.col, row, self.size, r.shift);
                    });
                }
            });
            if (this.rotate != null) {
                self.polygon.rotate(this.rotate);
            }
            self.polygon.moveTo(this.left, this.top);
        },
        getPlaces: function (places) {
            this.places.forEach(function (p) {
                places[p.id] = p;
            });
        },
        json: function () {
            return {
                name: this.name,
                top: this.top,
                left: this.left,
                rotate: this.rotate,
                placeRows: this.placeRows
            };
        }
    }

    function comparePoint(points, min, max) {
        points.forEach(function (p) {
            if (p.X > max.X) {
                max.X = p.X;
            }
            if (p.X < min.X) {
                min.X = p.X;
            }
            if (p.Y > max.Y) {
                max.Y = p.Y;
            }
            if (p.Y < min.Y) {
                min.Y = p.Y;
            }
        });
    }

    function Polygon(x, y) {
        this.polygons = null;
        this.X = x;
        this.Y = y;
    }

    Polygon.prototype = {
        clone: function () {
            var n = new Polygon(this.X, this.Y);
            n.polygons = [];
            this.polygons.forEach(function (polygon) {
                var p = [];
                polygon.forEach(function (point) {
                    p.push({X: point.X, Y: point.Y});
                });
                n.polygons.push(p);
            });
            return n;
        },
        isIntersect: function (p) {
            var cpr = new ClipperLib.Clipper();
            cpr.AddPolygons(this.polygons, ClipperLib.PolyType.ptSubject);
            cpr.AddPolygons(p.polygons, ClipperLib.PolyType.ptClip);
            var rez = [
                []
            ];
            cpr.Execute(ClipperLib.ClipType.ctIntersection, rez, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
            return rez.length > 0;
        },
        moveTo: function (x0, y0) {
            var x = x0 - this.X,
                y = y0 - this.Y;
            this.points().forEach(function (p) {
                p.X += x;
                p.Y += y;
            });
            this.X = x0;
            this.Y = y0;
        },
        setCenter: function (x, y) {
            this.X = x + 1;
            this.Y = y;
        },
        rotate: function (angle) {
            var x0 = this.X,
                y0 = this.Y,
                a = angle / 180 * Math.PI,
                cos = Math.cos(a),
                sin = Math.sin(a);
            this.points().forEach(function (node) {
                var x = x0 + (node.X - x0) * cos + (y0 - node.Y) * sin;
                var y = y0 + (node.X - x0) * sin + (node.Y - y0) * cos;
                node.X = Math.round(x);
                node.Y = Math.round(y);
            });
        },
        points: function () {
            var points = [];
            this.polygons.forEach(function (polygon) {
                polygon.forEach(function (point) {
                    points.push(point);
                });
            });
            return points;
        },
        setRectangle: function (x, y, w, h) {
            this.X = x;
            this.Y = y;
            this.polygons = [
                [
                    {X: x, Y: y},
                    {X: x + w, Y: y},
                    {X: x + w, Y: y + h },
                    {X: x, Y: y + h }
                ]
            ];
        },
        getMinMaxXY: function () {
            var min = {X: 1000000, Y: 1000000},
                max = {X: 0, Y: 0};
            comparePoint(this.points(), min, max);
            return [min, max];
        },
        addPlace: function (col, row, size, shift) {
            var x = col * size,
                y = row * size;
            if (shift > 0) {
                x += size / 2;
            } else if (shift < 0) {
                x -= size / 2;
            }
            var newP = [
                [
                    {X: x, Y: y},
                    {X: x + size, Y: y},
                    {X: x + size, Y: y + size },
                    {X: x, Y: y + size }
                ]
            ];
            if (this.polygons == null) {
                this.polygons = newP;
                return;
            }
            var rez = [
                []
            ];
            var cpr = new ClipperLib.Clipper();
            cpr.AddPolygons(this.polygons, ClipperLib.PolyType.ptSubject);
            cpr.AddPolygons(newP, ClipperLib.PolyType.ptClip);
            cpr.Execute(ClipperLib.ClipType.ctUnion, rez, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
            this.polygons = rez;
        }
    }

    function Scene(a, area) {
        var self = this;
        this.name = 'Сцена';
        this._start = {X: 0, Y: 0};
        this.area = area;
        this.scale = area.scale;
        this.start = area.start;
        this.top = a.top + this.start.Y;
        this.left = a.left + this.start.X;
        this.height = a.height;
        this.width = a.width;
        this.polygon = new Polygon(0, 0);
        this.polygon.setRectangle(this.left, this.top, this.width, this.height);
        this.jq = $('<div class="ae-area-scene" title="Сцена"><strong>Сцена</strong></div>').appendTo(area.place).css({
            top: (this.top) * this.scale,
            left: (this.left) * this.scale,
            height: this.height * this.scale - 1,
            width: this.width * this.scale - 1
        });
    }

    Scene.prototype = {
        setStart: function () {
            if (this.start.X != this._start.Y || this.start.Y != this._start.Y) {
                var dX = this.start.X - this._start.X,
                    dY = this.start.Y - this._start.Y;
                this.top += dY * this.scale;
                this.left += dX * this.scale;
                this._start.X = this.start.X;
                this._start.Y = this.start.Y;
                this.polygon.moveTo(this.left, this.top);
            }
        },
        render: function () {
            this.jq.css({
                top: ((this.top) * this.scale),
                left: ((this.left) * this.scale),
                height: (this.height * this.scale) - 1,
                width: (this.width * this.scale) - 1
            });
        },
        setScale: function (scale) {
            this.scale = scale;
            this.render();
        }
    };

    function Area(a, place, scroll) {
        this.id = a.id;
        this.place = place;
        this.scroll = scroll;
        this.name = a.name;
        this.sectors = [];
        this.intersects = [];
        this.places = {};
        this.scale = 1;
        this.start = {X: 0, Y: 0};
        this.init(a);
    }

    Area.prototype = {
        init: function (a) {
            var self = this;
            this.scene = new Scene(a, this);
            this.intersects.push(this.scene);
            var points = this.scene.polygon.getMinMaxXY();
            this.min = points[0];
            this.max = points[1];
            a.sectors.forEach(function (s) {
                var sector = new Sector(s, self);
                self.addSector(sector);
            });

            var width = this.max.X - this.min.X,
                height = this.max.Y - this.min.Y;

            this.screen = {
                height: this.place.height(),
                width: this.place.width()
            };
            this.height = height < this.screen.height ? this.screen.height : height;
            this.width = width < this.screen.width ? this.screen.width : width;
            this.place.height(this.height);
            this.place.width(this.width);
            this.setStart((this.width - width) / 2 - this.min.X, (this.height - height) / 2 - this.min.Y);
            var scroll = this.scroll;
            scroll.scrollLeft((this.width - this.screen.width) / 2);
            scroll.scrollTop((this.height - this.screen.height) / 2);
        },
        setStart: function (x, y) {
            this.start.X = x;
            this.start.Y = y;
            this.intersects.forEach(function (o) {
                o.setStart();
                o.render();
            });
        },
        addSector: function (sector) {
            comparePoint(sector.polygon.getMinMaxXY(), this.min, this.max);
            this.sectors.push(sector);
            this.intersects.push(sector);
            sector.getPlaces(this.places);
        },
        setScale: function (scale) {
            this.intersects.forEach(function (s) {
                s.setScale(scale);
            });
            var left = (this.scroll.scrollLeft() + this.screen.width / 2) / this.scale,
                top = (this.scroll.scrollTop() + this.screen.height / 2) / this.scale;
            this.place.height(this.height * scale);
            this.place.width(this.width * scale);
            this.scroll.scrollLeft(left * scale - this.screen.width / 2);
            this.scroll.scrollTop(top * scale - this.screen.height / 2);
            this.scale = scale;
        },
        json: function () {
            var sectors = [];
            this.sectors.forEach(function (r) {
                var x = r.json();
                if (x != null) {
                    sectors.push(x);
                }
            });
            return {
                id: this.id,
                name: this.name,
                top: this.scene.top,
                left: this.scene.left,
                height: this.scene.height,
                width: this.scene.width,
                sectors: sectors
            };
        }
    }

    function Layout(a, area, style) {
        this.id = a.layout.id;
        this.name = a.layout.name;
        this.zones = a.layout.zones;
        this.area = area;
        this.zoneStyle = style;
        this.init();
    }

    Layout.prototype = {
        init: function() {
            var zoneStyle = this.zoneStyle;
            zoneStyle.empty();
            this.zones.forEach(function (z) {
                zoneStyle.append('.ea-sector-body div.z' + z.id + ' {background-color: #' + z.color + ';}')
            });
        },
        json: function () {
            var zones = {};
            this.zones.forEach(function (z) {
                z.places = [];
                zones[z.id] = z;
            });

            this.area.sectors.forEach(function (s) {
                s.places.forEach(function (p) {
                    if (zones[p.zone] != null) zones[p.zone].places.push(p.id);
                });
            });
            return {
                id: this.id,
                name: this.name,
                area_scheme_id: this.area.id,
                zones: this.zones
            };
        }
    }

    var Editor = {
        scale: 1,
        isVisibleTitle: false,
        init: function (place) {
            this.place = place;
            this.zoneStyle = $('#la-zone-style');
            this.list = place.find('#ae-sectors-list');
            this.nameForm = place.find('#ae-name-form');
            this.nameForm.on('change', function () {
                Editor.layout.name = this.value;
            });
            place.find("#ae-add-sector").on('click', function () {
                Editor.place.hide();
                App.sectorEditor.load(null, Editor._newSector);
            });
            var tmp = place.find("#ae-area-view");
            tmp.height(window.innerHeight - 70);
            var view = place.find('#la-sectors-holder');
            this.scroll = place.find('#ae-area-view-scroller');
            this.view = view;
            this.height = view.height();
            this.width = view.width();
            place.find('#ae-area-save').on('click', function () {
                $('#ae-rez').text(Editor.json());
            });
            place.find('#ae-show-sector-title').on('change', function (e) {
                Editor.isVisibleTitle = this.checked;
                Editor.area.sectors.forEach(function (s) {
                    s.setVisibleTitle(Editor.isVisibleTitle);
                });
            });
            place.find('#ae-zoom-in').on('click', function (e) {
                Editor.setScale(+0.1);
            });
            place.find('#ae-zoom-0').on('click', function (e) {
                Editor.setScale(0);
            });
            place.find('#ae-zoom-out').on('click', function (e) {
                Editor.setScale(-0.1);
            });
        },
        setScale: function (scale) {
            if (scale == 0) {
                Editor.scale = 1;
            } else {
                Editor.scale += scale;
                if (Editor.scale < 0.1) {
                    Editor.scale = 0.1;
                }
            }
            Editor.area.setScale(Editor.scale);
        },
        load: function (a) {
            var area = new Area(a, Editor.view, Editor.scroll);
            var layout = new Layout(a, area, Editor.zoneStyle);
            area.sectors.forEach(function (s) {
                Editor._addSector(s);
            });
            this.nameForm.val(layout.name);
            this.area = area;
            this.layout = layout;
            App.layoutSectorEditor.setZones(layout.zones);
        },
        json: function () {
            var json = this.layout.json();
            return JSON.stringify(json);
        },
        _addSector: function (s) {
            var click = function () {
                Editor.place.hide();
                App.layoutSectorEditor.load(s, Editor._saveSector);
            };
            s.dbClick(click);
            s.setVisibleTitle(Editor.isVisibleTitle);
            Editor.list.append(
                $('<li></li>').append(
                    $('<a></a>').append(s.name).on('click', click)
                )
            );
        },
        _saveSector: function () {
            Editor.place.show();
        }
    }

    App.layoutEditor = Editor;

}
    (jQuery)
    )
;

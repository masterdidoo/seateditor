var App = App || {};

(function ($) {

    function Sector(s, place, scale) {
        this.size = 10;
        this.scale = scale == null ? 1 : scale;
        this.isTitleVisible = true;
        this.init(place);
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
            this.jq.draggable({
                containment: 'parent',
                handle: this._dragHandler,
                stop: function () {
                    self._updatePos();
                }
            });
            this._rotator.rotatable({
                stop: function (a) {
                    self.rotate = a;
                }
            });
        },
        _updatePos: function () {
            if (this.jq != null) {
                var from = this.jq.position();
                this.top = Math.round(from.top / this.scale);
                this.left = Math.round(from.left / this.scale);
            }
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
        render: function () {
            var size = this.size * this.scale;
            this.jq.css({
                top: this.top * this.scale,
                left: this.left * this.scale
            });
            var body = this._body.empty();
            this._rotator.rotate(this.rotate);
            this._rotator.css({
                top: -this._height * size / 2,
                left: -this._width * size / 2,
                width: this._width * size,
                height: this._height * size
            });
            this._dragHandler.attr('title', this.name);
            this._createTitle(this._width * size);
            this.places.forEach(function (e) {
                var left = e[1] * size;
                if (e[2] > 0) {
                    left += size / 2;
                } else if (e[2] < 0) {
                    left -= size / 2;
                }
                $('<div>').css({
                    top: e[0] * size,
                    left: left,
                    height: size - 1,
                    width: size - 1
                }).appendTo(body);
            });
        },
        set: function (data) {
//            this.jq.html('');
            if (data == null) {
                this.top = 0;
                this.left = 0;
                this.rotate = 0;
                return;
            }
            this.top = data.top;
            this.left = data.left;
            this.rotate = data.rotate;
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
            var self = this;
            data.placeRows.forEach(function (r) {
                var row = parseInt(r.pos) - rowPos.min;
                if (r.places instanceof Array) {
                    r.places.forEach(function (p) {
                        self.places.push([row, parseInt(p.pos) - placePos.min, r.shift]);
                    });
                }
            });
            this.render();
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

    function Area(a, place) {
        var self = this;
        this.id = a.id;
        this.name = a.name;
        this.sectors = [];
        this.isSectorTtitleVisible = true;
        this.scale = 1;
        this.top = a.top;
        this.left = a.left;
        this.height = a.height;
        this.width = a.width;
        this.scene = $('<div class="ae-area-scene" title="Сцена"><strong>Сцена</strong></div>').css({
            position: 'absolute',
            top: a.top,
            left: a.left,
            height: a.height,
            width: a.width
        }).resizable({
                autoHide: true,
                stop: function () {
                    self._updatePos();
                }
            }).draggable({
                containment: 'parent',
                stop: function () {
                    self._updatePos();
                }
            });
        a.sectors.forEach(function (s) {
            var sector = new Sector(s, place);
            self.sectors.push(sector);
        });
    }

    Area.prototype = {
        appendScene: function (place) {
            this.scene.appendTo(place);
        },
        setScale: function (scale) {
            this.sectors.forEach(function (s) {
                s.setScale(scale);
            });
            this.scene.css({
                top: this.top * scale,
                left: this.left * scale,
                height: this.height * scale,
                width: this.width * scale
            });
            this.scale = scale;
        },
        _updatePos: function () {
            var from = this.scene.position();
            this.top = Math.round(from.top / this.scale);
            this.left = Math.round(from.left / this.scale);
            this.height = Math.round(this.scene.height() / this.scale);
            this.width = Math.round(this.scene.width() / this.scale);
        },
        json: function () {
            var sectors = [];
            this.sectors.forEach(function (r) {
                var x = r.json()
                if (x != null) {
                    sectors.push(x);
                }
            });
            return {
                id: this.id,
                name: this.name,
                top: this.top,
                left: this.left,
                height: this.height,
                width: this.width,
                sectors: sectors
            };
        }
    }

    function addPlace(a1, a2) {
        return {
            top: a1.top + a2.top,
            left: a1.left + a2.left
        }
    }

    function minusPlace(a1, a2) {
        return {
            top: a1.top - a2.top,
            left: a1.left - a2.left
        }
    }

    var Editor = {
        scale: 1,
        init: function (place) {
            this.place = place;
            this.list = place.find('#ae-sectors-list');
            this.nameForm = place.find('#ae-name-form');
            place.find("#ae-add-sector").on('click', function () {
                Editor.place.hide();
                App.sectorEditor.load(null, Editor._newSector);
            });
            var tmp = place.find("#ae-area-view");
            tmp.resizable();
            tmp.height(window.innerHeight - 40);
            var view = place.find('#ae-sectors-holder');
            this.view = view;
            this.height = view.height();
            this.width = view.width();
            place.find('#ae-area-save').on('click', function () {
                $('#ae-rez').text(Editor.json());
            });
            place.find('#ae-show-sector-title').on('change', function (e) {
                var checked = this.checked;
                Editor.area.sectors.forEach(function (s) {
                    s.setVisibleTitle(checked);
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
            Editor.view.height(this.height * Editor.scale);
            Editor.view.width(this.width * Editor.scale);
        },
        load: function (a) {
            var area = new Area(a, Editor.view);
            area.appendScene(Editor.view);
            area.sectors.forEach(function (s) {
                Editor._addSector(s);
            });
            this.nameForm.val(area.name);
            this.area = area;
        },
        json: function () {
            return JSON.stringify(this.area.json());
        },
        _addSector: function (s) {
            Editor.list.append(
                $('<li></li>').append(
                    $('<a></a>').append(s.name).on('click', function () {
                        Editor.place.hide();
                        Editor.link = $(this);
                        Editor.editSector = s;            //TODO изменить
                        App.sectorEditor.load(s.json(), Editor._saveSector);
                    })
                )
            );
        },
        _saveSector: function (json) {
            Editor.place.show();
            if (json != null) {
                var s = Editor.editSector;
                s.set(json);
                Editor.link.text(s.name);
            }
        },
        _newSector: function (json) {
            Editor.place.show();
            if (json != null) {
                Editor.editSector = new Sector(json, Editor.view, Editor.scale);
                Editor._addSector(Editor.editSector);
                Editor.area.sectors.push(Editor.editSector); //TODO изменить
            }
        }
    }

    App.areaEditor = Editor;

}(jQuery));
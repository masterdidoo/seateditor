var App = App || {};

(function ($) {

    function Place(row) {
        this.selected = false;
        this.name = '';
        this.row = row;
        this.jq = this.init(this);
    }

    Place.prototype = {
        set: function ($data) {
            this.name = $data.name;
            this.selected = true;
            this.render();
        },
        init: function (self) {
            this.dialog = $('<div class="place-dialog"></div>').append(
                $('<input type="text">').keyup({self: self}, this.keyup)
                    .on('blur', function () {
                        self.endSelect($(this).val());
                    })
//                    .on('blur', {self: self}, this.cancelSelect)
            );
            this.data = $('<div></div>');
            return $('<div class="place"></div>').append(this.data).append(this.dialog).on('click', function () {
                self.startSelect();
            });
        },
        keyup: function (e) {
            if (e.which == 27) {
                e.data.self.dialog.hide();
            } else if (e.which == 13) {
                e.data.self.endSelect($(this).val());
            }
        },
        cancelSelect: function (e) {
            e.data.self.dialog.hide();
        },
        render: function () {
            this.data.html(this.name);
            this.jq.attr('class', 'place selected');
        },
        endSelect: function (val) {
            this.dialog.hide();
            this.name = val;
            this.selected = true;
            this.render();
        },
        startSelect: function () {
            if (!this.selected) {
                var f = this.row.sector.getFromTo();
                if (f != null) {
                    var j = this.row.places.indexOf(this);
                    for (var i = f.from; (i <= f.to && j < this.row.places.length); i++) {
                        this.row.places[j].endSelect(i);
                        j++;
                    }
                } else {
                    this.dialog.show();
                    this.dialog.find('input').focus();
                }
            } else {
                this.jq.attr('class', 'place');
                this.data.html('');
                this.selected = false;
            }
        },
        json: function () {
            if (!this.selected) {
                return null;
            }
            return {
                name: this.name
            };
        }
    }

    function PlaceRow(sector) {
        this.shift = 0;
        this.name = null;
        this.places = [];
        this.sector = sector;
        this.jq = this.init(this);
        this.append(sector.cols);
    }

    PlaceRow.prototype = {
        set: function (data, minPos) {
            this.shift = data.shift == null ? 0 : data.shift;
            this.name = data.name;
            this.namePlace.val(data.name)
            var self = this;
            data.places.forEach(function (p) {
                self.places[parseInt(p.pos) - minPos].set(p);
            });
        },
        init: function (self) {
            this.namePlace = $('<input class="input-mini row-name" type="text">').on('change', function () {
                self.name = $(this).val();
            });
            this.div = $('<div class="row-center">');
            var row = $('<tr class="place-row">');
            row.append($('<td>').append(this.namePlace));
            row.append($('<td><i class="icon-arrow-left"></i></td>').on('click', function () {
                self.shiftLeft();
            }));
            row.append($('<td>').append(this.div));
            row.append($('<td><i class="icon-arrow-right"></i></td>').on('click', function () {
                self.shiftRight();
            }));
            return row;
        },
        shiftLeft: function () {
            if (this.shift > 0) {
                this.div.attr('class', 'row-center');
                this.shift = 0;
            } else {
                this.div.attr('class', 'row-left');
                this.shift = -1;
            }
        },
        shiftRight: function () {
            if (this.shift < 0) {
                this.div.attr('class', 'row-center');
                this.shift = 0;
            } else {
                this.div.attr('class', 'row-right');
                this.shift = 1;
            }
        },
        prepend: function (count) {
            for (var i = 0; i < count; i++) {
                var place = new Place(this);
                this.places.unshift(place);
                this.div.prepend(place.jq);
            }
        },
        append: function (count) {
            for (var i = 0; i < count; i++) {
                var place = new Place(this);
                place.row = this;
                this.places.push(place);
                this.div.append(place.jq);
            }
        },
        count: function () {
            var x = 0;
            this.places.forEach(function (p) {
                if (p.selected) {
                    x++;
                }
            });
            return x;
        },
        json: function () {
            var places = [];
            this.places.forEach(function (p, i) {
                var x = p.json()
                if (x != null) {
                    x.pos = i;
                    places.push(x);
                }
            });
            if (places.length < 1) {
                return null;
            }
            var rez = {
                name: this.name,
                places: places
            };
            if (this.shift != 0) {
                rez.shift = this.shift;
            }
            return rez;
        }
    }

    function Sector(a) {
        var self = this;
        this.scale = 1;
        this.placeFrom = -1;
        this.placeTo = -1;
        this.name = null;
        this.cols = 0;
        this.rows = [];
        this.area = a;
        this.jq = this.init(this);
    }

    Sector.prototype = {
        init: function (self) {
            this.namePlace = $('<label class="form-inline">Название сектора: </label>')
                .append($('<input type="text" class="input-xxlarge">').on('change', function () {
                    self.name = $(this).val()
                }));
            return $('<table class="sector">');
        },
        set: function ($data) {
            this.jq.html('');
            this.rows = [];
            this.namePlace.find('input').val('');      //TODO: исправить
            this.placeFrom = -1;
            this.placeTo = -1;
            if ($data == null) {
                this.top = 0;
                this.left = 0;
                this.rotate = 0;
                this.name = null;
                this.cols = 20;
                this.appendRows(10);
                return;
            }
            var maxPos = 0;
            var minPos = 1000000;
            $data.placeRows.forEach(function (r) {
                if (r.places instanceof Array) {
                    r.places.forEach(function (p) {
                        var pos = parseInt(p.pos);
                        if (pos > maxPos) {
                            maxPos = pos;
                        }
                        if (pos < minPos) {
                            minPos = pos;
                        }
                    });
                }
            });
            if (maxPos < minPos) {
                this.cols = 20;
                this.appendRows(10);
            } else {
                this.cols = maxPos - minPos + 1;
                var self = this;
                if ($data.placeRows.length > 0) {
                    var startPos = parseInt($data.placeRows[0].pos);
                    $data.placeRows.forEach(function (r) {
                        var row = new PlaceRow(self);
                        var pos = parseInt(r.pos);
                        row.set(r, minPos);
                        if (self.rows.length < pos - startPos) {
                            self.appendRows(pos - startPos - self.rows.length);
                        }
                        self.rows.push(row);
                        self.jq.append(row.jq);
                    });
                }
            }
            this.name = $data.name;
            this.top = $data.top;
            this.left = $data.left;
            this.rotate = $data.rotate;
            this.namePlace.find('input').val($data.name);
        },
        getFromTo: function () {
            if (this.placeFrom < 0) {
                return null
            }
            if (this.placeTo < 0) {
                return null
            }
            return {
                from: this.placeFrom,
                to: this.placeTo
            }
        },
        setFrom: function (val) {
            if (isNaN(val) || parseInt(val) != val) {
                this.placeFrom = -1;
            } else {
                this.placeFrom = parseInt(val);
            }
        },
        setTo: function (val) {
            if (isNaN(val) || parseInt(val) != val) {
                this.placeTo = -1;
            } else {
                this.placeTo = parseInt(val);
            }
        },
        appendRows: function (count) {
            for (var i = 0; i < count; i++) {
                var row = new PlaceRow(this);
                this.rows.push(row);
                this.jq.append(row.jq);
            }
        },
        prependRows: function (count) {
            for (var i = 0; i < count; i++) {
                var row = new PlaceRow(this);
                this.rows.unshift(row);
                this.jq.prepend(row.jq);
            }
        },
        appendCols: function (count) {
            this.rows.forEach(
                function (row) {
                    row.append(count);
                }
            );
            this.cols += count;
        },
        prependCols: function (count) {
            this.rows.forEach(
                function (row) {
                    row.prepend(count);
                }
            );
            this.cols += count;
        },
        count: function () {
            var x = 0;
            this.rows.forEach(function (r) {
                x += r.count()
            });
            return x;
        },
        json: function () {
            var rows = [];
            this.rows.forEach(function (r, i) {
                var x = r.json()
                if (x != null) {
                    x.pos = i;
                    rows.push(x);
                }
            });
            return {
                name: this.name,
                placeRows: rows,
                top: this.top,
                left: this.left,
                rotate: this.rotate
            };
        }
    }

    function copyTopLeft(from, to) {
        to.top = from.top;
        to.left = from.left;
    }

    var self = {
        _createTdButton: function (onclick) {
            return $('<td></td>').append(this._createButton(onclick))
        },

        _createButton: function (onclick) {
            return $('<button class="btn"><i class="icon-plus"></i></button>').on('click', onclick);
        },

        setInput: function (from, to) {
            from.on('change', function () {
                self.sector.setFrom($(this).val());
            });
            to.on('change', function () {
                self.sector.setTo($(this).val());
            });
            this.from = from;
            this.to = to;
        },

        json: function () {
            self.save = self.sector.json();
            $('#eee').html(JSON.stringify(self.sector.json()));
        },

        load: function (sector, callback) {
            self.sector.set(sector);
            this.place.show();
            self.callback = callback;
            this.from.val('');
            this.to.val('');
        },

        new: function () {
            self.sector.set();
            this.place.show();
        },

        init: function (place) {
            place.hide();

            var sector = new Sector(null);

            this.sector = sector;

            place.append(sector.namePlace);

            $('<table class="sector-widget">').append(
                    $('<tr><td></td></tr>').append(
                        this._createTdButton(function () {
                            sector.prependRows(1);
                        })
                    ).append($('<td></td>'))
                ).append(
                    $('<tr>').append(
                            this._createTdButton(function () {
                                sector.prependCols(1);
                            })
                        )
                        .append(
                            $('<td>').append(sector.jq)
                        )
                        .append(
                            this._createTdButton(function () {
                                sector.appendCols(1);
                            })
                        )
                )
                .append(
                    $('<tr><td></td></tr>').append(
                            this._createTdButton(function () {
                                sector.appendRows(1);
                            })
                        )
                        .append($('<td></td>'))
                )
                .append(
                    $('<tr><td></td></tr>')
                        .append(
                            '<div class="form-inline">' +
                                '<label>c <input id="place-from" type="text" class="input-mini"></label>' +
                                ' <label>по <input id="place-to" type="text" class="input-mini"></label>' +
                                '</div>'
                        )
                        .append($('<td></td>'))
                )
                .appendTo(place);
            place.append(
                $('<button class="btn btn-primary"><i class="icon-white icon-ok"></i> Сохранить</button>')
                    .on('click', function () {
                        place.hide();
                        self.callback(self.sector.json());
                    })
            );
            place.append(' ');
            place.append(
                $('<button class="btn"><i class="icon-remove"></i> Отмена</button>')
                    .on('click', function () {
                        place.hide();
                        self.callback(null);
                    })
            );
            self.setInput(place.find("#place-from"), place.find("#place-to"));
            place.find("#place-group").on('change',function () {
                self.sector.placeGroup = $(this).val()
            }).change();
            this.place = place;
        }
    }

    App.sectorEditor = self;

}(jQuery));
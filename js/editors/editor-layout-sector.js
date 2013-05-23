var App = App || {};

(function ($) {

    var self = {
        size: 28 + 4,
        createBody: function (data) {
            self.places = [];
            var size = this.size;
            var rez = $('<table>');
            data.placeRows.forEach(function (row) {
                var r = $('<div class="ea-sector-body">');
                rez.append($('<tr><td>' + row.name + '</td></tr>').append(r));
                if (row.shift > 0) {
                    r.css({left: size / 2});
                } else if (row.shift < 0) {
                    r.css({left: -size / 2});
                }
                row.places.forEach(function (e) {
                    delete e.newZone;
                    self.places.push(e);
                    var left = e.pos * size;
                    $('<div class="' + 'z' + e.zone + '" style="left: ' + left + 'px;">' + e.name + '</div>')
                        .data('place', e)
                        .appendTo(r);
                });
            });
            return rez;
        },
        setZones: function (zones) {
            this._zones.html(
                zones.reduce(function (html, z) {
                    return html + '<option value="' + z.id + '">' + z.name + '</option>';
                }, '')
            );
            this.zone = zones[0].id;
            this.zoneClass = 'z' + zones[0].id;
        },
        load: function (data, callback) {
            this.data = data;
            this.callback = callback;
            this.view.html(this.createBody(data));
            this.place.show();
        },
        _onSelectZone: function (e) {
            self.zone = this.value;
            self.zoneClass = 'z' + this.value;
        },
        _onStopSelect: function (e, u) {
            u.selected.className = self.zoneClass;
            $(u.selected).data('place').newZone = self.zone;
        },
        _onSave: function () {
            self.place.hide();
            self.places.forEach(function (p) {
                if (p.newZone != null) {
                    p.zone = p.newZone
                }
            });
            self.data.render();
            self.callback(null);
        },
        init: function (place) {
            this.place = place;
            place.hide();

            this.view = $('<div class="la-sector-edit">').selectable({
                filter: 'div div',
                selected: this._onStopSelect
            });
            place.find('#la-sector-view').append(this.view);

            this._zones = $('<select></select>').on('change', this._onSelectZone);
            place.find('#la-sector-zones').append(this._zones);

            place.find('#la-sector-buttons')
                .append(
                    $('<button class="btn btn-primary"><i class="icon-white icon-ok"></i> Сохранить</button>')
                        .on('click', this._onSave)
                )
                .append(' ')
                .append(
                    $('<button class="btn"><i class="icon-remove"></i> Отмена</button>')
                        .on('click', function () {
                            place.hide();
                            self.callback(null);
                        })
                );
        }
    };

    App.layoutSectorEditor = self;

}(jQuery));
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
            var self = this;
            zones.forEach(function (z) {
                self._zoneSelector.append(
                    $('<li><a tabindex="-1" href="#"><div class="z' + z.id + '"></div> ' + z.name + '</a></li>')
                        .data('zone',z)
                        .on('click', self._onSelectZone)
                );
            });
            this._setCurZone(zones[0]);
        },
        _setCurZone: function(z) {
            this._zoneName.html('<div class="z' + z.id + '"></div> ' + z.name);
            this.zone = z.id;
            this.zoneClass = 'z' + z.id;
        }   ,
        _onSelectZone: function (e) {
            self._setCurZone($(this).data('zone'));
            self._zoneSelector.hide();
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
            self.callback();
        },
        load: function (data, callback) {
            this.data = data;
            this.callback = callback;
            this.view.html(this.createBody(data));
            this.place.show();
        },
        init: function (place) {
            this.place = place;
            place.hide();

            this.view = $('<div class="la-sector-edit">').selectable({
                filter: 'div div',
                selected: this._onStopSelect
            });
            place.find('#la-sector-view').append(this.view);

            this._zoneSelector = $('#la-zone-selector');
            this._zoneName = $('#la-sector-zone-name').on('click', function(){self._zoneSelector.show()}).find('p');

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
                            self.callback();
                        })
                );
        }
    };

    App.layoutSectorEditor = self;

}(jQuery));
/*global console, $ */

(function( $ ) {
    "use strict";

    $.widget( 'naba.switchFilter', {
        version: '0.1',
        widgetEventPrefix: 'switchFilter',
        options: {
            label: null,
            onChange: null,
            value: null
        },
        _uiElements: null,

        _create: function() {
            var that = this;


            this.element.addClass( 'switch-filter' );

            this.options.values = this.options.values || [ this.options.min, this.options.max ];

            this._uiElements = this._uiElements || {};

            this._uiElements.$switch = $( '<div class="switch-filter-box">' +
                '<div class="switch-filter-bg">' +
                '<div class="switch-filter-knob"></div>' +
                '</div></div>' )
                .on( 'click', function( e ) {
                    var ui = {};

                    that.options.value = !that.options.value;
                    that._refresh();

                    if ( $.isFunction( that.options.onChange )) {
                        ui.value = that.options.value;
                        that.options.onChange( e, ui );
                    }

                })
                .appendTo( this.element);

            this._uiElements.$switchBg = this.element.find( '.switch-filter-bg' );

            this._refresh();

            if ( this.options.label ) {
                this.element.append( $('<label/>', {
                    'text': this.options.label
                }));
            }

        },

        _refresh: function() {

            if ( this.options.value === true ) {
                this._uiElements.$switch.addClass( 'ON' );
                this._uiElements.$switchBg.attr( 'title', 'On' );
            } else {
                this._uiElements.$switch.removeClass( 'ON' );
                this._uiElements.$switchBg.attr( 'title', 'Off' );
            }

        },

        _destroy: function() {
            this.element.removeClass( 'switch-filter' );
            this.element.empty();
        }
    } );

})( jQuery );
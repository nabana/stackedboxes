/*global console, $ */

(function( $ ) {
    "use strict";

    $.widget( 'naba.multiSelectFilter', {
        version: '0.1',
        widgetEventPrefix: 'multiSelectFilter',
        options: {
            label: null,
            options: null,
            onChange: null,
            values: null
        },
        _uiElements: null,

        _create: function() {
            var that = this,
                $select;


            this.element.addClass( 'multiselect-filter' );

/*            if ( this.options.values === "ALL" ) {
                 that.options.values = [];
                 $.each( this.options.options, function( i, e ) {
                    that.options.values.push( e.value );
                } );

            }*/

            this.options.values = this.options.values || [ ];

            this._uiElements = this._uiElements || {};

            if ( this.options.label && $.isArray( this.options.options ) ) {

                /*this.element.append( $('<label/>', {
                    'text': this.options.label
                }));*/

                $select = $( '<select/>', {
                    'multiple': 1
                } );

                this._uiElements.$select = $select;

                this.element.append( $select );

                $.each( this.options.options, function( i, e ) {

                    var $o;

                    $o = $( '<option/>', {
                        text: e.label,
                        value: e.value
                    } );

                    if ( that.options.values.indexOf( e.value ) > -1 ) {
                        $o.attr( 'selected', 1 );
                    }

                    $select.append( $o );

                } );

                $select.val( this.options.values );

                $select.multiselect( {
                    classes: 'multiselectfilter',
                    position: {
                        my: 'left top',
                        at: 'left bottom'
                    },
                    minWidth: '300',
                    height: '300',
                    noneSelectedText: this.options.label,
                    selectedText: '# ' + this.options.label
                } );

                $select.on( 'change', function(event, ui) {

                    if ( $.isFunction( that.options.onChange )) {
                        that.options.onChange.call( this, this, { values: $select.val() } );
                    }

                } );

            }

        },

        _destroy: function() {
            this.element.removeClass( 'multiselect-filter' );
            this.element.empty();
        }
    } );

})( jQuery );

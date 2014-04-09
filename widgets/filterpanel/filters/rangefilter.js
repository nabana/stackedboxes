/*global console, $ */

(function( $ ) {
    "use strict";

    $.widget( 'naba.rangeFilter', {
        version: '0.1',
        widgetEventPrefix: 'rangeFilter',
        options: {
            label: null,
            min: null,
            max: null,
            onChange: null,
            onSlide: null,
            values: null
        },
        _uiElements: null,

        _create: function() {
            var $slider,
                $min, $max,
                that = this;

            if ( !isNaN( this.options.min ) &&
                 !isNaN( this.options.max )) {

                this.element.addClass( 'range-filter' );

                this.options.values = this.options.values || [ this.options.min, this.options.max ];

                $slider = $( '<div/>', {} ).slider( {
                    range: true,
                    min: this.options.min,
                    max: this.options.max,
                    values: this.options.values
                } );

                if ( $.isFunction( this.options.onChange )) {
                    $slider.on( 'slide', this.options.onChange );
                }

/*                if ( $.isFunction( this.options.onChange )) {
                    $slider.on( 'slidechange', this.options.onChange );
                }*/

                if ( this.options.label ) {
                    this.element.append( $('<label/>', {
                        'text': this.options.label
                    }));
                }

                $min = $( '<input/>', {
                    'class': 'min-val',
                    change: function() {
                        var $this = $( this), v = Number( $this.val() );
                        if ( ! isNaN( v ) &&
                            v !== that.options.values[ 0 ] &&
                            v >= that.options.min &&
                            v < that.options.values[ 1 ] ) {
                            that.options.values[ 0 ] = Number( v );
                            $slider.slider( 'values', that.options.values );

                            if ( $.isFunction( that.options.onChange )) {
                                that.options.onChange.call( this, this, { values: that.options.values } );
                            }

                        } else {
                            $this.val( that.options.values[ 0 ] );
                        }
                    }
                } ).val( this.options.values[ 0 ] );

                $max = $ ( '<input/>', {
                    'class': 'max-val',
                    change: function() {
                        var $this = $( this), v = Number( $this.val() );
                        if ( ! isNaN( v ) &&
                            v !== that.options.values[ 1 ] &&
                            v <= that.options.max &&
                            v > that.options.values[ 0 ] ) {
                            that.options.values[ 1 ] = Number( v );
                            $slider.slider( 'values', that.options.values );

                            if ( $.isFunction( that.options.onChange )) {
                                that.options.onChange.call( this, this, { values: that.options.values } );
                            }

                        } else {
                            $this.val( that.options.values[ 1 ] );
                        }
                    }
                } ).val( this.options.values[ 1 ] );

                this.element.append( $min );
                this.element.append( $max );

                $slider.on( 'slide', function( event, ui ) {
                    $min.val( ui.values[ 0 ] );
                    $max.val( ui.values[ 1 ] );
                    that.options.values = ui.values;
                } );

                this.element.append( $slider );
            }
        },

        _destroy: function() {
            this.element.removeClass( 'range-filter' );
            this.element.empty();
        }
    } );

})( jQuery );
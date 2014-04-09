/*global console, $ */

(function( $ ) {
    "use strict";

    $.widget( 'naba.filterPanel', {
        version: '0.1',
        widgetEventPrefix: 'stacked',
        options: {
            label: null,
            items: null,
            visible: true,
            hideable: false
        },
        _uiElements: null,
        _filters: null,
        _createElements: function() {
            var $filterPanel,
                $filterList;

            this._uiElements = this._uiElements || {};

            $filterPanel  = this._uiElements.$filterPanel = $( '<section/>', {
                'class': 'filter-panel'
            } );

            if ( this.options.label ) {
                $filterPanel.append( $( '<header/>', {
                    'text': this.options.label
                } ) );
            }

            $filterList = this._uiElements.$filterList = $( '<ul/>', {
                'class': 'filter-list'
            });

            this.element.addClass( 'filter-panel-container' );
            this.element.append( $filterPanel.append( $filterList ) );

            if ( $.isArray( this.options.items )) {
                $.each( this.options.items, function() {
                    var $li, that = this;

                    if ( this.type !== undefined ) {

                        that._filters = that._filters || [];

                        $li = $( '<li/>' );

                        switch ( this.type ) {
                            case 'range':
                                $li.rangeFilter( this );
                                that._filters.push( $li );
                                break;
                            case 'spacer':
                                $li.addClass( 'SPACER' );
                                that._filters.push( $li );
                                break;
                            case 'switch':
                                $li.switchFilter( this );
                                that._filters.push( $li );
                                break;
                            case 'multiSelect':
                                $li.multiSelectFilter( this );
                                that._filters.push( $li );
                                break;
                        }

                        $filterList.append( $li );
                    }
                } );
            }

            if ( this.options.visible !== true || $filterList.children().length === 0 ) {
                $filterPanel.hide();
            }


        },
        _create: function() {
            this._createElements();
        },
        _destroy: function() {
            $.each( this._filters, function() {
                this.destroy();
            });
            this.element.removeClass( 'filter-panel-container' );
            this._uiElements.$filterPanel.remove();
        }

    });

})( jQuery );
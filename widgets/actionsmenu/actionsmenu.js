/*global console, $ */

(function( $ ) {
    "use strict";

    var $html = $( 'html' );

    $.widget( 'naba.actionsMenu', {
        version: '0.1',
        widgetEventPrefix: 'actionsMenu',
        options: {
            cssClass: 'actions-menu',
            actions: null,
            itemProvider: null
        },
        $menu: null,

        _createElements: function() {
            var that = this;

            this.element.addClass( 'actionsmenu-trigger' );
            this.$menu = $( '<ul/>', {
                'class': 'actions-menu-actions'
            });
            this.element.on( 'click.actionsMenu', function(e) {
                var offset = that.element.offset(),
                    height = that.element.height();

                if ( $.visibleActionsMenu && $.visibleActionsMenu !== that.$menu ) {
                    $.visibleActionsMenu.remove();
                    $html.off( 'click.actionsMenu' );
                    $( window ).off( 'blur.actionsMenu' );
                }

                that.refresh();
                that.$menu.appendTo( $( 'body' ));
                that.$menu.css( 'left', offset.left );
                that.$menu.css( 'top', offset.top + height );
                that.$menu.show();
                e.stopPropagation();
                $.visibleActionsMenu = that.$menu;
                $html.one( 'click.actionsMenu', function() {
                    if ( $.visibleActionsMenu ) {
                        $.visibleActionsMenu.remove();
                    }
                });
                $( window ).one( 'blur.actionsMenu', function() {
                    if ( $.visibleActionsMenu ) {
                        $.visibleActionsMenu.remove();
                    }
                });


            } );

        },
        refresh: function() {
            var that = this,
                actionItems;

            if ( $.isFunction(this.options.itemProvider) ) {
                actionItems = this.options.itemProvider();
            } else {
                actionItems = [];
            }
            if ( this.$menu ) {
                that.$menu.empty();
                if ( this.options.actions !== null ) {
                    $.each( this.options.actions, function() {
                        var actionItem = this;

                        if ( $.isFunction( actionItem.action )) {
                            var elementIsEnabled = true,
                                $e = $( '<li/>', {
                                    'class': 'actions-menu-item',
                                    text: actionItem.label
                                });

                            if ( $.isFunction( actionItem.guard ) ) {
                                elementIsEnabled = actionItem.guard.call( that, actionItems );
                            }

                            if ( elementIsEnabled === true ) {
                                $e.click( function() {
                                    actionItem.action.call( that, actionItems );
                                });
                            } else {
                                $e.addClass( 'inactive' );
                            }

                            that.$menu.append( $e );
                        }
                    });
                }
            }
        },
        _setOption: function( key, value ) {
            this._super( key, value );
        },

        _setOptions: function( options ) {
            this._super( options );
            this.refresh();
        },
        _create: function() {
            this._createElements();
            this.refresh();
        },
        _destroy: function() {
            this.element.removeClass( 'actionsmenu-trigger' );
            this.$menu.remove();
            this.element.off( 'click.actionsMenu' );
            $html.off( 'click.actionsMenu' );
            $( window ).off( 'blur.actionsMenu' );
        }
    });

})( jQuery );
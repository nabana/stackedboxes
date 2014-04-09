/*global console, $, Utils, self */

(function( $ ) {
    "use strict";

    $.stacked = {
        containers: [],
        boxesToRedrawPerFrame: 600,
        redrawBoxes: function( ) {
            var i;
            for ( i=0; i< $.stacked.containers.length; i++ ) {
                $.stacked.containers[ i ]._redrawBoxes.call(
                    $.stacked.containers[ i ],
                    $.stacked.containers[ i ].options.boxesToRedrawPerFrame || $.stacked.boxesToRedrawPerFrame
                );
            }
            self.requestAnimationFrame( $.stacked.redrawBoxes );
        }
    };


    self.requestAnimationFrame( $.stacked.redrawBoxes );

    $.widget( 'naba.stackedBoxes', {

        version: '0.1',
        widgetEventPrefix: 'stacked',
        options: {
            dimensions: {
                columns: 80,
                rows: 30
            },
            box: {
                width: 5,
                height: 5,
                padding: {
                    vertical: 1,
                    horizontal: 1
                },
                scaleToFill: true
            },
            autoGrowHeight: true,
            data: null,
            invertGravity: false,
            style: {
                box: {
                    fillColor: '#aaa',
                    filteredAlpha: 0.3,
                    hoverBorderColor: 'rgba(255, 100, 0, .7)',
                    selectBorderColor: 'rgba(255, 100, 0, .7)'
                },
                hoverPanel: {
                    background: '#333',
                    color: '#fff'
                }
            },
            title: undefined,
            subtitle: undefined,
            orderingOptions: null,
            coloringOptions: null,
            hasOptionsPanel:true,
            optionsPanelAutoExpanded: true,
            boxesToRedrawPerFrame: undefined,
            orderBy: undefined,
            colorBy: undefined,
            orderingDirection: 'BOTTOM_UP',
            hasHeader: false,
            hoverPanelContent: null,
            clickAction: null,
            itemsActions: null,
            filteringOptions: null,
            onSelectionAction: null,
            rectangularSelection: false,
            sideItem: null
        },

        _uiElements: null,

        _calculatedSize: null,

        _hoverPosition: undefined,
        _filteredIndexes: null,

        _optionsPanelExpanded: false,
        _context: null,
        _glContext: null,
        _boxesToRender: null,

        _potentiallyDrawingSelection: false,
        _DrawingSelection: false,
        _filteringDrawnFrom: null,

        _boxesForDrawnSelection: null,

        _selectedItems: null,

        _coloringOperator: null,

        _order: function() {

            var orderBy = this.options.orderBy,
                indexes=[],
                operatorA;

            if ( $.isArray( this.options.orderingOptions ) && orderBy !== undefined ) {

                operatorA = $.grep( this.options.orderingOptions, function( o ) {
                    return o.label === orderBy;
                } );

                if ( $.isFunction( operatorA[ 0 ].operator ) ) {

                    this.options.data.sort( operatorA[ 0 ].operator );
                    if ( this.options.orderingDirection === 'UP_BOTTOM' ) {
                        this.options.data.reverse();
                    }
                }

            }

            $.each( this.options.data, function( i, dataObj ) {
                if ( dataObj._filtered === true ) {
                    indexes.push( i );
                }
            });

            this._filteredIndexes = indexes;

        },

        _color: function( key ) {
            if ( this._coloringOperator ) {
                return this._coloringOperator( key );
            } else {
                return this.options.style.box.fillColor;
            }
        },

        _columnAndRowForOffset: function( x, y ) {

            var result = {
                column: undefined,
                row: undefined,
                offsetInCell: {
                    x: undefined,
                    y: undefined
                }
            }, x2, y2,
            offsetX, offsetY;

            if ( !isNaN( x ) && !isNaN( y ) &&
                x > this.options.box.padding.horizontal &&
                y > this.options.box.padding.vertical &&
                x < this._uiElements.$canvas[0].width &&
                y < this._uiElements.$canvas[0].height ) {

                x2 = ( x - this.options.box.padding.horizontal );
                y2 = ( y - this.options.box.padding.vertical + this._calculatedSize.rowFrictionHeight );

                offsetX = x2 % this._calculatedSize.boxPaddedSize.width;
                offsetY = y2 % this._calculatedSize.boxPaddedSize.height;

                if ( offsetX <= this._calculatedSize.boxWidth &&
                    offsetY <= this._calculatedSize.boxHeight ) {

                    result.column = Math.floor( x2 / this._calculatedSize.boxPaddedSize.width );
                    result.row = Math.floor( y2 / this._calculatedSize.boxPaddedSize.height );
                    result.offsetInCell.x = offsetX;
                    result.offsetInCell.y = offsetY;

                }
            }

            return result;

        },

        _getPositionForColumnAndRow: function( column, row ) {
            var c = column,
                r = row;

            if ( this.options.invertGravity === false ) {
                r = Math.ceil( this._calculatedSize.rows ) - r - 1;
            }

            if ( r % 2 !== 0 ) {
                c =  this._calculatedSize.columns - c - 1;
            }

            return r * this._calculatedSize.columns + c;
        },

        _getBoxForOffset: function( x, y ) {

            var result,
                dataObj,
                left, top;
            
            result = this._columnAndRowForOffset( x, y );

            if ( !isNaN( result.row ) &&
                result.row >= 0 &&
                result.column >= 0 &&
                !isNaN( result.column ) ) {

                result.position = this._getPositionForColumnAndRow( result.column, result.row );

                dataObj = this.options.data[ result.position ];

                if ( dataObj !== undefined ) {
                    result.dataObj = dataObj;
                }

                left = x - result.offsetInCell.x;
                top = y - result.offsetInCell.y;
                result.boundaries = {
                    left: left,
                    top: top,
                    right: left + this._calculatedSize.boxWidth,
                    bottom: top + this.options.box.height
                };


            }

            return result;

        },

        _createElements: function() {
            var that = this;

            this._uiElements = {

                $encapsuler: null,
                $canvas: null,

                optionsPanelElements: {
                    $optionsPanel: null,
                    $optionsButton :null,
                    $orderingSelector: null,
                    $coloringSelector: null,
                    $actionsMenu: null
                },

                headerElements: {
                    $header: null,
                    $title: null,
                    $subtitle: null,
                    $counts: null
                },

                $body: null,
                $side: null,

                boxHoverPanel: null,
                boxHoverPanelContentHolder: null,

                $emptySign: null

            };

            this._uiElements.$encapsuler = $( '<section/>', {
                'class': 'stackedboxes-encapsuler'
            } );

            this._uiElements.$canvas = $( '<canvas/>', {
                'class': 'stackedboxes-container'
            } );

            this._uiElements.$body = $( '<section/>', {
                'class': 'stackedboxes-body'
            } );

            this._uiElements.$side = $( '<aside/>', {
                'class': 'stackedboxes-side'
            } );


            this.element.append( this._uiElements.$encapsuler );
            this._uiElements.$body.disableSelection();
            this._uiElements.$encapsuler.append( this._uiElements.$body );
            this._uiElements.$body.append( this._uiElements.$canvas );
            this._uiElements.$encapsuler.append( this._uiElements.$side );

            this._uiElements.$emptySign = $( '<div class="empty-sign"><div class="content">No items</div></div>').hide();
            this._uiElements.$body.append( this._uiElements.$emptySign );


            this._context = this._uiElements.$canvas[0].getContext('2d' );
            this._uiElements.$canvas.mousemove( function( e ) {
                self.normalizeMouseEvent( e );
                var box = that._getBoxForOffset( e.offsetX, e.offsetY );
                if ( that._potentiallyDrawingSelection === true ) {
                    that._potentiallyDrawingSelection = false;
                    that._startDrawingSelection( e.offsetX, e.offsetY );
                }
                if ( that._DrawingSelection === true ) {
                    that._updateDrawingSelection( e.offsetX, e.offsetY );
                } else {
                    if ( box.position !== that._hoverPosition ) {
                        if ( that._hoverPosition !== undefined && that.options.data[ that._hoverPosition ]) {
                            that._boxesToRender.push( {
                                position: that._hoverPosition,
                                data: that.options.data[ that._hoverPosition ],
                                flags: [ 'UNHOVER' ]
                            } );
                            that._hoverPosition = undefined;
                        }
                        if ( box.dataObj !== undefined ) {
                            that._boxesToRender.push( {
                                position: box.position,
                                data: box.dataObj,
                                flags: [ 'HOVER' ]
                            } );
                            that._hoverPosition = box.position;

                            if ( that.options.hoverPanelContent ) {

                                if ( $.isFunction( that.options.hoverPanelContent ) ) {
                                    that._displayBoxHoverPanel( box.position, that.options.hoverPanelContent.call( that, box.dataObj ) );
                                } else {
                                    that._displayBoxHoverPanel( box.position, that.options.hoverPanelContent );
                                }
                            }

                        } else {
                            that._removeBoxHoverPanel();
                        }
                    }
                }
            });

            this._uiElements.$canvas.mousedown( function( e ) {
                if ( $.isFunction( that.options.onSelectionAction )) {
                    that._potentiallyDrawingSelection = true;
                    that._filteringDrawnFrom = {
                        x: e.offsetX,
                        y: e.offsetY
                    };
                }
                e.preventDefault();
            });

            this._uiElements.$canvas.mouseup( function( e ) {
                var box;
                that._potentiallyDrawingSelection = false;
                if ( that._DrawingSelection === true ) {
                    that._finishDrawingSelection();
                } else {
                    // If it was clicking
                    if ( that.options.clickAction && $.isFunction( that.options.clickAction )) {
                        self.normalizeMouseEvent( e );
                        box = that._getBoxForOffset( e.offsetX, e.offsetY );
                        if ( box !== undefined && box.dataObj !== undefined ) {
                            that.options.clickAction.call( that, box.dataObj );
                        }
                    }

                }
            });

            this._uiElements.$canvas.mouseleave( function( e ) {
                var $me = that._uiElements.$canvas;
                if (
                        e.offsetX < 0 ||
                        e.offsetY < 0 ||
                        e.offsetX > $me.width() ||
                        e.offsetY > $me.height()
                    ) {
                    that._potentiallyDrawingSelection = false;
                    that._cancelDrawingSelection();
                }

                if ( that._hoverPosition !== undefined && that.options.data[ that._hoverPosition ]) {
                    that._boxesToRender.push( {
                        position: that._hoverPosition,
                        data: that.options.data[ that._hoverPosition ],
                        flags: [ 'UNHOVER' ]
                    } );
                    that._removeBoxHoverPanel();

                    that._hoverPosition = undefined;
                }

            });

            this._uiElements.boxHoverPanel = $( '<div/>', {
                'class': 'box-hover-panel'
            });
            this._uiElements.boxHoverPanelContentHolder = $( '<div/>', {
                'class': 'box-hover-panel-content-holder'
            });
            this._uiElements.boxHoverPanel.append( this._uiElements.boxHoverPanelContentHolder );
        },

        _startDrawingSelection: function( offsetX, offsetY) {
            var box = this._getBoxForOffset( offsetX, offsetY );
            if ( box && box.position !== undefined ) {
                this._boxesForDrawnSelection = {
                    startBox: box,
                    endBox: null
                };
                this._removeBoxHoverPanel();
                this._DrawingSelection = true;
            }
        },

        _updateDrawingSelection: function( offsetX, offsetY) {
            var box = this._getBoxForOffset( offsetX, offsetY );
            if ( box && box.position !== undefined && box !== this._boxesForDrawnSelection.endBox ) {
                this._DrawingSelection = true;
                this._drawSelectionBoundaries( true );
                this._boxesForDrawnSelection.endBox = box;
                this._drawSelectionBoundaries();
            }
        },

        invertSelection: function() {
            var i, newSelection = [];
            if ( $.isArray( this._selectedItems ) ) {
                for ( i = 0; i < this.options.data.length; i++ ) {
                    if ( this._selectedItems.indexOf( i ) === -1 ) {
                        newSelection.push( i );
                    }
                }
                this._selectedItems = newSelection;
            }
        },

        _finishDrawingSelection: function() {
            if ( this._DrawingSelection ) {
                this._drawSelectionBoundaries( true );
                this._boxesForDrawnSelection = null;
                this.options.onSelectionAction.call( this, this._selectedItems );
                this._selectedItems = null;
                this._DrawingSelection = false;
            }
        },

        _cancelDrawingSelection: function() {
            if ( this._DrawingSelection ) {
                this._drawSelectionBoundaries( true );
                this._boxesForDrawnSelection = null;
                this._selectedItems = null;
                this._DrawingSelection = false;
            }
        },

        _drawSelectionBoundaries: function( remove  ) {
            var boxes = this._boxesForDrawnSelection,
                positionToAdd = [], dataObj,
                i, j;

            if ( boxes &&
                boxes.startBox &&
                boxes.endBox ) {

                if ( this.options.rectangularSelection === true ) {

                    if ( boxes.endBox.column >= boxes.startBox.column ) {
                        for ( i = 0; i <= boxes.endBox.column - boxes.startBox.column; i++ ) {
                            if ( boxes.endBox.row >= boxes.startBox.row ) {
                                for ( j = 0; j <= boxes.endBox.row - boxes.startBox.row; j++ ) {
                                    positionToAdd.push(
                                        this._getPositionForColumnAndRow(
                                            boxes.startBox.column + i,
                                            boxes.startBox.row + j
                                        ) );
                                }
                            } else {
                                for ( j = 0; j <= boxes.startBox.row - boxes.endBox.row; j++ ) {
                                    positionToAdd.push(
                                        this._getPositionForColumnAndRow(
                                            boxes.startBox.column + i,
                                            boxes.startBox.row - j
                                        ) );
                                }
                            }
                        }
                    } else {
                        for ( i = 0; i <= boxes.startBox.column - boxes.endBox.column; i++ ) {
                            if ( boxes.endBox.row >= boxes.startBox.row ) {
                                for ( j = 0; j <= boxes.endBox.row - boxes.startBox.row; j++ ) {
                                    positionToAdd.push(
                                        this._getPositionForColumnAndRow(
                                            boxes.startBox.column - i,
                                            boxes.startBox.row + j
                                        ) );
                                }
                            } else {
                                for ( j = 0; j <= boxes.startBox.row - boxes.endBox.row; j++ ) {
                                    positionToAdd.push(
                                        this._getPositionForColumnAndRow(
                                            boxes.startBox.column - i,
                                            boxes.startBox.row - j
                                        ) );
                                }
                            }
                        }
                    }

                } else {
                    //This is the default

                    if ( boxes.endBox.position > boxes.startBox.position ) {
                        j = 1;
                    } else {
                        j = -1;
                    }

                    for ( i = boxes.startBox.position; i !== boxes.endBox.position; i += j ) {
                        positionToAdd.push( i );
                    }

                    positionToAdd.push( boxes.endBox.position );

                }


                this._selectedItems = [];

                for ( i = 0; i < positionToAdd.length; i++ ) {
                   dataObj = this.options.data[ positionToAdd[ i ] ];

                    if ( dataObj !== undefined ) {

                        this._selectedItems.push( positionToAdd[ i ] );

                        if ( remove === true ) {
                            this._drawBox2D(
                                positionToAdd[ i ],
                                dataObj,
                                [ 'UNSELECT' ]
                            );
                        } else {
                            this._drawBox2D(
                                positionToAdd[ i ],
                                dataObj,
                                [ 'SELECT' ]
                            );
                        }
                    }
                }
            }
        },

        _displayBoxHoverPanel: function( boxPosition, $content ) {
            var canvasOffset,
                boxOffset;

            canvasOffset = this._uiElements.$canvas.offset();
            boxOffset = this._getOffsetForPosition( boxPosition );

            this._uiElements.boxHoverPanel.css( 'left', canvasOffset.left + boxOffset.left );
            this._uiElements.boxHoverPanel.css( 'top', canvasOffset.top + boxOffset.top +
                this._calculatedSize.boxPaddedSize.height + this.options.box.padding.vertical );

            this._uiElements.boxHoverPanelContentHolder.empty();
            this._uiElements.boxHoverPanelContentHolder.append( $content );

            $( 'body' ).append( this._uiElements.boxHoverPanel );
        },

        _removeBoxHoverPanel: function() {
            this._uiElements.boxHoverPanel.remove();
        },

        _create: function() {

            this._calculatedSize = {
                boxPaddedSize: {
                    width: undefined,
                        height: undefined
                },
                canvasSizeWithOneLessPadding: {
                    width: undefined,
                        height: undefined
                },
                totalPadding: {
                    vertical: undefined,
                        horizontal: undefined
                }
            };

            this._createElements();
            this._boxesToRender = [];

            this.refresh();
            $.stacked.containers.push( this );
        },

        _destroy: function() {
            this._uiElements.$encapsuler.remove();
        },

        _redrawBoxes: function( limit ) {
            var that = this, boxInfo, count = 0;

            if ( this._boxesToRender.length > 0 ) {

                while  ( count < limit && ( boxInfo = that._boxesToRender.shift() ) ) {
                    that._drawBox2D(
                        boxInfo.position,
                        boxInfo.data,
                        boxInfo.flags
                    );
                    count += 1;
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

        _getOffsetForPosition: function( position ) {
            var row,
                column;

            row = Math.floor( position / this._calculatedSize.columns );
            column = position % this._calculatedSize.columns;

            if ( row % 2 !== 0 ) {
                column = this._calculatedSize.columns - column - 1;
            }

            if ( this.options.invertGravity === false ) {
                row = this._calculatedSize.rows - row - 1;
            }

            return {
                left: column * this._calculatedSize.boxPaddedSize.width + this.options.box.padding.horizontal,
                top: row * this._calculatedSize.boxPaddedSize.height + this.options.box.padding.vertical
            };
        },

        _drawBox2D: function( position, dataObj, flags ) {
            var context = this._context,
                offsets,
                offsetX,
                offsetY;


            if ( $.isArray( this._filteredIndexes ) && this._filteredIndexes.indexOf( position ) > -1 ) {
                context.globalAlpha = this.options.style.box.filteredAlpha;
            } else {
                context.globalAlpha = 1;
            }

            offsets = this._getOffsetForPosition( position );

            offsetX = offsets.left;
            offsetY = offsets.top;

            if ( flags !== undefined && $.isArray( flags ) ) {

                if ( flags.indexOf( 'UNHOVER' ) > -1 ||
                     flags.indexOf( 'UNSELECT' ) > -1 ||
                     flags.indexOf( 'CLEAR' ) > -1) {
                    context.beginPath();
                    context.clearRect(
                        offsetX - 1,
                        offsetY - 1,
                        this._calculatedSize.boxWidth + 2,
                        this._calculatedSize.boxHeight + 2
                    );
                } else {

                    if ( flags.indexOf( 'HOVER' ) > -1 ) {
                        context.beginPath();
                        context.rect(
                            offsetX - 1,
                            offsetY - 1,
                            this._calculatedSize.boxWidth + 2,
                            this._calculatedSize.boxHeight + 2
                        );
                        context.fillStyle = this.options.style.box.hoverBorderColor;
                        context.fill();
                    }
                    if ( flags.indexOf( 'SELECT' ) > -1 ) {
                        context.beginPath();
                        context.rect(
                            offsetX - 1,
                            offsetY - 1,
                            this._calculatedSize.boxWidth + 2,
                            this._calculatedSize.boxHeight + 2
                        );
                        context.fillStyle = this.options.style.box.selectBorderColor;
                        context.fill();
                    }
                }
            }

            context.beginPath();
            context.rect(
                offsetX,
                offsetY,
                this._calculatedSize.boxWidth,
                this._calculatedSize.boxHeight
            );
            context.fillStyle = this._color( dataObj );
            context.fill();

        },

        _refreshOptionsPanel: function() {
            var that = this,
                operatorA,
                setColoringOperator = function() {
                    operatorA = $.grep( that.options.coloringOptions, function( o ) {
                        return o.label === that.options.colorBy;
                    } );


                    if ( $.isArray( operatorA ) && operatorA.length > 0) {
                        if ( $.isFunction( operatorA[ 0 ].operator )) {
                            that._coloringOperator = operatorA[ 0 ].operator;
                        } else {
                            that._coloringOperator = undefined;
                        }
                    }
                };

            if ( this.options.hasOptionsPanel ) {
                if ( this._uiElements.optionsPanelElements.$optionsPanel === null ) {
                    this._uiElements.optionsPanelElements.$optionsPanel = $( '<footer/>', {
                        'class': 'options-panel'
                    });
                    this._uiElements.$canvas.after( this._uiElements.optionsPanelElements.$optionsPanel );

                    this._uiElements.optionsPanelElements.$orderingSelector = $( '<select/>', {
                        change: function() {
                            that.options.orderBy = $( this ).val();
                            that.refresh();
                        }
                    } );
                    this._uiElements.optionsPanelElements.$coloringSelector = $( '<select/>', {
                        change: function() {

                            that.options.colorBy = $( this ).val();

                            if ( $.isArray( that.options.coloringOptions ) && that.options.colorBy !== undefined ) {

                                setColoringOperator();

                            }

                            that.refresh();
                        }
                    } );

                    setColoringOperator();

                    this._uiElements.optionsPanelElements.$actionsMenu =
                        $( '<div>Actions</div>').actionsMenu();


                    this._uiElements.optionsPanelElements.$optionsPanel.append(
                        $( '<label>Ordering:</label>' )
                    ).append(
                        this._uiElements.optionsPanelElements.$orderingSelector
                    ).append(
                        $( '<label>Coloring:</label>' )
                    ).append(
                        this._uiElements.optionsPanelElements.$coloringSelector
                    ).append(
                        this._uiElements.optionsPanelElements.$actionsMenu
                    );

                } else {
                    this._uiElements.optionsPanelElements.$orderingSelector.empty();
                    this._uiElements.optionsPanelElements.$coloringSelector.empty();
                }

                $.each( this.options.orderingOptions, function( i, k ) {
                    that._uiElements.optionsPanelElements.$orderingSelector.append(
                        $( '<option value="' + k.label + '">' + k.label + '</option>' )
                    );
                } );

                that._uiElements.optionsPanelElements.$orderingSelector.val( this.options.orderBy );

                $.each( this.options.coloringOptions, function( i, k ) {
                    that._uiElements.optionsPanelElements.$coloringSelector.append(
                        $( '<option value="' + k.label + '">' + k.label + '</option>' )
                    );
                } );

                that._uiElements.optionsPanelElements.$coloringSelector.val( this.options.colorBy );

                if ( $.isArray( this.options.itemsActions ) && this.options.itemsActions.length ) {
                    this._uiElements.optionsPanelElements.$actionsMenu.actionsMenu( 'option', 'actions', this.options.itemsActions );
                    this._uiElements.optionsPanelElements.$actionsMenu.actionsMenu( 'option', 'itemProvider', function() {
                        return that.getNonFilteredItems.call( that );
                    } );
                    this._uiElements.optionsPanelElements.$actionsMenu.show();
                } else {
                    this._uiElements.optionsPanelElements.$actionsMenu.hide();
                }

                if ( this.options.optionsPanelAutoExpanded === true ) {
                    if ( !this._optionsPanelExpanded ) {
                        this._uiElements.optionsPanelElements.$optionsPanel.show();
                        this._optionsPanelExpanded = true;
                    }
                } else {

                    // TODO: complete collapsed mode
                    if ( this._uiElements.optionsPanelElements.$optionsButton === null ) {
                        this._uiElements.optionsPanelElements.$optionsButton =  $( '<div/>', {
                            'class': 'options-button',
                            text: 'Options'
                        });
                        this._uiElements.$canvas.after( this._uiElements.optionsPanelElements.$optionsButton );
                    }
                    this._uiElements.optionsPanelElements.$optionsPanel.hide();
                    this._optionsPanelExpanded = false;
                }
            } else {
                if ( this._uiElements.optionsPanelElements.$optionsPanel ) {
                    this._uiElements.optionsPanelElements.$optionsPanel.remove();
                    this._uiElements.optionsPanelElements.$optionsPanel = null;
                }
            }
        },

        _refreshHeader: function() {
            var that = this;
            if ( this.options.hasHeader === true ) {
                if ( this._uiElements.headerElements.$header === null ) {
                    this._uiElements.headerElements.$header = $( '<header/>', {
                        'class': 'header-panel'
                    } );
                    this._uiElements.$body.prepend( this._uiElements.headerElements.$header );
                }

                if ( this.options.title !== undefined ) {
                    if ( this._uiElements.headerElements.$title === null ) {
                        this._uiElements.headerElements.$title = $( '<div/>', {
                            'class': 'title'
                        }) ;
                        this._uiElements.headerElements.$header.append( this._uiElements.headerElements.$title );
                    }

                    if ( this.options.title instanceof jQuery ) {
                        this._uiElements.headerElements.$title.append( this.options.title );
                    } else {
                        this._uiElements.headerElements.$title.html( this.options.title );
                        this._uiElements.headerElements.$title.attr( 'title', this.options.title );
                    }

                } else {
                    if ( this._uiElements.headerElements.$title ) {
                        this._uiElements.headerElements.$title.remove();
                        this._uiElements.headerElements.$title = null;
                    }
                }

                if ( this.options.subtitle !== undefined ) {
                    if ( this._uiElements.headerElements.$subtitle === null ) {
                        this._uiElements.headerElements.$subtitle = $( '<div/>', {
                            'class': 'subtitle'
                        }) ;
                        this._uiElements.headerElements.$header.append( this._uiElements.headerElements.$subtitle );
                    }

                    if ( this.options.subtitle instanceof jQuery ) {
                        this._uiElements.headerElements.$subtitle.append( this.options.subtitle );
                    } else {
                        this._uiElements.headerElements.$subtitle.html( this.options.subtitle );
                    }

                } else {
                    if ( this._uiElements.headerElements.$subtitle ) {
                        this._uiElements.headerElements.$subtitle.remove();
                        this._uiElements.headerElements.$subtitle = null;
                    }
                }

                if ( this._uiElements.headerElements.$counts === null ) {
                    this._uiElements.headerElements.$counts = $( '<div/>', {
                        'class': 'counts'
                    });
                    this._uiElements.headerElements.$header.append( this._uiElements.headerElements.$counts );
                }
                this._refreshCounts();

                if ( $.isArray( this.options.filteringOptions ) && this.options.filteringOptions.length ) {
                    this._uiElements.headerElements.$filteringOptions = $( '<ul/>', {
                        'class': 'filtering-options'
                    });
                    this._uiElements.headerElements.$header.append( this._uiElements.headerElements.$filteringOptions );
                    $.each( this.options.filteringOptions, function() {
                        var o = this,
                            $o = $( '<li/>', {
                            html: this.label,
                            click: function() {
                                o.action.call( that, that );
                            }
                        });

                        o.element = $o;

                        that._uiElements.headerElements.$filteringOptions.append( $o );
                    });
                }

            } else {
                if ( this._uiElements.headerElements.$header ) {
                    this._uiElements.headerElements.$header.empty();
                    this._uiElements.headerElements.$header.remove();
                    $.each( this._uiElements.headerElements, function( i, e ) {
                        e = null;
                    });
                }
            }
        },

        _refreshCounts: function() {
            var filteredLength;

            if ( this.options.hasHeader === true ) {
                filteredLength = $.isArray( this._filteredIndexes ) && this._filteredIndexes.length || 0;

                if ( filteredLength !== 0 ) {
                    this._uiElements.headerElements.$counts.text(
                        ( this.options.data.length - filteredLength ) + ' / ' + this.options.data.length
                    );
                } else {
                    this._uiElements.headerElements.$counts.text( this.options.data.length );
                }
            }
        },

        _calculateScaledSizes: function() {
            var gcd, n,
                widthFraction, heightFraction,
                a0, wMax, r, H0, W0, pV, pH,
                val, width, tooHigh, rowFriction;

            gcd = $.gcd( this.options.box.width, this.options.box.height);
            widthFraction = this.options.box.width / gcd;
            heightFraction = this.options.box.height / gcd;
            r = widthFraction / heightFraction;
            pV = this.options.box.padding.vertical;
            pH = this.options.box.padding.horizontal;
            W0 = ( this.options.box.width + pH ) * this.options.dimensions.columns;
            H0 = ( this.options.box.height + pV ) * this.options.dimensions.rows;
            n = this.options.data.length;
            a0 = H0 * W0 / n;

            // NASA equation
            wMax = Math.floor(
                ( Math.sqrt( r * r * pV * pV - 2 * r * pV * pH + pH * pH + 4 * r * a0 ) - r * pV - pH ) / 2
            );

            tooHigh = false;
            val = width = this.options.box.width;
            while ( val <= wMax - widthFraction && tooHigh === false ) {
                val += widthFraction;

                if ( W0 % ( val + pH ) === 0 ) {
                    if ( Math.ceil( n / ( W0 / ( val + pH ) ) ) * ( val / r + pV  ) > H0 ) {
                        tooHigh = true;
                    }
                    if ( tooHigh === false ) {
                        width = val;
                    }
                }
            }

            this._calculatedSize.boxWidth = width;
            this._calculatedSize.boxHeight = width / widthFraction * heightFraction;

            this._calculatedSize.columns = W0 / ( width + pH );
            this._calculatedSize.rows = H0 / ( this._calculatedSize.boxHeight + pV );

            if ( this.options.invertGravity === false ) {
                rowFriction = this._calculatedSize.rows % 1;
                if ( rowFriction > 0 ) {
                    this._calculatedSize.rowFrictionHeight = ( 1 - rowFriction ) * ( this._calculatedSize.boxHeight + pV );
                }
            }

        },

        refresh: function() {
            var that = this,
                canvas = this._uiElements.$canvas[0];

            // Applying container styles

            this._calculatedSize.columns = this.options.dimensions.columns;
            this._calculatedSize.rows = this.options.dimensions.rows;
            this._calculatedSize.boxWidth = this.options.box.width;
            this._calculatedSize.boxHeight = this.options.box.height;
            this._calculatedSize.rowFrictionHeight = 0;

            if ( this.options.data.length ) {
                if ( this.options.dimensions.columns * this.options.dimensions.rows < this.options.data.length &&
                    this.options.autoGrowHeight === true) {
                    this._calculatedSize.rows = Math.ceil( this.options.data.length / this.options.dimensions.columns );
                } else if ( this.options.box.scaleToFill === true ) {
                    this._calculateScaledSizes();
                }
            }

            this._calculatedSize.boxPaddedSize.width = this.options.box.padding.horizontal + this._calculatedSize.boxWidth;
            this._calculatedSize.boxPaddedSize.height = this.options.box.padding.vertical + this._calculatedSize.boxHeight;

            this._calculatedSize.boxPaddedSize.nonScaledWidth = this.options.box.padding.horizontal + this.options.box.width;
            this._calculatedSize.boxPaddedSize.nonScaledHeight = this.options.box.padding.vertical + this.options.box.height;

            this._calculatedSize.canvasSizeWithOneLessPadding.width = this.options.dimensions.columns * this._calculatedSize.boxPaddedSize.nonScaledWidth;
            this._calculatedSize.canvasSizeWithOneLessPadding.height = this.options.dimensions.rows * this._calculatedSize.boxPaddedSize.nonScaledHeight;

            this._calculatedSize.totalPadding.horizontal = ( this._calculatedSize.columns + 1 ) *  this.options.box.padding.horizontal;
            this._calculatedSize.totalPadding.vertical = ( Math.ceil( this._calculatedSize.rows ) + 1 ) *  this.options.box.padding.vertical;

            canvas.width = this._calculatedSize.canvasSizeWithOneLessPadding.width +  this.options.box.padding.horizontal;
            canvas.height = this._calculatedSize.canvasSizeWithOneLessPadding.height +  this.options.box.padding.vertical;

            this._order();

            this._boxesToRender = [];

            if ( this.options.data.length > 0 ) {

                this._uiElements.$emptySign.fadeOut();

                $.each( this.options.data, function( k, v) {
                    that._boxesToRender.push( {
                        position: k,
                        data: v
                    } );
                });

            } else {
                this._uiElements.$emptySign.fadeIn();
            }

            this._refreshHeader();
            this._refreshOptionsPanel();

            if ( this.options.sideItem !== null ) {
                this._uiElements.$side.append( this.options.sideItem );
            }
        },

        filterItems: function( indexes ) {
            var aNotInB, bNotInA,
                difference,
                i;

            if ( indexes !== undefined ) {

                this._filteredIndexes = this._filteredIndexes || [];

                difference = $.mutualDisjoin( this._filteredIndexes, indexes );
                aNotInB = difference[ 0 ];
                bNotInA = difference[ 1 ];

                this._filteredIndexes = indexes;

                for ( i in aNotInB ) {
                    if ( aNotInB.hasOwnProperty( i ) ) {
                        delete this.options.data[ i ]._filtered;
                        this._boxesToRender.push( {
                            position: Number( i ),
                            data: this.options.data[ i ],
                            flags: [ 'CLEAR' ]
                        } );
                    }
                }

                for ( i in bNotInA ) {
                    if ( bNotInA.hasOwnProperty( i ) ) {
                        this.options.data[ i ]._filtered = true;
                        this._boxesToRender.push( {
                            position: Number( i ),
                            data: this.options.data[ i ],
                            flags: [ 'CLEAR' ]
                        } );
                    }
                }

                this._refreshCounts();
            }

            return this._filteredIndexes;
        },

        getNonFilteredItems: function() {
            var result = [];
            $.each( this.options.data, function() {
               if ( this._filtered !== true ) {
                   result.push( this );
               }
            });
            return result;
        } /*,

        getNonFilteredIndexes: function() {
            var result = [];
            $.each( this.options.data, function( i ) {
                if ( this._filtered !== true ) {
                    result.push( i );
                }
            });
            return result;
        }*/
    } );

})( jQuery );
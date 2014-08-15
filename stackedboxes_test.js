/*global require*/
require.config({
    baseUrl: '.',
    paths : {
        jquery : 'libs/jquery/jquery-2.0.1.min',
        jquery_ui : 'libs/jquery-ui/1.10.3-darkness/js/jquery-ui-1.10.3.custom.min',
        stackedboxes : 'stackedboxes',
        actionsmenu: 'widgets/actionsmenu/actionsmenu',
        filterpanel: 'widgets/filterpanel/filterpanel',
        rangefilter: 'widgets/filterpanel/filters/rangefilter'
    },
    shim: {
        'stackedboxes': [ 'jquery', 'jquery_ui', 'utils', 'actionsmenu' ],
        'rangefilter': [ 'jquery', 'jquery_ui' ],
        'filterpanel': [ 'rangefilter' ],
        'actionsmenu': [ 'jquery', 'jquery_ui' ]
    }
});

/*global console */

require([
    'jquery',
    'stackedboxes',
    'filterpanel'
], function( $ ) {
    "use strict";

    $(function() {


        var maxScore = 10000,
            minScore = 0,
            totalBoxCount = 0,
            allData = {},
            allDataCollected = [],
            charts = {},
            authors = [ 'Jancsi', 'Steve', 'Bela', 'Klara', 'Sara', 'Nikolaj' ],
            colorsForAuthors = [ '#ff6600', '#ff0066', '#0066ff', '#00ff66', '#6600ff', '#66ff00' ],
            $collectionContainer,
            $body = $( 'body' ),
            defaultColoringOptions = [
                    {
                        label: 'score',
                        operator: function ( item ) {

                            var mixColors = function( color1, color2, fade ) {
                                return [
                                    color1[0] + ( color2[0] - color1[0] ) * fade,
                                    color1[1] + ( color2[1] - color1[1] ) * fade,
                                    color1[2] + ( color2[2] - color1[2] ) * fade
                                ].map( Math.round );
                            }, getColor = function( score ) {

                                var color = [ 255, 255, 255 ],
                                    bottom = [ 255, 100, 0 ],
                                    mid = [ 210, 255, 0 ],
                                    top = [ 0, 252, 147],
                                    failColor = [ 255, 0, 0 ];

                                if ( score <= 0.5 ) {

                                    if ( score < 0 ) {
                                        return failColor;
                                    }

                                    color = mixColors( bottom, mid, score * 2 );

                                } else {

                                    color = mixColors( mid, top, (score - 0.5) * 2 );

                                }

                                return color;

                            },
                            colorStr,
                            score,
                            normalizedScore;

                            if ( !isNaN ( Number( item.score ) ) ) {

                                normalizedScore = (Math.max((item.score - minScore), -1)) / (maxScore - minScore);

                                if ( normalizedScore === null || normalizedScore === undefined ) {
                                    colorStr = '#bbb';
                                } else {
                                    score = normalizedScore;
                                    colorStr = 'rgb(' + getColor( score ).join( ',' ) + ')';
                                }
                            }

                            return colorStr;
                        }
                    },

                    {
                        label: 'author',
                        operator: function( item ) {
                            var colorStr;

                            if ( item.author && authors.indexOf( item.author ) > -1 ) {
                                colorStr = colorsForAuthors[ authors.indexOf( item.author )];
                            }
                            return colorStr;
                        }
                    }
            ],
            defaultOrderingOptions = [
                    {
                        label: 'name',
                        operator: function ( a, b ) {
                            if ( a.name < b.name ) {
                                return -1;
                            }

                            if ( a.name > b.name ) {
                                return 1;
                            }

                            return 0;
                        }
                    },

                    {
                        label: 'score',
                        operator: function ( a, b ) {
                            return a.score - b.score;
                        }
                    },

                    {
                        label: 'author',
                        operator: function ( a, b ) {
                            if ( a.author < b.author ) {
                                return -1;
                            }

                            if ( a.author > b.author ) {
                                return 1;
                            }

                            return 0;
                        }
                    }

                ];



        function dummyDataGenerator( count ) {
            var i,
                result = [],
                item = null;

            for ( i = 0; i < count; i++ ) {

                item = {
                    name: 'Boxi voxi ' + i,
                    score: Math.round( Math.random() * maxScore ),
                    author: authors[ Math.floor( authors.length * Math.random() ) ],
                    url: 'http://isis.vanderbilt.edu'
                };

                result.push( item );

            }

            return result;

        }

        function drawCharts() {

            var boxCount = 0,
                $container,
                name,
                data,
                nonFilteredItems;


            $collectionContainer = $( '<div id="collection_container" class="boxes"></div>' );
            $body.append( $collectionContainer );
            $body.append( $( '<hr/>' ) );

            $collectionContainer.stackedBoxes( {
                title: 'Collection of non-filtered designs in team-space',
                subtitle: '5/10/2013',
                boxesToRedrawPerFrame: 1000,
                dimensions: {
                    columns: 330,
                    rows: 90
                },
                box: {
                    width: 2,
                    height: 2,
                    padding: {
                        vertical: 1,
                        horizontal: 1
                    },
                    scaleToFill: true
                },
                data: [],
                hoverPanelContent: function( data ) {
                    return '<em>' + data.name + '</em></br/>' +
                        'Score: ' + data.score;
                },
                clickAction: function( data ) {
                    console.log( 'This should navigate to ulr of design: ' + data.url );
                },
                orderingOptions: defaultOrderingOptions,
                coloringOptions: defaultColoringOptions,
                orderBy: 'score',
                colorBy: 'score',
                hasHeader: true,
                hideFiltered: true,
                itemsActions: [
                    {
                        label: 'Open in Design Space Analyzer',
                        action: function( items ) {
                            console.log( '[' + items.length + '] items should be opened in design analyzer' );
                        },
                        guard: function( items ) {
                            return items.length > 0;
                        }
                    },
                    {
                        label: 'Copy itmes',
                        action: function( items ) {
                            console.log( '[' + items.length + '] items should be copied' );
                        },
                        guard: function( items ) {
                            return items.length > 0;
                        }
                    },
                    {
                        label: 'Delete itmes',
                        action: function( items ) {
                            console.log( '[' + items.length + '] items should be deleted' );
                        },
                        guard: function( items ) {
                            return items.length > 0;
                        }
                    }
                ],
                sideItem: $( '<div/>' ).filterPanel( {
                    label: 'Global Filters',
                    items: [ {
                        type: 'range',
                        label: 'Score',
                        min: minScore,
                        max: maxScore,
                        values: [ minScore, maxScore ],
                        onChange: function( event, ui ) {
                            var start, end, delta;

                            $( "#score-amount" ).text( ui.values[ 0 ] + " - " + ui.values[ 1 ] );

                            start = new Date().getTime();

                            nonFilteredItems = [];
                            $.each( charts, function( i, chart ) {

                                var data = chart.stackedBoxes( 'option', 'data' ),
                                    filtered = [];

                                for ( i=0; i < data.length; i++) {
                                    if ( data[i].score < ui.values[ 0 ] || data[i].score > ui.values[ 1 ] ) {
                                        filtered.push( i );
                                    } else {
                                        nonFilteredItems.push( data[ i ] );
                                    }

                                }

                                chart.stackedBoxes( 'filterItems', filtered );
                            });


                            end = new Date().getTime();
                            delta = end - start;
                            console.log( 'Filtering time: ' + delta );

                            $collectionContainer.stackedBoxes( 'option', 'data', nonFilteredItems );
                        },
                        onSlide: function( event, ui ) {
                            var start, end, delta;

                            $( "#score-amount" ).text( ui.values[ 0 ] + " - " + ui.values[ 1 ] );

                            start = new Date().getTime();

                            nonFilteredItems = [];
                            $.each( charts, function( i, chart ) {

                                var data = chart.stackedBoxes( 'option', 'data' ),
                                    filtered = [];

                                for ( i=0; i < data.length; i++) {
                                    if ( data[i].score < ui.values[ 0 ] || data[i].score > ui.values[ 1 ] ) {
                                        filtered.push( i );
                                    } else {
                                        nonFilteredItems.push( data[ i ] );
                                    }

                                }

                                chart.stackedBoxes( 'filterItems', filtered );
                            });


                            end = new Date().getTime();
                            delta = end - start;
                            console.log( 'Filtering time: ' + delta );

                        }
                } ]
                } )

            });

            for ( var i = 1; i <= 12; i++ ) {

                name = 'Project' + i;

                $body.append('<div id="Project' + i + '" class="boxes"></div>');

                boxCount = 50 + Math.round( Math.random() * 2000 );
                totalBoxCount += boxCount;

                $container = $( '#' + name );

                data = dummyDataGenerator( boxCount );

                allData[ name ] = data;
                allDataCollected = allDataCollected.concat( data );

                $container.stackedBoxes( {
                    title: name,
                    subtitle: '5/10/2013',
                    data: data,
                    boxesToRedrawPerFrame: 300,
                    hoverPanelContent: function( data ) {
                        return '<em>' + data.name + '</em></br/>' +
                            'Score: ' + data.score;
                    },
                    clickAction: function( data ) {
                        console.log( 'This should navigate to ulr of design: ' + data.url );
                    },
                    orderingOptions: defaultOrderingOptions,
                    coloringOptions: defaultColoringOptions,
                    orderBy: 'score',
                    colorBy: 'score',
                    hasHeader: true,
                    itemsActions: [
                        {
                            label: 'Open in Design Space Analyzer',
                            action: function( items ) {
                                console.log( '[' + items.length + '] items should be opened in design analyzer' );
                            },
                            guard: function( items ) {
                                return items.length > 0;
                            }
                        },
                        {
                            label: 'Copy itmes',
                            action: function( items ) {
                                console.log( '[' + items.length + '] items should be copied' );
                            },
                            guard: function( items ) {
                                return items.length > 0;
                            }
                        },
                        {
                            label: 'Delete itmes',
                            action: function( items ) {
                                console.log( '[' + items.length + '] items should be deleted' );
                            },
                            guard: function( items ) {
                                return items.length > 0;
                            }
                        }
                    ],
                    filteringOptions: [
                        {
                            label: 'Find by name',
                            action: function( stacked ) {
                                console.log( '[' + stacked.getNonFilteredItems().length + ']' );
                            }
                        },
                        {
                            label: 'Reset filter',
                            action: function( stacked ) {
                                console.log( '[' + stacked.getNonFilteredItems().length + '] filter should be reset' );
                                this.filterItems([]);
                            }
                        },
                        {
                            label: 'Filter all',
                            action: function( stacked ) {
                                console.log( '[' + stacked.getNonFilteredItems().length + '] all should be filtered' );
                            }
                        },
                        {
                            label: 'Set ilters',
                            action: function( stacked ) {
                                console.log( '[' + stacked.getNonFilteredItems().length + '] set range filters' );
                            }
                        }
                    ],
                    onSelectionAction: function( ) {
                        var items, nonFilteredItems = [];

                        this.invertSelection();
                        this.filterItems( this._selectedItems );

                        $.each( charts, function( i, chart ) {

                            items = chart.stackedBoxes( 'getNonFilteredItems' );
                            nonFilteredItems = nonFilteredItems.concat( items );

                        });
                        $collectionContainer.stackedBoxes( 'option', 'data', nonFilteredItems );
                    }

                });

                charts[ name ] =  $container;

            }

            $collectionContainer.stackedBoxes( 'option', 'data', allDataCollected );

            console.log( 'Total boxes: ' + allDataCollected.length );

        }


            // Setting up charts

        //bench.run( { async: true });
        drawCharts();

        // Setting up filtering

        (function() {

            var $slider = $( "#score-slider" ),
                start, end, delta,
                nonFilteredItems;

            $slider.slider({
                range: true,
                min: minScore,
                max: maxScore,
                values: [ minScore, maxScore ]
            });

            $( "#score-amount" ).text( minScore + " - " + maxScore );

            $slider.on( 'slidechange', function( event, ui ) {
                $( "#score-amount" ).text( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                $collectionContainer.stackedBoxes( 'option', 'data', nonFilteredItems );

            } );
            $slider.on( 'slide', function( event, ui ) {
                $( "#score-amount" ).text( ui.values[ 0 ] + " - " + ui.values[ 1 ] );

                start = new Date().getTime();

                nonFilteredItems = [];
                $.each( charts, function( i, chart ) {

                    var data = chart.stackedBoxes( 'option', 'data' ),
                        filtered = [];

                    for ( i=0; i < data.length; i++) {
                        if ( data[i].score < ui.values[ 0 ] || data[i].score > ui.values[ 1 ] ) {
                            filtered.push( i );
                        } else {
                            nonFilteredItems.push( data[ i ] );
                        }

                    }

                    chart.stackedBoxes( 'filterItems', filtered );
                });


                end = new Date().getTime();
                delta = end - start;
                console.log( 'Filtering time: ' + delta );

            } );

        })();

    });


});

/*global self*/
define([
    'jquery'
 ], function(
        $
    ) {
    "use strict";

    $.gcd = function(a, b) {
        if ( ! b) {
            return a;
        }

        return $.gcd(b, a % b);
    };

    $.mutualDisjoin = function(a, b) {
        var i, l, aNotInB = {}, bNotInA = {};

        if ( a.length >= b.length ) {
            l = a.length;
        } else {
            l = b.length;
        }

        for ( i=0; i < l; i++ ) {
            if ( a[ i ] !== undefined ) {
                if ( bNotInA[ a[ i ] ] === true ) {
                    delete bNotInA[ a[ i ] ];
                } else {
                    aNotInB[ a[ i ] ] = true;
                }
            }

            if ( b[ i ] !== undefined ) {
                if ( aNotInB[ b[ i ] ] === true ) {
                    delete aNotInB[ b[ i ] ];
                } else {
                    bNotInA[ b[ i ] ] = true;
                }
            }
        }

        return [ aNotInB, bNotInA ];
    };

    $.disjoin =  function(a, b) {
        console.log( 'a' );
        return $.grep(a, function($e) { return $.inArray($e, b) === -1; });
    };

    $.disableSelection = function() {
       return this
         .attr('unselectable', 'on')
         .css('user-select', 'none')
         .on('selectstart', false);
    };

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

    // requestAnimationFrame polyfill by Erik Möller
    // fixes from Paul Irish and Tino Zijdel
    // using 'self' instead of 'window' for compatibility with both NodeJS and IE10.
    ( function () {

        var lastTime = 0;
        var vendors = [ 'ms', 'moz', 'webkit', 'o' ];

        for ( var x = 0; x < vendors.length && !self.requestAnimationFrame; ++ x ) {

            self.requestAnimationFrame = self[ vendors[ x ] + 'RequestAnimationFrame' ];
            self.cancelAnimationFrame = self[ vendors[ x ] + 'CancelAnimationFrame' ] || self[ vendors[ x ] + 'CancelRequestAnimationFrame' ];

        }

        if ( self.requestAnimationFrame === undefined && self.setTimeout !== undefined ) {

            self.requestAnimationFrame = function ( callback ) {

                var currTime = Date.now(), timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
                var id = self.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
                lastTime = currTime + timeToCall;
                return id;

            };

        }

        if( self.cancelAnimationFrame === undefined && self.clearTimeout !== undefined ) {

            self.cancelAnimationFrame = function ( id ) { self.clearTimeout( id ); };

        }

    }() );


    self.getUrlVars = function() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    };


    self.normalizeMouseEvent = function(event) {
      if( event.offsetX === undefined && event.pageX !== undefined && event.pageY !== undefined && event.target !== undefined ) {
        event.offsetX = ( event.pageX - $( event.target ).offset().left );
        event.offsetY = ( event.pageY - $( event.target ).offset().top );
      }
      return event;
    };

    self.getParameterByName = function(name) {

        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        if(results == null)
            return "";
        else
            return decodeURIComponent(results[1].replace(/\+/g, " "));
    };

});


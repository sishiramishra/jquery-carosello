// jQuery Carosello by Luke Morton 2011
// Licensed under MIT
(function ($) {
	"use strict";

	// Global accessible
	$.carosello = {};
	
	// Provide global settings
	$.carosello.globalSettings = {
		// Namespace
		'ns' : 'ca',
		
		// Speed of slide animation
		'speed' : 500,
		
		// Default axis to slide along
		'axis' : 'x',
		
		// Are we looping infinitely?
		'infinite' : true,
		
		// What carosello index should we start on?
		'startIndex' : 0,
		
		// Shortcut to binding caChange
		'onChange' : null,
		
		// Work out animation object
		'animation' : function ($container, $target, settings) {
			var animate = {};
			
			// Animate in relation to axis
			if (settings.axis === 'x') {
				animate.scrollLeft = $container.scrollLeft() + 
					$target.position().left;
			} else if (settings.axis === 'y') {
				animate.scrollTop = $container.scrollTop() +
					$target.position().top;
			}
			
			return animate;
		},
		
		// Cycle settings
		'cycle' : {
		
			// Cycle step increment
			// Hint: -1 turns animation into rtl
			'step' : 1,
			
			// Speed of cycle
			'speed' : 3000,
			
			// Auto start?
			'auto' : false,
			
			// Shortcut to binding caCycleStart
			'onStart' : null,
			
			// Shortcut to binding caCycleStop
			'onStop' : null,
			
			// Shortcut to binding caCycleChange
			'onChange' : null
		}
	};
	
	// The plugin method
	// You call it like any other jQuery method
	//	 $('#ca').carosello();
	// Sometimes with options:
	//	 $('#ca').carosello({'axis':'y'});
	// It also attaches some methods:
	//	 var $ca = $('#ca').carosello();
	//	 $ca.toIndex(2);
	//	 $ca.to('#two');
	//	 $ca.step(5);
	//	 $ca.next();
	//	 $ca.previous();
	//	 $ca.cycle.start();
	//	 $ca.cycle.stop();
	//	 $ca.cycle.toggle();
	// All these methods take an optional callback:
	//	 $ca.next(function (i, $slide) { alert(i); });
	//	 $ca.toIndex(3, function (i, $slide) { alert('woo'); });
	//	 $ca.cycle.toggle(function (action) { alert(action); });
	$.fn.carosello = function (settings) {
		
		// Alias for this
		var ca = this,
		
			// Get index from this
			getIndex = function () {
				return $(this).data(settings.ns + 'Index') || 0;
			},
			
			// Get normalised index (keeps index within contraints)
			nIndex = function (slideCount, index) {
				if (index < 0) { return slideCount - 1; } 
				if (index >= slideCount) { return 0; }
				return index;
			},
			
			// Count visible slides
			// Currently assumes all slides have same width
			countVisible = function ($cont, $slides, axis) {
				var dim = axis === 'x' ? 'width' : 'height';
				return Math.floor($cont[dim]() / $slides[dim]());
			},
			
			// Generate some clones, mwhahaha
			getClones = function ($slides, dir, shortfall) {
				var $clones;
				if (dir === 'ltr') {
					$clones = $slides.slice(0, shortfall).clone();
				} else {
					$clones = $slides.slice(
						$slides.length - shortfall).clone();
				}
				return $clones.addClass(settings.ns + '-clone');
			},
			
			// Insert clones
			insertClones = function ($parent, $clones, dir) {
				if (dir === 'ltr') {
					$clones.appendTo($parent);
				} else {
					$clones.prependTo($parent);
				}
			},
			
			// Get direction from step
			getDir = function (step) {
				if (step > 0) { return 'ltr'; }
				if (step < 0) { return 'rtl'; }
				return null;
			},
			
			// Non-animated scroll to x/y
			scrollToPosition = function ($cont, axis, offset) {
				if (axis === 'x') {
					$cont.scrollLeft(offset);
				} else {
					$cont.scrollTop(offset);
				}
			},
			
			// Not animated scroll to $target
			scrollToTarget = function ($cont, axis, $target) {
				scrollToPosition($cont, axis,
					$target.position()[axis === 'x' ? 'left' : 'top']);
			},
			
			// Slide to index in a particular carosello element
			toIndex = function (index, callback) {
				// !! c is not ca from parent scope
				var c = this,
					$ca = $(c),
				
					// Container element
					$cont = $ca.children(),
				
					// Slides
					$slides = $cont.children(),
					slideCount = $slides.length,
					visibleCount,
					
					// Max index
					maxIndex = slideCount - 1,
				
					// Current index
					currIndex = getIndex.call(ca),
				
					// Slide we are moving to
					$target,
					
					// Which direction are we moving?
					dir = getDir(index - currIndex),
					
					// Clone elements
					$clones = [];
				
				if (settings.infinite) {
					visibleCount = countVisible($ca, $slides, settings.axis);
					
					// If infinite and work out shortfall
					if ((dir === 'ltr' && index > maxIndex)
							|| (dir === 'rtl' && index < 0)) {
						// Insert trick as we are on last slide 
						$clones = getClones($slides, dir, visibleCount);
						insertClones($cont, $clones, dir);
						$target = $clones.first();
					
						if (dir === 'rtl') {
							scrollToTarget($ca, settings.axis,
								$slides.eq(currIndex));
						}
					}
				}
				
				if ( ! $target) {
					// Work out normalised target
					index = nIndex(slideCount, index);
					$target = $slides.eq(index);
				}
					
				// Slide change complete event
				$ca.trigger(settings.ns + 'Before', [index, $target]);
				
				// Animate to scroll position
				$ca.animate(settings.animation($ca, $target, settings),
					settings.speed, function () {
					//return;
					if ($clones.length) {
						// Remove trickery now
						$clones.remove();
						
						if (dir === 'ltr') {
							index = 0;
							$target = $slides.eq(index);
							scrollToPosition($ca, settings.axis, 0);
						} else if (dir === 'rtl') {
							index = slideCount - visibleCount;
							$target = $slides.eq(index);
							scrollToTarget($ca, settings.axis, $target);
						}
					}
					
					// Record current index
					$ca.data(settings.ns + 'Index', index);
					
					// Slide change complete event
					$ca.trigger(settings.ns + 'After', [index, $target]);
					
					if (callback) {
						callback.call(ca, index, $target);
					}
				});
			};
			
		
		// Slide to index
		ca.toIndex = function (index, callback) {
			// This will no always be carosello
			// sometimes it will be one carosello of many
			this.each(function () {
				toIndex.call(this, index, callback);
			});
			return ca;
		};
		
		// Slide directly to element
		ca.to = function (obj, callback) {
			var $target;

			if (obj instanceof jQuery) {
				$target = obj;
			} else {
				$target = $(obj);
			}
			
			// Slide only those containing target to target's index
			ca.has($target).each(function () {
				var $ca = $(this);
				
				var index = $ca
					.children().children().filter($target)
					.index();
				
				toIndex.call(this, index, callback);
			});
			
			return ca;
		};
		
		// Change target
		ca.step = function (step, callback) {
			return ca
				.each(function () {
					toIndex.call(this, getIndex.call(this) + step,
						callback);
				});
		};
		
		// Go forward
		ca.next = function (callback) {
			return ca.step(+1, callback);
		};
		
		// Go back
		ca.previous = function (callback) {
			return ca.step(-1, callback);
		};
		
		ca.cycle = {
			// Global cycle instance
			instance : null,
		
			// Add cycle functionality
			start : function (speed, callback) {
				// No multi cycling
				if (ca.cycle.instance !== null) {
					return ca;
				}
				
				// Allow custom speed or use default
				speed = speed || settings.cycle.speed;
				
				function cycle() {
					ca.cycle.instance = setTimeout(cycle, speed);
					ca.step(settings.cycle.step);
				}
				
				ca.cycle.instance = setTimeout(cycle, speed);
				ca.trigger(settings.ns + 'CycleStart');
				if (callback) {
					callback.call(ca, 'start');
				}
				return ca;
			},
			
			// Allow the stopping of cycle
			stop : function (callback) {
				if (ca.cycle.instance !== null) {
					clearTimeout(ca.cycle.instance);
					ca.cycle.instance = null;
					ca.trigger(settings.ns + 'CycleStop');
					if (callback) {
						callback.call(ca, 'stop');
					}
				}
				return ca;
			},
			
			// Toggle does the right thing for you
			toggle : function (callback) {
				if (ca.cycle.instance) {
					return ca.cycle.stop(callback);
				}
				return ca.cycle.start(null, callback);
			}
		};
		
		// Publically accessible local settings
		settings = ca.settings = $.extend(true, {},
			$.carosello.globalSettings, settings);
			
		// Add shortcut events if requested
		$.each(['Before', 'After'], function (i, val) {
			var c = settings['on' + val];
			if (c) { ca.bind(settings.ns + val, c); }
		});
		$.each(['Start', 'Stop'], function (i, val) {
			var c = settings.cycle['on' + val];
			if (c) { ca.bind(settings.ns + 'Cycle' + val, c); }
		});
		
		// Auto start cycle?
		if (settings.cycle.auto) { ca.cycle.start(); }
		
		// Init
		return ca.each(function () {
			// Set axis class
			$(this).addClass(settings.ns + '-axis-' + settings.axis);
			
			// Always start on an index
			toIndex.call(this, settings.startIndex);
		});
	};
}(jQuery));
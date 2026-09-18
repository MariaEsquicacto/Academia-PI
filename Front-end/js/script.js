"use strict";

// Global variables
var
	userAgent = navigator.userAgent.toLowerCase(),
	initialDate = new Date(),

	$document = $(document),
	$window = $(window),
	$html = $("html"),

	isDesktop = $html.hasClass("desktop"),
	isIE = userAgent.indexOf("msie") != -1 ? parseInt(userAgent.split("msie")[1]) : userAgent.indexOf("trident") != -1 ? 11 : userAgent.indexOf("edge") != -1 ? 12 : false,
	isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
	isNoviBuilder,
	windowReady = false,

	plugins = {
		responsiveTabs: $(".responsive-tabs"),
		rdInputLabel: $(".form-label"),
		rdNavbar: $(".rd-navbar"),
		regula: $("[data-constraints]"),
		owl: $(".owl-carousel"),
		swiper: $(".swiper-slider"),
		flickrfeed: $(".flickr"),
		twitterfeed: $(".twitter"),
		progressLinear: $(".progress-linear"),
		preloader: $(".page-loader"),
		rdMailForm: $(".rd-mailform"),
		materialParallax: $(".parallax-container"),
		copyrightYear: $("#copyright-year"),
		maps: $(".google-map-container"),
		lightGallery: $("[data-lightgallery='group']"),
		lightGalleryItem: $("[data-lightgallery='item']"),
		lightDynamicGalleryItem: $("[data-lightgallery='dynamic']")
	};

/**
 * @desc Check the element was been scrolled into the view
 * @param {object} elem - jQuery object
 * @return {boolean}
 */
function isScrolledIntoView(elem) {
	if (isNoviBuilder) return true;
	return elem.offset().top + elem.outerHeight() >= $window.scrollTop() && elem.offset().top <= $window.scrollTop() + $window.height();
}

/**
 * @desc Calls a function when element has been scrolled into the view
 * @param {object} element - jQuery object
 * @param {function} func - init function
 */
function lazyInit(element, func) {
	var scrollHandler = function () {
		if ((!element.hasClass('lazy-loaded') && (isScrolledIntoView(element)))) {
			func.call();
			element.addClass('lazy-loaded');
		}
	};

	scrollHandler();
	$window.on('scroll', scrollHandler);
}

$window.on('load', function () {

	// Page loader & Page transition
	if (plugins.preloader.length && !isNoviBuilder) {
		pageTransition({
			target: document.querySelector('.page'),
			delay: 0,
			duration: 500,
			classIn: 'fadeIn',
			classOut: 'fadeOut',
			classActive: 'animated',
			conditions: function (event, link) {
				return link && !/(\#|javascript:void\(0\)|callto:|tel:|mailto:|:\/\/)/.test(link) && !event.currentTarget.hasAttribute('data-lightgallery');
			},
			onTransitionStart: function (options) {
				setTimeout(function () {
					plugins.preloader.removeClass('loaded');
				}, options.duration * .75);
			},
			onReady: function () {
				plugins.preloader.addClass('loaded');
				windowReady = true;
			}
		});
	}

	// Progress Bar
	if (plugins.progressLinear) {
		for (var i = 0; i < plugins.progressLinear.length; i++) {
			var
				container = plugins.progressLinear[i],
				counter = aCounter({
					node: container.querySelector('.progress-linear-counter'),
					duration: container.getAttribute('data-duration') || 1000,
					onStart: function () {
						this.custom.bar.style.width = this.params.to + '%';
					}
				});

			counter.custom = {
				container: container,
				bar: container.querySelector('.progress-linear-bar'),
				onScroll: (function () {
					if (Util.inViewport(this.custom.container) && !this.custom.container.classList.contains('animated')) {
						this.run();
						this.custom.container.classList.add('animated');
					}
				}).bind(counter),
				onBlur: (function () {
					this.params.to = parseInt(this.params.node.textContent, 10);
					this.run();
				}).bind(counter)
			};

			counter.custom.onScroll();
			window.addEventListener('scroll', counter.custom.onScroll);
			counter.params.node.addEventListener('blur', counter.custom.onBlur);
		}
	}

});

/**
 * Initialize All Scripts
 */
$document.ready(function () {
	isNoviBuilder = window.xMode;

	/**
	 * isScrolledIntoView
	 * @description  check the element whas been scrolled into the view
	 */
	function isScrolledIntoView(elem) {
		var $window = $(window);
		return elem.offset().top + elem.outerHeight() >= $window.scrollTop() && elem.offset().top <= $window.scrollTop() + $window.height();
	}

	/**
	 * Google map function for getting latitude and longitude
	 */
	function getLatLngObject(str, marker, map, callback) {
		var coordinates = {};
		try {
			coordinates = JSON.parse(str);
			callback(new google.maps.LatLng(
				coordinates.lat,
				coordinates.lng
			), marker, map)
		} catch (e) {
			map.geocoder.geocode({ 'address': str }, function (results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					var latitude = results[0].geometry.location.lat();
					var longitude = results[0].geometry.location.lng();

					callback(new google.maps.LatLng(
						parseFloat(latitude),
						parseFloat(longitude)
					), marker, map)
				}
			})
		}
	}


	/**
	 * @desc Initialize Google maps
	 */
	function initMaps() {
		var key;

		for (var i = 0; i < plugins.maps.length; i++) {
			if (plugins.maps[i].hasAttribute("data-key")) {
				key = plugins.maps[i].getAttribute("data-key");
				break;
			}
		}

		$.getScript('//maps.google.com/maps/api/js?' + (key ? 'key=' + key + '&' : '') + 'sensor=false&libraries=geometry,places&v=quarterly', function () {
			var head = document.getElementsByTagName('head')[0],
				insertBefore = head.insertBefore;

			head.insertBefore = function (newElement, referenceElement) {
				if (newElement.href && newElement.href.indexOf('//fonts.googleapis.com/css?family=Roboto') !== -1 || newElement.innerHTML.indexOf('gm-style') !== -1) {
					return;
				}
				insertBefore.call(head, newElement, referenceElement);
			};
			var geocoder = new google.maps.Geocoder;
			for (var i = 0; i < plugins.maps.length; i++) {
				var zoom = parseInt(plugins.maps[i].getAttribute("data-zoom"), 10) || 11;
				var styles = plugins.maps[i].hasAttribute('data-styles') ? JSON.parse(plugins.maps[i].getAttribute("data-styles")) : [];
				var center = plugins.maps[i].getAttribute("data-center") || "New York";

				// Initialize map
				var map = new google.maps.Map(plugins.maps[i].querySelectorAll(".google-map")[0], {
					zoom: zoom,
					styles: styles,
					scrollwheel: false,
					center: { lat: 0, lng: 0 }
				});

				// Add map object to map node
				plugins.maps[i].map = map;
				plugins.maps[i].geocoder = geocoder;
				plugins.maps[i].keySupported = true;
				plugins.maps[i].google = google;

				// Get Center coordinates from attribute
				getLatLngObject(center, null, plugins.maps[i], function (location, markerElement, mapElement) {
					mapElement.map.setCenter(location);
				});

				// Add markers from google-map-markers array
				var markerItems = plugins.maps[i].querySelectorAll(".google-map-markers li");

				if (markerItems.length) {
					var markers = [];
					for (var j = 0; j < markerItems.length; j++) {
						var markerElement = markerItems[j];
						getLatLngObject(markerElement.getAttribute("data-location"), markerElement, plugins.maps[i], function (location, markerElement, mapElement) {
							var icon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon");
							var activeIcon = markerElement.getAttribute("data-icon-active") || mapElement.getAttribute("data-icon-active");
							var info = markerElement.getAttribute("data-description") || "";
							var infoWindow = new google.maps.InfoWindow({
								content: info
							});
							markerElement.infoWindow = infoWindow;
							var markerData = {
								position: location,
								map: mapElement.map
							}
							if (icon) {
								markerData.icon = icon;
							}
							var marker = new google.maps.Marker(markerData);
							markerElement.gmarker = marker;
							markers.push({ markerElement: markerElement, infoWindow: infoWindow });
							marker.isActive = false;
							// Handle infoWindow close click
							google.maps.event.addListener(infoWindow, 'closeclick', (function (markerElement, mapElement) {
								var markerIcon = null;
								markerElement.gmarker.isActive = false;
								markerIcon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon");
								markerElement.gmarker.setIcon(markerIcon);
							}).bind(this, markerElement, mapElement));


							// Set marker active on Click and open infoWindow
							google.maps.event.addListener(marker, 'click', (function (markerElement, mapElement) {
								if (markerElement.infoWindow.getContent().length === 0) return;
								var gMarker, currentMarker = markerElement.gmarker, currentInfoWindow;
								for (var k = 0; k < markers.length; k++) {
									var markerIcon;
									if (markers[k].markerElement === markerElement) {
										currentInfoWindow = markers[k].infoWindow;
									}
									gMarker = markers[k].markerElement.gmarker;
									if (gMarker.isActive && markers[k].markerElement !== markerElement) {
										gMarker.isActive = false;
										markerIcon = markers[k].markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon")
										gMarker.setIcon(markerIcon);
										markers[k].infoWindow.close();
									}
								}

								currentMarker.isActive = !currentMarker.isActive;
								if (currentMarker.isActive) {
									if (markerIcon = markerElement.getAttribute("data-icon-active") || mapElement.getAttribute("data-icon-active")) {
										currentMarker.setIcon(markerIcon);
									}

									currentInfoWindow.open(map, marker);
								} else {
									if (markerIcon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon")) {
										currentMarker.setIcon(markerIcon);
									}
									currentInfoWindow.close();
								}
							}).bind(this, markerElement, mapElement))
						})
					}
				}
			}
		});
	}

	/**
	 * toggleSwiperInnerVideos
	 * @description  toggle swiper videos on active slides
	 // */
	function toggleSwiperInnerVideos(swiper) {
		var videos;

		$.grep(swiper.slides, function (element, index) {
			var $slide = $(element),
				video;

			if (index === swiper.activeIndex) {
				videos = $slide.find("video");
				if (videos.length) {
					videos.get(0).play();
				}
			} else {
				$slide.find("video").each(function () {
					this.pause();
				});
			}
		});
	}

	/**
	 * toggleSwiperCaptionAnimation
	 * @description  toggle swiper animations on active slides
	 */
	function toggleSwiperCaptionAnimation(swiper) {
		if (isIE && isIE < 10) {
			return;
		}

		var prevSlide = $(swiper.container),
			nextSlide = $(swiper.slides[swiper.activeIndex]);

		prevSlide
			.find("[data-caption-animate]")
			.each(function () {
				var $this = $(this);
				$this
					.removeClass("animated")
					.removeClass($this.attr("data-caption-animate"))
					.addClass("not-animated");
			});

		nextSlide
			.find("[data-caption-animate]")
			.each(function () {
				var $this = $(this),
					delay = $this.attr("data-caption-delay");

				setTimeout(function () {
					$this
						.removeClass("not-animated")
						.addClass($this.attr("data-caption-animate"))
						.addClass("animated");
				}, delay ? parseInt(delay) : 0);
			});
	}

	/**
	 * makeParallax
	 * @description  create swiper parallax scrolling effect
	 */
	function makeParallax(el, speed, wrapper, prevScroll) {
		var scrollY = window.scrollY || window.pageYOffset;

		if (prevScroll != scrollY) {
			prevScroll = scrollY;
			el.addClass('no-transition');
			el[0].style['transform'] = 'translate3d(0,' + -scrollY * (1 - speed) + 'px,0)';
			el.height();
			el.removeClass('no-transition');

			if (el.attr('data-fade') === 'true') {
				var bound = el[0].getBoundingClientRect(),
					offsetTop = bound.top * 2 + scrollY,
					sceneHeight = wrapper.outerHeight(),
					sceneDevider = wrapper.offset().top + sceneHeight / 2.0,
					layerDevider = offsetTop + el.outerHeight() / 2.0,
					pos = sceneHeight / 6.0,
					opacity;
				if (sceneDevider + pos > layerDevider && sceneDevider - pos < layerDevider) {
					el[0].style["opacity"] = 1;
				} else {
					if (sceneDevider - pos < layerDevider) {
						opacity = 1 + ((sceneDevider + pos - layerDevider) / sceneHeight / 3.0 * 5);
					} else {
						opacity = 1 - ((sceneDevider - pos - layerDevider) / sceneHeight / 3.0 * 5);
					}
					el[0].style["opacity"] = opacity < 0 ? 0 : opacity > 1 ? 1 : opacity.toFixed(2);
				}
			}
		}

		requestAnimationFrame(function () {
			makeParallax(el, speed, wrapper, prevScroll);
		});
	}


	/**
	 * attachFormValidator
	 * @description  attach form validation to elements
	 */
	function attachFormValidator(elements) {
		for (var i = 0; i < elements.length; i++) {
			var o = $(elements[i]), v;
			o.addClass("form-control-has-validation").after("<span class='form-validation'></span>");
			v = o.parent().find(".form-validation");
			if (v.is(":last-child")) {
				o.addClass("form-control-last-child");
			}
		}

		elements
			.on('input change propertychange blur', function (e) {
				var $this = $(this), results;

				if (e.type !== "blur") {
					if (!$this.parent().hasClass("has-error")) {
						return;
					}
				}

				if ($this.parents('.rd-mailform').hasClass('success')) {
					return;
				}

				if ((results = $this.regula('validate')).length) {
					for (i = 0; i < results.length; i++) {
						$this.siblings(".form-validation").text(results[i].message).parent().addClass("has-error")
					}
				} else {
					$this.siblings(".form-validation").text("").parent().removeClass("has-error")
				}
			})
			.regula('bind');

		var regularConstraintsMessages = [
			{
				type: regula.Constraint.Required,
				newMessage: "The text field is required."
			},
			{
				type: regula.Constraint.Email,
				newMessage: "The email is not a valid email."
			},
			{
				type: regula.Constraint.Numeric,
				newMessage: "Only numbers are required"
			},
			{
				type: regula.Constraint.Selected,
				newMessage: "Please choose an option."
			}
		];

		for (var i = 0; i < regularConstraintsMessages.length; i++) {
			var regularConstraint = regularConstraintsMessages[i];

			regula.override({
				constraintType: regularConstraint.type,
				defaultMessage: regularConstraint.newMessage
			});
		}
	}

	/**
	 * isValidated
	 * @description  check if all elemnts pass validation
	 */
	function isValidated(elements, captcha) {
		var results, errors = 0;

		if (elements.length) {
			for (j = 0; j < elements.length; j++) {

				var $input = $(elements[j]);
				if ((results = $input.regula('validate')).length) {
					for (k = 0; k < results.length; k++) {
						errors++;
						$input.siblings(".form-validation").text(results[k].message).parent().addClass("has-error");
					}
				} else {
					$input.siblings(".form-validation").text("").parent().removeClass("has-error")
				}
			}

			if (captcha) {
				if (captcha.length) {
					return validateReCaptcha(captcha) && errors == 0
				}
			}

			return errors == 0;
		}
		return true;
	}

	/**
	 * validateReCaptcha
	 * @description  validate google reCaptcha
	 */
	function validateReCaptcha(captcha) {
		var captchaToken = captcha.find('.g-recaptcha-response').val();

		if (captchaToken.length === 0) {
			captcha
				.siblings('.form-validation')
				.html('Please, prove that you are not robot.')
				.addClass('active');
			captcha
				.closest('.form-group')
				.addClass('has-error');

			captcha.on('propertychange', function () {
				var $this = $(this),
					captchaToken = $this.find('.g-recaptcha-response').val();

				if (captchaToken.length > 0) {
					$this
						.closest('.form-group')
						.removeClass('has-error');
					$this
						.siblings('.form-validation')
						.removeClass('active')
						.html('');
					$this.off('propertychange');
				}
			});

			return false;
		}

		return true;
	}

	/**
	 * onloadCaptchaCallback
	 * @description  init google reCaptcha
	 */
	window.onloadCaptchaCallback = function () {
		for (i = 0; i < plugins.captcha.length; i++) {
			var $capthcaItem = $(plugins.captcha[i]);

			grecaptcha.render(
				$capthcaItem.attr('id'),
				{
					sitekey: $capthcaItem.attr('data-sitekey'),
					size: $capthcaItem.attr('data-size') ? $capthcaItem.attr('data-size') : 'normal',
					theme: $capthcaItem.attr('data-theme') ? $capthcaItem.attr('data-theme') : 'light',
					callback: function (e) {
						$('.recaptcha').trigger('propertychange');
					}
				}
			);
			$capthcaItem.after("<span class='form-validation'></span>");
		}
	};

	// IE Classes
	if (isIE) {
		if (isIE < 10) $html.addClass("lt-ie-10");
		if (isIE < 11) $html.addClass("ie-10");
		if (isIE === 11) $("html").addClass("ie-11");
		if (isIE >= 12) $("html").addClass("ie-edge");
	}

	// Swiper
	if (plugins.swiper.length) {
		plugins.swiper.each(function () {
			var slider = $(this),
				pag = slider.find(".swiper-pagination"),
				next = slider.find(".swiper-button-next"),
				prev = slider.find(".swiper-button-prev"),
				bar = slider.find(".swiper-scrollbar"),
				parallax = slider.parents('.rd-parallax').length;

			slider.find(".swiper-slide")
				.each(function () {
					var $this = $(this), url;
					if (url = $this.attr("data-slide-bg")) {
						$this.css({
							"background-image": "url(" + url + ")",
							"background-size": "cover"
						})
					}

				})
				.end()
				.find("[data-caption-animate]")
				.addClass("not-animated")
				.end()
				.swiper({
					autoplay: !isNoviBuilder && $.isNumeric(slider.attr('data-autoplay')) ? slider.attr('data-autoplay') : false,
					direction: slider.attr('data-direction') || "horizontal",
					effect: slider.attr('data-slide-effect') || "slide",
					speed: slider.attr('data-slide-speed') || 600,
					keyboardControl: !isNoviBuilder ? slider.attr('data-keyboard') === "true" : false,
					mousewheelControl: !isNoviBuilder ? slider.attr('data-mousewheel') === "true" : false,
					mousewheelReleaseOnEdges: slider.attr('data-mousewheel-release') === "true",
					nextButton: next.length ? next.get(0) : null,
					prevButton: prev.length ? prev.get(0) : null,
					pagination: pag.length ? pag.get(0) : null,
					simulateTouch: false,
					paginationClickable: pag.length ? pag.attr("data-clickable") !== "false" : false,
					paginationBulletRender: pag.length ? pag.attr("data-index-bullet") === "true" ? function (index, className) {
						return '<span class="' + className + '">' + (index + 1) + '</span>';
					} : null : null,
					scrollbar: bar.length ? bar.get(0) : null,
					scrollbarDraggable: bar.length ? bar.attr("data-draggable") !== "false" : true,
					scrollbarHide: bar.length ? bar.attr("data-draggable") === "false" : false,
					loop: !isNoviBuilder ? slider.attr('data-loop') !== "false" : false,
					loopAdditionalSlides: 0,
					loopedSlides: 0,
					onTransitionStart: function (swiper) {
						if (!isNoviBuilder) toggleSwiperInnerVideos(swiper);
					},
					onTransitionEnd: function (swiper) {
						if (!isNoviBuilder) toggleSwiperCaptionAnimation(swiper);
						$(window).trigger("resize");
					},

					onInit: function (swiper) {


						if (!isNoviBuilder) toggleSwiperInnerVideos(swiper);
						if (!isNoviBuilder) toggleSwiperCaptionAnimation(swiper);

						// Create parallax effect on swiper caption
						slider.find(".swiper-parallax")
							.each(function () {
								var $this = $(this), speed;

								if (parallax && !isIE && !isMobile) {
									if (speed = $this.attr("data-speed")) {
										makeParallax($this, speed, slider, false);
									}
								}
							});
						$(window).on('resize', function () {
							swiper.update(true);
						})
					}
				});

			$(window)
				.load(function () {
					slider.find("video").each(function () {
						if (!$(this).parents(".swiper-slide-active").length) {
							this.pause();
						}
					});
				})
				.trigger("resize");
		});
	}

	// Copyright Year
	if (plugins.copyrightYear.length) {
		plugins.copyrightYear.text(initialDate.getFullYear());
	}


	// RD Flickr Feed
	if (plugins.flickrfeed.length > 0) {
		var i;
		for (i = 0; i < plugins.flickrfeed.length; i++) {
			var flickrfeedItem = $(plugins.flickrfeed[i]);
			flickrfeedItem.RDFlickr({
				callback: function () {
					var items = flickrfeedItem.find("[data-photo-swipe-item]");

					if (items.length) {
						for (var j = 0; j < items.length; j++) {
							var image = new Image();
							image.setAttribute('data-index', j);
							image.onload = function () {
								items[this.getAttribute('data-index')].setAttribute('data-size', this.naturalWidth + 'x' + this.naturalHeight);
							};
							image.src = items[j].getAttribute('href');
						}
					}
				}
			});
		}
	}

	// RD Twitter Feed
	if (plugins.twitterfeed.length > 0) {
		var i;
		for (i = 0; i < plugins.twitterfeed.length; i++) {
			var twitterfeedItem = plugins.twitterfeed[i];
			$(twitterfeedItem).RDTwitter({
				hideReplies: false,
				localTemplate: {
					avatar: "images/features/rd-twitter-post-avatar-48x48.jpg"
				},
				callback: function () {
					$window.trigger("resize");
				}
			});
		}
	}

	// RD Input Label
	if (plugins.rdInputLabel.length) {
		plugins.rdInputLabel.RDInputLabel();
	}

	// Regula
	if (plugins.regula.length) {
		attachFormValidator(plugins.regula);
	}

	// WOW
	if ($html.hasClass('desktop') && $html.hasClass("wow-animation") && $(".wow").length) {
		new WOW().init();
	}

	// Owl carousel
	if (plugins.owl.length) {
		var k;
		for (k = 0; k < plugins.owl.length; k++) {
			var c = $(plugins.owl[k]),
				responsive = {};

			var
				aliaces = ["-xs-", "-sm-", "-md-", "-lg-", "-xl-", "-xxl-"],
				values = [0, 480, 768, 992, 1200, 1600],
				i, j;

			for (i = 0; i < values.length; i++) {
				responsive[values[i]] = {};
				for (j = i; j >= -1; j--) {
					if (!responsive[values[i]]["items"] && c.attr("data" + aliaces[j] + "items")) {
						responsive[values[i]]["items"] = j < 0 ? 1 : parseInt(c.attr("data" + aliaces[j] + "items"));
					}
					if (!responsive[values[i]]["stagePadding"] && responsive[values[i]]["stagePadding"] !== 0 && c.attr("data" + aliaces[j] + "stage-padding")) {
						responsive[values[i]]["stagePadding"] = j < 0 ? 0 : parseInt(c.attr("data" + aliaces[j] + "stage-padding"));
					}
					if (!responsive[values[i]]["margin"] && responsive[values[i]]["margin"] !== 0 && c.attr("data" + aliaces[j] + "margin")) {
						responsive[values[i]]["margin"] = j < 0 ? 30 : parseInt(c.attr("data" + aliaces[j] + "margin"));
					}
					if (!responsive[values[i]]["dotsEach"] && responsive[values[i]]["dotsEach"] !== 0 && c.attr("data" + aliaces[j] + "dots-each")) {
						responsive[values[i]]["dotsEach"] = j < 0 ? false : parseInt(c.attr("data" + aliaces[j] + "dots-each"));
					}
				}
			}

			// Create custom Pagination
			if (c.attr('data-dots-custom')) {
				c.on("initialized.owl.carousel", function (event) {
					var carousel = $(event.currentTarget),
						customPag = $(carousel.attr("data-dots-custom")),
						active = 0;

					if (carousel.attr('data-active')) {
						active = parseInt(carousel.attr('data-active'));
					}

					carousel.trigger('to.owl.carousel', [active, 300, true]);
					customPag.find("[data-owl-item='" + active + "']").addClass("active");

					customPag.find("[data-owl-item]").on('click', function (e) {
						e.preventDefault();
						carousel.trigger('to.owl.carousel', [parseInt(this.getAttribute("data-owl-item")), 300, true]);
					});

					carousel.on("translate.owl.carousel", function (event) {
						customPag.find(".active").removeClass("active");
						customPag.find("[data-owl-item='" + event.item.index + "']").addClass("active")
					});
				});
			}

			// Create custom Navigation
			if (c.attr('data-nav-custom')) {
				c.on("initialized.owl.carousel", function (event) {
					var carousel = $(event.currentTarget),
						customNav = $(carousel.attr("data-nav-custom"));

					customNav.find("[data-owl-prev]").on('click', function (e) {
						e.preventDefault();
						carousel.trigger('prev.owl.carousel', [300]);
					});

					customNav.find("[data-owl-next]").on('click', function (e) {
						e.preventDefault();
						carousel.trigger('next.owl.carousel', [300]);
					});
				});
			}

			c.owlCarousel({
				autoplay: c.attr("data-autoplay") === "true",
				loop: c.attr("data-loop") === "true",
				items: 1,
				autoplaySpeed: 600,
				autoplayTimeout: 3000,
				dotsContainer: c.attr("data-pagination-class") || false,
				navContainer: c.attr("data-navigation-class") || false,
				mouseDrag: c.attr("data-mouse-drag") === "true",
				nav: c.attr("data-nav") === "true",
				dots: c.attr("data-dots") === "true",
				dotsEach: c.attr("data-dots-each") ? parseInt(c.attr("data-dots-each")) : false,
				responsive: responsive,
				animateOut: c.attr("data-animation-out") || false,
				navText: c.attr("data-nav-text") ? $.parseJSON(c.attr("data-nav-text")) : [],
				navClass: c.attr("data-nav-class") ? $.parseJSON(c.attr("data-nav-class")) : ['owl-prev', 'owl-next']
			});

		}
	}

	// RD Navbar
	if (plugins.rdNavbar.length) {
		var navbar = plugins.rdNavbar,
			aliases = { '0': '-', '480': '-xs-', '768': '-sm-', '992': '-md-', '1200': '-lg-' },
			responsiveNavbar = {};

		for (var alias in aliases) {
			responsiveNavbar[alias] = {};
			if (navbar.attr('data' + aliases[alias] + 'layout')) responsiveNavbar[alias].layout = navbar.attr('data' + aliases[alias] + 'layout');
			else responsiveNavbar[alias].layout = 'rd-navbar-fixed';
			if (navbar.attr('data' + aliases[alias] + 'device-layout')) responsiveNavbar[alias].deviceLayout = navbar.attr('data' + aliases[alias] + 'device-layout');
			else responsiveNavbar[alias].deviceLayout = 'rd-navbar-fixed';
			if (navbar.attr('data' + aliases[alias] + 'hover-on')) responsiveNavbar[alias].focusOnHover = navbar.attr('data' + aliases[alias] + 'hover-on') === 'true';
			if (navbar.attr('data' + aliases[alias] + 'auto-height')) responsiveNavbar[alias].autoHeight = navbar.attr('data' + aliases[alias] + 'auto-height') === 'true';
			if (navbar.attr('data' + aliases[alias] + 'stick-up-offset')) responsiveNavbar[alias].stickUpOffset = navbar.attr('data' + aliases[alias] + 'stick-up-offset');
			if (navbar.attr('data' + aliases[alias] + 'stick-up') && !isNoviBuilder) responsiveNavbar[alias].stickUp = navbar.attr('data' + aliases[alias] + 'stick-up') === 'true';
			else responsiveNavbar[alias].stickUp = false;

			if ($.isEmptyObject(responsiveNavbar[alias])) delete responsiveNavbar[alias];
		}

		navbar.RDNavbar({
			stickUpClone: (!isNoviBuilder && navbar.attr("data-stick-up-clone")) ? navbar.attr("data-stick-up-clone") === 'true' : false,
			stickUpOffset: (navbar.attr("data-stick-up-offset")) ? navbar.attr("data-stick-up-offset") : 1,
			anchorNavOffset: -78,
			anchorNav: !isNoviBuilder,
			anchorNavEasing: 'linear',
			focusOnHover: !isNoviBuilder,
			responsive: responsiveNavbar,
			onDropdownOver: function () {
				return !isNoviBuilder;
			}
		});

		if (navbar.attr("data-body-class")) {
			document.body.className += ' ' + navbar.attr("data-body-class");
		}
	}





	// UI To Top
	if (isDesktop) {
		$().UItoTop({
			easingType: 'easeOutQuart',
			containerClass: 'ui-to-top icon icon-xs icon-circle icon-darker-filled mdi mdi-chevron-up'
		});
	}

	// RD Mailform
	if (plugins.rdMailForm.length) {
		var i, j, k,
			msg = {
				'MF000': 'Successfully sent!',
				'MF001': 'Recipients are not set!',
				'MF002': 'Form will not work locally!',
				'MF003': 'Please, define email field in your form!',
				'MF004': 'Please, define type of your form!',
				'MF254': 'Something went wrong with PHPMailer!',
				'MF255': 'Aw, snap! Something went wrong.'
			};

		for (i = 0; i < plugins.rdMailForm.length; i++) {
			var $form = $(plugins.rdMailForm[i]),
				formHasCaptcha = false;

			$form.attr('novalidate', 'novalidate').ajaxForm({
				data: {
					"form-type": $form.attr("data-form-type") || "contact",
					"counter": i
				},
				beforeSubmit: function (arr, $form, options) {

					var form = $(plugins.rdMailForm[this.extraData.counter]),
						inputs = form.find("[data-constraints]"),
						output = $("#" + form.attr("data-form-output")),
						captcha = form.find('.recaptcha'),
						captchaFlag = true;

					output.removeClass("active error success");

					if (isValidated(inputs, captcha)) {

						// veify reCaptcha
						if (captcha.length) {
							var captchaToken = captcha.find('.g-recaptcha-response').val(),
								captchaMsg = {
									'CPT001': 'Please, setup you "site key" and "secret key" of reCaptcha',
									'CPT002': 'Something wrong with google reCaptcha'
								};

							formHasCaptcha = true;

							$.ajax({
								method: "POST",
								url: "bat/reCaptcha.php",
								data: { 'g-recaptcha-response': captchaToken },
								async: false
							})
								.done(function (responceCode) {
									if (responceCode !== 'CPT000') {
										if (output.hasClass("snackbars")) {
											output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + captchaMsg[responceCode] + '</span></p>')

											setTimeout(function () {
												output.removeClass("active");
											}, 3500);

											captchaFlag = false;
										} else {
											output.html(captchaMsg[responceCode]);
										}

										output.addClass("active");
									}
								});
						}

						if (!captchaFlag) {
							return false;
						}

						form.addClass('form-in-process');

						if (output.hasClass("snackbars")) {
							output.html('<p><span class="icon text-middle fa fa-circle-o-notch fa-spin icon-xxs"></span><span>Sending</span></p>');
							output.addClass("active");
						}
					} else {
						return false;
					}
				},
				error: function (result) {

					var output = $("#" + $(plugins.rdMailForm[this.extraData.counter]).attr("data-form-output")),
						form = $(plugins.rdMailForm[this.extraData.counter]);

					output.text(msg[result]);
					form.removeClass('form-in-process');

					if (formHasCaptcha) {
						grecaptcha.reset();
					}
				},
				success: function (result) {

					var form = $(plugins.rdMailForm[this.extraData.counter]),
						output = $("#" + form.attr("data-form-output")),
						select = form.find('select');

					form
						.addClass('success')
						.removeClass('form-in-process');

					if (formHasCaptcha) {
						grecaptcha.reset();
					}

					result = result.length === 5 ? result : 'MF255';
					output.text(msg[result]);

					if (result === "MF000") {
						if (output.hasClass("snackbars")) {
							output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + msg[result] + '</span></p>');
						} else {
							output.addClass("active success");
						}
					} else {
						if (output.hasClass("snackbars")) {
							output.html(' <p class="snackbars-left"><span class="icon icon-xxs mdi mdi-alert-outline text-middle"></span><span>' + msg[result] + '</span></p>');
						} else {
							output.addClass("active error");
						}
					}

					form.clearForm();

					if (select.length) {
						select.select2("val", "");
					}

					form.find('input, textarea').trigger('blur');

					setTimeout(function () {
						output.removeClass("active error success");
						form.removeClass('success');
					}, 3500);
				}
			});
		}
	}

	// Material Parallax
	if (plugins.materialParallax.length) {
		if (!isNoviBuilder && !isIE && !isMobile) {
			plugins.materialParallax.parallax();
		} else {
			for (var i = 0; i < plugins.materialParallax.length; i++) {
				var $parallax = $(plugins.materialParallax[i]);

				$parallax.addClass('parallax-disabled');
				$parallax.css({ "background-image": 'url(' + $parallax.data("parallax-img") + ')' });
			}
		}
	}

	// Google maps
	if (plugins.maps.length) {
		lazyInit(plugins.maps, initMaps);
	}

	// lightGallery
	function initLightGallery(itemsToInit, addClass) {
		$(itemsToInit).lightGallery({
			thumbnail: $(itemsToInit).attr("data-lg-thumbnail") !== "false",
			selector: "[data-lightgallery='item']",
			autoplay: $(itemsToInit).attr("data-lg-autoplay") === "true",
			pause: parseInt($(itemsToInit).attr("data-lg-autoplay-delay")) || 5000,
			addClass: addClass,
			mode: $(itemsToInit).attr("data-lg-animation") || "lg-slide",
			loop: $(itemsToInit).attr("data-lg-loop") !== "false"
		});
	}

	function initDynamicLightGallery(itemsToInit, addClass) {
		$(itemsToInit).on("click", function () {
			$(itemsToInit).lightGallery({
				thumbnail: $(itemsToInit).attr("data-lg-thumbnail") !== "false",
				selector: "[data-lightgallery='item']",
				autoplay: $(itemsToInit).attr("data-lg-autoplay") === "true",
				pause: parseInt($(itemsToInit).attr("data-lg-autoplay-delay")) || 5000,
				addClass: addClass,
				mode: $(itemsToInit).attr("data-lg-animation") || "lg-slide",
				loop: $(itemsToInit).attr("data-lg-loop") !== "false",
				dynamic: true,
				dynamicEl:
					JSON.parse($(itemsToInit).attr("data-lg-dynamic-elements")) || []
			});
		});
	}

	function initLightGalleryItem(itemToInit, addClass) {
		$(itemToInit).lightGallery({
			selector: "this",
			addClass: addClass,
			counter: false,
			youtubePlayerParams: {
				modestbranding: 1,
				showinfo: 0,
				rel: 0,
				controls: 0
			},
			vimeoPlayerParams: {
				byline: 0,
				portrait: 0
			}
		});
	}

	if (!isNoviBuilder && plugins.lightGallery.length) {
		for (var i = 0; i < plugins.lightGallery.length; i++) initLightGallery(plugins.lightGallery[i]);
	}

	if (!isNoviBuilder && plugins.lightGalleryItem.length) {
		for (var i = 0; i < plugins.lightGalleryItem.length; i++) initLightGalleryItem(plugins.lightGalleryItem[i]);
	}

	if (!isNoviBuilder && plugins.lightDynamicGalleryItem.length) {
		for (var i = 0; i < plugins.lightDynamicGalleryItem.length; i++) initDynamicLightGallery(plugins.lightDynamicGalleryItem[i]);
	}
});

// modal professor
// Banco de dados simulado com as informações dos 6 professores
const professoresData = {
	1: {
		nome: "Carlos Silva",
		especialidade: "Professor de Boxe",
		descricao: "Com mais de 12 anos de experiência nos ringues, Carlos treina atletas de alto rendimento e iniciantes com foco em condicionamento físico, agilidade e técnica de socos impecável.",
		foto: "../images/pofessor-boxe.jpg"
	},
	2: {
		nome: "Mariana Souza",
		especialidade: "Professora de Jiu-Jitsu",
		descricao: "Faixa preta e campeã regional, Mariana é especialista em defesa pessoal e transições de solo. Suas aulas desenvolvem raciocínio estratégico e disciplina rigorosa.",
		foto: "../images/professora-jj.jpg"
	},
	3: {
		nome: "Roberto Mendes",
		especialidade: "Professor de Muay Thai",
		descricao: "Ex-competidor profissional, Roberto traz toda a energia e técnica tradicional tailandesa para o tatame. Foco em fortalecimento de core, chutes e resistência.",
		foto: "../images/professor-mt.jpg"
	},
	4: {
		nome: "Lucas Lima",
		especialidade: "Professor de MMA",
		descricao: "Especialista em artes marciais mistas, Lucas integra técnicas de trocação e grappling, preparando alunos tanto para defesa pessoal quanto para competições oficiais.",
		foto: "../images/professor-mma.jpg"
	},
	5: {
		nome: "Juliano Castro",
		especialidade: "Professor de Judô",
		descricao: "Praticante desde a infância, Juliano ensina as bases filosóficas e as quedas do judô com total segurança para todas as idades, focando em equilíbrio e respeito.",
		foto: "../images/professor-judo.jpg"
	},
	6: {
		nome: "Fernando Rocha",
		especialidade: "Professor de Krav Maga",
		descricao: "Instrutor certificado em defesa urbana, Fernando foca em técnicas rápidas e eficientes de desarmamento e neutralização de ameaças reais do cotidiano.",
		foto: "../images/professor-km.jpg"
	}
};

function mostrarProfessor(id) {
	const prof = professoresData[id];
	if (!prof) return;

	// Preenche os dados no card
	document.getElementById('card-nome').innerText = prof.nome;
	document.getElementById('card-especialidade').innerText = prof.especialidade;
	document.getElementById('card-descricao').innerText = prof.descricao;
	document.getElementById('card-img').src = prof.foto;

	// Exibe o card suavemente e rola a tela até ele
	const card = document.getElementById('info-professor-card');
	card.style.display = 'flex';
	card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function fecharCard() {
	document.getElementById('info-professor-card').style.display = 'none';
}

//   MODALIDADES
// IR PARA A PAGINA MODALIDADES DE ACORDO COM A MODALIDADE ESCOLHIDA NA PAGINA HOME
//INSERIR OS TEXTOS VIA INNERTEXT
const parametros = new URLSearchParams(window.location.search);

const luta = parametros.get("luta");

const titulo = document.getElementById("titulo-luta");
const texto1 = document.getElementById("texto1");
const texto2 = document.getElementById("texto2");
const texto3 = document.getElementById("texto3");
const beneficios = document.getElementById("beneficios");
const funcionamento = document.getElementById("funcionamento");
const estilo = document.getElementById("estilo");

if (titulo) {

	if (luta === "boxe") {

		titulo.innerText = "Boxe";

		texto1.innerText = "O boxe é uma modalidade de combate que envolve apenas o uso dos punhos, realizada com luvas em um ringue. O objetivo é nocautear o oponente ou acumular pontos durante os rounds. Originado há milhares de anos, teve seu renascimento na Inglaterra, através de competições amadoras que evoluíram para o profissionalismo. As regras do boxe incluem o uso exclusivo dos punhos, limites de áreas de impacto e a obrigatoriedade de luvas.";
		texto2.innerText = "As s lutas são decididas por pontos, nocautes, quedas, nocautes técnicos ou desistências. Existem diferentes tipos de boxe, como o olímpico e o profissional, cada um com suas especificidades.";
		texto3.innerText = "Os golpes incluem jab, direto, cruzado e gancho. Infrações como golpes nos braços e agarrar são penalizadas ou não pontuadas. A classificação dos boxeadores é feita por peso, e o esporte, no Brasil, tem uma história marcante, com nomes como Éder Jofre, Popó e conquistas recentes em competições internacionais.";

		beneficios.innerHTML = `
            <li>Melhora o condicionamento</li>
            <li>Aumenta a resistência</li>
            <li>Ajuda na coordenação</li>
            <li>Reduz o estresse</li>
        `;

		funcionamento.innerHTML = `
            <li>Aquecimento</li>
            <li>Treino técnico</li>
            <li>Saco de pancada</li>
            <li>Movimentação</li>
            <li>Alongamento</li>
        `;

		estilo.innerText = "No boxe, os lutadores geralmente se dividem em quatro grandes estilos estratégicos: o Enxameador (agressivo, que luta na curta distância), o Boxeador de Longo Alcance (usa a distância e a velocidade do jab), o Lutador ou Boxeador-Socador (combina força com pressão), e o Contra-Atacante (espera o erro para golpear).";
	}

	else if (luta === "jj") {

		titulo.innerText = "Jiu Jitsu";

		texto1.innerText = "O jiu-jítsu é um esporte de combate e uma arte marcial que foi desenvolvida no Japão. Trata-se de uma luta em que o atleta tenta controlar o adversário com golpes, até conseguir imobilizá-lo, usando técnicas de torção ou estrangulamento, que finalizam o combate.";
		texto2.innerText = "Esta é uma arte marcial difícil, porque exige movimentos complexos, rápidos e não são permitidos socos e chutes.";
		texto3.innerText = "Os praticantes veem no jiu-jítsu não apenas um esporte ou uma forma de defesa pessoal, mas uma filosofia de vida. Isso ocorre porque, além de treinar o corpo, os atletas do jiu-jítsu também treinam a mente, já que a sua prática se baseia em princípios. Um dos seus princípios mais importantes é a humildade. O nome jiu-jítsu significa “arte suave”, porque é formado pelas palavras ju, que significa suavidade, e jutsu, que significa arte.";

		beneficios.innerHTML = `
            <li>Promove a queima de calorias</li>
            <li>Desenvolvimento da força e da flexibilidade</li>
            <li>Técnicas reais de autodefesa</li>
            <li>Mentalmente, a luta é excelente para aliviar o estresse e aumentar a autoconfiança</li>
        `;

		funcionamento.innerHTML = `
            <li>Dinâmica do combate</li>
            <li>Treino de quedas</li>
            <li>Técnicas de solo</li>
            <li>Raspagens</li>
            <li>Rolamento</li>
        `;

		estilo.innerText = "A dinâmica do Jiu-Jitsu baseia-se em alavancas, peso corporal e estratégia, permitindo que uma pessoa menor e mais fraca domine um adversário maior. A luta divide-se em fases específicas";
	}

	else if (luta === "mt") {

		titulo.innerText = "Muay Thai";

		texto1.innerText = "O Muay Thai é uma luta marcial tailandesa, conhecida como a “luta das 8 armas”. Essas armas são as partes do corpo utilizadas nos golpes: dois cotovelos, dois punhos, dois joelhos e a combinação das duas canelas e dos dois pés.";
		texto2.innerText = "Também chamado de thai boxe ou boxe tailandês, o Muay Thai utiliza socos, cotoveladas, joelhadas, chutes e técnicas de esquiva e proteção.";
		texto3.innerText = "O Muay Thai surge como uma técnica de defesa e de guerra, desenvolvida pelos tailandeses para sua proteção e para a defesa do seu território contra os inimigos.";

		beneficios.innerHTML = `
            <li>Tonificação muscular</li>
            <li>Condicionamento Cardiovascular</li>
            <li>Flexibilidade e Coordenação</li>
            <li>Mentalmente, a luta é excelente para aliviar o estresse e aumentar a autoconfiança</li>
        `;

		funcionamento.innerHTML = `
            <li>Socos: Incluem o Jab (soco com a mão da frente), Direto (soco com a mão de trás), Cruzado e Uppercut.</li>
            <li>Chutes: O mais famoso é o chute circular (com a canela), além dos chutes frontais e laterais.</li>
            <li>Joelhadas: Podem ser aplicadas na linha de cintura ou na cabeça do oponente, muito comuns no "clinch".</li>
            <li>Cotoveladas: Golpes curtos e cortantes, utilizados em curtas distâncias ou no "clinch".</li>
            
        `;

		estilo.innerText = "O Muay Thai é uma arte marcial tailandesa conhecida como a arte das oito armas. O estilo baseia-se no uso estratégico e combinado de socos, chutes, joelhadas e cotoveladas, além de um intenso jogo de clinch (agarre) e controle de distância. Dependendo da estratégia e das características físicas do praticante, a luta pode se adaptar a diferentes estilos. ";
	}

	else if (luta === "mma") {

		titulo.innerText = "MMA";

		texto1.innerText = "MMA é a sigla em inglês para Mixed Martial Arts, que em português significa Artes Marciais Mistas. Trata-se de uma modalidade de luta em que os atletas podem utilizar técnicas de diferentes estilos de combate, tanto em pé quanto no chão. Assim, golpes de artes como boxe, judô, muay thai, entre outras, são permitidos sob um conjunto único de regras.";
		texto2.innerText = "O principal objetivo do MMA é permitir que os lutadores escolham livremente quais técnicas usar para vencer o oponente. Para vencer a luta, o atleta que deve nocautear o adversário, ser declarado vencedor por decisão dos juízes ou aplicar uma finalização que leve o oponente à desistência.";
		texto3.innerText = "As lutas acontecem em uma arena cercada por grades (chamada de octógono) no UFC, ou em um ringue tradicional com cordas, onde dois atletas se enfrentam.";

		beneficios.innerHTML = `
            <li>Tonificação muscular</li>
            <li>Condicionamento Cardiovascular</li>
            <li>Autodefesa</li>
            <li>Mentalmente, a luta é excelente para aliviar o estresse e aumentar a autoconfiança</li>
        `;

		funcionamento.innerHTML = `
            <li>Cada luta é dividida em 3 rounds, com 1 minuto de descanso entre eles.</li>
            <li>As lutas pelo título ou principais eventos podem ter até 5 rounds.</li>
            <li>A pontuação é feita por três juízes, que avaliam cada round separadamente usando o sistema de pontuação, caso não haja imobilização ou nocaute</li>
            <li>Os equipamentos usados pelos atletas são essenciais para garantir segurança e desempenho durante as lutas. Os principais equipamento são: luvas, protetor bucal e coquilha.</li>
            
        `;

		estilo.innerText = "O estilo do MMA (Artes Marciais Mistas) é híbrido e dinâmico. Os lutadores combinam técnicas de várias artes marciais para dominar o combate em três áreas principais: a luta em pé (striking), as quedas e a luta agarrada no chão (grappling). ";
	}

	else if (luta === "judo") {

		titulo.innerText = "Judô";

		texto1.innerText = "O judô é uma arte marcial japonesa aplicada no treinamento físico, intelectual, na educação moral e interação social do praticante. Jigoro Kano foi responsável por desenvolver a luta em 1882 no Japão.";
		texto2.innerText = "Criado a partir da influência do jiu-jitsu, o judô teve sua expansão para o mundo após a Segunda Guerra Mundial. O objetivo em uma luta de judô é derrubar o adversário, mantendo suas costas e ombros no tatame, por meio da imobilização.";
		texto3.innerText = "A imigração japonesa impulsionou a prática do judô no Brasil. O país configura entre as nações com o maior número de títulos na modalidade.";

		beneficios.innerHTML = `
            <li>Segurança em Quedas</li>
            <li>Condicionamento Cardiovascular</li>
            <li>Coordenação e Equilíbrio</li>
            <li>Mentalmente, a luta é excelente para aliviar o estresse e aumentar a autoconfiança</li>
        `;

		funcionamento.innerHTML = `
            <li>A roupa utilizada no judô se chama judogui, tradicionalmente na cor branca. </li>
            <li>Koshi-waza: técnicas de quadril.</li>
            <li>Te-waza: técnicas de braço.</li>
            <li>Ashi-waza: técnicas de perna.</li>
            
        `;

		estilo.innerText = "Diferente de artes marciais focadas em golpes traumáticos (como socos e chutes), o judô foi desenvolvido com base em princípios éticos e científicos. Os pilares centrais são: Seiryoku-Zenyo: Máximo de eficiência com o mínimo de esforço. Jita-Kyoei: Prosperidade e benefício mútuo. ";
	}

	else if (luta === "km") {

		titulo.innerText = "Krav Maga";

		texto1.innerText = "O krav maga é mais que uma arte marcial: é uma técnica de defesa pessoal criada para situações reais. Nascido em Israel, combina eficiência, rapidez e movimentos simples para neutralizar ameaças com segurança. Por isso, atrai quem busca preparo físico e confiança no dia a dia. Além de melhorar a resistência e o condicionamento, essa modalidade fortalece a mente e desenvolve autoconfiança. Seja para praticar como exercício, aumentar a sensação de segurança ou conhecer uma luta estratégica, essa é uma modalidade acessível para homens e mulheres em diferentes fases da vida. ";
		texto2.innerText = "O krav maga é um sistema de defesa pessoal desenvolvido para enfrentar situações reais de ameaça. Diferente de esportes de combate, ele não foca em regras ou competições. O objetivo principal é garantir a segurança do praticante com técnicas simples, rápidas e eficientes.";
		texto3.innerText = "Essa prática serve para preparar o corpo e a mente em cenários de risco, como assaltos, agressões físicas ou confrontos inesperados. É amplamente utilizada tanto no meio civil quanto por forças policiais e militares. O aprendizado envolve reflexos, controle emocional e estratégias de reação imediata.";

		beneficios.innerHTML = `
            <li>Condicionamento físico completo: fortalece a musculatura, melhora a resistência e aumenta a agilidade.</li>
            <li>Autoconfiança elevada: proporciona segurança em situações de risco e maior tranquilidade no dia a dia.</li>
            <li>Redução do estresse: os treinos intensos ajudam a liberar tensões e equilibrar as emoções.</li>
            <li>Melhora da concentração: exige foco total, estimulando disciplina mental e clareza nas decisões.</li>
        `;

		funcionamento.innerHTML = `
            <li>Ataque e defesa simultâneos: Defender um golpe e contra-atacar ao mesmo tempo, evitando que o agressor continue a ofensiva.</li>
            <li>Menor caminho e máxima velocidade: Utilizar movimentos curtos, naturais e diretos.</li>
            <li>Uso dos pontos vulneráveis: Focar os golpes onde o oponente não tem resistência muscular (olhos, traqueia, genitais, joelhos).</li>
            <li>Nunca dar as costas: Em situações com múltiplos agressores, o praticante deve manter o campo de visão amplo.</li>
            
        `;

		estilo.innerText = "O krav maga é mais que um sistema de combate. Ele une preparo físico, mentalidade estratégica e técnicas simples que podem ser decisivas em situações reais. Por isso, vai além da autodefesa – oferece confiança, condicionamento e equilíbrio para a vida cotidiana. Se você busca evolução pessoal e quer unir performance, bem-estar e confiança, explorar o universo do krav maga é uma escolha estratégica. E na Netshoes, você encontra tudo para apoiar sua jornada esportiva com praticidade e qualidade. ";
	}

}


// MODAL
document.addEventListener("DOMContentLoaded", function () {
	// Abrir modal
	const openButtons = document.querySelectorAll("[data-modal-target]");
	openButtons.forEach(button => {
		button.addEventListener("click", function (e) {
			e.preventDefault();
			const targetModal = document.querySelector(this.getAttribute("data-modal-target"));
			if (targetModal) {
				targetModal.classList.add("active");
			}
		});
	});

	// Fechar modal pelo botão "X"
	const closeButtons = document.querySelectorAll("[data-modal-close]");
	closeButtons.forEach(button => {
		button.addEventListener("click", function () {
			const modal = this.closest(".custom-modal-overlay");
			if (modal) {
				modal.classList.remove("active");
			}
		});
	});

	// Fechar modal clicando fora da caixa (no fundo escuro)
	const overlays = document.querySelectorAll(".custom-modal-overlay");
	overlays.forEach(overlay => {
		overlay.addEventListener("click", function (e) {
			if (e.target === this) {
				this.classList.remove("active");
			}
		});
	});
});




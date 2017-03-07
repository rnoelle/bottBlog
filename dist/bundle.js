'use strict';

angular.module('bottBlog', ['ui.router', 'firebase', 'ngTagsInput', 'td.easySocialShare']).constant('_', window._).run(function ($rootScope) {
  $rootScope._ = window._;
}).config(function ($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/');

  var authResolve = {
    currentAuth: function currentAuth(Auth, $state) {
      return Auth.$requireSignIn().then(function (el) {
        console.log('email', el.email);
        if (el.email !== 'reidnoelle2@gmail.com') {
          $state.go('home');
        }
      }).catch(function (error) {
        if (error == 'AUTH_REQUIRED') {
          $state.go('login');
        }
      });
    }
  };

  $stateProvider.state('home', {
    url: '/',
    templateUrl: '/js/views/home/home.html',
    controller: 'homeCtrl'
  }).state('newPost', {
    url: '/newPost',
    templateUrl: '/js/views/newPost/newPost.html',
    controller: 'newPostCtrl',
    resolve: authResolve
  }).state('post', {
    url: '/post/:id',
    templateUrl: '/js/views/post/post.html',
    controller: 'postCtrl'
  }).state('login', {
    url: '/login/:error',
    templateUrl: '/js/views/login/login.html',
    controller: 'loginCtrl'
  }).state('about', {
    url: '/about',
    templateUrl: '/js/views/about/about.html'
  }).state('manage', {
    url: '/manage',
    templateUrl: '/js/views/manage/manage.html',
    controller: 'manageCtrl',
    resolve: authResolve

  }).state('editPost', {
    url: '/editPost/:id',
    templateUrl: '/js/views/editPost/editPost.html',
    controller: 'editCtrl',
    resolve: authResolve
  });
});

angular.module('bottBlog').run(function ($rootScope, $location, $state) {
  $rootScope.$on("$routeChangeError", function (event, toState, toParams, fromState, fromParams, error) {
    // We can catch the error thrown when the $requireAuth promise is rejected
    // and redirect the user back to the home page
    if (error === "AUTH_REQUIRED") {
      $state.go("/login");
    }
  });
});
'use strict';

(function () {
    /**
     * Clamps a text node.
     * @param {HTMLElement} element. Element containing the text node to clamp.
     * @param {Object} options. Options to pass to the clamper.
     */
    function clamp(element, options) {
        options = options || {};

        var self = this,
            win = window,
            opt = {
            clamp: options.clamp || 2,
            useNativeClamp: typeof options.useNativeClamp != 'undefined' ? options.useNativeClamp : true,
            splitOnChars: options.splitOnChars || ['.', '-', '–', '—', ' '], //Split on sentences (periods), hypens, en-dashes, em-dashes, and words (spaces).
            animate: options.animate || false,
            truncationChar: options.truncationChar || '',
            truncationHTML: options.truncationHTML,
            originalText: options.originalText
        },
            sty = element.style,
            originalText = options.originalText,
            supportsNativeClamp = typeof element.style.webkitLineClamp != 'undefined',
            clampValue = opt.clamp,
            isCSSValue = clampValue.indexOf && (clampValue.indexOf('px') > -1 || clampValue.indexOf('em') > -1),
            truncationHTMLContainer;

        if (opt.truncationHTML) {
            truncationHTMLContainer = document.createElement('span');
            truncationHTMLContainer.innerHTML = opt.truncationHTML;
        }

        // UTILITY FUNCTIONS __________________________________________________________

        /**
         * Return the current style for an element.
         * @param {HTMLElement} elem The element to compute.
         * @param {string} prop The style property.
         * @returns {number}
         */
        function computeStyle(elem, prop) {
            if (!win.getComputedStyle) {
                win.getComputedStyle = function (el, pseudo) {
                    this.el = el;
                    this.getPropertyValue = function (prop) {
                        var re = /(\-([a-z]){1})/g;
                        if (prop == 'float') prop = 'styleFloat';
                        if (re.test(prop)) {
                            prop = prop.replace(re, function () {
                                return arguments[2].toUpperCase();
                            });
                        }
                        return el.currentStyle && el.currentStyle[prop] ? el.currentStyle[prop] : null;
                    };
                    return this;
                };
            }

            return win.getComputedStyle(elem, null).getPropertyValue(prop);
        }

        /**
         * Returns the maximum number of lines of text that should be rendered based
         * on the current height of the element and the line-height of the text.
         */
        function getMaxLines(height) {
            var availHeight = height || element.clientHeight,
                lineHeight = getLineHeight(element);

            return Math.max(Math.floor(availHeight / lineHeight), 0);
        }

        /**
         * Returns the maximum height a given element should have based on the line-
         * height of the text and the given clamp value.
         */
        function getMaxHeight(clmp) {
            var lineHeight = getLineHeight(element);
            return lineHeight * clmp;
        }

        /**
         * Returns the line-height of an element as an integer.
         */
        function getLineHeight(elem) {
            var lh = computeStyle(elem, 'line-height');
            if (lh == 'normal') {
                // Normal line heights vary from browser to browser. The spec recommends
                // a value between 1.0 and 1.2 of the font size. Using 1.1 to split the diff.
                lh = parseInt(computeStyle(elem, 'font-size')) * 1.2;
            }
            return parseInt(lh);
        }

        // MEAT AND POTATOES (MMMM, POTATOES...) ______________________________________
        var splitOnChars = opt.splitOnChars.slice(0),
            splitChar = splitOnChars[0],
            chunks,
            lastChunk;

        /**
         * Gets an element's last child. That may be another node or a node's contents.
         */
        function getLastChild(elem) {
            //Current element has children, need to go deeper and get last child as a text node
            if (elem.lastChild.children && elem.lastChild.children.length > 0) {
                console.log('elem', elem);
                return getLastChild(Array.prototype.slice.call(elem.children).pop());
            }
            //This is the absolute last child, a text node, but something's wrong with it. Remove it and keep trying
            else if (!elem.lastChild || !elem.lastChild.nodeValue || elem.lastChild.nodeValue == '' || elem.lastChild.nodeValue == opt.truncationChar) {
                    elem.lastChild.parentNode.removeChild(elem.lastChild);
                    return getLastChild(element);
                }
                //This is the last child we want, return it
                else {
                        return elem.lastChild;
                    }
        }

        /**
         * Removes one character at a time from the text until its width or
         * height is beneath the passed-in max param.
         */
        function truncate(target, maxHeight) {
            if (!maxHeight) {
                return;
            }

            /**
             * Resets global variables.
             */
            function reset() {
                splitOnChars = opt.splitOnChars.slice(0);
                splitChar = splitOnChars[0];
                chunks = null;
                lastChunk = null;
            }

            var nodeValue = target.nodeValue.replace(opt.truncationChar, '');

            //Grab the next chunks
            if (!chunks) {
                //If there are more characters to try, grab the next one
                if (splitOnChars.length > 0) {
                    splitChar = splitOnChars.shift();
                    console.log(splitChar, 'splitChar');
                }
                //No characters to chunk by. Go character-by-character
                else {
                        splitChar = '';
                    }

                chunks = nodeValue.split(splitChar);
            }

            //If there are chunks left to remove, remove the last one and see if
            // the nodeValue fits.
            if (chunks.length > 1) {
                console.log('chunks', chunks);
                lastChunk = chunks.pop();
                console.log('lastChunk', lastChunk);
                applyEllipsis(target, chunks.join(splitChar));
            }
            //No more chunks can be removed using this character
            else {
                    chunks = null;
                }

            //Insert the custom HTML before the truncation character
            if (truncationHTMLContainer) {
                target.nodeValue = target.nodeValue.replace(opt.truncationChar, '');
                element.innerHTML = target.nodeValue + ' ' + truncationHTMLContainer.innerHTML + opt.truncationChar;
            }

            //Search produced valid chunks
            if (chunks) {
                //It fits
                if (element.clientHeight <= maxHeight) {
                    //There's still more characters to try splitting on, not quite done yet
                    if (splitOnChars.length >= 0 && splitChar != '') {
                        applyEllipsis(target, chunks.join(splitChar) + splitChar + lastChunk + ' ');
                        chunks = null;
                    }
                    //Finished!
                    else {
                            return element.innerHTML;
                        }
                }
            }
            //No valid chunks produced
            else {
                    //No valid chunks even when splitting by letter, time to move
                    //on to the next node
                    if (splitChar == '') {
                        applyEllipsis(target, '');
                        target = getLastChild(element);

                        reset();
                    }
                }

            //If you get here it means still too big, let's keep truncating
            if (opt.animate) {
                setTimeout(function () {
                    truncate(target, maxHeight);
                }, opt.animate === true ? 10 : opt.animate);
            } else {
                return truncate(target, maxHeight);
            }
        }

        function applyEllipsis(elem, str) {
            console.log(elem, str);
            elem.nodeValue = str + opt.truncationChar;
        }

        // CONSTRUCTOR ________________________________________________________________

        if (clampValue == 'auto') {
            clampValue = getMaxLines();
        } else if (isCSSValue) {
            clampValue = getMaxLines(parseInt(clampValue));
        }

        var clampedText;
        if (supportsNativeClamp && opt.useNativeClamp) {
            sty.overflow = 'hidden';
            sty.textOverflow = 'ellipsis';
            sty.webkitBoxOrient = 'vertical';
            sty.display = '-webkit-box';
            sty.webkitLineClamp = clampValue;

            if (isCSSValue) {
                sty.height = opt.clamp + 'px';
            }
        } else {
            var height = getMaxHeight(clampValue);
            if (height <= element.clientHeight) {
                clampedText = truncate(getLastChild(element), height);
            }
        }
        return {
            'original': originalText,
            'clamped': clampedText
        };
    }

    window.$clamp = clamp;
})();
'use strict';

/*!
 * ngTagsInput v3.1.1
 * http://mbenford.github.io/ngTagsInput
 *
 * Copyright (c) 2013-2016 Michael Benford
 * License: MIT
 *
 * Generated at 2016-05-27 12:28:31 -0300
 */
(function () {
    'use strict';

    var KEYS = {
        backspace: 8,
        tab: 9,
        enter: 13,
        escape: 27,
        space: 32,
        up: 38,
        down: 40,
        left: 37,
        right: 39,
        delete: 46,
        comma: 188
    };

    var MAX_SAFE_INTEGER = 9007199254740991;
    var SUPPORTED_INPUT_TYPES = ['text', 'email', 'url'];

    var tagsInput = angular.module('ngTagsInput', []);

    /**
     * @ngdoc directive
     * @name tagsInput
     * @module ngTagsInput
     *
     * @description
     * Renders an input box with tag editing support.
     *
     * @param {string} ngModel Assignable Angular expression to data-bind to.
     * @param {string=} [template=NA] URL or id of a custom template for rendering each tag.
     * @param {string=} [templateScope=NA] Scope to be passed to custom templates - of both tagsInput and
     *    autoComplete directives - as $scope.
     * @param {string=} [displayProperty=text] Property to be rendered as the tag label.
     * @param {string=} [keyProperty=text] Property to be used as a unique identifier for the tag.
     * @param {string=} [type=text] Type of the input element. Only 'text', 'email' and 'url' are supported values.
     * @param {string=} [text=NA] Assignable Angular expression for data-binding to the element's text.
     * @param {number=} tabindex Tab order of the control.
     * @param {string=} [placeholder=Add a tag] Placeholder text for the control.
     * @param {number=} [minLength=3] Minimum length for a new tag.
     * @param {number=} [maxLength=MAX_SAFE_INTEGER] Maximum length allowed for a new tag.
     * @param {number=} [minTags=0] Sets minTags validation error key if the number of tags added is less than minTags.
     * @param {number=} [maxTags=MAX_SAFE_INTEGER] Sets maxTags validation error key if the number of tags added is greater
     *    than maxTags.
     * @param {boolean=} [allowLeftoverText=false] Sets leftoverText validation error key if there is any leftover text in
     *    the input element when the directive loses focus.
     * @param {string=} [removeTagSymbol=×] (Obsolete) Symbol character for the remove tag button.
     * @param {boolean=} [addOnEnter=true] Flag indicating that a new tag will be added on pressing the ENTER key.
     * @param {boolean=} [addOnSpace=false] Flag indicating that a new tag will be added on pressing the SPACE key.
     * @param {boolean=} [addOnComma=true] Flag indicating that a new tag will be added on pressing the COMMA key.
     * @param {boolean=} [addOnBlur=true] Flag indicating that a new tag will be added when the input field loses focus.
     * @param {boolean=} [addOnPaste=false] Flag indicating that the text pasted into the input field will be split into tags.
     * @param {string=} [pasteSplitPattern=,] Regular expression used to split the pasted text into tags.
     * @param {boolean=} [replaceSpacesWithDashes=true] Flag indicating that spaces will be replaced with dashes.
     * @param {string=} [allowedTagsPattern=.+] Regular expression that determines whether a new tag is valid.
     * @param {boolean=} [enableEditingLastTag=false] Flag indicating that the last tag will be moved back into the new tag
     *    input box instead of being removed when the backspace key is pressed and the input box is empty.
     * @param {boolean=} [addFromAutocompleteOnly=false] Flag indicating that only tags coming from the autocomplete list
     *    will be allowed. When this flag is true, addOnEnter, addOnComma, addOnSpace and addOnBlur values are ignored.
     * @param {boolean=} [spellcheck=true] Flag indicating whether the browser's spellcheck is enabled for the input field or not.
     * @param {expression=} [tagClass=NA] Expression to evaluate for each existing tag in order to get the CSS classes to be used.
     *    The expression is provided with the current tag as $tag, its index as $index and its state as $selected. The result
     *    of the evaluation must be one of the values supported by the ngClass directive (either a string, an array or an object).
     *    See https://docs.angularjs.org/api/ng/directive/ngClass for more information.
     * @param {expression=} [onTagAdding=NA] Expression to evaluate that will be invoked before adding a new tag. The new
     *    tag is available as $tag. This method must return either a boolean value or a promise. If either a false value or a rejected
     *    promise is returned, the tag will not be added.
     * @param {expression=} [onTagAdded=NA] Expression to evaluate upon adding a new tag. The new tag is available as $tag.
     * @param {expression=} [onInvalidTag=NA] Expression to evaluate when a tag is invalid. The invalid tag is available as $tag.
     * @param {expression=} [onTagRemoving=NA] Expression to evaluate that will be invoked before removing a tag. The tag
     *    is available as $tag. This method must return either a boolean value or a promise. If either a false value or a rejected
     *    promise is returned, the tag will not be removed.
     * @param {expression=} [onTagRemoved=NA] Expression to evaluate upon removing an existing tag. The removed tag is available as $tag.
     * @param {expression=} [onTagClicked=NA] Expression to evaluate upon clicking an existing tag. The clicked tag is available as $tag.
     */
    tagsInput.directive('tagsInput', ["$timeout", "$document", "$window", "$q", "tagsInputConfig", "tiUtil", function ($timeout, $document, $window, $q, tagsInputConfig, tiUtil) {
        function TagList(options, events, onTagAdding, onTagRemoving) {
            var self = {},
                getTagText,
                setTagText,
                canAddTag,
                canRemoveTag;

            getTagText = function getTagText(tag) {
                return tiUtil.safeToString(tag[options.displayProperty]);
            };

            setTagText = function setTagText(tag, text) {
                tag[options.displayProperty] = text;
            };

            canAddTag = function canAddTag(tag) {
                var tagText = getTagText(tag);
                var valid = tagText && tagText.length >= options.minLength && tagText.length <= options.maxLength && options.allowedTagsPattern.test(tagText) && !tiUtil.findInObjectArray(self.items, tag, options.keyProperty || options.displayProperty);

                return $q.when(valid && onTagAdding({ $tag: tag })).then(tiUtil.promisifyValue);
            };

            canRemoveTag = function canRemoveTag(tag) {
                return $q.when(onTagRemoving({ $tag: tag })).then(tiUtil.promisifyValue);
            };

            self.items = [];

            self.addText = function (text) {
                var tag = {};
                setTagText(tag, text);
                return self.add(tag);
            };

            self.add = function (tag) {
                var tagText = getTagText(tag);

                if (options.replaceSpacesWithDashes) {
                    tagText = tiUtil.replaceSpacesWithDashes(tagText);
                }

                setTagText(tag, tagText);

                return canAddTag(tag).then(function () {
                    self.items.push(tag);
                    events.trigger('tag-added', { $tag: tag });
                }).catch(function () {
                    if (tagText) {
                        events.trigger('invalid-tag', { $tag: tag });
                    }
                });
            };

            self.remove = function (index) {
                var tag = self.items[index];

                return canRemoveTag(tag).then(function () {
                    self.items.splice(index, 1);
                    self.clearSelection();
                    events.trigger('tag-removed', { $tag: tag });
                    return tag;
                });
            };

            self.select = function (index) {
                if (index < 0) {
                    index = self.items.length - 1;
                } else if (index >= self.items.length) {
                    index = 0;
                }

                self.index = index;
                self.selected = self.items[index];
            };

            self.selectPrior = function () {
                self.select(--self.index);
            };

            self.selectNext = function () {
                self.select(++self.index);
            };

            self.removeSelected = function () {
                return self.remove(self.index);
            };

            self.clearSelection = function () {
                self.selected = null;
                self.index = -1;
            };

            self.clearSelection();

            return self;
        }

        function validateType(type) {
            return SUPPORTED_INPUT_TYPES.indexOf(type) !== -1;
        }

        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                tags: '=ngModel',
                text: '=?',
                templateScope: '=?',
                tagClass: '&',
                onTagAdding: '&',
                onTagAdded: '&',
                onInvalidTag: '&',
                onTagRemoving: '&',
                onTagRemoved: '&',
                onTagClicked: '&'
            },
            replace: false,
            transclude: true,
            templateUrl: 'ngTagsInput/tags-input.html',
            controller: ["$scope", "$attrs", "$element", function ($scope, $attrs, $element) {
                $scope.events = tiUtil.simplePubSub();

                tagsInputConfig.load('tagsInput', $scope, $attrs, {
                    template: [String, 'ngTagsInput/tag-item.html'],
                    type: [String, 'text', validateType],
                    placeholder: [String, 'Add a tag'],
                    tabindex: [Number, null],
                    removeTagSymbol: [String, String.fromCharCode(215)],
                    replaceSpacesWithDashes: [Boolean, true],
                    minLength: [Number, 3],
                    maxLength: [Number, MAX_SAFE_INTEGER],
                    addOnEnter: [Boolean, true],
                    addOnSpace: [Boolean, false],
                    addOnComma: [Boolean, true],
                    addOnBlur: [Boolean, true],
                    addOnPaste: [Boolean, false],
                    pasteSplitPattern: [RegExp, /,/],
                    allowedTagsPattern: [RegExp, /.+/],
                    enableEditingLastTag: [Boolean, false],
                    minTags: [Number, 0],
                    maxTags: [Number, MAX_SAFE_INTEGER],
                    displayProperty: [String, 'text'],
                    keyProperty: [String, ''],
                    allowLeftoverText: [Boolean, false],
                    addFromAutocompleteOnly: [Boolean, false],
                    spellcheck: [Boolean, true]
                });

                $scope.tagList = new TagList($scope.options, $scope.events, tiUtil.handleUndefinedResult($scope.onTagAdding, true), tiUtil.handleUndefinedResult($scope.onTagRemoving, true));

                this.registerAutocomplete = function () {
                    var input = $element.find('input');

                    return {
                        addTag: function addTag(tag) {
                            return $scope.tagList.add(tag);
                        },
                        getTags: function getTags() {
                            return $scope.tagList.items;
                        },
                        getCurrentTagText: function getCurrentTagText() {
                            return $scope.newTag.text();
                        },
                        getOptions: function getOptions() {
                            return $scope.options;
                        },
                        getTemplateScope: function getTemplateScope() {
                            return $scope.templateScope;
                        },
                        on: function on(name, handler) {
                            $scope.events.on(name, handler, true);
                            return this;
                        }
                    };
                };

                this.registerTagItem = function () {
                    return {
                        getOptions: function getOptions() {
                            return $scope.options;
                        },
                        removeTag: function removeTag(index) {
                            if ($scope.disabled) {
                                return;
                            }
                            $scope.tagList.remove(index);
                        }
                    };
                };
            }],
            link: function link(scope, element, attrs, ngModelCtrl) {
                var hotkeys = [KEYS.enter, KEYS.comma, KEYS.space, KEYS.backspace, KEYS.delete, KEYS.left, KEYS.right],
                    tagList = scope.tagList,
                    events = scope.events,
                    options = scope.options,
                    input = element.find('input'),
                    validationOptions = ['minTags', 'maxTags', 'allowLeftoverText'],
                    setElementValidity,
                    focusInput;

                setElementValidity = function setElementValidity() {
                    ngModelCtrl.$setValidity('maxTags', tagList.items.length <= options.maxTags);
                    ngModelCtrl.$setValidity('minTags', tagList.items.length >= options.minTags);
                    ngModelCtrl.$setValidity('leftoverText', scope.hasFocus || options.allowLeftoverText ? true : !scope.newTag.text());
                };

                focusInput = function focusInput() {
                    $timeout(function () {
                        input[0].focus();
                    });
                };

                ngModelCtrl.$isEmpty = function (value) {
                    return !value || !value.length;
                };

                scope.newTag = {
                    text: function text(value) {
                        if (angular.isDefined(value)) {
                            scope.text = value;
                            events.trigger('input-change', value);
                        } else {
                            return scope.text || '';
                        }
                    },
                    invalid: null
                };

                scope.track = function (tag) {
                    return tag[options.keyProperty || options.displayProperty];
                };

                scope.getTagClass = function (tag, index) {
                    var selected = tag === tagList.selected;
                    return [scope.tagClass({ $tag: tag, $index: index, $selected: selected }), { selected: selected }];
                };

                scope.$watch('tags', function (value) {
                    if (value) {
                        tagList.items = tiUtil.makeObjectArray(value, options.displayProperty);
                        scope.tags = tagList.items;
                    } else {
                        tagList.items = [];
                    }
                });

                scope.$watch('tags.length', function () {
                    setElementValidity();

                    // ngModelController won't trigger validators when the model changes (because it's an array),
                    // so we need to do it ourselves. Unfortunately this won't trigger any registered formatter.
                    ngModelCtrl.$validate();
                });

                attrs.$observe('disabled', function (value) {
                    scope.disabled = value;
                });

                scope.eventHandlers = {
                    input: {
                        keydown: function keydown($event) {
                            events.trigger('input-keydown', $event);
                        },
                        focus: function focus() {
                            if (scope.hasFocus) {
                                return;
                            }

                            scope.hasFocus = true;
                            events.trigger('input-focus');
                        },
                        blur: function blur() {
                            $timeout(function () {
                                var activeElement = $document.prop('activeElement'),
                                    lostFocusToBrowserWindow = activeElement === input[0],
                                    lostFocusToChildElement = element[0].contains(activeElement);

                                if (lostFocusToBrowserWindow || !lostFocusToChildElement) {
                                    scope.hasFocus = false;
                                    events.trigger('input-blur');
                                }
                            });
                        },
                        paste: function paste($event) {
                            $event.getTextData = function () {
                                var clipboardData = $event.clipboardData || $event.originalEvent && $event.originalEvent.clipboardData;
                                return clipboardData ? clipboardData.getData('text/plain') : $window.clipboardData.getData('Text');
                            };
                            events.trigger('input-paste', $event);
                        }
                    },
                    host: {
                        click: function click() {
                            if (scope.disabled) {
                                return;
                            }
                            focusInput();
                        }
                    },
                    tag: {
                        click: function click(tag) {
                            events.trigger('tag-clicked', { $tag: tag });
                        }
                    }
                };

                events.on('tag-added', scope.onTagAdded).on('invalid-tag', scope.onInvalidTag).on('tag-removed', scope.onTagRemoved).on('tag-clicked', scope.onTagClicked).on('tag-added', function () {
                    scope.newTag.text('');
                }).on('tag-added tag-removed', function () {
                    scope.tags = tagList.items;
                    // Ideally we should be able call $setViewValue here and let it in turn call $setDirty and $validate
                    // automatically, but since the model is an array, $setViewValue does nothing and it's up to us to do it.
                    // Unfortunately this won't trigger any registered $parser and there's no safe way to do it.
                    ngModelCtrl.$setDirty();
                    focusInput();
                }).on('invalid-tag', function () {
                    scope.newTag.invalid = true;
                }).on('option-change', function (e) {
                    if (validationOptions.indexOf(e.name) !== -1) {
                        setElementValidity();
                    }
                }).on('input-change', function () {
                    tagList.clearSelection();
                    scope.newTag.invalid = null;
                }).on('input-focus', function () {
                    element.triggerHandler('focus');
                    ngModelCtrl.$setValidity('leftoverText', true);
                }).on('input-blur', function () {
                    if (options.addOnBlur && !options.addFromAutocompleteOnly) {
                        tagList.addText(scope.newTag.text());
                    }
                    element.triggerHandler('blur');
                    setElementValidity();
                }).on('input-keydown', function (event) {
                    var key = event.keyCode,
                        addKeys = {},
                        shouldAdd,
                        shouldRemove,
                        shouldSelect,
                        shouldEditLastTag;

                    if (tiUtil.isModifierOn(event) || hotkeys.indexOf(key) === -1) {
                        return;
                    }

                    addKeys[KEYS.enter] = options.addOnEnter;
                    addKeys[KEYS.comma] = options.addOnComma;
                    addKeys[KEYS.space] = options.addOnSpace;

                    shouldAdd = !options.addFromAutocompleteOnly && addKeys[key];
                    shouldRemove = (key === KEYS.backspace || key === KEYS.delete) && tagList.selected;
                    shouldEditLastTag = key === KEYS.backspace && scope.newTag.text().length === 0 && options.enableEditingLastTag;
                    shouldSelect = (key === KEYS.backspace || key === KEYS.left || key === KEYS.right) && scope.newTag.text().length === 0 && !options.enableEditingLastTag;

                    if (shouldAdd) {
                        tagList.addText(scope.newTag.text());
                    } else if (shouldEditLastTag) {
                        tagList.selectPrior();
                        tagList.removeSelected().then(function (tag) {
                            if (tag) {
                                scope.newTag.text(tag[options.displayProperty]);
                            }
                        });
                    } else if (shouldRemove) {
                        tagList.removeSelected();
                    } else if (shouldSelect) {
                        if (key === KEYS.left || key === KEYS.backspace) {
                            tagList.selectPrior();
                        } else if (key === KEYS.right) {
                            tagList.selectNext();
                        }
                    }

                    if (shouldAdd || shouldSelect || shouldRemove || shouldEditLastTag) {
                        event.preventDefault();
                    }
                }).on('input-paste', function (event) {
                    if (options.addOnPaste) {
                        var data = event.getTextData();
                        var tags = data.split(options.pasteSplitPattern);

                        if (tags.length > 1) {
                            tags.forEach(function (tag) {
                                tagList.addText(tag);
                            });
                            event.preventDefault();
                        }
                    }
                });
            }
        };
    }]);

    /**
     * @ngdoc directive
     * @name tiTagItem
     * @module ngTagsInput
     *
     * @description
     * Represents a tag item. Used internally by the tagsInput directive.
     */
    tagsInput.directive('tiTagItem', ["tiUtil", function (tiUtil) {
        return {
            restrict: 'E',
            require: '^tagsInput',
            template: '<ng-include src="$$template"></ng-include>',
            scope: {
                $scope: '=scope',
                data: '='
            },
            link: function link(scope, element, attrs, tagsInputCtrl) {
                var tagsInput = tagsInputCtrl.registerTagItem(),
                    options = tagsInput.getOptions();

                scope.$$template = options.template;
                scope.$$removeTagSymbol = options.removeTagSymbol;

                scope.$getDisplayText = function () {
                    return tiUtil.safeToString(scope.data[options.displayProperty]);
                };
                scope.$removeTag = function () {
                    tagsInput.removeTag(scope.$index);
                };

                scope.$watch('$parent.$index', function (value) {
                    scope.$index = value;
                });
            }
        };
    }]);

    /**
     * @ngdoc directive
     * @name autoComplete
     * @module ngTagsInput
     *
     * @description
     * Provides autocomplete support for the tagsInput directive.
     *
     * @param {expression} source Expression to evaluate upon changing the input content. The input value is available as
     *    $query. The result of the expression must be a promise that eventually resolves to an array of strings.
     * @param {string=} [template=NA] URL or id of a custom template for rendering each element of the autocomplete list.
     * @param {string=} [displayProperty=tagsInput.displayText] Property to be rendered as the autocomplete label.
     * @param {number=} [debounceDelay=100] Amount of time, in milliseconds, to wait before evaluating the expression in
     *    the source option after the last keystroke.
     * @param {number=} [minLength=3] Minimum number of characters that must be entered before evaluating the expression
     *    in the source option.
     * @param {boolean=} [highlightMatchedText=true] Flag indicating that the matched text will be highlighted in the
     *    suggestions list.
     * @param {number=} [maxResultsToShow=10] Maximum number of results to be displayed at a time.
     * @param {boolean=} [loadOnDownArrow=false] Flag indicating that the source option will be evaluated when the down arrow
     *    key is pressed and the suggestion list is closed. The current input value is available as $query.
     * @param {boolean=} [loadOnEmpty=false] Flag indicating that the source option will be evaluated when the input content
     *    becomes empty. The $query variable will be passed to the expression as an empty string.
     * @param {boolean=} [loadOnFocus=false] Flag indicating that the source option will be evaluated when the input element
     *    gains focus. The current input value is available as $query.
     * @param {boolean=} [selectFirstMatch=true] Flag indicating that the first match will be automatically selected once
     *    the suggestion list is shown.
     * @param {expression=} [matchClass=NA] Expression to evaluate for each match in order to get the CSS classes to be used.
     *    The expression is provided with the current match as $match, its index as $index and its state as $selected. The result
     *    of the evaluation must be one of the values supported by the ngClass directive (either a string, an array or an object).
     *    See https://docs.angularjs.org/api/ng/directive/ngClass for more information.
     */
    tagsInput.directive('autoComplete', ["$document", "$timeout", "$sce", "$q", "tagsInputConfig", "tiUtil", function ($document, $timeout, $sce, $q, tagsInputConfig, tiUtil) {
        function SuggestionList(loadFn, options, events) {
            var self = {},
                getDifference,
                lastPromise,
                getTagId;

            getTagId = function getTagId() {
                return options.tagsInput.keyProperty || options.tagsInput.displayProperty;
            };

            getDifference = function getDifference(array1, array2) {
                return array1.filter(function (item) {
                    return !tiUtil.findInObjectArray(array2, item, getTagId(), function (a, b) {
                        if (options.tagsInput.replaceSpacesWithDashes) {
                            a = tiUtil.replaceSpacesWithDashes(a);
                            b = tiUtil.replaceSpacesWithDashes(b);
                        }
                        return tiUtil.defaultComparer(a, b);
                    });
                });
            };

            self.reset = function () {
                lastPromise = null;

                self.items = [];
                self.visible = false;
                self.index = -1;
                self.selected = null;
                self.query = null;
            };
            self.show = function () {
                if (options.selectFirstMatch) {
                    self.select(0);
                } else {
                    self.selected = null;
                }
                self.visible = true;
            };
            self.load = tiUtil.debounce(function (query, tags) {
                self.query = query;

                var promise = $q.when(loadFn({ $query: query }));
                lastPromise = promise;

                promise.then(function (items) {
                    if (promise !== lastPromise) {
                        return;
                    }

                    items = tiUtil.makeObjectArray(items.data || items, getTagId());
                    items = getDifference(items, tags);
                    self.items = items.slice(0, options.maxResultsToShow);

                    if (self.items.length > 0) {
                        self.show();
                    } else {
                        self.reset();
                    }
                });
            }, options.debounceDelay);

            self.selectNext = function () {
                self.select(++self.index);
            };
            self.selectPrior = function () {
                self.select(--self.index);
            };
            self.select = function (index) {
                if (index < 0) {
                    index = self.items.length - 1;
                } else if (index >= self.items.length) {
                    index = 0;
                }
                self.index = index;
                self.selected = self.items[index];
                events.trigger('suggestion-selected', index);
            };

            self.reset();

            return self;
        }

        function scrollToElement(root, index) {
            var element = root.find('li').eq(index),
                parent = element.parent(),
                elementTop = element.prop('offsetTop'),
                elementHeight = element.prop('offsetHeight'),
                parentHeight = parent.prop('clientHeight'),
                parentScrollTop = parent.prop('scrollTop');

            if (elementTop < parentScrollTop) {
                parent.prop('scrollTop', elementTop);
            } else if (elementTop + elementHeight > parentHeight + parentScrollTop) {
                parent.prop('scrollTop', elementTop + elementHeight - parentHeight);
            }
        }

        return {
            restrict: 'E',
            require: '^tagsInput',
            scope: {
                source: '&',
                matchClass: '&'
            },
            templateUrl: 'ngTagsInput/auto-complete.html',
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
                $scope.events = tiUtil.simplePubSub();

                tagsInputConfig.load('autoComplete', $scope, $attrs, {
                    template: [String, 'ngTagsInput/auto-complete-match.html'],
                    debounceDelay: [Number, 100],
                    minLength: [Number, 3],
                    highlightMatchedText: [Boolean, true],
                    maxResultsToShow: [Number, 10],
                    loadOnDownArrow: [Boolean, false],
                    loadOnEmpty: [Boolean, false],
                    loadOnFocus: [Boolean, false],
                    selectFirstMatch: [Boolean, true],
                    displayProperty: [String, '']
                });

                $scope.suggestionList = new SuggestionList($scope.source, $scope.options, $scope.events);

                this.registerAutocompleteMatch = function () {
                    return {
                        getOptions: function getOptions() {
                            return $scope.options;
                        },
                        getQuery: function getQuery() {
                            return $scope.suggestionList.query;
                        }
                    };
                };
            }],
            link: function link(scope, element, attrs, tagsInputCtrl) {
                var hotkeys = [KEYS.enter, KEYS.tab, KEYS.escape, KEYS.up, KEYS.down],
                    suggestionList = scope.suggestionList,
                    tagsInput = tagsInputCtrl.registerAutocomplete(),
                    options = scope.options,
                    events = scope.events,
                    shouldLoadSuggestions;

                options.tagsInput = tagsInput.getOptions();

                shouldLoadSuggestions = function shouldLoadSuggestions(value) {
                    return value && value.length >= options.minLength || !value && options.loadOnEmpty;
                };

                scope.templateScope = tagsInput.getTemplateScope();

                scope.addSuggestionByIndex = function (index) {
                    suggestionList.select(index);
                    scope.addSuggestion();
                };

                scope.addSuggestion = function () {
                    var added = false;

                    if (suggestionList.selected) {
                        tagsInput.addTag(angular.copy(suggestionList.selected));
                        suggestionList.reset();
                        added = true;
                    }
                    return added;
                };

                scope.track = function (item) {
                    return item[options.tagsInput.keyProperty || options.tagsInput.displayProperty];
                };

                scope.getSuggestionClass = function (item, index) {
                    var selected = item === suggestionList.selected;
                    return [scope.matchClass({ $match: item, $index: index, $selected: selected }), { selected: selected }];
                };

                tagsInput.on('tag-added tag-removed invalid-tag input-blur', function () {
                    suggestionList.reset();
                }).on('input-change', function (value) {
                    if (shouldLoadSuggestions(value)) {
                        suggestionList.load(value, tagsInput.getTags());
                    } else {
                        suggestionList.reset();
                    }
                }).on('input-focus', function () {
                    var value = tagsInput.getCurrentTagText();
                    if (options.loadOnFocus && shouldLoadSuggestions(value)) {
                        suggestionList.load(value, tagsInput.getTags());
                    }
                }).on('input-keydown', function (event) {
                    var key = event.keyCode,
                        handled = false;

                    if (tiUtil.isModifierOn(event) || hotkeys.indexOf(key) === -1) {
                        return;
                    }

                    if (suggestionList.visible) {

                        if (key === KEYS.down) {
                            suggestionList.selectNext();
                            handled = true;
                        } else if (key === KEYS.up) {
                            suggestionList.selectPrior();
                            handled = true;
                        } else if (key === KEYS.escape) {
                            suggestionList.reset();
                            handled = true;
                        } else if (key === KEYS.enter || key === KEYS.tab) {
                            handled = scope.addSuggestion();
                        }
                    } else {
                        if (key === KEYS.down && scope.options.loadOnDownArrow) {
                            suggestionList.load(tagsInput.getCurrentTagText(), tagsInput.getTags());
                            handled = true;
                        }
                    }

                    if (handled) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        return false;
                    }
                });

                events.on('suggestion-selected', function (index) {
                    scrollToElement(element, index);
                });
            }
        };
    }]);

    /**
     * @ngdoc directive
     * @name tiAutocompleteMatch
     * @module ngTagsInput
     *
     * @description
     * Represents an autocomplete match. Used internally by the autoComplete directive.
     */
    tagsInput.directive('tiAutocompleteMatch', ["$sce", "tiUtil", function ($sce, tiUtil) {
        return {
            restrict: 'E',
            require: '^autoComplete',
            template: '<ng-include src="$$template"></ng-include>',
            scope: {
                $scope: '=scope',
                data: '='
            },
            link: function link(scope, element, attrs, autoCompleteCtrl) {
                var autoComplete = autoCompleteCtrl.registerAutocompleteMatch(),
                    options = autoComplete.getOptions();

                scope.$$template = options.template;
                scope.$index = scope.$parent.$index;

                scope.$highlight = function (text) {
                    if (options.highlightMatchedText) {
                        text = tiUtil.safeHighlight(text, autoComplete.getQuery());
                    }
                    return $sce.trustAsHtml(text);
                };
                scope.$getDisplayText = function () {
                    return tiUtil.safeToString(scope.data[options.displayProperty || options.tagsInput.displayProperty]);
                };
            }
        };
    }]);

    /**
     * @ngdoc directive
     * @name tiTranscludeAppend
     * @module ngTagsInput
     *
     * @description
     * Re-creates the old behavior of ng-transclude. Used internally by tagsInput directive.
     */
    tagsInput.directive('tiTranscludeAppend', function () {
        return function (scope, element, attrs, ctrl, transcludeFn) {
            transcludeFn(function (clone) {
                element.append(clone);
            });
        };
    });

    /**
     * @ngdoc directive
     * @name tiAutosize
     * @module ngTagsInput
     *
     * @description
     * Automatically sets the input's width so its content is always visible. Used internally by tagsInput directive.
     */
    tagsInput.directive('tiAutosize', ["tagsInputConfig", function (tagsInputConfig) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function link(scope, element, attrs, ctrl) {
                var threshold = tagsInputConfig.getTextAutosizeThreshold(),
                    span,
                    resize;

                span = angular.element('<span class="input"></span>');
                span.css('display', 'none').css('visibility', 'hidden').css('width', 'auto').css('white-space', 'pre');

                element.parent().append(span);

                resize = function resize(originalValue) {
                    var value = originalValue,
                        width;

                    if (angular.isString(value) && value.length === 0) {
                        value = attrs.placeholder;
                    }

                    if (value) {
                        span.text(value);
                        span.css('display', '');
                        width = span.prop('offsetWidth');
                        span.css('display', 'none');
                    }

                    element.css('width', width ? width + threshold + 'px' : '');

                    return originalValue;
                };

                ctrl.$parsers.unshift(resize);
                ctrl.$formatters.unshift(resize);

                attrs.$observe('placeholder', function (value) {
                    if (!ctrl.$modelValue) {
                        resize(value);
                    }
                });
            }
        };
    }]);

    /**
     * @ngdoc directive
     * @name tiBindAttrs
     * @module ngTagsInput
     *
     * @description
     * Binds attributes to expressions. Used internally by tagsInput directive.
     */
    tagsInput.directive('tiBindAttrs', function () {
        return function (scope, element, attrs) {
            scope.$watch(attrs.tiBindAttrs, function (value) {
                angular.forEach(value, function (value, key) {
                    attrs.$set(key, value);
                });
            }, true);
        };
    });

    /**
     * @ngdoc service
     * @name tagsInputConfig
     * @module ngTagsInput
     *
     * @description
     * Sets global configuration settings for both tagsInput and autoComplete directives. It's also used internally to parse and
     *  initialize options from HTML attributes.
     */
    tagsInput.provider('tagsInputConfig', function () {
        var globalDefaults = {},
            interpolationStatus = {},
            autosizeThreshold = 3;

        /**
         * @ngdoc method
         * @name tagsInputConfig#setDefaults
         * @description Sets the default configuration option for a directive.
         *
         * @param {string} directive Name of the directive to be configured. Must be either 'tagsInput' or 'autoComplete'.
         * @param {object} defaults Object containing options and their values.
         *
         * @returns {object} The service itself for chaining purposes.
         */
        this.setDefaults = function (directive, defaults) {
            globalDefaults[directive] = defaults;
            return this;
        };

        /**
         * @ngdoc method
         * @name tagsInputConfig#setActiveInterpolation
         * @description Sets active interpolation for a set of options.
         *
         * @param {string} directive Name of the directive to be configured. Must be either 'tagsInput' or 'autoComplete'.
         * @param {object} options Object containing which options should have interpolation turned on at all times.
         *
         * @returns {object} The service itself for chaining purposes.
         */
        this.setActiveInterpolation = function (directive, options) {
            interpolationStatus[directive] = options;
            return this;
        };

        /**
         * @ngdoc method
         * @name tagsInputConfig#setTextAutosizeThreshold
         * @description Sets the threshold used by the tagsInput directive to re-size the inner input field element based on its contents.
         *
         * @param {number} threshold Threshold value, in pixels.
         *
         * @returns {object} The service itself for chaining purposes.
         */
        this.setTextAutosizeThreshold = function (threshold) {
            autosizeThreshold = threshold;
            return this;
        };

        this.$get = ["$interpolate", function ($interpolate) {
            var converters = {};
            converters[String] = function (value) {
                return value;
            };
            converters[Number] = function (value) {
                return parseInt(value, 10);
            };
            converters[Boolean] = function (value) {
                return value.toLowerCase() === 'true';
            };
            converters[RegExp] = function (value) {
                return new RegExp(value);
            };

            return {
                load: function load(directive, scope, attrs, options) {
                    var defaultValidator = function defaultValidator() {
                        return true;
                    };

                    scope.options = {};

                    angular.forEach(options, function (value, key) {
                        var type, localDefault, validator, converter, getDefault, updateValue;

                        type = value[0];
                        localDefault = value[1];
                        validator = value[2] || defaultValidator;
                        converter = converters[type];

                        getDefault = function getDefault() {
                            var globalValue = globalDefaults[directive] && globalDefaults[directive][key];
                            return angular.isDefined(globalValue) ? globalValue : localDefault;
                        };

                        updateValue = function updateValue(value) {
                            scope.options[key] = value && validator(value) ? converter(value) : getDefault();
                        };

                        if (interpolationStatus[directive] && interpolationStatus[directive][key]) {
                            attrs.$observe(key, function (value) {
                                updateValue(value);
                                scope.events.trigger('option-change', { name: key, newValue: value });
                            });
                        } else {
                            updateValue(attrs[key] && $interpolate(attrs[key])(scope.$parent));
                        }
                    });
                },
                getTextAutosizeThreshold: function getTextAutosizeThreshold() {
                    return autosizeThreshold;
                }
            };
        }];
    });

    /***
     * @ngdoc service
     * @name tiUtil
     * @module ngTagsInput
     *
     * @description
     * Helper methods used internally by the directive. Should not be called directly from user code.
     */
    tagsInput.factory('tiUtil', ["$timeout", "$q", function ($timeout, $q) {
        var self = {};

        self.debounce = function (fn, delay) {
            var timeoutId;
            return function () {
                var args = arguments;
                $timeout.cancel(timeoutId);
                timeoutId = $timeout(function () {
                    fn.apply(null, args);
                }, delay);
            };
        };

        self.makeObjectArray = function (array, key) {
            if (!angular.isArray(array) || array.length === 0 || angular.isObject(array[0])) {
                return array;
            }

            var newArray = [];
            array.forEach(function (item) {
                var obj = {};
                obj[key] = item;
                newArray.push(obj);
            });
            return newArray;
        };

        self.findInObjectArray = function (array, obj, key, comparer) {
            var item = null;
            comparer = comparer || self.defaultComparer;

            array.some(function (element) {
                if (comparer(element[key], obj[key])) {
                    item = element;
                    return true;
                }
            });

            return item;
        };

        self.defaultComparer = function (a, b) {
            // I'm aware of the internationalization issues regarding toLowerCase()
            // but I couldn't come up with a better solution right now
            return self.safeToString(a).toLowerCase() === self.safeToString(b).toLowerCase();
        };

        self.safeHighlight = function (str, value) {
            if (!value) {
                return str;
            }

            function escapeRegexChars(str) {
                return str.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
            }

            str = self.encodeHTML(str);
            value = self.encodeHTML(value);

            var expression = new RegExp('&[^;]+;|' + escapeRegexChars(value), 'gi');
            return str.replace(expression, function (match) {
                return match.toLowerCase() === value.toLowerCase() ? '<em>' + match + '</em>' : match;
            });
        };

        self.safeToString = function (value) {
            return angular.isUndefined(value) || value == null ? '' : value.toString().trim();
        };

        self.encodeHTML = function (value) {
            return self.safeToString(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        self.handleUndefinedResult = function (fn, valueIfUndefined) {
            return function () {
                var result = fn.apply(null, arguments);
                return angular.isUndefined(result) ? valueIfUndefined : result;
            };
        };

        self.replaceSpacesWithDashes = function (str) {
            return self.safeToString(str).replace(/\s/g, '-');
        };

        self.isModifierOn = function (event) {
            return event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
        };

        self.promisifyValue = function (value) {
            value = angular.isUndefined(value) ? true : value;
            return $q[value ? 'when' : 'reject']();
        };

        self.simplePubSub = function () {
            var events = {};
            return {
                on: function on(names, handler, first) {
                    names.split(' ').forEach(function (name) {
                        if (!events[name]) {
                            events[name] = [];
                        }
                        var method = first ? [].unshift : [].push;
                        method.call(events[name], handler);
                    });
                    return this;
                },
                trigger: function trigger(name, args) {
                    var handlers = events[name] || [];
                    handlers.every(function (handler) {
                        return self.handleUndefinedResult(handler, true)(args);
                    });
                    return this;
                }
            };
        };

        return self;
    }]);

    /* HTML templates */
    tagsInput.run(["$templateCache", function ($templateCache) {
        $templateCache.put('ngTagsInput/tags-input.html', "<div class=\"host\" tabindex=\"-1\" ng-click=\"eventHandlers.host.click()\" ti-transclude-append><div class=\"tags\" ng-class=\"{focused: hasFocus}\"><ul class=\"tag-list\"><li class=\"tag-item\" ng-repeat=\"tag in tagList.items track by track(tag)\" ng-class=\"getTagClass(tag, $index)\" ng-click=\"eventHandlers.tag.click(tag)\"><ti-tag-item scope=\"templateScope\" data=\"::tag\"></ti-tag-item></li></ul><input class=\"input\" autocomplete=\"off\" ng-model=\"newTag.text\" ng-model-options=\"{getterSetter: true}\" ng-keydown=\"eventHandlers.input.keydown($event)\" ng-focus=\"eventHandlers.input.focus($event)\" ng-blur=\"eventHandlers.input.blur($event)\" ng-paste=\"eventHandlers.input.paste($event)\" ng-trim=\"false\" ng-class=\"{'invalid-tag': newTag.invalid}\" ng-disabled=\"disabled\" ti-bind-attrs=\"{type: options.type, placeholder: options.placeholder, tabindex: options.tabindex, spellcheck: options.spellcheck}\" ti-autosize></div></div>");

        $templateCache.put('ngTagsInput/tag-item.html', "<span ng-bind=\"$getDisplayText()\"></span> <a class=\"remove-button\" ng-click=\"$removeTag()\" ng-bind=\"::$$removeTagSymbol\"></a>");

        $templateCache.put('ngTagsInput/auto-complete.html', "<div class=\"autocomplete\" ng-if=\"suggestionList.visible\"><ul class=\"suggestion-list\"><li class=\"suggestion-item\" ng-repeat=\"item in suggestionList.items track by track(item)\" ng-class=\"getSuggestionClass(item, $index)\" ng-click=\"addSuggestionByIndex($index)\" ng-mouseenter=\"suggestionList.select($index)\"><ti-autocomplete-match scope=\"templateScope\" data=\"::item\"></ti-autocomplete-match></li></ul></div>");

        $templateCache.put('ngTagsInput/auto-complete-match.html', "<span ng-bind-html=\"$highlight($getDisplayText())\"></span>");
    }]);
})();
'use strict';

angular.module('bottBlog').directive('adminNav', function () {
  return {
    restrict: 'EA',
    templateUrl: '/js/features/adminNav/adminNav.html'
  };
});
'use strict';

angular.module('bottBlog').directive('passConfirm', function () {
  return {
    require: 'ngModel',
    scope: {
      otherModelValue: "=passConfirm"
    },
    link: function link(scope, element, attr, ngModel) {

      ngModel.$validators.compareTo = function (modelValue) {
        return modelValue == scope.otherModelValue;
      };
      scope.$watch('otherModelValue', function () {
        ngModel.$validate();
      });
    }
  };
});
'use strict';

angular.module('td.easySocialShare', []).directive('shareLinks', ['$location', function ($location) {
  return {
    link: function link(scope, elem, attrs) {
      var i,
          sites = ['twitter', 'facebook', 'linkedin', 'google-plus'],
          theLink,
          links = attrs.shareLinks.toLowerCase().split(','),
          pageLink = encodeURIComponent($location.absUrl()),
          pageTitle = attrs.shareTitle,
          pageTitleUri = encodeURIComponent(pageTitle),
          shareLinks = [],
          square = '';

      elem.addClass('td-easy-social-share');

      // check if square icon specified
      square = attrs.shareSquare && attrs.shareSquare.toString() === 'true' ? '-square' : '';

      // assign share link for each network
      angular.forEach(links, function (key) {
        key = key.trim();

        switch (key) {
          case 'twitter':
            theLink = 'https://twitter.com/intent/tweet?text=' + pageTitleUri + '%20' + pageLink;
            break;
          case 'facebook':
            theLink = 'https://facebook.com/sharer.php?u=' + pageLink;
            break;
          case 'linkedin':
            theLink = 'https://www.linkedin.com/shareArticle?mini=true&url=' + pageLink + '&title=' + pageTitleUri;
            break;
          case 'google-plus':
            theLink = 'https://plus.google.com/share?url=' + pageLink;
            break;
        }

        if (sites.indexOf(key) > -1) {
          shareLinks.push({ network: key, url: theLink });
        }
      });

      for (i = 0; i < shareLinks.length; i++) {
        var anchor = '';
        anchor += '<a href="' + shareLinks[i].url + '"';
        anchor += ' class="fa fa-' + shareLinks[i].network + square + '" target="_blank"';
        anchor += '></a>';
        elem.append(anchor);
      }
    }
  };
}]);
'use strict';

angular.module('bottBlog').directive('fileUpload', function () {
  return {
    restrict: 'E',
    templateUrl: '/js/features/fileUpload/fileUpload.html',
    link: function link(scope, element, attrs) {
      $('#file').on('change', function () {
        console.log(document.getElementById('file').files[0].name);
        scope.fileName = document.getElementById('file').files[0].name;
        scope.$apply();
      });
    }
  };
});
'use strict';

angular.module('bottBlog').directive('post', function () {
  return {
    restrict: 'EA',
    templateUrl: './js/features/post/post.html',
    scope: {
      postData: '=',
      showFile: '=',
      postId: '='
    },
    controller: function controller($state, $scope, $firebaseArray, $sce, Auth, $window) {
      var storage = firebase.storage();
      var storageRef = storage.ref();
      var ref;
      var commentRef;

      $scope.$watch('postData', function () {
        if ($scope.postData) {
          if (!ref && $scope.showFile) {
            ref = firebase.database().ref('/posts/' + $scope.postId + '/comments');

            commentRef = $firebaseArray(ref);
            $scope.comments = commentRef;
          }

          if ($scope.postData.file && $scope.showFile) {
            var pathReference = storageRef.child($scope.postData.file);
            pathReference.getDownloadURL().then(function (url) {
              $scope.fileUrl = $sce.trustAsResourceUrl(url);
              $scope.$apply();
            }).catch(function (err) {
              console.log(err);
            });
          }
        }
      });

      $scope.comment = function () {
        Auth.$requireSignIn().then(function (el) {
          console.log('email', el.email);
          $scope.user = el;
          $scope.commenting = true;
        }).catch(function (error) {
          if (error == 'AUTH_REQUIRED') {
            $state.go("login");
          }
        });
      };

      $scope.submitComment = function () {
        var commentDate = new Date();
        var user = {
          displayName: $scope.user.displayName,
          photoURL: $scope.user.photoURL,
          uid: $scope.user.uid,
          email: $scope.user.email
        };
        var comment = {
          user: user,
          text: $scope.newComment,
          comment_date: commentDate.getTime()
        };
        console.log(comment);
        commentRef.$add(comment).then(function (ref) {
          console.log('I think it worked!');
        }, function (err) {
          console.log('I think it failed', err);
        });
        $scope.newComment = '';
        $scope.commenting = false;
      };
    },
    link: function link(scope, element, attr) {
      if (attr.showFile == 'false') {
        var p = element[0].children[0].children[1].children[0];
        $clamp(p, {
          clamp: 7,
          originalText: scope.postData.text,
          truncationChar: ''
        });
      }
    }

  };
});
'use strict';

angular.module('bottBlog').directive('searchBar', function ($firebaseArray) {
  return {
    scope: {},
    template: '<input ng-blur="blurred()" ng-model="val" ng-change="update(val)" />' + '<ul class="suggestions">' + '<li ng-repeat="suggestion in suggestions track by $index | limitTo: 5">' + '<a ui-sref="post({id: suggestion.$id})"' + ' target="_blank">{{ suggestion.title }}</a>' + '</li>' + '</ul>',
    link: function link(scope, element) {
      var ref = firebase.database().ref('posts/');
      var posts = $firebaseArray(ref);

      scope.update = function (term) {
        if (term.length < 1) {
          return scope.suggestions = [];
        }
        var byTitle = posts.filter(function (el) {
          return el.title.toLowerCase().indexOf(term.toLowerCase()) > -1;
        });
        var byTag = posts.filter(function (el) {
          if (el.tags) {
            return el.tags.filter(function (tag) {
              return tag.text.indexOf(term) > -1;
            }).length > 0;
          }
        });
        scope.suggestions = _.union(byTitle, byTag);
      };

      scope.blurred = function () {
        scope.suggestions = [];
      };
    }

  };
});
'use strict';

angular.module('bottBlog').directive('sidebar', function ($firebaseArray) {
  return {
    restrict: 'E',
    templateUrl: './js/features/sidebar/sidebar.html',
    controller: function controller($scope) {
      var ref = firebase.database().ref('posts/');
      var posts = $firebaseArray(ref);
      var tags = [];

      posts.$loaded().then(function (postsArray) {
        // handle tags
        postsArray.map(function (e) {
          tags = _.union(tags, e.tags);
        });
        tags = _.union(tags.map(function (e) {
          return e.text;
        }));
        $scope.tags = tags;

        // handle searchByTag
        $scope.searchByTag = function (tag) {
          var filteredPosts = posts.filter(function (el) {
            if (!el.tags) return false;

            for (var i = 0; i < el.tags.length; i++) {
              if (el.tags[i].text == tag) {
                return true;
              }
            }
            return false;
          });
          $scope.posts = filteredPosts;
        };
      });
    }

  };
});
'use strict';

angular.module('bottBlog').controller('aboutCtrl', function ($scope) {});
'use strict';

angular.module('bottBlog').controller('editCtrl', function ($scope, $firebaseObject, $stateParams, $sce, $state) {

  var storage = firebase.storage();
  var storageRef = storage.ref();

  firebase.database().ref('/posts/' + $stateParams.id).once('value').then(function (snap) {

    $scope.post = snap.val();

    if ($scope.post.file) {
      var pathReference = storageRef.child($scope.post.file);
      pathReference.getDownloadURL().then(function (url) {
        $scope.fileUrl = $sce.trustAsResourceUrl(url);
        $scope.$apply();
      }).catch(function (err) {
        console.log('error getting file', err);
      });
    }
    $scope.$apply();
  });

  $scope.deleteFile = function () {
    $scope.deleteFile = true;
    $scope.fileUrl = null;
  };

  $scope.editPost = function () {
    var ref = firebase.database().ref('/posts/' + $stateParams.id);
    var postToEdit = $firebaseObject(ref);

    if (!$scope.post) return;
    var theFile = document.getElementById('file').files[0];
    var postRef = storageRef.child($scope.post.title + $scope.post.post_date);

    if ($scope.deleteFile) {
      var pathReference = storageRef.child($scope.post.title + $scope.post.post_date);
      pathReference.delete();
      $scope.post.file = null;
    }
    //Final step
    if (theFile) {

      postRef.put(theFile).then(function (snap) {
        $scope.post.file = snap.a.fullPath;
        for (var prop in $scope.post) {
          postToEdit[prop] = $scope.post[prop];
        }
        postToEdit.$save().then(function (ref) {
          $state.go('manage');
        }, function (error) {
          alert('There was an error with the update.', error);
        });
      });
    } else {

      for (var prop in $scope.post) {
        postToEdit[prop] = $scope.post[prop];
      }
      postToEdit.$save().then(function (ref) {
        $state.go('manage');
      }, function (error) {
        alert('There was an error with the update.', error);
      });
    }
  };
});
'use strict';

angular.module('bottBlog').controller('homeCtrl', function ($scope, $firebaseArray) {
  var ref = firebase.database().ref('posts/');
  $scope.posts = $firebaseArray(ref.orderByChild('post_date').limitToLast(6));
});
'use strict';

angular.module('bottBlog').controller('loginCtrl', function ($scope, $stateParams, $firebaseAuth, $state) {
  var auth = $firebaseAuth();

  if ($stateParams.error == 'error') {
    $scope.isError = true;
  } else if ($stateParams == 'register') {
    $scope.register = true;
  }

  $scope.getRegister = function () {
    $scope.register = !$scope.register;
  };

  $scope.createUser = function (email, password) {

    auth.$createUserWithEmailAndPassword(email, password).then(function (firebaseUser) {
      console.log('signed in as', firebaseUser);
      $state.go('home');
    }).catch(function (error) {
      alert(error);
    });
  };

  $scope.loginEmail = function (email, password) {
    $scope.firebaseUser = null;
    $scope.error = null;

    auth.$signInWithEmailAndPassword(email, password).then(function (firebaseUser) {
      console.log('signed in as', firebaseUser);
      $state.go('home');
    }).catch(function (error) {
      console.log('error', error);
      alert(error);
    });
  };

  $scope.loginGoogle = function () {
    $scope.firebaseUser = null;
    $scope.error = null;

    auth.$signInWithPopup("google").then(function (firebaseUser) {
      console.log('signed in as', firebaseUser);
      $state.go('home');
    }).catch(function (error) {
      console.log('error', error);
      alert(error);
    });
  };
});
'use strict';

angular.module('bottBlog').controller('manageCtrl', function ($scope, $firebaseArray, $firebaseObject, $window) {

  var ref = firebase.database().ref('posts/');
  $scope.posts = $firebaseArray(ref.orderByChild('post_date'));

  $scope.deletePost = function (id) {
    $scope.currentPost = id;
    $scope.modalOpen = true;
  };

  $scope.delete = function () {
    var post = $firebaseObject(ref.child($scope.currentPost));
    post.$remove().then(function () {
      $window.location.reload();
    });
  };

  $scope.cancel = function () {
    delete $scope.currentPost;
    $scope.modalOpen = false;
  };
});
'use strict';

angular.module('bottBlog').controller('newPostCtrl', function ($scope, $state, currentAuth, $firebaseArray, $window) {
  var ref = firebase.database().ref('posts/');
  var storageRef = firebase.storage().ref();

  var data = $firebaseArray(ref);

  $scope.addPost = function (post) {
    if (!post) return;
    post.post_date = new Date();
    post.post_date = post.post_date.getTime();
    var postRef = storageRef.child(post.title + post.post_date);
    var theFile = document.getElementById('file').files[0];
    if (theFile) {
      postRef.put(theFile).then(function (snap) {
        post.file = snap.a.fullPath;
        data.$add(post);
        $scope.post = {};
        $state.go('manage');
      });
    } else {
      console.log(post);
      data.$add(post);
      $scope.post = {};
    }
  };
});
'use strict';

angular.module('bottBlog').controller('postCtrl', function ($scope, $firebaseArray, $stateParams) {
  firebase.database().ref('/posts/' + $stateParams.id).once('value').then(function (snap) {
    $scope.post = snap.val();
    $scope.postId = $stateParams.id;
    console.log($scope.post);
    $scope.$apply();
  });
});
'use strict';

angular.module('bottBlog').factory("Auth", ['$firebaseAuth', function ($firebaseAuth) {
  // var ref = firebase.database().ref()
  return $firebaseAuth();
}]);
'use strict';

angular.module('bottBlog').controller('mainCtrl', function ($scope) {});
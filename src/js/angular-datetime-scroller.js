/**
 * angular-datetime-scroller.js
 */
(function() {
'use strict';

var BOUNCE_UP = 'mm-datetime-bounce-up';
var BOUNCE_DOWN = 'mm-datetime-bounce-down';
var BOUNCES = [BOUNCE_UP, BOUNCE_DOWN].join(' ');

angular
  .module('mm-datetime-scroller', [])
  .directive('mmDatetime', mmDatetime)
  .directive('mmDatetimeFormat', mmDatetimeFormat)
  .service('mmDatetimeService', mmDatetimeService);

mmDatetime.$inject = ['$timeout', '$compile'];
function mmDatetime($timeout, $compile) {
  var defaultOpt = {
    formats: ['ll','','HH',':','mm'],
    minTime: -8640000000000000,
    maxTime: 8640000000000000,
    applyInterval: undefined,
    showButton: undefined,
    tooltip: false,
    readonly: false,
    isUTC: false,
    lang: 'en'
  };
  return {
    restrict: 'A',
    scope: {
      time: '=mmDatetime',
      opt: '=option'
    },
    controller: ['$scope', controller],
    link: link
  };

  function controller($scope) {

    angular.extend(this, {
      getTime: getTime,
      setTime: setTime,
      isInternalChange: isInternalChange,
      getOpt: getOpt,
      watch: watch,
      adjustTime: adjustTime,
      isValidTime: isValidTime,
      setTooltip: setTooltip
    });

    return;

    function getTime() {
      return $scope._time;
    }

    function setTime (time, scope) {
      var applyInterval = parseInt(getOpt('applyInterval'), 10);

      time = adjustTime(time);

      $timeout(function() {
        $scope._time = $scope._timeSet = time;

        if(!$scope._applyTimer) {
          _assignTime($scope._time);
          if(applyInterval > 0) {
            $scope._applyTimer = $timeout(function() {
              $scope._applyTimer = null;
              if($scope._timeAssigned !== $scope._time) {
                _assignTime($scope._time);
              }
            }, applyInterval);
          }
        }
      });
    }

    function isInternalChange() {
       return $scope._timeSet === +$scope.time;
    }

    function _assignTime(time) {
      if($scope.time instanceof Date) {
        $scope.time.setTime(time);
      }
      else {
        $scope.time = time;
      }
      $scope._timeAssigned = time;
    }

    function getOpt(name) {
      return ($scope._opt || {})[name];
    }

    function watch(name, fn) {
      $scope.$watch(name, fn, true);
    }

    function adjustTime(t) {
      var opt = $scope._opt;
      return t < +opt.minTime ? +opt.minTime :
             t > +opt.maxTime ? +opt.maxTime : +t;
    }

    function isValidTime(t, interval) {
      var opt = $scope._opt,
          min = moment(+opt.minTime).startOf(interval),
          max = moment(+opt.maxTime).endOf(interval);
      min = min.isValid() ? min : moment(+opt.minTime);
      max = max.isValid() ? max : moment(+opt.maxTime);
      return t >= +min && t <= +max;
    }

    function setTooltip(o) {
      $timeout(function() {
        $scope.tooltip = o;
      });
    }
  }

  function link(scope, elem, attr, ctrl) {

    scope.$watch('opt', function() {
      scope._opt = angular.extend({}, defaultOpt, scope.opt);
    }, true);

    scope.$watch('[time, opt.minTime, opt.maxTime]', function() {
      scope._time = ctrl.adjustTime(scope.time || Date.now());
    }, true);

    scope.$watch('opt.formats', function() {
      var formats = [].concat(scope._opt.formats);

      if(scope._formats && scope._formats.toString() === formats.toString()) {
        return;
      }
      scope._formats = formats;

      elem.empty();
      formats.forEach(function(v) {
        var child = $('<div></div>').appendTo(elem);

        v = v.replace(/(^\s+|\s+$)/g, '');
        if(!v || !v.length) {
          child.html('&nbsp;');
        } else {
          if(moment(0).format(v) === v) {
            child.text(v);
          } else {
            child.attr('mm-datetime-format', '\''+v+'\'');
            $compile(child)(scope);
          }
        }
      });
    });

    scope.$watch('opt.tooltip', function() {
      if(scope._opt.tooltip === true) {
        scope.tooltip = {};
        var bindFn = $compile(
          '<div class="mm-datetime-tooltip" ng-show="tooltip.show" ng-style="tooltip.style">'+
          '{{tooltip.str}}</div>');
        scope.tooltipElem = bindFn(scope).appendTo('body');
      } else {
        if(scope.tooltipElem) {
          scope.tooltipElem.remove();
          scope.tooltipElem = null;
        }
      }
    });

    elem.on('$destroy', function() {
      if(scope.tooltipElem) {
        scope.tooltipElem.remove();
      }
    });
  }
}

mmDatetimeFormat.$inject = ['$timeout', '$interval', 'mmDatetimeService'];
function mmDatetimeFormat($timeout, $interval, mmDatetimeService) {
  var HIDDEN_LABELS = 5;
  var INTERVAL_FORMATS = [ 'y', 'M', 'd', 'h', 'm', 's', 'ms' ];

  return {
    restrict: 'A',
    require: '^mmDatetime',
    scope: {
      format: '=mmDatetimeFormat',
    },
    template: '<div class="mm-datetime-frame" tabindex="0">'+
              '<div class="mm-datetime-inner">'+
              '<div class="mm-datetime-label" style="color:transparent;position:relative">'+
                '{{str}}</div>' +
              '<div class="mm-datetime-label" ng-repeat="l in labels track by $index"' +
                ' ng-style="l.style">{{l.str}}</div>' +
              '</div>' +
              '</div>' +
              '<button class="up" ng-class="getBtnClass(1)"' +
                ' ng-hide="_timeAtDragStart" data-delta="1">+</button>'+
              '<button class="down" ng-class="getBtnClass(-1)"' +
                ' ng-hide="_timeAtDragStart" data-delta="-1">-</button>',
    link: link
  };

  function link(scope, elem, attr, ctrl) {

    angular.extend(scope, {
      labels: [],
      inner: elem.find('.mm-datetime-inner'),
      _moveBy: _moveBy,
      _startMoveByTimer: _startMoveByTimer,
      _stopMoveByTimer: _stopMoveByTimer,
      _checkLabelSize: _checkLabelSize,
      getBtnClass: getBtnClass
    });

    if(!ctrl.getOpt('readonly')) {
      mmDatetimeService
        .detectMouse(scope, elem, attr, ctrl)
        .setupTouchScroll(scope, elem, attr, ctrl)
        .setupButtons(scope, elem, attr, ctrl)
        .setupMouseWheel(scope, elem, attr, ctrl)
        .setupKeyPress(scope, elem, attr, ctrl);
    }

    ctrl.watch('_time', _onChangeTime, true);
    ctrl.watch('opt', _setLabels, true);

    scope.$watch('format', _onChangeFormat);

    function _startMoveByTimer(dir) {
      scope._stopMoveByTimer();
      scope._pressTimer = $interval(function() {
        scope._moveBy(dir);
      }, 200);
    }

    function _stopMoveByTimer() {
      if(scope._pressTimer) {
        $interval.cancel(scope._pressTimer);
      }
      scope._pressTimer = null;
    }

    function _moveBy(delta, t) {
      var mo = moment(t || ctrl.getTime());
      mo.add(scope._interval, delta);

      if(ctrl.isValidTime(+mo, scope._interval)) {
        ctrl.setTime(+mo);
      } else {
        elem.removeClass(BOUNCES)
            .addClass(delta > 0 ? BOUNCE_UP : BOUNCE_DOWN);
      }
    }

    function getBtnClass(delta) {
      var lab = scope.labels[HIDDEN_LABELS + delta];
      return (lab && lab.valid) ? '' : 'disabled';
    }

    function _onChangeFormat() {
      var time = ctrl.getTime() || Date.now(),
          lang = ctrl.getOpt('lang'),
          isUTC = ctrl.getOpt('isUTC'),
          format = scope.format;

      INTERVAL_FORMATS.some(function(v) {
        var  mo1, mo2;
        mo1 = _momentWith(time, lang, isUTC);
        mo2 = mo1.clone();
        mo1.startOf(v);
        mo2.endOf(v);
        if(mo1.format(format) !== mo2.format(format)) {
          return false;
        }
        scope._interval = v;
        return true;
      });

      $timeout(function() {
        scope._checkLabelSize();
        _setLabels();
      });
    }

    function _checkLabelSize() {
      var lab = elem.find('.mm-datetime-label');
      scope._labelHeight = lab.height();
      scope._labelWidth = lab.width();
    }

    function _onChangeTime() {
      var time = ctrl.getTime(),
          lang = ctrl.getOpt('lang'),
          isUTC = ctrl.getOpt('isUTC'),
          mo = _momentWith(time, lang, isUTC),
          str = mo.format(scope.format),
          labs = scope.labels,
          tx = 0, pos;

      elem.removeClass(BOUNCES);
      _checkLabelSize();

      if(ctrl.isInternalChange() && scope.time && scope.str !== str) {
        if(time >= labs[0].time && time <= labs[labs.length - 1].time) {
          for(pos = 0; pos < HIDDEN_LABELS * 2; pos++) {
            if(labs[pos].time > time) {
              break;
            }
          }

          scope.inner.css({
            transition: 'all 150ms ease',
            transform: 'translateY('+
                       (HIDDEN_LABELS - pos + 1) + 'em)',
          });
          tx = 150;
        }
      }
      scope.str = str;

      if(scope._setLabelsTimer) {
        $timeout.cancel(scope._setLabelsTimer);
      }
      scope._setLabelsTimer = $timeout(_setLabels, tx);
    }

    function _setLabels() {
      var lang = ctrl.getOpt('lang'),
          isUTC = ctrl.getOpt('isUTC'),
          labels = scope.labels,
          mo, timeCurrent, time, i, str, diff, valid;

      scope._setLabelsTimer = null;
      _checkLabelSize();

      timeCurrent = ctrl.getTime();
      mo = _momentWith(timeCurrent, lang, isUTC);
      mo.startOf(scope._interval);
      diff = timeCurrent - +mo;
      timeCurrent = +mo;
      scope.time = timeCurrent;

      for(i = - HIDDEN_LABELS; i < HIDDEN_LABELS; i++) {
        mo = _momentWith(timeCurrent, lang, isUTC);
        mo.add(scope._interval, i);
        str = mo.format(scope.format);
        time = +mo;
        valid = ctrl.isValidTime(time, scope._interval);

        labels[i + HIDDEN_LABELS] = angular.extend(
          labels[i + HIDDEN_LABELS] || {},
          {
            str: str, time: time,
            valid: valid,
            style: {
              opacity: valid ? 1 : 0.2,
              //top: (scope._labelHeight * i) + 'px'
              top: i + 'em',
            }
          }
        );
      }
      scope.inner.css({
        transition: 'none',
        transform: 'translateY(0)'
      });
    }

    function _momentWith(time, lang, isUTC) {
      var mo = moment(time);
      mo.lang(lang);
      if(isUTC) { mo.utc(); }

      return mo;
    }

 }
}

mmDatetimeService.$inject = ['$timeout', '$interval', '$window'];
function mmDatetimeService($timeout, $interval, $window) {

  return angular.extend(this, {
    detectMouse: detectMouse,
    setupTouchScroll: setupTouchScroll,
    setupButtons: setupButtons,
    setupMouseWheel: setupMouseWheel,
    setupKeyPress: setupKeyPress
  });

  function detectMouse(scope, elem, attr, ctrl) {
    var showButtons = ctrl.getOpt('showButtons');

    if(showButtons === true) {
      elem.addClass('hover');
    } else if(showButtons === false) {
      _setOnHover();
    } else {
      $($window).on('touchstart mousemove', _onDetect);
    }

    function _onDetect(ev) {
      $($window).off('touchstart mousemove', _onDetect);
      if(ev.type === 'touchstart') {
        return;
      }
      _setOnHover();
    }

    function _setOnHover() {
      elem.removeClass('hover');
      elem.on('mouseenter', function(ev) {
        elem.addClass('hover');
      });
      elem.on('mouseleave touchend', function() {
        elem.removeClass('hover');
      });
    }
    return this;
  }

  function setupTouchScroll(scope, elem, attr, ctrl) {
    var mc = new Hammer.Manager(elem[0], {
      recognizers: [[Hammer.Pan], [Hammer.Tap]]
    });

    mc.on('panstart', function(ev) {
      scope._checkLabelSize();
      elem.addClass('pan');
      scope._stopMoveByTimer();
      scope._timeAtDragStart = ctrl.getTime();
      scope.$digest();
    })
    .on('panend', function() {
      elem.removeClass('pan');
      scope._timeAtDragStart = null;
      scope.$digest();
      ctrl.setTooltip({});
    })
    .on('panup pandown', function(ev) {
      if(!scope._timeAtDragStart) {
        return;
      }
      var mo = moment(scope._timeAtDragStart),
          delta = (-ev.deltaY / scope._labelHeight);

      delta = delta > 0.5 ? ((delta + 0.5) | 0) :
               delta < -0.5 ? ((delta - 0.5) | 0) : 0;
      scope._moveBy(delta, scope._timeAtDragStart);

      var off = elem.offset();
      ctrl.setTooltip({
        style : {
          top: off.top,
          left: off.left - scope._labelWidth,
          fontSize: elem.css('font-size'),
        },
        str: scope.str,
        show: true
      });
    })
    .on('tap', function() {
      // for keydown (Firefox)
      elem.find('.mm-datetime-frame').focus();
    });

    elem.on('touchstart mousedown', _preventDafault);

    function _preventDafault(ev) {
      ev.preventDefault();
    }

    elem.on('$destroy', function() {
      scope._mc.destroy();
      $(scope._mc.element).off(_preventDafault);
      scope._mc = null;
    });

    scope._mc = mc;
    return this;
  }

  function setupButtons(scope, elem, attr, ctrl) {
    var mcBtns = [];

    elem.find('button').each(function(index) {
      mcBtns[index] = new Hammer.Manager(this, {
        recognizers: [[Hammer.Tap],[Hammer.Press]]
      })
      .on('tap', function(ev) {
        scope._stopMoveByTimer();
        scope._moveBy($(ev.target).data('delta'));
      })
      .on('press', function(ev) {
        scope._startMoveByTimer($(ev.target).data('delta'));
      })
      .on('pressup', function() {
        scope._stopMoveByTimer();
      });
    });

    elem.on('$destroy', function() {
      scope._mcBtns.forEach(function(v) {
        v.destroy();
      });
      scope._mcBtns = null;
    });

    scope._mcBtns = mcBtns;

    return this;

    function _startMoveByTimer(dir) {
      scope._stopMoveByTimer(dir);
      scope._pressTimer = $interval(function() {
        scope._moveBy(dir);
      }, 200);
    }
  }

  function setupMouseWheel(scope, elem, attr, ctrl) {
    var hs = Hamster(elem[0]);

    function _onWheel(ev, delta, deltaX, deltaY) {
      var now = Date.now();
      ev.preventDefault();
      ev.stopPropagation();
      if(scope._lastWheel + 100 > now) {
        return;
      }
      scope._lastWheel = now;
      scope._stopMoveByTimer();
      scope._moveBy(-deltaY / Math.abs(deltaY));

      elem.addClass('wheel');

      if(scope._wheelTimer) {
        $timeout.cancel(scope._wheelTimer);
      }
      scope._wheelTimer = $timeout(function() {
        scope._wheelTimer = null;
        elem.removeClass('wheel');
      }, 400);
    }

    hs.wheel(_onWheel);

    elem.on('$destroy', function() {
      scope._hs.unwheel(_onWheel);
      scope._hs = null;
    });

    scope._hs = hs;
    return this;
  }

  function setupKeyPress(scope, elem, attr, ctrl) {

    function _onKeydown(ev) {
      var now = Date.now(),
          keyCode = ev.keyCode, fnName;

      ev.preventDefault();
      ev.stopImmediatePropagation();

      if(scope._lastKeydown + 200 > now) {
        return;
      }
      scope._lastKeydown = now;

      if(keyCode === 38 || keyCode === 40) {
        scope._moveBy(keyCode - 39);

        elem.addClass('wheel');
        if(scope._keyWheelTimer) {
          $timeout.cancel(scope._keyWheelTimer);
        }
        scope._keyWheelTimer = $timeout(function() {
          scope._keyWheelTimer = null;
          elem.removeClass('wheel');
        }, 500);
      }
      else if(keyCode === 37 || keyCode === 39) {
        fnName = (keyCode === 37 ? 'prevAll' : 'nextAll');
        elem[fnName]('[mm-datetime-format]:first')
            .children('[tabindex]').focus();
      }
    }

    elem.on('keydown', _onKeydown);

    elem.on('$destroy', function() {
      elem.off('keydown', _onKeydown);
    });
    return this;
  }

}

})();

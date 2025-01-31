Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.Logo = void 0;

const _core = require('@emotion/core');

const _SVGIcon = require('../Icon/SVGIcon');

const _motions = require('../Identity/motions');

const _colors = require('./colors');

function _extends() {
  _extends =
    Object.assign ||
    function(target) {
      for (let i = 1; i < arguments.length; i++) {
        const source = arguments[i];
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
  return _extends.apply(this, arguments);
}

function ownKeys(object, enumerableOnly) {
  const keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    let symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) {
      symbols = symbols.filter(sym => {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (let i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(source, true).forEach(key => {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(source).forEach(key => {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {value: value, enumerable: true, configurable: true, writable: true});
  } else {
    obj[key] = value;
  }
  return obj;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) {
    return {};
  }
  const target = _objectWithoutPropertiesLoose(source, excluded);
  let i;
  let key;
  if (Object.getOwnPropertySymbols) {
    const sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) {
        continue;
      }
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) {
        continue;
      }
      target[key] = source[key];
    }
  }
  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) {
    return {};
  }
  const target = {};
  const sourceKeys = Object.keys(source);
  let i;
  let key;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) {
      continue;
    }
    target[key] = source[key];
  }
  return target;
}

const logoStyle = function logoStyle(theme, _ref) {
  const hover = _ref.hover;
  const _ref$color = _ref.color;
  const color = _ref$color === void 0 ? theme.general.color : _ref$color;
  return {
    '&:hover path': {
      fill: hover ? _colors.COLOR.shade(color, 0.06) : undefined,
    },
    path: {
      fill: color,
      transition: _motions.defaultTransition,
    },
  };
};

const Logo = function Logo(_ref2) {
  const hover = _ref2.hover;
  const props = _objectWithoutProperties(_ref2, ['hover']);

  return (0, _core.jsx)(
    _SVGIcon.SVGIcon,
    _extends(
      {
        realWidth: 500,
        realHeight: 500,
        css: function css(theme) {
          return logoStyle(
            theme,
            _objectSpread(
              {
                hover: hover,
              },
              props,
            ),
          );
        },
      },
      props,
    ),
    (0, _core.jsx)('path', {
      d:
        'M155.309 2.019C125.28 8.802 92.887 26.136 72.598 46.278l-9.902 9.831-3.847-3.757c-2.203-2.151-5.78-7.729-8.37-13.054-4.724-9.71-7.949-12.066-10.331-7.548-5.327 10.102-6.44 43.337-1.889 56.41l2.666 7.659-2.913 9.341C30.315 129.843 25.741 162.899 25.58 195l-.117 23.5-6.243 12.257C.702 267.116-2.055 302.963 11.242 334.5c1.623 3.85 4.703 11.909 6.844 17.91 9.372 26.264 25.771 33.883 49.964 23.213 1.129-.498 2.032.343 3.321 3.097 26.213 55.962 60.92 92.41 94.513 99.256 40.685 8.291 70.135.055 125.991-35.237 36.68-23.175 43.041-23.959 75.078-9.242 13.44 6.173 23.953 8.106 30.399 5.589l2.852-1.114-.392-8.236c-.846-17.793-19.775-45.76-41.179-60.841-15.625-11.01-41.864-16.417-57.668-11.885l-3.045.873 3.199-5.691c4.378-7.792 4.582-8.008 10.318-10.908 6.863-3.471 15.116-9.153 22.957-15.805 17.716-15.03 22.258-48.877 10.748-80.094l-2.989-8.106 3.341-16.889c9.567-48.374 8.368-91.173-3.496-124.747-3.082-8.722-3.105-8.919-1.469-13 4.699-11.72 8.235-43.206 5.603-49.893-1.89-4.802-6.523-3.855-12.062 2.466-2.513 2.869-7.327 8.124-10.697 11.678l-6.127 6.461-7.873-7.442c-26.13-24.699-51.456-37.54-87.538-44.385-12.306-2.334-55.428-2.016-66.526.491m54.186 11.006c37.097 3.073 71.439 19.814 92.674 45.176l3.97 4.743-3.237 4.028c-11.997 14.928 4.225 38.092 22.461 32.073 4.731-1.561 5.221-1.132 7.632 6.675 9.535 30.87 8.619 78.957-2.211 116.142-4.177 14.339-4.047 17.692 1.099 28.341 11.682 24.177 8.435 52.348-7.946 68.946-11.707 11.862-40.25 22.521-69.276 25.871-11.692 1.349-11.176 1.698-10.83-7.326.17-4.419-.319-9.123-1.266-12.194-.849-2.75-1.548-5.279-1.554-5.62-.006-.342 5.501-3.343 12.239-6.671 16.536-8.166 29.588-19.648 31.326-27.558 1.285-5.847-1.192-5.27-8.93 2.081-14.605 13.873-38.82 22.981-52.703 19.823-20.72-4.712-35.27 5.401-36.715 25.52-1.996 27.813 27.687 42.192 48.567 23.527l3.705-3.312 14-.615c7.7-.338 17.988-1.327 22.863-2.198 10.261-1.834 10.592-1.702 8.212 3.286-2.297 4.816-4.555 15.598-3.839 18.337.659 2.519 1.719 2.429 19.264-1.625 32.271-7.458 63.196 9.37 81.823 44.525 7.647 14.432 7.777 14.375-11.784 5.125-33.264-15.731-44.955-13.489-98.039 18.798-42.657 25.945-66.823 32.871-96.342 27.61-28.286-5.042-58.942-35.545-85.512-85.086-9.852-18.369-9.889-18.499-7.646-27.108 4.807-18.455-1.041-32.63-16.872-40.899-4.908-2.564-5.814-3.515-7.093-7.44-28.2-86.543-22.607-191.743 12.515-235.402 33.661-41.843 83.07-62.243 139.445-57.573m126.536 46.177c-2.174 14.864-7.982 28.754-13.548 32.401-4.821 3.159-13.721-3.779-16.425-12.803-1.459-4.872-1.43-4.908 8.739-10.637 3.258-1.836 9.471-6.906 13.807-11.268 8.876-8.928 9.061-8.87 7.427 2.307M57.638 67.5c-1.505 3.924-9.918 15.62-10.684 14.854-1.254-1.254-2.91-13.51-2.934-21.707L44 53.794l7.05 6.251c3.878 3.437 6.843 6.792 6.588 7.455m-.075 77.763c-7.283 11.116-3.609 36.608 6.817 47.297 11.68 11.974 31.013 7.52 31.09-7.163l.03-5.821-6.5-3.538c-9.189-5.002-16.548-12.779-22.5-23.779-5.252-9.706-6.514-10.694-8.937-6.996m131.877 8.747c-6.016 11.649-11.753 17.921-21.816 23.852-11.614 6.844-11.651 15.311-.094 21.856 19.559 11.078 40.204-17.282 32.925-45.229-1.451-5.57-3.748-9.489-5.563-9.489-.439 0-2.892 4.055-5.452 9.01M34.071 263.181a9029.053 9029.053 0 017.443 35.612c4.563 22.116 4.597 22.201 8.711 22.229 19.551.131 27.869 33.677 11.15 44.961-12.384 8.358-32.273-4.558-32.353-21.009-.017-3.568-.935-6.002-4.336-11.5-12.38-20.016-11.313-53.016 2.775-85.832 2.237-5.211 2.205-5.287 6.61 15.539M222.5 316.879c7.944 3.644 13.5 11.723 13.5 19.631 0 22.585-38.615 25.954-40.768 3.557-1.648-17.155 13.093-29.691 27.268-23.188',
    }),
  );
};

exports.Logo = Logo;
//# sourceMappingURL=Logo.js.map

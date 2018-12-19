module.exports = {
  "env": {
    "browser": true,
  },
  "extends": ["eslint:recommended", "standard"],
  "plugins": [ ],
  "rules": {
    "comma-dangle": [2,"always-multiline"],
    "indent": ["error", 2, {"MemberExpression": "off"}],
    "linebreak-style": ["error", "unix"],
  },
  "settings": {
  },
  "globals": {
    "axios": true,
    "d3": true,
  }
}

module.exports = {
    'env': {
        'node': true,
        'es6': true
    },
    'globals': {
        'Atomics': 'readonly',
        'SharedArrayBuffer': 'readonly'
    },
    'parser': 'babel-eslint',
    'parserOptions': {
        'ecmaVersion': 2018,
        'sourceType': 'module'
    },
    'settings': {
        'propWrapperFunctions': [
            'forbidExtraProps',
            {'property': 'freeze', 'object': 'Object'},
            {'property': 'myFavoriteWrapper'}
        ],
        'linkComponents': [
            'Hyperlink',
            {'name': 'Link', 'linkAttribute': 'to'}
        ]
    },
    'rules': {
        'no-var': 'error',
        'init-declarations': 'off',
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-extra-semi': 'error',
        'linebreak-style': ['error', 'unix'],
        'array-bracket-spacing': ['error', 'never'],
        'block-scoped-var': 'off',
        'camelcase': 'error',
        'comma-dangle': ['error', 'never'],
        'comma-spacing': ['error', {'before': false, 'after': true}],
        'comma-style': ['error', 'last'],
        'complexity': ['error', 20],
        'computed-property-spacing': ['error', 'never']
    }
};

# http-proxy-middleware-body

[![NPM Version][npm-image]][npm-url]
[![License][license-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/http-proxy-middleware-body.svg?style=flat-square
[npm-url]: https://npmjs.org/package/http-proxy-middleware-body
[license-image]: https://img.shields.io/npm/l/http-proxy-middleware-body.svg?style=flat-square

Get response body when using `http-proxy-middleware`.

## Example

An example with `express` server.

```javascript
const express = require('express'),
    {createProxyMiddleware} = require('http-proxy-middleware'),

    app = express();

app.use(createProxyMiddleware('SOME_CONTEXT', {

    // other configs...

    onProxyRes: (proxyRes, req, res) => getBody(res, proxyRes, rawBody => {

        if (!rawBody) {
            return;
        }

        try {

            // if it's a json body
            const body = JSON.parse(rawBody);

            // token expired
            if (body.code === 'TOKEN_EXPIRED_CODE') {
                // remove token...
            }

        } catch (e) {
            // do something...
        }

    })

}));
```

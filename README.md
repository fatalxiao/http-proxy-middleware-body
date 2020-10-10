# http-proxy-middleware-body

## Example

An example with `express` server.

```javascript

// ...

const express = require('express'),
    {createProxyMiddleware} = require('http-proxy-middleware'),

    app = express();

app.use(createProxyMiddleware(SOME_CONTEXT, {

    // other configs...

    onProxyRes: (proxyRes, req, res) => getBody(res, proxyRes, rawBody => {

        if (!rawBody) {
            return;
        }

        try {

            // if it's a json body
            const body = JSON.parse(rawBody);

            // token expired
            if (body.code === TOKEN_EXPIRED_CODE) {
                // remove token...
            }

        } catch (e) {
            // do something...
        }

    })

}));

// ...

```

'use strict';

const zlib = require('zlib'),
    concatStream = require('concat-stream'),
    BufferHelper = require('bufferhelper');

function getBody(res, proxyRes, callback) {

    if (proxyRes && proxyRes.headers && ('content-length' in proxyRes.headers)) {
        delete proxyRes.headers['content-length'];
    }

    const contentEncoding = getContentEncoding(proxyRes),
        unzip = getZip(contentEncoding),
        write = res.write,
        end = res.end;

    if (unzip) {
        unzip.on('error', e => {
            console.log('Unzip error: ', e);
            end.call(res);
        });
        handleCompressed(res, write, end, unzip, callback);
    } else if (!contentEncoding) {
        handleUncompressed(res, write, end, callback);
    } else {
        console.log('Not supported content-encoding: ' + contentEncoding);
    }

};

function getContentEncoding(proxyRes) {

    if (proxyRes && proxyRes.headers) {
        return proxyRes.headers['content-encoding'];
    }

    return proxyRes;

}

function getZip(contentEncoding) {

    switch (contentEncoding) {
        case 'gzip':
            return zlib.Gunzip();
        case 'deflate':
            return zlib.Inflate();
        case 'br':
            return zlib.BrotliDecompress && zlib.BrotliDecompress();
    }

    return null;

}

function handleCompressed(res, write, end, unzip, callback) {

    let rawData = null;

    res.write = data => {
        rawData = data;
        unzip.write(data);
    };
    res.end = () => unzip.end();

    unzip.pipe(concatStream(data => {

        if (typeof callback === 'function') {
            callback(data.toString());
        }

        write.call(res, new Buffer(rawData));
        end.call(res);

    }));

}

function handleUncompressed(res, write, end, callback) {

    let rawData = null;

    const buffer = new BufferHelper();
    res.write = data => {
        rawData = data;
        buffer.concat(data);
    };

    res.end = () => {

        if (typeof callback === 'function') {
            callback(buffer.toBuffer().toString());
        }

        write.call(res, rawData);
        end.call(res);

    };

}

module.exports = getBody;

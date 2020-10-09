'use strict';

const zlib = require('zlib'),
    concatStream = require('concat-stream'),
    BufferHelper = require('bufferhelper');

function getBody(res, proxyRes, callback) {

    // if (proxyRes && proxyRes.headers && ('content-length' in proxyRes.headers)) {
    //     delete proxyRes.headers['content-length'];
    // }

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
            return new zlib.Gunzip();
        case 'deflate':
            return new zlib.Inflate();
        case 'br':
            return zlib.BrotliDecompress && new zlib.BrotliDecompress();
    }

    return null;

}

function handleCompressed(res, write, end, unzip, callback) {

    const buffer = new BufferHelper();
    res.write = data => {
        buffer.concat(data);
        unzip.write(data);
    };
    res.end = () => unzip.end();

    unzip.pipe(concatStream(data => {

        if (typeof callback === 'function') {
            callback(data.toString());
        }

        write.call(res, buffer.toBuffer());
        end.call(res);

    }));

}

function handleUncompressed(res, write, end, callback) {

    const buffer = new BufferHelper();
    res.write = data => buffer.concat(data);

    res.end = () => {

        const data = buffer.toBuffer();

        if (typeof callback === 'function') {
            callback(data.toString());
        }

        write.call(res, data);
        end.call(res);

    };

}

module.exports = getBody;

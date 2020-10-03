'use strict';

const zlib = require('zlib'),
    concatStream = require('concat-stream'),
    BufferHelper = require('bufferhelper');

function getBody(res, proxyRes, callback) {

    if (proxyRes && proxyRes.headers && ('content-length' in proxyRes.headers)) {
        delete proxyRes.headers['content-length'];
    }

    const contentEncoding = getContentEncoding(proxyRes),
        [unzip, zip] = getZip(contentEncoding),
        write = res.write,
        end = res.end;

    if (unzip) {
        unzip.on('error', e => {
            console.log('Unzip error: ', e);
            end.call(res);
        });
        handleCompressed(res, write, end, unzip, zip, callback);
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
            return [zlib.Gunzip(), zlib.Gzip()];
        case 'deflate':
            return [zlib.Inflate(), zlib.Deflate()];
        case 'br':
            return [zlib.BrotliDecompress && zlib.BrotliDecompress(), zlib.BrotliCompress && zlib.BrotliCompress()];
    }

    return [];

}

function handleCompressed(res, write, end, unzip, zip, callback) {

    res.write = data => unzip.write(data);
    res.end = () => unzip.end();

    unzip.pipe(concatStream(data => {

        const body = data.toString();

        if (typeof callback === 'function') {
            callback(body);
        }

        zip.on('data', chunk => write.call(res, chunk));
        zip.on('end', () => end.call(res));

        zip.write(new Buffer(data));
        zip.end();

    }));

}

function handleUncompressed(res, write, end, callback) {

    let buffer = new BufferHelper();
    res.write = data => buffer.concat(data);

    res.end = () => {

        const body = buffer.toBuffer().toString();

        if (typeof callback === 'function') {
            callback(body);
        }

        write.call(res, new Buffer(body));
        end.call(res);

    };

}

module.exports = getBody;

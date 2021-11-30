'use strict';

const zlib = require('zlib');
const concatStream = require('concat-stream');
const BufferHelper = require('bufferhelper');

/**
 * get response body
 * @param res
 * @param proxyRes
 * @param callback
 */
function getBody(res, proxyRes, callback) {

    // if (proxyRes && proxyRes.headers && ('content-length' in proxyRes.headers)) {
    //     delete proxyRes.headers['content-length'];
    // }

    const contentEncoding = getContentEncoding(proxyRes);
    const unzip = getUnzip(contentEncoding);
    const write = res.write;
    const end = res.end;

    if (unzip) {
        unzip.on('error', e => {
            console.log('Unzip error: ', e);
            end.call(res);
        });
        handleCompressedResponseBody(res, write, end, unzip, callback);
    } else if (!contentEncoding) {
        handleUncompressedResponseBody(res, write, end, callback);
    } else {
        console.log('Not supported content-encoding: ' + contentEncoding);
    }

}

/**
 * get content encoding in response header
 * @param proxyRes
 * @returns {*|string[]|string|*}
 */
function getContentEncoding(proxyRes) {

    if (proxyRes && proxyRes.headers) {
        return proxyRes.headers['content-encoding'];
    }

    return proxyRes;

}

/**
 * get unzip instance
 * @param contentEncoding
 * @returns {null|zlib.Gunzip|zlib.Inflate|*}
 */
function getUnzip(contentEncoding) {

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

/**
 * handle compressed response body
 * @param res
 * @param write
 * @param end
 * @param unzip
 * @param callback
 */
function handleCompressedResponseBody(res, write, end, unzip, callback) {

    const originBody = new BufferHelper();

    // rewrite response write to get origin body
    // and prepare for unzip at the same time
    res.write = data => {
        originBody.concat(data);
        unzip.write(data);
    };

    // rewrite response end to end unzip
    res.end = () => unzip.end();

    // after unzip
    unzip.pipe(concatStream(data => {

        if (typeof callback === 'function') {
            callback(data.toString());
        }

        // call the response write and end
        write.call(res, originBody.toBuffer());
        end.call(res);

    }));

}

/**
 * handle uncompressed response body
 * @param res
 * @param write
 * @param end
 * @param callback
 */
function handleUncompressedResponseBody(res, write, end, callback) {

    const originBody = new BufferHelper();

    // rewrite response write to get origin body
    res.write = data => originBody.concat(data);

    // rewrite response end to run callback
    res.end = () => {

        const data = originBody.toBuffer();

        if (typeof callback === 'function') {
            callback(data.toString());
        }

        // call the response write and end
        write.call(res, data);
        end.call(res);

    };

}

module.exports = getBody;

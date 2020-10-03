'use strict';

const zlib = require('zlib'),
    concatStream = require('concat-stream'),
    BufferHelper = require('bufferhelper');

function getBody(res, proxyRes, callback) {

    let contentEncoding = proxyRes;
    if (proxyRes && proxyRes.headers) {
        contentEncoding = proxyRes.headers['content-encoding'];
        if ('content-length' in proxyRes.headers) {
            delete proxyRes.headers['content-length'];
        }
    }

    let unzip, zip;
    switch (contentEncoding) {
        case 'gzip':
            unzip = zlib.Gunzip();
            zip = zlib.Gzip();
            break;
        case 'deflate':
            unzip = zlib.Inflate();
            zip = zlib.Deflate();
            break;
        case 'br':
            unzip = zlib.BrotliDecompress && zlib.BrotliDecompress();
            zip = zlib.BrotliCompress && zlib.BrotliCompress();
            break;
    }

    let write = res.write;
    let end = res.end;

    if (unzip) {
        unzip.on('error', function (e) {
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

function handleCompressed(res, write, end, unzip, zip, callback) {

    res.write = data => unzip.write(data);
    res.end = () => unzip.end();

    // Concat the unzip stream.
    let concatWrite = concatStream(data => {

        const body = data.toString();

        // Custom modified logic
        if (typeof callback === 'function') {
            callback(body);
        }

        // Call the response method and recover the content-encoding.
        zip.on('data', chunk => write.call(res, chunk));
        zip.on('end', () => end.call(res));

        zip.write(new Buffer(data));
        zip.end();

    });

    unzip.pipe(concatWrite);

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

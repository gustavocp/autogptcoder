const http = require('http');

function ping(url) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('pong');
        }, 1000);
    });
}

module.exports = { ping };
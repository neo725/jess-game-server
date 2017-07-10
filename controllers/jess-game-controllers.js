'use strict';

exports.hello = function(req, res) {
    var data = { message: 'hello world' }
    res.json(data);
};
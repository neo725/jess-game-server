'use strict';

module.exports = function(app) {
    var controllers = require('../controllers/jess-game-controllers');

    app.route('/')
        .get(controllers.hello);
};
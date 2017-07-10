'use strict';

module.exports = function(io) {
    const uuidv4 = require('uuid/v4');
    const _ = require('lodash');

    var user_pool = [];
    var rooms = [];

    var findNextUser = function(users, client) {
        var index = 0;
        var user_index = -1;
        _.forEach(users, function(user) {
            if (user.client == client) {
                user_index = index;
            }
            index++;
        });

        if (user_index < users.length - 1) {
            return users[user_index + 1];
        }
        else {
            return users[0];
        }
    };

    io.on('connection', function(client) {
        console.log('>> Client connected...');
        var user = {
            uuid: uuidv4(),
            client: client
        };
        user_pool.push(user);
        console.log('user_pool.count = ' + user_pool.length);

        client.emit('receive-user-guid', user.uuid);

        client.on('create-room', function(data) {
            var generateRoomId = function() {
                var random = function(low, high) {
                    return Math.floor(Math.random() * (high - low) + low);
                };

                while (true) {
                    var id = random(10000, 99999);
                    var index = _.findIndex(rooms, { 'id': id });
                    if (index == -1) {
                        return id;
                    }
                }
            };
            var room = {
                id: generateRoomId(),
                size: data.size,
                users: [{ index: 1, client: client }]
            };
            console.log('request room create success, room_id : ' + room.id + ' ...');
            rooms.push(room);

            client.emit('room-created', room.id);
        });

        client.on('join-room', function(data) {
            console.log('join-room [' + data.id + '] requested...');
            var index = _.findIndex(rooms, { 'id': data.id });
            if (index == -1) {
                console.log('room not found...');
                client.emit('join-room-result', { status: false });
            }
            else {
                var room = rooms[index];
                var index_array = _.map(room.users, 'index');
                var max = _.max(index_array);

                room.users.push({
                    index: max + 1,
                    client: client
                });
                
                client.emit('join-room-result', { status: true, id: room.id, size: room.size });

                setTimeout(function() {
                    _.forEach(room.users, function(user) {
                        user.client.emit('game-on', {});
                    });
                }, 500);
            }
        });

        client.on('click-number', function(data) {
            var room_id = data.room_id;
            var index = _.findIndex(rooms, { id: room_id });
            if (index == -1) {
                return;
            }

            var room = rooms[index];

            _.forEach(room.users, function(user) {
                if (user.client != client) {
                    user.client.emit('choice-number', { number: data.value });
                }
            });
            
            var next_user = findNextUser(room.users, client);
            console.log(next_user);
            setTimeout(function() {
                next_user.client.emit('game-on', {});
            });
        });

        client.on('disconnect', function() {
            console.log('>> Client disconnected...');
            
            // remove from online user pool
            var index = _.findIndex(user_pool, { 'client': client });
            if (index > -1) {
                var user = user_pool[index];
                user_pool.splice(index, 1);

                console.log('user found : ' + user.uuid);
            }
            else {
                console.log('user not found in pool');
            }
            // search all rooms's client, if match then remove it
            // and if rooms's clients is empty, then remove room too.
            _.forEach(rooms, function(room) {
                var index = _.findIndex(room.users, { 'client': client });
                if (index > -1) {
                    room.users.splice(index, 1);
                }
            });
            _.remove(rooms, function(room) {
                if (room.users.length == 0) {
                    console.log('remove room[' + room.id + '] ...');
                }
                return room.users.length == 0;
            });
        });
    });
};
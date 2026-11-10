const { createClient } = require('redis');

const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379, // Default Redis port is 6379
    }
});

// redisClient.on('error', err => console.log('Redis Client Error', err));
// await redisClient.connect();

module.exports = redisClient;


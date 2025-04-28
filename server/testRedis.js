// import IORedis from "ioredis"

// const redis = new IORedis(process.env.REDIS_URL);

// redis.ping().then(result => {
//   console.log('Redis ping:', result); // should be "PONG"
//   redis.quit();
// }).catch(err => {
//   console.error('Failed to connect to Redis:', err);
// });

import IORedis from "ioredis";

const redisUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REDIS_URL
    : "redis://127.0.0.1:6379"; // local Redis for development

const redis = new IORedis(redisUrl);

redis.ping()
  .then(result => {
    console.log('Redis ping response:', result); // should print "PONG"
    return redis.quit();
  })
  .catch(error => {
    console.error('Error connecting to Redis:', error);
    redis.quit();
  });
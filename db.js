const { MongoClient } = require('mongodb');

const url = 'mongodb://127.0.0.1:27017';
const dbName = 'dbRestaurants';
const client = new MongoClient(url);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Successfully connected to MongoDB server for dbRestaurants');
    return client.db(dbName);
  } catch (error) {
    console.error('Failed to establish connection to MongoDB:', error);
    throw error;
  }
}

module.exports = connectToDatabase;

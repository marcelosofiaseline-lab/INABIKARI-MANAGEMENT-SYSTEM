const express = require('express');
const { ObjectId } = require('mongodb');
const path = require('path');
const connectToDatabase = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let inabikariCollection;

// Checks and cleans the request body. Returns { data } or { error }.
function validate(body) {
  const data = {
    restaurant_id: Number(body.restaurant_id),
    name: String(body.name || '').trim(),
    cuisine: String(body.cuisine || '').trim(),
    address: String(body.address || '').trim(),
    rating: Number(body.rating),
    contact: String(body.contact || '').trim()
  };
  if (!Number.isInteger(data.restaurant_id) || data.restaurant_id < 1)
    return { error: 'Restaurant ID must be a whole number of 1 or more.' };
  if (!data.name || !data.cuisine || !data.address || !data.contact)
    return { error: 'Name, cuisine, address and contact are required.' };
  if (Number.isNaN(data.rating) || data.rating < 0 || data.rating > 5)
    return { error: 'Rating must be a number from 0 to 5.' };
  return { data };
}

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function handleError(res, err) {
  if (err.code === 11000) return res.status(409).json({ error: 'That Restaurant ID already exists.' });
  res.status(500).json({ error: err.message });
}

function parseId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// 1. READ: all records, sorted by restaurant_id, with optional ?search=
app.get('/api/restaurants', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const filter = search
      ? { $or: ['name', 'cuisine', 'address'].map(f => ({ [f]: { $regex: escapeRegex(search), $options: 'i' } })) }
      : {};
    const restaurants = await inabikariCollection.find(filter).sort({ restaurant_id: 1 }).toArray();
    res.json(restaurants);
  } catch (err) {
    handleError(res, err);
  }
});

// 2. CREATE: add a new record into 'inabikari'
app.post('/api/restaurants', async (req, res) => {
  try {
    const { data, error } = validate(req.body);
    if (error) return res.status(400).json({ error });
    const result = await inabikariCollection.insertOne({ ...data, createdAt: new Date() });
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// 3. UPDATE: edit an existing record by ObjectId
app.put('/api/restaurants/:id', async (req, res) => {
  try {
    const _id = parseId(req.params.id);
    if (!_id) return res.status(400).json({ error: 'Invalid record id.' });
    const { data, error } = validate(req.body);
    if (error) return res.status(400).json({ error });
    const result = await inabikariCollection.updateOne(
      { _id },
      { $set: { ...data, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Record not found.' });
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// 4. DELETE: remove a record by ObjectId
app.delete('/api/restaurants/:id', async (req, res) => {
  try {
    const _id = parseId(req.params.id);
    if (!_id) return res.status(400).json({ error: 'Invalid record id.' });
    const result = await inabikariCollection.deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Record not found.' });
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

async function start() {
  const db = await connectToDatabase();
  inabikariCollection = db.collection('inabikari');
  // New: keeps restaurant_id unique so the same ID cannot be added twice
  await inabikariCollection.createIndex({ restaurant_id: 1 }, { unique: true });
  console.log('Connected to MongoDB: dbRestaurants -> collection: inabikari');
  app.listen(PORT, () => console.log(`Inabikari app running at http://localhost:${PORT}`));
}

start().catch(() => process.exit(1));

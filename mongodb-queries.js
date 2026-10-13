db.inabikari.createIndex({ restaurant_id: 1 }, { unique: true });

db.inabikari.insertOne({
  restaurant_id: 4,
  name: "Inabikari",
  cuisine: "Japanese & Chinese",
  address: "Angeles City",
  rating: 4.7,
  contact: "09171234570",
  createdAt: new Date()
});

db.inabikari.find({}).sort({ restaurant_id: 1 });

db.inabikari.find({
  $or: [
    { name:    { $regex: "japanese", $options: "i" } },
    { cuisine: { $regex: "japanese", $options: "i" } },
    { address: { $regex: "japanese", $options: "i" } }
  ]
}).sort({ restaurant_id: 1 });

db.inabikari.updateOne(
  { _id: ObjectId("650c1f1e9f1b2c001f8d4a1e") },
  { $set: { rating: 4.8, contact: "09179998811", updatedAt: new Date() } }
);

db.inabikari.deleteOne({ _id: ObjectId("650c1f1e9f1b2c001f8d4a1e") });

require('dotenv').config();
const connectDB = require('./config/db');
const Room = require('./models/Room');

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

const rooms = [
  ['101', 'Single', 1, 1800, 1, ['WiFi', 'AC', 'TV', 'Hot Water'], 'Cozy single room ideal for solo travellers.', 'photo-1631049307264-da0ec9d70304'],
  ['102', 'Single', 1, 1900, 1, ['WiFi', 'AC', 'TV', 'Work Desk'], 'Quiet single room with a dedicated work desk.', 'photo-1590490360182-c33d57733427'],
  ['103', 'Double', 1, 2800, 2, ['WiFi', 'AC', 'TV', 'Mini Fridge'], 'Comfortable double room with a queen-size bed.', 'photo-1611892440504-42a792e24d32'],
  ['104', 'Double', 1, 3000, 3, ['WiFi', 'AC', 'TV', 'Balcony'], 'Spacious double room with a private balcony.', 'photo-1618773928121-c32242e63f39'],
  ['201', 'Double', 2, 3200, 2, ['WiFi', 'AC', 'TV', 'City View'], 'Bright double room with a city view.', 'photo-1566665797739-1674de7a421a'],
  ['202', 'Deluxe', 2, 4500, 3, ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Bathtub'], 'Deluxe room with king bed and bathtub.', 'photo-1578683010236-d716f9a3f461'],
  ['203', 'Deluxe', 2, 4800, 3, ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony'], 'Deluxe room with a large balcony.', 'photo-1595576508898-0ad5c879a061'],
  ['204', 'Deluxe', 2, 5000, 4, ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Sofa'], 'Family deluxe room with a sitting area.', 'photo-1582719478250-c89cae4dc85b'],
  ['301', 'Suite', 3, 7500, 4, ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Jacuzzi', 'Lounge'], 'Executive suite with separate lounge and jacuzzi.', 'photo-1591088398332-8a7791972843'],
  ['302', 'Suite', 3, 8500, 4, ['WiFi', 'AC', 'Smart TV', 'Kitchenette', 'Jacuzzi', 'Lounge'], 'Premium suite with kitchenette and panoramic view.', 'photo-1560185007-cde436f6a4d0'],
  ['303', 'Suite', 3, 12000, 6, ['WiFi', 'AC', 'Smart TV', 'Kitchenette', 'Private Dining', 'Jacuzzi'], 'Presidential suite for large families and VIPs.', 'photo-1512918728675-ed5a9ecdebfd'],
  ['105', 'Single', 1, 1700, 1, ['WiFi', 'AC', 'TV'], 'Economy single room (currently under maintenance).', 'photo-1505693416388-ac5ce068fe85', 'maintenance'],
];

(async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing. Set it in backend/.env before seeding.');
  await connectDB();
  let insertedOrUpdated = 0;
  for (const [number, type, floor, price, capacity, amenities, description, photo, status] of rooms) {
    await Room.updateOne(
      { number },
      { $set: { number, type, floor, price, capacity, amenities, description, image: img(photo), status: status || 'available' } },
      { upsert: true, runValidators: true }
    );
    insertedOrUpdated += 1;
  }
  console.log(`Room seed complete: ${insertedOrUpdated} rooms inserted/updated. Existing users, bookings, and payments were not deleted.`);
  process.exit(0);
})().catch((err) => {
  console.error('Room seed failed:', err.message);
  process.exit(1);
});

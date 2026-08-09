const db = require('./database');

const categories = {
  'Electronics': [
    { name: 'Wireless Noise-Canceling Headphones', priceRange: [120, 250] },
    { name: 'Mechanical Gaming Keyboard', priceRange: [80, 150] },
    { name: 'Ergonomic Vertical Mouse', priceRange: [40, 90] },
    { name: 'Dual Monitor Arm Mount', priceRange: [60, 120] },
    { name: '1080p Web Camera with Mic', priceRange: [50, 100] },
    { name: 'Portable SSD 1TB', priceRange: [90, 160] }
  ],
  'Clothing': [
    { name: 'Classic Cotton Pullover Hoodie', priceRange: [35, 65] },
    { name: 'Slim-Fit Stretch Denim Jeans', priceRange: [45, 80] },
    { name: 'Breathable Running Sneakers', priceRange: [70, 130] },
    { name: 'Vintage Leather Bomber Jacket', priceRange: [150, 280] },
    { name: 'Merino Wool Trail Socks (3-Pack)', priceRange: [25, 45] },
    { name: 'Minimalist Canvas Backpack', priceRange: [40, 75] }
  ],
  'Home & Kitchen': [
    { name: 'Digital Air Fryer XL (5.8QT)', priceRange: [90, 150] },
    { name: 'Programmable Drip Coffee Maker', priceRange: [60, 120] },
    { name: 'Insulated Stainless Steel Tumbler', priceRange: [20, 35] },
    { name: 'Memory Foam Orthopedic Pillow', priceRange: [30, 60] },
    { name: 'Electric Kettle (1.7L)', priceRange: [25, 50] },
    { name: 'Bamboo Cutting Board Set', priceRange: [20, 40] }
  ],
  'Books': [
    { name: 'The Art of Clean Code', priceRange: [15, 30] },
    { name: 'Designing Resilient Microservices', priceRange: [25, 45] },
    { name: 'A History of AI and Human Thought', priceRange: [18, 35] },
    { name: 'Cooking for Geeks: Recipes & Science', priceRange: [20, 40] },
    { name: 'The Pragmatic Developer Handbook', priceRange: [22, 38] }
  ],
  'Sports & Outdoors': [
    { name: 'Eco-Friendly Natural Rubber Yoga Mat', priceRange: [40, 80] },
    { name: 'Heavy-Duty Resistance Bands Set', priceRange: [15, 35] },
    { name: 'Double Camping Hammock with Straps', priceRange: [30, 60] },
    { name: 'Ultralight Hiking Trekking Poles', priceRange: [35, 70] },
    { name: '20L Lightweight Dry Waterproof Bag', priceRange: [18, 30] }
  ]
};

const customers = [
  'Emma Watson', 'John Doe', 'Sarah Jenkins', 'Michael Jordan',
  'Lovelace Ada', 'Turing Alan', 'Charles Darwin', 'Marie Curie',
  'Isaac Newton', 'Galileo Galilei', 'Albert Einstein', 'Jane Austen',
  'Robert Frost', 'Grace Hopper', 'Katherine Johnson', 'Nikola Tesla',
  'Alexander Fleming', 'Leonardo da Vinci', 'Stephen Hawking', 'Rachel Carson'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max, round = false) {
  const val = Math.random() * (max - min) + min;
  return round ? Math.round(val) : parseFloat(val.toFixed(2));
}

// Generate transactions over the last 90 days
function seedDatabase() {
  console.log('Seeding sales database with mock transactions...');
  
  // Clear existing sales
  db.prepare('DELETE FROM sales').run();
  
  const insertStmt = db.prepare(`
    INSERT INTO sales (customer_name, product_name, category, amount, quantity, order_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction((salesData) => {
    for (const sale of salesData) {
      insertStmt.run(
        sale.customerName,
        sale.productName,
        sale.category,
        sale.amount,
        sale.quantity,
        sale.orderDate
      );
    }
  });

  const now = new Date();
  const salesRecords = [];
  const totalRecords = 180; // Seed 180 orders

  for (let i = 0; i < totalRecords; i++) {
    const customerName = getRandomItem(customers);
    const category = getRandomItem(Object.keys(categories));
    const productConfig = getRandomItem(categories[category]);
    
    const quantity = getRandomNumber(1, 4, true);
    const unitPrice = getRandomNumber(productConfig.priceRange[0], productConfig.priceRange[1]);
    const amount = parseFloat((unitPrice * quantity).toFixed(2));
    
    // Distribute transactions across the last 90 days
    const daysAgo = getRandomNumber(0, 90, true);
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    // Add random hours/minutes for variance
    orderDate.setHours(getRandomNumber(8, 22, true), getRandomNumber(0, 59, true));
    
    salesRecords.push({
      customerName,
      productName: productConfig.name,
      category,
      amount,
      quantity,
      orderDate: orderDate.toISOString()
    });
  }

  // Execute transaction
  transaction(salesRecords);
  
  const count = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
  console.log(`Successfully seeded ${count} sales records in database.`);
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

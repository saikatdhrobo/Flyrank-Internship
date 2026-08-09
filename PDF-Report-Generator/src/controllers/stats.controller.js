const db = require('../db/database');

/**
 * Fetch general e-commerce store metrics and transaction history.
 * GET /api/stats
 */
function getDashboardStats(req, res) {
  try {
    // 1. Core KPIs
    const kpis = db.prepare(`
      SELECT 
        SUM(amount) as totalRevenue,
        COUNT(*) as totalOrders,
        COUNT(DISTINCT customer_name) as totalCustomers,
        SUM(quantity) as totalItemsSold
      FROM sales
    `).get();

    // 2. Sales by Category
    const categorySales = db.prepare(`
      SELECT 
        category, 
        SUM(amount) as revenue,
        SUM(quantity) as itemsSold
      FROM sales 
      GROUP BY category 
      ORDER BY revenue DESC
    `).all();

    // 3. Recent 5 Transactions
    const recentTransactions = db.prepare(`
      SELECT 
        id, 
        customer_name, 
        product_name, 
        category, 
        amount, 
        quantity, 
        order_date
      FROM sales 
      ORDER BY order_date DESC 
      LIMIT 5
    `).all();

    // 4. Daily sales summary for a mini-trend (last 10 days)
    const dailyTrend = db.prepare(`
      SELECT 
        strftime('%m-%d', order_date) as dateLabel,
        SUM(amount) as revenue
      FROM sales
      GROUP BY dateLabel
      ORDER BY dateLabel DESC
      LIMIT 10
    `).all().reverse(); // Reverse to chronologically ascend

    return res.status(200).json({
      success: true,
      kpis: {
        totalRevenue: kpis.totalRevenue || 0,
        totalOrders: kpis.totalOrders || 0,
        totalCustomers: kpis.totalCustomers || 0,
        totalItemsSold: kpis.totalItemsSold || 0
      },
      categorySales,
      recentTransactions,
      dailyTrend
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getDashboardStats
};

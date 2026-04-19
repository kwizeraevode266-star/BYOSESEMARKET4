// ===============================
// 🔥 ORDER SERVICE
// ===============================

// ===============================
// 📦 BASE API URL
// ===============================
const ORDER_API = "https://your-backend-url.onrender.com/api/orders";

// ===============================
// 📥 GET ALL ORDERS
// ===============================
async function getOrders(userId) {
  try {
    const res = await fetch(`${ORDER_API}/${userId}`);
    const data = await res.json();

    return data.orders || [];

  } catch (error) {
    console.error("Fetch Orders Error:", error);
    return [];
  }
}

// ===============================
// 📊 GROUP ORDERS
// ===============================
function groupOrders(orders) {
  return {
    toPay: orders.filter(o => o.status === "pending"),
    toShip: orders.filter(o => o.status === "shipping"),
    toReceive: orders.filter(o => o.status === "delivering"),
    delivered: orders.filter(o => o.status === "completed")
  };
}

// ===============================
// 📜 ORDER HISTORY
// ===============================
async function getOrderHistory(userId) {
  const orders = await getOrders(userId);

  return orders.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ===============================
// 🔍 GET SINGLE ORDER
// ===============================
async function getOrderById(orderId) {
  try {
    const res = await fetch(`${ORDER_API}/single/${orderId}`);
    const data = await res.json();

    return data.order;

  } catch (error) {
    console.error("Order Error:", error);
  }
}

// ===============================
// ❌ CANCEL ORDER
// ===============================
async function cancelOrder(orderId) {
  try {
    const res = await fetch(`${ORDER_API}/cancel/${orderId}`, {
      method: "POST"
    });

    const data = await res.json();
    return data;

  } catch (error) {
    console.error("Cancel Error:", error);
  }
}
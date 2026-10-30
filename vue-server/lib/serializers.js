const toIsoDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};

const sessionUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatarUrl: u.avatar_url,
});

const adminUser = (u) => ({
  ...sessionUser(u),
  isActive: u.is_active,
  hasPassword: Boolean(u.password_hash),
  hasGoogle: Boolean(u.google_sub),
  createdAt: u.created_at,
  lastLoginAt: u.last_login_at,
});

// Field names match what the Vue components already consume.
const motorcycle = (m) => ({
  _id: String(m.id),
  Brand: m.brand,
  MotorcycleName: m.name,
  ReleaseDate: toIsoDate(m.release_date),
  Price: Number(m.price),
  Stock: m.stock,
  Quantity: m.quantity,
  Image: m.image_url,
});

const orderItem = (i) => ({
  _id: String(i.id),
  motorcycleId: i.motorcycle_id === null ? null : String(i.motorcycle_id),
  Brand: i.brand,
  MotorcycleName: i.name,
  Image: i.image_url,
  Price: Number(i.unit_price),
  quantity: i.quantity,
});

const order = (o, items, review = null) => ({
  _id: String(o.id),
  userId: o.user_id,
  status: o.status,
  total: Number(o.total),
  orderDate: o.created_at,
  customerInfo: {
    fullName: o.full_name,
    email: o.email,
    contactNo: o.contact_no,
    address: o.address || '',
    paymentMethod: o.payment_method,
  },
  items: items.map(orderItem),
  feedback: review && { rating: review.rating, comment: review.comment },
});

// "Juan Dela Cruz" -> "Juan C." so public reviews never show a customer's full name.
const shortName = (fullName) => {
  const words = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words[0] || 'Customer';
  return `${words[0]} ${words[words.length - 1][0].toUpperCase()}.`;
};

const itemNames = (items) => items.map((i) => `${i.brand} ${i.name}`);

// `f` is a feedback row joined with its order's full_name/email; `items` are that order's order_items.
const publicFeedback = (f, items) => ({
  _id: String(f.id),
  rating: f.rating,
  comment: f.comment,
  customer: shortName(f.full_name),
  motorcycles: itemNames(items),
  createdAt: f.created_at,
});

const adminFeedback = (f, items) => ({
  ...publicFeedback(f, items),
  orderId: String(f.order_id),
  fullName: f.full_name,
  email: f.email,
  isHidden: f.is_hidden,
});

const shopInfo = (s) => ({
  name: s.name,
  address: s.address,
  contactNo: s.contact_no,
  openingHours: s.opening_hours,
});

module.exports = { sessionUser, adminUser, motorcycle, order, publicFeedback, adminFeedback, shopInfo };

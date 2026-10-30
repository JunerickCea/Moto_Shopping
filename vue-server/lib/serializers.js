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

const order = (o, items) => ({
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
});

module.exports = { sessionUser, adminUser, motorcycle, order };

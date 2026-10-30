const pesoFormat = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

// 8999.99 -> "₱8,999.99"
export const peso = (value) => pesoFormat.format(Number(value) || 0);

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-PH', {
  year: 'numeric', month: 'short', day: 'numeric',
}) : '');

export const formatDateTime = (value) => (value ? new Date(value).toLocaleString('en-PH') : '');

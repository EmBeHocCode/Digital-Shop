export function calculateOrderTotals(
  items: Array<{ quantity: number; price: number }>,
  discount = 0
) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount)
  };
}

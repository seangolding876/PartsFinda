const fs = require('fs');
let content = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

// Add useCart import
content = content.replace(
  "import { z } from 'zod';",
  "import { z } from 'zod';\nimport { useCart } from '@/lib/CartContext';"
);

// Update the component to use cart context
content = content.replace(
  'export default function CheckoutPage() {',
  'export default function CheckoutPage() {\n  const { items: cartItems, getTotalPrice, clearCart } = useCart();'
);

// Remove the useState for cartItems since we'll use the context
content = content.replace(
  '  const [cartItems, setCartItems] = useState<CartItem[]>([]);',
  '  // Cart items from context'
);

// Save the updated file
fs.writeFileSync('src/app/checkout/page.tsx', content);
console.log('Updated checkout to use CartContext');

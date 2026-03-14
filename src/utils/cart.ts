import type { CartItem, Product, ProductConfigurationOption } from "@/types/domain";
import { formatProductSpecsSummary } from "@/utils/product";

type CartProduct = Pick<Product, "id" | "name" | "slug" | "price" | "type" | "image">;

export function mapProductToCartItem(
  product: CartProduct,
  quantity = 1,
  configuration?: ProductConfigurationOption
): CartItem {
  const lineId = configuration ? `cart-${product.id}-${configuration.id}` : `cart-${product.id}`;

  return {
    id: lineId,
    productId: product.id,
    name: product.name,
    slug: product.slug,
    price: configuration?.price ?? product.price,
    quantity,
    type: product.type,
    image: product.image,
    configurationId: configuration?.id,
    configurationLabel: configuration?.label,
    configurationSummary: formatProductSpecsSummary(configuration?.specs) || configuration?.description
  };
}

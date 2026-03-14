import type { Product, ProductConfigurationOption, ProductSpecs } from "@/types/domain";

export function formatProductSpecsSummary(specs?: ProductSpecs) {
  return [specs?.cpu, specs?.ram, specs?.storage].filter(Boolean).join(" • ");
}

export function getProductConfigurationOptions(product: Pick<Product, "configurationOptions">) {
  return product.configurationOptions ?? [];
}

export function getDefaultProductConfiguration(
  product: Pick<Product, "configurationOptions">
): ProductConfigurationOption | undefined {
  const options = getProductConfigurationOptions(product);

  return options.find((option) => option.isPopular) ?? options[0];
}

export function getProductDisplayPrice(product: Pick<Product, "price" | "minPrice" | "configurationOptions">) {
  const options = getProductConfigurationOptions(product);
  if (typeof product.minPrice === "number") {
    return product.minPrice;
  }

  if (options.length) {
    return Math.min(...options.map((option) => option.price));
  }

  return product.price;
}

export function getProductDisplayMaxPrice(
  product: Pick<Product, "price" | "maxPrice" | "configurationOptions">
) {
  const options = getProductConfigurationOptions(product);
  if (typeof product.maxPrice === "number") {
    return product.maxPrice;
  }

  if (options.length) {
    return Math.max(...options.map((option) => option.price));
  }

  return product.price;
}

export function getProductDisplayCompareAtPrice(
  product: Pick<Product, "compareAtPrice" | "configurationOptions">
) {
  const options = getProductConfigurationOptions(product);
  const compareAtPrices = options
    .map((option) => option.compareAtPrice)
    .filter((value): value is number => typeof value === "number");

  if (typeof product.compareAtPrice === "number") {
    compareAtPrices.push(product.compareAtPrice);
  }

  if (!compareAtPrices.length) {
    return undefined;
  }

  return Math.min(...compareAtPrices);
}

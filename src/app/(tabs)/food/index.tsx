import { ProductTabPlaceholder } from '@/components/product-tab-placeholder';
export default function FoodRoute() {
  return (
    <ProductTabPlaceholder
      title="Food Ajo"
      description="Save with your community towards verified food packages."
      sections={['My active plans', 'Browse packages', 'Distribution schedule']}
      icon="basket-outline"
    />
  );
}

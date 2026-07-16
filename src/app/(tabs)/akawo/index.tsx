import { ProductTabPlaceholder } from '@/components/product-tab-placeholder';
export default function AkawoRoute() {
  return (
    <ProductTabPlaceholder
      title="Akawo Savings"
      description="Turn personal targets into steady, visible progress."
      sections={['Total saved', 'Active goals', 'Create a new goal']}
      icon="flag-outline"
    />
  );
}

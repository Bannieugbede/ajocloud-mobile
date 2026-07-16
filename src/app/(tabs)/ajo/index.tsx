import { ProductTabPlaceholder } from '@/components/product-tab-placeholder';
export default function AjoRoute() {
  return (
    <ProductTabPlaceholder
      title="My Ajo Groups"
      description="Create, join, and follow your contribution circles."
      sections={['Join via referral code', 'My groups', 'Group analytics']}
      icon="people-outline"
    />
  );
}

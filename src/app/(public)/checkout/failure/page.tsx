import { PaymentResultHero } from "@/components/checkout/payment-result-hero";

export default function CheckoutFailureRoute({
  searchParams
}: {
  searchParams?: {
    orderCode?: string;
    gateway?: string;
    amount?: string;
  };
}) {
  return (
    <PaymentResultHero
      status="FAILED"
      orderCode={searchParams?.orderCode}
      gateway={searchParams?.gateway}
      amount={searchParams?.amount ? Number(searchParams.amount) : undefined}
    />
  );
}

import { PaymentResultHero } from "@/components/checkout/payment-result-hero";

export default function CheckoutSuccessRoute({
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
      status="SUCCESS"
      orderCode={searchParams?.orderCode}
      gateway={searchParams?.gateway}
      amount={searchParams?.amount ? Number(searchParams.amount) : undefined}
    />
  );
}

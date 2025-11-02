import PaymentDetail from '@/components/admin/PaymentDetail';

interface PageParams {
  params: {
    id: string;
  };
}

export default function PaymentDetailPage({ params }: PageParams) {
  return <PaymentDetail paymentId={params.id} />;
}

// Dynamic page ko force karen
export const dynamic = 'force-dynamic';
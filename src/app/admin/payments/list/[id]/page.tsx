export const dynamic = 'force-dynamic';
import PaymentDetail from '@/components/admin/PaymentDetail';

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  return <PaymentDetail paymentId={params.id} />;
}
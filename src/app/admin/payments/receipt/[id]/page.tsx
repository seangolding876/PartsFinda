import ReceiptPage from '@/components/admin/ReceiptPage';

export default function ReceiptViewPage({ params }: { params: { id: string } }) {
  return <ReceiptPage paymentId={params.id} />;
}
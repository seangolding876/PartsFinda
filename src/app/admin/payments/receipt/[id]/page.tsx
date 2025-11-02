import ReceiptPage from '@/components/admin/ReceiptPage';

interface PageParams {
  params: {
    id: string;
  };
}

export default function ReceiptViewPage({ params }: PageParams) {
  return <ReceiptPage paymentId={params.id} />;
}

// Dynamic page ko force karen
export const dynamic = 'force-dynamic';
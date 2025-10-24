// app/admin/payments/page.tsx
import PaymentDashboard from '@/components/admin/PaymentDashboard';

export default function AdminPaymentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PaymentDashboard />
    </div>
  );
}
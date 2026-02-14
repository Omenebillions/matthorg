import { Card } from '@/components/cards';
 
export default function Page() {
  return (
    <main>
      <h1 className="mb-4 text-xl md:text-2xl">
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Staff" value={0} type="collected" />
        <Card title="Active Tasks" value={0} type="pending" />
        <Card title="Completed Tasks" value={0} type="invoices" />
        <Card title="Sales & Revenue" value={0} type="customers" />
      </div>
    </main>
  );
}
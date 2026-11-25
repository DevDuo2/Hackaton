import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';

/**
 * Kurs sahifasi yuklanayotgan paytdagi skeleton.
 *
 * Next 16 (Cache Components + Partial Prefetching) dinamik segment uchun
 * «instant shell» talab qiladi; bu fayl ham shu rolni bajaradi, ham
 * foydalanuvchi bo'sh ekran ko'rmasligini ta'minlaydi.
 */
export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-slate-200 rounded-lg" />
              <div className="h-6 w-20 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-8 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
          </div>

          <Card className="p-6 space-y-4">
            <div className="h-44 w-full bg-slate-200 rounded-xl" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
            <div className="h-9 w-full bg-slate-200 rounded-xl" />
          </Card>
        </div>

        <Card className="p-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-100 rounded-xl" />
          ))}
        </Card>
      </div>
    </DashboardLayout>
  );
}

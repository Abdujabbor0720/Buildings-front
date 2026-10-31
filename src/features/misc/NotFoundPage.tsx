import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/shared/ui';

export default function NotFoundPage() {
  return (
    <Card className="mx-auto mt-16 max-w-md text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full surface-muted text-muted">
        <Compass className="size-6" />
      </div>
      <h1 className="mt-4 text-head font-semibold text-strong">Sahifa topilmadi</h1>
      <p className="mt-1 text-ui text-muted">
        So‘ralgan manzil mavjud emas yoki ko‘chirilgan bo‘lishi mumkin.
      </p>
      <Link to="/" className="mt-5 inline-block">
        <Button>Bosh sahifaga qaytish</Button>
      </Link>
    </Card>
  );
}

import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center text-white">
      <div className="max-w-lg space-y-5">
        <div className="text-7xl font-black gradient-text">404</div>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-slate-300">The HRMS route you requested does not exist.</p>
        <Link to="/">
          <Button>Return to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

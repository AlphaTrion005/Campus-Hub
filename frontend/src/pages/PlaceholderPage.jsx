import { AlertCircle, Calendar, Search, Users } from 'lucide-react';

const icons = {
  alert: AlertCircle,
  calendar: Calendar,
  search: Search,
  users: Users,
};

const PlaceholderPage = ({ title, description, icon }) => {
  const Icon = icons[icon] || AlertCircle;

  return (
    <div className="page feature-page">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <section className="empty-state card">
        <Icon size={36} />
        <h2>{title} workspace</h2>
        <p>This area is wired into navigation and ready for its API workflow.</p>
      </section>
    </div>
  );
};

export default PlaceholderPage;

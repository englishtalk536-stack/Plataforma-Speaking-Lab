import Link from 'next/link';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  createdAt: string;
};

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  if (notifications.length === 0) return null;

  return (
    <section aria-labelledby="notifications-heading" className="mt-6">
      <h2 id="notifications-heading" className="font-title text-lg text-speaking-cobalt">Avisos recientes</h2>
      <ul className="mt-2 divide-y divide-speaking-cobalt/10 border-y border-speaking-cobalt/10">
        {notifications.map((notification) => (
          <li key={notification.id} className="py-3">
            <p className="font-body text-sm font-semibold text-speaking-cobalt">{notification.title}</p>
            {notification.href ? (
              <Link href={notification.href} className="mt-1 inline-block font-body text-sm text-speaking-cobalt/75 underline-offset-4 hover:underline">
                {notification.message}
              </Link>
            ) : <p className="mt-1 font-body text-sm text-speaking-cobalt/75">{notification.message}</p>}
            <time dateTime={notification.createdAt} className="mt-1 block font-body text-xs text-speaking-cobalt/70">
              {new Date(notification.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
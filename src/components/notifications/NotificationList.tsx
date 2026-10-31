import { Link } from 'react-router'
import { authApi } from '@/api'
import { Button, Card, SectionTitle } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'

/** Latest notifications for the logged-in account, with "Mark all read". */
export function NotificationList({ limit = 8 }: { limit?: number }) {
  const { run } = useToast()
  const { data, status, reload } = useApiData(() => authApi.notifications())
  const items = (data ?? []).slice(0, limit)
  const unread = (data ?? []).filter((n) => !n.readAt).length

  return (
    <Card className="space-y-3">
      <SectionTitle
        actions={
          unread > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void run(authApi.markNotificationsRead).then(reload)}
            >
              Mark all read
            </Button>
          )
        }
      >
        Notifications{' '}
        {unread > 0 && <span className="ml-1 font-mono text-sm text-primary-strong">({unread} new)</span>}
      </SectionTitle>
      {status === 'loading' && <p className="text-sm text-muted-foreground">Loading…</p>}
      {status === 'ready' && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing yet.</p>
      )}
      <ul className="divide-y divide-border">
        {items.map((n) => (
          <li key={n.id} className="py-2.5">
            <Link to={n.link || '#'} className="group flex items-start gap-3">
              <span
                aria-label={n.readAt ? undefined : 'Unread'}
                className={cn(
                  'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                  n.readAt ? 'bg-transparent' : 'bg-primary',
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium group-hover:underline">{n.subject}</span>
                {n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}
                {n.details?.length > 0 && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {n.details.map((d) => (
                      <span key={d.label} className="mr-3 inline-block">
                        {d.label}: <span className="font-medium text-foreground">{d.value}</span>
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {formatDateTime(n.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

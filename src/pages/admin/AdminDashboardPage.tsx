import { Link } from 'react-router'
import { adminApi } from '@/api'
import { NotificationList } from '@/components/notifications/NotificationList'
import {
  Button,
  Card,
  LoadState,
  PageHeader,
  RoundStatusBadge,
  SectionTitle,
  StatCard,
  StatGrid,
} from '@/components/ui'
import { ROUND_STEPS } from '@/constants/status'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import { formatBaht } from '@/utils/format'

export default function AdminDashboardPage() {
  const { run, showSuccess } = useToast()
  const { data, status, error, reload } = useApiData(() => adminApi.dashboard())

  async function runDeadlines() {
    await run(async () => {
      const r = await adminApi.runDeadlines()
      showSuccess(
        `Deadline check done: ${r.allocated} round(s) closed for requests, ${r.offersClosed} offer window(s) closed, ${r.ordersCancelled} unpaid order(s) cancelled.`,
      )
      await reload()
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="What needs your attention"
        actions={
          <Button variant="outline" onClick={() => void runDeadlines()}>
            Run deadline check
          </Button>
        }
      />
      <LoadState status={status} error={error} onRetry={reload}>
        {data && (
          <>
            <StatGrid>
              <StatCard
                label="Slips to check"
                value={String(data.pendingPayments)}
                sub={formatBaht(data.pendingPaymentTotal)}
                accent={data.pendingPayments > 0}
                to={PATHS.adminPayments}
              />
              <StatCard
                label="Orders to ship"
                value={String(data.ordersToShip)}
                sub="Paid in full"
                accent={data.ordersToShip > 0}
                to={PATHS.adminOrders}
              />
              <StatCard
                label="Shops to approve"
                value={String(data.pendingShops)}
                sub={`${data.activeShops} active shops`}
                accent={data.pendingShops > 0}
                to={PATHS.adminShops}
              />
              <StatCard
                label="Received (30 days)"
                value={formatBaht(data.received30d)}
                sub="Confirmed payments"
              />
            </StatGrid>
            <StatGrid className="lg:grid-cols-2">
              <StatCard
                label="Awaiting payment"
                value={String(data.ordersAwaitingPayment)}
                sub="Orders with a payment due"
                to={PATHS.adminOrders}
              />
              <StatCard
                label="Refunds due"
                value={formatBaht(data.refundsDue)}
                sub="Deposits to return by hand (e.g. supply shortfalls)"
              />
            </StatGrid>
            <Card className="space-y-3">
              <SectionTitle
                actions={
                  <Link to={PATHS.adminRounds} className="text-sm text-info hover:underline">
                    All rounds →
                  </Link>
                }
              >
                Rounds
              </SectionTitle>
              <div className="flex flex-wrap gap-3">
                {ROUND_STEPS.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <RoundStatusBadge status={s} />
                    <span className="font-mono text-sm">{data.roundsByStatus[s] ?? 0}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </LoadState>
      <NotificationList />
      <p className="text-xs text-muted-foreground">
        The deadline check also runs on its own: it closes request windows and offer windows whose deadline
        has passed, and cancels orders that were not paid in time.
      </p>
    </div>
  )
}

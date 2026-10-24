import { shopApi } from '@/api'
import { NotificationList } from '@/components/notifications/NotificationList'
import { Card, LoadState, PageHeader, SectionTitle, StatCard, StatGrid } from '@/components/ui'
import { useUser } from '@/context/AuthContext'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import { formatBaht } from '@/utils/format'

export default function ShopDashboardPage() {
  const user = useUser()
  const { data, status, error, reload } = useApiData(() => shopApi.dashboard())

  return (
    <div className="space-y-6">
      <PageHeader title={`Hello, ${user.shopName}`} subtitle={`${user.tierName ?? 'No'} tier`} />
      <LoadState status={status} error={error} onRetry={reload}>
        {data && (
          <StatGrid>
            <StatCard
              label="Offers to answer"
              value={String(data.offersToAnswer)}
              sub="Accept by paying the deposit"
              accent={data.offersToAnswer > 0}
            />
            <StatCard
              label="Open pre-orders"
              value={String(data.openRoundsNotRequested)}
              sub="You haven't requested yet"
              to={PATHS.preorders}
            />
            <StatCard
              label="To pay"
              value={formatBaht(data.amountToPay)}
              sub={`${data.ordersToPay} order${data.ordersToPay === 1 ? '' : 's'}`}
              accent={data.ordersToPay > 0}
              to={PATHS.orders}
            />
            <StatCard
              label="In progress"
              value={String(data.ordersInProgress)}
              sub="Orders not shipped yet"
              to={PATHS.orders}
            />
          </StatGrid>
        )}
      </LoadState>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <NotificationList />
        <Card className="space-y-3">
          <SectionTitle>How pre-orders work</SectionTitle>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Request the boxes you want before the deadline. No payment yet.</li>
            <li>We split the supply fairly between shops, by tier.</li>
            <li>Accept your offer by paying a 30% deposit.</li>
            <li>We confirm your deposit.</li>
            <li>When stock arrives, pay the balance before the payment deadline.</li>
            <li>We confirm your payment.</li>
            <li>We ship paid orders.</li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Every deadline is 23:59 Bangkok time on the date shown.
          </p>
        </Card>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Button, Modal, ModalActions } from '@/components/ui'
import { TERMS_SECTIONS, TERMS_VERSION } from '@/constants/terms'
import { cn } from '@/utils/cn'

/**
 * Pre-order terms, refund policy and privacy policy in tabs. With `onAgree`, the shop must tick
 * "I agree" before the confirm button works (shown before a pre-order request); without it, the
 * terms are just shown to read.
 */
export function TermsModal({
  onClose,
  onAgree,
  agreeLabel = 'Agree and continue',
  busy,
}: {
  onClose: () => void
  /** Called with the version agreed to. Omit to show the terms read-only. */
  onAgree?: (termsVersion: string) => void
  agreeLabel?: string
  busy?: boolean
}) {
  const [tab, setTab] = useState(TERMS_SECTIONS[0].id)
  const [agreed, setAgreed] = useState(false)
  const section = TERMS_SECTIONS.find((s) => s.id === tab) ?? TERMS_SECTIONS[0]

  return (
    <Modal
      title="Pre-order terms and policies"
      onClose={onClose}
      className="max-w-2xl"
      footer={
        onAgree ? (
          <div className="w-full space-y-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span>
                I have read and agree to the Pre-order terms, the Refund and return policy and the Privacy
                policy on behalf of my shop.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <ModalActions
                onCancel={onClose}
                onConfirm={() => agreed && onAgree(TERMS_VERSION)}
                confirmLabel={agreeLabel}
                busy={busy}
                disabled={!agreed}
              />
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div role="tablist" className="flex flex-wrap gap-1 border-b border-border">
          {TERMS_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === tab}
              onClick={() => setTab(s.id)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
                s.id === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
        <ol
          role="tabpanel"
          className="max-h-[50vh] list-decimal space-y-2.5 overflow-y-auto pr-2 pl-5 text-sm leading-relaxed"
        >
          {section.clauses.map((clause, i) => (
            <li key={i}>{clause}</li>
          ))}
        </ol>
        <p className="font-mono text-[11px] text-muted-foreground">Version {TERMS_VERSION}</p>
      </div>
    </Modal>
  )
}

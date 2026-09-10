import { Check, EyeOff, X } from 'lucide-react';
import type { Availability } from '@merenda/shared';
import { AVAILABILITY_LABELS, AVAILABILITY_SHORT } from '@/lib/i18n';
import { SegmentedControl } from '@/components/ui';

export function AvailabilityControl({ value, onChange, size = 'sm', fullWidth, disabled, compact }: { value: Availability; onChange: (v: Availability) => void; size?: 'sm' | 'md'; fullWidth?: boolean; disabled?: boolean; compact?: boolean }) {
  const labels = compact ? AVAILABILITY_SHORT : AVAILABILITY_LABELS;
  return (
    <SegmentedControl<Availability>
      aria-label="Наличие"
      value={value}
      onChange={onChange}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      options={[
        { value: 'available', label: labels.available, icon: <Check />, tone: 'success', title: AVAILABILITY_LABELS.available },
        { value: 'unavailable', label: labels.unavailable, icon: <X />, tone: 'warning', title: AVAILABILITY_LABELS.unavailable },
        { value: 'hidden', label: labels.hidden, icon: <EyeOff />, tone: 'neutral', title: AVAILABILITY_LABELS.hidden },
      ]}
    />
  );
}

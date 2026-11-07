import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { useFocusTrap } from './Accessibility';

function Trap({ saving = false }) {
  const ref = useFocusTrap(true);
  return (
    <div ref={ref}>
      <button disabled>Unavailable</button>
      <button>Close</button>
      <input aria-label="Destination" />
      <button disabled={saving}>Save</button>
    </div>
  );
}

it('skips disabled controls and updates tab boundaries when saving', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<Trap />);
  expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  rerender(<Trap saving />);
  screen.getByRole('textbox').focus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole('textbox')).toHaveFocus();
});

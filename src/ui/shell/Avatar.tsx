import { store } from '../../engine/state';

/** Original user picture: a small rubber duck in the style of the era's stock tiles. */
export function Avatar({ size = 42 }: { size?: number }) {
  const dunmore = (store.s?.shownUser ?? '').includes('Dunmore');
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" style={{ display: 'block' }}>
      <rect width="42" height="42" fill={dunmore ? '#5d6a72' : '#8fc1f0'} />
      {dunmore ? (
        // After the profile is renamed: the picture becomes a flooded window.
        <g><rect x="9" y="8" width="24" height="26" fill="#2a2c30" /><rect x="9" y="22" width="24" height="12" fill="#6e8a99" opacity="0.9" />
          <circle cx="21" cy="17" r="3" fill="#cfc8b4" /><rect x="18.5" y="20" width="5" height="4" fill="#cfc8b4" /></g>
      ) : (
        <g><ellipse cx="21" cy="30" rx="14" ry="8" fill="#ffd431" /><circle cx="26" cy="18" r="7" fill="#ffd431" /><path d="M32 18l6 1-6 2z" fill="#f38b1c" /><circle cx="28" cy="16" r="1.4" fill="#000" />
          <rect y="34" width="42" height="8" fill="#5d9be6" /></g>
      )}
    </svg>
  );
}

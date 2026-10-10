import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

// history.back() from a programmatic close fires popstate asynchronously; if
// another sheet opened meanwhile it must not treat that event as "back".
let strayPops = 0;

/** Bottom sheet dialog: closes on scrim tap, Escape and the Android back button. */
export function Sheet({
  title,
  onClose,
  action,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  action?: ComponentChildren;
  footer?: ComponentChildren;
  children: ComponentChildren;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    // Push a history entry so the phone's back gesture closes the sheet.
    history.pushState({ sheet: true }, '');
    let popped = false;
    const onPop = () => {
      if (strayPops > 0) {
        strayPops--;
        return;
      }
      popped = true;
      close.current();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    window.addEventListener('popstate', onPop);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      if (!popped && history.state?.sheet) {
        strayPops++;
        history.back();
        // If no other sheet consumed the stray event, forget it shortly after.
        setTimeout(() => (strayPops = 0), 400);
      }
    };
  }, []);

  return (
    <div class="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div class="handle" />
        <div class="sheethead">
          <h2>{title}</h2>
          {action}
        </div>
        <div class="sheetbody">{children}</div>
        {footer ? <div class="sheetfoot">{footer}</div> : null}
      </div>
    </div>
  );
}

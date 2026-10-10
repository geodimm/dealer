import { platform } from '../lib/install';
import { Icon } from './Icon';

/** Explains why installing matters and either installs in one tap or shows the steps for this browser. */
export function InstallCard({ canPrompt, onInstall }: { canPrompt: boolean; onInstall: () => void }) {
  const p = platform();
  return (
    <section class="panel install">
      <div class="row" style={{ alignItems: 'flex-start' }}>
        <span class="nicon-accent">
          <Icon name="bell" size={20} />
        </span>
        <div class="grow stack" style={{ gap: '4px' }}>
          <strong>Инсталирай приложението, за да работи „Следя“</strong>
          <span class="hint" style={{ fontSize: '13px' }}>
            {p === 'ios'
              ? 'Известия за следените продукти идват само в приложението на началния екран. На iPhone то проверява за нови оферти, когато го отвориш.'
              : 'Само инсталираното приложение може да проверява за нови оферти и да изпраща известия, докато е затворено. В браузъра проверката става само докато сайтът е отворен.'}
          </span>
        </div>
      </div>

      {canPrompt ? (
        <button class="primary" style={{ flex: 'none', height: '48px' }} onClick={onInstall}>
          Инсталирай
        </button>
      ) : (
        <ol class="steps">
          {p === 'ios' ? (
            <>
              <li>Отвори сайта в <b>Safari</b>.</li>
              <li>
                Натисни <b>Сподели</b> <Icon name="share" size={15} /> в долната лента.
              </li>
              <li>
                Избери <b>„Добави към началния екран“</b> и потвърди.
              </li>
            </>
          ) : p === 'android' ? (
            <>
              <li>
                Натисни <b>⋮</b> горе вдясно в Chrome.
              </li>
              <li>
                Избери <b>„Инсталиране на приложението“</b> или <b>„Добавяне към началния екран“</b>.
              </li>
              <li>Отвори dealer от иконата на началния екран.</li>
            </>
          ) : (
            <>
              <li>
                В Chrome или Edge натисни иконата за инсталиране вдясно в адресната лента.
              </li>
              <li>
                Или: меню <b>⋮</b> → <b>„Инсталиране на dealer“</b>.
              </li>
            </>
          )}
        </ol>
      )}
    </section>
  );
}

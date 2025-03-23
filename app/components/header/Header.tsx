import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { isMac } from '~/utils/os';
import { useEffect, useState } from 'react';

export function Header() {
  const chat = useStore(chatStore);
  const [isElectron, setIsElectron] = useState(false);

  // Check if we're running in Electron after component mounts
  useEffect(() => {
    // Check for Electron by looking for specific environment variables
    const isRunningInElectron = navigator.userAgent.indexOf('Electron') !== -1;
    setIsElectron(isRunningInElectron);
  }, []);

  return (
    <header
      className={classNames('flex flex-col border-b', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
        'electron-drag-region': isElectron, // Custom class for drag region
      })}
    >
      {/* Empty space for window controls on macOS */}
      {isMac && isElectron && <div className="h-[28px]" />}

      {/* Logo and menu row */}
      <div className="flex items-center p-5 h-[calc(var(--header-height)_-_28px)]">
        <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer electron-no-drag">
          <div className="i-ph:sidebar-simple-duotone text-xl" />
          <a href="/" className="text-2xl font-semibold text-accent flex items-center">
            {/* <span className="i-bolt:logo-text?mask w-[46px] inline-block" /> */}
            <img src="/logo-light-styled.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
            <img src="/logo-dark-styled.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
          </a>
        </div>
        {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
          <>
            <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
              <ClientOnly>{() => <ChatDescription />}</ClientOnly>
            </span>
            <ClientOnly>
              {() => (
                <div className="mr-1">
                  <HeaderActionButtons />
                </div>
              )}
            </ClientOnly>
          </>
        )}
      </div>
    </header>
  );
}

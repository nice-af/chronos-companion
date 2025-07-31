import type { PlasmoCSConfig } from 'plasmo';
import debounce from 'lodash/debounce';

export const config: PlasmoCSConfig = {
  matches: ['https://*.atlassian.net/*'],
  all_frames: true,
};

/**
 * Add the tracking button to the issue detail page or the popup page
 * @param issueKey The issue that the button should start tracking time for
 * @returns True if the button was added successfully, false otherwise
 */
function addTrackingButton(issueKey: string, accountId: string, cloudId: string) {
  const issueMeatballMenuButton = document.querySelector(
    '[data-testid="issue-meatball-menu.ui.dropdown-trigger.button"]'
  );
  const groupDiv = issueMeatballMenuButton?.closest('[role="group"]');
  const trackingButton = document.querySelector('.chronos-button');
  if (!issueMeatballMenuButton || !groupDiv || trackingButton) {
    return false;
  }
  const buttonsContainer = groupDiv.childNodes[0] as HTMLDivElement;

  // Create a new button with the svg icon inside
  const ankerLink = document.createElement('a');
  ankerLink.className = 'chronos-button ' + issueMeatballMenuButton.className;
  ankerLink.href = `de.adrianfahrbach.chronos://auth://create-worklog?issueKey=${issueKey}&accountId=${accountId}&cloudId=${cloudId}`;
  ankerLink.ariaLabel = 'Start tracking time';
  ankerLink.title = 'Start tracking time';
  ankerLink.innerHTML =
    '<svg width="18" height="18" viewbox="0 0 22 22" fill="currentColor"><path d="M21.848 10.633a.52.52 0 0 1 0 .735l-9.17 9.191a.52.52 0 0 1-.889-.367v-3.905a.13.13 0 0 1 .038-.092l5.091-5.102a.13.13 0 0 0 0-.184l-5.09-5.102a.13.13 0 0 1-.039-.092V1.81a.52.52 0 0 1 .889-.368l9.17 9.191zm-16.766.46a.13.13 0 0 1 0-.184l5.114-5.126a.13.13 0 0 0 .038-.092V1.786a.52.52 0 0 0-.888-.367L.152 10.633a.52.52 0 0 0 0 .735l9.194 9.215a.52.52 0 0 0 .888-.368V16.31a.13.13 0 0 0-.038-.091l-5.114-5.126z" /><path d="M14.951 10.909a.13.13 0 0 1 0 .184l-2.895 2.902a.156.156 0 0 1-.267-.11V8.116c0-.139.168-.208.267-.11l2.895 2.902z" /></svg>';

  const style = document.createElement('style');
  style.textContent = `
  .chronos-button {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: var(--ds-text-subtle) !important;
    cursor: pointer !important;
  }

  .chronos-button:hover {
    background-color: var(--ds-background-neutral-subtle-hovered) !important;
  }

  .chronos-button:active {
    background-color: var(--ds-background-neutral-subtle-pressed) !important;
  }

  .chronos-button::after {
    border-color: var(--ds-border) !important;
  }

  .chronos-button svg {
    display: block;
    flex-shrink: 0;
  }
`;

  buttonsContainer.prepend(ankerLink);
  document.head.appendChild(style);
  return true;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Try to add the button multiple times in case the issue is not loaded yet
 */
let isTryingToAddTheButton = false;
async function tryAddingTheButtonMultipleTimes() {
  if (isTryingToAddTheButton) {
    return;
  }
  let issueKey: string | undefined;
  const isIssueDetailPage = location.href.includes('atlassian.net/browse');
  const isPopupPage = location.href.includes('atlassian.net/jira/software/projects');

  if (!isIssueDetailPage && !isPopupPage) {
    return;
  }

  if (isIssueDetailPage) {
    const foundIssueKey = location.href.match(/browse\/([A-Z]+-\d+)/)?.[1];
    if (foundIssueKey) {
      issueKey = foundIssueKey;
    }
  }
  if (isPopupPage) {
    const foundIssueKey = location.href.match(/selectedIssue=([A-Z]+-\d+)/)?.[1];
    if (foundIssueKey) {
      issueKey = foundIssueKey;
    }
  }
  const accountId = (document.querySelector('meta[name="ajs-atlassian-account-id"]') as HTMLMetaElement).content;
  const cloudId = (document.querySelector('meta[name="ajs-cloud-id"]') as HTMLMetaElement).content;

  isTryingToAddTheButton = true;
  for (let i = 0; i < 10; i++) {
    if (addTrackingButton(issueKey, accountId, cloudId)) {
      break;
    }
    await delay(1000);
  }
  isTryingToAddTheButton = false;
}

/**
 * Listen for changes in the URL and try to add the button when the URL changes
 * Newer browsers support the `navigation` object, which is why we use it if it is available
 * If it is not available, we use a polling fallback with `setInterval`
 */
const debouncedTryAddingTheButtonMultipleTimes = debounce(tryAddingTheButtonMultipleTimes, 200);
if ((window as any).navigation) {
  (window as any).navigation.addEventListener('navigate', debouncedTryAddingTheButtonMultipleTimes);
} else {
  let lastHref = location.href;
  setInterval(() => {
    if (lastHref !== location.href) {
      lastHref = location.href;
      debouncedTryAddingTheButtonMultipleTimes();
    }
  }, 1000);
}

tryAddingTheButtonMultipleTimes();

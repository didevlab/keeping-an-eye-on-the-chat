import type { ChatMessage, OverlayConfig } from '../../shared/types';

declare global {
  interface Window {
    gsap: typeof import('gsap').gsap;
    DisplayController: typeof import('./displayController').DisplayController;
    AvatarAnimator: typeof import('./avatarAnimator').AvatarAnimator;
    AvatarUI: typeof import('./avatarUI').AvatarUI;
    overlayChat?: {
      onMessage: (handler: (message: ChatMessage) => void) => void;
      getConfig: () => OverlayConfig;
    };
  }
}

export {};

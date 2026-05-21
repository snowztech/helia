export const baseStyles = /* css */ `
  :host {
    --helia-primary: #0ea5e9;
    --helia-background: #ffffff;
    --helia-surface: #f4f4f5;
    --helia-text: #0b0b0b;
    --helia-muted: #6b7280;
    --helia-border: #e5e7eb;
    --helia-radius: 14px;
    --helia-font: system-ui, -apple-system, "Segoe UI", sans-serif;
    all: initial;
  }

  * {
    box-sizing: border-box;
    font-family: var(--helia-font);
  }

  /* Launcher */
  .launcher {
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--helia-primary);
    color: #ffffff;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
    z-index: 2147483647;
  }
  .launcher:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  }
  .launcher:active { transform: translateY(0); }
  .launcher svg { width: 24px; height: 24px; }
  .launcher.hidden { opacity: 0; pointer-events: none; transform: scale(0.85); }

  /* Panel */
  .panel {
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: 380px;
    height: 560px;
    max-height: calc(100vh - 48px);
    background: var(--helia-background);
    color: var(--helia-text);
    border-radius: var(--helia-radius);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: bottom right;
    transform: scale(0.92) translateY(8px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.18s ease, opacity 0.18s ease;
    z-index: 2147483647;
  }
  .panel.open {
    transform: scale(1) translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  /* Header */
  .header {
    background: var(--helia-primary);
    color: #ffffff;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .header-title {
    font-weight: 600;
    font-size: 15px;
    line-height: 1.2;
  }
  .close {
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 4px;
    display: flex;
    border-radius: 6px;
    opacity: 0.85;
  }
  .close:hover { opacity: 1; background: rgba(255, 255, 255, 0.12); }
  .close svg { width: 18px; height: 18px; }

  /* Messages */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--helia-background);
  }
  .message {
    max-width: 84%;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .message.assistant {
    align-self: flex-start;
    background: var(--helia-surface);
    color: var(--helia-text);
    border-bottom-left-radius: 4px;
  }
  .message.user {
    align-self: flex-end;
    background: var(--helia-primary);
    color: #ffffff;
    border-bottom-right-radius: 4px;
  }
  .message.tool {
    align-self: flex-start;
    background: transparent;
    color: var(--helia-muted);
    font-size: 12px;
    padding: 2px 4px;
    font-style: italic;
  }
  .typing {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    padding: 2px 0;
  }
  .typing span {
    width: 6px; height: 6px;
    background: var(--helia-muted);
    border-radius: 50%;
    animation: bounce 1s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.15s; }
  .typing span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-4px); opacity: 1; }
  }

  /* Input */
  .input {
    border-top: 1px solid var(--helia-border);
    padding: 10px;
    display: flex;
    gap: 8px;
    background: var(--helia-background);
    flex-shrink: 0;
  }
  .input input {
    flex: 1;
    border: 1px solid var(--helia-border);
    border-radius: 999px;
    padding: 10px 14px;
    font-size: 14px;
    color: var(--helia-text);
    background: var(--helia-background);
    outline: none;
  }
  .input input:focus {
    border-color: var(--helia-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--helia-primary) 18%, transparent);
  }
  .input button {
    background: var(--helia-primary);
    color: #ffffff;
    border: none;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .input button:disabled { opacity: 0.5; cursor: not-allowed; }
  .input button svg { width: 16px; height: 16px; }

  /* Powered by */
  .footer {
    text-align: center;
    font-size: 11px;
    color: var(--helia-muted);
    padding: 6px 0 8px;
    background: var(--helia-background);
  }
  .footer a { color: inherit; text-decoration: none; }
  .footer a:hover { text-decoration: underline; }

  /* Mobile */
  @media (max-width: 480px) {
    .panel {
      right: 0; bottom: 0; left: 0;
      width: 100%;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
    }
  }
`;

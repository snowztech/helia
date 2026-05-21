export const baseStyles = /* css */ `
  :host {
    /* Themeable. Default = dark surface with a blue accent. */
    --helia-primary: #0ea5e9;
    --helia-background: #ffffff;
    --helia-surface: #f4f4f5;
    --helia-text: #0b0b0b;
    --helia-muted: #6b7280;
    --helia-border: #e5e7eb;
    --helia-radius: 14px;
    --helia-edge: 24px;       /* distance from the page edge */
    --helia-font: system-ui, -apple-system, "Segoe UI", sans-serif;
    all: initial;
  }

  /* Dark mode tokens — applied when host data-mode="dark" is set. */
  :host([data-mode="dark"]) {
    --helia-background: #161616;
    --helia-surface: #1f1f1f;
    --helia-text: #f1f1f1;
    --helia-muted: #9a9a9a;
    --helia-border: #2a2a2a;
  }

  * {
    box-sizing: border-box;
    font-family: var(--helia-font);
  }

  /* Launcher */
  .launcher {
    position: fixed;
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
  .launcher.right { right: var(--helia-edge); bottom: var(--helia-edge); }
  .launcher.left  { left: var(--helia-edge);  bottom: var(--helia-edge); }
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
    opacity: 0;
    pointer-events: none;
    transition: transform 0.18s ease, opacity 0.18s ease;
    z-index: 2147483647;
  }
  .panel.right {
    right: var(--helia-edge);
    bottom: var(--helia-edge);
    transform-origin: bottom right;
    transform: scale(0.92) translateY(8px);
  }
  .panel.left {
    left: var(--helia-edge);
    bottom: var(--helia-edge);
    transform-origin: bottom left;
    transform: scale(0.92) translateY(8px);
  }
  .panel.open { opacity: 1; pointer-events: auto; transform: scale(1) translateY(0); }

  /* Header */
  .header {
    background: var(--helia-primary);
    color: #ffffff;
    padding: 14px 16px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
  }
  .header-text { min-width: 0; }
  .header-title {
    font-weight: 600;
    font-size: 15px;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .header-subtitle {
    margin-top: 2px;
    font-size: 12px;
    opacity: 0.9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .header-subtitle:empty { display: none; }
  .close {
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 4px;
    display: flex;
    border-radius: 6px;
    opacity: 0.85;
    flex-shrink: 0;
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
      right: 0 !important;
      left: 0 !important;
      bottom: 0;
      width: 100%;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
    }
  }
`;

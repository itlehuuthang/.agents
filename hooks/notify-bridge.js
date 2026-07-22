#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const eventName = process.argv[2];

// Read stdin
let inputData = '';
process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  let payload = {};
  if (inputData.trim()) {
    try {
      payload = JSON.parse(inputData);
    } catch (e) {
      // Ignored
    }
  }

  // Resolve the workspace root from notify-bridge.js path
  const workspaceRoot = path.resolve(__dirname, '../..');
  const winNotifyPath = path.join(workspaceRoot, '.claude/hooks/notifications/win-notify.sh');

  let type = '';

  if (eventName === 'PreToolUse') {
    const toolName = payload.toolCall && payload.toolCall.name;
    if (toolName === 'run_command' || toolName === 'ask_permission') {
      type = 'permission';
    } else if (toolName === 'ask_question') {
      type = 'notify';
    }
  } else if (eventName === 'Stop') {
    if (payload.error || (payload.terminationReason && payload.terminationReason !== 'model_stop' && payload.terminationReason !== 'complete')) {
      type = 'stop-failure';
    } else {
      type = 'stop';
    }
  }

  if (type) {
    // Spawn win-notify.sh
    const child = spawn('/bin/bash', [winNotifyPath, type], {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        AGENT_NAME: 'Antigravity'
      }
    });
    child.unref();
  }
});

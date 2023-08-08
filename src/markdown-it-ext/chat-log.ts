'use strict';

import * as vscode from "vscode";
import { DecorationClass } from "../theming/constant";
require('jsdom-global')();

const DELIMITER_LENGTH = 8;
const DELIMITER_PATTERN = /^%%(USER|STEM|ASIS)%%$/;
const CHATLOG_PATTERN = /^%%(USER|STEM|ASIS)%%[\s\S]*?%%(USER|STEM|ASIS)%%$/gm;
const ROLE_USER = "USER";
const ROLE_SYSTEM = "STEM";
const ROLE_ASISTANT = "ASIS";
const chatLogColors = {
    [ROLE_USER]: "#E6FFED",
    [ROLE_SYSTEM]: "#FFE8E8",
    [ROLE_ASISTANT]: "#EAF5FF",
};
const chatLogStyles:  { [role: string]: any } = {
    [ROLE_USER]: { backgroundColor: chatLogColors[ROLE_USER], isWholeLine: true },
    [ROLE_SYSTEM]: { backgroundColor: chatLogColors[ROLE_SYSTEM], isWholeLine: true },
    [ROLE_ASISTANT]: { backgroundColor: chatLogColors[ROLE_ASISTANT], isWholeLine: true },
};

export function apply_chatlog_decorations(document: vscode.TextDocument, editor: vscode.TextEditor, decorationHandles: any) {
    console.log('=====apply chatlog decorations')
    // Logic to detect and apply chat log decorations
    let match;
    const text = document.getText();

    const chatLogDecorations: { [role: string]: vscode.Range[] } = {
        [ROLE_USER]: [],
        [ROLE_SYSTEM]: [],
        [ROLE_ASISTANT]: [],
    };
    while (match = CHATLOG_PATTERN.exec(text)) {
        const role = match[1];
        console.log("match!!!", role);
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        chatLogDecorations[role].push(range);
    }
    for (const role of [ROLE_USER, ROLE_SYSTEM, ROLE_ASISTANT]) {
        let handle = decorationHandles.get(role);
        if (!handle) {
            handle = vscode.window.createTextEditorDecorationType(chatLogStyles[role]);
            decorationHandles.set(role, handle);
        }
        editor.setDecorations(handle, chatLogDecorations[role]);
    }
}

function chat_log_block(state: any, start: any, end: any) {
    var pos = state.bMarks[start] + state.tShift[start],
        max = state.eMarks[start];

    if (pos + DELIMITER_LENGTH > max) { return false; }

    const marker = state.src.slice(pos, pos + DELIMITER_LENGTH);
    if (!DELIMITER_PATTERN.test(marker)) { return false; }

    let next = start;
    while (next < end) {
        next++;
        pos = state.bMarks[next];
        max = state.eMarks[next];

        if (DELIMITER_PATTERN.test(state.src.slice(pos, pos + DELIMITER_LENGTH))) {
            break;
        }
    }

    state.line = next + 1;

    const token = state.push('chat_log_block', 'chat', 0);
    token.block = true;
    token.content = state.getLines(start + 1, next, 0, true);
    token.info = marker.slice(2, -2);  // Extract role (e.g., "USER")
    token.map = [start, state.line];
    token.markup = marker;

    return true;
}

function chat_log_plugin(md: any) {
    const blockRenderer = function(tokens: any, idx: any) {
        const role = tokens[idx].info;

        let style = "";
        switch (role) {
            case ROLE_USER:
                style = `background-color: ${chatLogColors[ROLE_USER]}; padding: 5px; border-radius: 3px; margin: 5px 0;`
                break;
            case ROLE_SYSTEM:
                style = `background-color: ${chatLogColors[ROLE_SYSTEM]}; padding: 5px; border-radius: 3px; margin: 5px 0;`
                break;
            case ROLE_ASISTANT:
                style = `background-color: ${chatLogColors[ROLE_ASISTANT]}; padding: 5px; border-radius: 3px; margin: 5px 0;`
                break;
        }

        const renderedContent = md.render(tokens[idx].content);
        return `<div style="${style}">${renderedContent}</div>`;
    }

    md.block.ruler.after('blockquote', 'chat_log_block', chat_log_block, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
    });

    md.renderer.rules.chat_log_block = blockRenderer;
}

export default chat_log_plugin;

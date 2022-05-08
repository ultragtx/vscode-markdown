'use strict';

import * as vscode from "vscode";
import * as abcjs from "abcjs";
require('jsdom-global')();

// refer: https://github.com/traPtitech/markdown-it-katex/blob/master/index.js

function music_block(state, start, end, silent){
    var firstLine, lastLine, next, lastPos, found = false, token,
        pos = state.bMarks[start] + state.tShift[start],
        max = state.eMarks[start]

    if(pos + 2 > max){ return false; }
    if(state.src.slice(pos,pos+2)!=='@@'){ return false; }

    pos += 2;
    firstLine = state.src.slice(pos,max);

    if(silent){ return true; }
    if(firstLine.trim().slice(-2)==='@@'){
        // Single line expression
        firstLine = firstLine.trim().slice(0, -2);
        found = true;
    }

    for(next = start; !found; ){

        next++;

        if(next >= end){ break; }

        pos = state.bMarks[next]+state.tShift[next];
        max = state.eMarks[next];

        if(pos < max && state.tShift[next] < state.blkIndent){
            // non-empty line with negative indent should stop the list:
            break;
        }

        if(state.src.slice(pos,max).trim().slice(-2)==='@@'){
            lastPos = state.src.slice(0,max).lastIndexOf('@@');
            lastLine = state.src.slice(pos,lastPos);
            found = true;
        }

    }

    state.line = next + 1;

    token = state.push('music_block', 'music', 0);
    token.block = true;
    token.content = (firstLine && firstLine.trim() ? firstLine + '\n' : '')
    + state.getLines(start + 1, next, state.tShift[start], true)
    + (lastLine && lastLine.trim() ? lastLine : '');
    token.map = [ start, state.line ];
    token.markup = '@@';
    return true;
}

function abcjs_plugin(md, options) {
    // let orange = vscode.window.createOutputChannel("Orange");
    // orange.appendLine('abcjs_plugin');
    // orange.appendLine(options);

    let blockRenderer = function(tokens, idx) {
        // orange.appendLine(tokens[idx].content);

        let div = document.createElement('div');
        let renderObj = abcjs.renderAbc(div, tokens[idx].content);

        // orange.appendLine('render finished');

        return div.outerHTML;
    }

    md.block.ruler.after('blockquote', 'music_block', music_block, {
        alt: [ 'paragraph', 'reference', 'blockquote', 'list' ]
    });

    md.renderer.rules.music_block = blockRenderer;
}

export default abcjs_plugin;

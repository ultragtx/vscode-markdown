import type { KatexOptions } from "katex";
import MarkdownIt = require("markdown-it");
import { configManager } from "./configuration/manager";
import abcjs_plugin from "./markdown-it-ext/abcjs";
import chat_log_plugin from "./markdown-it-ext/chat-log";
import furigana = require("furigana-markdown-it");
import { config } from "./nls";

const katexOptions: KatexOptions = { throwOnError: false };

/**
 * https://code.visualstudio.com/api/extension-guides/markdown-extension#adding-support-for-new-syntax-with-markdownit-plugins
 */
export function extendMarkdownIt(md: MarkdownIt): MarkdownIt {
    md.use(require("markdown-it-task-lists"), {enabled: true});

    if (configManager.get("math.enabled")) {
        // We need side effects. (#521)
        require("katex/contrib/mhchem");

        // Deep copy, as KaTeX needs a normal mutable object. <https://katex.org/docs/options.html>
        const macros: KatexOptions["macros"] = JSON.parse(JSON.stringify(configManager.get("katex.macros")));

        if (Object.keys(macros).length === 0) {
            delete katexOptions["macros"];
        } else {
            katexOptions["macros"] = macros;
        }

        md.use(require("@neilsustc/markdown-it-katex"), katexOptions);
    }

    if (configManager.get("music.enabled")) {
        md.use(abcjs_plugin, {test: 1});
    }

    if (configManager.get("furigana.enabled")) {
        md.use(furigana());
    }

    if (configManager.get("chatlog.enabled")) {
        md.use(chat_log_plugin);
    }

    return md;
}

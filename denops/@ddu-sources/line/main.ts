import type { Context, Item } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";

import type { ActionData } from "@shougo/ddu-kind-file";

import type { Denops } from "@denops/std";
import * as fn from "@denops/std/function";

type Params = {
  bufNr: number;
  ignoreEmptyInput: boolean;
  range: "window" | "buffer";
  winId: number;
};

export class Source extends BaseSource<Params> {
  override kind = "file";

  override gather(args: {
    denops: Denops;
    context: Context;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    const windowRange = args.sourceParams.range === "window";
    const winId = args.sourceParams.winId > 0
      ? args.sourceParams.winId
      : args.context.winId;

    return new ReadableStream({
      async start(controller) {
        if (args.sourceParams.ignoreEmptyInput && args.context.input === "") {
          controller.close();
          return;
        }

        const begin = windowRange ? await fn.line(args.denops, "w0", winId) : 1;
        const end = windowRange ? await fn.line(args.denops, "w$", winId) : "$";
        const lineNr = await fn.line(args.denops, ".", winId);

        const bufnr = args.sourceParams.bufNr > 0
          ? args.sourceParams.bufNr
          : args.context.bufNr;
        const bufLines = await fn.getbufline(args.denops, bufnr, begin, end);
        const lineNumberWidth = String(bufLines.length).length;
        const formatLineNr = (lineNr: number): string => {
          const lineNrText = "0".repeat(lineNumberWidth) + String(lineNr);
          return lineNrText.slice(-lineNumberWidth);
        };
        const items = bufLines.map((line, i) => {
          return {
            word: line,
            display: `${formatLineNr(i + begin)}: ${line}`,
            action: {
              bufNr: bufnr,
              lineNr: i + begin,
            },
          };
        });

        const beforeCurrentLine: Item<ActionData>[] = [];
        const fromCurrentLine: Item<ActionData>[] = [];
        for (const item of items) {
          if (item.action.lineNr >= lineNr) {
            fromCurrentLine.push(item);
          } else {
            beforeCurrentLine.push(item);
          }
        }

        controller.enqueue([...fromCurrentLine, ...beforeCurrentLine]);

        controller.close();
      },
    });
  }

  override params(): Params {
    return {
      bufNr: 0,
      ignoreEmptyInput: false,
      range: "buffer",
      winId: 0,
    };
  }
}

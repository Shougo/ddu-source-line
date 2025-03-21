import { type Context, type Item } from "jsr:@shougo/ddu-vim@~10.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~10.1.0/source";

import { type ActionData } from "jsr:@shougo/ddu-kind-file@~0.9.0";

import type { Denops } from "jsr:@denops/core@~7.0.0";
import * as fn from "jsr:@denops/std@~7.5.0/function";

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
    const windowRange = args.sourceParams.range == "window";
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
        const padding = "0".repeat(String(bufLines.length).length);
        const slice = -1 * padding.length;
        const items = bufLines.map((line, i) => {
          return {
            word: line,
            display: `${(padding + (i + begin)).slice(slice)}: ${line}`,
            action: {
              bufNr: bufnr,
              lineNr: i + begin,
            },
          };
        });

        controller.enqueue(
          items.filter((item) => item?.action?.lineNr >= lineNr).concat(
            items.filter((item) => item?.action?.lineNr < lineNr),
          ),
        );

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

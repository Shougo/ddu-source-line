import { type Context, type Item } from "jsr:@shougo/ddu-vim@~6.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~6.1.0/source";

import { type ActionData } from "jsr:@shougo/ddu-kind-file@~0.9.0";

import type { Denops } from "jsr:@denops/core@~7.0.0";
import * as fn from "jsr:@denops/std@~7.1.0/function";

type Params = {
  range: "window" | "buffer";
};

export class Source extends BaseSource<Params> {
  override kind = "file";

  #winBegin = 0;
  #winEnd = 0;
  #lineNr = 0;

  override async onInit(args: {
    denops: Denops;
  }): Promise<void> {
    this.#winBegin = await fn.line(args.denops, "w0");
    this.#winEnd = await fn.line(args.denops, "w$");
    this.#lineNr = await fn.line(args.denops, ".");
  }

  override gather(args: {
    denops: Denops;
    context: Context;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    const windowRange = args.sourceParams?.range == "window";
    const begin = windowRange ? this.#winBegin : 1;
    const end = windowRange ? this.#winEnd : "$";
    const lineNr = this.#lineNr;

    return new ReadableStream({
      async start(controller) {
        const bufnr = args.context.bufNr;
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
      range: "buffer",
    };
  }
}

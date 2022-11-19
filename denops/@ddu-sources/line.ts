import {
  BaseSource,
  Context,
  Item,
} from "https://deno.land/x/ddu_vim@v2.0.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v2.0.0/deps.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.3.1/file.ts#^";

type Params = {
  range: 'window' | 'buffer';
};

export class Source extends BaseSource<Params> {
  kind = "file";

  winBegin = 0;
  winEnd = 0;

  async onInit(args: {
    denops: Denops;
  }): Promise<void> {
    this.winBegin = await fn.line(args.denops, "w0");
    this.winEnd = await fn.line(args.denops, "w$");
  }

  gather(args: {
    denops: Denops;
    context: Context;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    const windowRange = args.sourceParams?.range == "window";
    const begin = windowRange ? this.winBegin : 1;
    const end = windowRange ? this.winEnd : "$";

    return new ReadableStream({
      async start(controller) {
        const bufnr = args.context.bufNr;
        const lines = await fn.getbufline(args.denops, bufnr, begin, end);
        controller.enqueue(lines.map((line, i) => {
          return {
            word: line,
            action: {
              bufNr: bufnr,
              lineNr: i + begin,
            },
          };
        }));

        controller.close();
      },
    });
  }

  params(): Params {
    return {
      range: 'buffer',
    };
  }
}

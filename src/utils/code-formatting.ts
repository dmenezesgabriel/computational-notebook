import prettier from "prettier/standalone";
import * as parserBabel from "prettier/parser-babel";
import * as parserTypescript from "prettier/parser-typescript";
import * as prettierPluginEstree from "prettier/plugins/estree";

export async function formatCode(
  code: string,
  language: string
): Promise<string> {
  const parser = language === "typescript" ? "typescript" : "babel";
  const plugins = [parserTypescript, parserBabel, prettierPluginEstree];
  return prettier.format(code, { parser, plugins });
}

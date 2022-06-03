import IGetIgnoredConfigContents from '@ignores/interfaces/IGetIgnoredConfigContents';
import fastGlob, { isDynamicPattern } from 'fast-glob';
import fs from 'fs';
import { parse } from 'jsonc-parser';
import { isEmpty, isFalse } from 'my-easy-fp';
import { exists, getDirname, replaceSepToPosix } from 'my-node-fp';
import path from 'path';

export default async function getCtiignoreFiles(
  cwd: string,
  filePath: string,
): Promise<IGetIgnoredConfigContents> {
  if (isFalse(await exists(filePath))) {
    return {};
  }

  const fileBuf = await fs.promises.readFile(filePath);
  const dirPath = await getDirname(filePath);
  const ignoreFiles: IGetIgnoredConfigContents = parse(fileBuf.toString());

  const resolvedPathIgnoreFiles = Object.entries(ignoreFiles).reduce<IGetIgnoredConfigContents>(
    (aggregation, file) => {
      const [relativeFilePath, value] = file;

      const key = replaceSepToPosix(path.join(dirPath, relativeFilePath));

      if (isEmpty(aggregation[key])) {
        return { ...aggregation, [key]: value };
      }

      return aggregation;
    },
    {},
  );

  const evaluatedCtiignoreConfigContents = (
    await Promise.all(
      Object.entries(resolvedPathIgnoreFiles).map(
        async ([key, value]): Promise<Array<[string, string | string[]]>> => {
          if (isDynamicPattern(key)) {
            const files = await fastGlob(key, { dot: true, cwd });
            const ignoreEntries = files.map<[string, string | string[]]>((ignoreFilePathKey) => [
              ignoreFilePathKey,
              value,
            ]);

            return ignoreEntries;
          }

          return [[key, value]];
        },
      ),
    )
  )
    .flatMap((ignoreFilePath) => ignoreFilePath)
    .reduce<IGetIgnoredConfigContents>((aggregation, file) => {
      const [key, value] = file;
      if (isEmpty(aggregation[key])) {
        return { ...aggregation, [key]: value };
      }

      return aggregation;
    }, {});

  return evaluatedCtiignoreConfigContents;
}
import ICreateIndexInfo from '@tools/interface/ICreateIndexInfo';
import ICreateIndexInfos from '@tools/interface/ICreateIndexInfos';
import { settify } from '@tools/misc';
import { isNotEmpty } from 'my-easy-fp';

export default function mergeCreateIndexInfo(
  origin: ICreateIndexInfos,
  target: ICreateIndexInfos | ICreateIndexInfo,
) {
  const merged: ICreateIndexInfos = { ...origin };

  merged.depth = target.depth;
  merged.resolvedDirPath = target.resolvedDirPath;

  if ('exportStatement' in target) {
    merged.exportStatements = settify(
      [...merged.exportStatements, target.exportStatement].filter(
        (exportStatement): exportStatement is string => isNotEmpty(exportStatement),
      ),
    );

    merged.resolvedFilePaths = settify(
      [...(merged.resolvedFilePaths ?? []), target.resolvedFilePath].filter(
        (resolvedFilePath): resolvedFilePath is string => isNotEmpty(resolvedFilePath),
      ),
    );

    merged.resolvedFilePaths =
      merged.resolvedFilePaths.length <= 0 ? undefined : merged.resolvedFilePaths;
  } else {
    merged.exportStatements = settify([
      ...(merged.exportStatements ?? []),
      ...target.exportStatements,
    ]);

    merged.resolvedFilePaths = settify(
      [...(merged.resolvedFilePaths ?? []), ...(target.resolvedFilePaths ?? [])].filter(
        (resolvedFilePath): resolvedFilePath is string => isNotEmpty(resolvedFilePath),
      ),
    );
    merged.resolvedFilePaths =
      merged.resolvedFilePaths.length <= 0 ? undefined : merged.resolvedFilePaths;
  }

  return merged;
}
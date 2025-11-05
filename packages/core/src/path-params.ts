const OPTIONAL_CATCH_ALL = /^\[\[\.\.\.(.+)\]\]$/;
const CATCH_ALL = /^\[\.\.\.(.+)\]$/;
const DYNAMIC = /^\[(.+)\]$/;

const stripQuery = (value: string) => value.split(/[?#]/, 1)[0] ?? "";

const decodeSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const splitSegments = (value: string) => {
  const path = stripQuery(value);
  if (!path) return [] as string[];
  return path.split("/").filter(Boolean);
};

export type PathParamRecord = Record<string, string | string[] | undefined>;

export function matchPathParams(pattern: string, pathname: string): PathParamRecord | null {
  const patternSegments = splitSegments(pattern);
  const pathSegments = splitSegments(pathname);

  if (patternSegments.length === 0) {
    return pathSegments.length === 0 ? {} : null;
  }

  const params: PathParamRecord = {};
  let index = 0;

  for (let i = 0; i < patternSegments.length; i++) {
    const segment = patternSegments[i];

    const optionalMatch = OPTIONAL_CATCH_ALL.exec(segment);
    if (optionalMatch) {
      const name = optionalMatch[1];
      const rest = pathSegments.slice(index).map(decodeSegment);
      params[name] = rest.length > 0 ? rest : undefined;
      index = pathSegments.length;
      continue;
    }

    const catchAllMatch = CATCH_ALL.exec(segment);
    if (catchAllMatch) {
      const name = catchAllMatch[1];
      const rest = pathSegments.slice(index).map(decodeSegment);
      if (rest.length === 0) return null;
      params[name] = rest;
      index = pathSegments.length;
      continue;
    }

    const dynamicMatch = DYNAMIC.exec(segment);
    if (dynamicMatch) {
      if (index >= pathSegments.length) return null;
      const name = dynamicMatch[1];
      params[name] = decodeSegment(pathSegments[index]);
      index += 1;
      continue;
    }

    if (index >= pathSegments.length) return null;
    if (decodeSegment(segment) !== decodeSegment(pathSegments[index])) {
      return null;
    }
    index += 1;
  }

  if (index < pathSegments.length) return null;

  return params;
}

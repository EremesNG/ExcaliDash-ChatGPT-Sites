import { useCallback, useRef } from "react";
import {
  getElementContentSig,
} from "../../utils/sync";

type ElementVersionInfo = {
  version: number;
  versionNonce: number;
  updated: number;
  contentSig: string;
};

const getUpdated = (element: any): number =>
  typeof element.updated === "number"
    ? element.updated
    : Number(element.updated) || 0;

export const useEditorElementTracking = () => {
  const elementVersionMap = useRef<Map<string, ElementVersionInfo>>(new Map());

  const recordElementVersion = useCallback((element: any) => {
    elementVersionMap.current.set(element.id, {
      version: element.version ?? 0,
      versionNonce: element.versionNonce ?? 0,
      updated: getUpdated(element),
      contentSig: getElementContentSig(element),
    });
  }, []);

  const hasElementChanged = useCallback((element: any, _status?: unknown) => {
    const previous = elementVersionMap.current.get(element.id);
    if (!previous) return true;
    const nextVersion = element.version ?? 0;
    const nextNonce = element.versionNonce ?? 0;
    const nextUpdated =
      typeof element?.updated === "number"
        ? element.updated
        : Number(element?.updated) || 0;
    return (
      previous.version !== nextVersion ||
      previous.versionNonce !== nextNonce ||
      previous.updated !== nextUpdated ||
      previous.contentSig !== getElementContentSig(element)
    );
  }, []);

  return {
    elementVersionMap,
    hasElementChanged,
    recordElementVersion,
  };
};

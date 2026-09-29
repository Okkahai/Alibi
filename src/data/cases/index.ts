import type { CaseTruth } from "@/lib/schema/case-truth";
import { theVossManorCase } from "./the-voss-manor-case";

export const cases: Record<string, CaseTruth> = {
  [theVossManorCase.id]: theVossManorCase,
};

export function getCaseTruth(id: string): CaseTruth | undefined {
  return cases[id];
}

export { theVossManorCase };

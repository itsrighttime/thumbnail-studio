import { useCallback, useMemo, useState } from "react";
import { FormatStep } from "./components/FormatStep";
import { MappingStep } from "./components/MappingStep";
import { PreviewStep } from "./components/PreviewStep";
import { Stepper } from "./components/Stepper";
import { UploadStep } from "./components/UploadStep";
import { FORMATS } from "./formats";
import {
  autoMap,
  buildItems,
  emptyMapping,
  validateMapping,
} from "./lib/mapping";
import { DEFAULT_BRAND } from "./theme";
import type {
  Brand,
  CodeSettings,
  ExportOptions,
  FieldKey,
  FieldMapping,
  FormatId,
  Mapping,
  ParsedTable,
} from "./types";
import ui from "./styles/ui.module.css";
import styles from "./App.module.css";

const STEPS = ["Format", "Upload", "Map columns", "Preview & export"];

const DEFAULT_CODE: CodeSettings = {
  pattern: "{P}-{D}-{T}-{N:3}",
  platform: "IG",
  start: 1,
  step: 1,
  scope: "all",
};

export default function App() {
  const [step, setStep] = useState(0);
  const [formatId, setFormatId] = useState<FormatId | null>(null);
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Mapping>(emptyMapping);
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND);
  const [code, setCode] = useState<CodeSettings>(DEFAULT_CODE);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    scale: 2,
    type: "png",
  });

  const format = formatId ? FORMATS[formatId] : null;

  const { items, skipped } = useMemo(
    () =>
      table ? buildItems(table, mapping, code) : { items: [], skipped: 0 },
    [table, mapping, code],
  );

  const chooseFormat = useCallback((id: FormatId) => {
    const spec = FORMATS[id];
    setFormatId(id);
    setCode((c) => ({
      ...c,
      pattern: spec.defaultPattern,
      platform: spec.platformCode,
    }));
    setBrand((b) => ({ ...b, showLevelInHeader: spec.showLevelDefault }));
    setExportOptions((o) => ({ ...o, scale: spec.defaultScale }));
  }, []);

  const loadTable = useCallback((parsed: ParsedTable, name: string) => {
    setTable(parsed);
    setFileName(name);
    setMapping(autoMap(parsed.headers));
  }, []);

  const patchMapping = useCallback(
    (key: FieldKey, patch: Partial<FieldMapping>) => {
      setMapping((m) => ({ ...m, [key]: { ...m[key], ...patch } }));
    },
    [],
  );

  const mappingOk = validateMapping(mapping).length === 0 && items.length > 0;
  const canContinue = [!!formatId, !!table, mappingOk, false][step];
  const reachable = !formatId ? 0 : !table ? 1 : !mappingOk ? 2 : 3;

  return (
    <div className={styles.shell}>
      <Stepper
        steps={STEPS}
        current={step}
        reachable={reachable}
        onGo={setStep}
      />

      <main className={styles.panel}>
        {step === 0 && <FormatStep value={formatId} onChange={chooseFormat} />}
        {step === 1 && (
          <UploadStep table={table} fileName={fileName} onLoaded={loadTable} />
        )}
        {step === 2 && format && table && (
          <MappingStep
            format={format}
            table={table}
            mapping={mapping}
            onMapping={patchMapping}
            brand={brand}
            onBrand={(patch) => setBrand((b) => ({ ...b, ...patch }))}
            code={code}
            onCode={(patch) => setCode((c) => ({ ...c, ...patch }))}
            items={items}
            skipped={skipped}
          />
        )}
        {step === 3 && format && (
          <PreviewStep
            format={format}
            items={items}
            brand={brand}
            options={exportOptions}
            onOptions={(patch) => setExportOptions((o) => ({ ...o, ...patch }))}
          />
        )}
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={ui.btn}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ← Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            type="button"
            className={`${ui.btn} ${ui.primary}`}
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue}
          >
            {step === 2 ? "Generate previews →" : "Continue →"}
          </button>
        )}
      </footer>
    </div>
  );
}

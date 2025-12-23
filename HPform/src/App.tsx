import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stepper } from './components/Stepper';
import { InputField } from './components/InputField';
import {
  LuxEebSchema,
  defaultLuxEebValues,
  luxEebFieldMeta,
  luxEebSchema,
} from './types/schema';
import { useAutosave, loadAutosaved } from './hooks/useAutosave';
import { buildLuxEebPacket, copyLuxEebPacket, downloadCsv, downloadJson, generateCsvBundle } from './utils/exporters';
import { beispielBestandEFH } from './utils/sampleData';
import { AlertTriangle, CheckCircle, Download, FileJson, Import, ListChecks, RefreshCcw, Sparkles, Zap } from 'lucide-react';
import clsx from 'clsx';

const steps = [
  'Allgemeine Projektdaten',
  'Opaque Bauteile (O)',
  'Transparente Bauteile (T)',
  'Wärmebrücken',
  'Gebäudehülle',
  'Energiebezugsflächen / Zonen',
  'Lüftung + Luftdichtheit',
  'Sonstige Parameter',
  'Heizungsanlagen',
  'Warmwasserbereitung',
  'Hilfsenergie',
  'Prüfung & Export',
];

function generatePassnummer(data: LuxEebSchema) {
  const heute = new Date();
  const datum = `${heute.getFullYear()}${String(heute.getMonth() + 1).padStart(2, '0')}${String(heute.getDate()).padStart(2, '0')}`;
  const plz = data.Allgemeine_Projektdaten.PLZ_Ort?.split(' ')?.[0];
  const hausnummer = data.Allgemeine_Projektdaten.Straße_Nr;
  const wohneinheiten = data.Allgemeine_Projektdaten.Wohneinheiten;
  if (!plz || !hausnummer || !wohneinheiten) {
    return 'keine Nummer';
  }
  const gebNr = data.Allgemeine_Projektdaten.Nachweisart === 'Neubau (Bauantrag)' ? 1 : 2;
  return `P.${datum}.${plz}.${hausnummer}.${wohneinheiten}.${gebNr}`;
}

function fehlendeAngaben(data: LuxEebSchema) {
  const missing: { title: string; why: string }[] = [];
  if (!data.Allgemeine_Projektdaten.Bezeichnung) {
    missing.push({ title: 'Bezeichnung fehlt', why: 'Needed so the expert can match the project in LuxEeB.' });
  }
  if (!data.Allgemeine_Projektdaten.PLZ_Ort) {
    missing.push({ title: 'PLZ + Ort fehlen', why: 'Required for Passnummer and context.' });
  }
  if (!data.Allgemeine_Projektdaten.Straße_Nr) {
    missing.push({ title: 'Straße/Nr fehlt', why: 'Street/house number completes the certificate number.' });
  }
  if (!data.Allgemeine_Projektdaten.Wohneinheiten) {
    missing.push({ title: 'Wohneinheiten fehlen', why: 'Used in Passnummer and feasibility sizing.' });
  }
  if (!data.Lüftung.Anlagen.length) {
    missing.push({ title: 'Keine Lüftungsanlage', why: 'LuxEeB requires either ventilation details or defaults.' });
  }
  if (!data.Heizungsanlagen.length) {
    missing.push({ title: 'Heizungsanlage fehlt', why: 'Heating system drives heat pump feasibility.' });
  }
  return missing;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="step-card">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EingabeUebersicht({ data }: { data: LuxEebSchema }) {
  const rows: { label: string; value: string; help?: string }[] = [];
  rows.push({
    label: luxEebFieldMeta['Allgemeine_Projektdaten.Bezeichnung'].label_de,
    value: data.Allgemeine_Projektdaten.Bezeichnung,
    help: luxEebFieldMeta['Allgemeine_Projektdaten.Bezeichnung'].help_en,
  });
  rows.push({
    label: luxEebFieldMeta['Allgemeine_Projektdaten.Passnummer'].label_de,
    value: data.Allgemeine_Projektdaten.Passnummer ?? 'keine Nummer',
    help: luxEebFieldMeta['Allgemeine_Projektdaten.Passnummer'].help_en,
  });
  rows.push({
    label: luxEebFieldMeta['Allgemeine_Projektdaten.Gebäudetyp'].label_de,
    value: data.Allgemeine_Projektdaten.Gebäudetyp,
    help: luxEebFieldMeta['Allgemeine_Projektdaten.Gebäudetyp'].help_en,
  });
  rows.push({
    label: luxEebFieldMeta['Heizungsanlagen'].label_de,
    value: `${data.Heizungsanlagen.length} Systeme erfasst`,
    help: luxEebFieldMeta['Heizungsanlagen'].help_en,
  });
  rows.push({
    label: luxEebFieldMeta['Lüftung.Anlagen'].label_de,
    value: `${data.Lüftung.Anlagen.length} Anlagen / n=${data.Lüftung.energetischer_Luftwechsel_n_1_h ?? '–'} 1/h`,
    help: luxEebFieldMeta['Lüftung.Anlagen'].help_en,
  });

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-100 px-3 py-2 text-sm font-semibold">Eingabe-Übersicht (Kurzfassung)</div>
      <dl className="divide-y divide-slate-200">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
            <dt className="font-semibold text-slate-800">{row.label}</dt>
            <dd className="col-span-2 text-slate-900">{row.value}</dd>
            {row.help && <dd className="col-span-3 text-xs text-slate-500">{row.help}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

function NumberInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="number" step="any" {...props} />;
}

export default function App() {
  const autosaved = loadAutosaved();
  const methods = useForm<LuxEebSchema>({
    resolver: zodResolver(luxEebSchema),
    defaultValues: autosaved ?? defaultLuxEebValues,
    mode: 'onBlur',
  });
  const [simpleMode, setSimpleMode] = useState(true);
  const [step, setStep] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const values = useWatch({ control: methods.control });
  useAutosave(values as LuxEebSchema);

  useEffect(() => {
    if (!values.Allgemeine_Projektdaten.Passnummer) {
      const auto = generatePassnummer(values as LuxEebSchema);
      methods.setValue('Allgemeine_Projektdaten.Passnummer', auto === 'keine Nummer' ? undefined : auto);
    }
  }, [values.Allgemeine_Projektdaten.PLZ_Ort, values.Allgemeine_Projektdaten.Straße_Nr, values.Allgemeine_Projektdaten.Wohneinheiten]);

  const { control, register, reset } = methods;

  const opaqueArray = useFieldArray({ control, name: 'Opaque_Bauteile' });
  const transparentArray = useFieldArray({ control, name: 'Transparente_Bauteile' });
  const flaechenArray = useFieldArray({ control, name: 'Gebäudehülle.Flächen' });
  const zonenArray = useFieldArray({ control, name: 'Energiebezugsflächen_Zonen.Zonen' });
  const lueftungArray = useFieldArray({ control, name: 'Lüftung.Anlagen' });
  const heizungArray = useFieldArray({ control, name: 'Heizungsanlagen' });
  const dhwArray = useFieldArray({ control, name: 'Warmwasserbereitung' });

  const missing = useMemo(() => fehlendeAngaben(values as LuxEebSchema), [values]);

  const handleImport = async (file?: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      reset(parsed);
      setImportError(null);
    } catch (e) {
      setImportError('Import fehlgeschlagen (JSON prüfen)');
    }
  };

  const handleStandardRestore = () => reset(defaultLuxEebValues);
  const handleLoadSample = () => reset(beispielBestandEFH);

  return (
    <FormProvider {...methods}>
      <main className="app-shell">
        <header className="hero-panel">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-md">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/70">LuxEeB Intake</p>
                  <h1 className="text-2xl font-bold text-white">HPform</h1>
                  <p className="text-sm text-white/80">German labels, English guidance. Autosaves locally.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                <div className="stat-pill">
                  <span className="text-xs uppercase tracking-wide text-white/80">Passnummer</span>
                  <span className="text-sm font-semibold">{values.Allgemeine_Projektdaten.Passnummer ?? 'keine Nummer'}</span>
                </div>
                <div className={clsx('stat-pill', missing.length === 0 ? 'bg-emerald-500/25 border-emerald-200 text-white' : 'bg-amber-400/25 border-amber-200 text-white')}>
                  {missing.length === 0 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <span>{missing.length === 0 ? 'Bereit für Export' : `${missing.length} Angaben fehlen`}</span>
                </div>
                <div className="stat-pill">
                  <span className="h-2 w-2 rounded-full bg-white/80" />
                  <span>{simpleMode ? 'Simple Modus' : 'Advanced Modus'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="button-secondary flex items-center gap-2" type="button" onClick={handleStandardRestore}>
                <RefreshCcw size={16} /> Standardwert wiederherstellen
              </button>
              <button className="button-secondary flex items-center gap-2" type="button" onClick={handleLoadSample}>
                <Zap size={16} /> Beispieldaten laden
              </button>
              <label className="button-secondary cursor-pointer flex items-center gap-2">
                <Import size={16} /> JSON importieren
                <input type="file" className="hidden" accept="application/json" onChange={(e) => handleImport(e.target.files?.[0])} />
              </label>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white text-sm font-semibold">
                <span className="text-xs uppercase tracking-wide">Modus</span>
                <button
                  className={clsx('px-3 py-1 rounded-full text-xs font-semibold transition', simpleMode ? 'bg-white text-sky-700 shadow-sm' : 'bg-white/10 text-white border border-white/30')}
                  type="button"
                  onClick={() => setSimpleMode(true)}
                >
                  Simple
                </button>
                <button
                  className={clsx('px-3 py-1 rounded-full text-xs font-semibold transition', !simpleMode ? 'bg-white text-sky-700 shadow-sm' : 'bg-white/10 text-white border border-white/30')}
                  type="button"
                  onClick={() => setSimpleMode(false)}
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <Stepper steps={steps} current={step} onStepClick={setStep} />
          <form className="space-y-4">
            {step === 0 && (
              <SectionCard title="Allgemeine Projektdaten">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField meta={luxEebFieldMeta['Allgemeine_Projektdaten.Bezeichnung']} {...register('Allgemeine_Projektdaten.Bezeichnung')} />
                  <div>
                    <label className="text-sm font-semibold">Nachweisart</label>
                    <select {...register('Allgemeine_Projektdaten.Nachweisart')} className="w-full mt-1">
                      <option>Neubau (Bauantrag)</option>
                      <option>Bestand</option>
                      <option>Sonstige</option>
                    </select>
                    <p className="text-xs text-slate-500">Select according to LuxEeB start screen.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Gebäudetyp</label>
                    <select {...register('Allgemeine_Projektdaten.Gebäudetyp')} className="w-full mt-1">
                      <option>Wohnen EFH</option>
                      <option>Wohnen MFH</option>
                      <option>Sonstiges</option>
                    </select>
                    <p className="text-xs text-slate-500">German labels only.</p>
                  </div>
                  <NumberInput placeholder="Wohneinheiten" {...register('Allgemeine_Projektdaten.Wohneinheiten', { valueAsNumber: true })} />
                  <input placeholder="Straße + Nr." {...register('Allgemeine_Projektdaten.Straße_Nr')} />
                  <input placeholder="PLZ Ort" {...register('Allgemeine_Projektdaten.PLZ_Ort')} />
                  <NumberInput placeholder="Baujahr Gebäude" {...register('Allgemeine_Projektdaten.Baujahr_Gebäude', { valueAsNumber: true })} />
                  <NumberInput placeholder="Baujahr Heizungsanlage" {...register('Allgemeine_Projektdaten.Baujahr_Heizungsanlage', { valueAsNumber: true })} />
                  <textarea placeholder="Hinweise" className="md:col-span-2" {...register('Allgemeine_Projektdaten.Hinweise')} />
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="font-semibold">Passnummer:</span>
                    <span className="px-3 py-2 rounded-md bg-slate-100">
                      {values.Allgemeine_Projektdaten.Passnummer ?? 'keine Nummer'}
                    </span>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() =>
                        methods.setValue(
                          'Allgemeine_Projektdaten.Passnummer',
                          generatePassnummer(values as LuxEebSchema) === 'keine Nummer'
                            ? undefined
                            : generatePassnummer(values as LuxEebSchema)
                        )
                      }
                    >
                      Passnummer neu erzeugen
                    </button>
                    <p className="text-xs text-slate-500">Auto format: P.YYYYMMDD.PLZ.Hausnummer.WE.GebäudeNr</p>
                  </div>
                </div>
              </SectionCard>
            )}

            {step === 1 && (
              <SectionCard title="Opaque Bauteile (Bauteile O)">
                <div className="space-y-4">
                  {opaqueArray.fields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Bauteil {index + 1}</h3>
                        <button className="text-sm text-red-600" type="button" onClick={() => opaqueArray.remove(index)}>
                          entfernen
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input placeholder="Nr" {...register(`Opaque_Bauteile.${index}.Nr` as const)} />
                        <input placeholder="Bezeichnung" {...register(`Opaque_Bauteile.${index}.Bezeichnung` as const)} />
                        <select {...register(`Opaque_Bauteile.${index}.Situation` as const)}>
                          <option>Außen</option>
                          <option>gegen Erdreich</option>
                          <option>gegen unbeheizt</option>
                          <option>gegen beheizt</option>
                        </select>
                        <select {...register(`Opaque_Bauteile.${index}.Methode` as const)}>
                          <option>U-Wert Berechnung</option>
                          <option>manuelle Eingabe</option>
                          <option>typische U-Werte Bestand</option>
                        </select>
                        <NumberInput placeholder="U-Wert W/m²K" {...register(`Opaque_Bauteile.${index}.U_Wert_W_m2K` as const, { valueAsNumber: true })} />
                        {!simpleMode && (
                          <NumberInput placeholder="Fθ,i" {...register(`Opaque_Bauteile.${index}.Ftheta_i` as const, { valueAsNumber: true })} />
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className="button-secondary" onClick={() => opaqueArray.append({
                    Nr: `ME${opaqueArray.fields.length + 1}`,
                    Bezeichnung: 'Neue Konstruktion',
                    Situation: 'Außen',
                    Methode: 'manuelle Eingabe',
                  })}>
                    Neues Bauteil hinzufügen
                  </button>
                </div>
              </SectionCard>
            )}

            {step === 2 && (
              <SectionCard title="Transparente Bauteile (Bauteile T)">
                <div className="space-y-4">
                  {transparentArray.fields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Element {index + 1}</h3>
                        <button className="text-sm text-red-600" type="button" onClick={() => transparentArray.remove(index)}>
                          entfernen
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input placeholder="Nr" {...register(`Transparente_Bauteile.${index}.Nr` as const)} />
                        <input placeholder="Bezeichnung" {...register(`Transparente_Bauteile.${index}.Bezeichnung` as const)} />
                        <select {...register(`Transparente_Bauteile.${index}.Situation` as const)}>
                          <option>Außen</option>
                          <option>gegen unbeheizt</option>
                          <option>gegen beheizt</option>
                        </select>
                        <select {...register(`Transparente_Bauteile.${index}.Eingabeart` as const)}>
                          <option>EN_10077-1_Schätzung</option>
                          <option>manuelle Eingabe</option>
                        </select>
                        <NumberInput placeholder="Breite m" {...register(`Transparente_Bauteile.${index}.Breite_m` as const, { valueAsNumber: true })} />
                        <NumberInput placeholder="Höhe m" {...register(`Transparente_Bauteile.${index}.Höhe_m` as const, { valueAsNumber: true })} />
                        <NumberInput placeholder="Ug W/m²K" {...register(`Transparente_Bauteile.${index}.Ug_W_m2K` as const, { valueAsNumber: true })} />
                        <NumberInput placeholder="Uf W/m²K" {...register(`Transparente_Bauteile.${index}.Uf_W_m2K` as const, { valueAsNumber: true })} />
                        <NumberInput placeholder="Psi Glas/Rahmen W/mK" {...register(`Transparente_Bauteile.${index}.Psi_Glas_Rahmen_W_mK` as const, { valueAsNumber: true })} />
                        {!simpleMode && (
                          <NumberInput placeholder="g-Wert" {...register(`Transparente_Bauteile.${index}.g_Wert` as const, { valueAsNumber: true })} />
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className="button-secondary" onClick={() => transparentArray.append({
                    Nr: `FE${transparentArray.fields.length + 1}`,
                    Bezeichnung: 'Fenster',
                    Situation: 'Außen',
                    Eingabeart: 'EN_10077-1_Schätzung',
                  })}>
                    Neues Fenster hinzufügen
                  </button>
                </div>
              </SectionCard>
            )}

            {step === 3 && (
              <SectionCard title="Wärmebrücken">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold">Methode</label>
                    <select {...register('Wärmebrücken.Methode')} className="w-full mt-1">
                      <option>Pauschal</option>
                      <option>detailliert_EN_ISO_10211</option>
                    </select>
                    <p className="text-xs text-slate-500">Choose simplified delta UWB or detailed Psi list.</p>
                  </div>
                  <NumberInput placeholder="DeltaUWB W/m²K" {...register('Wärmebrücken.DeltaUWB_W_m2K', { valueAsNumber: true })} />
                </div>
                {!simpleMode && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Lineare Wärmebrücken (detailliert)</h4>
                    <p className="text-xs text-slate-500 mb-2">Use when Methode = detailliert_EN_ISO_10211.</p>
                    <div className="space-y-2">
                      <div className="text-xs text-slate-600">(Für MVP bitte direkt in JSON ergänzen wenn nötig.)</div>
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {step === 4 && (
              <SectionCard title="Gebäudehülle (Flächen, Abzug, Orientierung)">
                <div className="mb-3">
                  <label className="text-sm font-semibold">Rotation</label>
                  <select {...register('Gebäudehülle.Rotation_Grad')} className="w-full mt-1">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">Matches LuxEeB orientation rotation.</p>
                </div>
                <div className="space-y-4">
                  {flaechenArray.fields.map((field, index) => {
                    const area = (values.Gebäudehülle.Flächen?.[index]?.Anzahl ?? 0) * (values.Gebäudehülle.Flächen?.[index]?.Breite_m ?? 0) * (values.Gebäudehülle.Flächen?.[index]?.Länge_m ?? 0);
                    return (
                      <div key={field.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold">Fläche {index + 1}</h3>
                          <button className="text-sm text-red-600" type="button" onClick={() => flaechenArray.remove(index)}>
                            entfernen
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <select {...register(`Gebäudehülle.Flächen.${index}.Typ` as const)}>
                            <option>O</option>
                            <option>T</option>
                          </select>
                          <input placeholder="Bauteil Nr" {...register(`Gebäudehülle.Flächen.${index}.Bauteil_Nr` as const)} />
                          <NumberInput placeholder="Anzahl" {...register(`Gebäudehülle.Flächen.${index}.Anzahl` as const, { valueAsNumber: true })} />
                          <NumberInput placeholder="Breite m" {...register(`Gebäudehülle.Flächen.${index}.Breite_m` as const, { valueAsNumber: true })} />
                          <NumberInput placeholder="Länge m" {...register(`Gebäudehülle.Flächen.${index}.Länge_m` as const, { valueAsNumber: true })} />
                          <select {...register(`Gebäudehülle.Flächen.${index}.Orientierung` as const)}>
                            {['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'].map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" {...register(`Gebäudehülle.Flächen.${index}.Abzug` as const)} /> Abzug
                          </label>
                          {!simpleMode && (
                            <NumberInput placeholder="Fθ,i" {...register(`Gebäudehülle.Flächen.${index}.Ftheta_i` as const, { valueAsNumber: true })} />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Automatische Fläche: {area.toFixed(2)} m²</p>
                      </div>
                    );
                  })}
                  <button type="button" className="button-secondary" onClick={() => flaechenArray.append({
                    Typ: 'O',
                    Bauteil_Nr: '',
                    Anzahl: 1,
                    Breite_m: 1,
                    Länge_m: 1,
                    Orientierung: 'Nord',
                  })}>
                    Neue Fläche hinzufügen
                  </button>
                </div>
              </SectionCard>
            )}

            {step === 5 && (
              <SectionCard title="Energiebezugsflächen / Zonen">
                <div className="space-y-4">
                  {zonenArray.fields.map((zone, zIndex) => (
                    <div key={zone.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <input placeholder="Zonenbezeichnung" {...register(`Energiebezugsflächen_Zonen.Zonen.${zIndex}.Zonenbezeichnung` as const)} className="font-semibold" />
                        <button className="text-sm text-red-600" type="button" onClick={() => zonenArray.remove(zIndex)}>
                          Zone entfernen
                        </button>
                      </div>
                      <ZoneRooms control={control} zoneIndex={zIndex} register={register} simpleMode={simpleMode} />
                    </div>
                  ))}
                  <button className="button-secondary" type="button" onClick={() => zonenArray.append({ Zonenbezeichnung: 'Neue Zone', Räume: [] })}>
                    Zone hinzufügen
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <NumberInput placeholder="Gebäudevolumen Ve m³" {...register('Energiebezugsflächen_Zonen.Gebäudevolumen_Ve_m3', { valueAsNumber: true })} />
                    <NumberInput placeholder="Energiebezugsfläche An m²" {...register('Energiebezugsflächen_Zonen.Energiebezugsfläche_An_m2', { valueAsNumber: true })} />
                  </div>
                </div>
              </SectionCard>
            )}

            {step === 6 && (
              <SectionCard title="Lüftung + Luftdichtheit">
                <div className="space-y-4">
                  {lueftungArray.fields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <input {...register(`Lüftung.Anlagen.${index}.Bezeichnung_der_Anlage` as const)} className="font-semibold" />
                        <button type="button" className="text-sm text-red-600" onClick={() => lueftungArray.remove(index)}>
                          entfernen
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <NumberInput placeholder="Vn,i m³" {...register(`Lüftung.Anlagen.${index}.Versorgtes_Raumluftvolumen_Vn_i_m3` as const, { valueAsNumber: true })} />
                        <NumberInput placeholder="Volumenstrom VL m³/h" {...register(`Lüftung.Anlagen.${index}.Volumenstrom_VL_i_m3h` as const, { valueAsNumber: true })} />
                        <NumberInput placeholder="WRG η %" {...register(`Lüftung.Anlagen.${index}.Wirkungsgrad_WRG_nr_i_pct` as const, { valueAsNumber: true })} />
                        {!simpleMode && (
                          <NumberInput placeholder="Spez. Leistungsaufnahme" {...register(`Lüftung.Anlagen.${index}.spezifische_Leistungsaufnahme_qL_Wh_m3h` as const, { valueAsNumber: true })} />
                        )}
                        {!simpleMode && (
                          <NumberInput placeholder="nᵢ 1/h" {...register(`Lüftung.Anlagen.${index}.mittlere_Luftwechselrate_n_i_1_h` as const, { valueAsNumber: true })} />
                        )}
                      </div>
                      <p className="text-xs text-amber-700 mt-1">Warnung: LuxEeB markiert zu geringe Volumenströme rot – bitte plausibilisieren.</p>
                    </div>
                  ))}
                  <button type="button" className="button-secondary" onClick={() => lueftungArray.append({ Bezeichnung_der_Anlage: 'Neue Anlage' })}>
                    Anlage hinzufügen
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    <NumberInput placeholder="Restluftvolumen Vr m³" {...register('Lüftung.Restluftvolumen_Vr_m3', { valueAsNumber: true })} />
                    <NumberInput placeholder="energetischer Luftwechsel n 1/h" {...register('Lüftung.energetischer_Luftwechsel_n_1_h', { valueAsNumber: true })} />
                    <label className="text-sm font-semibold">Schutzklasse</label>
                    <select {...register('Lüftung.Luftdichtheit.Schutzklasse')} className="md:col-span-2">
                      <option>keine</option>
                      <option>mittel</option>
                      <option>hoch</option>
                    </select>
                    <NumberInput placeholder="n50 1/h" {...register('Lüftung.Luftdichtheit.n50_1_h', { valueAsNumber: true })} />
                    <select {...register('Lüftung.Luftdichtheit.Schutzkoeffizient_e')}>
                      <option value="0.10">0.10</option>
                      <option value="0.07">0.07</option>
                      <option value="0.04">0.04</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" {...register('Lüftung.Luftdichtheit.EWT')} /> EWT vorhanden
                    </label>
                  </div>
                </div>
              </SectionCard>
            )}

            {step === 7 && (
              <SectionCard title="Sonstige Parameter">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input placeholder="Klimadaten" {...register('Sonstige_Parameter.Klimadaten')} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...register('Sonstige_Parameter.Wärmebrücken_berücksichtigen')} /> Wärmebrücken berücksichtigen
                  </label>
                  <input placeholder="Reduktionen" {...register('Sonstige_Parameter.Reduktionen')} />
                  <NumberInput placeholder="Regelungsparameter FG" {...register('Sonstige_Parameter.Regelungsparameter_FG', { valueAsNumber: true })} />
                  <input placeholder="Bauweise" {...register('Sonstige_Parameter.Bauweise')} />
                </div>
              </SectionCard>
            )}

            {step === 8 && (
              <SectionCard title="Heizungsanlagen">
                <div className="space-y-4">
                  {heizungArray.fields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">System {index + 1}</h3>
                        <button type="button" className="text-sm text-red-600" onClick={() => heizungArray.remove(index)}>
                          entfernen
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select {...register(`Heizungsanlagen.${index}.Modus` as const)}>
                          <option>Bestand_vereinfacht</option>
                          <option>detailliert</option>
                        </select>
                        <select {...register(`Heizungsanlagen.${index}.Systemwahl` as const)}>
                          <option>Warmwasser</option>
                          <option>Warmluft</option>
                          <option>Einzelfeuerstätte</option>
                        </select>
                        <input placeholder="Wärmeerzeuger" {...register(`Heizungsanlagen.${index}.Wärmeerzeuger` as const)} />
                        <input placeholder="Energieträger" {...register(`Heizungsanlagen.${index}.Energieträger` as const)} />
                        <input placeholder="Systemauswahl" {...register(`Heizungsanlagen.${index}.Systemauswahl` as const)} />
                        {!simpleMode && (
                          <input placeholder="Untersystem" {...register(`Heizungsanlagen.${index}.Untersystem` as const)} />
                        )}
                      </div>
                      <div className="mt-3">
                        <h4 className="font-semibold text-sm mb-2">Wärmepumpe Vorprüfung</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <select {...register(`Heizungsanlagen.${index}.Wärmepumpe_Vorprüfung.Ziel_Vorlauftemperatur_C` as const)}>
                            <option value="35">35</option>
                            <option value="45">45</option>
                            <option value="55">55</option>
                          </select>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" {...register(`Heizungsanlagen.${index}.Wärmepumpe_Vorprüfung.Aufstellmoeglichkeit_Aussengeraet` as const)} /> Aufstellmöglichkeit Außengerät
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" {...register(`Heizungsanlagen.${index}.Wärmepumpe_Vorprüfung.Pufferspeicher_Platz` as const)} /> Pufferspeicher Platz
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" {...register(`Heizungsanlagen.${index}.Wärmepumpe_Vorprüfung.Kondensatablauf` as const)} /> Kondensatablauf möglich
                          </label>
                        </div>
                        {!simpleMode && (
                          <div className="mt-2 text-xs text-slate-600">Ergänze Heizkörperliste für detaillierte Vorprüfung.</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button className="button-secondary" type="button" onClick={() => heizungArray.append({ Modus: 'Bestand_vereinfacht', Systemwahl: 'Warmwasser' })}>
                    Heizsystem hinzufügen
                  </button>
                </div>
              </SectionCard>
            )}

            {step === 9 && (
              <SectionCard title="Warmwasserbereitung">
                <div className="space-y-4">
                  {dhwArray.fields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">DHW System {index + 1}</h3>
                        <button className="text-sm text-red-600" type="button" onClick={() => dhwArray.remove(index)}>
                          entfernen
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select {...register(`Warmwasserbereitung.${index}.Modus` as const)}>
                          <option>Bestand_vereinfacht</option>
                          <option>detailliert</option>
                        </select>
                        <input placeholder="System" {...register(`Warmwasserbereitung.${index}.Auswahl_eines_System` as const)} />
                        <input placeholder="Wärmeerzeuger" {...register(`Warmwasserbereitung.${index}.Wärmeerzeuger` as const)} />
                        <select {...register(`Warmwasserbereitung.${index}.Art_der_Trinkwasserversorgung` as const)}>
                          <option>zentral</option>
                          <option>dezentral</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" {...register(`Warmwasserbereitung.${index}.Zirkulation` as const)} /> Zirkulation
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" {...register(`Warmwasserbereitung.${index}.Solaranlage` as const)} /> Solaranlage
                        </label>
                      </div>
                    </div>
                  ))}
                  <button className="button-secondary" type="button" onClick={() => dhwArray.append({ Modus: 'Bestand_vereinfacht' })}>
                    Warmwasser-System hinzufügen
                  </button>
                </div>
              </SectionCard>
            )}

            {step === 10 && (
              <SectionCard title="Hilfsenergie">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select {...register('Hilfsenergie.Energieform')}>
                    <option>Strommix</option>
                    <option>Sonstige</option>
                  </select>
                </div>
              </SectionCard>
            )}

            {step === 11 && (
              <SectionCard title="Prüfung & Export">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ListChecks size={18} className="text-amber-600" />
                      <h3 className="font-semibold">Fehlende Angaben</h3>
                    </div>
                    {missing.length === 0 && (
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle size={16} /> Alle Pflichtfelder ausgefüllt
                      </div>
                    )}
                    <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                      {missing.map((item) => (
                        <li key={item.title}>
                          <span className="font-semibold">{item.title}.</span> {item.why}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <EingabeUebersicht data={values as LuxEebSchema} />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="button-primary flex items-center gap-2"
                    onClick={() => copyLuxEebPacket(values as LuxEebSchema)}
                  >
                    <Zap size={18} /> LuxEeB Eingabepaket kopieren
                  </button>
                  <button
                    type="button"
                    className="button-secondary flex items-center gap-2"
                    onClick={() => downloadJson(buildLuxEebPacket(values as LuxEebSchema), 'LuxEeB_Eingabepaket.json')}
                  >
                    <FileJson size={18} /> JSON herunterladen
                  </button>
                  <button
                    type="button"
                    className="button-secondary flex items-center gap-2"
                    onClick={() => {
                      const bundle = generateCsvBundle(values as LuxEebSchema);
                      bundle.forEach((item) => downloadCsv(item.content, item.filename));
                    }}
                  >
                    <Download size={18} /> CSV-Bundle herunterladen
                  </button>
                </div>
                {importError && <p className="text-sm text-red-600 mt-2">{importError}</p>}
              </SectionCard>
            )}
          </form>
          <div className="flex justify-between mt-6">
            <button type="button" className="button-secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Zurück
            </button>
            <div className="flex gap-2">
              <button type="button" className="button-secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Schritt zurück
              </button>
              <button type="button" className="button-primary" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
                Weiter
              </button>
            </div>
          </div>
        </div>
      </main>
    </FormProvider>
  );
}

function ZoneRooms({ control, zoneIndex, register, simpleMode }: any) {
  const roomsArray = useFieldArray({ control, name: `Energiebezugsflächen_Zonen.Zonen.${zoneIndex}.Räume` });
  return (
    <div className="space-y-2">
      {roomsArray.fields.map((room, rIndex) => (
        <div key={room.id} className="border border-slate-200 rounded-md p-2">
          <div className="flex justify-between items-center mb-2">
            <input placeholder="Raumbezeichnung" {...register(`Energiebezugsflächen_Zonen.Zonen.${zoneIndex}.Räume.${rIndex}.Raumbezeichnung` as const)} />
            <button className="text-xs text-red-600" type="button" onClick={() => roomsArray.remove(rIndex)}>
              entfernen
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <NumberInput placeholder="Breite m" {...register(`Energiebezugsflächen_Zonen.Zonen.${zoneIndex}.Räume.${rIndex}.Breite_m` as const, { valueAsNumber: true })} />
            <NumberInput placeholder="Länge m" {...register(`Energiebezugsflächen_Zonen.Zonen.${zoneIndex}.Räume.${rIndex}.Länge_m` as const, { valueAsNumber: true })} />
            <NumberInput placeholder="Höhe m" {...register(`Energiebezugsflächen_Zonen.Zonen.${zoneIndex}.Räume.${rIndex}.Höhe_m` as const, { valueAsNumber: true })} />
            <NumberInput placeholder="An m²" {...register(`Energiebezugsflächen_Zonen.Zonen.${zoneIndex}.Räume.${rIndex}.An_m2` as const, { valueAsNumber: true })} />
            {!simpleMode && (
              <NumberInput placeholder="Ve m³" {...register(`Energiebezugsflächen_Zonen.Zonen.${zoneIndex}.Räume.${rIndex}.Ve_m3` as const, { valueAsNumber: true })} />
            )}
          </div>
        </div>
      ))}
      <button className="button-secondary" type="button" onClick={() => roomsArray.append({ Raumbezeichnung: 'Neuer Raum' })}>
        Raum hinzufügen
      </button>
    </div>
  );
}

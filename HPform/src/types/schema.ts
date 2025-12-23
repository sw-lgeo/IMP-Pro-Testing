import { z } from 'zod';

export type FieldMeta = {
  label_de: string;
  help_en: string;
  unit?: string;
};

export const luxEebFieldMeta: Record<string, FieldMeta> = {
  'Allgemeine_Projektdaten.Bezeichnung': {
    label_de: 'Bezeichnung',
    help_en: 'Project name as it should appear in LuxEeB.',
  },
  'Allgemeine_Projektdaten.Gebäudetyp': {
    label_de: 'Gebäudetyp',
    help_en: 'Building category needed for LuxEeB start screen.',
  },
  'Allgemeine_Projektdaten.Nachweisart': {
    label_de: 'Nachweisart',
    help_en: 'Whether the project is new build or existing building.',
  },
  'Allgemeine_Projektdaten.Passnummer': {
    label_de: 'Passnummer',
    help_en: 'Auto-generated certificate number placeholder; shows "keine Nummer" if missing.',
  },
  'Allgemeine_Projektdaten.Baujahr_Gebäude': {
    label_de: 'Baujahr Gebäude',
    help_en: 'Construction year helps with default U-values.',
    unit: 'Jahr',
  },
  'Allgemeine_Projektdaten.Baujahr_Heizungsanlage': {
    label_de: 'Baujahr Heizungsanlage',
    help_en: 'Required for Bestandsgebäude to reflect system age.',
    unit: 'Jahr',
  },
  'Opaque_Bauteile': {
    label_de: 'Bauteile O',
    help_en: 'Opaque construction assemblies with U-values or layer build-ups.',
  },
  'Transparente_Bauteile': {
    label_de: 'Bauteile T',
    help_en: 'Transparent elements such as windows with EN 10077-1 inputs.',
  },
  'Wärmebrücken.Methode': {
    label_de: 'Wärmebrücken Methode',
    help_en: 'Choose simplified (Pauschal) or detailed EN ISO 10211.',
  },
  'Gebäudehülle.Flächen': {
    label_de: 'Flächen',
    help_en: 'Surface entries including orientation and deductions.',
  },
  'Energiebezugsflächen_Zonen.Zonen': {
    label_de: 'Zonen',
    help_en: 'Zones and rooms used to aggregate An and Ve.',
  },
  'Lüftung.Anlagen': {
    label_de: 'Lüftungsanlagen',
    help_en: 'Ventilation systems with volume flows and efficiencies.',
  },
  'Lüftung.Luftdichtheit': {
    label_de: 'Luftdichtheit',
    help_en: 'Air tightness test values and Schutzklasse.',
  },
  'Sonstige_Parameter.Klimadaten': {
    label_de: 'Klimadaten',
    help_en: 'Climate dataset reference.',
  },
  'Heizungsanlagen': {
    label_de: 'Heizungsanlagen',
    help_en: 'Heating systems with simplified or detailed mode.',
  },
  'Warmwasserbereitung': {
    label_de: 'Warmwasserbereitung',
    help_en: 'Domestic hot water systems.',
  },
  'Hilfsenergie.Energieform': {
    label_de: 'Energieform',
    help_en: 'Auxiliary energy type (electricity mix).',
  },
};

const opaqueLayer = z.object({
  Material: z.string().optional(),
  lambda_W_mK: z.number().optional(),
  Dicke_cm: z.number().optional(),
  Flächenanteil_pct: z.number().optional(),
});

const transparentElement = z.object({
  Nr: z.string(),
  Bezeichnung: z.string(),
  Situation: z.enum(['Außen', 'gegen unbeheizt', 'gegen beheizt']),
  Eingabeart: z.enum(['EN_10077-1_Schätzung', 'manuelle Eingabe']),
  Breite_m: z.number().optional(),
  Höhe_m: z.number().optional(),
  Ug_W_m2K: z.number().optional(),
  Uf_W_m2K: z.number().optional(),
  Psi_Glas_Rahmen_W_mK: z.number().optional(),
  Fenstertyp: z.enum(['Einfach', 'Mehrfach', 'Sprossen']).optional(),
  Scheibenzahl: z.number().optional(),
  U_Wert_W_m2K: z.number().optional(),
  Glasflächenanteil_pct: z.number().optional(),
  g_Wert: z.number().optional(),
  Ftheta_i: z.number().optional(),
});

const opaqueElement = z.object({
  Nr: z.string(),
  Bezeichnung: z.string(),
  Situation: z.enum(['Außen', 'gegen Erdreich', 'gegen unbeheizt', 'gegen beheizt']),
  U_Wert_W_m2K: z.number().optional(),
  Methode: z.enum(['U-Wert Berechnung', 'manuelle Eingabe', 'typische U-Werte Bestand']),
  Schichten: z.array(opaqueLayer).optional(),
  Erdreich_Parameter: z
    .object({
      Tiefe_T_m: z.number().optional(),
      Umfang_P_m: z.number().optional(),
      Fläche_A_m2: z.number().optional(),
    })
    .optional(),
  Ftheta_i: z.number().optional(),
});

const flaeche = z.object({
  Typ: z.enum(['O', 'T']),
  Bauteil_Nr: z.string(),
  Anzahl: z.number(),
  Breite_m: z.number(),
  Länge_m: z.number(),
  Orientierung: z.enum(['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest']),
  Fläche_m2: z.number().optional(),
  Abzug: z.boolean().optional(),
  Ftheta_i: z.number().optional(),
  Verschattung: z
    .object({
      Modus: z.enum(['keine', 'Bestand_vereinfachte_Auswahl', 'Neubau_detailliert']),
      Überstand_m: z.number().optional(),
      Abstand_zur_Fenstermitte_m: z.number().optional(),
      Ausragung_m: z.number().optional(),
      Seitenblende_links_m: z.number().optional(),
      Seitenblende_rechts_m: z.number().optional(),
      Umgebung_Faktor: z.number().optional(),
      feste_Verschattung: z.boolean().optional(),
      Monatswerte_Okt_bis_Apr_Mittel: z.number().optional(),
    })
    .optional(),
});

const linearWB = z.object({
  Bezeichnung: z.string(),
  Lage: z.string(),
  Länge_m: z.number(),
  Psi_W_mK: z.number(),
  Ftheta_i: z.number().optional(),
});

const lueftungsAnlage = z.object({
  Bezeichnung_der_Anlage: z.string(),
  Versorgtes_Raumluftvolumen_Vn_i_m3: z.number().optional(),
  Volumenstrom_VL_i_m3h: z.number().optional(),
  Vollbetriebszeit_tB_H_h_d: z.number().optional(),
  Betriebsvolumenstrom_VL_m_i_m3h: z.number().optional(),
  Wirkungsgrad_WRG_nr_i_pct: z.number().optional(),
  spezifische_Leistungsaufnahme_qL_Wh_m3h: z.number().optional(),
  mittlere_Luftwechselrate_n_i_1_h: z.number().optional(),
});

const heizkoerper = z.object({
  Raumbezeichnung: z.string(),
  Typ: z.enum(['Plattenheizkörper', 'Gussradiator', 'Fußbodenheizung', 'Gebläsekonvektor', 'Sonstiges']),
  Leistung_W_bei_75_65_20: z.number().optional(),
  Hinweis: z.string().optional(),
});

const heizung = z.object({
  Modus: z.enum(['Bestand_vereinfacht', 'detailliert']),
  Systemwahl: z.enum(['Warmwasser', 'Warmluft', 'Einzelfeuerstätte']),
  Systemauswahl: z.string().optional(),
  Lage_der_Hauptverteilung: z.enum(['innerhalb', 'außerhalb', 'unbeheizt']).optional(),
  Lage_der_Verteilungsstränge: z.enum(['innerhalb', 'außerhalb', 'unbeheizt']).optional(),
  Wärmeschutz_der_Rohrleitungen: z.enum(['gut', 'mittel', 'schlecht']).optional(),
  Wärmeerzeuger: z.string().optional(),
  Untersystem: z.string().optional(),
  Energieträger: z.string().optional(),
  Anzahl_der_Wärmeerzeuger: z.number().optional(),
  Deckungsanteil_cH_1: z.number().optional(),
  Anteiliger_Verbrauch_pct: z.number().optional(),
  Wärmepumpe_Vorprüfung: z
    .object({
      Ziel_Vorlauftemperatur_C: z.enum(['35', '45', '55']).transform(Number).optional(),
      Heizkörperbestand: z.array(heizkoerper).optional(),
      Elektroanschluss: z
        .object({
          Phase: z.enum(['1-phasig', '3-phasig']),
          Hauptsicherung_A: z.number().optional(),
          Upgrade_noetig: z.boolean().optional(),
        })
        .optional(),
      Aufstellmoeglichkeit_Aussengeraet: z.boolean().optional(),
      Kondensatablauf: z.boolean().optional(),
      Pufferspeicher_Platz: z.boolean().optional(),
    })
    .optional(),
});

const dhw = z.object({
  Modus: z.enum(['Bestand_vereinfacht', 'detailliert']),
  Auswahl_eines_System: z.string().optional(),
  Wärmeerzeuger: z.string().optional(),
  Untersystem: z.string().optional(),
  Energieträger: z.string().optional(),
  Art_der_Trinkwasserversorgung: z.enum(['zentral', 'dezentral']).optional(),
  Zirkulation: z.boolean().optional(),
  Aufstellungsort_des_Speichers: z.enum(['innerhalb', 'außerhalb']).optional(),
  Art_des_Speichersystems: z.string().optional(),
  Solaranlage: z.boolean().optional(),
});

export const luxEebSchema = z.object({
  meta: z.object({
    erstelltAmISO: z.string(),
    appVersion: z.string(),
    sprache: z.literal('de'),
    hinweis_en: z.string(),
  }),
  Allgemeine_Projektdaten: z.object({
    Bezeichnung: z.string().min(1),
    Passnummer: z.string().optional(),
    Gebäudetyp: z.enum(['Wohnen EFH', 'Wohnen MFH', 'Sonstiges']),
    Nachweisart: z.enum(['Neubau (Bauantrag)', 'Bestand', 'Sonstige']),
    Wohneinheiten: z.number().optional(),
    Straße_Nr: z.string().optional(),
    PLZ_Ort: z.string().optional(),
    Hinweise: z.string().optional(),
    Baujahr_Gebäude: z.number().optional(),
    Baujahr_Heizungsanlage: z.number().optional(),
    Aussteller: z
      .object({
        Firma: z.string().optional(),
        Name: z.string().optional(),
        Adresse: z.string().optional(),
        PLZ_Ort: z.string().optional(),
        Telefon: z.string().optional(),
        Nr_Aussteller: z.string().optional(),
      })
      .optional(),
    Eigentümer: z
      .object({
        Firma: z.string().optional(),
        Name: z.string().optional(),
        Adresse: z.string().optional(),
        PLZ_Ort: z.string().optional(),
        Telefon: z.string().optional(),
      })
      .optional(),
  }),
  Opaque_Bauteile: z.array(opaqueElement),
  Transparente_Bauteile: z.array(transparentElement),
  Wärmebrücken: z.object({
    Methode: z.enum(['Pauschal', 'detailliert_EN_ISO_10211']),
    DeltaUWB_W_m2K: z.number().optional(),
    Linear: z.array(linearWB),
  }),
  Gebäudehülle: z.object({
    Rotation_Grad: z.enum(['0', '45', '90', '135', '180', '225', '270', '315']).transform(Number).optional(),
    Flächen: z.array(flaeche),
  }),
  Energiebezugsflächen_Zonen: z.object({
    Zonen: z.array(
      z.object({
        Zonenbezeichnung: z.string(),
        Räume: z.array(
          z.object({
            Raumbezeichnung: z.string(),
            Anzahl: z.number().optional(),
            Breite_m: z.number().optional(),
            Länge_m: z.number().optional(),
            Höhe_m: z.number().optional(),
            An_m2: z.number().optional(),
            Ve_m3: z.number().optional(),
            Lüftungsanlage: z.string().optional(),
          })
        ),
      })
    ),
    Gebäudevolumen_Ve_m3: z.number().optional(),
    Energiebezugsfläche_An_m2: z.number().optional(),
  }),
  Lüftung: z.object({
    Anlagen: z.array(lueftungsAnlage),
    Restluftvolumen_Vr_m3: z.number().optional(),
    energetischer_Luftwechsel_n_1_h: z.number().optional(),
    Luftdichtheit: z.object({
      n50_1_h: z.number().optional(),
      Schutzklasse: z.enum(['keine', 'mittel', 'hoch']),
      Schutzkoeffizient_e: z.enum(['0.10', '0.07', '0.04']).transform(Number),
      EWT: z.boolean().optional(),
    }),
  }),
  Sonstige_Parameter: z.object({
    Klimadaten: z.string().optional(),
    Wärmebrücken_berücksichtigen: z.boolean().optional(),
    Reduktionen: z.string().optional(),
    Regelungsparameter_FG: z.number().optional(),
    Bauweise: z.string().optional(),
  }),
  Heizungsanlagen: z.array(heizung),
  Warmwasserbereitung: z.array(dhw),
  Hilfsenergie: z.object({
    Energieform: z.enum(['Strommix', 'Sonstige']),
  }),
});

export type LuxEebSchema = z.infer<typeof luxEebSchema>;

export const defaultLuxEebValues: LuxEebSchema = {
  meta: {
    erstelltAmISO: new Date().toISOString(),
    appVersion: '0.1.0',
    sprache: 'de',
    hinweis_en: 'Preparation tool only – not an official Energiepass.',
  },
  Allgemeine_Projektdaten: {
    Bezeichnung: 'Projekt LuxEeB Intake',
    Passnummer: undefined,
    Gebäudetyp: 'Wohnen EFH',
    Nachweisart: 'Bestand',
    Wohneinheiten: 1,
    Hinweise: '',
    Baujahr_Gebäude: 1978,
    Baujahr_Heizungsanlage: 2002,
    Straße_Nr: '',
    PLZ_Ort: '',
  },
  Opaque_Bauteile: [
    {
      Nr: 'ME01',
      Bezeichnung: 'Außenwand Ziegel',
      Situation: 'Außen',
      Methode: 'typische U-Werte Bestand',
      U_Wert_W_m2K: 1.2,
      Schichten: [],
    },
  ],
  Transparente_Bauteile: [
    {
      Nr: 'FE01',
      Bezeichnung: 'Fenster Holz',
      Situation: 'Außen',
      Eingabeart: 'EN_10077-1_Schätzung',
      Breite_m: 1.2,
      Höhe_m: 1.3,
      Ug_W_m2K: 1.1,
      Uf_W_m2K: 1.4,
      Psi_Glas_Rahmen_W_mK: 0.06,
      Fenstertyp: 'Mehrfach',
      Scheibenzahl: 2,
      U_Wert_W_m2K: 1.3,
      Glasflächenanteil_pct: 70,
      g_Wert: 0.55,
    },
  ],
  Wärmebrücken: {
    Methode: 'Pauschal',
    DeltaUWB_W_m2K: 0.05,
    Linear: [],
  },
  Gebäudehülle: {
    Rotation_Grad: 0,
    Flächen: [
      {
        Typ: 'O',
        Bauteil_Nr: 'ME01',
        Anzahl: 1,
        Breite_m: 10,
        Länge_m: 2.6,
        Orientierung: 'Süd',
        Fläche_m2: 26,
        Abzug: false,
      },
      {
        Typ: 'T',
        Bauteil_Nr: 'FE01',
        Anzahl: 2,
        Breite_m: 1.2,
        Länge_m: 1.3,
        Orientierung: 'Süd',
        Fläche_m2: 3.12,
        Abzug: true,
      },
    ],
  },
  Energiebezugsflächen_Zonen: {
    Zonen: [
      {
        Zonenbezeichnung: 'Wohnen',
        Räume: [
          {
            Raumbezeichnung: 'Wohnzimmer',
            Breite_m: 4.5,
            Länge_m: 5,
            Höhe_m: 2.5,
            An_m2: 22.5,
            Ve_m3: 56.25,
          },
        ],
      },
    ],
    Gebäudevolumen_Ve_m3: 350,
    Energiebezugsfläche_An_m2: 140,
  },
  Lüftung: {
    Anlagen: [
      {
        Bezeichnung_der_Anlage: 'Zentrale KWL',
        Versorgtes_Raumluftvolumen_Vn_i_m3: 200,
        Volumenstrom_VL_i_m3h: 150,
        Vollbetriebszeit_tB_H_h_d: 16,
        Betriebsvolumenstrom_VL_m_i_m3h: 150,
        Wirkungsgrad_WRG_nr_i_pct: 82,
        spezifische_Leistungsaufnahme_qL_Wh_m3h: 0.45,
        mittlere_Luftwechselrate_n_i_1_h: 0.4,
      },
    ],
    Restluftvolumen_Vr_m3: 120,
    energetischer_Luftwechsel_n_1_h: 0.61,
    Luftdichtheit: {
      n50_1_h: 1.8,
      Schutzklasse: 'mittel',
      Schutzkoeffizient_e: 0.07,
      EWT: false,
    },
  },
  Sonstige_Parameter: {
    Klimadaten: 'Luxembourg-Findel',
    Wärmebrücken_berücksichtigen: true,
    Reduktionen: 'Nachtabsenkung Standard',
    Regelungsparameter_FG: 1,
    Bauweise: 'Massivbau',
  },
  Heizungsanlagen: [
    {
      Modus: 'Bestand_vereinfacht',
      Systemwahl: 'Warmwasser',
      Systemauswahl: 'Ölkessel Standard',
      Wärmeerzeuger: 'Öl',
      Energieträger: 'Heizöl',
      Wärmepumpe_Vorprüfung: {
        Ziel_Vorlauftemperatur_C: 45,
        Heizkörperbestand: [
          {
            Raumbezeichnung: 'Wohnzimmer',
            Typ: 'Plattenheizkörper',
            Leistung_W_bei_75_65_20: 1200,
          },
        ],
        Elektroanschluss: {
          Phase: '3-phasig',
          Hauptsicherung_A: 25,
          Upgrade_noetig: false,
        },
        Aufstellmoeglichkeit_Aussengeraet: true,
        Kondensatablauf: true,
        Pufferspeicher_Platz: true,
      },
    },
  ],
  Warmwasserbereitung: [
    {
      Modus: 'Bestand_vereinfacht',
      Auswahl_eines_System: 'Speicherladesystem',
      Wärmeerzeuger: 'Öl',
      Art_der_Trinkwasserversorgung: 'zentral',
      Zirkulation: true,
      Solaranlage: false,
      Aufstellungsort_des_Speichers: 'innerhalb',
    },
  ],
  Hilfsenergie: {
    Energieform: 'Strommix',
  },
};

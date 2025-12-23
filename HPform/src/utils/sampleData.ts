import { LuxEebSchema, defaultLuxEebValues } from '../types/schema';

export const beispielBestandEFH: LuxEebSchema = {
  ...defaultLuxEebValues,
  Allgemeine_Projektdaten: {
    ...defaultLuxEebValues.Allgemeine_Projektdaten,
    Bezeichnung: 'EFH Bestandsgebäude Muster',
    Nachweisart: 'Bestand',
    Gebäudetyp: 'Wohnen EFH',
    Wohneinheiten: 1,
    Straße_Nr: 'Musterweg 12',
    PLZ_Ort: '1234 Beispielhausen',
    Baujahr_Gebäude: 1985,
    Baujahr_Heizungsanlage: 2005,
  },
  Heizungsanlagen: [
    {
      Modus: 'Bestand_vereinfacht',
      Systemwahl: 'Warmwasser',
      Systemauswahl: 'Gas-Brennwert',
      Wärmeerzeuger: 'Gastherme',
      Energieträger: 'Erdgas',
      Wärmepumpe_Vorprüfung: {
        Ziel_Vorlauftemperatur_C: 45,
        Heizkörperbestand: [
          {
            Raumbezeichnung: 'Wohnzimmer',
            Typ: 'Plattenheizkörper',
            Leistung_W_bei_75_65_20: 1300,
          },
          {
            Raumbezeichnung: 'Bad',
            Typ: 'Plattenheizkörper',
            Leistung_W_bei_75_65_20: 900,
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
};

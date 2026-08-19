/* ==========================================================================
   Orbita — couche de données (localStorage)
   Simule un backend : chaque domaine possède ses propres jeux de données.
   ========================================================================== */
const Store = (() => {
  const KEYS = {
    session: 'orbita_session',
    stock_produits: 'orbita_stock_produits',
    immo_biens: 'orbita_immo_biens',
    immo_locataires: 'orbita_immo_locataires',
    auto_vehicules: 'orbita_auto_vehicules',
    auto_ventes: 'orbita_auto_ventes',
  };

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function nextId(list) {
    return list.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
  }

  const SEED = {
    [KEYS.stock_produits]: [
      { id: 1, nom: 'Ordinateur portable Dell 14"', categorie: 'Informatique', quantite: 14, prix: 689, seuil: 5 },
      { id: 2, nom: 'Écran 24" Full HD', categorie: 'Informatique', quantite: 3, prix: 149, seuil: 5 },
      { id: 3, nom: 'Clavier mécanique sans fil', categorie: 'Accessoires', quantite: 27, prix: 59, seuil: 8 },
      { id: 4, nom: 'Souris optique sans fil', categorie: 'Accessoires', quantite: 41, prix: 19, seuil: 10 },
      { id: 5, nom: 'Câble HDMI 2m', categorie: 'Accessoires', quantite: 2, prix: 9, seuil: 15 },
      { id: 6, nom: 'Chaise de bureau ergonomique', categorie: 'Mobilier', quantite: 6, prix: 219, seuil: 3 },
      { id: 7, nom: 'Imprimante laser multifonction', categorie: 'Informatique', quantite: 4, prix: 249, seuil: 4 },
      { id: 8, nom: 'Casque audio Bluetooth', categorie: 'Accessoires', quantite: 18, prix: 79, seuil: 6 },
      { id: 9, nom: 'Bureau réglable en hauteur', categorie: 'Mobilier', quantite: 1, prix: 379, seuil: 2 },
      { id: 10, nom: 'Disque SSD externe 1To', categorie: 'Informatique', quantite: 9, prix: 99, seuil: 5 },
    ],
    [KEYS.immo_biens]: [
      { id: 1, adresse: '12 rue des Lilas, Paris 75011', type: 'Appartement', surface: 48, loyer: 1250, statut: 'Loué' },
      { id: 2, adresse: '5 allée des Tilleuls, Lyon 69003', type: 'Appartement', surface: 62, loyer: 980, statut: 'Loué' },
      { id: 3, adresse: '8 impasse du Port, Marseille 13007', type: 'Studio', surface: 24, loyer: 620, statut: 'Libre' },
      { id: 4, adresse: '21 cours Victor Hugo, Bordeaux 33000', type: 'Maison', surface: 110, loyer: 1690, statut: 'Loué' },
      { id: 5, adresse: '3 rue de la République, Nice 06000', type: 'Local commercial', surface: 75, loyer: 1450, statut: 'Libre' },
      { id: 6, adresse: '17 avenue Foch, Toulouse 31000', type: 'Appartement', surface: 55, loyer: 890, statut: 'Loué' },
    ],
    [KEYS.immo_locataires]: [
      { id: 1, nom: 'Camille Faure', bienId: 1, telephone: '06 12 34 56 78', debut: '2024-03-01', statutPaiement: 'À jour' },
      { id: 2, nom: 'Youssef Amrani', bienId: 2, telephone: '06 98 76 54 32', debut: '2023-09-15', statutPaiement: 'À jour' },
      { id: 3, nom: 'Léa Bonnet', bienId: 4, telephone: '07 45 12 33 90', debut: '2022-11-01', statutPaiement: 'En retard' },
      { id: 4, nom: 'Marc Petit', bienId: 6, telephone: '06 55 44 33 22', debut: '2025-01-10', statutPaiement: 'À jour' },
    ],
    [KEYS.auto_vehicules]: [
      { id: 1, marque: 'Peugeot', modele: '208', annee: 2022, km: 18500, prix: 15900, statut: 'Disponible' },
      { id: 2, marque: 'Renault', modele: 'Clio V', annee: 2021, km: 32000, prix: 13500, statut: 'Disponible' },
      { id: 3, marque: 'Citroën', modele: 'C3', annee: 2020, km: 41200, prix: 10900, statut: 'Réservé' },
      { id: 4, marque: 'BMW', modele: 'Série 3', annee: 2023, km: 8900, prix: 38900, statut: 'Disponible' },
      { id: 5, marque: 'Audi', modele: 'A4', annee: 2019, km: 62000, prix: 21900, statut: 'Vendu' },
      { id: 6, marque: 'Volkswagen', modele: 'Golf VIII', annee: 2022, km: 21000, prix: 19500, statut: 'Disponible' },
      { id: 7, marque: 'Toyota', modele: 'Yaris', annee: 2023, km: 5400, prix: 17900, statut: 'Vendu' },
    ],
    [KEYS.auto_ventes]: [
      { id: 1, vehiculeLabel: 'Audi A4 (2019)', client: 'Sophie Lambert', date: '2026-06-12', prix: 21400 },
      { id: 2, vehiculeLabel: 'Toyota Yaris (2023)', client: 'Karim Belkacem', date: '2026-07-02', prix: 17600 },
      { id: 3, vehiculeLabel: 'Renault Mégane (2020)', client: 'Julie Marchand', date: '2026-07-20', prix: 12800 },
    ],
  };

  function seedIfEmpty() {
    Object.entries(SEED).forEach(([key, val]) => {
      if (localStorage.getItem(key) === null) set(key, val);
    });
  }

  function resetDemoData() {
    Object.entries(SEED).forEach(([key, val]) => set(key, val));
  }

  return { KEYS, get, set, nextId, seedIfEmpty, resetDemoData };
})();

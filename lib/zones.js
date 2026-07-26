// Approximate centers for Lahore neighborhoods. Good enough for a personal
// map at this zoom level, not survey-grade -- nudge any of these if a pin
// lands somewhere annoying.
export const ZONES = [
  { id: "dha", name: "DHA", lat: 31.4646, lng: 74.4103 },
  { id: "gulberg", name: "Gulberg", lat: 31.515, lng: 74.345 },
  { id: "model_town", name: "Model Town", lat: 31.483, lng: 74.3237 },
  { id: "johar_town", name: "Johar Town", lat: 31.4649, lng: 74.2765 },
  { id: "township", name: "Township", lat: 31.455, lng: 74.284 },
  { id: "faisal_town", name: "Faisal Town", lat: 31.487, lng: 74.3103 },
  { id: "garden_town", name: "Garden Town", lat: 31.501, lng: 74.326 },
  { id: "allama_iqbal_town", name: "Allama Iqbal Town", lat: 31.499, lng: 74.266 },
  { id: "wapda_town", name: "Wapda Town", lat: 31.43, lng: 74.266 },
  { id: "iqbal_town", name: "Iqbal Town", lat: 31.5, lng: 74.27 },
  { id: "bahria_town", name: "Bahria Town", lat: 31.368, lng: 74.188 },
  { id: "valencia", name: "Valencia", lat: 31.402, lng: 74.234 },
  { id: "eme", name: "EME", lat: 31.463, lng: 74.244 },
  { id: "askari", name: "Askari", lat: 31.525, lng: 74.355 },
  { id: "cantt", name: "Cantt", lat: 31.5497, lng: 74.366 },
  { id: "super_town", name: "Super Town", lat: 31.4874, lng: 74.3542 },
];

export const LAHORE_CENTER = { lat: 31.5497, lng: 74.3436 };

export function findZone(areaName) {
  if (!areaName) return null;
  return (
    ZONES.find((z) => z.name.toLowerCase() === areaName.trim().toLowerCase()) ||
    null
  );
}

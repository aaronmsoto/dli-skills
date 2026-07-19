/**
 * The 100 most common Spanish verbs, ordered by corpus frequency rank
 * (compiled from standard Spanish frequency lists; see docs/SPEC.md).
 *
 * Pedagogical note: "gustar" (rank ~92 in most lists) is replaced with
 * "comer" because gustar is taught to novices as a fixed chunk
 * ("me gusta...") rather than as a fully conjugated verb, and drilling
 * "yo gusto / tú gustas" would teach an unnatural pattern.
 *
 * Flags are documented in js/conjugator.js. Verbs with no flags are fully
 * regular in all three tenses (orthographic -car/-gar/-zar, -guir/-gir,
 * vowel-stem, and -cer/-cir spelling changes are applied automatically).
 */

export const VERBS = [
  { rank: 1, inf: "ser", en: "to be (essential)",
    pres: ["soy", "eres", "es", "somos", "sois", "son"],
    pret: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imp: ["era", "eras", "era", "éramos", "erais", "eran"] },
  { rank: 2, inf: "estar", en: "to be (state, place)",
    pres: ["estoy", "estás", "está", "estamos", "estáis", "están"],
    pretStem: "estuv" },
  { rank: 3, inf: "tener", en: "to have", presYo: "tengo", presStem: "e>ie", pretStem: "tuv" },
  { rank: 4, inf: "hacer", en: "to do, to make", presYo: "hago",
    pret: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"] },
  { rank: 5, inf: "ir", en: "to go",
    pres: ["voy", "vas", "va", "vamos", "vais", "van"],
    pret: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imp: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"] },
  { rank: 6, inf: "decir", en: "to say, to tell", presYo: "digo", presStem: "e>i", pretStem: "dij", ger: "diciendo" },
  { rank: 7, inf: "poder", en: "to be able to, can", presStem: "o>ue", pretStem: "pud", ger: "pudiendo" },
  { rank: 8, inf: "ver", en: "to see",
    pres: ["veo", "ves", "ve", "vemos", "veis", "ven"],
    pret: ["vi", "viste", "vio", "vimos", "visteis", "vieron"],
    imp: ["veía", "veías", "veía", "veíamos", "veíais", "veían"] },
  { rank: 9, inf: "dar", en: "to give",
    pres: ["doy", "das", "da", "damos", "dais", "dan"],
    pret: ["di", "diste", "dio", "dimos", "disteis", "dieron"] },
  { rank: 10, inf: "saber", en: "to know (facts)", presYo: "sé", pretStem: "sup" },

  { rank: 11, inf: "querer", en: "to want, to love", presStem: "e>ie", pretStem: "quis" },
  { rank: 12, inf: "llegar", en: "to arrive" },
  { rank: 13, inf: "pasar", en: "to pass, to happen" },
  { rank: 14, inf: "deber", en: "to have to, to owe" },
  { rank: 15, inf: "poner", en: "to put", presYo: "pongo", pretStem: "pus" },
  { rank: 16, inf: "parecer", en: "to seem" },
  { rank: 17, inf: "quedar", en: "to stay, to remain" },
  { rank: 18, inf: "creer", en: "to believe" },
  { rank: 19, inf: "hablar", en: "to speak, to talk" },
  { rank: 20, inf: "llevar", en: "to carry, to wear" },

  { rank: 21, inf: "dejar", en: "to leave, to let" },
  { rank: 22, inf: "seguir", en: "to follow, to continue", presStem: "e>i", pret3: "e>i" },
  { rank: 23, inf: "encontrar", en: "to find", presStem: "o>ue" },
  { rank: 24, inf: "llamar", en: "to call" },
  { rank: 25, inf: "venir", en: "to come", presYo: "vengo", presStem: "e>ie", pretStem: "vin", ger: "viniendo" },
  { rank: 26, inf: "pensar", en: "to think", presStem: "e>ie" },
  { rank: 27, inf: "salir", en: "to leave, to go out", presYo: "salgo" },
  { rank: 28, inf: "volver", en: "to return", presStem: "o>ue" },
  { rank: 29, inf: "tomar", en: "to take, to drink" },
  { rank: 30, inf: "conocer", en: "to know (people, places)" },

  { rank: 31, inf: "vivir", en: "to live" },
  { rank: 32, inf: "sentir", en: "to feel", presStem: "e>ie", pret3: "e>i" },
  { rank: 33, inf: "tratar", en: "to try, to treat" },
  { rank: 34, inf: "mirar", en: "to look at" },
  { rank: 35, inf: "contar", en: "to count, to tell", presStem: "o>ue" },
  { rank: 36, inf: "empezar", en: "to begin", presStem: "e>ie" },
  { rank: 37, inf: "esperar", en: "to wait, to hope" },
  { rank: 38, inf: "buscar", en: "to look for" },
  { rank: 39, inf: "existir", en: "to exist" },
  { rank: 40, inf: "entrar", en: "to enter" },

  { rank: 41, inf: "trabajar", en: "to work" },
  { rank: 42, inf: "escribir", en: "to write" },
  { rank: 43, inf: "perder", en: "to lose", presStem: "e>ie" },
  { rank: 44, inf: "producir", en: "to produce", pretStem: "produj" },
  { rank: 45, inf: "ocurrir", en: "to happen" },
  { rank: 46, inf: "entender", en: "to understand", presStem: "e>ie" },
  { rank: 47, inf: "pedir", en: "to ask for", presStem: "e>i", pret3: "e>i" },
  { rank: 48, inf: "recibir", en: "to receive" },
  { rank: 49, inf: "recordar", en: "to remember", presStem: "o>ue" },
  { rank: 50, inf: "terminar", en: "to finish" },

  { rank: 51, inf: "permitir", en: "to allow" },
  { rank: 52, inf: "aparecer", en: "to appear" },
  { rank: 53, inf: "conseguir", en: "to get, to achieve", presStem: "e>i", pret3: "e>i" },
  { rank: 54, inf: "comenzar", en: "to begin", presStem: "e>ie" },
  { rank: 55, inf: "servir", en: "to serve", presStem: "e>i", pret3: "e>i" },
  { rank: 56, inf: "sacar", en: "to take out" },
  { rank: 57, inf: "necesitar", en: "to need" },
  { rank: 58, inf: "mantener", en: "to keep, to maintain", presYo: "mantengo", presStem: "e>ie", pretStem: "mantuv" },
  { rank: 59, inf: "resultar", en: "to turn out" },
  { rank: 60, inf: "leer", en: "to read" },

  { rank: 61, inf: "caer", en: "to fall", presYo: "caigo" },
  { rank: 62, inf: "cambiar", en: "to change" },
  { rank: 63, inf: "presentar", en: "to present" },
  { rank: 64, inf: "crear", en: "to create" },
  { rank: 65, inf: "abrir", en: "to open" },
  { rank: 66, inf: "considerar", en: "to consider" },
  { rank: 67, inf: "oír", en: "to hear",
    pres: ["oigo", "oyes", "oye", "oímos", "oís", "oyen"] },
  { rank: 68, inf: "acabar", en: "to finish, to end up" },
  { rank: 69, inf: "convertir", en: "to convert, to turn into", presStem: "e>ie", pret3: "e>i" },
  { rank: 70, inf: "ganar", en: "to win, to earn" },

  { rank: 71, inf: "formar", en: "to form" },
  { rank: 72, inf: "traer", en: "to bring", presYo: "traigo", pretStem: "traj" },
  { rank: 73, inf: "partir", en: "to depart, to split" },
  { rank: 74, inf: "morir", en: "to die", presStem: "o>ue", pret3: "o>u" },
  { rank: 75, inf: "aceptar", en: "to accept" },
  { rank: 76, inf: "realizar", en: "to carry out" },
  { rank: 77, inf: "suponer", en: "to suppose", presYo: "supongo", pretStem: "supus" },
  { rank: 78, inf: "comprender", en: "to understand" },
  { rank: 79, inf: "lograr", en: "to achieve" },
  { rank: 80, inf: "explicar", en: "to explain" },

  { rank: 81, inf: "preguntar", en: "to ask (a question)" },
  { rank: 82, inf: "tocar", en: "to touch, to play (music)" },
  { rank: 83, inf: "reconocer", en: "to recognize" },
  { rank: 84, inf: "estudiar", en: "to study" },
  { rank: 85, inf: "alcanzar", en: "to reach" },
  { rank: 86, inf: "nacer", en: "to be born" },
  { rank: 87, inf: "dirigir", en: "to direct" },
  { rank: 88, inf: "correr", en: "to run" },
  { rank: 89, inf: "utilizar", en: "to use" },
  { rank: 90, inf: "pagar", en: "to pay" },

  { rank: 91, inf: "ayudar", en: "to help" },
  { rank: 92, inf: "comer", en: "to eat" },
  { rank: 93, inf: "jugar", en: "to play", presStem: "u>ue" },
  { rank: 94, inf: "escuchar", en: "to listen" },
  { rank: 95, inf: "cumplir", en: "to complete, to turn (an age)" },
  { rank: 96, inf: "ofrecer", en: "to offer" },
  { rank: 97, inf: "descubrir", en: "to discover" },
  { rank: 98, inf: "levantar", en: "to raise, to lift" },
  { rank: 99, inf: "intentar", en: "to try" },
  { rank: 100, inf: "decidir", en: "to decide" },
];

export const SET_SIZE = 5;

/** 20 sets of 5 verbs each, in frequency order. Set 1 = the 5 most common. */
export const SETS = Array.from({ length: VERBS.length / SET_SIZE }, (_, i) => ({
  id: i + 1,
  verbs: VERBS.slice(i * SET_SIZE, (i + 1) * SET_SIZE),
}));

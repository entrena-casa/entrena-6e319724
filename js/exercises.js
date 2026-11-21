// Biblioteca de ejercicios: datos, animación de la demostración y reglas de la cámara.
// coach.rep: cuenta una repetición cuando la métrica pasa de 'rest' a 'active' y vuelve.
// coach.checks: {m, stat:'min'|'max', op:'<'|'>', v, msg} se evalúa al final de cada repetición
//               {m, op, v, msg, hold:true} se evalúa continuamente (posturas mantenidas).

const S = { t: 0, la: [4, 2], ra: [7, 4], ll: [-2, -2], rl: [2, 2] }; // de pie (lado)
const SF = { t: 0, la: [8, 4], ra: [8, 4], ll: [3, 2], rl: [3, 2] }; // de pie (frente)
const SQ = { t: 42, la: [88, 88], ra: [85, 85], ll: [82, -32], rl: [84, -30] };
const SUP = { t: -90, h: 0, la: [92, 92], ra: [90, 90], ll: [128, -20], rl: [130, -18] }; // tumbada boca arriba rodillas dobladas
const QUAD = { t: 78, h: 8, la: [0, 0], ra: [2, 2], ll: [0, -92], rl: [2, -90], ft: -60 }; // cuadrupedia
const PLK = { t: 66, h: 4, la: [0, 0], ra: [2, 2], ll: [-66, -66], rl: [-66, -66], ft: 10 }; // plancha brazos estirados

export const EXERCISES = [
  // ───────────── CALENTAMIENTO / CARDIO SUAVE ─────────────
  {
    id: 'marcha', name: 'Marcha en el sitio', view: 'side', cat: 'calentamiento', zones: ['cardio', 'cuerpo'], level: 1, impact: 'bajo', met: 3.5,
    muscles: 'Piernas, activación general',
    steps: ['De pie, espalda recta y abdomen activo.', 'Sube una rodilla hasta la altura de la cadera.', 'Baja y sube la otra, balanceando los brazos al ritmo.'],
    tips: ['Respira de forma relajada.', 'Apoya la punta del pie primero para amortiguar.'],
    errors: ['Inclinarse hacia atrás al subir la rodilla.', 'Mirar al suelo.'],
    anim: { dur: 1.2, frames: [
      { ...S, rl: [72, 2], ll: [-2, -2], ra: [-28, -10], la: [35, 75] },
      { ...S, ll: [72, 2], rl: [2, 2], la: [-28, -10], ra: [35, 75] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'kneeLift', rest: 150, active: 125 }, checks: [
      { m: 'kneeLift', stat: 'min', op: '>', v: 120, msg: 'Sube un poco más las rodillas' },
      { m: 'lean', stat: 'max', op: '>', v: 20, msg: 'Mantén el tronco recto' },
    ] },
  },
  {
    id: 'circulos', name: 'Círculos de brazos', view: 'front', cat: 'calentamiento', zones: ['brazos', 'cuerpo'], level: 1, impact: 'bajo', met: 3,
    muscles: 'Hombros',
    steps: ['Brazos estirados en cruz, a la altura de los hombros.', 'Dibuja círculos pequeños hacia delante.', 'A mitad de tiempo cambia de sentido.'],
    tips: ['Hombros lejos de las orejas.'], errors: ['Encoger los hombros.', 'Doblar los codos.'],
    anim: { dur: 1.2, frames: [
      { ...SF, la: [82, 86], ra: [82, 86] }, { ...SF, la: [92, 96], ra: [92, 96] }, { ...SF, la: [100, 100], ra: [100, 100] }, { ...SF, la: [90, 90], ra: [90, 90] },
    ] },
    coach: { view: 'front', need: 'upper', checks: [
      { m: 'armRaise', op: '<', v: 65, msg: 'Sube los brazos a la altura de los hombros', hold: true },
      { m: 'elbow', op: '<', v: 140, msg: 'Estira bien los brazos', hold: true },
    ] },
  },
  {
    id: 'pasolateral', name: 'Paso lateral con brazos', view: 'front', cat: 'calentamiento', zones: ['cardio', 'cuerpo'], level: 1, impact: 'bajo', met: 3.8,
    muscles: 'Piernas, hombros, cardio suave',
    steps: ['Da un paso a un lado y junta el otro pie.', 'Al abrir, sube los brazos en cruz.', 'Repite hacia el otro lado con ritmo.'],
    tips: ['Rodillas ligeramente flexionadas.'], errors: ['Ir demasiado rígida.'],
    anim: { dur: 1.6, frames: [
      { ...SF, ll: [16, 12], rl: [2, 2], la: [80, 85], ra: [80, 85] }, { ...SF, ll: [3, 3], rl: [3, 3], la: [12, 8], ra: [12, 8] },
      { ...SF, rl: [16, 12], ll: [2, 2], la: [80, 85], ra: [80, 85] }, { ...SF, ll: [3, 3], rl: [3, 3], la: [12, 8], ra: [12, 8] },
    ] },
    coach: { view: 'front', need: 'full', rep: { m: 'armRaise', rest: 35, active: 65 }, checks: [
      { m: 'armRaise', stat: 'max', op: '<', v: 70, msg: 'Abre más los brazos' },
    ] },
  },
  {
    id: 'jacks', name: 'Saltos de tijera', view: 'front', cat: 'cardio', zones: ['cardio', 'cuerpo'], level: 2, impact: 'alto', met: 8,
    muscles: 'Cuerpo completo, cardio',
    steps: ['De pie con pies juntos y brazos abajo.', 'Salta abriendo piernas y subiendo brazos por encima de la cabeza.', 'Salta de nuevo para cerrar.'],
    tips: ['Aterriza suave sobre la parte delantera del pie.', 'Versión sin salto: abre una pierna cada vez.'],
    errors: ['Brazos a medio subir.', 'Caer con las rodillas rectas.'],
    easier: 'pasolateral',
    anim: { dur: 0.9, frames: [
      { ...SF, la: [10, 6], ra: [10, 6], ll: [3, 3], rl: [3, 3] },
      { ...SF, la: [160, 172], ra: [160, 172], ll: [17, 15], rl: [17, 15], lift: 0.07 },
    ] },
    coach: { view: 'front', need: 'full', rep: { m: 'armRaise', rest: 50, active: 120 }, checks: [
      { m: 'armRaise', stat: 'max', op: '<', v: 145, msg: 'Sube los brazos del todo, por encima de la cabeza' },
      { m: 'legSpread', stat: 'max', op: '<', v: 1.5, msg: 'Abre más las piernas' },
    ] },
  },
  {
    id: 'skipping', name: 'Rodillas arriba', view: 'side', cat: 'cardio', zones: ['cardio', 'piernas'], level: 2, impact: 'alto', met: 8,
    muscles: 'Piernas, abdomen, cardio',
    steps: ['Corre en el sitio subiendo las rodillas a la altura de la cadera.', 'Mueve los brazos con energía.', 'Mantén el abdomen firme.'],
    tips: ['Si cansa demasiado, hazlo andando (marcha).'], errors: ['Echarse hacia atrás.', 'Rodillas demasiado bajas.'],
    easier: 'marcha',
    anim: { dur: 0.6, frames: [
      { ...S, rl: [92, 5], ll: [-5, -5], ra: [-35, -10], la: [40, 120], lift: 0.05, ft: 30 },
      { ...S, ll: [92, 5], rl: [-5, -5], la: [-35, -10], ra: [40, 120], lift: 0.05, ft: 30 },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'kneeLift', rest: 150, active: 120 }, checks: [
      { m: 'kneeLift', stat: 'min', op: '>', v: 108, msg: 'Sube más las rodillas, hasta la cadera' },
      { m: 'lean', stat: 'max', op: '>', v: 22, msg: 'No te inclines, tronco recto' },
    ] },
  },
  {
    id: 'talones', name: 'Talones al glúteo', view: 'side', cat: 'cardio', zones: ['cardio', 'piernas'], level: 1, impact: 'bajo', met: 6,
    muscles: 'Isquiotibiales, cardio',
    steps: ['Trota suave en el sitio.', 'Lleva los talones hacia los glúteos.', 'Manos detrás de la cintura o brazos acompañando.'],
    tips: ['Rodillas apuntando al suelo.'], errors: ['Adelantar las rodillas.'],
    anim: { dur: 0.7, frames: [
      { ...S, rl: [-8, -150], ll: [0, 0], ra: [-30, 60], la: [30, 100] },
      { ...S, ll: [-8, -150], rl: [0, 0], la: [-30, 60], ra: [30, 100] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'kneeMin', rest: 140, active: 85 }, checks: [
      { m: 'kneeMin', stat: 'min', op: '>', v: 70, msg: 'Lleva más el talón hacia el glúteo' },
    ] },
  },
  {
    id: 'boxeo', name: 'Boxeo en el sitio', view: 'side', cat: 'cardio', zones: ['cardio', 'brazos'], level: 1, impact: 'bajo', met: 6,
    muscles: 'Brazos, hombros, abdomen, cardio',
    steps: ['Pies separados, uno algo adelantado, rodillas suaves.', 'Puños a la altura de la barbilla.', 'Lanza golpes rectos alternando brazos y vuelve a la guardia.'],
    tips: ['Gira un poco el tronco en cada golpe.', 'No bloquees el codo al estirar.'], errors: ['Bajar la guardia.'],
    anim: { dur: 0.9, frames: [
      { ...S, t: 5, ll: [-10, -8], rl: [12, 4], ra: [90, 90], la: [35, 165] },
      { ...S, t: 5, ll: [-10, -8], rl: [12, 4], ra: [35, 165], la: [90, 90] },
    ] },
    coach: { view: 'side', need: 'upper', rep: { m: 'elbowMax', rest: 110, active: 150 }, checks: [
      { m: 'elbowMax', stat: 'max', op: '<', v: 145, msg: 'Estira más el brazo en cada golpe' },
    ] },
  },
  {
    id: 'patinador', name: 'Patinador', view: 'front', cat: 'cardio', zones: ['cardio', 'piernas', 'gluteos'], level: 3, impact: 'alto', met: 8.5,
    muscles: 'Glúteo medio, piernas, cardio',
    steps: ['Salta de lado apoyando una pierna.', 'Cruza la otra por detrás sin apoyarla.', 'Salta al otro lado y repite.'],
    tips: ['Versión suave: da un paso en vez de saltar.'], errors: ['Caer con la rodilla hacia dentro.'],
    easier: 'pasolateral',
    anim: { dur: 1.2, frames: [
      { ...SF, t: -10, rl: [28, 5], ll: [-14, -40], la: [60, 40], ra: [20, 10] },
      { ...SF, t: 0, rl: [10, 5], ll: [10, 5], la: [20, 10], ra: [20, 10], lift: 0.1 },
      { ...SF, t: 10, ll: [28, 5], rl: [-14, -40], ra: [60, 40], la: [20, 10] },
      { ...SF, t: 0, rl: [10, 5], ll: [10, 5], la: [20, 10], ra: [20, 10], lift: 0.1 },
    ] },
    coach: { view: 'front', need: 'full', rep: { m: 'kneeMin', rest: 160, active: 135 }, checks: [] },
  },

  // ───────────── PIERNAS Y GLÚTEOS ─────────────
  {
    id: 'sentadilla', name: 'Sentadilla', view: 'side', cat: 'fuerza', zones: ['piernas', 'gluteos', 'cuerpo'], level: 1, impact: 'bajo', met: 5,
    muscles: 'Cuádriceps, glúteos, abdomen',
    steps: ['Pies a la anchura de las caderas, puntas un poco hacia fuera.', 'Lleva la cadera atrás como si te sentaras en una silla.', 'Baja hasta que los muslos queden casi paralelos al suelo.', 'Empuja con los talones para subir.'],
    tips: ['Pecho orgulloso, mirada al frente.', 'El peso en los talones.', 'Puedes poner una silla detrás como referencia.'],
    errors: ['Inclinar demasiado el tronco.', 'Levantar los talones.', 'Rodillas hacia dentro.'],
    harder: 'sentadillasalto',
    anim: { dur: 2.6, anchor: 'A', hold: [0.25, 0.15], frames: [S, SQ] },
    coach: { view: 'side', need: 'full', rep: { m: 'knee', rest: 155, active: 130 }, checks: [
      { m: 'knee', stat: 'min', op: '>', v: 112, msg: 'Baja un poco más, como si te sentaras en una silla' },
      { m: 'lean', stat: 'max', op: '>', v: 55, msg: 'Pecho arriba, no inclines tanto la espalda' },
    ] },
  },
  {
    id: 'sumo', name: 'Sentadilla sumo', view: 'front', cat: 'fuerza', zones: ['piernas', 'gluteos'], level: 1, impact: 'bajo', met: 5,
    muscles: 'Aductores, glúteos, cuádriceps',
    steps: ['Pies bastante separados, puntas hacia fuera.', 'Manos juntas delante del pecho.', 'Baja recta, abriendo las rodillas en dirección a las puntas.', 'Sube apretando glúteos.'],
    tips: ['Espalda vertical durante todo el movimiento.'], errors: ['Rodillas que se van hacia dentro.'],
    anim: { dur: 2.6, hold: [0.2, 0.15], frames: [
      { ...SF, ll: [20, 18], rl: [20, 18], la: [30, -95], ra: [30, -95] },
      { ...SF, ll: [62, -2], rl: [62, -2], la: [30, -95], ra: [30, -95] },
    ] },
    coach: { view: 'front', need: 'full', rep: { m: 'knee', rest: 155, active: 130 }, checks: [
      { m: 'knee', stat: 'min', op: '>', v: 115, msg: 'Baja más, abre las rodillas' },
      { m: 'valgus', stat: 'min', op: '<', v: 0.85, msg: 'Empuja las rodillas hacia fuera, que no se junten' },
    ] },
  },
  {
    id: 'zancada', name: 'Zancada atrás', view: 'side', cat: 'fuerza', zones: ['piernas', 'gluteos', 'cuerpo'], level: 2, impact: 'bajo', met: 5.5,
    muscles: 'Glúteos, cuádriceps, equilibrio',
    steps: ['De pie, manos en la cintura.', 'Da un paso largo hacia atrás.', 'Baja hasta que ambas rodillas formen ángulos de 90°.', 'Vuelve empujando con la pierna de delante y cambia.'],
    tips: ['El tronco recto, sin inclinarse.', 'Rodilla de delante encima del tobillo.'],
    errors: ['Paso demasiado corto.', 'Golpear el suelo con la rodilla de atrás.'],
    anim: { dur: 4.4, frames: [
      { ...S, ra: [-30, 80], la: [-30, 80] },
      { ...S, t: 4, ra: [-30, 80], la: [-30, 80], rl: [82, -2], ll: [-22, -110], ft: 0 },
      { ...S, ra: [-30, 80], la: [-30, 80] },
      { ...S, t: 4, ra: [-30, 80], la: [-30, 80], ll: [82, -2], rl: [-22, -110] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'knee', rest: 155, active: 130 }, checks: [
      { m: 'knee', stat: 'min', op: '>', v: 110, msg: 'Baja más, hasta que la rodilla de atrás casi toque el suelo' },
      { m: 'lean', stat: 'max', op: '>', v: 25, msg: 'Tronco recto, no te inclines hacia delante' },
    ] },
  },
  {
    id: 'zancadalateral', name: 'Zancada lateral', view: 'front', cat: 'fuerza', zones: ['piernas', 'gluteos'], level: 2, impact: 'bajo', met: 5,
    muscles: 'Aductores, glúteos, cuádriceps',
    steps: ['Pies juntos.', 'Da un paso amplio a un lado y flexiona esa rodilla.', 'La otra pierna queda estirada.', 'Vuelve al centro y cambia de lado.'],
    tips: ['Cadera hacia atrás, como en una sentadilla.'], errors: ['Rodilla que se pasa mucho de la punta del pie.'],
    anim: { dur: 4, frames: [
      { ...SF, la: [25, -90], ra: [25, -90] },
      { ...SF, rl: [55, 5], ll: [42, 42], la: [25, -90], ra: [25, -90] },
      { ...SF, la: [25, -90], ra: [25, -90] },
      { ...SF, ll: [55, 5], rl: [42, 42], la: [25, -90], ra: [25, -90] },
    ] },
    coach: { view: 'front', need: 'full', rep: { m: 'kneeMin', rest: 155, active: 130 }, checks: [
      { m: 'kneeMin', stat: 'min', op: '>', v: 115, msg: 'Flexiona más la rodilla del lado al que vas' },
    ] },
  },
  {
    id: 'abduccion', sides: true, name: 'Elevación lateral de pierna', view: 'front', cat: 'fuerza', zones: ['gluteos', 'piernas'], level: 1, impact: 'bajo', met: 3.5,
    muscles: 'Glúteo medio, cadera',
    steps: ['De pie, manos en la cintura o apoyada en una silla.', 'Sube una pierna estirada hacia el lado.', 'Baja controlando. Cambia de pierna a mitad de tiempo.'],
    tips: ['No inclines el tronco hacia el otro lado.'], errors: ['Subir la pierna con impulso.'],
    anim: { dur: 2, frames: [
      { ...SF, la: [-25, 80], ra: [-25, 80] },
      { ...SF, t: -4, ll: [42, 42], rl: [-2, -2], la: [-25, 80], ra: [-25, 80] },
    ] },
    coach: { view: 'front', need: 'full', rep: { m: 'legSpread', rest: 1.3, active: 2.1 }, checks: [
      { m: 'lean', stat: 'max', op: '>', v: 15, msg: 'No inclines el tronco, mantente recta' },
    ] },
  },
  {
    id: 'puente', name: 'Puente de glúteo', view: 'side', cat: 'fuerza', zones: ['gluteos', 'core'], level: 1, impact: 'bajo', met: 3.5,
    muscles: 'Glúteos, isquiotibiales, zona lumbar',
    steps: ['Túmbate boca arriba, rodillas dobladas y pies apoyados.', 'Brazos a los lados.', 'Eleva la cadera apretando glúteos hasta formar una línea hombros-rodillas.', 'Baja despacio sin apoyar del todo.'],
    tips: ['Empuja con los talones.', 'Aprieta 1 segundo arriba.'],
    errors: ['Arquear la zona lumbar.', 'Subir poco la cadera.'],
    harder: 'puenteunapierna',
    anim: { dur: 2.6, anchor: 'A', hold: [0.15, 0.3], frames: [
      { ...SUP, ll: [132, -28], rl: [134, -26] },
      { ...SUP, t: -116, ll: [105, -15], rl: [106, -14], la: [100, 95], ra: [99, 94] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'hip', rest: 135, active: 155 }, checks: [
      { m: 'hip', stat: 'max', op: '<', v: 165, msg: 'Sube más la cadera y aprieta glúteos arriba' },
    ] },
  },
  {
    id: 'puenteunapierna', sides: true, name: 'Puente a una pierna', view: 'side', cat: 'fuerza', zones: ['gluteos', 'core'], level: 3, impact: 'bajo', met: 4,
    muscles: 'Glúteos, isquiotibiales, estabilidad',
    steps: ['Como el puente, pero con una pierna estirada en el aire.', 'Sube la cadera empujando con el talón apoyado.', 'Cambia de pierna a mitad de tiempo.'],
    tips: ['La cadera no debe girarse.'], errors: ['Caer hacia el lado de la pierna levantada.'],
    easier: 'puente',
    anim: { dur: 2.6, anchor: 'A', hold: [0.15, 0.3], frames: [
      { ...SUP, ll: [132, -28], rl: [150, 150] },
      { ...SUP, t: -116, ll: [105, -15], rl: [118, 118], la: [100, 95], ra: [99, 94] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'hip', rest: 135, active: 155 }, checks: [
      { m: 'hip', stat: 'max', op: '<', v: 162, msg: 'Sube más la cadera' },
    ] },
  },
  {
    id: 'patadagluteo', sides: true, name: 'Patada de glúteo', view: 'side', cat: 'fuerza', zones: ['gluteos'], level: 1, impact: 'bajo', met: 3.5,
    muscles: 'Glúteo mayor',
    steps: ['A cuatro patas: manos bajo hombros, rodillas bajo caderas.', 'Sube una pierna con la rodilla doblada, planta del pie hacia el techo.', 'Baja sin apoyar la rodilla. Cambia a mitad de tiempo.'],
    tips: ['Abdomen activo para no arquear la espalda.'], errors: ['Arquear la lumbar al subir.', 'Girar la cadera.'],
    anim: { dur: 2, anchor: 'W', frames: [
      QUAD,
      { ...QUAD, rl: [-98, 178] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'hipMax', rest: 120, active: 155 }, checks: [
      { m: 'hipMax', stat: 'max', op: '<', v: 160, msg: 'Sube más la pierna, el muslo hasta la línea de la espalda' },
    ] },
  },
  {
    id: 'talonesgemelos', name: 'Elevación de talones', view: 'side', cat: 'fuerza', zones: ['piernas'], level: 1, impact: 'bajo', met: 3,
    muscles: 'Gemelos, tobillos',
    steps: ['De pie, puedes apoyarte en una pared o silla.', 'Sube sobre las puntas de los pies.', 'Aguanta un segundo y baja despacio.'],
    tips: ['Sube recta, sin echar el cuerpo hacia delante.'], errors: ['Bajar de golpe.'],
    anim: { dur: 2, hold: [0.2, 0.4], frames: [{ ...S, ra: [-25, 80], la: [-25, 80] }, { ...S, ra: [-25, 80], la: [-25, 80], ft: 58 }] },
    coach: { view: 'side', need: 'full', rep: { m: 'heel', rest: 0.05, active: 0.18 }, checks: [] },
  },
  {
    id: 'bisagra', name: 'Bisagra de cadera', view: 'side', cat: 'fuerza', zones: ['gluteos', 'piernas'], level: 1, impact: 'bajo', met: 3.5,
    muscles: 'Isquiotibiales, glúteos, espalda',
    steps: ['De pie, rodillas ligeramente flexionadas.', 'Lleva la cadera hacia atrás inclinando el tronco con la espalda recta.', 'Baja hasta notar estiramiento detrás de los muslos.', 'Vuelve apretando glúteos.'],
    tips: ['Imagina que cierras una puerta con el culete.'], errors: ['Redondear la espalda.', 'Doblar mucho las rodillas.'],
    anim: { dur: 2.8, anchor: 'A', hold: [0.15, 0.15], frames: [S, { ...S, t: 72, h: 5, ll: [12, -10], rl: [14, -8], la: [-2, -2], ra: [2, 2] }] },
    coach: { view: 'side', need: 'full', rep: { m: 'lean', rest: 25, active: 50 }, checks: [
      { m: 'knee', stat: 'min', op: '<', v: 130, msg: 'No dobles tanto las rodillas, el movimiento sale de la cadera' },
    ] },
  },
  {
    id: 'sentadillasalto', name: 'Sentadilla con salto', view: 'side', cat: 'cardio', zones: ['piernas', 'gluteos', 'cardio'], level: 3, impact: 'alto', met: 8.5,
    muscles: 'Piernas, glúteos, potencia',
    steps: ['Haz una sentadilla.', 'Sube con fuerza y salta estirando el cuerpo.', 'Aterriza suave y baja directamente a la siguiente.'],
    tips: ['Aterriza con las rodillas flexionadas.'], errors: ['Aterrizar con piernas rectas.'],
    easier: 'sentadilla',
    anim: { dur: 1.6, anchor: 'A', frames: [
      { ...SQ, la: [-30, -20], ra: [-30, -20] },
      { ...S, la: [165, 170], ra: [165, 170], lift: 0.2, ft: 45 },
      { ...S, t: 10, ll: [20, -15], rl: [22, -14] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'knee', rest: 155, active: 130 }, checks: [
      { m: 'knee', stat: 'min', op: '>', v: 115, msg: 'Baja más antes de saltar' },
      { m: 'lean', stat: 'max', op: '>', v: 55, msg: 'Pecho arriba' },
    ] },
  },

  // ───────────── BRAZOS Y TREN SUPERIOR ─────────────
  {
    id: 'flexionesrodillas', name: 'Flexiones con rodillas', view: 'side', cat: 'fuerza', zones: ['brazos', 'cuerpo'], level: 1, impact: 'bajo', met: 4,
    muscles: 'Pecho, tríceps, hombros, abdomen',
    steps: ['Apoya manos (algo más abiertas que los hombros) y rodillas.', 'Cuerpo en línea recta desde la cabeza hasta las rodillas.', 'Baja el pecho doblando codos hacia atrás.', 'Empuja para subir.'],
    tips: ['Codos a unos 45° del cuerpo, no abiertos en cruz.'], errors: ['Hundir la cadera.', 'Bajar solo la cabeza.'],
    harder: 'flexiones',
    anim: { dur: 2.4, anchor: 'K', frames: [
      { t: 72, h: 4, la: [0, 0], ra: [2, 2], ll: [-72, -150], rl: [-72, -150], ft: -50 },
      { t: 84, h: 4, la: [-55, 20], ra: [-53, 22], ll: [-84, -160], rl: [-84, -160], ft: -50 },
    ] },
    coach: { view: 'side', need: 'upper', rep: { m: 'elbow', rest: 150, active: 115 }, checks: [
      { m: 'elbow', stat: 'min', op: '>', v: 105, msg: 'Baja más el pecho hacia el suelo' },
      { m: 'sagK', stat: 'max', op: '>', v: 0.09, msg: 'No hundas la cadera, cuerpo en línea' },
      { m: 'sagK', stat: 'min', op: '<', v: -0.12, msg: 'Baja un poco la cadera, cuerpo recto' },
    ] },
  },
  {
    id: 'flexiones', name: 'Flexiones', view: 'side', cat: 'fuerza', zones: ['brazos', 'cuerpo', 'core'], level: 3, impact: 'bajo', met: 6,
    muscles: 'Pecho, tríceps, hombros, abdomen',
    steps: ['Plancha con brazos estirados, manos bajo los hombros.', 'Cuerpo recto de cabeza a talones.', 'Baja el pecho casi al suelo.', 'Empuja para subir.'],
    tips: ['Si no puedes, apoya rodillas.'], errors: ['Cadera hundida o muy alta.'],
    easier: 'flexionesrodillas',
    anim: { dur: 2.4, anchor: 'A', frames: [
      PLK,
      { ...PLK, t: 82, ll: [-82, -82], rl: [-82, -82], la: [-55, 22], ra: [-53, 24] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'elbow', rest: 150, active: 115 }, checks: [
      { m: 'elbow', stat: 'min', op: '>', v: 100, msg: 'Baja más el pecho' },
      { m: 'sag', stat: 'max', op: '>', v: 0.07, msg: 'No hundas la cadera' },
      { m: 'sag', stat: 'min', op: '<', v: -0.1, msg: 'Baja la cadera, cuerpo en línea' },
    ] },
  },
  {
    id: 'elevlaterales', name: 'Elevaciones laterales', view: 'front', cat: 'fuerza', zones: ['brazos'], level: 1, impact: 'bajo', met: 3.5,
    muscles: 'Hombros (deltoides)',
    steps: ['De pie, una botella de agua en cada mano (opcional).', 'Sube los brazos hacia los lados hasta la altura de los hombros.', 'Baja despacio.'],
    tips: ['Codos ligeramente flexionados.', 'No subas por encima de los hombros.'], errors: ['Impulsarse con el cuerpo.', 'Encoger los hombros.'],
    anim: { dur: 2.4, hold: [0.2, 0.15], frames: [{ ...SF, la: [8, 8], ra: [8, 8] }, { ...SF, la: [86, 90], ra: [86, 90] }] },
    coach: { view: 'front', need: 'upper', rep: { m: 'armRaise', rest: 30, active: 70 }, checks: [
      { m: 'armRaise', stat: 'max', op: '<', v: 75, msg: 'Sube los brazos hasta la altura de los hombros' },
      { m: 'armRaise', stat: 'max', op: '>', v: 115, msg: 'No subas tanto, solo hasta los hombros' },
    ] },
  },
  {
    id: 'pressHombro', name: 'Press de hombros', view: 'front', cat: 'fuerza', zones: ['brazos'], level: 1, impact: 'bajo', met: 3.5,
    muscles: 'Hombros, tríceps',
    steps: ['Brazos en forma de W: codos a la altura de los hombros, manos arriba.', 'Empuja hacia el techo hasta estirar.', 'Baja controlando a la W.'],
    tips: ['Usa botellas de agua o mancuernas ligeras.', 'Abdomen firme, sin arquear la espalda.'], errors: ['Bajar los codos por debajo de los hombros.'],
    anim: { dur: 2.2, frames: [{ ...SF, la: [88, 178], ra: [88, 178] }, { ...SF, la: [168, 176], ra: [168, 176] }] },
    coach: { view: 'front', need: 'upper', rep: { m: 'elbow', rest: 110, active: 150 }, checks: [
      { m: 'elbow', stat: 'max', op: '<', v: 155, msg: 'Estira del todo los brazos arriba' },
      { m: 'armRaise', stat: 'min', op: '<', v: 65, msg: 'No bajes los codos por debajo de los hombros' },
    ] },
  },

  // ───────────── ABDOMEN / CORE ─────────────
  {
    id: 'plancha', name: 'Plancha de antebrazos', view: 'side', cat: 'core', zones: ['core', 'cuerpo'], level: 2, impact: 'bajo', met: 4, unit: 'tiempo',
    muscles: 'Abdomen, hombros, glúteos',
    steps: ['Apoya antebrazos (codos bajo hombros) y puntas de los pies.', 'Cuerpo recto de cabeza a talones.', 'Aprieta abdomen y glúteos, y respira.'],
    tips: ['Si cuesta, apoya rodillas.', 'Mirada al suelo, cuello largo.'], errors: ['Cadera hundida.', 'Culete muy alto.'],
    anim: { dur: 1, frames: [{ t: 79, h: 4, la: [0, 90], ra: [2, 90], ll: [-79, -79], rl: [-79, -79], ft: 10 }] },
    coach: { view: 'side', need: 'full', checks: [
      { m: 'sag', op: '>', v: 0.06, msg: 'Sube un poco la cadera, no la hundas', hold: true },
      { m: 'sag', op: '<', v: -0.09, msg: 'Baja la cadera, cuerpo en línea recta', hold: true },
    ] },
  },
  {
    id: 'escaladores', name: 'Escaladores', view: 'side', cat: 'cardio', zones: ['core', 'cardio', 'cuerpo'], level: 2, impact: 'bajo', met: 8,
    muscles: 'Abdomen, hombros, cardio',
    steps: ['Plancha con brazos estirados.', 'Lleva una rodilla hacia el pecho.', 'Cambia de pierna rápido, como si corrieras.'],
    tips: ['Más lento = más fácil.', 'Mantén la cadera baja.'], errors: ['Subir mucho el culete.'],
    anim: { dur: 0.8, anchor: 'W', frames: [
      { ...PLK, rl: [35, -55], ll: [-66, -66], ft: 0 },
      { ...PLK, ll: [35, -55], rl: [-66, -66], ft: 0 },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'kneeLift', rest: 150, active: 115 }, checks: [
      { m: 'sag', stat: 'min', op: '<', v: -0.14, msg: 'Baja la cadera, mantén la plancha' },
    ] },
  },
  {
    id: 'crunch', name: 'Abdominales (crunch)', view: 'side', cat: 'core', zones: ['core'], level: 1, impact: 'bajo', met: 3.8,
    muscles: 'Recto abdominal',
    steps: ['Boca arriba, rodillas dobladas, pies apoyados.', 'Brazos estirados hacia las rodillas.', 'Despega los hombros del suelo usando el abdomen.', 'Baja despacio.'],
    tips: ['No tires del cuello.', 'Expulsa el aire al subir.'], errors: ['Subir con impulso.', 'Pegar la barbilla al pecho.'],
    anim: { dur: 2.2, anchor: 'A', hold: [0.1, 0.2], frames: [
      { ...SUP, la: [100, 100], ra: [100, 100] },
      { ...SUP, t: -62, h: 10, la: [98, 98], ra: [97, 97] },
    ] },
    coach: { view: 'side', need: 'upper', rep: { m: 'lean', rest: 82, active: 70 }, checks: [
      { m: 'lean', stat: 'min', op: '>', v: 72, msg: 'Despega un poco más los hombros' },
    ] },
  },
  {
    id: 'bicicleta', name: 'Bicicleta abdominal', view: 'side', cat: 'core', zones: ['core'], level: 2, impact: 'bajo', met: 4.5,
    muscles: 'Abdomen, oblicuos',
    steps: ['Boca arriba, manos detrás de la cabeza, hombros despegados.', 'Acerca una rodilla al pecho mientras estiras la otra.', 'Alterna como si pedalearas, girando el tronco hacia la rodilla.'],
    tips: ['Despacio y controlado.', 'Lumbar pegada al suelo.'], errors: ['Tirar del cuello con las manos.'],
    anim: { dur: 1.4, frames: [
      { t: -68, h: 10, la: [-150, 80], ra: [-150, 80], rl: [165, 82], ll: [100, 100] },
      { t: -68, h: 10, la: [-150, 80], ra: [-150, 80], ll: [165, 82], rl: [100, 100] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'kneeLift', rest: 135, active: 90 }, checks: [] },
  },
  {
    id: 'piernas', name: 'Elevación de piernas', view: 'side', cat: 'core', zones: ['core'], level: 2, impact: 'bajo', met: 4,
    muscles: 'Abdomen inferior',
    steps: ['Boca arriba, piernas estiradas, manos bajo los glúteos.', 'Sube las piernas juntas hasta la vertical.', 'Baja despacio sin llegar a tocar el suelo.'],
    tips: ['Si molesta la lumbar, dobla un poco las rodillas.'], errors: ['Arquear la espalda al bajar.'],
    anim: { dur: 2.6, frames: [
      { t: -90, la: [90, 90], ra: [90, 90], ll: [98, 98], rl: [98, 98] },
      { t: -90, la: [90, 90], ra: [90, 90], ll: [172, 172], rl: [172, 172] },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'hip', rest: 150, active: 115 }, checks: [
      { m: 'hip', stat: 'min', op: '>', v: 110, msg: 'Sube más las piernas, hasta la vertical' },
    ] },
  },
  {
    id: 'tijeras', name: 'Tijeras', view: 'side', cat: 'core', zones: ['core'], level: 2, impact: 'bajo', met: 4,
    muscles: 'Abdomen inferior, flexores de cadera',
    steps: ['Boca arriba, piernas estiradas y despegadas del suelo.', 'Sube y baja las piernas alternando, con pequeños movimientos.'],
    tips: ['Cuanto más altas, más fácil.'], errors: ['Arquear la lumbar.'],
    anim: { dur: 0.7, frames: [
      { t: -84, h: 6, la: [92, 92], ra: [92, 92], ll: [112, 112], rl: [130, 130] },
      { t: -84, h: 6, la: [92, 92], ra: [92, 92], rl: [112, 112], ll: [130, 130] },
    ] },
    coach: { view: 'side', need: 'full', checks: [] },
  },
  {
    id: 'deadbug', name: 'Bicho muerto', view: 'side', cat: 'core', zones: ['core'], level: 1, impact: 'bajo', met: 3.5,
    muscles: 'Abdomen profundo, estabilidad',
    steps: ['Boca arriba, brazos hacia el techo, rodillas a 90° en el aire.', 'Estira a la vez un brazo hacia atrás y la pierna contraria.', 'Vuelve y cambia de lado.'],
    tips: ['La zona lumbar siempre pegada al suelo.', 'Muy lento.'], errors: ['Despegar la espalda.'],
    anim: { dur: 4, frames: [
      { t: -90, la: [180, 180], ra: [180, 180], ll: [178, 90], rl: [178, 90] },
      { t: -90, ra: [-95, -95], la: [180, 180], ll: [98, 98], rl: [178, 90] },
      { t: -90, la: [180, 180], ra: [180, 180], ll: [178, 90], rl: [178, 90] },
      { t: -90, la: [-95, -95], ra: [180, 180], rl: [98, 98], ll: [178, 90] },
    ] },
    coach: { view: 'side', need: 'full', checks: [] },
  },
  {
    id: 'pajaroperro', name: 'Pájaro-perro', view: 'side', cat: 'core', zones: ['core', 'gluteos'], level: 1, impact: 'bajo', met: 3,
    muscles: 'Espalda, glúteos, abdomen',
    steps: ['A cuatro patas.', 'Estira a la vez un brazo hacia delante y la pierna contraria hacia atrás.', 'Aguanta 2 segundos y cambia.'],
    tips: ['Imagina un vaso de agua en tu espalda.'], errors: ['Girar la cadera.', 'Subir la pierna por encima de la espalda.'],
    anim: { dur: 4.4, anchor: 'K', frames: [
      QUAD, { ...QUAD, ra: [170, 170], ll: [-95, -95] }, QUAD, { ...QUAD, la: [170, 170], rl: [-95, -95] },
    ], hold: [0, 0.6, 0, 0.6] },
    coach: { view: 'side', need: 'full', rep: { m: 'hipMax', rest: 120, active: 155 }, checks: [] },
  },
  {
    id: 'superman', name: 'Superman', view: 'side', cat: 'core', zones: ['core', 'gluteos'], level: 1, impact: 'bajo', met: 3,
    muscles: 'Lumbares, glúteos, espalda',
    steps: ['Boca abajo, brazos estirados por delante.', 'Despega a la vez brazos, pecho y piernas.', 'Aguanta un segundo y baja.'],
    tips: ['Mirada al suelo, cuello largo.'], errors: ['Subir con tirón.'],
    anim: { dur: 2.4, hold: [0.1, 0.4], frames: [
      { t: 90, h: 0, la: [92, 92], ra: [90, 90], ll: [-90, -90], rl: [-90, -90], ft: 90 },
      { t: 80, h: -6, la: [104, 104], ra: [102, 102], ll: [-100, -100], rl: [-100, -100], ft: 90 },
    ] },
    coach: { view: 'side', need: 'full', checks: [] },
  },

  // ───────────── COMBINADOS / INTENSOS ─────────────
  {
    id: 'burpee', name: 'Burpee', view: 'side', cat: 'cardio', zones: ['cardio', 'cuerpo'], level: 3, impact: 'alto', met: 10,
    muscles: 'Cuerpo completo',
    steps: ['De pie, baja en sentadilla y apoya las manos.', 'Lleva los pies atrás a plancha.', 'Vuelve a la sentadilla.', 'Salta con los brazos arriba.'],
    tips: ['Versión suave: da pasos atrás en lugar de saltar, y sin salto final.'], errors: ['Hundir la cadera en la plancha.'],
    easier: 'sentadilla',
    anim: { dur: 3.2, frames: [
      S,
      { t: 50, h: -10, la: [12, 0], ra: [14, 2], ll: [100, -40], rl: [100, -40], ft: 20 },
      { ...PLK },
      { t: 50, h: -10, la: [12, 0], ra: [14, 2], ll: [100, -40], rl: [100, -40], ft: 20 },
      { ...S, la: [170, 175], ra: [170, 175], lift: 0.16, ft: 45 },
    ] },
    coach: { view: 'side', need: 'full', rep: { m: 'lean', rest: 30, active: 60 }, checks: [] },
  },

  // ───────────── ESTIRAMIENTOS ─────────────
  {
    id: 'estlateral', name: 'Estiramiento lateral', view: 'front', cat: 'estiramiento', zones: ['estiramiento'], level: 1, impact: 'bajo', met: 2.3, unit: 'tiempo',
    muscles: 'Costados, espalda',
    steps: ['De pie, brazos arriba.', 'Inclínate suavemente hacia un lado.', 'Respira profundo y cambia de lado.'],
    tips: ['Crece hacia arriba antes de inclinarte.'], errors: ['Girar el tronco.'],
    anim: { dur: 6, hold: [0.6, 0.2, 0.6, 0.2], frames: [
      { ...SF, t: -16, la: [175, 165], ra: [150, 175] }, { ...SF, la: [172, 178], ra: [172, 178] },
      { ...SF, t: 16, ra: [175, 165], la: [150, 175] }, { ...SF, la: [172, 178], ra: [172, 178] },
    ] },
    coach: { view: 'front', need: 'upper', checks: [] },
  },
  {
    id: 'estcuadriceps', sides: true, name: 'Estiramiento de cuádriceps', view: 'side', cat: 'estiramiento', zones: ['estiramiento'], level: 1, impact: 'bajo', met: 2.3, unit: 'tiempo',
    muscles: 'Cuádriceps',
    steps: ['De pie, agarra un tobillo y lleva el talón al glúteo.', 'Rodillas juntas, cadera hacia delante.', 'Cambia de pierna a mitad de tiempo.'],
    tips: ['Apóyate en una pared si te desequilibras.'], errors: ['Separar la rodilla hacia fuera.'],
    anim: { dur: 1, frames: [{ ...S, rl: [-8, -168], ra: [-22, -12], la: [70, 80] }] },
    coach: { view: 'side', need: 'full', checks: [] },
  },
  {
    id: 'estisquios', name: 'Estiramiento de isquios', view: 'side', cat: 'estiramiento', zones: ['estiramiento'], level: 1, impact: 'bajo', met: 2.3, unit: 'tiempo',
    muscles: 'Isquiotibiales, espalda baja',
    steps: ['Sentada con las piernas estiradas.', 'Inclínate hacia delante desde la cadera.', 'Lleva las manos hacia los pies sin rebotes.'],
    tips: ['No pasa nada si no llegas a los pies.'], errors: ['Rebotar.', 'Bloquear las rodillas con dolor.'],
    anim: { dur: 6, hold: [0.3, 0.8], frames: [
      { t: 20, h: 0, la: [80, 85], ra: [80, 85], ll: [90, 90], rl: [90, 90], ft: 0 },
      { t: 55, h: 10, la: [102, 98], ra: [100, 96], ll: [90, 90], rl: [90, 90], ft: 0 },
    ] },
    coach: { view: 'side', need: 'full', checks: [] },
  },
  {
    id: 'nino', name: 'Postura del niño', view: 'side', cat: 'estiramiento', zones: ['estiramiento'], level: 1, impact: 'bajo', met: 2, unit: 'tiempo',
    muscles: 'Espalda, caderas',
    steps: ['De rodillas, siéntate sobre los talones.', 'Lleva el pecho hacia los muslos y estira los brazos por delante.', 'Respira lento y relaja.'],
    tips: ['Separa las rodillas si te resulta más cómodo.'], errors: [],
    anim: { dur: 1, frames: [{ t: 104, h: 12, la: [70, 90], ra: [68, 88], ll: [34, -92], rl: [36, -92], ft: -85 }] },
    coach: { view: 'side', need: 'full', checks: [] },
  },
  {
    id: 'gatovaca', name: 'Gato-vaca', view: 'side', cat: 'estiramiento', zones: ['estiramiento', 'core'], level: 1, impact: 'bajo', met: 2.3, unit: 'tiempo',
    muscles: 'Columna, espalda',
    steps: ['A cuatro patas.', 'Al inspirar, hunde la espalda y mira al frente.', 'Al espirar, redondea la espalda y mira al ombligo.'],
    tips: ['Muévete con la respiración.'], errors: ['Ir rápido.'],
    anim: { dur: 5, anchor: 'K', frames: [{ ...QUAD, t: 82, h: -28 }, { ...QUAD, t: 72, h: 38 }] },
    coach: { view: 'side', need: 'full', checks: [] },
  },
  {
    id: 'cobra', name: 'Cobra', view: 'side', cat: 'estiramiento', zones: ['estiramiento', 'core'], level: 1, impact: 'bajo', met: 2.3, unit: 'tiempo',
    muscles: 'Abdomen, espalda',
    steps: ['Boca abajo, manos bajo los hombros.', 'Empuja suave para subir el pecho, cadera en el suelo.', 'Hombros lejos de las orejas.'],
    tips: ['Sube solo hasta donde no moleste la lumbar.'], errors: ['Encoger los hombros.'],
    anim: { dur: 5, hold: [0.3, 0.8], frames: [
      { t: 88, h: 0, la: [-60, 60], ra: [-58, 62], ll: [-90, -90], rl: [-90, -90], ft: 90 },
      { t: 52, h: -12, la: [-6, -6], ra: [-4, -4], ll: [-90, -90], rl: [-90, -90], ft: 90 },
    ] },
    coach: { view: 'side', need: 'full', checks: [] },
  },
  // ───────────── SUELO PÉLVICO (sin cámara) ─────────────
  {
    id: 'suelopelvico', name: 'Activación de suelo pélvico', view: 'side', cat: 'estiramiento', zones: ['estiramiento', 'core'], level: 1, impact: 'bajo', met: 1.5, unit: 'tiempo', noCamera: true,
    muscles: 'Suelo pélvico, abdomen profundo',
    steps: ['Boca arriba con las rodillas dobladas.', 'Al soltar el aire, aprieta y eleva el suelo pélvico (como si cortaras el pis) durante 5 segundos.', 'Al coger aire, suelta del todo 5 segundos.'],
    tips: ['No aprietes glúteos ni aguantes la respiración.', 'Recomendado a partir de los 40 y tras embarazos.'], errors: ['Empujar hacia abajo en vez de elevar.'],
    voice: { every: 5, a: 'Aprieta y sube', b: 'Suelta' },
    anim: { dur: 10, frames: [{ ...SUP, la: [-150, 100], ra: [-150, 100] }, { ...SUP, t: -88, la: [-150, 100], ra: [-150, 100] }] },
    coach: { view: 'side', need: 'full', checks: [] },
  },
];

export const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const ZONES = [
  { id: 'cuerpo', name: 'Cuerpo entero', emoji: '🔥' },
  { id: 'gluteos', name: 'Glúteos', emoji: '🍑' },
  { id: 'piernas', name: 'Piernas', emoji: '🦵' },
  { id: 'core', name: 'Abdomen', emoji: '💪' },
  { id: 'brazos', name: 'Brazos', emoji: '🙌' },
  { id: 'cardio', name: 'Cardio', emoji: '❤️' },
  { id: 'estiramiento', name: 'Estiramientos', emoji: '🧘‍♀️' },
];

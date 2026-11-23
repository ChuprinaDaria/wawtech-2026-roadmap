/* Every word of the "limits first" toy, in two languages. Keep it short: a label is two words, a verdict is one thought. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LimitsText = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const uk = {
    hint: 'Тягни дрон і ціль. Тисни на все інше.',
    name: { gpt: 'GPT', dino: 'DINO', yolo: 'YOLO', tiles: 'плитки', mask: 'маска', motion: 'рух' },
    why: { never: 'ніколи', board: 'не тягне', px: 'мало px', night: 'ніч', fog: 'туман', blur: 'мажеться', ok: 'живе', shaky: 'трясе' },
    verdict: {
      night: 'Уночі ця камера сліпа. Візьми тепловізор.',
      fog: 'Туман з’їв ціль. Підійди ближче.',
      johnson: 'Джонсон каже ні. Ціль задалеко.',
      smear: 'Усе розмазало. Потрібен підвіс або вишка.',
      board: '{name} порве твоє залізо.',
      dot: 'Тут ціль просто цятка. Підсунь її ближче.',
      noclass: 'Щось є, а класу немає. Хочеш клас: підійди ближче.',
      shed: 'Танк тут виглядає як сарай.',
      shedAir: 'Дрон тут виглядає як птах.',
      fine: 'Тут усе видно. Бери найпростіше, що живе.',
    },
    camera: { plain: 'звичайна', thermal: 'тепловізор' },
    carrier: { fly: 'літає', tower: 'вишка' },
    board: { weak: 'слабке', mid: 'середнє', strong: 'потужне' },
    scene: {
      h: 'H {n} м', ground: '{n} м', slant: 'до цілі {n} м', angle: 'кут {n}°', px: '{n} px',
      see: 'видно, що це', shed: 'танк як сарай', shedAir: 'дрон як птах', dot: 'цятка', johnson: 'далі Джонсон каже ні',
      tapNight: 'тисни: ніч', tapDay: 'тисни: день', tapHaze: 'тисни: імла', tapFog: 'тисни: туман', tapClear: 'тисни: ясно',
    },
    legend: { a: '16+ px', b: '8–16', c: '2–8', d: 'менше 2' },
    aria: {
      scene: 'Сцена збоку: носій, ціль і те, що між ними', drone: 'Висота носія. Стрілки вгору й униз', target: 'Ціль. Стрілки рухають її',
      sun: 'День або ніч', cloud: 'Погода', camera: 'Камера', carrier: 'Носій', board: 'Залізо', lang: 'Switch to English', who: 'Хто дожив',
    },
    foot: 'Числа грубі, це порядок величини. Звідки вони: розділ 02 карти.',
    other: 'EN',
  };
  const en = {
    hint: 'Drag the drone and the target. Tap everything else.',
    name: { gpt: 'GPT', dino: 'DINO', yolo: 'YOLO', tiles: 'tiles', mask: 'mask', motion: 'motion' },
    why: { never: 'never', board: 'too heavy', px: 'few px', night: 'night', fog: 'fog', blur: 'smeared', ok: 'alive', shaky: 'shaky' },
    verdict: {
      night: 'At night this camera is blind. Take a thermal one.',
      fog: 'The fog ate the target. Come closer.',
      johnson: 'Johnson says no. The target is too far.',
      smear: 'Everything is smeared. You need a gimbal or a tower.',
      board: '{name} will tear your hardware apart.',
      dot: 'The target is just a dot here. Bring it closer.',
      noclass: 'Something is there, with no class. Want a class? Come closer.',
      shed: 'The tank looks like a shed from here.',
      shedAir: 'The drone looks like a bird from here.',
      fine: 'Everything is visible. Take the simplest thing that lives.',
    },
    camera: { plain: 'plain', thermal: 'thermal' },
    carrier: { fly: 'flying', tower: 'tower' },
    board: { weak: 'weak', mid: 'medium', strong: 'strong' },
    scene: {
      h: 'H {n} m', ground: '{n} m', slant: '{n} m to target', angle: 'angle {n}°', px: '{n} px',
      see: 'recognisable', shed: 'a tank like a shed', shedAir: 'a drone like a bird', dot: 'a dot', johnson: 'beyond, Johnson says no',
      tapNight: 'tap: night', tapDay: 'tap: day', tapHaze: 'tap: haze', tapFog: 'tap: fog', tapClear: 'tap: clear',
    },
    legend: { a: '16+ px', b: '8–16', c: '2–8', d: 'under 2' },
    aria: {
      scene: 'Side view: the carrier, the target and what lies between them', drone: 'Height of the carrier. Arrow keys up and down', target: 'The target. Arrow keys move it',
      sun: 'Day or night', cloud: 'Weather', camera: 'Camera', carrier: 'Carrier', board: 'Hardware', lang: 'Перемкнути на українську', who: 'Who survived',
    },
    foot: 'The numbers are rough, an order of magnitude. Where they come from: chapter 02 of the roadmap.',
    other: 'UA',
  };
  return { uk, en };
});

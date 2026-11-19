// Project LORA — глобальний простір імен. Завантажується ПЕРШИМ (див. index.html).
// Усі модулі реєструються тут: LORA.data (дані), LORA.core (утиліти), LORA.sim (симуляція),
// LORA.ai (агенти), LORA.ui (інтерфейс), LORA.stream (інтеграція зі стрімом).
(function (root) {
  const L = root.LORA = root.LORA || {};
  L.version = '3.1.0';
  L.data = L.data || {};
  L.core = L.core || {};
  L.sim = L.sim || { modules: [] };
  L.ai = L.ai || {};
  L.ui = L.ui || {};
  L.stream = L.stream || {};
  // Реєстрація модуля симуляції: функція отримує об'єкт гри G і додає до нього свої функції.
  L.sim.register = function (name, order, install) { L.sim.modules.push({ name, order, install }); L.sim.modules.sort((a, b) => a.order - b.order); };
})(typeof window !== 'undefined' ? window : globalThis);

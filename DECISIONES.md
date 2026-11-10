# Decisiones

Registro de decisiones tomadas cuando algo era ambiguo. Se eligió siempre la opción más simple.

## Técnicas

| # | Decisión | Motivo |
|---|----------|--------|
| T1 | **Next.js 16 con `cacheComponents: false`.** | Casi todas las pantallas dependen de la sesión del usuario; el renderizado dinámico clásico evita tener que envolver cada lectura de cookies en `<Suspense>`. Se puede activar más adelante para la landing. |
| T2 | **La autenticación usa `proxy.ts`** (antes `middleware.ts`, renombrado en Next 16). | Refresca la sesión de Supabase y protege las rutas privadas. |
| T3 | **Fórmulas en un solo lugar: `lib/calculos.ts`.** La base de datos solo agrega `total_gastos` en la vista `autos_resumen`. | Una sola fuente de verdad, fácil de probar con tests. |
| T4 | **Excel generado en el servidor** (route handler + `exceljs`). No se usa `xlsx`/SheetJS. | La versión de SheetJS publicada en npm está desactualizada y tiene vulnerabilidades conocidas. Generarlo en el servidor evita cargar la librería en celulares de gama media. |
| T5 | **Fotos comprimidas en el celular antes de subir** (máx. 1600 px, JPEG ~80 %) + miniatura de 400 px. Sin dependencias extra (canvas nativo). | Subidas rápidas con datos móviles y listas livianas. |
| T6 | **Buckets privados** (`fotos-autos`, `documentos`) con rutas `{user_id}/{auto_id}/archivo` y URLs firmadas de 1 hora. | Cada usuario solo puede leer sus archivos. |
| T7 | **PWA con `app/manifest.ts` nativo + service worker mínimo** (sin plugins). | Menos dependencias; suficiente para instalar la app en el celular. |
| T8 | **Las relaciones entre tablas incluyen `user_id`** (claves foráneas compuestas). | Impide enlazar un gasto, foto o contacto a un auto de otro usuario aunque se conozca su id. |
| T9 | **Sin `next/image` para fotos de autos;** se usa `<img loading="lazy">` con miniaturas ya comprimidas. | Las URLs firmadas cambian cada hora y el optimizador de imágenes de Vercel tiene costo por uso. |
| T10 | **Supabase local para desarrollo** (`npx supabase start`). | Permite probar RLS y storage sin tocar producción. |
| T11 | **Vercel en la región `gru1` (São Paulo)** vía `vercel.json`. | Es la más cercana a Lima y a Supabase `sa-east-1`; menos latencia por petición. |
| T12 | **El service worker no guarda páginas con datos del usuario,** solo archivos estáticos y una página "sin conexión". | Privacidad (celulares compartidos) y evitar mostrar datos viejos. La app requiere conexión. |
| T13 | **La calculadora "¿lo compro?" corre en el navegador** (sin ir al servidor). | Respuesta instantánea mientras se escribe, incluso con mala señal. |
| T14 | **Anuncios generados a pedido** (botón) y no al abrir la ficha. | Hoy es instantáneo con plantillas, pero cuando se conecte IA cada generación tendrá costo. A la IA nunca se le envían placa, DNI ni teléfonos. |

## De negocio

| # | Decisión |
|---|----------|
| N1 | **"En evaluación" = auto aún no comprado.** No cuenta como stock, ni como capital inmovilizado, ni suma días en stock. |
| N2 | **Días en stock** = desde la fecha de compra hasta la fecha de venta, o hasta hoy (hora de Lima) si no se vendió. |
| N3 | **Ganancia del mes** = suma de la ganancia de los autos con fecha de venta dentro del mes actual (hora de Lima). |
| N4 | **Capital inmovilizado** = costo total (compra + gastos) de los autos *en stock* y *reservados*. |
| N5 | **Margen %** = ganancia ÷ precio de venta × 100. Se usa el mismo criterio en la ficha, el dashboard y la calculadora. |
| N6 | **Costo total** = precio de compra + suma de gastos. **Ganancia real** solo existe cuando el auto está vendido; antes se muestra una **ganancia proyectada** con el precio objetivo. |
| N7 | **Días promedio en stock (dashboard)** = promedio de los autos que hoy están en stock o reservados. En la tabla por modelo se muestra además el promedio de días hasta vender. |
| N8 | **Registro rápido:** solo son obligatorios placa, marca, modelo, año y estado. Precio y fecha de compra son obligatorios salvo en "en evaluación". El resto está en "Más datos". |
| N9 | **Placa normalizada:** se guarda en mayúsculas sin espacios ni guiones (`ABC123`) y se muestra como `ABC-123`. Así la búsqueda funciona con o sin guion. La placa es única por usuario. |
| N10 | **Un auto vendido exige precio de venta final y fecha de venta.** |
| N11 | **Compradores y vendedores en una sola tabla `contactos`** con tipo (comprador / vendedor / ambos). En la ficha se registra el vendedor (a quién le compraste) y el comprador. En la Fase 1 no hay buscador de contactos existentes; se crean desde la ficha. |
| N12 | **Vencimientos:** solo SOAT y revisión técnica de autos que **no** están vendidos. Se muestran los vencidos y los que vencen en los próximos 30 días. |
| N13 | **Semáforo de la calculadora:** verde ≥ 15 %, amarillo ≥ 8 % y < 15 %, rojo < 8 %. Los umbrales se cambian en Ajustes y se guardan por usuario. |
| N14 | **Datos de ejemplo:** botón "Cargar 5 autos de ejemplo" dentro de la app (para la cuenta actual) y script `npm run seed` que crea un usuario demo. |
| N15 | **Moneda y formatos:** soles (`S/ 45,250.50`, formato es-PE), fechas `DD/MM/AAAA`, zona horaria `America/Lima` para todo cálculo de "hoy". |
| N16 | **Sin recuperación de contraseña en la Fase 1** (no fue pedida). Queda pendiente. |
| N17 | **Búsqueda:** cada palabra debe coincidir con placa, marca, modelo o versión ("toyota yaris", "abc-123", "ABC 123"). |
| N18 | **Venta:** se registra desde la ficha con "Registrar venta" (precio final + fecha). Se puede "Deshacer venta", que devuelve el auto a *en stock*. |
| N19 | **Al pasar un auto de "en evaluación" a stock/reservado sin fecha de compra,** se asume la fecha de hoy. |
| N20 | **Máximo 20 fotos por auto** (10 MB por archivo antes de comprimir). |
| N21 | **Los anuncios no muestran la placa** y el precio usado es el objetivo. Se indica "SOAT/revisión vigente" solo si hay un documento con fecha futura. |
| N22 | **Exportar a Excel** descarga los autos con el filtro y la búsqueda que se ven en pantalla, con una fila de totales. |

## Fase 2 — Documentos

| # | Decisión |
|---|----------|
| D1 | **PDF generado en el servidor con `pdf-lib`** (JavaScript puro, sin Chrome ni binarios nativos; funciona en Vercel). Los PDF no se guardan: se generan al momento con los datos actuales. |
| D2 | **Plantillas en texto plano con variables `{{grupo.dato}}`** y un formato mínimo (`#`, `##`, `-`, `[[FIRMAS]]`). Es fácil de editar desde el celular, sin un editor visual pesado. |
| D3 | **Una plantilla por tipo y por usuario** (tabla `plantillas`). Si el usuario no editó una, se usa la original del código; "Restaurar" borra la versión del usuario. |
| D4 | **El aviso "Plantilla referencial, revisar con un abogado" no se puede quitar:** está en el editor, en la sección de la ficha y al pie de cada página del PDF (fuera del texto editable). |
| D5 | **Dato faltante = línea en blanco** (`______________`) para completarlo a mano. No se bloquea la generación. |
| D6 | **"¿Quién vende?":** el usuario (datos de Ajustes) o el dueño anterior (vendedor registrado en la ficha). Muchos revendedores venden sin haber transferido el auto a su nombre. |
| D7 | **Número de recibo automático** = fecha + placa (`20261109-ABC123`). No se lleva un correlativo en la base de datos (evita estado extra); se puede cambiar en la plantilla. |
| D8 | **Montos en letras** al estilo peruano: `TREINTA Y SIETE MIL QUINIENTOS CON 00/100 SOLES`. |
| D9 | **El contrato menciona la transferencia ante notario e inscripción en SUNARP,** porque en Perú el contrato privado no reemplaza ese trámite. |
| D10 | **Fuentes estándar del PDF (Helvetica):** cubren tildes, ñ, ¿ ¡ y °. Los emojis y símbolos fuera de Latin-1 se eliminan al generar el PDF. |
| D11 | **El último párrafo nunca queda separado de las firmas;** si no entran juntos, pasan a la página siguiente. |
| D12 | **La vista previa del editor usa datos ficticios** y el texto aún sin guardar. |

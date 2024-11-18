# Inventory Sync Manager

Sistema de gestión y sincronización de inventario entre TuAmbia y Odoo.

## Características

- Gestión de plantillas de productos
- Sincronización de inventario entre sistemas
- Cálculo automático de ajustes necesarios
- Control de reservas por canal
- Detección de sobreventas
- Interfaz intuitiva
- Validación de estructura de archivos Excel
- Notificaciones en tiempo real
- Vista previa de datos
- Cálculo automático de reservas

## Tecnologías

- Next.js 13+ (App Router)
- TypeScript
- Prisma
- PostgreSQL
- TailwindCSS
- XLSX
- HeadlessUI

## Requisitos

- Node.js 16+
- PostgreSQL
- npm o yarn


## Estructura de Archivos Excel

### Plantilla de Productos
- Código TuAmbia
- Código Odoo
- Nombre TuAmbia
- Nombre Odoo
- Categoría
- Visible

### Archivo Odoo
- Producto/Código de barras
- Producto
- Unidad de medida
- Cantidad disponible

### Archivos TuAmbia
#### Vendidos
- Código del producto
- Nombre del producto
- Categoría
- Marca
- Cantidad

#### Disponibles
- Código
- Nombre
- Marca
- Categoría
- Visible
- Disponible

## Funcionalidades Principales

- Carga y validación de archivos Excel
- Sincronización automática de inventario
- Cálculo de ajustes necesarios
- Control de reservas por canal
- Detección y manejo de sobreventas
- Interfaz de usuario intuitiva
- Sistema de notificaciones
- Vista previa de datos
- Exportación de resultados

## Licencia

MIT
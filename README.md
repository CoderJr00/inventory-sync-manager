# 📊 Gestor de Inventario TuAmbia-Odoo

## 🎯 Descripción
Esta aplicación permite gestionar y sincronizar el inventario entre TuAmbia y Odoo, controlando las reservas de stock para diferentes canales de venta.

---

## ⭐ Funcionalidades Principales
* 📋 Carga de plantilla de productos
* 📥 Importación de datos de Odoo
* 🔄 Importación de datos de TuAmbia (vendidos y disponibles)
* ⚖️ Gestión de porcentajes de reserva por producto
* 🧮 Cálculo automático de ajustes necesarios

---

## 📑 Estructura de Archivos Excel Compatibles

### 1. 📌 Plantilla de Productos
> Archivo Excel con las siguientes columnas:
* `Código TuAmbia`: Código del producto en TuAmbia
* `Código Odoo`: Código del producto en Odoo
* `Nombre TuAmbia`: Nombre del producto en TuAmbia
* `Nombre Odoo`: Nombre del producto en Odoo
* `Categoría`: Categoría del producto
* `Visible`: "Si" o "No" (visibilidad del producto)

### 2. 📊 Datos de Odoo
> Archivo Excel con las columnas:
* `Producto/Código de barras`: Código del producto
* `Producto`: Nombre del producto
* `Unidad de medida`: Unidad de medida
* `Cantidad`: Cantidad en stock

### 3. 🛍️ Datos de TuAmbia - Vendidos
> Archivo Excel con las columnas:
* `Código`: Código del producto
* `Nombre del producto`: Nombre del producto
* `Categorí`: Categoría del producto
* `Marca`: Marca del producto
* `Cantidad`: Cantidad vendida

### 4. 📦 Datos de TuAmbia - Disponibles
> Archivo Excel con las columnas:
* `Código`: Código del producto
* `Nombre`: Nombre del producto
* `Marca`: Marca del producto
* `Categorí`: Categoría del producto
* `Visible`: Estado de visibilidad
* `Disponibi`: Cantidad disponible

---

## 🎮 Instrucciones de Uso

### 📥 Carga de Plantilla
1. Cargar el archivo Excel de plantilla
2. La plantilla establece la relación entre productos de ambos sistemas
3. Por defecto, se asigna 75% de reserva para TuAmbia

### 📊 Carga de Datos Odoo
1. Importar el archivo de stock de Odoo
2. Verificar los datos en la vista previa antes de confirmar

### 🔄 Carga de Datos TuAmbia
1. Cargar archivo de productos vendidos
2. Cargar archivo de productos disponibles
3. Verificar ambas vistas previas antes de confirmar

### ⚖️ Gestión de Reservas
1. Ajustar los porcentajes de reserva haciendo clic en el número
2. Los cambios se guardan automáticamente
3. El sistema calcula automáticamente los ajustes necesarios

### 📈 Visualización de Resultados
* La tabla principal muestra el estado actual del inventario
* Se pueden ver las cantidades disponibles, vendidas y reservadas
* Los ajustes necesarios se muestran en 🔴 rojo cuando hay sobreventa

---

## ⚠️ Notas Importantes
> ¡Presta especial atención a estos detalles!

* 📝 Todos los archivos Excel deben tener **exactamente** los nombres de columnas especificados
* 🔑 Los códigos de producto deben coincidir entre sistemas para una correcta sincronización
* 🔄 Los porcentajes de reserva se pueden ajustar en cualquier momento
* 💾 El sistema guarda automáticamente la última plantilla utilizada

---

### 💡 Consejos
* Verifica siempre los datos en la vista previa antes de confirmar
* Mantén actualizados los archivos de origen
* Revisa periódicamente los ajustes de reserva

---

*Desarrollado con ❤️ para hacer tu trabajo más fácil*
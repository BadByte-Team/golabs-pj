# NovaCipher Labs — Mini CTF Writeup

Writeup de los 5 retos ocultos en el sitio web de NovaCipher Labs.
Cada flag tiene el formato `CTF{...}`.

---

## Reto 1 — Analisis de Metadatos (Steganography)

**Flag:** `CTF{3x1f_d4t4_h1dd3n_1n_pl41n_s1ght}`

### Descripcion

El sitio tiene una seccion de equipo con la foto de la fundadora. Esa imagen contiene datos EXIF con la flag escondida en el campo `ImageDescription`.

### Resolucion

1. Navegar al sitio y localizar la seccion **Team**.
2. Descargar la imagen de la fundadora. Click derecho sobre la imagen y seleccionar **Guardar imagen como**, o acceder directamente a la ruta:

```
http://<IP>:8080/assets/team_lead.jpg
```

3. Usar `exiftool` para examinar los metadatos:

```bash
exiftool team_lead.jpg
```

4. En la salida, buscar el campo `Image Description`:

```
Image Description : CTF{3x1f_d4t4_h1dd3n_1n_pl41n_s1ght}
```

> [!info] Imagen 1
> Captura de la salida de `exiftool` mostrando el campo Image Description con la flag.

### Herramientas alternativas

- Cualquier visor EXIF online.
- `identify -verbose team_lead.jpg` (ImageMagick).
- En Python: `piexif.load('team_lead.jpg')`.

---

## Reto 2 — Flag Fragmentada (Web)

**Flag:** `CTF{r0b0ts_4nd_c0ns0l3_w0rk_t0g3th3r}`

### Descripcion

La flag esta dividida en dos partes. La primera mitad esta en el archivo `robots.txt` del sitio y la segunda aparece en la consola del navegador como un mensaje de debug que los desarrolladores olvidaron quitar.

### Resolucion

#### Parte 1 — robots.txt

1. Acceder al archivo robots.txt del sitio:

```
http://<IP>:8080/robots.txt
```

2. Revisar el contenido. Entre las directivas normales hay un comentario:

```
# dev-flag-part1: CTF{r0b0ts_4nd_
```

> [!info] Imagen 2
> Captura del navegador mostrando el contenido de robots.txt con la linea del flag resaltada.

#### Parte 2 — Consola del navegador

3. Abrir el sitio principal en el navegador.
4. Abrir las herramientas de desarrollador con `F12` o `Ctrl+Shift+I`.
5. Ir a la pestana **Console**.
6. Localizar el mensaje de debug:

```
flag-part2: c0ns0l3_w0rk_t0g3th3r}
```

> [!info] Imagen 3
> Captura de la consola del navegador (DevTools) mostrando el mensaje `flag-part2:` con la segunda mitad de la flag.

#### Ensamblaje

7. Unir ambas partes:

```
CTF{r0b0ts_4nd_ + c0ns0l3_w0rk_t0g3th3r}
= CTF{r0b0ts_4nd_c0ns0l3_w0rk_t0g3th3r}
```

---

## Reto 3 — Analisis de Trafico (Network Sniffing)

**Flag:** `CTF{sn1ff3d_th3_p4ck3ts_l1k3_4_pr0}`

### Descripcion

En la seccion **Resources** del sitio hay un archivo PCAP descargable presentado como material de un taller de analisis de trafico. El archivo contiene trafico HTTP con la flag dentro de una respuesta JSON.

### Resolucion

1. Navegar a la seccion **Resources** del sitio.
2. Descargar el archivo `sample_capture.pcap` desde el enlace de descarga, o acceder directamente:

```
http://<IP>:8080/assets/sample_capture.pcap
```

3. Abrir el archivo en **Wireshark**.

> [!info] Imagen 4
> Captura de Wireshark mostrando la lista de paquetes del archivo pcap.

4. Buscar paquetes HTTP. Aplicar el filtro:

```
http
```

5. Localizar la respuesta al request `GET /api/health`. Hacer click en el paquete de respuesta.
6. En el panel inferior, expandir la capa HTTP y revisar el body de la respuesta:

```json
{"status":"ok","version":"2.4.1","debug_token":"CTF{sn1ff3d_th3_p4ck3ts_l1k3_4_pr0}","uptime":98432}
```

> [!info] Imagen 5
> Captura de Wireshark mostrando el contenido HTTP de la respuesta JSON con el campo `debug_token` que contiene la flag.

### Metodo alternativo

Usar `strings` directamente sobre el archivo:

```bash
strings sample_capture.pcap | grep "CTF{"
```

O seguir el stream TCP en Wireshark: click derecho sobre el paquete, seleccionar **Follow > TCP Stream**.

---

## Reto 4 — Analisis de Logs (Forensics)

**Flag:** `CTF{l0g_f1l3s_t3ll_s3cr3ts}`

### Descripcion

En la misma seccion de recursos hay un archivo ZIP presentado como logs sanitizados de un caso de respuesta a incidentes. Dentro del ZIP hay varios archivos de log. La flag esta oculta en una linea del archivo `auth.log`.

### Resolucion

1. Descargar el archivo `incident_logs.zip` desde la seccion **Resources**, o directamente:

```
http://<IP>:8080/assets/incident_logs.zip
```

2. Descomprimir el archivo:

```bash
unzip incident_logs.zip
```

3. El contenido es:

```
logs/
  access.log
  auth.log
  system.log
  README.txt
```

4. Buscar la flag en todos los archivos:

```bash
grep -r "CTF{" logs/
```

5. La flag aparece en `auth.log`, dentro de una linea que registra un intento de autenticacion fallido:

```
May 15 11:17:00 nova-srv sshd[4847]: Failed password for user flag_token=CTF{l0g_f1l3s_t3ll_s3cr3ts} from 203.0.113.42 port 22 ssh2
```

> [!info] Imagen 6
> Captura de terminal mostrando la salida de `grep -r "CTF{" logs/` con la linea que contiene la flag en auth.log.

### Metodo alternativo

Revisar manualmente `auth.log` con un editor de texto o con `less`:

```bash
less logs/auth.log
```

Buscar dentro del archivo con `/CTF` para saltar directamente a la linea.

---

## Reto 5 — Decodificacion Base64 (Encoding)

**Flag:** `CTF{b4s364_1s_n0t_3ncrypt10n}`

### Descripcion

En el codigo fuente HTML del sitio hay un comentario que parece un token de API olvidado por los desarrolladores. El valor esta codificado en Base64.

### Resolucion

1. Abrir el sitio principal en el navegador.
2. Ver el codigo fuente de la pagina con `Ctrl+U`.
3. En la seccion `<head>`, localizar el comentario:

```html
<!-- api-token: Q1RGe2I0czM2NF8xc19uMHRfM25jcnlwdDEwbn0= -->
```

> [!info] Imagen 7
> Captura del codigo fuente de la pagina mostrando el comentario HTML con el token en Base64.

4. Copiar el string codificado: `Q1RGe2I0czM2NF8xc19uMHRfM25jcnlwdDEwbn0=`
5. Decodificar con `base64`:

```bash
echo "Q1RGe2I0czM2NF8xc19uMHRfM25jcnlwdDEwbn0=" | base64 -d
```

6. Resultado:

```
CTF{b4s364_1s_n0t_3ncrypt10n}
```

> [!info] Imagen 8
> Captura de terminal mostrando el comando de decodificacion y su salida con la flag.

### Herramientas alternativas

- **CyberChef**: Pegar el string y aplicar la receta "From Base64".
- Python: `import base64; print(base64.b64decode('Q1RGe2I0czM2NF8xc19uMHRfM25jcnlwdDEwbn0=').decode())`
- Cualquier decodificador Base64 online.

---

## Resumen de Flags

| Reto | Categoria | Flag |
|---|---|---|
| 1 — Analisis de Metadatos | Steganography | `CTF{3x1f_d4t4_h1dd3n_1n_pl41n_s1ght}` |
| 2 — Flag Fragmentada | Web | `CTF{r0b0ts_4nd_c0ns0l3_w0rk_t0g3th3r}` |
| 3 — Analisis de Trafico | Network | `CTF{sn1ff3d_th3_p4ck3ts_l1k3_4_pr0}` |
| 4 — Analisis de Logs | Forensics | `CTF{l0g_f1l3s_t3ll_s3cr3ts}` |
| 5 — Decodificacion Base64 | Encoding | `CTF{b4s364_1s_n0t_3ncrypt10n}` |

# Universal Camera Integration

Integração universal de captura de imagem no RC-BioScan IA PRO. Detecta
e suporta câmeras nativas de celular (frontal/traseira), webcams e
microscópios USB (UVC, MAX-VIEW etc.) e dispositivos WiFi (MJPEG sobre
HTTP em rede local).

## O que foi implementado

### Hooks (`src/hooks/`)

| Arquivo | Responsabilidade |
|---|---|
| `useDeviceDetection.ts` | Classifica `MediaDeviceInfo[]` em `usb_microscope`, `mobile_back`, `mobile_front`, `webcam` + injeta sentinel `wifi` e ordena por prioridade de exibição. |
| `useCamera.ts` | Gerencia permissão, enumeração, `MediaStream` ativo, cleanup em unmount, detecção mobile e dica de `facingMode`. |
| `useUpload.ts` | Converte `Blob` → `File('capture.jpg')`, expõe `isUploading` / `progress` / `result` / `error` / `reset`. |

### Componentes (`src/components/camera/`)

| Arquivo | Papel |
|---|---|
| `CameraManager.tsx` | Orquestrador; monta preview + selector + botão; dispara `captureFrame()` → `upload()`. |
| `CameraPreview.tsx` | `<video srcObject>` ou `<img>` (MJPEG); expõe `captureFrame()` via `forwardRef` que retorna `Blob` JPEG q=0.92. |
| `DeviceSelector.tsx` | `<select>` com ícone + label; colapsa pra label estática quando só há um device real. |
| `WifiDeviceInput.tsx` | Input de IP com probe em sequência (`/stream`, `/video`, `/mjpeg`, `/videostream`, `/mjpg/video.mjpg`), timeout 3s por path, último IP em `localStorage`. |
| `CaptureButton.tsx` | Animação de pressionar + flash; estados `Capturar` → `Enviando...` → `✓ Enviado`. |

### API cliente

- `src/api/upload.ts` — `uploadImage(file, metadata, onProgress?)` via `XMLHttpRequest` (fetch não expõe progress de upload no browser).

### Vercel Serverless Functions (`api/`)

| Arquivo | Função |
|---|---|
| `upload.js` | `POST /api/upload` — mock; drena multipart e retorna `{ success, imageUrl, id }`. **TODO: storage real.** |
| `proxy-stream.js` | `GET /api/proxy-stream?url=...` — proxy SSRF-safe (apenas IPv4 RFC1918), preserva `Content-Type`, pipe do upstream MJPEG. |

### Integração no app

- `src/pages/CameraPage.tsx` — página standalone "Captura de Imagem".
- `App.tsx` — pseudo-rota baseada em hash (`#/camera`) + link "📷 Câmera" no Header. Sem dependência de router.

## Dispositivos suportados

| Contexto       | Câmera frontal | Câmera traseira | Webcam USB | Microscópio USB | Dispositivo WiFi (MJPEG) |
|----------------|:-:|:-:|:-:|:-:|:-:|
| **Celular**    | ✅ Nativo | ✅ Nativo (`facingMode: environment`) | ⚠️ Só com OTG/UVC | ⚠️ Só com OTG/UVC | ✅ Via proxy HTTPS |
| **Desktop**    | — | — | ✅ USB | ✅ USB (UVC / MAX-VIEW) | ✅ Via proxy HTTPS |

Legenda:
- ✅ — suporte direto
- ⚠️ — depende de suporte do SO/navegador
- — — não aplicável

## Como usar cada modo

### Câmera nativa (celular)

1. Abra a página `/#/camera` em um celular (HTTPS em produção, HTTP em `localhost`).
2. Autorize o acesso à câmera quando o navegador pedir.
3. O seletor vai mostrar automaticamente "Câmera Traseira" e "Câmera Frontal"; escolha uma.
4. Enquadre e toque em **Capturar**. A imagem é enviada e uma thumbnail de confirmação aparece.

### USB (webcam ou microscópio)

1. Conecte o dispositivo antes de abrir a página (ou clique em "Tentar novamente" após conectar).
2. Autorize o acesso à câmera.
3. Selecione o dispositivo desejado no dropdown — microscópios com nomes reconhecidos (`microscop`, `max-view`, `uvc`, `usb video`) aparecem no topo com badge **USB**.
4. Clique em **Capturar**.

### WiFi (MJPEG sobre HTTP)

1. Certifique-se de que o celular/desktop está na **mesma rede Wi-Fi** do dispositivo.
2. Selecione a opção **📡 Dispositivo WiFi (IP)** no dropdown.
3. Digite o IP (ex: `192.168.1.100`) e clique em **Conectar**.
   - O último IP usado é lembrado via `localStorage`.
   - O componente testa em sequência `/stream`, `/video`, `/mjpeg`, `/videostream`, `/mjpg/video.mjpg` com timeout de 3s cada.
4. Após conectado, o preview MJPEG aparece. Clique em **Capturar**.

---

## ⚠️ Nota: Mixed Content e o proxy

Em produção o site roda sobre **HTTPS** (Vercel), mas dispositivos WiFi
normalmente só falam **HTTP** em rede local. O browser bloqueia esse tipo
de requisição como *Mixed Content*.

A solução é a Serverless Function `api/proxy-stream.js`, que:

- Aceita `GET /api/proxy-stream?url=http://192.168.x.x/stream`
- **Valida** que o host é um IPv4 RFC1918 literal (`10/8`, `172.16/12`, `192.168/16`) — rejeita hostnames (DNS rebinding), IPv6, encodings alternativos de IP e IPs públicos com **403**.
- Aplica timeout de conexão de 10s (limpo ao receber headers, pra não abortar stream MJPEG longo).
- Preserva o `Content-Type` original (crítico — carrega o `boundary=...` do multipart MJPEG).
- Faz pipe do `ReadableStream` upstream → Node response, abortando upstream quando o cliente desconecta.

Em dev (`http://localhost`) o `WifiDeviceInput` conecta **direto** no IP sem passar pelo proxy; em HTTPS ele injeta o prefixo `/api/proxy-stream?url=` automaticamente.

**Limitação do Vercel:** Hobby tem cap de 10s por invocação; Pro tem 60s. Streams MJPEG vão ser cortados nesse limite. Para streams contínuos longos, considere Edge Functions ou snapshot polling no cliente.

## ⚠️ Nota: permissões de câmera

- O browser só preenche os **labels** dos dispositivos após o usuário conceder permissão. Por isso o `useCamera.requestPermission()` abre um stream temporário só pra "aquecer" a permissão, descarta os tracks, e então enumera novamente.
- Em iOS Safari: `<video>` precisa de `playsInline` + `muted` para auto-play (ambos já definidos em `CameraPreview`).
- Permissão negada é tratada com mensagem PT-BR e botão **Tentar novamente** no `CameraManager`.
- Em Android Chrome, a página **precisa** ser HTTPS (exceto `localhost`) pra `getUserMedia()` funcionar.

## TODO — próximos passos

- [ ] **Storage real no `/api/upload`** — atualmente a resposta é mockada (`/mock/captured.jpg` + UUID). Plugar em:
  - Vercel Blob, ou
  - Supabase Storage, ou
  - S3/R2/GCS, ou
  - Cloudinary (com transformações automáticas).
- [ ] **Parsing multipart real** — usar `formidable` ou `busboy` no `api/upload.js` para validar tamanho/tipo do arquivo antes de salvar.
- [ ] **Router real** — quando a app evoluir, substituir o hash-gate em `App.tsx` por `react-router` e transformar `CameraPage` numa rota formal.
- [ ] **Integração com o fluxo de anamnese** — substituir/complementar o upload estático da etapa `IMAGES` (`AppStep.IMAGES`) com captura ao vivo do `CameraManager`.
- [ ] **Snapshot MJPEG** — considerar baixar um JPEG pontual (`/snapshot.jpg`) em vez de stream contínuo, pra fugir do cap de execução do Vercel em planos gratuitos.
- [ ] **Autenticação** — o `/api/upload` está aberto; adicionar verificação de sessão/token antes de subir pra storage real.

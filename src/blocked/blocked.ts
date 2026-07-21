interface BlockedCopy {
  title: string;
  message: string;
  detail: string;
}

const COPY_BY_REASON: Record<string, BlockedCopy> = {
  shorts: {
    title: "Shorts bloqueado!",
    message: "O YouTube Shorts está desabilitado pela nossa extensão.",
    detail: "Volte para uma página de vídeo normal ou feche a aba.",
  },
};

const FALLBACK: BlockedCopy = {
  title: "Bloqueado",
  message: "Este acesso foi interrompido pela more-friction.",
  detail: "",
};

const reason = new URLSearchParams(location.search).get("reason") ?? "";
const copy = COPY_BY_REASON[reason] ?? FALLBACK;

const title = document.getElementById("title");
const message = document.getElementById("message");

if (title) title.textContent = copy.title;
if (message) message.textContent = `${copy.message} ${copy.detail}`;
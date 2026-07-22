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

const params = new URLSearchParams(location.search);
const reason = params.get("reason") ?? "";

// The schedule block is dynamic: its detail names when the site reopens.
function scheduleCopy(): BlockedCopy {
  const rawOpensAt = params.get("opensAt");
  const opensAt = rawOpensAt !== null ? Number(rawOpensAt) : Number.NaN;
  if (!Number.isFinite(opensAt)) {
    return {
      title: "Fora de horário",
      message: "Este site está fora do horário de uso permitido.",
      detail: "",
    };
  }
  const opening = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(opensAt));
  return {
    title: "Fora de horário",
    message: "Este site está fora do horário de uso permitido.",
    detail: `Liberado novamente em ${opening}.`,
  };
}

const copy = reason === "schedule" ? scheduleCopy() : (COPY_BY_REASON[reason] ?? FALLBACK);

const title = document.getElementById("title");
const message = document.getElementById("message");

if (title) title.textContent = copy.title;
if (message) message.textContent = `${copy.message} ${copy.detail}`;
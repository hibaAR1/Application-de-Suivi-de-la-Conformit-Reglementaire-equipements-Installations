import { useState, useRef, useEffect } from "react";
import { IconBot, IconSend, IconChat } from "../../components/icons";
import {
  THEMATIQUES,
  reponseAssistant,
  reponseHorsPerimetre,
} from "../../data/assistantData";
import { apiFetch } from "../../utils/api";
// §3.3 du CDC : interface de question-réponse contextualisée, base restreinte
// aux textes réglementaires listés en section 1, journalisation des questions.
// ⚠️ Réponses simulées ici (voir data/assistantData.js) — le vrai backend doit
// répondre uniquement à partir des textes autorisés et journaliser chaque échange
// dans la table QuestionAssistant.
//
// Widget flottant (bas gauche), présent sur toutes les pages connectées via AppLayout,
// plutôt qu'une page dédiée — inspiré des widgets de chat type Novade "Noa".

export default function AssistantWidget() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "assistant",
      text: "Bonjour, je suis l'assistant réglementaire. Choisissez une thématique, ou posez votre question.",
    },
  ]);
  const [saisie, setSaisie] = useState("");
  const [enAttente, setEnAttente] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (ouvert)
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
  }, [messages, ouvert, enAttente]);

  async function poserQuestion(texte, thematiqueId) {
    if (!texte.trim() || enAttente) return;
    setMessages((prev) => [...prev, { from: "user", text: texte }]);
    setSaisie("");
    setEnAttente(true);
    try {
      const { reponse } = await apiFetch("/assistant", {
        method: "POST",
        body: JSON.stringify({ question: texte, thematique: thematiqueId }),
      });
      setMessages((prev) => [...prev, { from: "assistant", text: reponse }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { from: "assistant", text: "Erreur de connexion à l'assistant." },
      ]);
    } finally {
      setEnAttente(false);
    }
  }
  function handleSubmit(e) {
    e.preventDefault();
    poserQuestion(saisie, null);
  }

  return (
    <>
      {ouvert && (
        <div
          className="assistant-panel"
          role="dialog"
          aria-label="Assistant réglementaire"
        >
          <div className="assistant-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="assistant-avatar">
                <IconBot />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                  Assistant réglementaire
                </div>
                <div style={{ fontSize: 11, color: "rgba(239,233,223,0.6)" }}>
                  Réponses basées sur les textes réglementaires officiels
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              aria-label="Fermer l'assistant"
              className="assistant-close"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="assistant-messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`assistant-bubble ${m.from === "user" ? "assistant-bubble-user" : "assistant-bubble-bot"}`}
              >
                {m.text}
              </div>
            ))}
            {enAttente && (
              <div
                className="assistant-bubble assistant-bubble-bot"
                aria-live="polite"
              >
                <span className="assistant-typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
          </div>

          <div className="assistant-quickreplies">
            {THEMATIQUES.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={enAttente}
                onClick={() =>
                  poserQuestion(
                    `Que dit la réglementation sur : ${t.label} ?`,
                    t.id,
                  )
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="assistant-inputbar">
            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Écrivez votre question…"
              aria-label="Votre question"
              disabled={enAttente}
            />
            <button type="submit" aria-label="Envoyer" disabled={enAttente}>
              <IconSend />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="assistant-fab"
        onClick={() => setOuvert((v) => !v)}
        aria-label={
          ouvert
            ? "Fermer l'assistant réglementaire"
            : "Ouvrir l'assistant réglementaire"
        }
        aria-expanded={ouvert}
      >
        <IconChat />
      </button>
    </>
  );
}

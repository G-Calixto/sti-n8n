import { useState } from 'react';
import { Aviso, Origem } from './ui';

export default function FeedbackReview({
  feedbackAluno,
  feedbackGeneration,
  aprovado,
  isSubmitting,
  onChange,
  onAprovar,
  onPedirNovaVersao,
  onReiniciar
}) {
  const [pedindoNovaVersao, setPedindoNovaVersao] = useState(false);
  const [instrucao, setInstrucao] = useState('');
  const versao = feedbackGeneration || 1;

  function solicitarNovaVersao() {
    onPedirNovaVersao(instrucao);
    setPedindoNovaVersao(false);
    setInstrucao('');
  }

  if (aprovado) {
    return (
      <>
        <Aviso
          tipo="acerto"
          titulo="Feedback aprovado"
          texto="O texto aprovado por você foi registrado para esta submissão."
        />
        <div className="cartao">
          <div className="origem-linha">
            <Origem tipo="professor">Decisão do professor</Origem>
            <span className="nota">Versão {versao}, aprovada</span>
          </div>
          <div className="texto-registrado">{feedbackAluno}</div>
          <span className="nota">Somente leitura. Este é o texto registrado.</span>
        </div>
        <div className="acoes">
          <button type="button" className="btn btn--contorno" onClick={onReiniciar}>
            Corrigir outra questão
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <h2 className="h2">Revise o feedback antes de aprovar</h2>
        <p className="apoio" style={{ marginTop: '6px' }}>
          Você pode editar diretamente no campo abaixo.
        </p>
      </div>

      <div className="cartao">
        <div className="origem-linha">
          <Origem tipo="ia">Redigido pela IA</Origem>
          <span className="nota">Versão {versao}</span>
        </div>
        <textarea
          className="area area--feedback"
          rows={9}
          value={feedbackAluno}
          disabled={isSubmitting}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>

      {pedindoNovaVersao ? (
        <div className="cartao">
          <Origem tipo="professor">Decisão do professor</Origem>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="instrucao_regeneracao">
              O que ajustar no texto
            </label>
            <textarea
              id="instrucao_regeneracao"
              className="area entrada--editada"
              rows={3}
              maxLength={500}
              value={instrucao}
              onChange={(event) => setInstrucao(event.target.value)}
            />
            <span className="nota">
              Diga o que ajustar. Por exemplo: mais curto, com uma pergunta que oriente o próximo passo.
            </span>
          </div>
          <div className="acoes">
            <button
              type="button"
              className="btn btn--primario"
              onClick={solicitarNovaVersao}
              disabled={isSubmitting}
            >
              Gerar nova versão
            </button>
            <button
              type="button"
              className="btn btn--texto"
              onClick={() => setPedindoNovaVersao(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="cartao">
          <Origem tipo="professor">Decisão do professor</Origem>
          <div className="acoes">
            <button
              type="button"
              className="btn btn--primario"
              onClick={() => onAprovar(feedbackAluno)}
              disabled={isSubmitting || !String(feedbackAluno || '').trim()}
            >
              {isSubmitting ? 'Registrando...' : 'Aprovar feedback'}
            </button>
            <button
              type="button"
              className="btn btn--contorno"
              onClick={() => setPedindoNovaVersao(true)}
              disabled={isSubmitting}
            >
              Pedir nova versão
            </button>
          </div>
          <span className="nota">
            O que fica registrado é o texto que você aprovar, com ou sem suas edições.
          </span>
        </div>
      )}
    </>
  );
}

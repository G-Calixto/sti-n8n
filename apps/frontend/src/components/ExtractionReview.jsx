import { useEffect, useRef, useState } from 'react';
import { Aviso, Confianca, FotoFolha, Origem, Selo } from './ui';

export default function ExtractionReview({
  extracao,
  avaliacao,
  correctAnswer,
  imagemUrl,
  isSaving,
  onFieldChange,
  onConfirm,
  onContinuar
}) {
  // Guarda o ultimo resultado apurado para mostrar o estado "resultado
  // descartado" quando o professor edita a leitura depois da apuracao.
  const ultimaAvaliacao = useRef(null);
  const [descartado, setDescartado] = useState(false);

  useEffect(() => {
    if (avaliacao) {
      ultimaAvaliacao.current = avaliacao;
      setDescartado(false);
    } else if (ultimaAvaliacao.current) {
      setDescartado(true);
    }
  }, [avaliacao]);

  const confianca = Number(extracao?.confianca_extracao || 0);
  const leituraConfiavel = confianca >= 0.7;
  const respostaVazia = !String(extracao?.resposta_aluno || '').trim();
  const resultado = avaliacao || (descartado ? ultimaAvaliacao.current : null);

  return (
    <div className="grade-revisao">
      <div className="coluna">
        <div className="cartao">
          <Origem tipo="professor">Informado pelo professor</Origem>
          <FotoFolha
            src={imagemUrl}
            altura="420px"
            nota="enunciado e resposta na mesma imagem"
          />
        </div>

        <Aviso
          tipo={leituraConfiavel ? 'acerto' : 'atencao'}
          titulo={leituraConfiavel ? 'Leitura com alta confiança' : 'Leitura com baixa confiança'}
          texto={
            leituraConfiavel
              ? 'O sistema leu esta folha com clareza. Ainda assim, confira cada campo antes de confirmar.'
              : 'Confira cada campo com atenção antes de confirmar.'
          }
        />

        <Confianca valor={confianca} />

        {extracao?.observacoes && (
          <p className="nota" style={{ margin: 0 }}>
            Observações da leitura: {extracao.observacoes}
          </p>
        )}
      </div>

      <div className="coluna coluna--larga">
        <div>
          <h2 className="h2">Confira o que o sistema leu</h2>
          <p className="apoio" style={{ marginTop: '6px', maxWidth: '620px' }}>
            {avaliacao
              ? 'Leitura confirmada por você. Qualquer nova edição descarta o resultado apurado.'
              : 'Corrija qualquer campo que não corresponda ao que está na folha. O resultado da questão só é apurado depois da sua confirmação.'}
          </p>
        </div>

        <div className="cartao">
          <Origem tipo="ia">Lido pela IA</Origem>

          <div className="campo">
            <label className="campo__rotulo" htmlFor="enunciado">
              Enunciado
            </label>
            <textarea
              id="enunciado"
              className="area"
              rows={3}
              value={extracao?.enunciado || ''}
              onChange={(event) => onFieldChange('enunciado', event.target.value)}
            />
          </div>

          <div className="campo">
            <label className="campo__rotulo" htmlFor="desenvolvimento_aluno">
              Desenvolvimento do aluno
            </label>
            <textarea
              id="desenvolvimento_aluno"
              className="area"
              rows={3}
              value={extracao?.desenvolvimento_aluno || ''}
              onChange={(event) => onFieldChange('desenvolvimento_aluno', event.target.value)}
            />
          </div>

          <div className="campo campo--curto">
            <label className="campo__rotulo" htmlFor="resposta_aluno">
              Resposta final do aluno
            </label>
            <input
              id="resposta_aluno"
              type="text"
              className={`entrada ${respostaVazia ? 'entrada--erro' : ''}`}
              value={extracao?.resposta_aluno || ''}
              onChange={(event) => onFieldChange('resposta_aluno', event.target.value)}
            />
            {respostaVazia && (
              <span className="nota nota--erro">A resposta do aluno não pode ficar vazia.</span>
            )}
          </div>
        </div>

        {descartado && (
          <Aviso
            tipo="atencao"
            titulo="O resultado foi descartado porque a leitura mudou"
            texto="Confirme novamente para apurar."
          />
        )}

        {resultado && (
          <div className={`cartao ${descartado ? 'cartao--descartado' : ''}`}>
            <Origem tipo="sistema">Apurado pelo sistema</Origem>
            <div className={`linha-entre ${descartado ? 'riscado' : ''}`} style={{ justifyContent: 'flex-start', gap: '20px' }}>
              <Selo status={resultado.status} />
              <div className="comparacao">
                <span>esperado: {correctAnswer || '-'}</span>
                <span>aluno: {extracao?.resposta_aluno || '-'}</span>
              </div>
            </div>
            <p className="nota" style={{ margin: 0, maxWidth: '620px' }}>
              Comparação entre a resposta que você informou e a resposta lida na folha.
            </p>
          </div>
        )}

        <div className="acoes">
          {avaliacao ? (
            <button type="button" className="btn btn--primario" onClick={onContinuar}>
              Continuar para o contexto
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primario"
              onClick={onConfirm}
              disabled={isSaving || respostaVazia}
            >
              {isSaving ? 'Apurando resultado...' : 'Confirmar leitura e apurar resultado'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

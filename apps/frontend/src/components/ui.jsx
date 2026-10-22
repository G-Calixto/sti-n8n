// Componentes do sistema visual SGFE (handoff do Claude Design).
// Cada bloco de conteudo carrega um marcador de origem: quem produziu aquilo.

const NOMES_ETAPAS = ['Envio', 'Revisão da leitura', 'Contexto pedagógico', 'Aprovação'];

export function Topo({ identificador }) {
  return (
    <header className="topo">
      <div className="topo__esq">
        <span className="topo__marca">SGFE</span>
        <span className="topo__divisor" />
        <span className="topo__sub">
          Sistema de Geração de Feedback Educacional para Sistemas Tutores Inteligentes Desplugados
        </span>
      </div>
      {identificador && (
        <div className="topo__dir">
          <span className="topo__rotulo">Submissão</span>
          <span className="topo__id">{identificador}</span>
        </div>
      )}
    </header>
  );
}

export function Etapas({ atual }) {
  const n = Math.min(4, Math.max(1, Number(atual) || 1));

  return (
    <>
      <nav className="etapas" aria-label="Etapas da correção">
        <div className="etapas__linha">
          {NOMES_ETAPAS.map((nome, i) => {
            const k = i + 1;
            const concluida = k < n;
            const ativa = k === n;
            const classe = ['etapa', concluida && 'etapa--concluida', ativa && 'etapa--ativa']
              .filter(Boolean)
              .join(' ');

            return (
              <div key={nome} className={classe} aria-current={ativa ? 'step' : undefined}>
                {i > 0 && <span className="etapa__fio" />}
                <span className="etapa__bola">{concluida ? '✓' : k}</span>
                <span className="etapa__nome">{nome}</span>
              </div>
            );
          })}
        </div>
      </nav>

      <nav className="etapas etapas--compacto" aria-label="Etapas da correção">
        <div className="etapas__titulo">
          <strong>{NOMES_ETAPAS[n - 1]}</strong>
          <span>Etapa {n} de 4</span>
        </div>
        <div className="barra-etapas">
          <div className="barra-etapas__preenchida" style={{ width: `${(n / 4) * 100}%` }} />
        </div>
      </nav>
    </>
  );
}

const GLIFOS = { neutro: 'i', acerto: '✓', atencao: '!', falha: '!' };

export function Aviso({ tipo = 'neutro', titulo, texto, acao, onAcao }) {
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === 'falha' ? 'alert' : 'status'}>
      <span className="aviso__glifo" aria-hidden="true">
        {GLIFOS[tipo] || 'i'}
      </span>
      <div className="aviso__corpo">
        <div className="aviso__titulo">{titulo}</div>
        {texto && <div className="aviso__texto">{texto}</div>}
      </div>
      {acao && (
        <button type="button" className="btn btn--texto" onClick={onAcao}>
          {acao}
        </button>
      )}
    </div>
  );
}

// ia | professor | sistema
export function Origem({ tipo, children }) {
  return <span className={`origem origem--${tipo}`}>{children}</span>;
}

export function Selo({ status }) {
  const correta = status === 'correta';
  return (
    <span className={`selo selo--${correta ? 'correta' : 'incorreta'}`}>
      {correta ? 'Resposta correta' : 'Resposta incorreta'}
    </span>
  );
}

export function Carregando({ origem, titulo, texto }) {
  return (
    <div className="carregando" aria-live="polite">
      {origem && <Origem tipo="ia">{origem}</Origem>}
      <div className="barra-indet" aria-hidden="true">
        <div className="barra-indet__pulso" />
      </div>
      <div className="h3">{titulo}</div>
      {texto && <div className="apoio">{texto}</div>}
    </div>
  );
}

export function FotoFolha({ src, altura = '320px', rotulo = 'foto da folha do aluno', nota }) {
  if (src) {
    return <img className="foto__imagem" src={src} alt="Foto da folha enviada pelo professor" />;
  }

  return (
    <div className="foto" style={{ height: altura }}>
      <span className="foto__rotulo">{rotulo}</span>
      {nota && <span className="foto__nota">{nota}</span>}
    </div>
  );
}

export function Confianca({ valor }) {
  const n = Number(valor || 0);
  const classe = n >= 0.7 ? 'mono mono--ok' : 'mono mono--atencao';
  return (
    <div className="mono">
      confiança da leitura: <span className={classe}>{n.toFixed(2)}</span>
    </div>
  );
}

export function EscolhaUnica({ titulo, nome, valor, onChange, opcoes, direcao = 'row' }) {
  return (
    <fieldset className="pergunta">
      <legend className="pergunta__titulo">
        {titulo} <span className="obrigatorio">*</span>
      </legend>
      <div className={`opcoes ${direcao === 'column' ? 'opcoes--coluna' : ''}`}>
        {opcoes.map((opcao) => {
          const marcada = valor === opcao.value;
          const classe = [
            'opcao',
            direcao === 'row' && 'opcao--linha',
            marcada && 'opcao--marcada'
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <label key={opcao.value} className={classe}>
              <input
                type="radio"
                name={nome}
                value={opcao.value}
                checked={marcada}
                onChange={() => onChange(opcao.value)}
              />
              <span className="opcao__marca" aria-hidden="true">
                {marcada ? '●' : ''}
              </span>
              <span>{opcao.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function EscolhaMultipla({ titulo, valores, onToggle, opcoes, direcao = 'column' }) {
  return (
    <fieldset className="pergunta">
      <legend className="pergunta__titulo">
        {titulo} <span className="obrigatorio">*</span>
      </legend>
      <div className={`opcoes ${direcao === 'column' ? 'opcoes--coluna' : ''}`}>
        {opcoes.map((opcao) => {
          const marcada = valores.includes(opcao.value);
          const classe = [
            'opcao',
            'opcao--multipla',
            direcao === 'row' && 'opcao--linha',
            marcada && 'opcao--marcada'
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <label key={opcao.value} className={classe}>
              <input type="checkbox" checked={marcada} onChange={() => onToggle(opcao.value)} />
              <span className="opcao__marca" aria-hidden="true">
                {marcada ? '✓' : ''}
              </span>
              <span>{opcao.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SecaoQuestionario({ titulo, children }) {
  return (
    <section className="secao-q">
      <h3 className="h3">{titulo}</h3>
      <hr className="regua" />
      <div className="secao-q__perguntas">{children}</div>
    </section>
  );
}

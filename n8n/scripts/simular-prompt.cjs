// Imprime o prompt que o node "Preparar dados" do workflow Feedback monta,
// sem precisar de n8n, rede ou deploy. Serve para conferir o texto exato
// depois de qualquer mudanca no prompt.
//
//   node n8n/scripts/simular-prompt.cjs            # caso incorreto
//   node n8n/scripts/simular-prompt.cjs correta    # caso correto
//   node n8n/scripts/simular-prompt.cjs correta --regerar

const fs = require('fs');
const path = require('path');

const WORKFLOW = path.join(__dirname, '..', 'workflows', 'Feedback.json');
const NODE = 'Preparar dados';

const caso = process.argv.includes('correta') ? 'correta' : 'incorreta';
const regerar = process.argv.includes('--regerar');

const workflow = JSON.parse(fs.readFileSync(WORKFLOW, 'utf8'));
const node = workflow.nodes.find((n) => n.name === NODE);
if (!node) {
  console.error(`Node "${NODE}" nao encontrado em ${WORKFLOW}`);
  process.exit(1);
}

// Caso de exemplo: 195 + 320, resposta esperada 515, aluno respondeu 335.
const payload = {
  submission_id: 'sub_teste_0001',
  correct_answer: '515',
  feedback_generation: regerar ? 2 : 1,
  extracao: {
    enunciado:
      'Um vendedor vendeu 195 camisetas na loja A e 320 na loja B. Quantas camisetas ele vendeu no total?',
    desenvolvimento_aluno: caso === 'correta' ? '195 + 320 = 515' : '195 + 320 = 335',
    resposta_aluno: caso === 'correta' ? '515' : '335',
    legibilidade: 'boa',
    confianca_extracao: 0.62,
    observacoes: ''
  },
  avaliacao: {
    status: caso,
    resposta_correta: caso === 'correta'
  },
  intencao_professor: 'Ele ficou desanimado depois da ultima prova.',
  regeneracao: regerar
    ? { solicitada: true, instrucao: 'Mais curto, com uma pergunta que oriente o proximo passo.' }
    : { solicitada: false, instrucao: '' },
  questionario: {
    tipo: caso,
    contexto_pedagogico: {
      momento_conteudo: 'duas_a_quatro_semanas',   // CP1 B
      profundidade_conteudo: 'bem_trabalhado',     // CP2 B
      estrategia_usada: 'resolucao_em_grupo'       // CP3 B
    },
    perfil_emocional: {
      reacao_ao_erro: 'frustracao',                // PEE1 A
      relacao_com_matematica: 'ansiedade_bloqueio',// PEE2 E
      receptividade_feedback: 'depende_da_abordagem' // PEE3 B
    },
    caso_correto: caso === 'correta' ? { acerto_esperado: 'sim_com_dificuldade_usual' } : null,
    caso_incorreto:
      caso === 'incorreta'
        ? { desempenho_geral: 'na_media', frequencia_erro: 'as_vezes', natureza_erro: 'calculo_execucao' }
        : null
  }
};

const $input = { first: () => ({ json: payload }) };
const saida = new Function('$input', node.parameters.jsCode)($input)[0].json;

console.log(`caso: ${caso}${regerar ? ' (regeracao)' : ''}`);
console.log(`tipo_prompt: ${saida.tipo_prompt} | versao: ${saida.versao_prompt} | entrada_valida: ${saida.entrada_valida}`);
if (saida.respostas_faltando) console.log(`respostas sem correspondencia: ${saida.respostas_faltando}`);
console.log('='.repeat(72));
console.log(saida.prompt_feedback);
console.log('='.repeat(72));

const sobrou = saida.prompt_feedback.match(/\{\{[^}]+\}\}|nao informado|não informado/g);
if (sobrou) {
  console.log('\nATENCAO: campos sem valor no prompt ->', [...new Set(sobrou)].join(', '));
} else {
  console.log('\nOk: nenhum placeholder ou campo "nao informado" sobrou.');
}
